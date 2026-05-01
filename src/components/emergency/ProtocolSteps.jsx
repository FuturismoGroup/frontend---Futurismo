import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const ProtocolSteps = ({ 
  stepFields, 
  register, 
  errors, 
  appendStep, 
  removeStep 
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />
          {t('emergency.protocol.protocolSteps')}
        </h3>
        <button
          type="button"
          onClick={() => appendStep({ text: '' })}
          className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>{t('emergency.protocol.addStep')}</span>
        </button>
      </div>

      <div className="space-y-3">
        {stepFields.map((field, index) => (
          <div key={field.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm mt-1">
              {index + 1}
            </div>
            <div className="flex-1">
              <textarea
                {...register(`steps.${index}.text`, { 
                  required: t('emergency.protocol.stepRequired') 
                })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('emergency.protocol.stepPlaceholder')}
              />
              {errors.steps?.[index]?.text && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.steps[index].text.message}
                </p>
              )}
            </div>
            {stepFields.length > 1 && (
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                aria-label={t('common.delete')}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

ProtocolSteps.propTypes = {
  stepFields: PropTypes.array.isRequired,
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  appendStep: PropTypes.func.isRequired,
  removeStep: PropTypes.func.isRequired
};

export default ProtocolSteps;