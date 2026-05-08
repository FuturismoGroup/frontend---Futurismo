import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  PlayIcon,
  CheckCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import toursService from '../../services/toursService';
import reservationsService from '../../services/reservationsService';

const GuideDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [tours, setTours] = useState([]);
  const [completedTours, setCompletedTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, tour: null, action: null });
  const [activeTab, setActiveTab] = useState('active');

  // Parsear fecha sin desfase UTC
  const parseDateSafe = (dateStr) => {
    if (!dateStr) return { formatted: '', dateObj: null };
    try {
      const dateOnly = String(dateStr).split('T')[0];
      const [year, month, day] = dateOnly.split('-').map(Number);
      if (year && month && day) {
        const dateObj = new Date(year, month - 1, day, 12, 0, 0, 0);
        const formatted = dateObj.toLocaleDateString('es-PE', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        return { formatted, dateObj };
      }
    } catch { /* fall through */ }
    return { formatted: dateStr, dateObj: null };
  };

  // Parsear hora sin pasar por Date()
  const parseTimeSafe = (timeStr) => {
    if (!timeStr) return '';
    try {
      const raw = String(timeStr);
      if (/^\d{1,2}:\d{2}$/.test(raw)) return raw;
      if (raw.includes('T')) return raw.split('T')[1]?.substring(0, 5) || '';
      return raw;
    } catch {
      return timeStr || '';
    }
  };

  // Mapear respuesta del backend a formato UI
  const mapTours = (items) => {
    return (items || []).map(item => {
      const { formatted, dateObj } = parseDateSafe(item.date);
      return {
        id: item.reservationId || item.id,
        name: item.tour?.name || item.tourName || 'Tour sin nombre',
        tourId: item.tour?.id || item.tourId,
        duration: item.tour?.duration || item.duration,
        date: formatted,
        dateObj,
        time: parseTimeSafe(item.time),
        tourists: item.participants || item.tourists || 0,
        status: item.status || 'pending',
        agency: item.agency?.business_name || item.agencyName || 'Sin agencia',
        location: item.location || item.tour?.meeting_point || item.meeting_point || 'Por definir',
        activeTour: item.active_tours?.[0] || null,
        _original: item
      };
    });
  };

  // Cargar tours activos del guia
  const loadGuideTours = async () => {
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
        const mapped = mapTours(response.data);
        // Ordenar: in_progress > confirmed > pending > otros
        const statusOrder = { 'in_progress': 0, 'confirmed': 1, 'pending': 2 };
        mapped.sort((a, b) => {
          const orderA = statusOrder[a.status] ?? 3;
          const orderB = statusOrder[b.status] ?? 3;
          if (orderA !== orderB) return orderA - orderB;
          if (a.dateObj && b.dateObj) return a.dateObj - b.dateObj;
          return 0;
        });
        setTours(mapped);
      } else {
        throw new Error(response.message || t('guideDashboard.errorLoading'));
      }
    } catch (err) {
      console.error('Error loading guide tours:', err);
      setError(err.message);
      toast.error(t('guideDashboard.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  // Cargar tours completados (lazy, solo cuando se abre la tab)
  const loadCompletedTours = async () => {
    const guideId = user?.guideId || user?.id;
    if (!guideId) return;

    try {
      setCompletedLoading(true);
      const response = await toursService.getGuideTours(guideId, { includeCompleted: 'true' });

      if (response.success) {
        const mapped = mapTours(response.data);
        const completed = mapped.filter(t => t.status === 'completed');
        // Mas recientes primero
        completed.sort((a, b) => {
          if (a.dateObj && b.dateObj) return b.dateObj - a.dateObj;
          return 0;
        });
        setCompletedTours(completed);
      }
    } catch (err) {
      console.error('Error loading completed tours:', err);
    } finally {
      setCompletedLoading(false);
    }
  };

  // Iniciar tour (confirmed -> in_progress)
  const handleStartTour = async (tour) => {
    const tourInProgress = tours.find(t => t.status === 'in_progress' && t.id !== tour.id);
    if (tourInProgress) {
      toast.error(t('guideDashboard.alreadyInProgress'));
      return;
    }
    setConfirmDialog({ show: true, tour, action: 'start' });
  };

  // Completar tour (in_progress -> completed)
  const handleCompleteTour = (tour) => {
    setConfirmDialog({ show: true, tour, action: 'complete' });
  };

  // Confirmar accion
  const confirmAction = async () => {
    const { tour, action } = confirmDialog;
    if (!tour || !action) return;

    setActionLoading(tour.id);
    setConfirmDialog({ show: false, tour: null, action: null });

    try {
      const newStatus = action === 'start' ? 'in_progress' : 'completed';
      const response = await reservationsService.updateStatus(tour.id, newStatus);

      if (response.success) {
        toast.success(action === 'start'
          ? t('guideDashboard.tourStarted')
          : t('guideDashboard.tourCompleted')
        );

        if (action === 'start') {
          navigate(`/guide/tour/${tour.id}`);
        } else {
          await loadGuideTours();
        }
      } else {
        throw new Error(response.message || t('guideDashboard.errorUpdatingStatus'));
      }
    } catch (err) {
      console.error('Error updating tour status:', err);
      toast.error(err.message || t('guideDashboard.errorUpdatingStatus'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewTour = (tour) => {
    navigate(`/guide/tour/${tour.id}`);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('guideDashboard.status.pending') },
      'confirmed': { bg: 'bg-blue-100', text: 'text-blue-800', label: t('guideDashboard.status.confirmed') },
      'in_progress': { bg: 'bg-green-100', text: 'text-green-800', label: t('guideDashboard.status.in_progress') },
      'completed': { bg: 'bg-gray-100', text: 'text-gray-800', label: t('guideDashboard.status.completed') },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: t('guideDashboard.status.cancelled') }
    };
    return statusConfig[status] || statusConfig['pending'];
  };

  const isToday = (dateObj) => {
    if (!dateObj) return false;
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  };

  useEffect(() => {
    if (user?.role === 'guide') {
      loadGuideTours();
    }
  }, [user?.guideId, user?.id]);

  // Cargar completados cuando se abre la tab por primera vez
  useEffect(() => {
    if (activeTab === 'completed' && completedTours.length === 0 && !completedLoading) {
      loadCompletedTours();
    }
  }, [activeTab]);

  // Estadisticas de tours activos
  const stats = {
    total: tours.length,
    confirmed: tours.filter(t => t.status === 'confirmed').length,
    inProgress: tours.filter(t => t.status === 'in_progress').length,
    today: tours.filter(t => isToday(t.dateObj)).length,
    totalTourists: tours.reduce((sum, t) => sum + (t.tourists || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-gray-600">{t('guideDashboard.loading')}</p>
        </div>
      </div>
    );
  }

  // Lista de tours a mostrar segun tab activa
  const displayTours = activeTab === 'active' ? tours : completedTours;
  const isCompletedTab = activeTab === 'completed';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('guideDashboard.greeting', { name: user?.first_name || user?.name || 'Guía' })}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('guideDashboard.subtitle')}
              </p>
            </div>
            <button
              onClick={() => {
                loadGuideTours();
                if (completedTours.length > 0) loadCompletedTours();
              }}
              disabled={loading}
              className="btn btn-outline flex items-center gap-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('guideDashboard.refresh')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Estadisticas - 5 cards incluyendo Tours Hoy */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{t('guideDashboard.toursToday')}</p>
            <p className="text-2xl font-bold text-orange-600">{stats.today}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{t('guideDashboard.totalTours')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{t('guideDashboard.confirmed')}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{t('guideDashboard.inProgress')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{t('guideDashboard.totalTourists')}</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalTourists}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Tabs: Activos / Completados */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-3 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('guideDashboard.tabs.active')}
                {tours.length > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tours.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`flex-1 py-3 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'completed'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('guideDashboard.tabs.completed')}
                {completedTours.length > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {completedTours.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Loading para tab completados */}
        {isCompletedTab && completedLoading && (
          <div className="flex justify-center py-12">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Lista de tours */}
        {!(isCompletedTab && completedLoading) && (
          displayTours.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isCompletedTab ? t('guideDashboard.noCompletedTours') : t('guideDashboard.noToursAssigned')}
              </h3>
              <p className="text-gray-600">
                {isCompletedTab ? t('guideDashboard.noCompletedDescription') : t('guideDashboard.noToursDescription')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayTours.map(tour => {
                const statusBadge = getStatusBadge(tour.status);
                const isTodayTour = isToday(tour.dateObj);

                return (
                  <div
                    key={tour.id}
                    className={`bg-white rounded-lg shadow border-l-4 ${
                      tour.status === 'in_progress'
                        ? 'border-l-green-500'
                        : tour.status === 'completed'
                          ? 'border-l-gray-400'
                          : isTodayTour
                            ? 'border-l-orange-500'
                            : 'border-l-blue-500'
                    }`}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Informacion del tour */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {tour.name}
                                </h3>
                                {isTodayTour && tour.status !== 'in_progress' && tour.status !== 'completed' && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                    {t('guideDashboard.today')}
                                  </span>
                                )}
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                {statusBadge.label}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                              <span className="capitalize">{tour.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ClockIcon className="w-4 h-4 text-gray-400" />
                              <span>{tour.time || t('guideDashboard.noTime')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{tour.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <UserGroupIcon className="w-4 h-4 text-gray-400" />
                              <span>{tour.tourists} {t('guideDashboard.tourists')}</span>
                            </div>
                          </div>

                          <p className="mt-2 text-sm text-gray-500">
                            {t('guideDashboard.agency')}: {tour.agency}
                          </p>
                        </div>

                        {/* Acciones */}
                        <div className="flex flex-row sm:flex-col gap-2">
                          {(tour.status === 'pending' || tour.status === 'confirmed') && (
                            <button
                              onClick={() => handleStartTour(tour)}
                              disabled={actionLoading === tour.id}
                              className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                              {actionLoading === tour.id ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              ) : (
                                <PlayIcon className="w-4 h-4" />
                              )}
                              {t('guideDashboard.startTour')}
                            </button>
                          )}

                          {tour.status === 'in_progress' && (
                            <>
                              <button
                                onClick={() => handleViewTour(tour)}
                                className="btn btn-outline flex items-center justify-center gap-2"
                              >
                                <EyeIcon className="w-4 h-4" />
                                {t('guideDashboard.viewTour')}
                              </button>
                              <button
                                onClick={() => handleCompleteTour(tour)}
                                disabled={actionLoading === tour.id}
                                className="btn btn-success flex items-center justify-center gap-2"
                              >
                                {actionLoading === tour.id ? (
                                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircleIcon className="w-4 h-4" />
                                )}
                                {t('guideDashboard.completeTour')}
                              </button>
                            </>
                          )}

                          {tour.status === 'completed' && (
                            <button
                              onClick={() => handleViewTour(tour)}
                              className="btn btn-outline flex items-center justify-center gap-2"
                            >
                              <EyeIcon className="w-4 h-4" />
                              {t('guideDashboard.viewDetails')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Modal de confirmacion */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setConfirmDialog({ show: false, tour: null, action: null })}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    confirmDialog.action === 'start' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {confirmDialog.action === 'start' ? (
                      <PlayIcon className="h-6 w-6 text-blue-600" />
                    ) : (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {confirmDialog.action === 'start'
                        ? t('guideDashboard.confirmStartTitle')
                        : t('guideDashboard.confirmCompleteTitle')
                      }
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {confirmDialog.action === 'start'
                          ? t('guideDashboard.confirmStartMessage', { name: confirmDialog.tour?.name })
                          : t('guideDashboard.confirmCompleteMessage', { name: confirmDialog.tour?.name })
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={confirmAction}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    confirmDialog.action === 'start'
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {confirmDialog.action === 'start' ? t('guideDashboard.yesStart') : t('guideDashboard.yesComplete')}
                </button>
                <button
                  onClick={() => setConfirmDialog({ show: false, tour: null, action: null })}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('guideDashboard.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideDashboard;
