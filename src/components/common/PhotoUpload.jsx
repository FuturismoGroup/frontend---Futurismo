import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PhotoIcon, PlusIcon } from '@heroicons/react/24/outline';
import usePhotoUpload from '../../hooks/usePhotoUpload';
import PhotoGrid from './PhotoGrid';
import PhotoPreviewModal from './PhotoPreviewModal';

const PhotoUpload = ({ 
  photos = [], 
  onPhotosChange, 
  maxPhotos = 5, 
  acceptedTypes = "image/*" 
}) => {
  const { t } = useTranslation();
  const {
    uploading,
    previewPhoto,
    fileInputRef,
    handleFileSelect,
    removePhoto,
    openPreview,
    closePreview,
    openFileSelector,
    formatFileSize,
    canAddMore
  } = usePhotoUpload(photos, onPhotosChange, maxPhotos);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Mobile-first responsive upload buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        {/* Mobile-first responsive camera button */}
        {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute('capture', 'environment');
                fileInputRef.current.click();
              }
            }}
            disabled={uploading || !canAddMore}
            className="
              flex items-center justify-center
              gap-2 px-3 sm:px-4 py-2.5 sm:py-2
              bg-blue-600 text-white 
              rounded-lg 
              hover:bg-blue-700 active:bg-blue-800
              disabled:opacity-50 disabled:cursor-not-allowed 
              text-xs sm:text-sm font-medium
              transition-all duration-200
              touch-manipulation
              shadow-sm hover:shadow-md
            "
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('upload.photos.uploading')}
              </>
            ) : (
              <>
                <PhotoIcon className="w-4 h-4" />
                {t('upload.photos.takePhoto')}
              </>
            )}
          </button>
        )}
        
        {/* Mobile-first responsive gallery button */}
        <button
          type="button"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.removeAttribute('capture');
              fileInputRef.current.click();
            }
          }}
          disabled={uploading || !canAddMore}
          className="
            flex items-center justify-center
            gap-2 px-3 sm:px-4 py-2.5 sm:py-2
            border border-gray-300 bg-white
            rounded-lg 
            hover:bg-gray-50 active:bg-gray-100
            disabled:opacity-50 disabled:cursor-not-allowed 
            text-xs sm:text-sm font-medium text-gray-700
            transition-all duration-200
            touch-manipulation
            shadow-sm hover:shadow-md
          "
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
              {t('upload.photos.uploading')}
            </>
          ) : (
            <>
              <PlusIcon className="w-4 h-4" />
              {t('upload.photos.selectPhotos')}
            </>
          )}
        </button>
        
        {/* Mobile-first responsive counter */}
        <div className="flex items-center justify-center sm:justify-start mt-2 sm:mt-0">
          <span className="text-xs sm:text-sm text-gray-500 font-medium">
            {t('upload.photos.counter', { current: photos.length, max: maxPhotos })}
          </span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        aria-label={t('upload.photos.selectFiles')}
      />

      {/* Photo grid */}
      {photos.length > 0 && (
        <PhotoGrid
          photos={photos}
          onPreview={openPreview}
          onRemove={removePhoto}
        />
      )}

      {/* Mobile-first responsive empty state */}
      {photos.length === 0 && (
        <div className="
          border-2 border-dashed border-gray-300 
          rounded-lg 
          p-4 sm:p-6 
          text-center
          bg-gray-50/50
        ">
          <PhotoIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 font-medium">
            {t('upload.photos.noPhotos')}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed px-2">
            {t('upload.photos.photosHelp')}
          </p>
        </div>
      )}

      {/* Preview modal */}
      <PhotoPreviewModal
        photo={previewPhoto}
        onClose={closePreview}
        formatFileSize={formatFileSize}
      />
    </div>
  );
};

PhotoUpload.propTypes = {
  photos: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    url: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    file: PropTypes.object,
    uploadedAt: PropTypes.instanceOf(Date),
    status: PropTypes.string
  })),
  onPhotosChange: PropTypes.func.isRequired,
  maxPhotos: PropTypes.number,
  acceptedTypes: PropTypes.string
};

export default PhotoUpload;