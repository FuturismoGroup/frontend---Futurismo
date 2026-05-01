import { useState, useEffect } from 'react';
import i18next from 'i18next';
import toast from 'react-hot-toast';
import toursService from '../services/toursService';
import useAuthStore from '../stores/authStore';

const useGuideTours = () => {
  const { user } = useAuthStore();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTour, setActiveTour] = useState(null);

  // Cargar tours del guía
  const loadGuideTours = async () => {
    // Usar guideId si está disponible, sino usar user.id como fallback
    const guideId = user?.guideId || user?.id;
    if (!guideId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await toursService.getGuideTours(guideId);

      if (response.success) {
        // Mapear datos del backend al formato esperado por el componente
        const mappedTours = (response.data || []).map(item => {
          // Formatear fecha
          let formattedDate = '';
          if (item.date) {
            try {
              const dateObj = new Date(item.date);
              formattedDate = dateObj.toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
            } catch (e) {
              formattedDate = item.date;
            }
          }

          // Formatear hora
          let formattedTime = '';
          if (item.time) {
            try {
              // Si time es una fecha ISO, extraer solo la hora
              if (item.time.includes('T')) {
                const timeObj = new Date(item.time);
                formattedTime = timeObj.toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
              } else {
                // Si ya es un string de hora, usarlo directamente
                formattedTime = item.time;
              }
            } catch (e) {
              formattedTime = item.time || '';
            }
          }

          return {
            id: item.reservationId || item.id,
            name: item.tour?.name || item.tourName || i18next.t('common.noData'),
            tourId: item.tour?.id || item.tourId,
            duration: item.tour?.duration || item.duration,
            date: formattedDate,
            time: formattedTime,
            tourists: item.participants || item.tourists || 0,
            status: item.status || 'pending',
            agency: item.agency?.business_name || item.agencyName || i18next.t('common.noData'),
            location: item.location || item.meeting_point || i18next.t('common.noData'),
            // Mantener datos originales por si se necesitan
            _original: item
          };
        });

        setTours(mappedTours);

        // Buscar tour activo
        const active = mappedTours.find(tour =>
          ['en_camino', 'iniciado', 'en_progreso'].includes(tour.status)
        );
        setActiveTour(active?.id || null);
      } else {
        throw new Error(response.message || i18next.t('errors.unexpectedError'));
      }
    } catch (err) {
      console.error('Error loading guide tours:', err);
      setError(err.message);
      toast.error(i18next.t('errors.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de tour
  const updateTourStatus = async (tourId, newStatus) => {
    try {
      // Verificar restricción de tour activo
      if (activeTour && activeTour !== tourId && 
          ['en_camino', 'iniciado', 'en_progreso'].includes(newStatus)) {
        toast.error(i18next.t('monitoring.tour.onlyOneActiveTour', { defaultValue: 'Solo puedes tener un tour activo a la vez' }));
        return false;
      }

      const response = await toursService.updateTourStatus(tourId, newStatus, user.id);
      
      if (response.success) {
        // Actualizar estado local
        setTours(prevTours => 
          prevTours.map(tour => {
            if (tour.id === tourId) {
              const updatedTour = { ...tour, status: newStatus };
              
              // Actualizar tour activo
              if (['en_camino', 'iniciado', 'en_progreso'].includes(newStatus)) {
                setActiveTour(tourId);
                updatedTour.isActive = true;
              } else if (newStatus === 'finalizado') {
                if (activeTour === tourId) {
                  setActiveTour(null);
                }
                updatedTour.isActive = false;
              }
              
              return updatedTour;
            }
            // Desactivar otros tours si se activa uno nuevo
            else if (['en_camino', 'iniciado', 'en_progreso'].includes(newStatus)) {
              return { ...tour, isActive: false };
            }
            return tour;
          })
        );

        toast.success(`Tour ${newStatus.replace('_', ' ')}`);
        return true;
      } else {
        throw new Error(response.message || i18next.t('errors.unexpectedError'));
      }
    } catch (err) {
      console.error('Error updating tour status:', err);
      toast.error(i18next.t('errors.unexpectedError'));
      return false;
    }
  };

  // Obtener tour por ID
  const getTourById = (tourId) => {
    return tours.find(tour => tour.id === tourId);
  };

  // Verificar si puede cambiar estado
  const canChangeStatus = (tour, newStatus) => {
    if (!tour) return false;
    
    const statusFlow = {
      'asignado': ['en_camino'],
      'en_camino': ['iniciado'],
      'iniciado': ['en_progreso'],
      'en_progreso': ['finalizado'],
      'finalizado': []
    };

    return statusFlow[tour.status]?.includes(newStatus) || false;
  };

  // Obtener tours por estado
  const getToursByStatus = (status) => {
    return tours.filter(tour => tour.status === status);
  };

  // Estadísticas básicas
  const getStats = () => {
    return {
      total: tours.length,
      pending: tours.filter(t => t.status === 'asignado').length,
      active: tours.filter(t => ['en_camino', 'iniciado', 'en_progreso'].includes(t.status)).length,
      completed: tours.filter(t => t.status === 'finalizado').length,
      totalTourists: tours.reduce((sum, tour) => sum + (tour.tourists || 0), 0)
    };
  };

  // Cargar tours al montar el componente
  useEffect(() => {
    if (user?.role === 'guide') {
      loadGuideTours();
    }
  }, [user?.guideId, user?.id]);

  return {
    tours,
    loading,
    error,
    activeTour,
    loadGuideTours,
    updateTourStatus,
    getTourById,
    canChangeStatus,
    getToursByStatus,
    getStats,
    refresh: loadGuideTours
  };
};

export default useGuideTours;