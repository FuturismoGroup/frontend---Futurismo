import React, { useState, useEffect, useMemo } from 'react';
import {
  UsersIcon as Users,
  CalendarIcon as Calendar,
  FunnelIcon as Filter,
  MagnifyingGlassIcon as Search,
  ArrowDownTrayIcon as Download,
  ArrowPathIcon as RefreshCw,
  MapPinIcon as MapPin,
  ClockIcon as Clock,
  CheckCircleIcon as CheckCircle,
  CurrencyDollarIcon as DollarSign,
  ArrowTrendingUpIcon as TrendingUp,
  ChartBarIcon as BarChart3,
  PlusIcon,
  BuildingOfficeIcon,
  UserIcon,
  XMarkIcon,
  XCircleIcon,
  PlayIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import useReservationsStore from '../../stores/reservationsStore';
import useToursStore from '../../stores/toursStore';
import useGuidesStore from '../../stores/guidesStore';
import ReservationWizard from '../../components/reservations/ReservationWizard';
import reservationsService from '../../services/reservationsService';
import exportService from '../../services/exportService';
import { formatDateSafe } from '../../utils/dateUtils';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ReservationManagement = () => {
  const { t } = useTranslation();
  // Hooks de stores
  const { reservations, fetchReservations, isLoading } = useReservationsStore();
  const { tours, categories: tourCategories, initialize: initializeTours } = useToursStore();
  const { guides, fetchGuides } = useGuidesStore();
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    destination: 'all',
    guide: 'all',
    tourType: 'all',
    status: 'all', // Mostrar todas las reservas por defecto
    searchTerm: '',
    // Filtros por cantidad de turistas
    touristQuantityType: 'all', // all, range, category
    minTourists: '',
    maxTourists: '',
    touristCategory: 'all', // all, individual, small, medium, large, extra_large
    // Nuevos filtros de fecha avanzados
    dateFilterType: 'custom', // custom, today, week, biweekly, month, quarter, year
    specificDate: '',
    weekNumber: '',
    month: '',
    quarter: '',
    year: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Estados para modal de asignación de guía
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedGuideId, setSelectedGuideId] = useState('');
  const [assigningGuide, setAssigningGuide] = useState(false);

  // Estados para modal de cambio de estado
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusReservation, setStatusReservation] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar datos de manera independiente para evitar que un error bloquee todo
        const promises = [
          fetchReservations().catch(() => {}),
          initializeTours().catch(() => {}),
          fetchGuides().catch(() => {})
        ];

        await Promise.allSettled(promises);
      } catch {
        // Error loading data
      }
    };

    loadData();
  }, []);

  // Opciones de filtro de fecha
  const dateFilterOptions = [
    { value: 'custom', label: 'Personalizado' },
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'biweekly', label: 'Últimas 2 semanas' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Este trimestre' },
    { value: 'year', label: t('reservations.thisYear') }
  ];


  const statusOptions = ['all', 'completed', 'confirmed', 'pending', 'in_progress', 'cancelled'];

  // Enriquecer reservas con datos relacionados
  const enrichedReservations = Array.isArray(reservations) ? reservations.map(reservation => {
    const toursArray = Array.isArray(tours) ? tours : [];
    const guidesArray = Array.isArray(guides) ? guides : [];

    const tour = toursArray.find(t => t.id === reservation.tourId || t.id === reservation.service_id);
    const guide = guidesArray.find(g => g.id === reservation.guideId || g.id === reservation.guide_id);

    return {
      ...reservation,
      // Datos de la agencia (viene del backend en reservation.agencyName)
      agencyName: reservation.agencyName || 'Sin agencia',
      agencyEmail: reservation.agencyEmail || '',
      agencyPhone: reservation.agencyPhone || '',
      tourName: reservation.tourName || tour?.name || 'Tour sin nombre',
      destination: reservation.destination || tour?.destination || 'Sin destino',
      guide: reservation.guide?.name || guide?.name || t('reservations.noGuideAssigned'),
      tourists: (reservation.adults || 0) + (reservation.children || 0) || reservation.group_size || 0,
      totalAmount: reservation.total || reservation.total_amount || 0,
      tourType: reservation.tourType || reservation.tour?.tourType || tour?.tour_type || t('reservations.noCategory'),
      agencyId: reservation.agency_id || '',
      tourDate: reservation.date || reservation.tour_date,
      bookingDate: reservation.createdAt || reservation.created_at
    };
  }) : [];

  // Opciones dinámicas basadas en datos reales
  const destinations = Array.isArray(enrichedReservations) ? [...new Set(enrichedReservations.map(res => res.destination).filter(d => d && d !== 'Sin destino'))] : [];
  const guidesOptions = Array.isArray(guides) ? guides.map(guide => guide.name) : [];
  // Obtener tipos de tour desde las reservas existentes (más preciso para filtrar)
  const tourTypes = (() => {
    // Extraer categorías únicas de las reservas enriquecidas
    const fromReservations = [...new Set(
      enrichedReservations
        .map(res => res.tourType)
        .filter(t => t && t !== t('reservations.noCategory'))
    )];

    if (fromReservations.length > 0) {
      return fromReservations.sort();
    }

    // Fallback: intentar desde categorías del store
    if (Array.isArray(tourCategories) && tourCategories.length > 0) {
      return tourCategories.map(cat => cat.name || cat).filter(Boolean);
    }

    // Fallback: desde tours cargados
    if (Array.isArray(tours) && tours.length > 0) {
      const fromTours = [...new Set(tours.map(tour => tour.category || tour.tour_type).filter(Boolean))];
      if (fromTours.length > 0) return fromTours;
    }

    // Sin opciones disponibles
    return [];
  })();

  // Categorías por cantidad de turistas
  const touristCategories = [
    { value: 'all', label: 'Todas las cantidades', range: null },
    { value: 'individual', label: 'Individual (1 persona)', range: [1, 1] },
    { value: 'small', label: t('reservations.smallGroup'), range: [2, 4] },
    { value: 'medium', label: 'Grupo Mediano (5-8)', range: [5, 8] },
    { value: 'large', label: 'Grupo Grande (9-15)', range: [9, 15] },
    { value: 'extra_large', label: 'Grupo Extra Grande (16+)', range: [16, 999] }
  ];

  // Este useEffect ya no es necesario ya que tenemos otro que carga los datos reales

  // Función para manejar cambios en los filtros
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Filtrar reservas basado en los filtros aplicados
  const filteredReservations = useMemo(() => {
    let filtered = enrichedReservations;

    // Filtro por estado
    if (filters.status !== 'all') {
      filtered = filtered.filter(res => res.status === filters.status);
    }

    // Filtro por rango de fechas
    if (filters.dateFrom) {
      filtered = filtered.filter(res => res.tourDate >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(res => res.tourDate <= filters.dateTo);
    }

    // Filtro por destino
    if (filters.destination !== 'all') {
      filtered = filtered.filter(res => res.destination === filters.destination);
    }

    // Filtro por guía
    if (filters.guide !== 'all') {
      filtered = filtered.filter(res => res.guide === filters.guide);
    }

    // Filtro por tipo de tour (comparación case-insensitive)
    if (filters.tourType !== 'all') {
      const filterValue = filters.tourType.toLowerCase();
      filtered = filtered.filter(res =>
        (res.tourType || '').toLowerCase() === filterValue ||
        (res.tour_type || '').toLowerCase() === filterValue ||
        (res.category || '').toLowerCase() === filterValue
      );
    }

    // Filtro por término de búsqueda
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(res =>
        res.agencyName.toLowerCase().includes(searchTerm) ||
        res.agencyEmail.toLowerCase().includes(searchTerm) ||
        res.tourName.toLowerCase().includes(searchTerm) ||
        res.id.toLowerCase().includes(searchTerm)
      );
    }

    // Filtros por cantidad de turistas
    if (filters.touristQuantityType === 'range' && (filters.minTourists || filters.maxTourists)) {
      const minTourists = parseInt(filters.minTourists) || 0;
      const maxTourists = parseInt(filters.maxTourists) || 999;
      filtered = filtered.filter(res =>
        res.tourists >= minTourists && res.tourists <= maxTourists
      );
    } else if (filters.touristQuantityType === 'category' && filters.touristCategory !== 'all') {
      const category = touristCategories.find(cat => cat.value === filters.touristCategory);
      if (category && category.range) {
        const [min, max] = category.range;
        filtered = filtered.filter(res =>
          res.tourists >= min && res.tourists <= max
        );
      }
    }


    // Filtros de fecha avanzados
    if (filters.dateFilterType !== 'custom') {
      const today = new Date();
      let startDate = null;
      let endDate = null;

      switch (filters.dateFilterType) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          endDate = startDate;
          break;
        
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          startDate = weekStart.toISOString().split('T')[0];
          endDate = weekEnd.toISOString().split('T')[0];
          break;
        
        case 'biweekly':
          const biweeklyStart = new Date(today);
          biweeklyStart.setDate(today.getDate() - 14);
          startDate = biweeklyStart.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          startDate = monthStart.toISOString().split('T')[0];
          endDate = monthEnd.toISOString().split('T')[0];
          break;
        
        case 'quarter':
          const quarter = Math.floor(today.getMonth() / 3);
          const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
          const quarterEnd = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
          startDate = quarterStart.toISOString().split('T')[0];
          endDate = quarterEnd.toISOString().split('T')[0];
          break;
        
        case 'year':
          const yearStart = new Date(filters.year || today.getFullYear(), 0, 1);
          const yearEnd = new Date(filters.year || today.getFullYear(), 11, 31);
          startDate = yearStart.toISOString().split('T')[0];
          endDate = yearEnd.toISOString().split('T')[0];
          break;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(res => 
          res.tourDate >= startDate && res.tourDate <= endDate
        );
      }
    }

    return filtered;
  }, [enrichedReservations, filters]);

  // Calcular estadísticas basadas en reservas filtradas
  const stats = useMemo(() => {
    const totalReservations = filteredReservations.length;
    const totalTourists = filteredReservations.reduce((sum, res) => sum + res.tourists, 0);
    const totalRevenue = filteredReservations.reduce((sum, res) => sum + res.totalAmount, 0);
    const avgGroupSize = totalReservations > 0 ? parseFloat((totalTourists / totalReservations).toFixed(1)) : 0;

    // Distribución por tamaño de grupo
    const groupSizeDistribution = touristCategories.map(category => {
      if (category.value === 'all') return null;

      const count = filteredReservations.filter(res => {
        const [min, max] = category.range;
        return res.tourists >= min && res.tourists <= max;
      }).length;

      return {
        category: category.label,
        count,
        percentage: totalReservations > 0 ? parseFloat(((count / totalReservations) * 100).toFixed(1)) : 0
      };
    }).filter(Boolean);

    return {
      totalReservations,
      totalTourists,
      totalRevenue,
      avgGroupSize,
      groupSizeDistribution
    };
  }, [filteredReservations]);

  const handleExport = async () => {
    try {
      if (filteredReservations.length === 0) {
        toast.warning('No hay reservas para exportar');
        return;
      }

      // Preparar datos para exportación
      const dataToExport = filteredReservations.map(res => ({
        ID: res.id,
        Agencia: res.agencyName,
        Email: res.agencyEmail,
        Teléfono: res.agencyPhone,
        Tour: res.tourName,
        Destino: res.destination,
        Fecha: formatDate(res.tourDate),
        Guía: res.guide,
        'N° Turistas': res.tourists,
        Total: res.totalAmount,
        Estado: res.status === 'completed' ? 'Completado' :
                res.status === 'confirmed' ? 'Confirmado' :
                res.status === 'pending' ? 'Pendiente' :
                res.status === 'in_progress' ? 'En Progreso' :
                res.status === 'cancelled' ? 'Cancelado' : res.status
      }));

      // Usar el servicio de exportación
      exportService.exportToExcel(dataToExport, 'Reservas_Filtradas');

      toast.success(`Se exportaron ${filteredReservations.length} reservas exitosamente`);
    } catch {
      toast.error('Error al exportar las reservas');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Usar utilidad de fechas que maneja timezone correctamente
  const formatDate = (dateString) => {
    return formatDateSafe(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGroupSizeInfo = (touristCount) => {
    const category = touristCategories.find(cat => {
      if (!cat.range) return false;
      const [min, max] = cat.range;
      return touristCount >= min && touristCount <= max;
    });

    return {
      category: category?.value || 'unknown',
      label: category?.label || 'Desconocido',
      color: category?.value === 'individual' ? 'bg-blue-100 text-blue-800' :
             category?.value === 'small' ? 'bg-green-100 text-green-800' :
             category?.value === 'medium' ? 'bg-yellow-100 text-yellow-800' :
             category?.value === 'large' ? 'bg-purple-100 text-purple-800' :
             category?.value === 'extra_large' ? 'bg-red-100 text-red-800' :
             'bg-gray-100 text-gray-800'
    };
  };

  // Funciones para asignación de guía
  const handleOpenGuideModal = (reservation) => {
    setSelectedReservation(reservation);
    setSelectedGuideId(reservation.guide_id || reservation.guideId || '');
    setShowGuideModal(true);
  };

  const handleCloseGuideModal = () => {
    setShowGuideModal(false);
    setSelectedReservation(null);
    setSelectedGuideId('');
  };

  const handleAssignGuide = async () => {
    if (!selectedReservation || !selectedGuideId) {
      toast.error(t('reservations.selectGuide'));
      return;
    }

    setAssigningGuide(true);
    try {
      await reservationsService.assignGuide(selectedReservation.id, selectedGuideId);
      toast.success(t('reservations.guideAssignedSuccess'));
      handleCloseGuideModal();
      // Recargar reservas para reflejar el cambio
      await fetchReservations();
    } catch (error) {
      toast.error(error.response?.data?.message || t('reservations.guideAssignError'));
    } finally {
      setAssigningGuide(false);
    }
  };

  // Funciones para cambio de estado
  const handleOpenStatusModal = (reservation, status) => {
    setStatusReservation(reservation);
    setNewStatus(status);
    setCancellationReason('');
    setShowStatusModal(true);
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setStatusReservation(null);
    setNewStatus('');
    setCancellationReason('');
  };

  const handleStatusChange = async () => {
    if (!statusReservation || !newStatus) return;

    // Validar razón de cancelación
    if (newStatus === 'cancelled' && !cancellationReason.trim()) {
      toast.error(t('reservations.cancellationReasonRequired'));
      return;
    }

    setChangingStatus(true);
    try {
      await reservationsService.updateStatus(statusReservation.id, newStatus, cancellationReason || undefined);

      const statusLabels = {
        confirmed: 'confirmada',
        cancelled: 'cancelada',
        in_progress: 'iniciada',
        completed: 'completada'
      };

      toast.success(`Reserva ${statusLabels[newStatus] || newStatus} exitosamente`);
      handleCloseStatusModal();
      await fetchReservations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar el estado');
    } finally {
      setChangingStatus(false);
    }
  };

  // Determinar acciones permitidas según estado actual
  const getAllowedActions = (status) => {
    const transitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'cancelled': [],
      'completed': []
    };
    return transitions[status] || [];
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <Icon className={`w-8 h-8 text-${color}-600`} />
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestión de Reservas
              </h1>
              <p className="text-gray-600">
                Administración completa de reservas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Nueva Reserva
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="text-base font-semibold text-gray-800">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {/* Período de fecha */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={filters.dateFilterType}
                onChange={(e) => handleFilterChange('dateFilterType', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {dateFilterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Solo mostrar inputs de fecha si es personalizado */}
            {filters.dateFilterType === 'custom' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fecha desde
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fecha hasta
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Año selector para filtro anual */}
            {filters.dateFilterType === 'year' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Año
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Destino */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Destino
              </label>
              <select
                value={filters.destination}
                onChange={(e) => handleFilterChange('destination', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los destinos</option>
                {destinations.map((dest, idx) => (
                  <option key={`dest-${idx}-${dest}`} value={dest}>{dest}</option>
                ))}
              </select>
            </div>

            {/* Guía */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Guía
              </label>
              <select
                value={filters.guide}
                onChange={(e) => handleFilterChange('guide', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los guías</option>
                {guidesOptions.map((guide, idx) => (
                  <option key={`guide-${idx}-${guide}`} value={guide}>{guide}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Tipo de tour */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipo de tour
              </label>
              <select
                value={filters.tourType}
                onChange={(e) => handleFilterChange('tourType', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los tipos</option>
                {tourTypes.map((type, idx) => (
                  <option key={`type-${idx}-${type}`} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'Todos los estados' :
                     status === 'completed' ? 'Completados' :
                     status === 'confirmed' ? 'Confirmados' :
                     status === 'pending' ? 'Pendientes' :
                     status === 'in_progress' ? 'En Progreso' :
                     status === 'cancelled' ? 'Cancelados' : status}
                  </option>
                ))}
              </select>
            </div>

            {/* Búsqueda */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Agencia, email, ID..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Filtros por cantidad de turistas */}
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <h4 className="text-xs font-semibold text-gray-800">Filtros por Cantidad de Turistas</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Tipo de filtro */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tipo de filtro
                </label>
                <select
                  value={filters.touristQuantityType}
                  onChange={(e) => {
                    handleFilterChange('touristQuantityType', e.target.value);
                    // Limpiar otros filtros relacionados
                    if (e.target.value !== 'range') {
                      handleFilterChange('minTourists', '');
                      handleFilterChange('maxTourists', '');
                    }
                    if (e.target.value !== 'category') {
                      handleFilterChange('touristCategory', 'all');
                    }
                  }}
                  className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Sin filtro</option>
                  <option value="range">Rango personalizado</option>
                  <option value="category">Categorías predefinidas</option>
                </select>
              </div>

              {/* Rango personalizado */}
              {filters.touristQuantityType === 'range' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Mínimo
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      placeholder="1"
                      value={filters.minTourists}
                      onChange={(e) => handleFilterChange('minTourists', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Máximo
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      placeholder="999"
                      value={filters.maxTourists}
                      onChange={(e) => handleFilterChange('maxTourists', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Categorías predefinidas */}
              {filters.touristQuantityType === 'category' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Categoría de grupo
                  </label>
                  <select
                    value={filters.touristCategory}
                    onChange={(e) => handleFilterChange('touristCategory', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {touristCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mostrar filtro activo */}
              {(filters.touristQuantityType === 'range' && (filters.minTourists || filters.maxTourists)) && (
                <div className="md:col-span-1 flex items-end">
                  <div className="bg-blue-50 border border-blue-200 rounded-md px-2 py-1 text-xs">
                    <span className="text-blue-800 font-medium">
                      Filtro: {filters.minTourists || 1} - {filters.maxTourists || '999+'} turistas
                    </span>
                  </div>
                </div>
              )}

              {(filters.touristQuantityType === 'category' && filters.touristCategory !== 'all') && (
                <div className="md:col-span-1 flex items-end">
                  <div className="bg-green-50 border border-green-200 rounded-md px-2 py-1 text-xs">
                    <span className="text-green-800 font-medium">
                      {touristCategories.find(cat => cat.value === filters.touristCategory)?.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Reservas"
            value={stats.totalReservations}
            subtitle="Reservas filtradas"
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="Ingresos Totales"
            value={formatCurrency(stats.totalRevenue)}
            subtitle="Valor acumulado"
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Promedio Grupo"
            value={stats.avgGroupSize}
            subtitle="Turistas por reserva"
            icon={BarChart3}
            color="orange"
          />
        </div>


        {/* Acciones */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            Mostrando {filteredReservations.length} de {enrichedReservations.length} reservas
            {(filters.touristQuantityType === 'range' && (filters.minTourists || filters.maxTourists)) && (
              <span className="ml-2 text-blue-600 font-medium">
                • Filtrado por: {filters.minTourists || 1}-{filters.maxTourists || '999+'} turistas
              </span>
            )}
            {(filters.touristQuantityType === 'category' && filters.touristCategory !== 'all') && (
              <span className="ml-2 text-green-600 font-medium">
                • {touristCategories.find(cat => cat.value === filters.touristCategory)?.label}
              </span>
            )}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>

        {/* Tabla de reservas - Responsive */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Vista de tabla para pantallas grandes */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '900px' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agencia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tour
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guía
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turistas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        Cargando reservas...
                      </div>
                    </td>
                  </tr>
                ) : filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                      No se encontraron reservas con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {reservation.agencyName}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {reservation.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {reservation.tourName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{reservation.destination}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(reservation.tourDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate max-w-[120px]">
                          {reservation.guide}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-900">{reservation.tourists}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(reservation.totalAmount)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          reservation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          reservation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          reservation.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                          reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reservation.status === 'completed' ? 'Completado' :
                           reservation.status === 'confirmed' ? 'Confirmado' :
                           reservation.status === 'pending' ? 'Pendiente' :
                           reservation.status === 'in_progress' ? 'En Progreso' :
                           reservation.status === 'cancelled' ? 'Cancelado' : reservation.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {/* Botones de cambio de estado */}
                          {getAllowedActions(reservation.status).includes('confirmed') && (
                            <button
                              onClick={() => handleOpenStatusModal(reservation, 'confirmed')}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                              title="Confirmar reserva"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {getAllowedActions(reservation.status).includes('in_progress') && (
                            <button
                              onClick={() => handleOpenStatusModal(reservation, 'in_progress')}
                              disabled={!reservation.guide_id && reservation.guide === t('reservations.noGuideAssigned')}
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors ${
                                (!reservation.guide_id && reservation.guide === t('reservations.noGuideAssigned')) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title={(!reservation.guide_id && reservation.guide === t('reservations.noGuideAssigned')) ? t('reservations.assignGuideFirst') : 'Iniciar tour'}
                            >
                              <PlayIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {getAllowedActions(reservation.status).includes('completed') && (
                            <button
                              onClick={() => handleOpenStatusModal(reservation, 'completed')}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                              title="Completar tour"
                            >
                              <CheckBadgeIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {getAllowedActions(reservation.status).includes('cancelled') && (
                            <button
                              onClick={() => handleOpenStatusModal(reservation, 'cancelled')}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              title="Cancelar reserva"
                            >
                              <XCircleIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Botón de asignar/cambiar guía */}
                          <button
                            onClick={() => handleOpenGuideModal(reservation)}
                            disabled={reservation.status === 'cancelled' || reservation.status === 'completed'}
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                              reservation.guide === t('reservations.noGuideAssigned')
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } ${
                              (reservation.status === 'cancelled' || reservation.status === 'completed')
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                            title={reservation.guide === t('reservations.noGuideAssigned') ? t('reservations.assignGuide') : t('reservations.changeGuide')}
                          >
                            <UserIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Vista de cards para pantallas pequeñas y medianas */}
          <div className="lg:hidden">
            {loading ? (
              <div className="px-4 py-12 text-center">
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Cargando reservas...
                </div>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                No se encontraron reservas con los filtros aplicados
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredReservations.map((reservation) => (
                  <div key={reservation.id} className="p-4 hover:bg-gray-50">
                    {/* Header: Agencia y Estado */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {reservation.agencyName}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {reservation.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        reservation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        reservation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        reservation.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                        reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {reservation.status === 'completed' ? 'Completado' :
                         reservation.status === 'confirmed' ? 'Confirmado' :
                         reservation.status === 'pending' ? 'Pendiente' :
                         reservation.status === 'in_progress' ? 'En Progreso' :
                         reservation.status === 'cancelled' ? 'Cancelado' : reservation.status}
                      </span>
                    </div>

                    {/* Tour info */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-900">{reservation.tourName}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {reservation.destination}
                      </div>
                    </div>

                    {/* Grid de detalles */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{formatDate(reservation.tourDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{reservation.tourists} turistas</span>
                      </div>
                      <div className="text-gray-600 truncate">
                        <span className="text-gray-400">Guía:</span> {reservation.guide}
                      </div>
                      <div className="text-right font-semibold text-gray-900">
                        {formatCurrency(reservation.totalAmount)}
                      </div>
                    </div>

                    {/* Botones de acción en móvil */}
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      {/* Botones de cambio de estado */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {getAllowedActions(reservation.status).includes('confirmed') && (
                          <button
                            onClick={() => handleOpenStatusModal(reservation, 'confirmed')}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirmar
                          </button>
                        )}
                        {getAllowedActions(reservation.status).includes('in_progress') && (
                          <button
                            onClick={() => handleOpenStatusModal(reservation, 'in_progress')}
                            disabled={!reservation.guide_id && reservation.guide === t('reservations.noGuideAssigned')}
                            className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors ${
                              (!reservation.guide_id && reservation.guide === t('reservations.noGuideAssigned')) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <PlayIcon className="w-4 h-4 mr-1" />
                            Iniciar
                          </button>
                        )}
                        {getAllowedActions(reservation.status).includes('completed') && (
                          <button
                            onClick={() => handleOpenStatusModal(reservation, 'completed')}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            <CheckBadgeIcon className="w-4 h-4 mr-1" />
                            Completar
                          </button>
                        )}
                        {getAllowedActions(reservation.status).includes('cancelled') && (
                          <button
                            onClick={() => handleOpenStatusModal(reservation, 'cancelled')}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            Cancelar
                          </button>
                        )}
                      </div>
                      {/* Botón de asignar guía */}
                      <button
                        onClick={() => handleOpenGuideModal(reservation)}
                        disabled={reservation.status === 'cancelled' || reservation.status === 'completed'}
                        className={`w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          reservation.guide === t('reservations.noGuideAssigned')
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${
                          (reservation.status === 'cancelled' || reservation.status === 'completed')
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        <UserIcon className="w-4 h-4 mr-2" />
                        {reservation.guide === t('reservations.noGuideAssigned') ? t('reservations.assignGuideBtn') : t('reservations.changeGuideBtn')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Asignación de Guía */}
      {showGuideModal && selectedReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleCloseGuideModal}
          />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('reservations.assignGuideBtn')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedReservation.tourName}
                  </p>
                </div>
                <button
                  onClick={handleCloseGuideModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Info de la reserva */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Agencia:</span>
                    <p className="font-medium text-gray-900">{selectedReservation.agencyName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha:</span>
                    <p className="font-medium text-gray-900">{formatDate(selectedReservation.tourDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Turistas:</span>
                    <p className="font-medium text-gray-900">{selectedReservation.tourists} personas</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Guía actual:</span>
                    <p className={`font-medium ${selectedReservation.guide === t('reservations.noGuideAssigned') ? 'text-orange-600' : 'text-gray-900'}`}>
                      {selectedReservation.guide}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de guías */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Seleccionar Guía
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {guides && guides.length > 0 ? (
                    guides.map((guide) => (
                      <div
                        key={guide.id}
                        onClick={() => setSelectedGuideId(guide.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedGuideId === guide.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                              {(guide.name || guide.fullName || 'G').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {guide.name || guide.fullName || `${guide.firstName} ${guide.lastName}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {guide.languages?.join(', ') || t('reservations.defaultLanguage')}
                                {guide.rating && ` • ⭐ ${guide.rating}`}
                              </p>
                            </div>
                          </div>
                          {selectedGuideId === guide.id && (
                            <CheckIcon className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No hay guías disponibles
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseGuideModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignGuide}
                  disabled={!selectedGuideId || assigningGuide}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {assigningGuide ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Asignando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      {t('reservations.assignGuideBtn')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cambio de Estado */}
      {showStatusModal && statusReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleCloseStatusModal}
          />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {newStatus === 'confirmed' && 'Confirmar Reserva'}
                    {newStatus === 'cancelled' && 'Cancelar Reserva'}
                    {newStatus === 'in_progress' && 'Iniciar Tour'}
                    {newStatus === 'completed' && 'Completar Tour'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {statusReservation.tourName}
                  </p>
                </div>
                <button
                  onClick={handleCloseStatusModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Info de la reserva */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Agencia:</span>
                    <p className="font-medium text-gray-900">{statusReservation.agencyName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha:</span>
                    <p className="font-medium text-gray-900">{formatDate(statusReservation.tourDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Estado actual:</span>
                    <p className={`font-medium ${
                      statusReservation.status === 'pending' ? 'text-yellow-600' :
                      statusReservation.status === 'confirmed' ? 'text-blue-600' :
                      statusReservation.status === 'in_progress' ? 'text-purple-600' : 'text-gray-900'
                    }`}>
                      {statusReservation.status === 'pending' ? 'Pendiente' :
                       statusReservation.status === 'confirmed' ? 'Confirmado' :
                       statusReservation.status === 'in_progress' ? 'En Progreso' :
                       statusReservation.status}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Guía:</span>
                    <p className={`font-medium ${statusReservation.guide === t('reservations.noGuideAssigned') ? 'text-orange-600' : 'text-gray-900'}`}>
                      {statusReservation.guide}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mensaje de confirmación */}
              <div className={`p-4 rounded-lg mb-6 ${
                newStatus === 'confirmed' ? 'bg-green-50 border border-green-200' :
                newStatus === 'cancelled' ? 'bg-red-50 border border-red-200' :
                newStatus === 'in_progress' ? 'bg-purple-50 border border-purple-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-sm ${
                  newStatus === 'confirmed' ? 'text-green-800' :
                  newStatus === 'cancelled' ? 'text-red-800' :
                  newStatus === 'in_progress' ? 'text-purple-800' :
                  'text-blue-800'
                }`}>
                  {newStatus === 'confirmed' && (
                    <>
                      Al confirmar esta reserva:
                      <ul className="list-disc ml-4 mt-2">
                        <li>Se notificará a la agencia</li>
                        <li>Se asignarán puntos a la agencia ({Math.floor(statusReservation.totalAmount / 10)} puntos)</li>
                      </ul>
                    </>
                  )}
                  {newStatus === 'cancelled' && 'Esta acción cancelará la reserva permanentemente.'}
                  {newStatus === 'in_progress' && 'Se marcará el tour como iniciado.'}
                  {newStatus === 'completed' && 'Se marcará el tour como completado.'}
                </p>
              </div>

              {/* Campo de razón de cancelación */}
              {newStatus === 'cancelled' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón de cancelación <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Ingrese el motivo de la cancelación..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseStatusModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={changingStatus || (newStatus === 'cancelled' && !cancellationReason.trim())}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                    newStatus === 'confirmed' ? 'bg-green-600 hover:bg-green-700' :
                    newStatus === 'cancelled' ? 'bg-red-600 hover:bg-red-700' :
                    newStatus === 'in_progress' ? 'bg-purple-600 hover:bg-purple-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {changingStatus ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      {newStatus === 'confirmed' && <CheckCircle className="w-4 h-4 mr-2" />}
                      {newStatus === 'cancelled' && <XCircleIcon className="w-4 h-4 mr-2" />}
                      {newStatus === 'in_progress' && <PlayIcon className="w-4 h-4 mr-2" />}
                      {newStatus === 'completed' && <CheckBadgeIcon className="w-4 h-4 mr-2" />}
                      {newStatus === 'confirmed' && 'Confirmar'}
                      {newStatus === 'cancelled' && 'Cancelar Reserva'}
                      {newStatus === 'in_progress' && 'Iniciar Tour'}
                      {newStatus === 'completed' && 'Completar Tour'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nueva Reserva */}
      {showWizard && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop con blur */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowWizard(false)}
            aria-hidden="true"
          />

          {/* Contenedor del modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Modal content */}
            <div
              className="relative w-full max-w-4xl transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón de cerrar */}
              <button
                onClick={() => setShowWizard(false)}
                className="absolute -top-4 -right-4 z-10 flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors border-2 border-gray-200"
                aria-label="Cerrar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Wizard content */}
              <ReservationWizard
                onClose={() => setShowWizard(false)}
                onComplete={() => {
                  // Recargar reservas después de crear una nueva
                  fetchReservations();
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReservationManagement;