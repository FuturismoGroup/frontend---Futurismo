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
    const color = LEVEL_COLORS[level] || LEVEL_COLORS.principiante;
    const label = t(`guides.levels.${level}`) || level;
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

  const getGuideTypeLabel = (type) => {
    const key = (type || '').toLowerCase();
    return t(`guides.types.${key}`) || type;
  };

  const getGuideTypeColor = (type) => {
    return type === 'planta'
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
