import { useState, useEffect } from 'react';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  IdentificationIcon,
  PhoneIcon,
  EnvelopeIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import useGuidesStore from '../../stores/guidesStore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';

const FreelancerPersonalDataSection = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const updateGuide = useGuidesStore((state) => state.updateGuide);
  const isLoading = useGuidesStore((state) => state.isLoading);

  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    documentType: 'DNI',
    documentNumber: '',
    city: '',
    profilePhoto: null
  });

  // Cargar datos del guía
  useEffect(() => {
    const loadGuideData = async () => {
      // Usar guideId del usuario autenticado
      const guideId = user?.guideId;

      if (!guideId) return;

      setLocalLoading(true);

      try {
        // Usar endpoint específico GET /api/guides/:id (permite rol guide)
        const response = await api.get(`/guides/${guideId}`);
        // El backend puede devolver { success, data } o directamente el objeto guía
        const result = response.data;
        const userGuide = result.success ? result.data : (result.id ? result : null);

        if (userGuide && userGuide.id) {
          setCurrentGuide(userGuide);
          setFormData({
            firstName: userGuide.user?.first_name || userGuide.first_name || '',
            lastName: userGuide.user?.last_name || userGuide.last_name || '',
            email: userGuide.user?.email || userGuide.email || '',
            phone: userGuide.phone || userGuide.contact_phone || '',
            documentType: userGuide.documents?.type || 'DNI',
            documentNumber: userGuide.documents?.dni || userGuide.dni || '',
            city: userGuide.city || '',
            profilePhoto: userGuide.profile_photo || userGuide.avatar || null
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

    // Validaciones antes de guardar
    if (formData.phone && formData.phone.length !== 9) {
      toast.error(t('validation.phoneDigits', { defaultValue: 'El teléfono debe tener exactamente 9 dígitos' }));
      setLocalLoading(false);
      return;
    }

    if (formData.documentType === 'DNI' && formData.documentNumber && formData.documentNumber.length !== 8) {
      toast.error(t('validation.dniDigits', { defaultValue: 'El DNI debe tener exactamente 8 dígitos' }));
      setLocalLoading(false);
      return;
    }

    try {
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        contact_phone: formData.phone,
        documents: {
          type: formData.documentType,
          dni: formData.documentNumber
        },
        dni: formData.documentNumber,
        city: formData.city,
        profile_photo: formData.profilePhoto,
        avatar: formData.profilePhoto
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
    // Restaurar datos originales
    if (currentGuide) {
      setFormData({
        firstName: currentGuide.first_name || '',
        lastName: currentGuide.last_name || '',
        email: currentGuide.email || '',
        phone: currentGuide.phone || currentGuide.contact_phone || '',
        documentType: currentGuide.documents?.type || 'DNI',
        documentNumber: currentGuide.documents?.dni || currentGuide.dni || '',
        city: currentGuide.city || '',
        profilePhoto: currentGuide.profile_photo || currentGuide.avatar || null
      });
    }
    setIsEditing(false);
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploadingPhoto(true);
      
      // Simular subida de foto
      const reader = new FileReader();
      reader.onload = (e) => {
        setTimeout(() => {
          setFormData(prev => ({
            ...prev,
            profilePhoto: e.target.result
          }));
          setIsUploadingPhoto(false);
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">{t('profile.comp.personalData')}</h3>
          </div>
          <div className="flex items-center space-x-2">
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
        <div className="p-6">
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
              {t('profile.comp.noProfileData')}
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Foto de perfil */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.comp.profilePhoto')}
              </label>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {formData.profilePhoto ? (
                      <img
                        src={formData.profilePhoto}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <UserIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                      <CameraIcon className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {isUploadingPhoto && (
                  <p className="text-sm text-blue-600 mt-2">{t('profile.comp.uploadingPhoto')}</p>
                )}
              </div>
            </div>

            {/* Datos personales */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.comp.firstName')} *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{formData.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.comp.lastName')} *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{formData.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <IdentificationIcon className="inline w-4 h-4 mr-1" />
                    {t('profile.comp.documentType')}
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.documentType}
                      onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="DNI">DNI</option>
                      <option value="CE">{t('profile.comp.foreignId')}</option>
                      <option value="Passport">{t('profile.comp.passport')}</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 py-2">{formData.documentType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.comp.documentNumber')} *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder={formData.documentType === 'DNI' ? '8 dígitos' : 'Máx. 12 caracteres'}
                      maxLength={formData.documentType === 'DNI' ? 8 : 12}
                      value={formData.documentNumber}
                      onChange={(e) => {
                        const value = formData.documentType === 'DNI'
                          ? e.target.value.replace(/[^0-9]/g, '').slice(0, 8)
                          : e.target.value.slice(0, 12);
                        setFormData(prev => ({ ...prev, documentNumber: value }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{formData.documentNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <EnvelopeIcon className="inline w-4 h-4 mr-1" />
                    Email *
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{formData.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PhoneIcon className="inline w-4 h-4 mr-1" />
                    Teléfono *
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
                          setFormData(prev => ({ ...prev, phone: value }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{formData.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.comp.city')}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Lima, Cusco, Arequipa"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{formData.city || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FreelancerPersonalDataSection;