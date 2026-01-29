// Service de stockage fichiers (Cloudflare R2 / AWS S3 compatible)

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

// Client S3/R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'documents';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://${BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Upload d'un fichier
export async function uploadToStorage(
  fileBuffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string = 'documents'
): Promise<{ fileName: string; storageUrl: string }> {
  const ext = originalName.split('.').pop() || 'bin';
  const fileName = `${folder}/${uuid()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
    Metadata: {
      originalName,
    },
  });

  await s3Client.send(command);

  return {
    fileName,
    storageUrl: `${PUBLIC_URL}/${fileName}`,
  };
}

// Recuperer un fichier
export async function getFileFromStorage(fileName: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  const response = await s3Client.send(command);
  const chunks: Uint8Array[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// Supprimer un fichier
export async function deleteFromStorage(fileName: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  await s3Client.send(command);
}

// Generer une URL signee temporaire (pour acces securise)
export async function getSignedDownloadUrl(
  fileName: string,
  expiresIn: number = 3600 // 1 heure par defaut
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Generer une URL signee pour upload direct
export async function getSignedUploadUrl(
  fileName: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Verifier si un fichier existe
export async function fileExists(fileName: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });
    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}
