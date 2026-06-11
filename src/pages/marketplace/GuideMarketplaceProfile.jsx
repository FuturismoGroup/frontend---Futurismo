import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  StarIcon,
  MapPinIcon,
  LanguageIcon,
  CheckBadgeIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftRightIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import useMarketplaceStore from '../../stores/marketplaceStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import GuideAvailabilityCalendar from '../../components/marketplace/GuideAvailabilityCalendar';
import { useTranslation } from 'react-i18next';
import { getLanguageName } from '../../config/languages';
import { resolveFileUrl } from '../../utils/fileUrl';

const GuideMarketplaceProfile = () => {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const {
    currentGuide,
    reviews,
    isLoading,
    fetchGuideProfile,
    fetchGuideReviews
  } = useMarketplaceStore();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('about');
  const [isFavorite, setIsFavorite] = useState(false);

  // Helper: parsea campos JSON que pueden llegar como string desde el backend
  const safeArray = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return []; }
    }
    return [];
  };

  const levelNames = {
    fluent: t('guides.levels.nativo'),
    native: t('guides.levels.nativo'),
    intermediate: t('guides.levels.intermedio'),
    basic: t('guides.levelOptions.basic'),
    advanced: t('guides.levelOptions.advanced'),
    beginner: t('guides.levels.principiante')
  };

  useEffect(() => {
    loadGuideData();
  }, [guideId]);

  const loadGuideData = async () => {
    try {
      await fetchGuideProfile(guideId);
      await fetchGuideReviews(guideId);
    } catch (error) {
      console.error('Error loading guide:', error);
      navigate('/marketplace');
    }
  };

  const handleBooking = () => {
    navigate(`/marketplace/book/${guideId}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: t('marketplace.profile.shareTitle', { name: guide.fullName || guide.name }),
        text: guide.bio || '',
        url: window.location.href
      });
    }
  };

  const handleSendMessage = () => {
    const guideName = guide.fullName || guide.name;
    const guideUserId = guide.userId || guide.user_id;
    if (!guideUserId) {
      console.error('No se encontró el userId del guía');
      return;
    }
    navigate(`/chat?guide=${guideUserId}&name=${encodeURIComponent(guideName)}`);
  };

  // Derivar badge de nivel según años de experiencia
  const getExperienceBadge = (years) => {
    if (!years || years <= 0) return null;
    if (years < 3) return { label: t('marketplace.profile.levelBeginner'), className: 'bg-blue-100 text-blue-800' };
    if (years < 8) return { label: t('marketplace.profile.levelIntermediate'), className: 'bg-yellow-100 text-yellow-800' };
    return { label: t('marketplace.profile.levelExpert'), className: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentGuide) {
    return null;
  }

  const guide = currentGuide;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con imagen de fondo */}
      <div className="relative h-[24rem] sm:h-96 bg-gradient-to-br from-cyan-600 to-blue-600">
        {/* Navegación */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <button
            onClick={() => navigate('/marketplace')}
            className="inline-flex items-center text-white hover:text-cyan-200 transition-colors text-sm sm:text-base"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1 flex-shrink-0" />
            {t('marketplace.profile.backToMarketplace')}
          </button>
        </div>

        {/* Información principal */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 sm:p-8 pt-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
              <img
                src={resolveFileUrl(guide.profileImage || guide.profilePhoto || guide.guidePhoto) || `https://ui-avatars.com/api/?name=${guide.name}&background=random`}
                alt={guide.name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center justify-center sm:justify-start gap-2 sm:gap-3 break-words">
                      <span className="break-words">{guide.name}</span>
                      {guide.verified && (
                        <CheckBadgeIcon className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-400 flex-shrink-0" />
                      )}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-sm sm:text-base text-white/90">
                      <div className="flex items-center gap-1">
                        {guide.reviewCount > 0 ? (
                          <>
                            <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                            <span className="font-semibold">{parseFloat(guide.rating).toFixed(1)}</span>
                            <span>({guide.reviewCount} {guide.reviewCount === 1 ? t('marketplace.messages.reviewSingular') : t('marketplace.messages.reviewPlural')})</span>
                          </>
                        ) : (
                          <span className="text-white/70 italic">{t('marketplace.profile.newInMarketplace')}</span>
                        )}
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <span>{t('marketplace.profile.toursCompletedCount', { count: guide.completedTours || 0 })}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{t('marketplace.profile.joinedIn', { year: new Date(guide.joinedDate || Date.now()).getFullYear() })}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                    >
                      {isFavorite ? (
                        <HeartIcon className="h-6 w-6 text-red-500" />
                      ) : (
                        <HeartOutlineIcon className="h-6 w-6 text-white" />
                      )}
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                    >
                      <ShareIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Información principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px overflow-x-auto">
                  {['about', 'experience', 'reviews', 'availability'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-shrink-0 sm:flex-1 py-4 px-4 sm:px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                        activeTab === tab
                          ? 'border-cyan-500 text-cyan-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab === 'about' && t('marketplace.profile.tabAbout')}
                      {tab === 'experience' && t('marketplace.profile.tabExperience')}
                      {tab === 'reviews' && t('marketplace.messages.reviewsTab')}
                      {tab === 'availability' && t('marketplace.profile.tabAvailability')}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Tab: Acerca de */}
                {activeTab === 'about' && (
                  <div className="space-y-6">
                    {/* Bio */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('marketplace.profile.aboutMe')}</h3>
                      {guide.bio ? (
                        <p className="text-gray-600">{guide.bio}</p>
                      ) : (
                        <p className="text-gray-400 italic">{t('marketplace.profile.profileNotCompleted')}</p>
                      )}
                    </div>

                    {/* Idiomas */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <LanguageIcon className="h-5 w-5 text-gray-400" />
                        {t('marketplace.profile.languages')}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {(() => {
                          const langs = safeArray(guide.languages);
                          if (langs.length === 0) {
                            return <p className="text-gray-400 italic col-span-2">{t('marketplace.profile.noLanguages')}</p>;
                          }
                          return langs.map((lang, index) => {
                            const langCode = typeof lang === 'string' ? lang : (lang?.code || lang?.name || lang?.language || '');
                            const langLevel = typeof lang === 'object' && lang?.level ? lang.level : null;
                            const langName = getLanguageName(langCode);
                            return (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">{langName}</p>
                                  {langLevel && <p className="text-sm text-gray-600">{levelNames[langLevel.toLowerCase()] || langLevel}</p>}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Especialidades */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                        {t('marketplace.profile.specialties')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const specs = safeArray(guide.specialties);
                          if (specs.length === 0) {
                            return <p className="text-gray-400 italic">{t('marketplace.profile.noSpecialties')}</p>;
                          }
                          return specs.map((type, index) => {
                            const label = typeof type === 'string' ? type : (type?.name || type?.specialty || String(type));
                            return (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800 capitalize"
                              >
                                {label}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Zonas de trabajo */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                        {t('marketplace.profile.workZones')}
                      </h3>
                      <div className="space-y-2">
                        {(() => {
                          const zones = safeArray(guide.workZones);
                          if (zones.length === 0) {
                            return <p className="text-gray-400 italic">{t('marketplace.profile.noWorkZones')}</p>;
                          }
                          return zones.map((zone, index) => {
                            const label = typeof zone === 'string' ? zone : (zone?.name || zone?.zone || String(zone));
                            return (
                              <div key={index} className="flex items-start gap-2">
                                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                                <span className="text-gray-700">{label}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Experiencia en Museos */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <BuildingLibraryIcon className="h-5 w-5 text-gray-400" />
                        {t('marketplace.profile.museumExperience')}
                      </h3>
                      {(() => {
                        const museums = safeArray(guide.museums);
                        if (museums.length === 0) {
                          return <p className="text-gray-400 italic">{t('marketplace.profile.noMuseumExperience')}</p>;
                        }
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {museums.map((museum, index) => (
                              <div key={index} className="border border-orange-200 rounded-lg bg-orange-50 p-3">
                                <p className="font-medium text-orange-800 text-sm">
                                  {typeof museum === 'string' ? museum : museum.name || t('marketplace.profile.museumNumber', { number: index + 1 })}
                                </p>
                                {typeof museum === 'object' && (
                                  <div className="mt-1 text-xs text-orange-600 space-y-0.5">
                                    {museum.years && <p>{t('marketplace.profile.yearsExperienceCount', { count: museum.years })}</p>}
                                    {museum.expertise && <p>{t('marketplace.profile.levelLabel')}: {museum.expertise}</p>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Tab: Experiencia */}
                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    {/* Experiencia con grupos */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <UserGroupIcon className="h-5 w-5 text-gray-400" />
                        {t('marketplace.profile.professionalExperience')}
                      </h3>
                      {guide.yearsOfExperience && guide.yearsOfExperience > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {guide.yearsOfExperience} {guide.yearsOfExperience === 1 ? t('marketplace.messages.yearSingular') : t('marketplace.messages.yearsExperience')}
                            </h4>
                            {(() => {
                              const badge = getExperienceBadge(guide.yearsOfExperience);
                              if (!badge) return null;
                              return (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                                  {badge.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">{t('marketplace.profile.noExperience')}</p>
                      )}
                    </div>

                    {/* Certificaciones - desde datos reales */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                        {t('marketplace.profile.certifications')}
                      </h3>
                      {(() => {
                        const certs = safeArray(guide.certifications);
                        if (certs.length === 0) {
                          return <p className="text-gray-400 italic">{t('marketplace.profile.noCertifications')}</p>;
                        }
                        return (
                          <div className="space-y-3">
                            {certs.map((cert, index) => {
                              const certName = typeof cert === 'string' ? cert : (cert?.name || cert?.title || String(cert));
                              return (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{certName}</h4>
                                    </div>
                                    <CheckBadgeIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Estadísticas - solo datos reales */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('marketplace.profile.statistics')}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-gray-900">
                            {guide.completedTours || 0}
                          </p>
                          <p className="text-sm text-gray-600">{t('marketplace.profile.toursPerformed')}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-gray-900">
                            {guide.reviewCount || 0}
                          </p>
                          <p className="text-sm text-gray-600">{t('marketplace.profile.reviewsReceived')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Reseñas */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {/* Resumen de calificaciones */}
                    {guide.rating && guide.reviewCount > 0 ? (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <div className="text-center">
                          <p className="text-5xl font-bold text-gray-900">
                            {parseFloat(guide.rating).toFixed(1)}
                          </p>
                          <div className="flex justify-center mt-2">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-6 w-6 ${
                                  i < Math.round(parseFloat(guide.rating))
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {guide.reviewCount} {guide.reviewCount === 1 ? t('marketplace.messages.reviewSingular') : t('marketplace.messages.reviewPlural')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <StarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">{t('marketplace.profile.noRatingsYet')}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {t('marketplace.profile.noReviewsReceived')}
                        </p>
                      </div>
                    )}

                    {/* Lista de reseñas */}
                    {reviews && reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <StarIcon
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < (review.rating || 0)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-600 font-medium">
                                    {review.reviewerName || t('marketplace.messages.anonymous')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {new Date(review.createdAt).toLocaleDateString('es-PE')}
                                </p>
                              </div>
                              {review.verified && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  {t('marketplace.profile.verified')}
                                </span>
                              )}
                            </div>

                            {review.comment && (
                              <p className="text-gray-600">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      !guide.rating && (
                        <p className="text-center text-gray-400 italic py-4">
                          {t('marketplace.profile.noReviewsToShow')}
                        </p>
                      )
                    )}
                  </div>
                )}

                {/* Tab: Disponibilidad */}
                {activeTab === 'availability' && (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        {t('marketplace.profile.availabilityRealtimeNote')}
                      </p>
                    </div>

                    <GuideAvailabilityCalendar
                      guideId={guideId}
                      selectedDate={null}
                      onDateSelect={() => {}}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha - Tarjeta de reserva */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              {/* Tarifa del guía */}
              {guide.pricePerPerson ? (
                <div className="text-center mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">{t('marketplace.profile.ratePerPerson')}</p>
                  <p className="text-3xl font-bold text-purple-700">
                    S/ {parseFloat(guide.pricePerPerson).toFixed(2)}
                  </p>
                </div>
              ) : (
                <div className="text-center mb-6 py-4">
                  <CurrencyDollarIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{t('marketplace.profile.noRateConfigured')}</p>
                </div>
              )}

              {/* Características */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <span>{t('marketplace.profile.bookInAdvance')}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                  <span>{t('marketplace.profile.verifiedGuide')}</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                <button
                  onClick={handleBooking}
                  className="w-full bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 transition-colors font-medium"
                >
                  {t('marketplace.profile.requestService')}
                </button>

                <button
                  onClick={handleSendMessage}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  {t('marketplace.profile.sendMessage')}
                </button>
              </div>

              {/* Garantías */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <ShieldCheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <p>
                    {t('marketplace.profile.guaranteeNote')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideMarketplaceProfile;
