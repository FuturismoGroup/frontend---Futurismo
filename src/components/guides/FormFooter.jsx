import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { DocumentCheckIcon } from '@heroicons/react/24/outline';

const FormFooter = ({ onCancel, onSubmit }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {t('guides.comp.cancelBtn')}
      </button>
      <button
        onClick={onSubmit}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
      >
        <DocumentCheckIcon className="w-4 h-4" />
        <span>{t('guides.comp.saveBtn')}</span>
      </button>
    </div>
  );
};

FormFooter.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default FormFooter;
