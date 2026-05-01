import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { APP_NAME } from '../../constants/layoutConstants';

const SidebarHeader = ({ isMobile, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 p-4 sm:p-5 lg:p-6 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center min-w-0 flex-1">
          <div className="flex-shrink-0">
            <GlobeAltIcon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-gray-900 truncate">
            {APP_NAME}
          </h1>
        </div>
        
        {isMobile && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-2 p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            aria-label={t('common.closeMenu')}
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};

SidebarHeader.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default SidebarHeader;