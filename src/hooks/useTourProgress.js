import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { TOUR_STATUS } from '../constants/monitoringConstants';
import useNotificationStore from '../stores/notificationsStore';

const useTourProgress = (initialTourData, isGuideView = false) => {
  const [expandedStop, setExpandedStop] = useState(null);
  const [tourData, setTourData] = useState(() => {
    // Inicializar con datos proporcionados
    return {
      ...initialTourData,
      // Agregar timestamps reales para interactividad
      lastUpdate: new Date(),
      isActive: true
    };
  });
  const [autoProgressTimer, setAutoProgressTimer] = useState(null);
  const { t } = useTranslation();
  const { addNotification } = useNotificationStore();

  // Datos base del tour (sin traducir para evitar errores si no hay i18n keys)
  const baseTour = initialTourData || {
    name: '',
    guide: { name: '', phone: '' },
    stops: [],
    incidents: []
  };

  const getProgressPercentage = () => {
    const completedStops = baseTour.stops.filter(s => s.status === TOUR_STATUS.COMPLETED).length;
    return baseTour.stops.length > 0 ? (completedStops / baseTour.stops.length) * 100 : 0;
  };

  const getEstimatedDelay = () => {
    if (!baseTour.actualStartTime || !baseTour.startTime) return 0;
    const now = new Date();
    const elapsed = now - new Date(baseTour.actualStartTime);
    const plannedElapsed = now - new Date(baseTour.startTime);
    const delay = elapsed - plannedElapsed;
    return delay > 0 ? delay / 60000 : 0;
  };

  const handlePhotosChange = (stopId, newPhotos) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Photos updated for stop:', stopId, newPhotos);
    }
    toast.success(t('monitoring.tour.photosUpdated'));
  };

  const canUploadPhotos = (stop) => {
    return isGuideView && (
      stop.status === TOUR_STATUS.IN_PROGRESS || 
      stop.status === TOUR_STATUS.COMPLETED
    );
  };

  const toggleStop = (stopId) => {
    setExpandedStop(expandedStop === stopId ? null : stopId);
  };

  // ===== NUEVAS FUNCIONES INTERACTIVAS =====

  const handleCheckIn = useCallback((stopId) => {
    if (!isGuideView) return;

    setTourData(prevData => {
      const updatedStops = prevData.stops.map(stop => {
        if (stop.id === stopId) {
          const now = new Date();
          return {
            ...stop,
            status: TOUR_STATUS.IN_PROGRESS,
            arrivalTime: now,
            actualTime: null // Se completará al hacer check-out
          };
        }
        return stop;
      });

      return {
        ...prevData,
        stops: updatedStops,
        lastUpdate: new Date()
      };
    });

    // Notificación para la central
    const stopName = baseTour.stops.find(s => s.id === stopId)?.name || '';
    addNotification({
      title: t('monitoring.notifications.checkIn'),
      message: t('monitoring.notifications.checkInMessage', { stopName }),
      type: 'info',
      duration: 5000
    });

    toast.success(t('monitoring.tour.checkedIn'));
  }, [isGuideView, addNotification, t, baseTour.stops]);

  const handleCheckOut = useCallback((stopId) => {
    if (!isGuideView) return;

    setTourData(prevData => {
      const updatedStops = prevData.stops.map(stop => {
        if (stop.id === stopId && stop.status === TOUR_STATUS.IN_PROGRESS) {
          const now = new Date();
          const actualTimeMinutes = stop.arrivalTime ? 
            Math.round((now - new Date(stop.arrivalTime)) / 60000) : 
            stop.estimatedTime;

          return {
            ...stop,
            status: TOUR_STATUS.COMPLETED,
            departureTime: now,
            actualTime: actualTimeMinutes
          };
        }
        return stop;
      });

      return {
        ...prevData,
        stops: updatedStops,
        lastUpdate: new Date()
      };
    });

    // Notificación para la central
    const stopName = baseTour.stops.find(s => s.id === stopId)?.name || '';
    addNotification({
      title: t('monitoring.notifications.checkOut'),
      message: t('monitoring.notifications.checkOutMessage', { stopName }),
      type: 'success',
      duration: 5000
    });

    toast.success(t('monitoring.tour.checkedOut'));

    // Auto-avanzar al siguiente punto después de 2 segundos
    setTimeout(() => {
      const currentIndex = baseTour.stops.findIndex(s => s.id === stopId);
      const nextStop = baseTour.stops[currentIndex + 1];
      if (nextStop && nextStop.status === TOUR_STATUS.PENDING) {
        setExpandedStop(nextStop.id);
        toast.info(t('monitoring.tour.nextStop', { stopName: nextStop.name }));
      }
    }, 2000);
  }, [isGuideView, addNotification, t, baseTour.stops]);

  const reportIncident = useCallback((stopId, incidentType, message) => {
    const incident = {
      id: Date.now(),
      type: incidentType,
      message: message || t('monitoring.incidents.generic'),
      time: new Date(),
      resolved: false
    };

    setTourData(prevData => {
      const updatedStops = prevData.stops.map(stop => {
        if (stop.id === stopId) {
          return {
            ...stop,
            incidents: [...(stop.incidents || []), incident]
          };
        }
        return stop;
      });

      return {
        ...prevData,
        stops: updatedStops,
        incidents: [...prevData.incidents, incident],
        lastUpdate: new Date()
      };
    });

    // Notificación urgente para la central
    const stopName = baseTour.stops.find(s => s.id === stopId)?.name || '';
    addNotification({
      title: t('monitoring.notifications.incident'),
      message: t('monitoring.notifications.incidentMessage', {
        stopName,
        incident: message
      }),
      type: 'error',
      duration: 10000,
      urgent: true
    });

    toast.error(t('monitoring.tour.incidentReported'));
  }, [addNotification, t, baseTour.stops]);

  const canCheckIn = useCallback((stop) => {
    return isGuideView && stop.status === TOUR_STATUS.PENDING;
  }, [isGuideView]);

  const canCheckOut = useCallback((stop) => {
    return isGuideView && stop.status === TOUR_STATUS.IN_PROGRESS;
  }, [isGuideView]);

  // Auto-simulación de progreso para demo (solo en vista monitoreo)
  useEffect(() => {
    if (!isGuideView && tourData.isActive) {
      const timer = setInterval(() => {
        // Simular progreso automático cada 30 segundos
        const now = new Date();
        const shouldProgress = Math.random() > 0.7; // 30% chance cada interval
        
        if (shouldProgress) {
          setTourData(prevData => ({
            ...prevData,
            lastUpdate: now
          }));
        }
      }, 30000);

      setAutoProgressTimer(timer);
      return () => {
        if (timer) clearInterval(timer);
      };
    }
  }, [isGuideView, tourData.isActive]);

  // Usar tourData en lugar de baseTour para datos reactivos
  const currentTour = {
    ...baseTour,
    ...tourData,
    stops: tourData.stops || baseTour.stops || []
  };

  const getCurrentProgressPercentage = () => {
    const completedStops = currentTour.stops.filter(s => s.status === TOUR_STATUS.COMPLETED).length;
    return currentTour.stops.length > 0 ? (completedStops / currentTour.stops.length) * 100 : 0;
  };

  return {
    tour: currentTour,
    expandedStop,
    progressPercentage: getCurrentProgressPercentage(),
    estimatedDelay: getEstimatedDelay(),
    handlePhotosChange,
    canUploadPhotos,
    toggleStop,
    // Nuevas funciones interactivas
    handleCheckIn,
    handleCheckOut,
    reportIncident,
    canCheckIn,
    canCheckOut,
    isActive: tourData.isActive,
    lastUpdate: tourData.lastUpdate
  };
};

export default useTourProgress;