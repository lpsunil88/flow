import { DriveFileInfo } from '../types';

const FOLDER_NAME = 'Business_Billing_Suite';
const BACKUP_FILE_NAME = 'billing_database_backup.json';

/**
 * Find or create application folder in Google Drive
 */
export async function getOrCreateBillingFolder(accessToken: string): Promise<string> {
  // Check if folder exists
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Failed to search Drive folder: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Drive folder: ${errText}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Upload a PDF blob directly to Google Drive
 */
export async function uploadPdfToDrive(
  accessToken: string,
  fileName: string,
  pdfBlob: Blob,
  folderId?: string
): Promise<{ fileId: string; webViewLink: string }> {
  const targetFolderId = folderId || (await getOrCreateBillingFolder(accessToken));

  const metadata = {
    name: fileName,
    mimeType: 'application/pdf',
    parents: [targetFolderId],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  
  // Convert blob to array buffer
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);

  // Combine metadata and binary
  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataPart + `Content-Type: application/pdf\r\n\r\n`);
  const closeBytes = encoder.encode(closeDelimiter);

  const combinedLength = metadataBytes.length + pdfBytes.length + closeBytes.length;
  const combined = new Uint8Array(combinedLength);
  combined.set(metadataBytes, 0);
  combined.set(pdfBytes, metadataBytes.length);
  combined.set(closeBytes, metadataBytes.length + pdfBytes.length);

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: combined,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Failed to upload PDF to Google Drive: ${err}`);
  }

  const result = await uploadRes.json();
  return {
    fileId: result.id,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
  };
}

/**
 * Backup billing database to Google Drive as JSON
 */
export async function saveBillingDataToDrive(
  accessToken: string,
  data: any
): Promise<{ fileId: string; timestamp: string }> {
  const folderId = await getOrCreateBillingFolder(accessToken);

  // Check if existing backup file exists
  const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let existingFileId: string | null = null;
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      existingFileId = searchData.files[0].id;
    }
  }

  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: 'application/json' });

  if (existingFileId) {
    // Update existing file content
    const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: blob,
    });

    if (!updateRes.ok) {
      throw new Error('Failed to update existing backup file on Drive');
    }

    return { fileId: existingFileId, timestamp: new Date().toISOString() };
  } else {
    // Create new backup file
    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
      parents: [folderId],
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
    const body = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n${delimiter}Content-Type: application/json\r\n\r\n${content}${closeDelimiter}`;

    const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body,
    });

    if (!createRes.ok) {
      throw new Error('Failed to create backup file on Drive');
    }

    const resData = await createRes.json();
    return { fileId: resData.id, timestamp: new Date().toISOString() };
  }
}

/**
 * Load backup data from Google Drive
 */
export async function loadBillingDataFromDrive(accessToken: string): Promise<any | null> {
  const folderId = await getOrCreateBillingFolder(accessToken);
  const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  if (!searchData.files || searchData.files.length === 0) return null;

  const fileId = searchData.files[0].id;
  const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!getRes.ok) return null;
  return await getRes.json();
}

/**
 * List files stored inside the application folder on Google Drive
 */
export async function listDriveBillingFiles(accessToken: string): Promise<DriveFileInfo[]> {
  try {
    const folderId = await getOrCreateBillingFolder(accessToken);
    const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webViewLink,createdTime,size)&orderBy=createdTime desc`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Error listing Drive files:', err);
    return [];
  }
}
