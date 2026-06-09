import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import termsService from '../../services/termsService';

/**
 * Modal para mostrar Términos y Condiciones o Política de Privacidad
 * Se usa en el registro de freelancer
 */
const TermsModal = ({
  isOpen,
  onClose,
  type = 'terms' // 'terms' | 'privacy'
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [termsData, setTermsData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchTerms();
    }
  }, [isOpen, type]);

  const fetchTerms = async () => {
    setLoading(true);
    setError(null);

    const response = await termsService.getCurrentTerms(type);

    if (response.success) {
      setTermsData(response.data);
    } else {
      setError(response.error || t('terms.errorLoading'));
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  const getTitle = () => {
    if (termsData?.title) return termsData.title;
    return type === 'terms'
      ? t('terms.termsAndConditions')
      : t('terms.privacyPolicy');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-stretch sm:items-center justify-center p-0 sm:p-4">
        <div className="relative bg-white sm:rounded-xl shadow-2xl w-full max-w-3xl h-full sm:h-auto sm:max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">
                  {getTitle()}
                </h2>
                {termsData?.version && (
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {t('terms.version')}: {termsData.version}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full flex-shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 sm:py-12">
                <DocumentTextIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-500">{error}</p>
                <button
                  onClick={fetchTerms}
                  className="mt-3 sm:mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('common.retry')}
                </button>
              </div>
            ) : (
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: termsData?.content || '' }}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 sm:gap-3 p-3 sm:p-4 lg:p-6 border-t border-gray-200 bg-gray-50 sm:rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

TermsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['terms', 'privacy'])
};

export default TermsModal;
