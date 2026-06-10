import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  CalendarIcon,
  FunnelIcon,
  PlusIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import useMarketplaceStore from '../../stores/marketplaceStore';
import useAuthStore from '../../stores/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { resolveFileUrl } from '../../utils/fileUrl';
import toast from 'react-hot-toast';
import { formatDateSafe } from '../../utils/dateUtils';

const AgencyMarketplaceDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    serviceRequests,
    fetchServiceRequests,
    cancelServiceRequest,
    completeService,
    isLoading: storeLoading
  } = useMarketplaceStore();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await fetchServiceRequests({ status: 'all' });
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar solicitudes
  const getFilteredRequests = () => {
    let filtered = serviceRequests || [];

    if (activeFilter !== 'all') {
      filtered = filtered.filter(req => req.status === activeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.guide?.name?.toLowerCase().includes(query) ||
        req.location?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredRequests = getFilteredRequests();

  // Calcular estadísticas
  const stats = {
    total: (serviceRequests || []).length,
    pending: (serviceRequests || []).filter(r => r.status === 'pending').length,
    accepted: (serviceRequests || []).filter(r => r.status === 'accepted').length,
    completed: (serviceRequests || []).filter(r => r.status === 'completed').length,
    totalSpent: (serviceRequests || [])
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0)
  };

  const handleCancel = async (requestId, e) => {
    e.stopPropagation();
    if (!window.confirm(t('marketplace.agencyDashboard.confirmCancel'))) return;
    try {
      await cancelServiceRequest(requestId);
      toast.success(t('marketplace.agencyDashboard.requestCancelled'));
    } catch (err) {
      toast.error(err.message || t('marketplace.agencyDashboard.cancelError'));
    }
  };

  const handleComplete = async (requestId, e) => {
    e.stopPropagation();
    if (!window.confirm(t('marketplace.agencyDashboard.confirmComplete'))) return;
    try {
      await completeService(requestId, {});
      toast.success(t('marketplace.agencyDashboard.completedSuccess'));
    } catch (err) {
      toast.error(err.message || t('marketplace.agencyDashboard.completeError'));
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: t('marketplace.agencyDashboard.status.pending'), icon: ClockIcon, className: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: t('marketplace.agencyDashboard.status.accepted'), icon: CheckCircleIcon, className: 'bg-green-100 text-green-800' },
      rejected: { label: t('marketplace.agencyDashboard.status.rejected'), icon: XCircleIcon, className: 'bg-red-100 text-red-800' },
      completed: { label: t('marketplace.agencyDashboard.status.completed'), icon: StarIcon, className: 'bg-blue-100 text-blue-800' },
      cancelled: { label: t('marketplace.agencyDashboard.status.cancelled'), icon: XCircleIcon, className: 'bg-gray-100 text-gray-800' }
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.className}`}>
        <Icon className="h-3 w-3" />
        {c.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    // Usar formatDateSafe para evitar que el toLocaleDateString del navegador
    // desplace la fecha al timezone local cuando el backend manda @db.Date.
    return formatDateSafe(dateStr, {
      day: '2-digit', month: 'short', year: 'numeric'
    }) || '-';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{t('marketplace.agencyDashboard.title')}</h1>
              <p className="text-xs sm:text-base text-gray-600 mt-1">{t('marketplace.agencyDashboard.subtitle')}</p>
            </div>
            <button
              onClick={() => navigate('/marketplace')}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm sm:text-base whitespace-nowrap flex-shrink-0"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {t('marketplace.agencyDashboard.searchGuides')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500 truncate">{t('marketplace.agencyDashboard.stats.total')}</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500 truncate">{t('marketplace.agencyDashboard.stats.pending')}</p>
            <p className="text-base sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500 truncate">{t('marketplace.agencyDashboard.stats.accepted')}</p>
            <p className="text-base sm:text-2xl font-bold text-green-600">{stats.accepted}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500 truncate">{t('marketplace.agencyDashboard.stats.completed')}</p>
            <p className="text-base sm:text-2xl font-bold text-blue-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 col-span-2 sm:col-span-1">
            <p className="text-xs sm:text-sm text-gray-500 truncate">{t('marketplace.agencyDashboard.stats.totalSpent')}</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900 truncate">S/ {stats.totalSpent.toFixed(2)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('marketplace.messages.searchPlaceholderAgency')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'pending', 'accepted', 'completed', 'rejected', 'cancelled'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    activeFilter === filter
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filter === 'all' ? t('marketplace.agencyDashboard.filters.all') :
                   filter === 'pending' ? t('marketplace.agencyDashboard.filters.pending') :
                   filter === 'accepted' ? t('marketplace.agencyDashboard.filters.accepted') :
                   filter === 'completed' ? t('marketplace.agencyDashboard.filters.completed') :
                   filter === 'rejected' ? t('marketplace.agencyDashboard.filters.rejected') : t('marketplace.agencyDashboard.filters.cancelled')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de solicitudes */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('marketplace.agencyDashboard.noRequestsFound')}</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || activeFilter !== 'all'
                ? t('marketplace.messages.adjustFilters')
                : t('marketplace.messages.sendFirstRequest')}
            </p>
            {activeFilter === 'all' && !searchQuery && (
              <button
                onClick={() => navigate('/marketplace')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                {t('marketplace.agencyDashboard.exploreGuides')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer p-3 sm:p-5"
                onClick={() => navigate(`/marketplace/requests/${request.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {request.guide?.profilePhoto ? (
                        <img src={resolveFileUrl(request.guide.profilePhoto)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{request.guide?.name || t('marketplace.agencyDashboard.fallbackGuide')}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{t('marketplace.agencyDashboard.freelanceService')}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(request.status)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1 min-w-0">
                    <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{formatDate(request.serviceDate)}</span>
                  </span>
                  {request.startTime && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4 flex-shrink-0" />
                      {new Date(request.startTime).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {request.groupSize && (
                    <span className="flex items-center gap-1">
                      <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                      {request.groupSize} {t('marketplace.agencyDashboard.people')}
                    </span>
                  )}
                  {request.location && (
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{request.location}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-xs sm:text-sm text-gray-500 break-words">
                    {request.pricePerPerson && request.groupSize && (
                      <span className="text-gray-400">{t('marketplace.agencyDashboard.refPrice', { price: request.pricePerPerson.toFixed(2), count: request.groupSize })} </span>
                    )}
                    <span className="text-xs text-gray-500">{t('marketplace.agencyDashboard.offer')} </span>
                    <span className="text-base sm:text-lg font-semibold text-purple-700 whitespace-nowrap">
                      S/ {(request.totalPrice || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                    {request.status === 'pending' && (
                      <button
                        onClick={(e) => handleCancel(request.id, e)}
                        className="px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg transition whitespace-nowrap"
                      >
                        {t('marketplace.agencyDashboard.cancelRequest')}
                      </button>
                    )}
                    {request.status === 'accepted' && (
                      <button
                        onClick={(e) => handleComplete(request.id, e)}
                        className="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition whitespace-nowrap"
                      >
                        {t('marketplace.agencyDashboard.markCompleted')}
                      </button>
                    )}
                    {request.status === 'completed' && !request.hasReview && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/marketplace/review/${request.id}`); }}
                        className="px-3 py-1.5 text-xs sm:text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition font-medium whitespace-nowrap"
                      >
                        {t('marketplace.agencyDashboard.rate')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyMarketplaceDashboard;
