import { fetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { API_BASE_URL } from '../constants/config';
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

async function readErrorMessage(response, fallback) {
  try {
    const data = await response.json();
    return data?.message || data?.error || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Save raw bytes to the cache directory and trigger the share sheet.
 * Returns { uri, shared, source } where source is 'server' | 'local'.
 */
async function saveAndShareFile(bytes, filename, mimeType, uti, dialogTitle) {
  const file = new File(Paths.cache, filename);

  if (file.exists) {
    file.delete();
  }

  file.create();
  file.write(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    return { uri: file.uri, shared: false, source: 'local' };
  }

  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: dialogTitle || 'Save or share your Hirely resume',
    UTI: uti,
  });

  return { uri: file.uri, shared: true, source: 'local' };
}

// ---------- PDF ----------

/**
 * Generate and share a resume PDF.
 *
 * Strategy:
 *   1. Try the backend `/api/resume/pdf` endpoint (server-rendered PDF).
 *   2. On ANY failure (network, 5xx, model error, timeout) fall back to
 *      local PDF generation with pdf-lib using the exact same resume data.
 */
export async function generateAndShareResumePdf(resume) {
  if (!resume) {
    throw new Error('No resume is available.');
  }

  const firstName = safeFilenamePart(resume.firstName, 'Candidate');
  const lastName = safeFilenamePart(resume.lastName, 'Resume');
  const filename = `${firstName}_${lastName}_Hirely_Resume.pdf`;

  // Step 1 — try the backend.
  let backendError = null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_BASE_URL}/api/resume/pdf`, {
      method: 'POST',
      headers: {
        Accept: 'application/pdf',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resume),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const bytes = await response.bytes();
      const file = new File(Paths.cache, filename);

      if (file.exists) {
        file.delete();
      }

      file.create();
      file.write(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        return { uri: file.uri, shared: false, source: 'server' };
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save or share your Hirely resume',
        UTI: 'com.adobe.pdf',
      });

      return { uri: file.uri, shared: true, source: 'server' };
    }

    backendError = new Error(await readErrorMessage(response, 'Failed to generate PDF.'));
  } catch (error) {
    backendError = error;
  }

  // Step 2 — fall back to local rendering.
  console.warn(
    '[resumeDownload] Backend PDF endpoint unavailable, using local fallback:',
    backendError?.message || backendError
  );

  const localBytes = await buildResumePdfBytes(resume);
  const result = await saveAndShareFile(
    localBytes,
    filename,
    'application/pdf',
    'com.adobe.pdf',
    'Save or share your Hirely resume (PDF)'
  );
  return { ...result, fallbackReason: backendError?.message || 'Network error' };
}

/**
 * Local-only entry point for PDF. Skips the server entirely.
 */
export async function generateLocalResumePdf(resume) {
  if (!resume) {
    throw new Error('No resume is available.');
  }

  const filename = buildResumeFilename(resume);
  const bytes = await buildResumePdfBytes(resume);
  return saveAndShareFile(
    bytes,
    filename,
    'application/pdf',
    'com.adobe.pdf',
    'Save or share your Hirely resume (PDF)'
  );
}

// ---------- DOCX ----------

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOCX_UTI = 'org.openxmlformats.wordprocessingml.document';
const DOC_MIME = 'application/msword';
const DOC_UTI = 'com.microsoft.word.doc';

/**
 * Generate and share a resume DOCX (Word document).
 *
 * Strategy:
 *   1. Try the backend `/api/resume/docx` endpoint (real .docx via the `docx`
 *      npm package).
 *   2. On ANY failure (network, 5xx, timeout) fall back to local generation
 *      using a Word-compatible HTML file saved with .doc extension. Word,
 *      LibreOffice, Google Docs, and Pages all open this format natively.
 */
export async function generateAndShareResumeDocx(resume) {
  if (!resume) {
    throw new Error('No resume is available.');
  }

  const firstName = safeFilenamePart(resume.firstName, 'Candidate');
  const lastName = safeFilenamePart(resume.lastName, 'Resume');
  const docxFilename = `${firstName}_${lastName}_Hirely_Resume.docx`;
  const docFilename = `${firstName}_${lastName}_Hirely_Resume.doc`;

  // Step 1 — try the backend.
  let backendError = null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_BASE_URL}/api/resume/docx`, {
      method: 'POST',
      headers: {
        Accept: DOCX_MIME,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resume),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const bytes = await response.bytes();
      const file = new File(Paths.cache, docxFilename);

      if (file.exists) {
        file.delete();
      }

      file.create();
      file.write(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        return { uri: file.uri, shared: false, source: 'server', format: 'docx' };
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: DOCX_MIME,
        dialogTitle: 'Save or share your Hirely resume (Word)',
        UTI: DOCX_UTI,
      });

      return { uri: file.uri, shared: true, source: 'server', format: 'docx' };
    }

    backendError = new Error(await readErrorMessage(response, 'Failed to generate DOCX.'));
  } catch (error) {
    backendError = error;
  }

  // Step 2 — fall back to local rendering (Word-compatible HTML .doc).
  console.warn(
    '[resumeDownload] Backend DOCX endpoint unavailable, using local fallback:',
    backendError?.message || backendError
  );

  const localBytes = await buildResumeDocBytes(resume);
  const result = await saveAndShareFile(
    localBytes,
    docFilename,
    DOC_MIME,
    DOC_UTI,
    'Save or share your Hirely resume (Word)'
  );
  return {
    ...result,
    format: 'doc',
    fallbackReason: backendError?.message || 'Network error',
  };
}

/**
 * Local-only entry point for DOCX. Skips the server entirely and renders a
 * Word-compatible .doc file on-device.
 */
export async function generateLocalResumeDocx(resume) {
  if (!resume) {
    throw new Error('No resume is available.');
  }

  const filename = buildResumeDocFilename(resume);
  const bytes = await buildResumeDocBytes(resume);
  return saveAndShareFile(
    bytes,
    filename,
    DOC_MIME,
    DOC_UTI,
    'Save or share your Hirely resume (Word)'
  );
}
