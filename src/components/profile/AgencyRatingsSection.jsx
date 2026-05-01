import { useState, useEffect } from 'react';
import { StarIcon, ChatBubbleLeftRightIcon, ChevronDownIcon, ChevronUpIcon, FunnelIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import ratingsService from '../../services/ratingsService';

// Componente actualizado con validaciones de tipo

const AgencyRatingsSection = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedAgency, setSelectedAgency] = useState('all');
  const { t } = useTranslation();

  // Estado para ratings y reviews
  const [ratingsData, setRatingsData] = useState({
    averageRating: 0,
    totalRatings: 0,
    ratingsByAgency: []
  });

  // Cargar datos desde el backend
  useEffect(() => {
    const loadRatings = async () => {
      try {
        // Usar endpoints correctos del backend: /dashboard/stats
        const statsResult = await ratingsService.getDashboardStats();

        if (statsResult.success) {
          setRatingsData({
            averageRating: statsResult.data?.averageRating || 0,
            totalRatings: statsResult.data?.totalRatings || 0,
            ratingsByAgency: statsResult.data?.ratingsByAgency || []
          });
        } else {
          throw new Error(statsResult.error || t('errors.unexpectedError'));
        }
      } catch (error) {
        console.error('Error loading ratings:', error);
        // En caso de error, mostrar datos vacíos sin romper la UI
        setRatingsData({
          averageRating: 0,
          totalRatings: 0,
          ratingsByAgency: []
        });
      }
    };

    loadRatings();
  }, [selectedPeriod]);

  // Filtrar datos según el período seleccionado
  const filterByPeriod = (data) => {
    const now = new Date();
    const periodInDays = {
      'week': 7,
      'month': 30,
      'quarter': 90,
      'year': 365
    };
    
    const daysAgo = periodInDays[selectedPeriod] || 30;
    const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
    
    // Aquí filtrarías los datos según la fecha
    return data;
  };

  const getFilteredData = () => {
    let filtered = ratingsData.ratingsByAgency;
    
    if (selectedAgency !== 'all') {
      filtered = filtered.filter(agency => agency.id === selectedAgency);
    }
    
    return filterByPeriod(filtered);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {typeof rating === 'number' ? rating.toFixed(1) : '0.0'}
        </span>
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <StarIcon className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{t('profile.comp.agencyRatingsTitle')}</h3>
            <p className="text-sm text-gray-500">{t('profile.comp.agencyRatingsSubtitle')}</p>
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
      </div>

      {!isCollapsed && (
        <div>
          {/* Resumen general */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">{t('profile.comp.averageRating')}</p>
                <div className="flex justify-center items-center">
                  <span className={`text-3xl font-bold ${getRatingColor(ratingsData.averageRating)}`}>
                    {typeof ratingsData.averageRating === 'number' ? ratingsData.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <StarIconSolid className="w-6 h-6 text-yellow-400 ml-2" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">{t('profile.comp.totalEvaluations')}</p>
                <p className="text-3xl font-bold text-gray-900">{ratingsData.totalRatings}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">{t('profile.comp.activeAgencies')}</p>
                <p className="text-3xl font-bold text-gray-900">{ratingsData.ratingsByAgency.length}</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">{t('profile.comp.lastWeek')}</option>
                <option value="month">{t('profile.comp.lastMonth')}</option>
                <option value="quarter">{t('profile.comp.lastQuarter')}</option>
                <option value="year">{t('profile.comp.lastYear')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 text-gray-400" />
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('profile.comp.allAgencies')}</option>
                {ratingsData.ratingsByAgency.map(agency => (
                  <option key={agency.id} value={agency.id}>
                    {agency.agencyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de agencias con sus calificaciones */}
          <div className="space-y-4">
            {getFilteredData().map((agency) => (
              <div key={agency.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{agency.agencyName}</h4>
                    <p className="text-sm text-gray-600">
                      {agency.totalReviews} evaluaciones • Última: {new Date(agency.lastReview).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  {renderStars(agency.rating)}
                </div>

                {/* Comentarios recientes */}
                {agency.comments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      {t('profile.comp.recentComments')}:
                    </p>
                    {agency.comments.slice(0, 2).map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">{comment.tourName}</p>
                          <div className="flex items-center gap-2">
                            {renderStars(comment.rating)}
                            <span className="text-xs text-gray-500">
                              {new Date(comment.date).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 italic">"{comment.comment}"</p>
                        <p className="text-xs text-gray-500 mt-1">- {comment.touristName}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Nota informativa */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">{t('profile.comp.tipLabel')}:</span> {t('profile.comp.ratingsInfoNote')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyRatingsSection;