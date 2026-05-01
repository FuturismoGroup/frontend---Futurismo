import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  PHOTO_CONFIG,
  UPLOAD_STATUS,
  PHOTO_ERROR_KEYS,
  PHOTO_SUCCESS_KEYS
} from '../constants/photoUploadConstants';

/**
 * Hook para manejar la carga y gestión de fotos
 * @param {Array} photos - Lista actual de fotos
 * @param {Function} onPhotosChange - Callback cuando cambian las fotos
 * @param {number} maxPhotos - Número máximo de fotos permitidas
 * @returns {Object} Estado y funciones para manejo de fotos
 */
const usePhotoUpload = (photos = [], onPhotosChange, maxPhotos = PHOTO_CONFIG.DEFAULT_MAX_PHOTOS) => {
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  // Configuración memoizada
  const acceptedTypesString = useMemo(
    () => PHOTO_CONFIG.ACCEPTED_EXTENSIONS.join(','),
    []
  );

  const validateFile = useCallback((file) => {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: t(PHOTO_ERROR_KEYS.INVALID_TYPE, { name: file.name }) };
    }

    if (file.size > PHOTO_CONFIG.maxSize) {
      return { valid: false, error: t(PHOTO_ERROR_KEYS.TOO_LARGE, { name: file.name }) };
    }

    return { valid: true };
  }, [t]);

  const handleFileSelect = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    
    if (photos.length + files.length > maxPhotos) {
      toast.error(t(PHOTO_ERROR_KEYS.MAX_EXCEEDED, { max: maxPhotos }));
      return;
    }

    setUploading(true);
    
    try {
      const newPhotos = [];
      
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast.error(validation.error);
          continue;
        }

        // Create preview URL
        const imageUrl = URL.createObjectURL(file);
        
        // Simulate upload (in production this would upload to server)
        const photoData = {
          id: Date.now() + Math.random(),
          file: file,
          url: imageUrl,
          name: file.name,
          size: file.size,
          uploadedAt: new Date(),
          status: UPLOAD_STATUS.UPLOADED
        };

        newPhotos.push(photoData);
      }

      const updatedPhotos = [...photos, ...newPhotos];
      onPhotosChange(updatedPhotos);
      
      if (newPhotos.length > 0) {
        toast.success(t(PHOTO_SUCCESS_KEYS.UPLOAD_SUCCESS, { count: newPhotos.length }));
      }
      
    } catch (error) {
      toast.error(t(PHOTO_ERROR_KEYS.UPLOAD_ERROR));
    } finally {
      setUploading(false);
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [photos, onPhotosChange, maxPhotos, t, validateFile]);

  const removePhoto = useCallback((photoId) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onPhotosChange(updatedPhotos);
    
    // Release blob URL memory
    const photoToRemove = photos.find(photo => photo.id === photoId);
    if (photoToRemove && photoToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    
    toast.success(t(PHOTO_SUCCESS_KEYS.REMOVED));
  }, [photos, onPhotosChange, t]);

  const openPreview = useCallback((photo) => {
    setPreviewPhoto(photo);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewPhoto(null);
  }, []);

  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = useCallback((size) => {
    return (size / 1024 / 1024).toFixed(1);
  }, []);

  return {
    // State
    uploading,
    previewPhoto,
    fileInputRef,
    
    // Handlers
    handleFileSelect,
    removePhoto,
    openPreview,
    closePreview,
    openFileSelector,
    
    // Utilities
    formatFileSize,
    canAddMore: photos.length < maxPhotos,
    
    // Configuración
    acceptedTypes: acceptedTypesString,
    maxPhotos,
    maxSize: PHOTO_CONFIG.MAX_SIZE,
    
    // Constantes
    UPLOAD_STATUS,
    PHOTO_CONFIG
  };
};

export default usePhotoUpload;