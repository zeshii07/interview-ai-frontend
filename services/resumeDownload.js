import { fetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { API_BASE_URL } from '../constants/config';
import {
  buildResumePdfBytes,
  buildResumeFilename,
} from './localResumePdf';

function safeFilenamePart(value, fallback) {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');

  return cleaned || fallback;
}

async function readErrorMessage(response) {
  try {
    const data = await response.json();
    return data?.message || data?.error || 'Failed to generate PDF.';
  } catch {
    return 'Failed to generate PDF.';
  }
}

/**
 * Save raw PDF bytes to the cache directory and trigger the share sheet.
 * Returns { uri, shared, source } where source is 'server' | 'local'.
 */
async function saveAndSharePdf(bytes, filename) {
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
    mimeType: 'application/pdf',
    dialogTitle: 'Save or share your Hirely resume',
    UTI: 'com.adobe.pdf',
  });

  return { uri: file.uri, shared: true, source: 'local' };
}

/**
 * Generate and share a resume PDF.
 *
 * Strategy:
 *   1. Try the backend `/api/resume/pdf` endpoint (server-rendered PDF).
 *   2. On ANY failure (network, 5xx, model error, timeout) fall back to
 *      local PDF generation with pdf-lib using the exact same resume data.
 *
 * The resume data is sent to the server verbatim; if the server cannot
 * produce a PDF, we render one on-device so the user still gets their file.
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

    backendError = new Error(await readErrorMessage(response));
  } catch (error) {
    backendError = error;
  }

  // Step 2 — fall back to local rendering.
  console.warn(
    '[resumeDownload] Backend PDF endpoint unavailable, using local fallback:',
    backendError?.message || backendError
  );

  const localBytes = await buildResumePdfBytes(resume);
  const result = await saveAndSharePdf(localBytes, filename);
  return { ...result, fallbackReason: backendError?.message || 'Network error' };
}

/**
 * Local-only entry point. Skips the server entirely and renders the PDF
 * on-device using the user's resume data.
 */
export async function generateLocalResumePdf(resume) {
  if (!resume) {
    throw new Error('No resume is available.');
  }

  const filename = buildResumeFilename(resume);
  const bytes = await buildResumePdfBytes(resume);
  return saveAndSharePdf(bytes, filename);
}
