import { Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as NewFileSystem from 'expo-file-system';

import { buildResumePdfBytes } from './localResumePdf';
import { buildResumeDocBytes, buildResumeDocFilename } from './localResumeDocx';
import { bytesToBase64 } from '../utils/bytes';

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
 * 2. SAVING — on Android the user gets a real "Save to Downloads" action
 *    (StorageAccessFramework directory picker) in addition to the share
 *    sheet, so the file genuinely lands somewhere visible. On iOS the share
 *    sheet (which contains "Save to Files") opens directly.
 *
 * 3. MIME TYPES — .pdf gets application/pdf; the Word document gets
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

/**
 * Android: let the user pick a folder (defaults to Downloads) and write the
 * file into it via the Storage Access Framework. The saved file is visible
 * to the system Files app and every other app.
 *
 * Returns the saved file URI, or null if the user cancelled / denied.
 */
async function saveToPickedFolder(base64, filename, mimeType) {
  if (!LegacyFileSystem.StorageAccessFramework) {
    return null;
  }
  const permissions =
    await LegacyFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    return null;
  }

  const fileUri = await LegacyFileSystem.StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    filename,
    mimeType
  );
  await LegacyFileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: LegacyFileSystem.EncodingType.Base64,
  });
  return fileUri;
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

/**
 * Present the save UI. Android: an action alert with "Save to Downloads"
 * (guaranteed, user-visible save) and "Share a copy". iOS: the share sheet
 * directly (it includes Save to Files).
 */
async function presentSaveOptions(bytes, { filename, mimeType, uti, dialogTitle }) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  const cacheUri = await writeCacheFile(data, filename);

  if (Platform.OS === 'android') {
    return new Promise((resolve) => {
      Alert.alert(
        dialogTitle || 'Save your resume',
        'Choose "Save to Downloads" to keep the file on your device, or share a copy with another app.',
        [
          {
            text: 'Save to Downloads',
            onPress: async () => {
              try {
                const savedUri = await saveToPickedFolder(
                  bytesToBase64(data),
                  filename,
                  mimeType
                );
                if (savedUri) {
                  Alert.alert(
                    'Saved',
                    'Your resume has been saved to the folder you picked (usually Downloads). Open your Files app to find it.'
                  );
                  resolve({ savedToDisk: true, uri: savedUri });
                } else {
                  // User closed the folder picker — fall back to the share
                  // sheet so the file is never left in limbo.
                  const result = await openShareSheet(
                    cacheUri,
                    mimeType,
                    uti,
                    dialogTitle
                  );
                  resolve({ savedToDisk: false, ...result });
                }
              } catch (error) {
                Alert.alert(
                  'Could not save',
                  `${error?.message || 'Saving failed.'} You can try again and pick a different folder.`
                );
                resolve({ savedToDisk: false, uri: cacheUri, error: error?.message });
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
