import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  LanguageIcon,
  SparklesIcon,
  AcademicCapIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import useGuideProfile from '../../hooks/useGuideProfile';
import ProfileHeader from './ProfileHeader';
import PersonalInfoCard from './PersonalInfoCard';
import GuideStatsCard from './GuideStatsCard';
import MuseumSpecializationCard from './MuseumSpecializationCard';

const GuideProfile = ({ guide, onClose, onEdit }) => {
  const { t } = useTranslation();
  const {
    getInitials,
    getGuideTypeLabel,
    getGuideTypeColor,
    getLanguageInfo,
    getMuseumInfo,
    getLevelInfo,
    isActive,
    stats,
    languages,
    museums,
    specialties,
    certifications,
    bio
  } = useGuideProfile(guide);

  return (
    <div className="p-0">
      <ProfileHeader
        guide={guide}
        initials={getInitials(guide?.fullName)}
        guideTypeLabel={getGuideTypeLabel(guide?.guideType)}
        guideTypeColor={getGuideTypeColor(guide?.guideType)}
        rating={stats.rating}
        onEdit={onEdit}
        onClose={onClose}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Left column - Personal information */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <PersonalInfoCard
            guide={guide}
            isActive={isActive}
          />

          <GuideStatsCard
            stats={stats}
          />
        </div>

        {/* Right column - Specializations & details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Bio */}
          {bio && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {t('guides.profile.bio', 'Biografía')}
                </h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{bio}</p>
            </div>
          )}

          {/* Idiomas */}
          {languages.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <LanguageIcon className="h-5 w-5 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {t('guides.profile.languages', 'Idiomas')}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang, idx) => {
                  const code = typeof lang === 'object' ? lang.code : lang;
                  const info = getLanguageInfo(code);
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {info.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Especialidades */}
          {specialties.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="h-5 w-5 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {t('guides.profile.specialties', 'Especialidades')}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certificaciones */}
          {certifications.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AcademicCapIcon className="h-5 w-5 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {t('guides.profile.certifications', 'Certificaciones')}
                </h3>
              </div>
              <ul className="space-y-2">
                {certifications.map((cert, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <AcademicCapIcon className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{typeof cert === 'object' ? (cert.name || cert.title || JSON.stringify(cert)) : cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Museos */}
          <MuseumSpecializationCard
            museums={museums}
            getMuseumInfo={getMuseumInfo}
            getLevelInfo={getLevelInfo}
          />
        </div>
      </div>
    </div>
  );
};

GuideProfile.propTypes = {
  guide: PropTypes.shape({
    id: PropTypes.string,
    fullName: PropTypes.string,
    dni: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    address: PropTypes.string,
    guideType: PropTypes.string,
    status: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    yearsOfExperience: PropTypes.number,
    bio: PropTypes.string,
    languages: PropTypes.array,
    museums: PropTypes.array,
    specialties: PropTypes.array,
    certifications: PropTypes.array
  }),
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

export default GuideProfile;