import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

const ProviderFormHeader = ({ isEditing, onCancel, onSubmit }) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          {isEditing ? t('providers.form.editTitle') : t('providers.form.createTitle')}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          title="Cerrar"
        >
          <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <DocumentCheckIcon className="w-5 h-5 mr-2" />
          {t('common.save')}
        </button>
      </div>
    </>
  );
};

ProviderFormHeader.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default ProviderFormHeader;