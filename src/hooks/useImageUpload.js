import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ACCEPTED_IMAGE_TYPES,
  FILE_SIZE_LIMITS,
  UPLOAD_CONFIG,
  UPLOAD_ERROR_KEYS
} from '../constants/uploadConstants';

/**
 * Hook personalizado para manejar la carga de imágenes
 * @param {Function} onImageSelect - Callback cuando se selecciona una imagen
 * @param {string|null} initialImage - URL de imagen inicial
 * @returns {Object} Estado y funciones para manejar upload de imágenes
 */
const useImageUpload = (onImageSelect, initialImage = null) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(initialImage);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();


  // Validate image file
  const validateImageFile = (file) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: t(UPLOAD_ERROR_KEYS.INVALID_FORMAT) };
    }

    if (file.size > FILE_SIZE_LIMITS.IMAGE) {
      return { valid: false, error: t(UPLOAD_ERROR_KEYS.FILE_TOO_LARGE) };
    }

    return { valid: true };
  };

  // Process selected file
  const processFile = async (file) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      onImageSelect(null, validation.error);
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        setUploading(false);
      };
      reader.readAsDataURL(file);

      // Simulate upload (in production this would upload to a server)
      await new Promise(resolve => setTimeout(resolve, UPLOAD_CONFIG.UPLOAD_DELAY));

      // Return processed file
      onImageSelect(file, null);
    } catch (error) {
      setUploading(false);
      onImageSelect(null, t(UPLOAD_ERROR_KEYS.UPLOAD_ERROR));
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Remove image
  const removeImage = () => {
    setPreview(null);
    onImageSelect(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open file selector
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return {
    // State
    dragActive,
    preview,
    uploading,
    fileInputRef,

    // Handlers
    handleDrag,
    handleDrop,
    handleFileSelect,
    removeImage,
    openFileSelector,

    // Config
    acceptedFormats: ACCEPTED_IMAGE_TYPES.join(','),
    maxFileSize: FILE_SIZE_LIMITS.IMAGE
  };
};

export default useImageUpload;