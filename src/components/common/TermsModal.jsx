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
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {getTitle()}
                </h2>
                {termsData?.version && (
                  <p className="text-sm text-gray-500">
                    {t('terms.version')}: {termsData.version}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{error}</p>
                <button
                  onClick={fetchTerms}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
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
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
