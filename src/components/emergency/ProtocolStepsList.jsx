import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const ProtocolStepsList = ({ steps = [] }) => {
  const { t } = useTranslation();

  if (!steps || steps.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />
          {t('emergency.protocol.stepsToFollow')}
        </h3>
        <p className="text-gray-500 text-sm">{t('common.noData') || 'No hay pasos definidos'}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />
        {t('emergency.protocol.stepsToFollow')}
      </h3>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="text-gray-900">{step}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ProtocolStepsList.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string)
};

export default ProtocolStepsList;