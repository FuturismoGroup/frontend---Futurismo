import { useState, useEffect } from 'react';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BriefcaseIcon,
  IdentificationIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  StarIcon,
  MapPinIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import useGuidesStore from '../../stores/guidesStore';
import LanguageMultiSelect from '../common/LanguageMultiSelect';
import { AVAILABLE_LANGUAGES, normalizeLanguageCode, getLanguageName } from '../../config/languages';
import { GUIDE_SPECIALTIES } from '../../constants/guidesConstants';
import toast from 'react-hot-toast';
import api from '../../services/api';

const getLanguageDisplayName = getLanguageName;

const FreelancerProfessionalDataSection = () => {
  const { t } = useTranslation();

  // Mapear value de especialidad a su label traducido
  const getSpecialtyDisplayName = (value) => {
    const found = GUIDE_SPECIALTIES.find(s => s.value === value);
    return found?.labelKey ? t(found.labelKey) : value;
  };
  // Convertir array de values a string de labels traducidos
  const specialtiesToDisplay = (arr) =>
    arr.map(v => getSpecialtyDisplayName(v)).join(', ');
  // Convertir string de labels a array de values para guardar
  const displayToSpecialties = (str) => {
    const labelToValue = Object.fromEntries(
      GUIDE_SPECIALTIES.map(s => [t(s.labelKey).toLowerCase(), s.value])
    );
    return str.split(',').map(s => s.trim()).filter(Boolean)
      .map(label => labelToValue[label.toLowerCase()] || label);
  };
  const { user } = useAuthStore();
  const updateGuide = useGuidesStore((state) => state.updateGuide);
  const isStoreLoading = useGuidesStore((state) => state.isLoading);

  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  const [formData, setFormData] = useState({
    licenseNumber: '',
    experience: '',
    specialties: '',
    languages: [],
    yearsOfExperience: 0,
    education: '',
    certifications: [],
    workZones: [],
    museums: []
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

          // Extraer y normalizar codes de idiomas para LanguageMultiSelect
          // DB puede tener legacy 'spanish' o ISO 'es' → siempre convertir a ISO
          const languageCodes = Array.isArray(userGuide.languages)
            ? userGuide.languages
                .map(lang => normalizeLanguageCode(typeof lang === 'string' ? lang : lang?.code))
                .filter(Boolean)
            : [];

          setFormData({
            licenseNumber: userGuide.licenseNumber || userGuide.documents?.license_number || userGuide.license_number || '',
            experience: userGuide.bio || userGuide.experience || '',
            specialties: Array.isArray(userGuide.specialties) ? specialtiesToDisplay(userGuide.specialties) : (userGuide.specialties || ''),
            languages: languageCodes,
            yearsOfExperience: userGuide.yearsOfExperience || userGuide.experience_years || 0,
            education: userGuide.education || '',
            certifications: Array.isArray(userGuide.certifications) ? userGuide.certifications : [],
            workZones: Array.isArray(userGuide.workZones || userGuide.work_zones) ? (userGuide.workZones || userGuide.work_zones) : [],
            museums: Array.isArray(userGuide.museums) ? userGuide.museums : []
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
      const updateData = {
        licenseNumber: formData.licenseNumber,
        bio: formData.experience,
        specialties: displayToSpecialties(formData.specialties),
        languages: formData.languages.map(code => typeof code === 'string' ? { code, level: 'fluent' } : code),
        yearsOfExperience: formData.yearsOfExperience,
        education: formData.education,
        certifications: formData.certifications,
        work_zones: formData.workZones,
        museums: formData.museums
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
      const languageCodes = Array.isArray(currentGuide.languages)
        ? currentGuide.languages
            .map(lang => normalizeLanguageCode(typeof lang === 'string' ? lang : lang?.code))
            .filter(Boolean)
        : [];
      setFormData({
        licenseNumber: currentGuide.licenseNumber || currentGuide.license_number || '',
        experience: currentGuide.bio || currentGuide.experience || '',
        specialties: Array.isArray(currentGuide.specialties) ? specialtiesToDisplay(currentGuide.specialties) : (currentGuide.specialties || ''),
        languages: languageCodes,
        yearsOfExperience: currentGuide.yearsOfExperience || currentGuide.experience_years || 0,
        education: currentGuide.education || '',
        certifications: Array.isArray(currentGuide.certifications) ? currentGuide.certifications : [],
        workZones: Array.isArray(currentGuide.workZones || currentGuide.work_zones) ? (currentGuide.workZones || currentGuide.work_zones) : [],
        museums: Array.isArray(currentGuide.museums) ? currentGuide.museums : []
      });
    }
    setIsEditing(false);
  };

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const updateCertification = (index, value) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => i === index ? value : cert)
    }));
  };

  // Helpers para workZones
  const addWorkZone = () => {
    setFormData(prev => ({ ...prev, workZones: [...prev.workZones, ''] }));
  };
  const removeWorkZone = (index) => {
    setFormData(prev => ({ ...prev, workZones: prev.workZones.filter((_, i) => i !== index) }));
  };
  const updateWorkZone = (index, value) => {
    setFormData(prev => ({ ...prev, workZones: prev.workZones.map((z, i) => i === index ? value : z) }));
  };

  // Helpers para museums
  const addMuseum = () => {
    setFormData(prev => ({ ...prev, museums: [...prev.museums, ''] }));
  };
  const removeMuseum = (index) => {
    setFormData(prev => ({ ...prev, museums: prev.museums.filter((_, i) => i !== index) }));
  };
  const updateMuseum = (index, value) => {
    setFormData(prev => ({ ...prev, museums: prev.museums.map((m, i) => i === index ? value : m) }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center min-w-0 flex-1">
            <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{t('profile.comp.professionalInfo')}</h3>
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
                  disabled={localLoading || isStoreLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {localLoading || isStoreLoading ? (
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
                  disabled={localLoading || isStoreLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
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
              {t('profile.comp.noProfessionalData')}
            </div>
          ) : (
          <>
          {/* Información básica profesional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <IdentificationIcon className="inline w-4 h-4 mr-1" />
                {t('profile.comp.guideLicenseNumber')} *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="LIC-2024-001"
                />
              ) : (
                <p className="text-gray-900 py-2">{formData.licenseNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <StarIcon className="inline w-4 h-4 mr-1" />
                {t('profile.comp.yearsOfExperience')}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="50"
                />
              ) : (
                <p className="text-gray-900 py-2">{formData.yearsOfExperience} {t('profile.comp.years')}</p>
              )}
            </div>
          </div>

          {/* Idiomas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <GlobeAltIcon className="inline w-4 h-4 mr-1" />
              {t('profile.comp.languagesSpoken')}
            </label>
            {isEditing ? (
              <LanguageMultiSelect
                value={formData.languages}
                onChange={(languages) => setFormData(prev => ({ ...prev, languages }))}
                placeholder="Selecciona los idiomas que dominas"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((langCode, index) => {
                  if (!langCode) return null;
                  const displayName = getLanguageDisplayName(langCode);
                  const langObj = AVAILABLE_LANGUAGES.find(l => l.code === langCode);

                  return (
                    <span key={index} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {langObj?.flag && <span>{langObj.flag}</span>}
                      {displayName}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Experiencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.comp.professionalExperience')} *
            </label>
            {isEditing ? (
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe tu experiencia como guía turístico..."
              />
            ) : (
              <p className="text-gray-900 py-2 whitespace-pre-wrap">{formData.experience}</p>
            )}
          </div>

          {/* Especialidades */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.comp.specialties')} *
            </label>
            {isEditing ? (
              <textarea
                value={formData.specialties}
                onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Tours culturales, historia inca, gastronomía..."
              />
            ) : (
              <div className="flex flex-wrap gap-2 py-2">
                {formData.specialties.split(',').map(s => s.trim()).filter(Boolean).map((spec, idx) => (
                  <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {getSpecialtyDisplayName(spec)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Educación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AcademicCapIcon className="inline w-4 h-4 mr-1" />
              {t('profile.comp.education')}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.education}
                onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Título académico y universidad"
              />
            ) : (
              <p className="text-gray-900 py-2">{formData.education}</p>
            )}
          </div>

          {/* Certificaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.comp.certifications')}
            </label>
            {isEditing ? (
              <div className="space-y-2">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => updateCertification(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre de la certificación"
                    />
                    <button
                      onClick={() => removeCertification(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addCertification}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + {t('profile.comp.addCertification')}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-900 break-words min-w-0">{cert}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zonas de Trabajo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPinIcon className="inline w-4 h-4 mr-1" />
              {t('profile.comp.workZones')}
            </label>
            {isEditing ? (
              <div className="space-y-2">
                {formData.workZones.map((zone, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={typeof zone === 'string' ? zone : (zone?.name || '')}
                      onChange={(e) => updateWorkZone(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Lima Centro, Miraflores, Cusco..."
                    />
                    <button
                      onClick={() => removeWorkZone(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addWorkZone}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + {t('profile.comp.addWorkZone')}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {formData.workZones.length > 0 ? formData.workZones.map((zone, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-900 break-words min-w-0">{typeof zone === 'string' ? zone : (zone?.name || '')}</span>
                  </div>
                )) : (
                  <p className="text-gray-400 italic text-sm">{t('profile.comp.noWorkZones')}</p>
                )}
              </div>
            )}
          </div>

          {/* Museos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BuildingLibraryIcon className="inline w-4 h-4 mr-1" />
              {t('profile.comp.museumExperience')}
            </label>
            {isEditing ? (
              <div className="space-y-2">
                {formData.museums.map((museum, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={typeof museum === 'string' ? museum : (museum?.name || '')}
                      onChange={(e) => updateMuseum(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre del museo"
                    />
                    <button
                      onClick={() => removeMuseum(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addMuseum}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + {t('profile.comp.addMuseum')}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {formData.museums.length > 0 ? formData.museums.map((museum, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <BuildingLibraryIcon className="w-4 h-4 text-orange-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-900 break-words min-w-0">{typeof museum === 'string' ? museum : (museum?.name || '')}</span>
                  </div>
                )) : (
                  <p className="text-gray-400 italic text-sm">{t('profile.comp.noMuseumExperience')}</p>
                )}
              </div>
            )}
          </div>
          </>
          )}
        </div>
      )}
    </div>
  );
};

export default FreelancerProfessionalDataSection;