/**
 * Constantes de Upload
 * Valores estáticos para el módulo
 */

export const ALLOWED_FILE_TYPES = {};

export const MAX_FILE_SIZE = 5242880;

export const MAX_TOTAL_SIZE = 52428800;

export const UPLOAD_CATEGORIES = [];

export const IMAGE_CONSTRAINTS = {};

// Additional constants for useImageUpload hook
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

export const FILE_SIZE_LIMITS = {
  IMAGE: 5242880, // 5MB in bytes
  DOCUMENT: 10485760, // 10MB
  VIDEO: 52428800 // 50MB
};

export const UPLOAD_CONFIG = {
  UPLOAD_DELAY: 500, // milliseconds
  MAX_FILES: 10,
  CHUNK_SIZE: 1048576 // 1MB chunks for large files
};

export const UPLOAD_ERROR_KEYS = {
  INVALID_FORMAT: 'upload.errors.invalidFormat',
  FILE_TOO_LARGE: 'upload.errors.fileTooLarge',
  UPLOAD_ERROR: 'upload.errors.uploadError',
  TOO_MANY_FILES: 'upload.errors.tooManyFiles',
  NETWORK_ERROR: 'upload.errors.networkError'
};

// Export default para compatibilidad
export default {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  UPLOAD_CATEGORIES,
  IMAGE_CONSTRAINTS,
  ACCEPTED_IMAGE_TYPES,
  FILE_SIZE_LIMITS,
  UPLOAD_CONFIG,
  UPLOAD_ERROR_KEYS
};
