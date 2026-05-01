import React from 'react';
import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';

const PhotoPreviewModal = ({ photo, onClose, formatFileSize }) => {
  if (!photo) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all z-10"
          aria-label="Close preview"
        >
          <XMarkIcon className="w-6 h-6 text-white" />
        </button>
        
        <img
          src={photo.url}
          alt={photo.name}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
        
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
          <p className="text-sm font-medium">{photo.name}</p>
          <p className="text-xs opacity-75">
            {formatFileSize(photo.size)} MB
          </p>
        </div>
      </div>
    </div>
  );
};

PhotoPreviewModal.propTypes = {
  photo: PropTypes.shape({
    url: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired
  }),
  onClose: PropTypes.func.isRequired,
  formatFileSize: PropTypes.func.isRequired
};

export default PhotoPreviewModal;