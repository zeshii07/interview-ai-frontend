import { fetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { API_BASE_URL } from '../constants/config';

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

export async function generateAndShareResumePdf(resume) {
  if (!resume) {
    throw new Error('No optimized resume is available.');
  }

  const response = await fetch(`${API_BASE_URL}/api/resume/pdf`, {
    method: 'POST',
    headers: {
      Accept: 'application/pdf',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resume),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const firstName = safeFilenamePart(resume.firstName, 'Candidate');
  const lastName = safeFilenamePart(resume.lastName, 'Resume');
  const file = new File(
    Paths.cache,
    `${firstName}_${lastName}_Hirely_Resume.pdf`
  );

  if (file.exists) {
    file.delete();
  }

  file.create();
  file.write(await response.bytes());

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    return {
      uri: file.uri,
      shared: false,
    };
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Save or share your Hirely resume',
    UTI: 'com.adobe.pdf',
  });

  return {
    uri: file.uri,
    shared: true,
  };
}
