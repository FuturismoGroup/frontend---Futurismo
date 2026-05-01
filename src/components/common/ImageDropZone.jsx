import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PhotoIcon } from '@heroicons/react/24/outline';

const ImageDropZone = ({ 
  dragActive, 
  uploading, 
  error, 
  onDragEnter, 
  onDragLeave, 
  onDragOver, 
  onDrop, 
  onClick 
}) => {
  const { t } = useTranslation();

  const getClassName = () => {
    // Mobile-first responsive drop zone
    const baseClass = 'relative w-full h-36 sm:h-40 md:h-48 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer touch-manipulation';
    if (dragActive) return `${baseClass} border-primary-500 bg-primary-50`;
    if (error) return `${baseClass} border-red-300 bg-red-50`;
    return `${baseClass} border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100`;
  };

  return (
    <div
      className={getClassName()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
    >
      {/* Mobile-first responsive content */}
      <div className="flex flex-col items-center justify-center h-full p-3 sm:p-4 md:p-6 text-center">
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 border-b-2 border-primary-600 mb-2 sm:mb-3"></div>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('upload.uploading')}</p>
          </>
        ) : (
          <>
            <PhotoIcon className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 sm:mb-3 ${error ? 'text-red-400' : 'text-gray-400'} transition-colors`} />
            <p className={`text-xs sm:text-sm font-medium mb-1 ${error ? 'text-red-600' : 'text-gray-700'} leading-tight`}>
              {dragActive ? t('upload.dropHere') : t('upload.dragOrClick')}
            </p>
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xs text-gray-500 leading-relaxed">
                {t('upload.supportedFormats')}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t('upload.maxSize')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

ImageDropZone.propTypes = {
  dragActive: PropTypes.bool.isRequired,
  uploading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onDragEnter: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired
};

export default ImageDropZone;