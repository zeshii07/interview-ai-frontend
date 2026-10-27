import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

import {
  buildResumePdfBytes,
  buildResumeFilename,
} from './localResumePdf';
import {
  buildResumeDocBytes,
  buildResumeDocFilename,
} from './localResumeDocx';

function safeFilenamePart(value, fallback) {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');

  return cleaned || fallback;
}

/**
 * Lazy-load expo-file-system's File and Paths. The new File/Directory API
 * (SDK 53+) is imported dynamically to avoid crashing the app at startup
 * if the API isn't available in the current Expo Go version.
 */
let _fsModule = null;
async function getFs() {
  if (_fsModule === null) {
    try {
      _fsModule = await import('expo-file-system');
    } catch (err) {
      console.warn('[resumeDownload] Could not load expo-file-system:', err?.message);
      _fsModule = false;
    }
  }
  return _fsModule || null;
}

/**
 * Write bytes to a file in the cache directory. Returns the file URI.
 * Falls back to legacy API if the new File/Directory API isn't available.
 */
async function writeCacheFile(bytes, filename) {
  const fs = await getFs();
  if (!fs) throw new Error('File system not available');

  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  // Try the new File/Directory API (SDK 53+)
  if (fs.File && fs.Paths) {
    try {
      const file = new fs.File(fs.Paths.cache, filename);
      if (file.exists) file.delete();
      file.create();
      file.write(data);
      return file.uri;
    } catch (err) {
      console.warn('[resumeDownload] New File API failed, falling back to legacy:', err?.message);
    }
  }

  // Legacy API fallback
  if (fs.writeAsStringAsync && fs.documentDirectory) {
    const uri = `${fs.documentDirectory}${filename}`;
    const base64 = bytesToBase64(data);
    await fs.writeAsStringAsync(uri, base64, { encoding: fs.EncodingType.Base64 });
    return uri;
  }

  throw new Error('No file system API available');
}

/**
 * Open the system share sheet.
 */
async function openShareSheet(fileUri, mimeType, uti, dialogTitle) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert('File created', `The file was saved at:\n${fileUri}`);
    return { uri: fileUri, shared: false, source: 'local' };
  }

  await Sharing.shareAsync(fileUri, {
    mimeType,
    dialogTitle: dialogTitle || 'Save or share your Hirely resume',
    UTI: uti,
  });

  return { uri: fileUri, shared: true, source: 'local' };
}

/**
 * Open the system save/share sheet after writing the file to cache.
 *
 * Expo's sandbox has no public Downloads directory. Pretending otherwise
 * stores a file in private app storage where users cannot find it. The
 * platform sheet is the supported path: Android users can select Files or a
 * Downloads-capable app, while iOS users can select Save to Files.
 */
async function saveOrShareFile(bytes, filename, mimeType, uti, dialogTitle) {
  const cacheUri = await writeCacheFile(bytes, filename);

  return new Promise((resolve, reject) => {
    Alert.alert(
      dialogTitle || 'Save your resume',
      'Choose Save / Share, then select where to keep your file.',
      [
        {
          text: 'Save / Share',
          onPress: async () => {
            try {
              resolve(await openShareSheet(cacheUri, mimeType, uti, dialogTitle));
            } catch (error) {
              reject(error);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve({ uri: cacheUri, shared: false, savedToDisk: false, source: 'local' }),
        },
      ]
    );
  });
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
  return saveOrShareFile(
    bytes,
    filename,
    'application/pdf',
    'com.adobe.pdf',
    'Save your resume (PDF)'
  );
}

export const generateLocalResumePdf = generateAndShareResumePdf;

// ---------- DOCX ----------

export async function generateAndShareResumeDocx(resume) {
  if (!resume) {
    throw new Error('No resume is available.');
  }

  const filename = buildResumeDocFilename(resume);
  const bytes = await buildResumeDocBytes(resume);
  return saveOrShareFile(
    bytes,
    filename,
    'application/msword',
    'com.microsoft.word.doc',
    'Save your resume (Word document)'
  );
}

export const generateLocalResumeDocx = generateAndShareResumeDocx;
