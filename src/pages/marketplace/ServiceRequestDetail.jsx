import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  ChatBubbleLeftEllipsisIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import useMarketplaceStore from '../../stores/marketplaceStore';
import useAuthStore from '../../stores/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ServiceRequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentRequest,
    fetchServiceRequestById,
    cancelServiceRequest,
    completeService,
    respondToServiceRequest,
    isLoading: storeLoading
  } = useMarketplaceStore();

  const [isLoading, setIsLoading] = useState(true);

  const statusConfig = {
    pending: {
      label: 'Pendiente',
      icon: ClockIcon,
      gradient: 'from-amber-400 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-400',
      ringColor: 'ring-amber-400'
    },
    accepted: {
      label: 'Aceptado',
      icon: CheckCircleIcon,
      gradient: 'from-emerald-400 to-teal-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-400',
      ringColor: 'ring-emerald-400'
    },
    rejected: {
      label: 'Rechazado',
      icon: XCircleIcon,
      gradient: 'from-rose-400 to-red-500',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-400',
      ringColor: 'ring-rose-400'
    },
    completed: {
      label: 'Completado',
      icon: CheckCircleIcon,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      border: 'border-violet-200',
      dot: 'bg-violet-400',
      ringColor: 'ring-violet-400'
    },
    cancelled: {
      label: 'Cancelado',
      icon: ExclamationCircleIcon,
      gradient: 'from-slate-400 to-gray-500',
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
      ringColor: 'ring-slate-400'
    }
  };

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  const loadRequest = async () => {
    setIsLoading(true);
    try {
      await fetchServiceRequestById(requestId);
    } catch (error) {
      console.error('Error loading request:', error);
      toast.error('No se pudo cargar la solicitud');
      navigate('/marketplace/requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar esta solicitud?')) return;
    try {
      await cancelServiceRequest(requestId);
      toast.success('Solicitud cancelada');
    } catch (err) {
      toast.error(err.message || 'Error al cancelar');
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('¿Marcar este servicio como completado?')) return;
    try {
      await completeService(requestId, {});
      toast.success('Servicio completado');
    } catch (err) {
      toast.error(err.message || 'Error al completar');
    }
  };

  const handleAccept = async () => {
    if (!window.confirm('¿Aceptar esta solicitud de servicio?')) return;
    try {
      await respondToServiceRequest(requestId, { accepted: true });
      toast.success('Solicitud aceptada');
    } catch (err) {
      toast.error(err.message || 'Error al aceptar');
    }
  };

  const handleReject = async () => {
    const message = window.prompt('Motivo del rechazo (opcional):');
    if (message === null) return; // cancelled prompt
    try {
      await respondToServiceRequest(requestId, { accepted: false, message: message || undefined });
      toast.success('Solicitud rechazada');
    } catch (err) {
      toast.error(err.message || 'Error al rechazar');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PE', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentRequest) return null;

  const request = currentRequest;
  const status = statusConfig[request.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const isAgency = user?.role === 'agency' || user?.role === 'admin';
  const isGuide = user?.role === 'guide';

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          {/* Volver */}
          <button
            onClick={() => navigate(isGuide ? '/marketplace/guide-dashboard' : '/marketplace/requests')}
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white mb-4 text-sm font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al panel
          </button>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                Solicitud de Servicio
              </h1>
              <p className="text-purple-200 mt-1 text-sm">
                Servicio freelance de marketplace
              </p>
              {/* Status badge */}
              <div className="mt-4 flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/20`}>
                  <StatusIcon className="h-4 w-4" />
                  {status.label}
                </span>
                <span className="text-white/70 text-xs font-mono">
                  #{requestId?.slice(0, 8)}
                </span>
              </div>
            </div>

            {/* Botones de acción en header */}
            <div className="flex gap-2 flex-wrap">
              {isAgency && request.status === 'pending' && (
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-white/15 border border-white/25 rounded-xl hover:bg-white/25 backdrop-blur-sm transition-all"
                >
                  Cancelar solicitud
                </button>
              )}
              {isAgency && request.status === 'accepted' && (
                <button
                  onClick={handleComplete}
                  className="px-5 py-2.5 text-sm font-medium text-purple-700 bg-white rounded-xl hover:bg-purple-50 shadow-lg transition-all"
                >
                  Marcar completado
                </button>
              )}
              {isAgency && request.status === 'completed' && !request.hasReview && (
                <button
                  onClick={() => navigate(`/marketplace/review/${request.id}`)}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all flex items-center gap-2"
                >
                  <StarIcon className="h-4 w-4" />
                  Calificar servicio
                </button>
              )}
              {isGuide && request.status === 'pending' && (
                <>
                  <button
                    onClick={handleReject}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-white/15 border border-white/25 rounded-xl hover:bg-red-500/30 backdrop-blur-sm transition-all"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={handleAccept}
                    className="px-5 py-2.5 text-sm font-medium text-emerald-700 bg-white rounded-xl hover:bg-emerald-50 shadow-lg transition-all flex items-center gap-2"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Aceptar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Info Cards - Grid de datos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-100">
                <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center mb-3 shadow-sm shadow-violet-200">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Fecha</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatDate(request.serviceDate)}</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-sky-50 rounded-2xl p-4 border border-cyan-100">
                <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center mb-3 shadow-sm shadow-cyan-200">
                  <ClockIcon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Hora / Duracion</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {request.startTime ? formatTime(request.startTime) : '-'}
                  {request.durationHours ? ` (${request.durationHours}h)` : ''}
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center mb-3 shadow-sm shadow-emerald-200">
                  <MapPinIcon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Ubicacion</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{request.location || 'No especificada'}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mb-3 shadow-sm shadow-amber-200">
                  <UserGroupIcon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Grupo</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{request.groupSize || '-'} personas</p>
              </div>
            </div>

            {/* Mensajes y requerimientos */}
            {(request.message || request.specialRequirements || request.guideResponseMessage) && (
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base font-display font-semibold text-gray-900 flex items-center gap-2">
                    <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-violet-500" />
                    Mensajes
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {request.message && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Mensaje de la agencia</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed">{request.message}</p>
                    </div>
                  )}

                  {request.specialRequirements && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Requerimientos especiales</p>
                      <p className="text-sm text-gray-700 bg-amber-50/60 p-4 rounded-xl border border-amber-100 leading-relaxed">{request.specialRequirements}</p>
                    </div>
                  )}

                  {request.guideResponseMessage && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Respuesta del guia</p>
                      <p className="text-sm text-gray-700 bg-violet-50/60 p-4 rounded-xl border border-violet-100 leading-relaxed">
                        {request.guideResponseMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Desglose de precio */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-display font-semibold text-gray-900 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-violet-500" />
                  Detalle de Precio
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {request.pricePerPerson && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Tarifa referencial por persona</span>
                      <span className="font-medium text-gray-700 font-mono">S/ {request.pricePerPerson.toFixed(2)}</span>
                    </div>
                  )}
                  {request.groupSize && request.pricePerPerson && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Total referencial ({request.groupSize} personas)</span>
                      <span className="font-medium text-gray-400 font-mono">S/ {(request.pricePerPerson * request.groupSize).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-display font-semibold text-gray-900">Precio ofertado</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-mono">
                        S/ {(request.totalPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-display font-semibold text-gray-900">Linea de tiempo</h2>
              </div>
              <div className="p-6">
                <div className="relative">
                  {/* Linea conectora vertical */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-violet-200 via-purple-200 to-gray-200" />

                  <div className="space-y-6">
                    {/* Solicitud creada */}
                    <div className="flex items-start gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-violet-500 border-[3px] border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="font-medium text-gray-900 text-sm">Solicitud creada</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">
                          {request.createdAt ? new Date(request.createdAt).toLocaleString('es-PE') : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Respuesta del guia */}
                    {request.respondedAt && (
                      <div className="flex items-start gap-4 relative">
                        <div className={`w-6 h-6 rounded-full border-[3px] border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10 ${
                          request.status === 'rejected' ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}>
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {request.status === 'rejected' ? 'Rechazada por guia' : 'Aceptada por guia'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 font-mono">
                            {new Date(request.respondedAt).toLocaleString('es-PE')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Completado */}
                    {request.status === 'completed' && (
                      <div className="flex items-start gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-violet-500 border-[3px] border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10">
                          <CheckCircleIcon className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="font-medium text-gray-900 text-sm">Servicio completado</p>
                        </div>
                      </div>
                    )}

                    {/* Cancelado */}
                    {request.status === 'cancelled' && (
                      <div className="flex items-start gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-slate-400 border-[3px] border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10">
                          <XCircleIcon className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="font-medium text-gray-900 text-sm">Solicitud cancelada</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Guia info */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-6 py-5 text-center relative overflow-hidden">
                {/* Decoracion */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />

                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                    {request.guide?.profilePhoto ? (
                      <img src={request.guide.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserGroupIcon className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <h4 className="font-display font-semibold text-white text-lg">{request.guide?.name || 'Guia'}</h4>
                  {request.guide?.rating && (
                    <div className="flex items-center justify-center gap-1.5 mt-1.5">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${i < Math.round(request.guide.rating) ? 'text-amber-300' : 'text-white/30'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-white/90 font-medium">{request.guide.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5">
                <button
                  onClick={() => navigate(`/marketplace/guide/${request.guideId}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  Ver perfil completo
                </button>

                {/* Info de contacto (solo si aceptado) */}
                {request.status === 'accepted' && request.guide?.email && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Contacto</p>
                    <div className="space-y-2.5">
                      {request.guide.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <PhoneIcon className="h-4 w-4 text-emerald-500" />
                          </div>
                          <span className="text-gray-700">{request.guide.phone}</span>
                        </div>
                      )}
                      {request.guide.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                            <EnvelopeIcon className="h-4 w-4 text-violet-500" />
                          </div>
                          <span className="text-gray-700 truncate">{request.guide.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agencia info (para guias) */}
            {isGuide && request.agency && (
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-cyan-500 to-teal-600 px-6 py-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                  <h3 className="font-display font-semibold text-white relative z-10">Agencia</h3>
                </div>
                <div className="p-5">
                  <p className="font-semibold text-gray-900">{request.agency.businessName || request.agency.contactName}</p>
                  {request.status === 'accepted' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2.5">
                      {request.agency.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                            <PhoneIcon className="h-4 w-4 text-cyan-500" />
                          </div>
                          <span className="text-gray-700">{request.agency.phone}</span>
                        </div>
                      )}
                      {request.agency.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                            <EnvelopeIcon className="h-4 w-4 text-cyan-500" />
                          </div>
                          <span className="text-gray-700 truncate">{request.agency.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review */}
            {request.review && (
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 py-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                  <h3 className="font-display font-semibold text-white relative z-10 flex items-center gap-2">
                    <StarIcon className="h-5 w-5" />
                    Resena
                  </h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${i < request.review.rating ? 'text-amber-400' : 'text-gray-200'}`}
                      />
                    ))}
                    <span className="text-sm font-semibold text-gray-700 ml-1">{request.review.rating}.0</span>
                  </div>
                  {request.review.comment && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl italic leading-relaxed">
                      "{request.review.comment}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestDetail;
