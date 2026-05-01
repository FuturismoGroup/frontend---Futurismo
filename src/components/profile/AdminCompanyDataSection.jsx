import { useState, useEffect } from 'react';
import { BuildingOfficeIcon, PencilIcon, CheckIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminCompanyDataSection = () => {
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    companyName: '',
    ruc: '',
    address: '',
    phone: '',
    email: '',
    accountNumber: '',
    accountCCI: ''
  });

  const [originalData, setOriginalData] = useState({});

  // Cargar datos de configuración del sistema
  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const response = await api.get('/config/system');
        const data = response.data;

        const companyData = {
          companyName: data.companyName || '',
          ruc: data.companyRuc || '',
          address: data.companyAddress || '',
          phone: data.companyPhone || '',
          email: data.companyEmail || '',
          accountNumber: data.accountNumber || '',
          accountCCI: data.accountCCI || ''
        };

        setFormData(companyData);
        setOriginalData(companyData);
      } catch (error) {
        console.error('Error cargando datos de empresa:', error);
        toast.error(t('profile.comp.errorLoadingCompany'));
      } finally {
        setInitialLoading(false);
      }
    };

    loadCompanyData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const updateData = {
        companyName: formData.companyName,
        companyRuc: formData.ruc,
        companyAddress: formData.address,
        companyPhone: formData.phone,
        companyEmail: formData.email,
        accountNumber: formData.accountNumber,
        accountCCI: formData.accountCCI
      };

      console.log('💾 Guardando datos de empresa:', updateData);

      await api.put('/config/system', updateData);

      setOriginalData(formData);
      toast.success(t('profile.comp.companyUpdated'));
      setIsEditing(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error(error.response?.data?.error || error.message || t('errors.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  if (initialLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{t('profile.comp.companyInfo')}</h3>
            <p className="text-sm text-gray-500">{t('profile.comp.companyInfoSubtitle')}</p>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={isCollapsed ? t('common.expand') : t('common.collapse')}
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
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              {t('common.edit')}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.saving')}
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
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.companyName')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('profile.comp.companyNamePlaceholder')}
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {formData.companyName || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.ruc')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.ruc}
                    onChange={(e) => handleInputChange('ruc', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('profile.comp.rucPlaceholder')}
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {formData.ruc || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.address')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('profile.comp.addressPlaceholder')}
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {formData.address || '-'}
                  </p>
                )}
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.phone')}
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+51 999 999 999"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {formData.phone || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.corporateEmail')}
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="correo@empresa.com"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {formData.email || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.accountNumber')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Banco: XXX-XXXXXXX-X-XX"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg font-mono">
                    {formData.accountNumber || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CCI en una fila completa */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.comp.cci')}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.accountCCI}
                onChange={(e) => handleInputChange('accountCCI', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="XXX-XXX-XXXXXXXXXXXX-XX"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg font-mono">
                {formData.accountCCI || '-'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCompanyDataSection;
