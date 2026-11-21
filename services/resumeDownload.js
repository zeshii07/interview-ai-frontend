import { Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as NewFileSystem from 'expo-file-system';

import { buildResumePdfBytes } from './localResumePdf';
import { buildResumeDocBytes, buildResumeDocFilename } from './localResumeDocx';
import { bytesToBase64 } from '../utils/bytes';
import {
  loadExportDirectory,
  saveExportDirectory,
  clearExportDirectory,
} from '../utils/storage';

/**
 * Resume download / save pipeline.
 *
 * Design notes (this file replaced a fragile version):
 *
 * 1. WRITING — the primary write path is the legacy expo-file-system API
 *    (`expo-file-system/legacy`: writeAsStringAsync + base64), which has
 *    been rock-solid on Android/iOS for years. The new File/Directory API
 *    (`new File(...).write(uint8)`) is kept only as a fallback: it has
 *    known native crash reports on some SDK versions, and it was the most
 *    likely cause of "app restarts when tapping PDF".
 *    IMPORTANT: `writeAsStringAsync` imported from 'expo-file-system' (the
 *    main entry) THROWS in SDK 54+ — it must come from the /legacy subpath.
 *
 * 2. SAVING (Android) — the user picks a folder ONCE (the picker opens
 *    pre-selected on the system Download folder). Expo's SAF request takes
 *    a PERSISTABLE grant, so the folder URI is remembered in AsyncStorage
 *    and every later download writes there DIRECTLY — no folder picker, no
 *    "create a new folder" step again. If the grant is ever revoked
 *    (folder deleted / app data cleared), we silently forget it and ask
 *    once more.
 *
 * 3. SAVING (iOS) — the share sheet opens directly (it contains
 *    "Save to Files").
 *
 * 4. MIME TYPES — .pdf gets application/pdf; the Word document gets
 *    application/msword (it is a Word-HTML .doc). A wrong MIME type makes
 *    Android share targets silently reject the file — that was the "pressed
 *    save and share, nothing was saved" bug.
 */

function safeFilenamePart(value, fallback) {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');

  return cleaned || fallback;
}

function legacyFsAvailable() {
  return (
    LegacyFileSystem &&
    typeof LegacyFileSystem.writeAsStringAsync === 'function' &&
    typeof LegacyFileSystem.cacheDirectory === 'string' &&
    LegacyFileSystem.cacheDirectory
  );
}

function newFsAvailable() {
  return Boolean(NewFileSystem && NewFileSystem.File && NewFileSystem.Paths);
}

/**
 * Write bytes to a cache file and return its file:// URI.
 * Legacy API first (base64 string write), new File API as fallback.
 */
async function writeCacheFile(bytes, filename) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);

  if (legacyFsAvailable()) {
    const uri = `${LegacyFileSystem.cacheDirectory}${filename}`;
    await LegacyFileSystem.writeAsStringAsync(uri, bytesToBase64(data), {
      encoding: LegacyFileSystem.EncodingType.Base64,
    });
    return uri;
  }

  if (newFsAvailable()) {
    const file = new NewFileSystem.File(NewFileSystem.Paths.cache, filename);
    if (file.exists) file.delete();
    file.create();
    file.write(data);
    return file.uri;
  }

  throw new Error('No file system API available on this device.');
}

/** Write base64 bytes into `dirUri` via SAF. */
async function writeToFileInDir(base64, dirUri, filename, mimeType) {
  const fileUri = await LegacyFileSystem.StorageAccessFramework.createFileAsync(
    dirUri,
    filename,
    mimeType
  );
  await LegacyFileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: LegacyFileSystem.EncodingType.Base64,
  });
  return fileUri;
}

/**
 * Open the system folder picker ONCE, pre-selected on the Download folder,
 * remember the grant, and return the directory URI (or null if cancelled).
 */
async function pickExportFolderOnce() {
  let initialUri = null;
  try {
    initialUri =
      LegacyFileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
  } catch {
    initialUri = null;
  }

  const permissions =
    await LegacyFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
      initialUri
    );
  if (!permissions?.granted) {
    return null;
  }

  await saveExportDirectory(permissions.directoryUri);
  return permissions.directoryUri;
}

/**
 * Save into the remembered folder without any picker. Returns the saved
 * file URI, or null if there is no remembered folder / it was revoked.
 */
async function saveToRememberedFolder(base64, filename, mimeType) {
  const rememberedDir = await loadExportDirectory();
  if (!rememberedDir) return null;

  try {
    return await writeToFileInDir(base64, rememberedDir, filename, mimeType);
  } catch (error) {
    // The saved grant no longer works (folder deleted, app data cleared,
    // Android revoked it) — forget it and let the caller re-prompt once.
    await clearExportDirectory();
    console.warn('[resumeDownload] Remembered export folder failed:', error?.message);
    return null;
  }
}

async function openShareSheet(fileUri, mimeType, uti, dialogTitle) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert(
      'Sharing unavailable',
      `The file was created at:\n${fileUri}\n\nShare it manually from your device files.`
    );
    return { shared: false, uri: fileUri };
  }

  await Sharing.shareAsync(fileUri, {
    mimeType,
    dialogTitle: dialogTitle || 'Save or share your Hirely resume',
    UTI: uti,
  });
  return { shared: true, uri: fileUri };
}

/** Post-save confirmation with an inline "share a copy" option. */
function confirmSavedAlert(savedUri) {
  return new Promise((resolve) => {
    Alert.alert(
      'Saved',
      'Your resume has been saved to your Downloads folder (or the folder you picked). Open your Files app to find it.',
      [
        {
          text: 'Share a copy',
          onPress: () => resolve({ savedToDisk: true, shareRequested: true, uri: savedUri }),
        },
        {
          text: 'OK',
          onPress: () => resolve({ savedToDisk: true, shared: false, uri: savedUri }),
        },
      ]
    );
  });
}

/**
 * Present the save UI.
 *
 * Android, returning users (folder already granted): the file is written
 *   directly — no folder picker, no "create folder" step — followed by a
 *   Saved confirmation with an optional "Share a copy".
 * Android, first time: one dialog — "Save to Downloads" (opens the folder
 *   picker once, pre-selected on Download) or "Share a copy".
 * iOS: the share sheet directly (it contains "Save to Files").
 */
async function presentSaveOptions(bytes, { filename, mimeType, uti, dialogTitle }) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  const base64 = bytesToBase64(data);
  const cacheUri = await writeCacheFile(data, filename);

  if (Platform.OS === 'android') {
    // 1) Remembered folder → save directly (the common case after the
    //    first download; no picker shown at all).
    const savedUri = await saveToRememberedFolder(base64, filename, mimeType);
    if (savedUri) {
      const result = await confirmSavedAlert(savedUri);
      if (result.shareRequested) {
        try {
          await openShareSheet(cacheUri, mimeType, uti, dialogTitle);
        } catch (error) {
          console.warn('[resumeDownload] Share after save failed:', error?.message);
        }
      }
      return { ...result, shared: result.shareRequested };
    }

    // 2) First time (or the remembered grant was revoked) — one-time choice.
    return new Promise((resolve) => {
      Alert.alert(
        dialogTitle || 'Save your resume',
        'Choose "Save to Downloads" to keep it on your device. You only pick the folder once — after that, every download saves there automatically.',
        [
          {
            text: 'Save to Downloads',
            onPress: async () => {
              try {
                const dir = await pickExportFolderOnce();
                if (!dir) {
                  // Picker dismissed — fall back to the share sheet so the
                  // file is never left in limbo.
                  const result = await openShareSheet(
                    cacheUri,
                    mimeType,
                    uti,
                    dialogTitle
                  );
                  resolve({ savedToDisk: false, ...result });
                  return;
                }
                const savedUri = await writeToFileInDir(
                  base64,
                  dir,
                  filename,
                  mimeType
                );
                const result = await confirmSavedAlert(savedUri);
                if (result.shareRequested) {
                  try {
                    await openShareSheet(cacheUri, mimeType, uti, dialogTitle);
                  } catch {}
                }
                resolve({ ...result, shared: result.shareRequested });
              } catch (error) {
                Alert.alert(
                  'Could not save',
                  `${error?.message || 'Saving failed.'} You can try again and pick a different folder.`
                );
                resolve({ savedToDisk: false, shared: false, uri: cacheUri, error: error?.message });
              }
            },
          },
          {
            text: 'Share a copy',
            onPress: async () => {
              try {
                const result = await openShareSheet(cacheUri, mimeType, uti, dialogTitle);
                resolve({ savedToDisk: false, ...result });
              } catch (error) {
                Alert.alert('Could not share', error?.message || 'Sharing failed.');
                resolve({ shared: false, uri: cacheUri, error: error?.message });
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({ savedToDisk: false, shared: false, uri: cacheUri }),
          },
        ]
      );
    });
  }

  // iOS (and other platforms): the share sheet has "Save to Files" built in.
  const result = await openShareSheet(cacheUri, mimeType, uti, dialogTitle);
  return { savedToDisk: false, ...result };
}

// ---------- PDF ----------

export async function generateAndShareResumePdf(resume) {
  if (!resume) {
    throw new Error('No resume is available.');
  }

  const firstName = safeFilenamePart(resume.firstName, 'Candidate');
  const lastName = safeFilenamePart(resume.lastName, 'Resume');
  const filename = `${firstName}_${lastName}_Hirely_Resume.pdf`;

  const bytes = await buildResumePdfBytes(resume);
  return presentSaveOptions(bytes, {
    filename,
    mimeType: 'application/pdf',
    uti: 'com.adobe.pdf',
    dialogTitle: 'Save your resume (PDF)',
  });
}

export const generateLocalResumePdf = generateAndShareResumePdf;

// ---------- DOCX ----------

export async function generateAndShareResumeDocx(resume) {
  if (!resume) {
    throw new Error('No resume is available.');
  }

  const filename = buildResumeDocFilename(resume);
  const bytes = await buildResumeDocBytes(resume);
  return presentSaveOptions(bytes, {
    filename,
    // The document is Word-HTML saved as .doc — application/msword is the
    // matching MIME. The previous code sent the .docx (OOXML) MIME type,
    // which Android targets reject for this file.
    mimeType: 'application/msword',
    uti: 'com.microsoft.word.doc',
    dialogTitle: 'Save your resume (Word document)',
  });
}

export const generateLocalResumeDocx = generateAndShareResumeDocx;
