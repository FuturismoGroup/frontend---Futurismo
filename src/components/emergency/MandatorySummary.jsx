import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const MandatorySummary = ({ mandatoryMaterials }) => {
  const { t } = useTranslation();

  if (mandatoryMaterials.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-900 mb-2">
            {t('emergency.materials.mandatoryMaterials')}
          </h3>
          <p className="text-yellow-800 text-sm mb-3">
            {t('emergency.materials.mandatoryDescription')}
          </p>
          <div className="space-y-1">
            {mandatoryMaterials.map(material => (
              <div key={material.id} className="flex items-center space-x-2 text-yellow-800">
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{material.name}</span>
                <span className="text-sm">
                  ({t('emergency.materials.elementsCount', { count: material.items.length })})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

MandatorySummary.propTypes = {
  mandatoryMaterials: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.string).isRequired
  })).isRequired
};

export default MandatorySummary;