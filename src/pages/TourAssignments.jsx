import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  BuildingOfficeIcon,
  TruckIcon,
  XMarkIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  BuildingOffice2Icon,
  ArrowDownTrayIcon,
  MapPinIcon,
  ListBulletIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { CheckIcon, DocumentArrowDownIcon } from '@heroicons/react/24/solid';
import useReservationsStore from '../stores/reservationsStore';
import useGuidesStore from '../stores/guidesStore';
import useDriversStore from '../stores/driversStore';
import useVehiclesStore from '../stores/vehiclesStore';
import { formatters } from '../utils/formatters';
import toast from 'react-hot-toast';
import exportService from '../services/exportService';
import toursService from '../services/toursService';
import assignmentPdfService from '../services/assignmentPdfService';
import { getLanguageName, normalizeLanguageCode } from '../config/languages';

// Parse a value that might be: array, JSON string, or double-encoded JSON string
const parseJsonField = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'string') {
      try {
        const inner = JSON.parse(parsed);
        return Array.isArray(inner) ? inner : [];
      } catch {
        return [];
      }
    }
    return [];
  } catch {
    return [];
  }
};

const TourAssignments = () => {
  const navigate = useNavigate();
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentType, setAssignmentType] = useState('guide'); // 'guide', 'driver', 'vehicle'
  const [selectedGuide, setSelectedGuide] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [availableGuides, setAvailableGuides] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  // Stores
  const {
    reservations,
    fetchReservations,
    isLoading
  } = useReservationsStore();

  const { guides, fetchGuides } = useGuidesStore();
  const { fetchAvailableDrivers, assignDriver } = useDriversStore();
  const { fetchAvailableVehicles, assignVehicle } = useVehiclesStore();

  // Cargar datos al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar reservas (sin filtro de status, filtramos localmente)
        // y guias en paralelo
        const promises = [
          fetchReservations({}).catch(() => {}),
          fetchGuides().catch(() => {})
        ];

        await Promise.allSettled(promises);
      } catch {
        toast.error('Error al cargar los datos');
      }
    };

    loadData();
  }, []);

  // Filtrar reservas - solo mostrar pending/confirmed (activas)
  const filteredReservations = (Array.isArray(reservations) ? reservations : []).filter(reservation => {
    // Solo mostrar reservas activas (pending o confirmed)
    const reservationStatus = reservation.status?.toLowerCase();
    const isActiveReservation = reservationStatus === 'pending' || reservationStatus === 'confirmed';
    if (!isActiveReservation) return false;

    // Verificar si la reserva tiene todas las asignaciones
    const assignment = reservation.tourAssignment || reservation.tour_assignment;
    const hasGuide = assignment?.guide_id || assignment?.guideId || reservation.guideId;
    const hasDriver = assignment?.driver_id || assignment?.driverId;
    const hasVehicle = assignment?.vehicle_id || assignment?.vehicleId;
    const hasCompleteAssignments = hasGuide && hasDriver && hasVehicle;

    // Busqueda por termino
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const tourName = reservation.tour?.name || reservation.tourName || '';
      const code = reservation.code || reservation.id || '';
      const matchesSearch = tourName.toLowerCase().includes(term) || code.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    // Filtrar por estado de asignacion
    if (filter === 'pending') return !hasCompleteAssignments;
    if (filter === 'assigned') return hasCompleteAssignments;

    // Filtrar por fecha de hoy
    if (filter === 'today') {
      const today = new Date().toDateString();
      const reservationDate = new Date(reservation.date).toDateString();
      return today === reservationDate && !hasCompleteAssignments;
    }

    // Filtro 'all' muestra todas las reservas activas
    return true;
  });

  // Helper para verificar si una reserva tiene asignación completa
  const isFullyAssigned = (reservation) => {
    const a = reservation.tourAssignment || reservation.tour_assignment || {};
    const hasGuide = !!(a.guideId || a.guide_id || reservation.guideId);
    const hasDriver = !!(a.driverId || a.driver_id);
    const hasVehicle = !!(a.vehicleId || a.vehicle_id);
    return hasGuide && hasDriver && hasVehicle;
  };

  // Contar reservas por estado (solo activas: pending/confirmed)
  const getCounts = () => {
    const reservationsArray = Array.isArray(reservations) ? reservations : [];
    const activeReservations = reservationsArray.filter(r => {
      const status = r.status?.toLowerCase();
      return status === 'pending' || status === 'confirmed';
    });

    const counts = {
      total: activeReservations.length,
      pending: activeReservations.filter(r => !isFullyAssigned(r)).length,
      assigned: activeReservations.filter(r => isFullyAssigned(r)).length,
      today: activeReservations.filter(r => {
        const today = new Date().toDateString();
        const reservationDate = new Date(r.date).toDateString();
        return today === reservationDate && !isFullyAssigned(r);
      }).length
    };
    return counts;
  };

  const counts = getCounts();

  // Abrir modal de asignacion
  const handleOpenAssignModal = async (reservation) => {
    setSelectedReservation(reservation);
    setShowAssignModal(true);
    setAssignmentType('guide');

    // Pre-seleccionar valores existentes de asignaciones
    const existingAssignment = getAssignmentData(reservation);
    setSelectedGuide(existingAssignment.guideId || '');
    setSelectedDriver(existingAssignment.driverId || '');
    setSelectedVehicle(existingAssignment.vehicleId || '');

    // Cargar guias disponibles
    setCheckingAvailability(true);
    try {
      const tourId = reservation.tour_id || reservation.tourId || reservation.tour?.id;
      const date = reservation.date || new Date().toISOString();
      const passengers = reservation.participants || reservation.adults || 10;

      if (tourId) {
        const guides = await toursService.getAvailableGuidesForTour(tourId, date, {
          reservationId: reservation.id,
          includeCurrentGuide: true
        });
        setAvailableGuides(guides?.data || guides || []);
      }

      // Pre-cargar drivers y vehicles si ya hay asignaciones existentes
      if (existingAssignment.driverId || existingAssignment.vehicleId) {
        const [drivers, vehicles] = await Promise.all([
          fetchAvailableDrivers(date, null, reservation.id),
          fetchAvailableVehicles(date, passengers, null, reservation.id)
        ]);
        setAvailableDrivers(drivers || []);
        setAvailableVehicles(vehicles || []);
      }
    } catch {
      toast.error('Error al cargar recursos disponibles');
      setAvailableGuides([]);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Cargar recursos disponibles segun el tipo de asignacion
  const handleAssignmentTypeChange = async (type) => {
    setAssignmentType(type);

    if (!selectedReservation) return;

    const reservationDate = selectedReservation.date || new Date().toISOString();

    setCheckingAvailability(true);
    try {
      switch (type) {
        case 'driver':
          const drivers = await fetchAvailableDrivers(reservationDate, null, selectedReservation.id);
          setAvailableDrivers(drivers || []);
          break;

        case 'vehicle':
          const passengers = selectedReservation.participants || selectedReservation.adults + selectedReservation.children || 10;
          const vehicles = await fetchAvailableVehicles(reservationDate, passengers, null, selectedReservation.id);
          setAvailableVehicles(vehicles || []);
          break;
      }
    } catch {
      toast.error(`Error al cargar ${type === 'driver' ? 'choferes' : 'vehiculos'} disponibles`);
      if (type === 'driver') {
        setAvailableDrivers([]);
      } else if (type === 'vehicle') {
        setAvailableVehicles([]);
      }
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Asignar todos los recursos seleccionados a la reserva
  const handleAssign = async () => {
    if (!selectedReservation) return;

    const tourId = selectedReservation.tour_id || selectedReservation.tourId || selectedReservation.tour?.id;
    const existingAssignment = getAssignmentData(selectedReservation);

    // Determinar qué recursos nuevos hay que asignar (seleccionados y distintos a los existentes)
    const needsGuide = selectedGuide && selectedGuide !== existingAssignment.guideId;
    const needsDriver = selectedDriver && selectedDriver !== existingAssignment.driverId;
    const needsVehicle = selectedVehicle && selectedVehicle !== existingAssignment.vehicleId;

    if (!needsGuide && !needsDriver && !needsVehicle) {
      toast.error('No hay cambios para asignar');
      return;
    }

    try {
      // Ejecutar secuencialmente para evitar race condition:
      // los 3 endpoints crean/actualizan el MISMO registro tour_assignments (unique por reservation_id),
      // si se ejecutan en paralelo, todos ven que no existe y compiten por crearlo, causando 500.
      if (needsGuide) {
        await toursService.assignGuideToTour(tourId, selectedGuide, {
          reservationId: selectedReservation.id,
          validateCompetences: false
        });
        toast.success('Guia asignado exitosamente');
      }

      if (needsDriver) {
        await assignDriver(selectedDriver, {
          reservationId: selectedReservation.id,
          tourId: tourId,
          date: selectedReservation.date || new Date().toISOString(),
          vehicleId: selectedVehicle || null
        });
      }

      if (needsVehicle) {
        await assignVehicle(selectedVehicle, {
          reservationId: selectedReservation.id,
          tourId: tourId,
          date: selectedReservation.date || new Date().toISOString(),
          passengers: selectedReservation.participants || 10,
          driverId: selectedDriver || null
        });
      }

      // Recargar reservas y cerrar modal
      await fetchReservations({});
      setShowAssignModal(false);
    } catch (error) {
      toast.error(error.message || 'Error en la asignacion');
    }
  };

  // Remover asignacion
  const handleRemoveAssignment = async (reservationId, type = 'guide') => {
    if (window.confirm('Esta seguro de remover esta asignacion?')) {
      try {
        const reservation = reservations.find(r => r.id === reservationId);
        const tourId = reservation?.tour_id || reservation?.tourId || reservation?.tour?.id;
        if (tourId) {
          await toursService.removeAssignment(tourId, type);
          toast.success('Asignacion removida exitosamente');
          await fetchReservations({});
        }
      } catch {
        toast.error('Error al remover la asignacion');
      }
    }
  };

  // Exportar asignaciones
  const handleExport = async (format) => {
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      let exportStatus = 'all';
      if (filter === 'assigned') exportStatus = 'completed';
      if (filter === 'pending') exportStatus = 'pending';

      await exportService.exportAssignments(format, exportStatus);
      toast.success(`Reporte exportado exitosamente como ${format.toUpperCase()}`);
    } catch {
      toast.error('Error al exportar el reporte');
    } finally {
      setIsExporting(false);
    }
  };

  // Descargar PDF de ficha de asignacion
  const handleDownloadAssignmentPDF = async (reservation) => {
    setDownloadingPdfId(reservation.id);
    try {
      await assignmentPdfService.downloadPDF(reservation.id);
      toast.success('Ficha de asignacion descargada exitosamente');
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast.error('Error al descargar la ficha de asignacion');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // Helper para obtener datos de asignacion
  const getAssignmentData = (reservation) => {
    const assignment = reservation.tourAssignment || reservation.tour_assignment || {};
    return {
      hasGuide: !!(assignment.guideId || assignment.guide_id || reservation.guideId),
      hasDriver: !!(assignment.driverId || assignment.driver_id),
      hasVehicle: !!(assignment.vehicleId || assignment.vehicle_id),
      guideId: assignment.guideId || assignment.guide_id || reservation.guideId || null,
      driverId: assignment.driverId || assignment.driver_id || null,
      vehicleId: assignment.vehicleId || assignment.vehicle_id || null,
      guideName: assignment.guideName || assignment.guide?.name
        || (reservation.guide ? `${reservation.guide.firstName || ''} ${reservation.guide.lastName || ''}`.trim() || null : null),
      driverName: assignment.driverName || assignment.driver?.name || null,
      vehiclePlate: assignment.vehiclePlate || assignment.vehicle?.plate || null,
      vehicleInfo: assignment.vehicleInfo || null
    };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Asignacion de Tours
          </h1>
        </div>
        <p className="text-gray-600">
          Asigna guias, choferes y vehiculos a las reservas pendientes
        </p>
      </div>

      {/* Quick Access Management */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestion de Recursos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/drivers')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left border border-gray-200"
          >
            <div className="flex items-center">
              <TruckIcon className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h4 className="font-semibold text-gray-900">Choferes</h4>
                <p className="text-sm text-gray-600">Gestionar conductores</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto" />
            </div>
          </button>

          <button
            onClick={() => navigate('/clients')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left border border-gray-200"
          >
            <div className="flex items-center">
              <BuildingOffice2Icon className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h4 className="font-semibold text-gray-900">Agencias</h4>
                <p className="text-sm text-gray-600">Gestionar agencias</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto" />
            </div>
          </button>

          <button
            onClick={() => navigate('/vehicles')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left border border-gray-200"
          >
            <div className="flex items-center">
              <TruckIcon className="w-6 h-6 text-purple-600 mr-3" />
              <div>
                <h4 className="font-semibold text-gray-900">Vehiculos</h4>
                <p className="text-sm text-gray-600">Gestionar flota</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto" />
            </div>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Reservas</p>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sin Asignar</p>
              <p className="text-2xl font-bold text-gray-900">{counts.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Asignados</p>
              <p className="text-2xl font-bold text-gray-900">{counts.assigned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{counts.today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <div className="flex items-center space-x-2">
              {[
                { key: 'all', label: 'Pendientes' },
                { key: 'pending', label: 'Sin Asignar' },
                { key: 'assigned', label: 'Completados' },
                { key: 'today', label: 'Hoy' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por tour o codigo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-100'
                }`}
                title="Vista de lista"
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-100'
                }`}
                title="Vista de tarjetas"
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
            </div>

            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting || reservations.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                {isExporting ? 'Exportando...' : 'Exportar'}
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      Exportar a Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      Exportar a PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reservations List View */}
      {viewMode === 'list' && filteredReservations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha / Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pax</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chofer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehiculo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => {
                  const assignmentData = getAssignmentData(reservation);
                  const isComplete = assignmentData.hasGuide && assignmentData.hasDriver && assignmentData.hasVehicle;
                  const tourName = reservation.tour?.name || reservation.tourName || 'Tour sin nombre';
                  const reservationCode = reservation.code || `RES-${reservation.id?.substring(0, 8).toUpperCase()}`;
                  const timeDisplay = reservation.time ? (typeof reservation.time === 'string' ? reservation.time.substring(0, 5) : reservation.time) : '--:--';
                  const passengers = reservation.participants || ((reservation.adults || 0) + (reservation.children || 0));

                  return (
                    <tr key={reservation.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{tourName}</p>
                          <p className="text-xs text-gray-500">{reservationCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{formatters.formatDate(reservation.date)}</p>
                        <p className="text-xs text-gray-500">{timeDisplay}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{passengers}</span>
                      </td>
                      <td className="px-4 py-3">
                        {assignmentData.hasGuide ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-sm text-green-700 font-medium truncate max-w-[120px]">{assignmentData.guideName || 'Asignado'}</span>
                            <button onClick={() => handleRemoveAssignment(reservation.id, 'guide')} className="text-red-400 hover:text-red-600 flex-shrink-0">
                              <XMarkIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {assignmentData.hasDriver ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-sm text-green-700 font-medium truncate max-w-[120px]">{assignmentData.driverName || 'Asignado'}</span>
                            <button onClick={() => handleRemoveAssignment(reservation.id, 'driver')} className="text-red-400 hover:text-red-600 flex-shrink-0">
                              <XMarkIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {assignmentData.hasVehicle ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-sm text-green-700 font-medium truncate max-w-[120px]">{assignmentData.vehiclePlate || 'Asignado'}</span>
                            <button onClick={() => handleRemoveAssignment(reservation.id, 'vehicle')} className="text-red-400 hover:text-red-600 flex-shrink-0">
                              <XMarkIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          isComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isComplete ? 'Completo' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenAssignModal(reservation)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            Asignar
                          </button>
                          {(assignmentData.hasGuide || assignmentData.hasDriver || assignmentData.hasVehicle) && (
                            <button
                              onClick={() => handleDownloadAssignmentPDF(reservation)}
                              disabled={downloadingPdfId === reservation.id}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isComplete ? 'text-green-600 hover:bg-green-50' : 'text-yellow-600 hover:bg-yellow-50'
                              } disabled:opacity-50`}
                              title={isComplete ? 'Descargar Ficha PDF' : 'Descargar PDF (Parcial)'}
                            >
                              {downloadingPdfId === reservation.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <DocumentArrowDownIcon className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reservations Cards View */}
      {viewMode === 'cards' && filteredReservations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReservations.map((reservation) => {
            const assignmentData = getAssignmentData(reservation);
            const isComplete = assignmentData.hasGuide && assignmentData.hasDriver && assignmentData.hasVehicle;
            const tourName = reservation.tour?.name || reservation.tourName || 'Tour sin nombre';
            const reservationCode = reservation.code || `RES-${reservation.id?.substring(0, 8).toUpperCase()}`;

            return (
              <div key={reservation.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Reservation Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{tourName}</h3>
                      <p className="text-sm text-gray-500">Codigo: {reservationCode}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      isComplete
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isComplete ? 'Completo' : 'Pendiente'}
                    </span>
                  </div>

                  {/* Reservation Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formatters.formatDate(reservation.date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {reservation.time ? (typeof reservation.time === 'string' ? reservation.time.substring(0, 5) : reservation.time) : 'Sin hora'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      {reservation.participants || ((reservation.adults || 0) + (reservation.children || 0))} pasajeros
                    </div>
                    {(reservation.pickupLocation || reservation.pickup_location) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        {reservation.pickupLocation || reservation.pickup_location}
                      </div>
                    )}
                  </div>

                  {/* Assignments */}
                  <div className="space-y-2 mb-4 pt-4 border-t">
                    {/* Guia */}
                    {assignmentData.hasGuide ? (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-green-700">
                          <UserIcon className="h-4 w-4 mr-2" />
                          <span>{assignmentData.guideName || 'Guia asignado'}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignment(reservation.id, 'guide')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        <UserIcon className="h-4 w-4 inline mr-2" />
                        Sin guia asignado
                      </div>
                    )}

                    {/* Chofer */}
                    {assignmentData.hasDriver ? (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-green-700">
                          <UserIcon className="h-4 w-4 mr-2" />
                          <span>{assignmentData.driverName || 'Chofer asignado'}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignment(reservation.id, 'driver')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        <UserIcon className="h-4 w-4 inline mr-2" />
                        Sin chofer asignado
                      </div>
                    )}

                    {/* Vehiculo */}
                    {assignmentData.hasVehicle ? (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-green-700">
                          <TruckIcon className="h-4 w-4 mr-2" />
                          <span>{assignmentData.vehiclePlate || 'Vehiculo asignado'}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignment(reservation.id, 'vehicle')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        <TruckIcon className="h-4 w-4 inline mr-2" />
                        Sin vehiculo asignado
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleOpenAssignModal(reservation)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      disabled={isLoading}
                    >
                      Gestionar Asignaciones
                      <ChevronRightIcon className="h-4 w-4 ml-2" />
                    </button>

                    {/* Boton de descarga de PDF - solo visible si hay asignaciones */}
                    {(assignmentData.hasGuide || assignmentData.hasDriver || assignmentData.hasVehicle) && (
                      <button
                        onClick={() => handleDownloadAssignmentPDF(reservation)}
                        disabled={downloadingPdfId === reservation.id}
                        className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                          isComplete
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {downloadingPdfId === reservation.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generando PDF...
                          </>
                        ) : (
                          <>
                            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                            {isComplete ? 'Descargar Ficha PDF' : 'Descargar PDF (Parcial)'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredReservations.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay reservas pendientes de asignacion
          </h3>
          <p className="text-gray-500">
            {reservations.length === 0
              ? 'No hay reservas registradas en el sistema. Cree una nueva reserva para comenzar.'
              : 'Todas las reservas tienen sus asignaciones completas o no hay reservas que coincidan con los filtros.'}
          </p>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedReservation && (
        <div className="modal-overlay p-4">
          <div className="modal-content max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Asignar recursos a reserva
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Info de la reserva */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="font-medium text-gray-900">{selectedReservation.tour?.name || selectedReservation.tourName}</p>
              <p className="text-sm text-gray-600">
                {formatters.formatDate(selectedReservation.date)} - {selectedReservation.participants || (selectedReservation.adults + selectedReservation.children)} pax
              </p>
            </div>

            {/* Assignment Type Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { key: 'guide', label: 'Guia', icon: UserIcon },
                { key: 'driver', label: 'Chofer', icon: UserIcon },
                { key: 'vehicle', label: 'Vehiculo', icon: TruckIcon }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleAssignmentTypeChange(key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                    assignmentType === key
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {label}
                </button>
              ))}
            </div>

            {/* Guide Assignment */}
            {assignmentType === 'guide' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Guia
                  </label>
                  {checkingAvailability ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Verificando disponibilidad...</p>
                    </div>
                  ) : (
                    <select
                      value={selectedGuide}
                      onChange={(e) => setSelectedGuide(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccione un guia</option>
                      {availableGuides.map((guide) => {
                        // Idiomas: soporta array de strings, array de {code, level}, o JSON string (incl. doble-codificado)
                        const rawLangs = parseJsonField(guide.languages);
                        const langs = rawLangs
                          .map(l => {
                              const code = typeof l === 'string' ? l : l?.code;
                              const iso = normalizeLanguageCode(code);
                              if (!iso) return null;
                              return iso.length <= 3 ? iso.toUpperCase() : getLanguageName(iso);
                          })
                          .filter(Boolean)
                          .join(', ') || null;
                        // Museos: soporta array de strings o de objetos {name, years, expertise}
                        const rawMuseums = parseJsonField(guide.museums);
                        const museumsList = rawMuseums
                          .map(m => (typeof m === 'string' ? m : m?.name))
                          .filter(Boolean)
                          .join(', ') || null;
                        const details = [langs, museumsList].filter(Boolean).join(' | ');
                        return (
                          <option key={guide.id} value={guide.id}>
                            {guide.name || guide.fullName}{details ? ` - ${details}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {availableGuides.length === 0 && !checkingAvailability && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      No hay guias disponibles para esta reserva en la fecha seleccionada.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Driver Assignment */}
            {assignmentType === 'driver' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Chofer
                  </label>
                  {checkingAvailability ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Verificando disponibilidad...</p>
                    </div>
                  ) : (
                    <select
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccione un chofer</option>
                      {availableDrivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name || driver.fullName} - Licencia: {driver.license_type || driver.licenseCategory || 'N/A'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {availableDrivers.length === 0 && !checkingAvailability && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      No hay choferes disponibles para esta reserva en la fecha seleccionada.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Vehicle Assignment */}
            {assignmentType === 'vehicle' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Vehiculo
                  </label>
                  {checkingAvailability ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Verificando disponibilidad...</p>
                    </div>
                  ) : (
                    <select
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccione un vehiculo</option>
                      {availableVehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.plate} - {vehicle.brand} {vehicle.model} ({vehicle.capacity} pax)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm text-blue-800">
                      <p>Capacidad requerida: {selectedReservation.participants || ((selectedReservation.adults || 0) + (selectedReservation.children || 0))} pasajeros</p>
                      {selectedVehicle && availableVehicles.find(v => v.id === selectedVehicle) && (
                        <p className="mt-1">
                          Vehiculo seleccionado: {availableVehicles.find(v => v.id === selectedVehicle).capacity} plazas
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {availableVehicles.length === 0 && !checkingAvailability && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      No hay vehiculos disponibles con la capacidad requerida para esta reserva.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssign}
                disabled={
                  isLoading ||
                  (!selectedGuide && !selectedDriver && !selectedVehicle)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourAssignments;
