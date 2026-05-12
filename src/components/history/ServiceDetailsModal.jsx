import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  StarIcon,
  CheckCircleIcon,
  MapPinIcon,
  CameraIcon,
  PlayIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import useAuthStore from '../../stores/authStore';
import reservationsService from '../../services/reservationsService';
import { resolveFileUrl } from '../../utils/fileUrl';

const ServiceDetailsModal = ({ isOpen, onClose, service }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Estados para historial de ejecución
  const [executionHistory, setExecutionHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showPhotos, setShowPhotos] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Check if user is an employed guide (guía de planta)
  const isEmployedGuide = user?.role === 'guide' && user?.guide_type === 'employed';

  // Función para cargar historial de ejecución
  const loadExecutionHistory = useCallback(async () => {
    if (!service?.id) return;

    setLoadingHistory(true);
    setHistoryError(null);

    try {
      const response = await reservationsService.getExecutionHistory(service.id);
      if (response.success) {
        setExecutionHistory(response.data);
      } else {
        setHistoryError(response.error || t('history.comp.errorLoadingHistory'));
      }
    } catch (err) {
      console.error('Error loading execution history:', err);
      setHistoryError(t('history.comp.errorLoadingHistory'));
    } finally {
      setLoadingHistory(false);
    }
  }, [service?.id]);

  // Cargar historial de ejecución cuando se abre el modal
  useEffect(() => {
    if (isOpen && service?.id && (user?.role === 'admin' || user?.role === 'agency')) {
      loadExecutionHistory();
    }
  }, [isOpen, service?.id, user?.role, loadExecutionHistory]);

  if (!isOpen || !service) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getServiceTypeLabel = (type) => {
    switch (type) {
      case 'regular':
        return t('history.details.serviceType.regular');
      case 'private':
        return t('history.details.serviceType.private');
      case 'transfer':
        return t('history.details.serviceType.transfer');
      default:
        return type;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return t('history.details.statusOptions.completed');
      case 'cancelled':
        return t('history.details.statusOptions.cancelled');
      case 'pending':
        return t('history.details.statusOptions.pending');
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>

      {/* Modal content */}
      <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-2xl sm:w-full mx-4 flex flex-col max-h-[90vh]">
        {/* Header fijo */}
        <div className="px-4 pt-5 pb-4 sm:px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {t('history.details.title')}
            </h3>
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <span className="sr-only">{t('common.close')}</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="w-full text-left">
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {t('history.details.basicInfo')}
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {t('history.details.serviceName')}:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {service.serviceName}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {t('history.details.client')}:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {service.clientName}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {t('history.details.date')}:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {formatDate(service.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {t('history.details.status')}
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                        {getStatusLabel(service.status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {t('history.details.type')}:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {getServiceTypeLabel(service.serviceType)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles del servicio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {t('history.details.serviceDetails')}
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {t('history.details.duration')}:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {service.duration}h
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {t('history.details.passengers')}:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {service.passengers}
                      </span>
                    </div>
                    {!isEmployedGuide && (
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {t('history.details.amount')}:
                        </span>
                        <span className="ml-2 text-sm font-semibold text-green-600">
                          {formatCurrency(service.amount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {t('history.details.guide')}
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-900">
                        {service.guide}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {t('history.details.transport')}
                  </h4>
                  <div className="space-y-2">
                    {service.driver && (
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {t('history.details.driver')}:
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {service.driver}
                        </span>
                      </div>
                    )}
                    {service.vehicle && (
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {t('history.details.vehicle')}:
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {service.vehicle}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notas */}
              {service.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {t('history.details.notes')}
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{service.notes}</p>
                  </div>
                </div>
              )}

              {/* Calificación y Comentarios */}
              {(service.rating || service.feedback || service.review_comment) && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    {t('history.comp.serviceRating')}
                  </h4>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                    {/* Rating con estrellas */}
                    {service.rating && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              star <= Math.floor(service.rating || 0) ? (
                                <StarIconSolid
                                  key={star}
                                  className="h-6 w-6 text-yellow-400"
                                />
                              ) : (
                                <StarIcon
                                  key={star}
                                  className="h-6 w-6 text-gray-300"
                                />
                              )
                            ))}
                          </div>
                          <span className="text-2xl font-bold text-gray-900">
                            {Number(service.rating || 0).toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">/ 5.0</span>
                        </div>
                      </div>
                    )}

                    {/* Comentarios del cliente */}
                    {(service.feedback || service.review_comment) && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {t('history.comp.clientComment')}:
                        </p>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                          <p className="text-sm text-gray-800 italic">
                            "{service.feedback || service.review_comment}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Fecha de calificación */}
                    {(service.ratingDate || service.reviewed_at) && (
                      <div className="mt-3 text-xs text-gray-500">
                        {t('history.comp.ratedOn')} {formatDate(service.ratingDate || service.reviewed_at)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mensaje si no hay calificación */}
              {service.status === 'completed' && !service.rating && !service.feedback && !service.review_comment && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                      {t('history.comp.notRatedYet')}
                    </p>
                  </div>
                </div>
              )}

              {/* Historial de Ejecución (solo para admin/agency) */}
              {(user?.role === 'admin' || user?.role === 'agency') && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      {t('history.comp.executionHistory')}
                    </h4>
                    {loadingHistory && (
                      <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                  </div>

                  {historyError && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200 mb-4">
                      <p className="text-sm text-red-600">{historyError}</p>
                      <button
                        onClick={loadExecutionHistory}
                        className="text-sm text-red-700 underline mt-1"
                      >
                        {t('history.comp.retry')}
                      </button>
                    </div>
                  )}

                  {!loadingHistory && !executionHistory && !historyError && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 text-center">
                        {t('history.comp.notExecutedYet')}
                      </p>
                    </div>
                  )}

                  {executionHistory && (
                    <div className="space-y-4">
                      {/* Estadísticas de ejecución */}
                      {executionHistory.execution && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-blue-700">
                              {executionHistory.stats?.completionRate || 0}%
                            </p>
                            <p className="text-xs text-blue-600">{t('history.comp.completedBadge')}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-700">
                              {executionHistory.stats?.completedStops || 0}/{executionHistory.stats?.totalStops || 0}
                            </p>
                            <p className="text-xs text-green-600">{t('history.comp.stopsLabel')}</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-purple-700">
                              {executionHistory.stats?.totalPhotos || 0}
                            </p>
                            <p className="text-xs text-purple-600">{t('history.comp.photosLabel')}</p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-orange-700">
                              {executionHistory.execution?.durationMinutes
                                ? `${Math.floor(executionHistory.execution.durationMinutes / 60)}h ${executionHistory.execution.durationMinutes % 60}m`
                                : '--'}
                            </p>
                            <p className="text-xs text-orange-600">Duración</p>
                          </div>
                        </div>
                      )}

                      {/* Timeline de paradas */}
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setShowTimeline(!showTimeline)}
                          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-medium text-gray-900 flex items-center gap-2">
                            <MapPinIcon className="w-5 h-5 text-gray-600" />
                            {t('history.comp.stopProgress')} ({executionHistory.stops?.length || 0})
                          </span>
                          {showTimeline ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {showTimeline && (
                          <div className="p-4 space-y-3">
                            {executionHistory.stops?.map((stop, index) => (
                              <div
                                key={stop.id}
                                className={`flex items-start gap-3 p-3 rounded-lg ${
                                  stop.status === 'completed'
                                    ? 'bg-green-50 border border-green-200'
                                    : stop.status === 'in_progress'
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'bg-gray-50 border border-gray-200'
                                }`}
                              >
                                {/* Indicador de estado */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                                  stop.status === 'completed'
                                    ? 'bg-green-500'
                                    : stop.status === 'in_progress'
                                    ? 'bg-blue-500'
                                    : 'bg-gray-300'
                                }`}>
                                  {stop.status === 'completed' ? (
                                    <CheckCircleIcon className="w-5 h-5" />
                                  ) : (
                                    index + 1
                                  )}
                                </div>

                                {/* Info de la parada */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-gray-900 truncate">
                                      {stop.name}
                                    </h5>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      stop.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : stop.status === 'in_progress'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {stop.status === 'completed' ? t('history.comp.completed') :
                                       stop.status === 'in_progress' ? t('history.comp.inProgress') : t('history.comp.pending')}
                                    </span>
                                  </div>

                                  {/* Tiempos */}
                                  {(stop.arrivedAt || stop.departedAt) && (
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                      {stop.arrivedAt && (
                                        <span className="flex items-center gap-1">
                                          <PlayIcon className="w-3 h-3" />
                                          {t('history.comp.arrivalLabel')}: {new Date(stop.arrivedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      )}
                                      {stop.departedAt && (
                                        <span className="flex items-center gap-1">
                                          <FlagIcon className="w-3 h-3" />
                                          {t('history.comp.departureLabel')}: {new Date(stop.departedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Notas del guía */}
                                  {stop.notes && (
                                    <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                        <ChatBubbleLeftIcon className="w-3 h-3" />
                                        {t('history.comp.guideNotes')}:
                                      </p>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{stop.notes}</p>
                                    </div>
                                  )}

                                  {/* Fotos de esta parada */}
                                  {stop.photos?.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {stop.photos.map(photo => (
                                        <button
                                          key={photo.id}
                                          onClick={() => setSelectedPhoto(photo)}
                                          className="w-12 h-12 rounded overflow-hidden border-2 border-white shadow-sm hover:border-blue-400 transition-colors"
                                        >
                                          <img
                                            src={`${resolveFileUrl(photo.url)}`}
                                            alt={photo.caption || 'Foto'}
                                            className="w-full h-full object-cover"
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {(!executionHistory.stops || executionHistory.stops.length === 0) && (
                              <p className="text-sm text-gray-500 text-center py-4">
                                {t('history.comp.noStops')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Galería de fotos */}
                      {executionHistory.photos?.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setShowPhotos(!showPhotos)}
                            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <span className="font-medium text-gray-900 flex items-center gap-2">
                              <CameraIcon className="w-5 h-5 text-gray-600" />
                              {t('history.comp.tourPhotosSection')} ({executionHistory.photos.length})
                            </span>
                            {showPhotos ? (
                              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </button>

                          {showPhotos && (
                            <div className="p-4">
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {executionHistory.photos.map(photo => (
                                  <button
                                    key={photo.id}
                                    onClick={() => setSelectedPhoto(photo)}
                                    className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors group"
                                  >
                                    <img
                                      src={`${resolveFileUrl(photo.url)}`}
                                      alt={photo.caption || 'Foto del tour'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Modal de foto ampliada */}
              {selectedPhoto && (
                <div
                  className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center p-4"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedPhoto(null)}
                      className="absolute -top-10 right-0 text-white hover:text-gray-300"
                    >
                      <XMarkIcon className="w-8 h-8" />
                    </button>
                    <img
                      src={`${resolveFileUrl(selectedPhoto.url)}`}
                      alt={selectedPhoto.caption || 'Foto'}
                      className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    />
                    {(selectedPhoto.caption || selectedPhoto.stopName) && (
                      <div className="mt-2 text-white text-center">
                        {selectedPhoto.caption && (
                          <p className="font-medium">{selectedPhoto.caption}</p>
                        )}
                        {selectedPhoto.stopName && (
                          <p className="text-sm text-gray-300">En: {selectedPhoto.stopName}</p>
                        )}
                        {selectedPhoto.takenAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(selectedPhoto.takenAt).toLocaleString('es-PE')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer fijo */}
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
              onClick={onClose}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ServiceDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    serviceName: PropTypes.string.isRequired,
    clientName: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    serviceType: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    guide: PropTypes.string.isRequired,
    driver: PropTypes.string,
    vehicle: PropTypes.string,
    amount: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    passengers: PropTypes.number.isRequired,
    notes: PropTypes.string
  })
};

export default ServiceDetailsModal;
