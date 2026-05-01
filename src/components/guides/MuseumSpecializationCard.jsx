import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

const MuseumSpecializationCard = ({ museums, getMuseumInfo, getLevelInfo }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <AcademicCapIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-500" />
        <span className="truncate">{t('guides.profile.museumKnowledge')} ({museums.length})</span>
      </h3>

      {museums.length === 0 ? (
        <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">
          {t('guides.profile.noMuseums')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {museums.map((museum, index) => {
            const museumInfo = getMuseumInfo(museum.name);
            const levelInfo = getLevelInfo(museum.expertise);

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AcademicCapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
                      {museumInfo.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">{t('guides.profile.museum')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 gap-2">
                  <span className="text-xs text-gray-600 flex-shrink-0">
                    {t('guides.profile.expertiseLevel')}
                  </span>
                  <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${levelInfo.color}`}>
                    {levelInfo.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

MuseumSpecializationCard.propTypes = {
  museums: PropTypes.array.isRequired,
  getMuseumInfo: PropTypes.func.isRequired,
  getLevelInfo: PropTypes.func.isRequired
};

export default MuseumSpecializationCard;