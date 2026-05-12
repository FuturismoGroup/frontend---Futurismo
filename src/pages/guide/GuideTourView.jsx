import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MapPinIcon,
  ClockIcon,
  CameraIcon,
  PlayIcon,
  CheckIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PhotoIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import monitoringService from '../../services/monitoringService';
import toursService from '../../services/toursService';
import webSocketService from '../../services/websocket';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';
import { resolveFileUrl } from '../../utils/fileUrl';

const GuideTourView = () => {
  const { tourId: reservationId } = useParams(); // El param es realmente reservationId
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Estados del tour
  const [tourData, setTourData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTourId, setActiveTourId] = useState(null);

  // Estados de UI
  const [expandedStop, setExpandedStop] = useState(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Estados de fotos y comentarios
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedStopForMedia, setSelectedStopForMedia] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [commentText, setCommentText] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [stopPhotos, setStopPhotos] = useState({}); // {stopId: [{id, photoUrl, caption}]}
  const fileInputRef = useRef(null);

  // Estados de GPS
  const [gpsStatus, setGpsStatus] = useState('inactive');
  const [lastLocation, setLastLocation] = useState(null);
  const watchIdRef = useRef(null);
  const sendIntervalRef = useRef(null);

  // Función para enviar ubicación al backend (WebSocket primario, HTTP fallback)
  const sendLocationToBackend = useCallback(async (position) => {
    try {
      const maxDecimalValue = 9999.99;
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ? Math.min(position.coords.accuracy, maxDecimalValue) : null,
        speed: position.coords.speed ? Math.min(position.coords.speed, maxDecimalValue) : null
      };

      // Intentar enviar via WebSocket (mas rapido, menos overhead)
      const sentViaWs = webSocketService.sendGuideLocation(locationData);

      if (!sentViaWs) {
        // Fallback a HTTP si WebSocket no esta conectado
        await monitoringService.updateLocation(locationData);
      }

      setLastLocation({
        ...locationData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[GPS] Error enviando ubicación:', error);
    }
  }, []);

  // Iniciar tracking GPS
  const startGpsTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Tu dispositivo no soporta GPS');
      setGpsStatus('error');
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendLocationToBackend(position);
        setGpsStatus('active');
        toast.success('GPS activado');
      },
      (error) => {
        console.error('[GPS] Error inicial:', error);
        setGpsStatus('error');
      },
      geoOptions
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLastLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          timestamp: new Date()
        });
      },
      (error) => {
        console.error('[GPS] Error en watch:', error);
        setGpsStatus('error');
      },
      geoOptions
    );

    sendIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        sendLocationToBackend,
        (error) => console.error('[GPS] Error en intervalo:', error),
        geoOptions
      );
    }, 10000); // 10s con WebSocket (antes 30s con HTTP)
  }, [sendLocationToBackend]);

  // Detener tracking GPS
  const stopGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sendIntervalRef.current !== null) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
    setGpsStatus('inactive');
  }, []);

  // Cargar datos del tour
  const loadTourData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[GuideTourView] Cargando datos del tour...', { reservationId, user });

      // Primero obtener la info del tour del guía para conseguir el activeTourId
      const guideId = user?.guideId || user?.id;
      console.log('[GuideTourView] GuideId:', guideId);

      const guideTours = await toursService.getGuideTours(guideId);
      console.log('[GuideTourView] Tours del guía:', guideTours);

      if (!guideTours.success) {
        throw new Error(guideTours.error || 'Error al obtener tours del guía');
      }

      // Buscar el tour con este reservationId
      const tourInfo = guideTours.data.find(t => t.reservationId === reservationId);
      console.log('[GuideTourView] Tour encontrado:', tourInfo);

      if (!tourInfo) {
        throw new Error('Tour no encontrado para esta reserva');
      }

      if (!tourInfo.activeTour?.id) {
        throw new Error('Este tour no ha sido iniciado. Debe iniciar el tour primero.');
      }

      setActiveTourId(tourInfo.activeTour.id);
      console.log('[GuideTourView] ActiveTourId:', tourInfo.activeTour.id);

      // Unirse a la room WebSocket del tour para recibir mensajes
      webSocketService.joinGuideTour(tourInfo.activeTour.id);

      // Ahora obtener el progreso con las paradas
      const progressResponse = await toursService.getTourProgress(tourInfo.activeTour.id);
      console.log('[GuideTourView] Progreso del tour:', progressResponse);

      if (!progressResponse.success) {
        throw new Error(progressResponse.error || progressResponse.message || 'Error al obtener progreso del tour');
      }

      setTourData({
        ...progressResponse.data,
        tourInfo: tourInfo
      });

      // Expandir la primera parada pendiente o la que está en progreso
      const inProgress = progressResponse.data.stops?.find(s => s.status === 'in_progress');
      const firstPending = progressResponse.data.stops?.find(s => s.status === 'pending');
      if (inProgress) {
        setExpandedStop(inProgress.id);
      } else if (firstPending) {
        setExpandedStop(firstPending.id);
      }

    } catch (err) {
      console.error('[GuideTourView] Error loading tour data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reservationId, user?.guideId, user?.id]);

  // Check-in en una parada
  const handleCheckIn = async (stopId) => {
    if (!activeTourId) {
      toast.error('No hay tour activo');
      return;
    }

    console.log('[GuideTourView] Check-in:', { activeTourId, stopId });
    setActionLoading(stopId);
    try {
      const response = await toursService.checkInStop(activeTourId, stopId);
      console.log('[GuideTourView] Check-in response:', response);

      if (response.success) {
        toast.success('¡Check-in realizado!');
        await loadTourData(); // Recargar datos
      } else {
        const errorMsg = response.error || response.message || 'Error en check-in';
        console.error('[GuideTourView] Check-in error response:', response);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('[GuideTourView] Error en check-in:', err);
      // Mostrar mensaje más descriptivo
      let errorMsg = err.message || 'Error al realizar check-in';
      if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
        errorMsg = t('monitoring.sessionExpired');
      } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
        errorMsg = t('monitoring.noPermissions');
      }
      toast.error(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  // Check-out de una parada
  const handleCheckOut = async (stopId, notes = '') => {
    if (!activeTourId) {
      toast.error('No hay tour activo');
      return;
    }

    console.log('[GuideTourView] Check-out:', { activeTourId, stopId, notes });
    setActionLoading(stopId);
    try {
      const response = await toursService.checkOutStop(activeTourId, stopId, notes);
      console.log('[GuideTourView] Check-out response:', response);

      if (response.success) {
        toast.success('¡Parada completada!');
        await loadTourData(); // Recargar datos

        // Expandir la siguiente parada
        const currentIndex = tourData.stops.findIndex(s => s.id === stopId);
        const nextStop = tourData.stops[currentIndex + 1];
        if (nextStop && nextStop.status === 'pending') {
          setExpandedStop(nextStop.id);
        }
      } else {
        const errorMsg = response.error || response.message || 'Error en check-out';
        console.error('[GuideTourView] Check-out error response:', response);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('[GuideTourView] Error en check-out:', err);
      let errorMsg = err.message || 'Error al realizar check-out';
      if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
        errorMsg = t('monitoring.sessionExpired');
      } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
        errorMsg = t('monitoring.noPermissions');
      }
      toast.error(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReportIncident = () => {
    toast(t('monitoring.incidentReportSoon'), { icon: 'ℹ️' });
  };

  // Abrir modal para subir foto
  const openPhotoModal = (stop) => {
    setSelectedStopForMedia(stop);
    setPhotoCaption('');
    setShowPhotoModal(true);
  };

  // Abrir modal para agregar comentario
  const openCommentModal = (stop) => {
    setSelectedStopForMedia(stop);
    setCommentText('');
    setShowCommentModal(true);
  };

  // Manejar selección de archivo
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error(t('monitoring.onlyImages'));
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no puede superar 10MB');
      return;
    }

    await uploadPhoto(file);
  };

  // Subir foto al servidor
  const uploadPhoto = async (file) => {
    if (!activeTourId || !selectedStopForMedia) return;

    setUploadingPhoto(true);
    try {
      const options = {
        tourStopId: selectedStopForMedia.id,
        caption: photoCaption.trim() || undefined,
        latitude: lastLocation?.latitude,
        longitude: lastLocation?.longitude
      };

      const response = await toursService.uploadTourPhoto(activeTourId, file, options);

      if (response.success) {
        toast.success('Foto subida correctamente');

        // Agregar foto al estado local
        const stopId = selectedStopForMedia.id;
        setStopPhotos(prev => ({
          ...prev,
          [stopId]: [...(prev[stopId] || []), response.data]
        }));

        setShowPhotoModal(false);
        setPhotoCaption('');
      } else {
        throw new Error(response.message || 'Error al subir foto');
      }
    } catch (err) {
      console.error('Error subiendo foto:', err);
      toast.error(err.message || 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Agregar comentario a una parada
  const handleAddComment = async () => {
    if (!activeTourId || !selectedStopForMedia || !commentText.trim()) return;

    setActionLoading('comment');
    try {
      const response = await toursService.addStopComment(
        activeTourId,
        selectedStopForMedia.id,
        commentText.trim()
      );

      if (response.success) {
        toast.success('Comentario agregado');
        setShowCommentModal(false);
        setCommentText('');
        // Recargar datos para ver el comentario
        await loadTourData();
      } else {
        throw new Error(response.message || 'Error al agregar comentario');
      }
    } catch (err) {
      console.error('Error agregando comentario:', err);
      toast.error(err.message || 'Error al agregar comentario');
    } finally {
      setActionLoading(null);
    }
  };

  // Eliminar foto
  const handleDeletePhoto = async (stopId, photoId) => {
    if (!activeTourId) return;

    try {
      const response = await toursService.deleteTourPhoto(activeTourId, photoId);

      if (response.success) {
        toast.success('Foto eliminada');
        setStopPhotos(prev => ({
          ...prev,
          [stopId]: (prev[stopId] || []).filter(p => p.id !== photoId)
        }));
      }
    } catch (err) {
      console.error('Error eliminando foto:', err);
      toast.error('Error al eliminar la foto');
    }
  };

  // Cargar fotos existentes al cargar el tour
  const loadStopPhotos = useCallback(async () => {
    if (!activeTourId) return;

    try {
      const response = await toursService.getTourPhotos(activeTourId);
      if (response.success && response.data) {
        // Agrupar fotos por stopId
        const grouped = {};
        for (const photo of response.data) {
          const sid = photo.stopId || 'general';
          if (!grouped[sid]) grouped[sid] = [];
          grouped[sid].push(photo);
        }
        setStopPhotos(grouped);
      }
    } catch (err) {
      console.error('Error cargando fotos:', err);
    }
  }, [activeTourId]);

  const handleCompleteTour = () => {
    setShowCompletionDialog(true);
  };

  const confirmCompleteTour = async () => {
    try {
      setActionLoading('complete');
      stopGpsTracking();

      const response = await toursService.completeTour(activeTourId);

      if (response.success) {
        toast.success('Tour completado exitosamente');
        setShowCompletionDialog(false);
        navigate('/guide/dashboard');
      } else {
        throw new Error(response.message || 'Error al completar el tour');
      }
    } catch (err) {
      console.error('Error completando tour:', err);
      toast.error(err.message || 'Error al completar el tour');
      startGpsTracking(); // Reactivar GPS si falla
    } finally {
      setActionLoading(null);
    }
  };

  // Formatear tiempo
  const formatTime = (date) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular progreso
  const getProgressPercent = () => {
    if (!tourData?.stops?.length) return 0;
    const completed = tourData.stops.filter(s => s.status === 'completed').length;
    return Math.round((completed / tourData.stops.length) * 100);
  };

  // Efecto inicial
  useEffect(() => {
    if (user?.role !== 'guide') {
      toast.error(t('monitoring.guideAccessOnly'));
      navigate('/');
      return;
    }

    loadTourData();
    startGpsTracking();

    return () => {
      stopGpsTracking();
    };
  }, [user?.role, navigate, loadTourData, startGpsTracking, stopGpsTracking]);

  // Cargar fotos cuando se tenga el activeTourId
  useEffect(() => {
    if (activeTourId) {
      loadStopPhotos();
    }
  }, [activeTourId, loadStopPhotos]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-gray-600">Cargando tour...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/guide/dashboard')}
            className="btn btn-primary"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/guide/dashboard')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">{tourData?.tourName || t('monitoring.guideView')}</h1>
                <p className="text-sm text-gray-600">{tourData?.tourInfo?.agency?.business_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Indicador de GPS */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                gpsStatus === 'active'
                  ? 'bg-green-100 text-green-700'
                  : gpsStatus === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
              }`}>
                <MapPinIcon className={`w-4 h-4 ${gpsStatus === 'active' ? 'animate-pulse' : ''}`} />
                {gpsStatus === 'active' ? 'GPS Activo' : gpsStatus === 'error' ? 'GPS Error' : 'GPS Inactivo'}
              </div>

              <button
                onClick={handleReportIncident}
                className="btn btn-outline flex items-center gap-2 text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              >
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Reportar Incidente</span>
              </button>

              <button
                onClick={handleCompleteTour}
                className="btn btn-success flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Finalizar Tour</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Progreso general */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Progreso del Tour</h3>
            <span className="text-sm font-semibold text-primary">{getProgressPercent()}% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>{tourData?.stops?.filter(s => s.status === 'completed').length || 0} de {tourData?.stops?.length || 0} paradas</span>
            <span>Inicio: {formatTime(tourData?.startedAt)}</span>
          </div>
        </div>

        {/* Lista de paradas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Itinerario</h3>
          </div>

          <div className="divide-y">
            {tourData?.stops?.map((stop, index) => (
              <div key={stop.id} className="p-4">
                {/* Header de la parada */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedStop(expandedStop === stop.id ? null : stop.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Número de parada con estado */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                      stop.status === 'completed' ? 'bg-green-500' :
                      stop.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`}>
                      {stop.status === 'completed' ? (
                        <CheckIcon className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">{stop.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4" />
                        <span>{stop.duration} min</span>
                        {stop.arrivedAt && (
                          <>
                            <span>•</span>
                            <span>Llegada: {formatTime(stop.arrivedAt)}</span>
                          </>
                        )}
                        {stop.departedAt && (
                          <>
                            <span>•</span>
                            <span>Salida: {formatTime(stop.departedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botones rápidos de foto/comentario - visibles siempre para paradas en curso */}
                    {(stop.status === 'in_progress' || stop.status === 'completed') && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); openPhotoModal(stop); }}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                          title="Subir foto"
                        >
                          <CameraIcon className="w-5 h-5" />
                        </button>
                        {stop.status === 'in_progress' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openCommentModal(stop); }}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                            title="Agregar nota"
                          >
                            <ChatBubbleLeftIcon className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}

                    {/* Badge de estado */}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      stop.status === 'completed' ? 'bg-green-100 text-green-800' :
                      stop.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {stop.status === 'completed' ? 'Completada' :
                       stop.status === 'in_progress' ? 'En curso' :
                       'Pendiente'}
                    </span>

                    {expandedStop === stop.id ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Contenido expandido */}
                {expandedStop === stop.id && (
                  <div className="mt-4 pl-13 border-l-2 border-gray-200 ml-5">
                    <div className="pl-4">
                      {/* Descripción */}
                      {stop.description && (
                        <p className="text-gray-600 mb-4">{stop.description}</p>
                      )}

                      {/* Acciones */}
                      <div className="flex flex-wrap gap-2">
                        {/* Check-in */}
                        {stop.status === 'pending' && (
                          <button
                            onClick={() => handleCheckIn(stop.id)}
                            disabled={actionLoading === stop.id}
                            className="btn btn-primary flex items-center gap-2"
                          >
                            {actionLoading === stop.id ? (
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                              <PlayIcon className="w-4 h-4" />
                            )}
                            Check-in (Llegué)
                          </button>
                        )}

                        {/* Check-out */}
                        {stop.status === 'in_progress' && (
                          <button
                            onClick={() => handleCheckOut(stop.id)}
                            disabled={actionLoading === stop.id}
                            className="btn btn-success flex items-center gap-2"
                          >
                            {actionLoading === stop.id ? (
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckIcon className="w-4 h-4" />
                            )}
                            Check-out (Completar)
                          </button>
                        )}
                        {/* Nota: Botones de foto y comentario están en el header de la parada */}
                      </div>

                      {/* Fotos de esta parada */}
                      {stopPhotos[stop.id]?.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Fotos ({stopPhotos[stop.id].length})
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {stopPhotos[stop.id].map(photo => (
                              <div key={photo.id} className="relative group">
                                <img
                                  src={resolveFileUrl(photo.photoUrl)}
                                  alt={photo.caption || 'Foto del tour'}
                                  className="w-20 h-20 object-cover rounded-lg border"
                                />
                                <button
                                  onClick={() => handleDeletePhoto(stop.id, photo.id)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <XMarkIcon className="w-3 h-3" />
                                </button>
                                {photo.caption && (
                                  <p className="text-xs text-gray-500 mt-1 truncate max-w-[80px]">
                                    {photo.caption}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notas/Comentarios */}
                      {stop.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            <strong>Notas:</strong> {stop.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">📱 Contacto de Emergencia</h4>
            <p className="text-sm text-gray-600 mb-1">
              Agencia: {tourData?.tourInfo?.agency?.business_name}
            </p>
            <p className="text-xs text-gray-500">
              Contacta a la agencia por chat o mensaje
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">⚠️ Reportar Problema</h4>
            <p className="text-sm text-gray-600 mb-3">
              Retrasos, cambios de plan, etc.
            </p>
            <button
              onClick={handleReportIncident}
              className="btn btn-outline w-full"
            >
              Reportar Incidente
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">✅ Finalizar Servicio</h4>
            <p className="text-sm text-gray-600 mb-3">
              Cuando termines todas las paradas
            </p>
            <button
              onClick={handleCompleteTour}
              className="btn btn-success w-full"
            >
              Finalizar Tour
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showCompletionDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowCompletionDialog(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Finalizar Tour
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas finalizar este tour?
                        Esta acción notificará a la agencia que el servicio ha sido completado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={confirmCompleteTour}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Sí, Finalizar Tour
                </button>
                <button
                  onClick={() => setShowCompletionDialog(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para subir foto */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => !uploadingPhoto && setShowPhotoModal(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Subir Foto - {selectedStopForMedia?.name}
                  </h3>
                  <button
                    onClick={() => !uploadingPhoto && setShowPhotoModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={uploadingPhoto}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Input para seleccionar archivo */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Área de selección de foto */}
                <div
                  onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    uploadingPhoto
                      ? 'border-gray-300 bg-gray-50 cursor-wait'
                      : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                  }`}
                >
                  {uploadingPhoto ? (
                    <div className="flex flex-col items-center">
                      <ArrowPathIcon className="w-12 h-12 text-primary animate-spin mb-2" />
                      <p className="text-gray-600">Subiendo foto...</p>
                    </div>
                  ) : (
                    <>
                      <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-1">Toca para tomar o seleccionar foto</p>
                      <p className="text-xs text-gray-400">JPG, PNG, GIF, WEBP (máx. 10MB)</p>
                    </>
                  )}
                </div>

                {/* Campo para descripción */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="Ej: Vista del mirador"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    maxLength={200}
                    disabled={uploadingPhoto}
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowPhotoModal(false)}
                  disabled={uploadingPhoto}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar comentario */}
      {showCommentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => actionLoading !== 'comment' && setShowCommentModal(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Agregar Nota - {selectedStopForMedia?.name}
                  </h3>
                  <button
                    onClick={() => actionLoading !== 'comment' && setShowCommentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={actionLoading === 'comment'}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Textarea para el comentario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentario o nota
                  </label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escribe aquí tu nota sobre esta parada..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    maxLength={500}
                    disabled={actionLoading === 'comment'}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {commentText.length}/500
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || actionLoading === 'comment'}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {actionLoading === 'comment' ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Nota'
                  )}
                </button>
                <button
                  onClick={() => setShowCommentModal(false)}
                  disabled={actionLoading === 'comment'}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideTourView;
