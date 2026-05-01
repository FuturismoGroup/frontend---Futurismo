import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  CurrencyDollarIcon,
  StarIcon,
  CalendarIcon,
  UserGroupIcon,
  BellIcon,
  CogIcon,
  ExclamationCircleIcon,
  UserIcon,
  MapPinIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import useAuthStore from '../../stores/authStore';
import useMarketplaceStore from '../../stores/marketplaceStore';
import useIndependentAgendaStore from '../../stores/independentAgendaStore';
import useDashboard from '../../hooks/useDashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';

/**
 * Status color mappings for service requests.
 * pending=yellow, accepted=green, rejected=red, completed=blue, cancelled=gray
 */
const STATUS_CONFIG = {
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    dot: 'bg-yellow-400',
    label: 'Pendiente'
  },
  accepted: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-green-400',
    label: 'Aceptada'
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-red-400',
    label: 'Rechazada'
  },
  completed: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dot: 'bg-blue-400',
    label: 'Completada'
  },
  cancelled: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
    label: 'Cancelada'
  }
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

/**
 * Format a UTC date string to the user's local timezone.
 */
const formatLocalDate = (utcDateString) => {
  if (!utcDateString) return 'Fecha no definida';
  try {
    const date = new Date(utcDateString);
    return date.toLocaleDateString('es-PE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Fecha no definida';
  }
};

/* ========================================================================
   Sub-components
   ======================================================================== */

/**
 * Modal for confirming acceptance of a service request.
 */
const AcceptModal = ({ request, onConfirm, onCancel, isSubmitting }) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={!isSubmitting ? onCancel : undefined}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-white">
                Confirmar aceptacion
              </h3>
              <p className="text-emerald-100 text-xs mt-0.5">Servicio freelance</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Vas a aceptar la solicitud de servicio de{' '}
            <span className="font-semibold text-gray-900">
              {request.agency?.businessName || 'la agencia'}
            </span>
          </p>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 mb-5 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-emerald-400" />
                Fecha
              </span>
              <span className="font-semibold text-gray-800">{formatLocalDate(request.serviceDate)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 flex items-center gap-1.5">
                <UserGroupIcon className="h-4 w-4 text-emerald-400" />
                Personas
              </span>
              <span className="font-semibold text-gray-800">{request.groupSize || '-'}</span>
            </div>
            <div className="border-t border-emerald-100 pt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Precio ofertado</span>
              <span className="text-lg font-bold text-emerald-700 font-mono">
                S/. {(request.totalPrice || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              Aceptar solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal for rejecting a service request, with optional reason.
 */
const RejectModal = ({ request, onConfirm, onCancel, isSubmitting, rejectMessage, setRejectMessage }) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={!isSubmitting ? onCancel : undefined}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 py-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <ExclamationCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-white">
                Rechazar solicitud
              </h3>
              <p className="text-rose-100 text-xs mt-0.5">Esta accion no se puede deshacer</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Vas a rechazar la solicitud de{' '}
            <span className="font-semibold text-gray-900">
              {request.agency?.businessName || 'la agencia'}
            </span>.
          </p>

          <div className="mb-5">
            <label htmlFor="reject-reason" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Motivo (opcional)
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
              placeholder="Puedes indicar un motivo para la agencia..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-300 resize-none bg-gray-50/50 placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-red-600 rounded-xl hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              Rechazar solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual service request card.
 */
const ServiceRequestCard = ({ request, onAccept, onReject, onViewDetail }) => {
  const statusCfg = getStatusConfig(request.status);
  const isPending = request.status === 'pending';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-medium transition-all group overflow-hidden">
      {/* Barra de estado superior */}
      <div className={`h-1 bg-gradient-to-r ${
        request.status === 'pending' ? 'from-amber-400 to-orange-400' :
        request.status === 'accepted' ? 'from-emerald-400 to-teal-400' :
        request.status === 'rejected' ? 'from-rose-400 to-red-400' :
        request.status === 'completed' ? 'from-violet-400 to-purple-500' :
        'from-gray-300 to-slate-400'
      }`} />

      <div className="p-5">
        {/* Header: agency + status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-gray-900 truncate text-sm">
                {request.agency?.businessName || 'Agencia'}
              </h3>
              {request.agency?.contactName && (
                <p className="text-xs text-gray-400 truncate">
                  {request.agency.contactName}
                </p>
              )}
            </div>
          </div>
          <span className={`ml-3 flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <CalendarIcon className="h-4 w-4 text-violet-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate font-medium">{formatLocalDate(request.serviceDate)}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <UserGroupIcon className="h-4 w-4 text-cyan-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 font-medium">{request.groupSize || 0} personas</span>
          </div>
          {request.location && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 col-span-2">
              <MapPinIcon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 truncate font-medium">{request.location}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 mb-4 border border-violet-100/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {request.pricePerPerson
                ? `Ref: S/. ${Number(request.pricePerPerson).toLocaleString()} / persona`
                : 'Precio ofertado'}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-mono">
                S/. {(request.totalPrice || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Message from agency if exists */}
        {request.message && request.status !== 'pending' && (
          <div className="bg-gray-50 rounded-lg p-2.5 mb-4 text-xs text-gray-500 italic border border-gray-100">
            "{request.message}"
          </div>
        )}

        {/* Action buttons */}
        {isPending ? (
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetail(request.id)}
              className="px-3 py-2.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Detalle
            </button>
            <button
              onClick={() => onReject(request)}
              className="flex-1 px-3 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
            >
              Rechazar
            </button>
            <button
              onClick={() => onAccept(request)}
              className="flex-1 px-3 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              Aceptar
            </button>
          </div>
        ) : (
          <button
            onClick={() => onViewDetail(request.id)}
            className="w-full px-3 py-2.5 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-colors flex items-center justify-center gap-1.5"
          >
            Ver detalle
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/* ========================================================================
   Main Component
   ======================================================================== */

const GuideMarketplaceDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    serviceRequests: storeRequests,
    fetchServiceRequests,
    respondToServiceRequest
  } = useMarketplaceStore();

  const { stats, loading: dashboardLoading } = useDashboard();

  // Existing state
  const [guide, setGuide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');

  // Service requests state
  const [localRequests, setLocalRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectMessage, setRejectMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestsError, setRequestsError] = useState(null);

  // Load guide data
  useEffect(() => {
    const loadGuideData = async () => {
      const guideId = user?.guideId;

      if (!guideId) {
        console.warn('[GuideMarketplaceDashboard] No guideId found in user');
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get(`/guides/${guideId}`);
        const result = response.data;
        const guideData = result.success ? result.data : (result.id ? result : null);

        if (guideData) {
          setGuide(guideData);
        }
      } catch (error) {
        console.error('[GuideMarketplaceDashboard] Error loading guide:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGuideData();
  }, [user?.guideId]);

  // Load service requests
  const loadServiceRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const data = await fetchServiceRequests({ status: 'all' });
      setLocalRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[GuideMarketplaceDashboard] Error loading service requests:', error);
      setRequestsError('Error al cargar solicitudes');
      setLocalRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, [fetchServiceRequests]);

  useEffect(() => {
    loadServiceRequests();
  }, [loadServiceRequests]);

  // Keep local requests in sync with store
  useEffect(() => {
    if (Array.isArray(storeRequests) && storeRequests.length > 0) {
      setLocalRequests(storeRequests);
    }
  }, [storeRequests]);

  // Computed values - filtrar service_requests por status para cada tab
  const pendingRequests = localRequests.filter(r => r.status === 'pending');
  const upcomingRequests = localRequests.filter(r => r.status === 'accepted');
  const completedRequests = localRequests.filter(r =>
    r.status === 'completed' || r.status === 'rejected' || r.status === 'cancelled'
  );

  // Request action handlers
  const handleAcceptClick = (request) => {
    setSelectedRequest(request);
    setShowAcceptModal(true);
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectMessage('');
    setShowRejectModal(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      await respondToServiceRequest(selectedRequest.id, { accepted: true });
      setShowAcceptModal(false);
      setSelectedRequest(null);
      await loadServiceRequests();
      // Notificar al store de agenda para que recargue eventos al navegar
      useIndependentAgendaStore.setState({ lastEventUpdate: Date.now() });
    } catch (error) {
      console.error('[GuideMarketplaceDashboard] Error accepting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      await respondToServiceRequest(selectedRequest.id, {
        accepted: false,
        message: rejectMessage.trim() || undefined
      });
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectMessage('');
      await loadServiceRequests();
    } catch (error) {
      console.error('[GuideMarketplaceDashboard] Error rejecting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = (requestId) => {
    navigate(`/marketplace/requests/${requestId}`);
  };

  const handleCloseModals = () => {
    if (isSubmitting) return;
    setShowAcceptModal(false);
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectMessage('');
  };

  // Loading state
  if (isLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Guide info with defaults
  const rawRating = guide?.rating || stats?.personalRating || 0;
  const guideInfo = {
    fullName: guide?.user?.first_name
      ? `${guide.user.first_name} ${guide.user.last_name || ''}`
      : user?.name || 'Guia',
    avatar: guide?.profile_photo || guide?.avatar || null,
    rating: typeof rawRating === 'number' ? rawRating : parseFloat(rawRating) || 0,
    verified: guide?.verified || guide?.is_verified || false,
    responseTime: 15,
    acceptanceRate: 95
  };

  // Tab definitions
  const tabs = [
    {
      key: 'requests',
      label: 'Solicitudes',
      count: pendingRequests.length,
      isPurple: true
    },
    { key: 'upcoming', label: 'Proximos', count: upcomingRequests.length },
    { key: 'completed', label: 'Completados', count: completedRequests.length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {guideInfo.avatar ? (
                  <img
                    src={guideInfo.avatar}
                    alt={guideInfo.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Panel de Guia Freelance
                  {guideInfo.verified && (
                    <CheckBadgeIcon className="h-6 w-6 text-cyan-500" />
                  )}
                </h1>
                <p className="text-gray-600">Bienvenido, {guideInfo.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <BellIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <CogIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Ingresos del mes</p>
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              S/. {(stats?.monthlyIncome || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">Solo servicios completados</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Tours completados</p>
              <CheckCircleIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.toursCompleted || 0}</p>
            <p className="text-sm text-gray-500 mt-2">Este mes</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Calificacion</p>
              <StarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {guideInfo.rating > 0 ? guideInfo.rating.toFixed(1) : '-'}
              </p>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(guideInfo.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Tours esta semana</p>
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.toursThisWeek || 0}</p>
            <p className="text-sm text-gray-500 mt-2">Confirmados</p>
          </div>
        </div>

        {/* Verification alert */}
        {!guideInfo.verified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Completa la verificacion de tu perfil
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Los perfiles verificados reciben mas oportunidades de trabajo.
                  <button
                    onClick={() => navigate('/profile')}
                    className="font-medium underline ml-1"
                  >
                    Ir a mi perfil
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const accentColor = tab.isPurple ? 'purple' : 'cyan';

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? `border-${accentColor}-500 text-${accentColor}-600`
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    style={
                      isActive && tab.isPurple
                        ? { borderBottomColor: '#8b5cf6', color: '#7c3aed' }
                        : isActive && !tab.isPurple
                        ? { borderBottomColor: '#06b6d4', color: '#0891b2' }
                        : {}
                    }
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          isActive && tab.isPurple
                            ? 'bg-purple-100 text-purple-700'
                            : isActive
                            ? 'bg-cyan-100 text-cyan-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'requests' && (
              <ServiceRequestsTab
                requests={pendingRequests}
                loading={requestsLoading}
                error={requestsError}
                onAccept={handleAcceptClick}
                onReject={handleRejectClick}
                onRetry={loadServiceRequests}
                onViewDetail={handleViewDetail}
                emptyMessage="No tienes solicitudes pendientes"
                emptySubMessage="Las agencias te enviaran solicitudes cuando necesiten tus servicios."
              />
            )}

            {activeTab === 'upcoming' && (
              <ServiceRequestsTab
                requests={upcomingRequests}
                loading={requestsLoading}
                error={requestsError}
                onAccept={handleAcceptClick}
                onReject={handleRejectClick}
                onRetry={loadServiceRequests}
                onViewDetail={handleViewDetail}
                emptyMessage="No tienes servicios proximos"
                emptySubMessage="Cuando aceptes solicitudes, apareceran aqui como servicios programados."
              />
            )}

            {activeTab === 'completed' && (
              <ServiceRequestsTab
                requests={completedRequests}
                loading={requestsLoading}
                error={requestsError}
                onAccept={handleAcceptClick}
                onReject={handleRejectClick}
                onRetry={loadServiceRequests}
                onViewDetail={handleViewDetail}
                emptyMessage="No tienes servicios finalizados"
                emptySubMessage="Aqui veras tus servicios completados, rechazados o cancelados."
              />
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Panel de Guia Freelance
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Aqui puedes ver tus estadisticas de ingresos (solo servicios completados),
                tours asignados, solicitudes de marketplace y tu calificacion.
                Para mas detalles, visita la seccion de Monitoreo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAcceptModal && (
        <AcceptModal
          request={selectedRequest}
          onConfirm={handleConfirmAccept}
          onCancel={handleCloseModals}
          isSubmitting={isSubmitting}
        />
      )}

      {showRejectModal && (
        <RejectModal
          request={selectedRequest}
          onConfirm={handleConfirmReject}
          onCancel={handleCloseModals}
          isSubmitting={isSubmitting}
          rejectMessage={rejectMessage}
          setRejectMessage={setRejectMessage}
        />
      )}
    </div>
  );
};

/* ========================================================================
   Tab Content Components
   ======================================================================== */

/**
 * Content for the "Solicitudes" tab.
 */
const ServiceRequestsTab = ({ requests, loading, error, onAccept, onReject, onRetry, onViewDetail, emptyMessage, emptySubMessage }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationCircleIcon className="h-12 w-12 text-red-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-3">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-12">
        <InboxIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{emptyMessage || 'No tienes solicitudes de servicio'}</p>
        <p className="text-sm text-gray-400 mt-1">
          {emptySubMessage || 'Las agencias te enviaran solicitudes cuando necesiten tus servicios.'}
        </p>
      </div>
    );
  }

  // Sort by date descending
  const sortedRequests = [...requests].sort((a, b) => {
    return new Date(b.serviceDate || 0) - new Date(a.serviceDate || 0);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sortedRequests.map((request) => (
        <ServiceRequestCard
          key={request.id}
          request={request}
          onAccept={onAccept}
          onReject={onReject}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
};

export default GuideMarketplaceDashboard;
