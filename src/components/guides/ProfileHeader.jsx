import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PencilIcon, StarIcon } from '@heroicons/react/24/outline';

const ProfileHeader = ({ 
  guide, 
  initials, 
  guideTypeLabel, 
  guideTypeColor, 
  rating, 
  onEdit, 
  onClose 
}) => {
  const { t } = useTranslation();

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : index < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
            {guide?.fullName || t('guides.profile.noName')}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1">
            <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${guideTypeColor} inline-block w-fit`}>
              {guideTypeLabel}
            </span>
            <div className="flex items-center space-x-1">
              {renderStars()}
              <span className="text-xs sm:text-sm text-gray-600 ml-1">
                ({rating}/5)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 sm:flex-shrink-0">
        {guide?.guideType !== 'FREELANCE' && guide?.type !== 'freelance' && (
          <button
            onClick={() => onEdit(guide)}
            className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <PencilIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.edit')}</span>
            <span className="sm:hidden">{t('guides.comp.editBtn')}</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          <span className="hidden sm:inline">{t('common.back')}</span>
          <span className="sm:hidden">{t('common.back')}</span>
        </button>
      </div>
    </div>
  );
};

ProfileHeader.propTypes = {
  guide: PropTypes.object.isRequired,
  initials: PropTypes.string.isRequired,
  guideTypeLabel: PropTypes.string.isRequired,
  guideTypeColor: PropTypes.string.isRequired,
  rating: PropTypes.number.isRequired,
  onEdit: PropTypes.func,
  onClose: PropTypes.func.isRequired
};

export default ProfileHeader;