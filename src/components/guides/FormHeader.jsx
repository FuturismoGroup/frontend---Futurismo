import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';

const FormHeader = ({ isEditMode, onCancel }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">
        {isEditMode ? t('guides.comp.editGuide') : t('guides.comp.newGuide')}
      </h3>
      <button
        onClick={onCancel}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

FormHeader.propTypes = {
  isEditMode: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default FormHeader;
