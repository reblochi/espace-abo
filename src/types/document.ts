// Types pour les documents

import type { FileType } from './process';

export interface Document {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  fileType: FileType;
  storageUrl: string;
  thumbnailUrl: string | null;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  process?: {
    reference: string;
    type: string;
  };
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DocumentUploadResponse {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  fileType: FileType;
  storageUrl: string;
  createdAt: string;
}

// Validation des fichiers
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

export function isFileSizeValid(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}
