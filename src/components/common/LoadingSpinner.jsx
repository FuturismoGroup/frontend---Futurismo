import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = ({ 
  size = 'md', 
  fullScreen = false, 
  text = null,
  showDefaultText = true 
}) => {
  const { t } = useTranslation();
  
  // Mobile-first responsive size classes
  const sizeClasses = {
    sm: 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6',
    md: 'w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10',
    lg: 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16'
  };

  const displayText = text || (showDefaultText ? t('common.loading') : null);

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 md:space-y-4">
      <div 
        className={`spinner ${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}
        role="status"
        aria-label={displayText || t('common.loading')}
      >
        <span className="sr-only">{displayText || t('common.loading')}</span>
      </div>
      {displayText && (
        <p className="text-gray-600 text-xs sm:text-sm md:text-base animate-pulse text-center px-2">
          {displayText}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 sm:p-6 md:p-8">
      {spinner}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullScreen: PropTypes.bool,
  text: PropTypes.string,
  showDefaultText: PropTypes.bool
};

export default LoadingSpinner;