import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const ExportFormatOption = ({ format, isSelected, onSelect }) => {
  const { t } = useTranslation();

  return (
    <div
      className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 ${
        isSelected
          ? 'border-primary-500 bg-primary-50 shadow-lg transform scale-105'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={() => onSelect(format.id)}
    >
      {/* Recommended Badge */}
      {format.recommended && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            ⭐ {t('common.export.recommended')}
          </div>
        </div>
      )}
      
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-xl bg-gradient-to-br ${format.color} shadow-lg`}>
            <format.icon className="w-6 h-6 text-white" />
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-lg font-bold text-gray-900">
                {format.name}
              </h4>
              <span className="text-sm text-gray-500 font-mono">
                {format.extension}
              </span>
              {isSelected && (
                <CheckCircleIcon className="w-5 h-5 text-primary-600 ml-auto" />
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-3">
              {t(format.descriptionKey)}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {format.features.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {t(feature)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ExportFormatOption.propTypes = {
  format: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    extension: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string.isRequired,
    descriptionKey: PropTypes.string.isRequired,
    features: PropTypes.arrayOf(PropTypes.string).isRequired,
    recommended: PropTypes.bool
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default ExportFormatOption;