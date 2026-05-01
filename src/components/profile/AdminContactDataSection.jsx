import { useState, useEffect } from 'react';
import { PhoneIcon, PencilIcon, CheckIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminContactDataSection = () => {
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    personalPhone: '',
    officePhone: '',
    emergencyPhone: '',
    adminEmail: ''
  });

  const [originalData, setOriginalData] = useState({});

  // Cargar datos de configuración del sistema
  useEffect(() => {
    const loadContactData = async () => {
      try {
        const response = await api.get('/config/system');
        const data = response.data;

        const contactData = {
          personalPhone: data.adminPersonalPhone || '',
          officePhone: data.adminOfficePhone || '',
          emergencyPhone: data.adminEmergencyPhone || '',
          adminEmail: data.adminEmail || ''
        };

        setFormData(contactData);
        setOriginalData(contactData);
      } catch (error) {
        console.error('Error cargando datos de contacto:', error);
        toast.error(t('profile.comp.errorLoadingContact'));
      } finally {
        setInitialLoading(false);
      }
    };

    loadContactData();
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
        adminPersonalPhone: formData.personalPhone,
        adminOfficePhone: formData.officePhone,
        adminEmergencyPhone: formData.emergencyPhone,
        adminEmail: formData.adminEmail
      };

      console.log('💾 Guardando datos de contacto:', updateData);

      await api.put('/config/system', updateData);

      setOriginalData(formData);
      toast.success(t('profile.comp.contactUpdated'));
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
            {[...Array(4)].map((_, i) => (
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
          <div className="p-2 bg-green-100 rounded-lg">
            <PhoneIcon className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{t('profile.comp.contactData')}</h3>
            <p className="text-sm text-gray-500">{t('profile.comp.adminContactSubtitle')}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.comp.personalPhone')}
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.personalPhone}
                onChange={(e) => handleInputChange('personalPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="+51 999 999 999"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {formData.personalPhone || '-'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.comp.officePhone')}
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.officePhone}
                onChange={(e) => handleInputChange('officePhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="+51 (01) 999-9999"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {formData.officePhone || '-'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.comp.emergencyPhone')}
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="+51 999 999 999"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {formData.emergencyPhone || '-'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.comp.adminEmail')}
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@empresa.com"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {formData.adminEmail || '-'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactDataSection;
