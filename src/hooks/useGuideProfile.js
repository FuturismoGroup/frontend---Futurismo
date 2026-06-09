import { useTranslation } from 'react-i18next';
import { LEVEL_COLORS, GUIDE_STATUS } from '../constants/guidesConstants';
import { getLanguageName } from '../config/languages';

const useGuideProfile = (guide) => {
  const { t } = useTranslation();

  const getLanguageInfo = (langCode) => {
    const name = getLanguageName(langCode);
    return { name, code: langCode };
  };

  const getMuseumInfo = (museumName) => {
    return { name: museumName || t('guides.profile.unknownMuseum') };
  };

  const getLevelInfo = (level) => {
    const normalized = (level || '').toLowerCase();
    const color = LEVEL_COLORS[normalized] || LEVEL_COLORS.principiante;
    // Fallback: si la clave no existe, devuelve la palabra con primera letra mayúscula
    const fallback = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '';
    const label = t(`guides.levels.${normalized}`, fallback);
    return { color, label };
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'G';
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const isActive = guide?.status === GUIDE_STATUS.active;

  // Normaliza el tipo crudo del backend a una clave conocida en guides.types
  // Backend puede devolver: 'AGENCY' | 'PLANT' | 'FREELANCE' | 'planta' | 'freelance'
  const normalizeGuideType = (type) => {
    const key = (type || '').toLowerCase();
    if (key === 'agency' || key === 'plant' || key === 'planta') return 'planta';
    if (key === 'freelance') return 'freelance';
    return key;
  };

  const getGuideTypeLabel = (type) => {
    const normalized = normalizeGuideType(type);
    if (!normalized) return t('guides.types.unknown', 'Sin tipo');
    // Default value as second arg para fallback claro si la clave faltase
    return t(`guides.types.${normalized}`, normalized);
  };

  const getGuideTypeColor = (type) => {
    const normalized = normalizeGuideType(type);
    return normalized === 'planta'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const stats = {
    toursCompleted: guide?.stats?.toursCompleted || 0,
    yearsExperience: guide?.yearsOfExperience || guide?.years_of_experience || guide?.stats?.yearsExperience || 0,
    certifications: Array.isArray(guide?.certifications) ? guide.certifications.length : (guide?.stats?.certifications || 0),
    rating: parseFloat(guide?.rating) || guide?.stats?.rating || 0
  };

  return {
    t,
    getLanguageInfo,
    getMuseumInfo,
    getLevelInfo,
    getInitials,
    isActive,
    getGuideTypeLabel,
    getGuideTypeColor,
    stats,
    languages: guide?.specializations?.languages || guide?.languages || [],
    museums: guide?.specializations?.museums || guide?.museums || [],
    specialties: guide?.specialties || [],
    certifications: guide?.certifications || [],
    bio: guide?.bio || ''
  };
};

export default useGuideProfile;
