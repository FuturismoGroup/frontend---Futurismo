import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ImagePreview = ({ preview, onRemove, onChangeImage }) => {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
        <img
          src={preview}
          alt={t('upload.previewAlt')}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        aria-label={t('upload.removePhoto')}
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
      
      {/* Change image button */}
      <button
        type="button"
        onClick={onChangeImage}
        className="absolute bottom-2 right-2 px-3 py-1 bg-black bg-opacity-50 text-white text-sm rounded-lg hover:bg-opacity-70 transition-colors"
      >
        {t('upload.changePhoto')}
      </button>
    </div>
  );
};

ImagePreview.propTypes = {
  preview: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
  onChangeImage: PropTypes.func.isRequired
};

export default ImagePreview;