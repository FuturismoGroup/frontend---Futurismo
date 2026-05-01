import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PhotoGrid = ({ photos, onPreview, onRemove }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {photos.map((photo) => (
        <div key={photo.id} className="relative group">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={photo.url}
              alt={photo.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <button
                onClick={() => onPreview(photo)}
                className="p-1.5 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                title={t('upload.photos.viewPhoto')}
                aria-label={t('upload.photos.viewPhoto')}
              >
                <EyeIcon className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => onRemove(photo.id)}
                className="p-1.5 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                title={t('upload.photos.removePhoto')}
                aria-label={t('upload.photos.removePhoto')}
              >
                <XMarkIcon className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>

          {/* Upload status indicator */}
          {photo.status === 'uploading' && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

PhotoGrid.propTypes = {
  photos: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    url: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string
  })).isRequired,
  onPreview: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};

export default PhotoGrid;