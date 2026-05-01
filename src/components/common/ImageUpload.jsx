import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import useImageUpload from '../../hooks/useImageUpload';
import ImagePreview from './ImagePreview';
import ImageDropZone from './ImageDropZone';

const ImageUpload = ({ onImageSelect, initialImage = null, error = null }) => {
  const { t } = useTranslation();
  const {
    dragActive,
    preview,
    uploading,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileSelect,
    removeImage,
    openFileSelector,
    acceptedFormats
  } = useImageUpload(onImageSelect, initialImage);

  return (
    <div className="w-full space-y-2 sm:space-y-3">
      {/* Mobile-first responsive label */}
      <label className="form-label">
        {t('upload.profilePhoto')}
      </label>
      
      {/* Mobile-first responsive container */}
      <div className="relative">
        {preview ? (
          <ImagePreview
            preview={preview}
            onRemove={removeImage}
            onChangeImage={openFileSelector}
          />
        ) : (
          <ImageDropZone
            dragActive={dragActive}
            uploading={uploading}
            error={error}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileSelector}
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleFileSelect}
        className="hidden"
        aria-label={t('upload.selectFile')}
      />

      {/* Mobile-first responsive error message */}
      {error && (
        <div className="mt-2 flex items-start sm:items-center gap-2 p-2 sm:p-3 bg-red-50 rounded-lg border border-red-200">
          <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-xs sm:text-sm text-red-600 leading-tight">
            {error}
          </span>
        </div>
      )}

      {/* Mobile-first responsive help text */}
      <div className="mt-2 p-2 sm:p-3 bg-gray-50 rounded-lg">
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          {t('upload.recommendation')}
        </p>
      </div>
    </div>
  );
};

ImageUpload.propTypes = {
  onImageSelect: PropTypes.func.isRequired,
  initialImage: PropTypes.string,
  error: PropTypes.string
};

export default ImageUpload;