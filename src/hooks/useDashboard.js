import { useState, useEffect, useCallback, useRef } from 'react';
import i18next from 'i18next';
import dashboardService from '../services/dashboardService';
import useAuthStore from '../stores/authStore';

/**
 * Normaliza el rol del usuario: 'administrator' -> 'admin'
 */
const normalizeRole = (role) => {
  if (role === 'administrator') return 'admin';
  return role;
};

const useDashboard = () => {
  // Usar selectores individuales para evitar re-renders innecesarios
  const user = useAuthStore((state) => state.user);
  const lastUserIdRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);

  const userRole = normalizeRole(user?.role);

  // Cargar estadísticas del dashboard
  const loadStats = useCallback(async () => {
    if (!user?.id || !userRole) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getStats(user.id, userRole);

      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message || i18next.t('errors.unexpectedError'));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, userRole]);

  // Cargar datos mensuales para gráficos
  const loadMonthlyData = useCallback(async () => {
    if (!user?.id || !userRole) return;

    try {
      const response = await dashboardService.getMonthlyData(user.id, userRole);

      if (response.success) {
        setMonthlyData(response.data);
      }
    } catch {
      // Error loading monthly data
    }
  }, [user?.id, userRole]);

  // Formatear próximo tour para guides
  const getFormattedNextTour = () => {
    if (userRole !== 'guide' || !stats?.nextTour) {
      return '-';
    }

    const nextTour = new Date(stats.nextTour);
    const day = nextTour.getDate().toString().padStart(2, '0');
    const month = (nextTour.getMonth() + 1).toString().padStart(2, '0');
    const year = nextTour.getFullYear().toString().slice(-2);

    return `${day}-${month}-${year}`;
  };

  // Obtener datos específicos según el rol
  const getRoleSpecificStats = () => {
    if (!stats) return {};

    switch (userRole) {
      case 'guide':
        return {
          card1: {
            value: stats.toursThisWeek ?? 0,
            label: i18next.t('dashboard.indicators.toursThisWeek'),
            icon: 'calendar',
            trend: stats.toursThisWeekTrend || null
          },
          card2: {
            value: getFormattedNextTour(),
            label: i18next.t('dashboard.indicators.nextTour'),
            icon: 'clock',
            trend: null
          },
          card3: {
            value: stats.personalRating ? stats.personalRating.toFixed(1) : '0.0',
            label: i18next.t('dashboard.indicators.personalRating'),
            icon: 'star',
            trend: stats.ratingTrend || null
          },
          card4: {
            value: stats.monthlyIncome ?? 0,
            label: i18next.t('dashboard.indicators.monthlyIncome'),
            icon: 'dollar',
            format: 'currency',
            trend: stats.monthlyIncomeTrend || null
          }
        };

      case 'agency':
        return {
          card1: {
            value: stats.activeServices ?? 0,
            label: i18next.t('dashboard.indicators.activeServices'),
            icon: 'service',
            trend: stats.activeServicesTrend || null
          },
          card2: {
            value: stats.completedToday ?? 0,
            label: i18next.t('dashboard.indicators.completedToday'),
            icon: 'check',
            trend: stats.completedTodayTrend || null
          },
          card3: {
            value: stats.monthlyReservations ?? 0,
            label: i18next.t('dashboard.indicators.monthlyReservations'),
            icon: 'calendar',
            trend: null
          }
        };

      case 'admin':
      default:
        return {
          card1: {
            value: stats.activeServices ?? 0,
            label: i18next.t('dashboard.indicators.activeServices'),
            icon: 'service',
            trend: stats.activeServicesTrend || null
          },
          card2: {
            value: stats.totalAgencies ?? 0,
            label: i18next.t('dashboard.indicators.totalAgencies'),
            icon: 'building',
            trend: stats.totalAgenciesTrend || null
          },
          card3: {
            value: stats.totalRevenue ?? 0,
            label: i18next.t('dashboard.indicators.totalRevenue'),
            icon: 'dollar',
            format: 'currency',
            trend: stats.totalRevenueTrend || null
          },
          card4: {
            value: stats.totalGuides ?? 0,
            label: i18next.t('dashboard.indicators.registeredGuides'),
            icon: 'user',
            trend: null
          }
        };
    }
  };

  // Cargar datos al montar y cuando cambie el usuario
  // Detectar cambio de usuario para recargar datos
  useEffect(() => {
    if (user?.id && userRole) {
      if (lastUserIdRef.current !== user.id) {
        lastUserIdRef.current = user.id;
        loadStats();
        loadMonthlyData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userRole]);

  return {
    stats,
    loading,
    error,
    monthlyData,
    roleSpecificStats: getRoleSpecificStats(),
    getFormattedNextTour,
    refresh: () => {
      loadStats();
      loadMonthlyData();
    }
  };
};

export default useDashboard;
