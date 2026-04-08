// Service de stockage fichiers (Supabase Storage)

import { createClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getStorageClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  }).storage;
}

const BUCKET_NAME = process.env.STORAGE_BUCKET || 'documents';

// Upload d'un fichier
export async function uploadToStorage(
  fileBuffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string = 'documents'
): Promise<{ fileName: string; storageUrl: string }> {
  const ext = originalName.split('.').pop() || 'bin';
  const fileName = `${folder}/${uuid()}.${ext}`;

  const storage = getStorageClient();
  const { error } = await storage.from(BUCKET_NAME).upload(fileName, fileBuffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return {
    fileName,
    storageUrl: `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${fileName}`,
  };
}

// Recuperer un fichier
export async function getFileFromStorage(fileName: string): Promise<Buffer> {
  const storage = getStorageClient();
  const { data, error } = await storage.from(BUCKET_NAME).download(fileName);

  if (error || !data) {
    throw new Error(`Storage download failed: ${error?.message || 'No data'}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

// Supprimer un fichier
export async function deleteFromStorage(fileName: string): Promise<void> {
  const storage = getStorageClient();
  const { error } = await storage.from(BUCKET_NAME).remove([fileName]);

  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}

// Generer une URL signee temporaire (pour acces securise)
export async function getSignedDownloadUrl(
  fileName: string,
  expiresIn: number = 3600 // 1 heure par defaut
): Promise<string> {
  const storage = getStorageClient();
  const { data, error } = await storage.from(BUCKET_NAME).createSignedUrl(fileName, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Signed URL failed: ${error?.message || 'No URL'}`);
  }

  return data.signedUrl;
}

// Generer une URL signee pour upload direct
export async function getSignedUploadUrl(
  fileName: string,
  _contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const storage = getStorageClient();
  const { data, error } = await storage.from(BUCKET_NAME).createSignedUploadUrl(fileName);

  if (error || !data?.signedUrl) {
    throw new Error(`Signed upload URL failed: ${error?.message || 'No URL'}`);
  }

  // Note: expiresIn is not configurable for upload URLs in Supabase (default 2h)
  return data.signedUrl;
}

// Verifier si un fichier existe
export async function fileExists(fileName: string): Promise<boolean> {
  const storage = getStorageClient();
  const { data, error } = await storage.from(BUCKET_NAME).download(fileName);
  return !error && !!data;
}
