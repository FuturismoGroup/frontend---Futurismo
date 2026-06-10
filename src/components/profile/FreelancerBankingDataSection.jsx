import { useState, useEffect } from 'react';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CreditCardIcon,
  BanknotesIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import useGuidesStore from '../../stores/guidesStore';
import toast from 'react-hot-toast';
import api from '../../services/api';

const FreelancerBankingDataSection = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const updateGuide = useGuidesStore((state) => state.updateGuide);
  const isLoading = useGuidesStore((state) => state.isLoading);

  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  const [formData, setFormData] = useState({
    bankName: '',
    accountType: '',
    accountNumber: '',
    accountHolder: '',
    identificationNumber: '',
    currency: 'PEN',
    interbankCode: ''
  });

  // Cargar datos del guia usando API-014 (GetGuide) directamente con guideId
  useEffect(() => {
    const loadGuideData = async () => {
      // Usar guideId del usuario autenticado
      const guideId = user?.guideId;

      if (!guideId) return;

      setLocalLoading(true);

      try {
        // API-014 GET /api/guides/:id - Obtener detalle con bankInfo (permite rol guide)
        const detailResponse = await api.get(`/guides/${guideId}`);
        // El backend puede devolver { success, data } o directamente el objeto guía
        const result = detailResponse.data;
        const guideDetail = result.success ? result.data : (result.id ? result : null);

        if (guideDetail && guideDetail.id) {
          setCurrentGuide(guideDetail);

          // bankInfo viene del backend segun guideController
          const bankInfo = guideDetail.bankInfo || {};

          setFormData({
            bankName: bankInfo.bankName || '',
            accountType: bankInfo.accountType || 'Ahorros',
            accountNumber: bankInfo.accountNumber || '',
            accountHolder: bankInfo.accountHolder || '',
            identificationNumber: bankInfo.identificationNumber || guideDetail.dni || '',
            currency: bankInfo.currency || 'PEN',
            interbankCode: bankInfo.interbankCode || ''
          });
        } else {
          toast.error(t('errors.unexpectedError'));
        }
      } catch (error) {
        toast.error(t('errors.unexpectedError'));
      } finally {
        setLocalLoading(false);
      }
    };

    loadGuideData();
  }, [user]);

  const handleSave = async () => {
    if (!currentGuide) {
      toast.error(t('errors.unexpectedError'));
      return;
    }

    setLocalLoading(true);

    try {
      // API-015: PUT /api/guides/:id
      // Backend espera campos planos: bankName, accountType, accountNumber, etc.
      // Segun 04_apis_lista.md lineas 1188-1203
      const updateData = {
        bankName: formData.bankName,
        accountType: formData.accountType,
        accountNumber: formData.accountNumber,
        accountHolder: formData.accountHolder,
        interbankCode: formData.interbankCode,
        currency: formData.currency
        // identificationNumber no se envia - es el DNI del titular, no un campo de guide
      };

      await updateGuide(currentGuide.id, updateData);

      toast.success(t('common.update'));
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || t('errors.unexpectedError'));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancel = () => {
    // Restaurar datos originales desde currentGuide.bankInfo
    if (currentGuide) {
      const bankInfo = currentGuide.bankInfo || {};
      setFormData({
        bankName: bankInfo.bankName || '',
        accountType: bankInfo.accountType || 'Ahorros',
        accountNumber: bankInfo.accountNumber || '',
        accountHolder: bankInfo.accountHolder || '',
        identificationNumber: bankInfo.identificationNumber || currentGuide.dni || '',
        currency: bankInfo.currency || 'PEN',
        interbankCode: bankInfo.interbankCode || ''
      });
    }
    setIsEditing(false);
  };

  const bankOptions = [
    'Banco de Crédito del Perú',
    'BBVA',
    'Interbank',
    'Scotiabank',
    'Banco de la Nación',
    'Banco Continental',
    'Banco Financiero',
    'Banco Falabella',
    'Banco Ripley'
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center min-w-0 flex-1">
            <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{t('profile.comp.bankingData')}</h3>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                {t('common.edit')}
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={localLoading || isLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {localLoading || isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('common.saving')}
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1" />
                      {t('common.save')}
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  {t('common.cancel')}
                </button>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {isCollapsed ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronUpIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3 sm:p-4 lg:p-6">
          {localLoading && !currentGuide ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">{t('profile.comp.loadingData')}</span>
            </div>
          ) : !currentGuide ? (
            <div className="text-center py-8 text-gray-500">
              {t('profile.comp.noBankingDataFound')}
            </div>
          ) : (
          <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <BanknotesIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">{t('profile.comp.importantInfo')}:</p>
                <p>{t('profile.comp.bankingImportantNote')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.comp.bank')} *
              </label>
              {isEditing ? (
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {bankOptions.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900 py-2">{formData.bankName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.comp.accountType')} *
              </label>
              {isEditing ? (
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Ahorros">{t('profile.comp.savingsAccount')}</option>
                  <option value="Corriente">{t('profile.comp.checkingAccount')}</option>
                </select>
              ) : (
                <p className="text-gray-900 py-2">{t('profile.comp.accountOf')} {formData.accountType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.comp.accountNumber')} *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="194-12345678-0-12"
                />
              ) : (
                <p className="text-gray-900 py-2 font-mono">{formData.accountNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.comp.interbankCode')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.interbankCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, interbankCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="002-194-001234567812"
                />
              ) : (
                <p className="text-gray-900 py-2 font-mono">{formData.interbankCode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.comp.accountHolder')} *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('profile.comp.holderFullNamePlaceholder')}
                />
              ) : (
                <p className="text-gray-900 py-2">{formData.accountHolder}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <IdentificationIcon className="inline w-4 h-4 mr-1" />
                {t('profile.comp.holderDNI')} *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.identificationNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, identificationNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12345678"
                />
              ) : (
                <p className="text-gray-900 py-2">{formData.identificationNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.comp.currency')}
              </label>
              {isEditing ? (
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PEN">{t('profile.comp.soles')}</option>
                  <option value="USD">{t('profile.comp.dollars')}</option>
                </select>
              ) : (
                <p className="text-gray-900 py-2">
                  {formData.currency === 'PEN' ? t('profile.comp.soles') : t('profile.comp.dollars')}
                </p>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm text-green-800">
                  {t('profile.comp.bankingVerified')}
                </p>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      )}
    </div>
  );
};

export default FreelancerBankingDataSection;