import { useState, useEffect } from 'react';
import { BuildingOfficeIcon, PencilIcon, CheckIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAgencyStore } from '../../stores/agencyStore';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const CompanyDataSection = () => {
  const { t } = useTranslation();
  const currentAgency = useAgencyStore((state) => state.currentAgency);
  const actions = useAgencyStore((state) => state.actions);
  const storeLoading = useAgencyStore((state) => state.isLoading);
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    ruc: '',
    address: '',
    phone: '',
    email: ''
  });

  // Inicializar agencia si no existe currentAgency
  useEffect(() => {
    const initializeAgency = async () => {
      if (!user || currentAgency) return;

      const agencyId = user.agencyId;
      if (!agencyId) return;

      setIsInitializing(true);
      try {
        await actions.initialize(agencyId);
      } catch (error) {
        console.error('Error al inicializar agencia:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAgency();
  }, [user, currentAgency, actions]);

  // Cargar datos de la agencia cuando currentAgency cambia
  useEffect(() => {
    if (currentAgency) {
      setFormData({
        companyName: currentAgency.name || currentAgency.company_name || '',
        ruc: currentAgency.ruc || currentAgency.tax_id || '',
        address: currentAgency.address || '',
        phone: currentAgency.phone || currentAgency.contact_phone || '',
        email: currentAgency.email || currentAgency.contact_email || ''
      });
    }
  }, [currentAgency]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!currentAgency) {
      toast.error(t('profile.comp.agencyNotFound'));
      return;
    }

    setIsLocalLoading(true);

    try {
      // Transformar formData al formato del backend
      const updateData = {
        name: formData.companyName,
        company_name: formData.companyName,
        ruc: formData.ruc,
        tax_id: formData.ruc,
        address: formData.address,
        phone: formData.phone,
        contact_phone: formData.phone,
        email: formData.email,
        contact_email: formData.email
      };

      console.log('💾 Guardando datos de empresa:', updateData);

      await actions.updateAgencyProfile(updateData);

      toast.success(t('common.update'));
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      toast.error(error.message || t('errors.unexpectedError'));
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleCancel = () => {
    // Restaurar datos originales de currentAgency
    if (currentAgency) {
      setFormData({
        companyName: currentAgency.name || currentAgency.company_name || '',
        ruc: currentAgency.ruc || currentAgency.tax_id || '',
        address: currentAgency.address || '',
        phone: currentAgency.phone || currentAgency.contact_phone || '',
        email: currentAgency.email || currentAgency.contact_email || ''
      });
    }
    setIsEditing(false);
  };

  // Mostrar loading mientras se inicializa
  if (isInitializing) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-gray-600">{t('profile.comp.loadingAgencyInfo')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
      <div className="flex items-start justify-between gap-2 mb-4 sm:mb-6 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{t('profile.comp.professionalData')}</h3>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{t('profile.comp.professionalDataSubtitle')}</p>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            title={isCollapsed ? t('common.expand') : t('common.collapse')}
            aria-label={isCollapsed ? t('common.expand') : t('common.collapse')}
          >
            {isCollapsed ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronUpIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {!isCollapsed && (
          !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs sm:text-sm flex-shrink-0"
            >
              <PencilIcon className="w-4 h-4" />
              {t('common.edit')}
            </button>
          ) : (
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={isLocalLoading || storeLoading}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                {isLocalLoading || storeLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden sm:inline">{t('common.saving')}</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    {t('common.save')}
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLocalLoading || storeLoading}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <XMarkIcon className="w-4 h-4" />
                {t('common.cancel')}
              </button>
            </div>
          )
        )}
      </div>

      {!isCollapsed && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Información básica */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.companyBusinessName')} *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{formData.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.ruc')} *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.ruc}
                    onChange={(e) => handleInputChange('ruc', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.ruc}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.address')} *
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.address}</p>
                )}
              </div>

            </div>

            {/* Información de contacto */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.mainPhone')} *
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    placeholder="9XXXXXXXX (9 dígitos)"
                    maxLength="9"
                    pattern="9[0-9]{8}"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '' || (value[0] === '9' && value.length <= 9)) {
                        handleInputChange('phone', value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.mainEmail')} *
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.email}</p>
                )}
              </div>

            </div>
          </div>

          {/* Nota informativa */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">{t('profile.comp.tipLabel')}:</span> {t('profile.comp.companyInfoNote')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDataSection;