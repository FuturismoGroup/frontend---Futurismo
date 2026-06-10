/**
 * Página de Monitoreo de Tours Activos
 * Actualizado: 2026-02-21 - WebSocket GPS en tiempo real
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { MapIcon, UserGroupIcon, PlayIcon, PauseIcon, CheckIcon, PhotoIcon, MapPinIcon, ClockIcon, CameraIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import LiveMapResponsive from '../components/monitoring/LiveMapResponsive';
import TourProgress from '../components/monitoring/TourProgress';
import ActiveTourDetailsModal from '../components/monitoring/ActiveTourDetailsModal';
import useAuthStore from '../stores/authStore';
import useGuideTours from '../hooks/useGuideTours';
import monitoringService from '../services/monitoringService';
import webSocketService from '../services/websocket';
import toast from 'react-hot-toast';

const Monitoring = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // Estados para tours activos (admin y agencia)
  const [activeServices, setActiveServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Estados del componente
  const [activeView, setActiveView] = useState('map');
  const [selectedTour, setSelectedTour] = useState(null);
  const [showCheckpoints, setShowCheckpoints] = useState({});
  const [capturedPhotos, setCapturedPhotos] = useState({});
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [focusServiceId, setFocusServiceId] = useState(null);
  // Ubicación real del guía obtenida por navigator.geolocation. Si el navegador
  // no soporta GPS o el guía no concede permiso, queda en null y el mapa no
  // pinta marcadores con coordenadas inventadas.
  const [guideRealLocation, setGuideRealLocation] = useState(null);

  // Para guías, solo mostrar sus propios tours
  const isGuide = user?.role === 'guide';
  const isAdmin = user?.role === 'admin' || user?.role === 'administrator';
  const isAgency = user?.role === 'agency';

  // Función para cargar tours activos (memoizada con useCallback)
  const loadActiveTours = useCallback(async () => {
    try {
      setServicesLoading(true);
      console.log('📊 Cargando tours activos desde /api/monitoring/active-tours');

      const result = await monitoringService.getActiveTours();

      if (result.success) {
        // result.data puede ser { data: [...], total, timestamp } o directamente un array
        const rawTours = Array.isArray(result.data) ? result.data : (result.data?.data || []);

        // Mapear datos del backend. Si el guía aún no ha enviado GPS la
        // ubicación queda en null: el tour sigue listado pero NO aparece como
        // marcador en el mapa con coordenadas inventadas. Antes se asignaban
        // ubicaciones de respaldo distribuidas en Lima/Ica, lo que daba la
        // impresión visual de que "todos los guías están en la misma zona"
        // aunque ninguno tenga GPS realmente conectado.
        const tours = rawTours.map((tour) => {
          const hasGps = !!(tour.guideLocation?.lat && tour.guideLocation?.lng);

          return {
            ...tour,
            id: tour.activeTourId || tour.reservationId,
            tourists: tour.passengers,
            currentLocation: hasGps
              ? {
                  lat: tour.guideLocation.lat,
                  lng: tour.guideLocation.lng,
                  name: tour.currentStop || t('monitoring.inTransit')
                }
              : null,
            hasGps,
            // Mapear status para el mapa (backend usa 'enroute', frontend espera 'enroute')
            status: tour.status === 'on_route' ? 'enroute' : tour.status,
            // Formatear tiempos
            startTime: tour.startTime
              ? new Date(tour.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
              : t('monitoring.page.notSpecified'),
            estimatedEndTime: tour.estimatedEndTime
              ? new Date(tour.estimatedEndTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
              : t('monitoring.page.notSpecified')
          };
        });

        setActiveServices(tours);
        console.log(`✅ ${tours.length} tours activos cargados con datos detallados`);
      } else {
        console.error('❌ Error al cargar tours:', result.error);
        setActiveServices([]);
      }
    } catch (err) {
      console.error('❌ Error al cargar servicios activos:', err);
      setActiveServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, [t]);

  // WebSocket: escuchar ubicaciones GPS en tiempo real
  useEffect(() => {
    if (!isAdmin && !isAgency) return;

    // Listener para actualizaciones de ubicacion GPS via WebSocket
    const unsubLocation = webSocketService.on('guide:location:updated', (data) => {
      setActiveServices(prev => {
        if (!Array.isArray(prev)) return prev;
        const updated = prev.map(service => {
          // Coincidir por activeTourId o guideId
          if (
            (service.activeTourId && service.activeTourId === data.activeTourId) ||
            (service.guideId && service.guideId === data.guideId)
          ) {
            return {
              ...service,
              currentLocation: {
                lat: data.latitude,
                lng: data.longitude,
                name: service.currentStop || t('monitoring.inTransit')
              },
              guideLocation: {
                lat: data.latitude,
                lng: data.longitude,
                accuracy: data.accuracy,
                speed: data.speed,
                recordedAt: data.recordedAt
              },
              hasGps: true,
              lastLocationUpdate: data.recordedAt
            };
          }
          return service;
        });
        return updated;
      });
    });

    // Listener para cambios de estado de tour
    const unsubTourStatus = webSocketService.on('monitoring:tour:status', () => {
      // Recargar todos los datos cuando cambia el estado de un tour
      loadActiveTours();
    });

    return () => {
      unsubLocation();
      unsubTourStatus();
    };
  }, [isAdmin, isAgency, loadActiveTours]);

  // Cargar datos iniciales + polling de fallback (intervalo mayor porque tenemos WebSocket)
  useEffect(() => {
    if (isAdmin || isAgency) {
      // Carga inicial
      loadActiveTours();

      // Polling de fallback cada 30s (antes era 10s, ahora WebSocket es primario)
      const intervalId = setInterval(() => {
        loadActiveTours();
      }, 30000);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isAdmin, isAgency, loadActiveTours]);

  // Hook para manejar tours del guía (reemplaza datos hardcodeados)
  const {
    tours: guideTours,
    loading: toursLoading,
    activeTour,
    updateTourStatus,
    getStats
  } = useGuideTours();

  // Geolocalización en tiempo real para la vista del propio guía.
  // Antes el mapa del guía usaba coordenadas fijas de Lima (limaLocations) y
  // por eso el marcador aparecía en una calle cualquiera y nunca se movía.
  // Ahora el navegador entrega la posición real y la mantenemos sincronizada
  // con watchPosition mientras la pestaña está abierta.
  useEffect(() => {
    if (!isGuide) {
      setGuideRealLocation(null);
      return undefined;
    }
    if (!navigator.geolocation) {
      console.warn('[Monitoring] Geolocation no disponible en este navegador');
      return undefined;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 5_000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGuideRealLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.warn('[Monitoring] Error obteniendo posición inicial del guía:', error?.message);
      },
      geoOptions
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGuideRealLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.warn('[Monitoring] Error en watchPosition del guía:', error?.message);
      },
      geoOptions
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isGuide]);

  // Obtener estadísticas del guía
  const guideStats = getStats();

  // Estados que cuentan como "activo en curso" para el mapa.
  // Solo el estado canónico del backend cuenta como "en curso": `in_progress`.
  // Las reservas en `pending`/`confirmed` no van al mapa (no están en ruta);
  // las `completed`/`cancelled` tampoco. Esto mantiene coherencia entre el
  // contador del mapa y el tab "Mis tours".
  const ACTIVE_GUIDE_TOUR_STATUSES = ['in_progress'];
  const COMPLETED_STATUSES = ['completed'];

  // Función auxiliar para transformar tours del guía al formato del mapa.
  // Usa la ubicación real obtenida por GPS del navegador (guideRealLocation).
  // Si todavía no hay GPS (permiso denegado, navegador sin soporte o esperando
  // primer fix), currentLocation queda en null y el mapa NO pinta un marcador
  // con coordenadas inventadas — se mostrará el indicador "Esperando GPS".
  const transformGuideToursForMap = (tours) => {
    if (!Array.isArray(tours) || tours.length === 0) return [];

    const activeOnly = tours.filter(tour => ACTIVE_GUIDE_TOUR_STATUSES.includes(tour.status));
    const hasGps = !!(guideRealLocation?.lat && guideRealLocation?.lng);

    return activeOnly.map((tour) => {
      // Backend no soporta estado "pausado"; cualquier tour que pase el filtro está enrutado.
      const mapStatus = 'enroute';
      const isCompleted = COMPLETED_STATUSES.includes(tour.status);

      return {
        id: tour.id,
        tourName: tour.name,
        guideName: user?.name || t('monitoring.noGuide'),
        tourists: tour.tourists || 0,
        startTime: tour.time || '09:00',
        status: mapStatus,
        currentLocation: hasGps
          ? {
              lat: guideRealLocation.lat,
              lng: guideRealLocation.lng,
              name: tour.location || t('monitoring.inTransit')
            }
          : null,
        hasGps,
        progress: isCompleted ? 100 : 50,
        estimatedEndTime: isCompleted ? t('monitoring.page.completedStatus') : t('monitoring.page.inProgressStatus'),
        // Datos adicionales del tour original
        date: tour.date,
        agency: tour.agency
      };
    });
  };

  // Solo para guías: manejar tours
  const handleStartTour = async (tourId) => {
    try {
      await updateTourStatus(tourId, 'iniciado');
      toast.success(t('monitoring.page.tourStartedSuccess'));
    } catch (error) {
      toast.error(t('monitoring.page.tourStartError'));
    }
  };

  const handlePauseTour = async (tourId) => {
    try {
      await updateTourStatus(tourId, 'pausado');
      toast.success(t('monitoring.page.tourPausedSuccess'));
    } catch (error) {
      toast.error(t('monitoring.page.tourPauseError'));
    }
  };

  const handleCompleteTour = async (tourId) => {
    try {
      await updateTourStatus(tourId, 'completado');
      toast.success(t('monitoring.page.tourCompletedSuccess'));
    } catch (error) {
      toast.error(t('monitoring.page.tourCompleteError'));
    }
  };

  const toggleCheckpoints = (tourId) => {
    setShowCheckpoints(prev => ({
      ...prev,
      [tourId]: !prev[tourId]
    }));
  };

  const handleOpenTourDetails = (tour) => {
    setSelectedTour(tour);
    setIsDetailModalOpen(true);
  };

  const handleCloseTourDetails = () => {
    setIsDetailModalOpen(false);
    // Pequeño delay antes de limpiar el tour seleccionado para una mejor animación
    setTimeout(() => {
      setSelectedTour(null);
    }, 200);
  };

  const handleViewOnMap = (tour) => {
    // Cerrar el modal
    handleCloseTourDetails();

    // Cambiar a la vista de mapa
    setActiveView('map');

    // Guardar el tour seleccionado para que el mapa lo centre
    setSelectedTour(tour);

    // Scroll al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTakePhoto = async (tourId, checkpointId) => {
    try {
      // Verificar si el navegador soporta la API de cámara
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error(t('monitoring.cameraNotAvailable'));
        return;
      }

      // Obtener acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Usar cámara trasera si está disponible
      });
      
      // Crear elemento video temporal
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Esperar a que el video esté listo
      video.onloadedmetadata = () => {
        // Crear canvas para capturar la foto
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Capturar frame actual
        ctx.drawImage(video, 0, 0);
        
        // Convertir a blob
        canvas.toBlob((blob) => {
          // Guardar foto capturada
          const photoUrl = URL.createObjectURL(blob);
          setCapturedPhotos(prev => ({
            ...prev,
            [`${tourId}-${checkpointId}`]: {
              url: photoUrl,
              timestamp: new Date().toISOString(),
              coordinates: null // Se podría añadir geolocalización aquí
            }
          }));
          
          toast.success(t('monitoring.page.photoTakenSuccess'));
          
          // Detener stream
          stream.getTracks().forEach(track => track.stop());
        }, 'image/jpeg', 0.8);
      };
      
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      if (error.name === 'NotAllowedError') {
        toast.error(t('monitoring.cameraPermissionDenied'));
      } else {
        toast.error(t('monitoring.cameraAccessError'));
      }
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Fórmula de Haversine para calcular distancia entre coordenadas
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000; // Convertir a metros
    return distance;
  };

  const isNearCheckpoint = (checkpointLocation, userLocation, threshold = 100) => {
    if (!userLocation) return false;
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      checkpointLocation.lat, checkpointLocation.lng
    );
    return distance <= threshold;
  };

  // Configuración de vistas según el rol
  const viewConfig = isGuide 
    ? [
        { key: 'map', label: t('monitoring.views.liveMap'), icon: MapIcon },
        { key: 'tours', label: t('monitoring.views.myTours'), icon: UserGroupIcon },
      ]
    : [
        { key: 'map', label: t('monitoring.views.liveMap'), icon: MapIcon },
        { key: 'tours', label: t('monitoring.views.activeTours'), icon: UserGroupIcon },
      ];

  return (
    <div className="flex flex-col h-full overflow-hidden -m-3 sm:-m-4 lg:-m-6">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-3 lg:px-6 lg:pt-5 lg:pb-4">
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
            <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 break-words">
              {isGuide ? t('monitoring.myToursTitle') : t('monitoring.title')}
            </h1>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm lg:text-base text-gray-700">
              {isGuide
                ? t('monitoring.guideDescription')
                : t('monitoring.description')
              }
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-shrink-0 px-3 sm:px-4 lg:px-6 overflow-x-auto overflow-y-hidden border-b border-gray-200">
        <nav className="flex px-1 -mb-px space-x-4 sm:space-x-8 min-w-max">
          {viewConfig.map((view) => {
            const Icon = view.icon;
            const isActive = activeView === view.key;
            return (
              <button
                key={view.key}
                onClick={() => setActiveView(view.key)}
                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Icon className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{view.label}</span>
                  <span className="text-xs sm:hidden">{view.key === 'map' ? t('monitoring.page.tabMap') : t('monitoring.page.tabTours')}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 bg-white overflow-hidden">
        {/* Vista de Mapa - Para todos los roles */}
        {activeView === 'map' && (
          <div className="h-full flex flex-col lg:flex-row">
            {/* Panel lateral de servicios */}
            {!isGuide && (
              <div className="lg:w-[380px] xl:w-[420px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto bg-gray-50 max-h-[35vh] lg:max-h-none">
                <div className="p-3 border-b border-gray-200 bg-white sticky top-0 z-10">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <PlayIcon className="w-4 h-4 text-green-500" />
                    {t('monitoring.page.servicesInProgress')}
                    <span className="ml-auto text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {activeServices.length}
                    </span>
                  </h3>
                </div>
                {servicesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                ) : !Array.isArray(activeServices) || activeServices.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    <MapPinIcon className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm">{t('monitoring.page.noActiveTours')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {activeServices.map((service, index) => (
                      <div
                        key={service.id || `svc-${index}`}
                        onClick={() => setFocusServiceId(prev => prev === service.id ? null : service.id)}
                        className={`p-3 cursor-pointer transition-colors hover:bg-white ${
                          focusServiceId === service.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        {/* Header: nombre + estado */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-sm font-semibold text-gray-900 leading-tight">{service.tourName || t('monitoring.page.fallbackTourName')}</h4>
                          <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            service.status === 'enroute' ? 'bg-green-100 text-green-800' :
                            service.status === 'stopped' ? 'bg-yellow-100 text-yellow-800' :
                            service.status === 'delayed' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {service.status === 'enroute' ? t('monitoring.page.statusEnRoute') :
                             service.status === 'stopped' ? t('monitoring.page.statusStopped') :
                             service.status === 'delayed' ? t('monitoring.page.statusDelayed') : t('monitoring.page.statusActive')}
                          </span>
                        </div>

                        {/* Guía */}
                        <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                          <UserGroupIcon className="w-3.5 h-3.5 text-gray-400" />
                          {service.guideName || t('monitoring.noGuide')}
                        </p>

                        {/* Info compacta */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {service.startTime || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserGroupIcon className="w-3 h-3" />
                            {service.passengers || service.tourists || 0} turistas
                          </span>
                          {service.totalStops > 0 && (
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <CheckIcon className="w-3 h-3" />
                              {service.completedStops || 0}/{service.totalStops}
                            </span>
                          )}
                          {service.photosCount > 0 && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <CameraIcon className="w-3 h-3" />
                              {service.photosCount}
                            </span>
                          )}
                        </div>

                        {/* Parada actual */}
                        <div className="flex items-center gap-1 text-xs mb-2">
                          <MapPinIcon className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                          <span className="text-indigo-600 font-medium truncate">{service.currentStop || t('monitoring.inTransit')}</span>
                        </div>

                        {/* Estado de GPS del guía */}
                        <div className="flex items-center gap-1 text-[10px] mb-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${service.hasGps ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                          <span className={service.hasGps ? 'text-green-700' : 'text-gray-500 italic'}>
                            {service.hasGps ? t('monitoring.page.gpsConnected') : t('monitoring.page.waitingGps')}
                          </span>
                        </div>

                        {/* Barra de progreso */}
                        {service.progress !== undefined && (
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                              <span>{t('monitoring.tour.progress')}</span>
                              <span className="font-semibold">{Math.round(service.progress || 0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  service.progress >= 80 ? 'bg-green-500' :
                                  service.progress >= 50 ? 'bg-blue-500' :
                                  'bg-yellow-500'
                                }`}
                                style={{ width: `${service.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Botón ver detalles */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenTourDetails(service); }}
                          className="w-full px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          {t('monitoring.page.viewDetails')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mapa */}
            <div className="flex-1 min-h-[300px] p-2 sm:p-3">
              <LiveMapResponsive
                services={isGuide ? transformGuideToursForMap(guideTours) : activeServices}
                loading={isGuide ? toursLoading : servicesLoading}
                focusServiceId={focusServiceId}
                onServiceSelect={(service) => {
                  setSelectedTour(service);
                  setIsDetailModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Vista de Tours */}
        {activeView === 'tours' && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto">
            {isGuide ? (
              /* Vista de guía - Sus propios tours */
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-medium text-gray-900 sm:text-lg">
                    {t('monitoring.myTours')}
                  </h3>
                  <div className="text-xs text-gray-500 sm:text-sm">
                    {toursLoading ? t('common.loading') : `${guideTours.length} ${t('monitoring.toursTotal')}`}
                  </div>
                </div>

                {toursLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 rounded-full animate-spin sm:w-8 sm:h-8 border-t-transparent"></div>
                  </div>
                ) : guideTours.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <UserGroupIcon className="w-8 h-8 mx-auto mb-3 text-gray-300 sm:w-12 sm:h-12 sm:mb-4" />
                    <p className="text-sm sm:text-base">{t('monitoring.noToursAssigned')}</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {guideTours.map((tour, index) => (
                      <div key={tour.id || `tour-${index}`} className="p-3 transition-shadow border rounded-lg sm:p-4 hover:shadow-md">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 break-words sm:text-base">{tour.name}</h4>
                            <p className="text-xs text-gray-500 truncate sm:text-sm">{tour.agency}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${
                            tour.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : tour.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : tour.status === 'confirmed'
                              ? 'bg-indigo-100 text-indigo-800'
                              : tour.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {t(`monitoring.status.${tour.status}`)}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-gray-600 sm:space-y-2 sm:text-sm">
                          <div className="flex justify-between">
                            <span>{t('monitoring.date')}:</span>
                            <span>{tour.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('monitoring.time')}:</span>
                            <span>{tour.time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('monitoring.tourists')}:</span>
                            <span>{tour.tourists}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="flex-shrink-0">{t('monitoring.location')}:</span>
                            <span className="text-right truncate">{tour.location}</span>
                          </div>
                        </div>

                        {/* Controles del tour */}
                        <div className="mt-3 space-y-2 sm:space-y-3 sm:mt-4">
                          <div className="flex gap-1 sm:gap-2">
                            {tour.status === 'asignado' && (
                              <button
                                onClick={() => handleStartTour(tour.id)}
                                className="flex items-center justify-center flex-1 gap-1 px-2 py-2 text-xs text-white transition-colors bg-green-600 rounded sm:px-3 sm:text-sm hover:bg-green-700"
                              >
                                <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{t('monitoring.actions.start')}</span>
                                <span className="sm:hidden">Iniciar</span>
                              </button>
                            )}
                            
                            {tour.status === 'iniciado' && (
                              <>
                                <button
                                  onClick={() => handlePauseTour(tour.id)}
                                  className="flex items-center justify-center flex-1 gap-1 px-2 py-2 text-xs text-white transition-colors bg-yellow-600 rounded sm:px-3 sm:text-sm hover:bg-yellow-700"
                                >
                                  <PauseIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">{t('monitoring.actions.pause')}</span>
                                  <span className="sm:hidden">Pausar</span>
                                </button>
                                <button
                                  onClick={() => handleCompleteTour(tour.id)}
                                  className="flex items-center justify-center flex-1 gap-1 px-2 py-2 text-xs text-white transition-colors bg-blue-600 rounded sm:px-3 sm:text-sm hover:bg-blue-700"
                                >
                                  <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">{t('monitoring.actions.complete')}</span>
                                  <span className="sm:hidden">Finalizar</span>
                                </button>
                              </>
                            )}
                            
                            {tour.status === 'pausado' && (
                              <button
                                onClick={() => handleStartTour(tour.id)}
                                className="flex items-center justify-center flex-1 gap-1 px-3 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                              >
                                <PlayIcon className="w-4 h-4" />
                                {t('monitoring.actions.resume')}
                              </button>
                            )}
                          </div>

                          {/* Botón para mostrar/ocultar checkpoints */}
                          {tour.checkpoints && tour.checkpoints.length > 0 && (
                            <button
                              onClick={() => toggleCheckpoints(tour.id)}
                              className="flex items-center justify-center w-full gap-2 px-3 py-2 text-xs text-purple-700 transition-colors bg-purple-100 rounded sm:text-sm hover:bg-purple-200"
                            >
                              <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="text-center">
                                {showCheckpoints[tour.id] ? 'Ocultar' : 'Ver'} Puntos ({tour.checkpoints.length})
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Lista de checkpoints expandible */}
                        {showCheckpoints[tour.id] && tour.checkpoints && (
                          <div className="pt-3 mt-3 space-y-2 border-t sm:mt-4 sm:pt-4 sm:space-y-3">
                            <h5 className="flex items-center gap-1 text-xs font-medium text-gray-900 sm:text-sm">
                              <MapPinIcon className="w-3 h-3 text-purple-600 sm:w-4 sm:h-4" />
                              Puntos de Control
                            </h5>
                            {tour.checkpoints.map((checkpoint, index) => {
                              const photoKey = `${tour.id}-${checkpoint.id}`;
                              const hasPhoto = capturedPhotos[photoKey];
                              const isRecommended = checkpoint.isRecommended;

                              return (
                                <div
                                  key={checkpoint.id || index}
                                  className={`p-2 sm:p-3 rounded-lg border-2 ${
                                    hasPhoto 
                                      ? 'border-green-200 bg-green-50' 
                                      : isRecommended
                                      ? 'border-purple-200 bg-purple-50'
                                      : 'border-gray-200 bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center flex-1 min-w-0 gap-2">
                                      <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                        hasPhoto 
                                          ? 'bg-green-600 text-white'
                                          : isRecommended
                                          ? 'bg-purple-600 text-white' 
                                          : 'bg-gray-400 text-white'
                                      }`}>
                                        {checkpoint.order}
                                      </span>
                                      <span className="text-xs font-medium text-gray-900 truncate sm:text-sm">
                                        {checkpoint.name}
                                      </span>
                                      <div className="flex flex-col flex-shrink-0 gap-1 sm:flex-row">
                                        {isRecommended && !hasPhoto && (
                                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                            Recomendado
                                          </span>
                                        )}
                                        {hasPhoto && (
                                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                            ✓ Completado
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <p className="mb-2 text-xs text-gray-600 sm:text-sm sm:mb-3">
                                    {checkpoint.description}
                                  </p>
                                  
                                  {hasPhoto ? (
                                    /* Mostrar foto capturada */
                                    <div className="space-y-2">
                                      <img 
                                        src={capturedPhotos[photoKey].url}
                                        alt={`Foto de ${checkpoint.name}`}
                                        className="object-cover w-full h-24 border rounded sm:h-32"
                                      />
                                      <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                          <ClockIcon className="w-3 h-3" />
                                          <span className="truncate">{new Date(capturedPhotos[photoKey].timestamp).toLocaleTimeString()}</span>
                                        </span>
                                        <button 
                                          onClick={() => handleTakePhoto(tour.id, checkpoint.id)}
                                          className="px-2 py-1 text-xs text-purple-600 transition-colors rounded hover:text-purple-800 hover:bg-purple-50"
                                        >
                                          Retomar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Botón para tomar foto */
                                    <button
                                      onClick={() => handleTakePhoto(tour.id, checkpoint.id)}
                                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm rounded transition-colors ${
                                        isRecommended
                                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                                          : 'bg-gray-600 text-white hover:bg-gray-700'
                                      }`}
                                    >
                                      <PhotoIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                      Tomar Foto
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            
                            {/* Resumen de progreso */}
                            <div className="p-2 mt-2 text-center bg-gray-100 rounded sm:mt-3">
                              <span className="text-xs text-gray-600">
                                Fotos: {tour.checkpoints.filter(cp => capturedPhotos[`${tour.id}-${cp.id}`]).length} / {tour.checkpoints.length}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Vista de admin - Todos los tours activos */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('monitoring.page.activeTours')}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {servicesLoading ? t('monitoring.page.loadingShort') : t('monitoring.page.activeServicesCount', { count: Array.isArray(activeServices) ? activeServices.length : 0 })}
                  </div>
                </div>

                {servicesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                ) : !Array.isArray(activeServices) || activeServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-gray-400 border-2 border-gray-300 border-dashed rounded-lg">
                    <UserGroupIcon className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">{t('monitoring.page.noActiveToursNow')}</p>
                    <p className="mt-1 text-sm">{t('monitoring.page.toursAppearHere')}</p>
                  </div>
                ) : (
                  /* Lista de tours activos del sistema */
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {activeServices.map((service, index) => (
                      <div key={service.id || `service-${index}`} className="p-5 transition-all bg-white border-2 border-gray-200 shadow-sm rounded-xl hover:shadow-lg hover:border-blue-300">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="mb-1 text-base font-semibold text-gray-900">{service.tourName || t('monitoring.page.fallbackTourName')}</h4>
                            <p className="flex items-center gap-1 text-sm text-gray-600">
                              <UserGroupIcon className="w-4 h-4" />
                              {t('monitoring.comp.guideLabel')}: {service.guideName || t('monitoring.page.noGuideAssigned')}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            service.status === 'enroute'
                              ? 'bg-green-100 text-green-800'
                              : service.status === 'stopped'
                              ? 'bg-yellow-100 text-yellow-800'
                              : service.status === 'delayed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {service.status === 'enroute' ? t('monitoring.page.statusEnRoute') :
                             service.status === 'stopped' ? t('monitoring.page.statusStopped') :
                             service.status === 'delayed' ? t('monitoring.page.statusDelayed') : t('monitoring.page.statusActive')}
                          </span>
                        </div>

                        <div className="space-y-2.5 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="flex-shrink-0 w-4 h-4 text-gray-400" />
                            <span>{t('monitoring.page.startTimeLabel')}: {service.startTime || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserGroupIcon className="flex-shrink-0 w-4 h-4 text-gray-400" />
                            <span>{service.passengers || service.tourists || 0} {t('monitoring.tourists').toLowerCase()}</span>
                          </div>
                          {/* Parada actual */}
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="flex-shrink-0 w-4 h-4 text-gray-400" />
                            <span className="truncate font-medium text-indigo-600">
                              {service.currentStop || t('monitoring.inTransit')}
                            </span>
                          </div>
                          {/* Progreso de paradas */}
                          {service.totalStops > 0 && (
                            <div className="flex items-center gap-2">
                              <CheckIcon className="flex-shrink-0 w-4 h-4 text-green-500" />
                              <span className="text-green-700 font-medium">
                                {t('monitoring.page.stopsCompleted', { done: service.completedStops || 0, total: service.totalStops })}
                              </span>
                            </div>
                          )}
                          {/* Fotos tomadas */}
                          {service.photosCount > 0 && (
                            <div className="flex items-center gap-2">
                              <PhotoIcon className="flex-shrink-0 w-4 h-4 text-purple-500" />
                              <span className="text-purple-700">
                                {t('monitoring.page.photosRegistered', { count: service.photosCount })}
                              </span>
                            </div>
                          )}
                        </div>

                        {service.progress !== undefined && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                              <span className="font-medium">{t('monitoring.page.tourProgress')}</span>
                              <span className="font-semibold">{t('monitoring.page.percentCompleted', { percent: Math.round(service.progress || 0) })}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                  service.progress >= 80 ? 'bg-green-500' :
                                  service.progress >= 50 ? 'bg-blue-500' :
                                  'bg-yellow-500'
                                }`}
                                style={{ width: `${service.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-gray-200">
                          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="mb-1 text-xs font-semibold text-blue-900">{t('monitoring.page.serviceStatus')}</h5>
                                <p className="text-xs text-blue-700">
                                  {service.estimatedEndTime || t('monitoring.page.calculating')}
                                </p>
                              </div>
                              <div className={`w-3 h-3 rounded-full ${
                                service.status === 'enroute' ? 'bg-green-500 animate-pulse' :
                                service.status === 'stopped' ? 'bg-yellow-500' :
                                service.status === 'delayed' ? 'bg-red-500 animate-pulse' :
                                'bg-blue-500'
                              }`}></div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenTourDetails(service)}
                          className="w-full px-4 py-2 mt-4 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg"
                        >
                          {t('monitoring.page.viewDetails')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalles de tour activo */}
      <ActiveTourDetailsModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseTourDetails}
        tour={selectedTour}
        onViewOnMap={handleViewOnMap}
      />
    </div>
  );
};

export default Monitoring;