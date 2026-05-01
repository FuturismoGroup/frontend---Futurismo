import { useState, useMemo, useCallback } from 'react';
import { PAGINATION } from '../constants/reservationConstants';
import { 
  DEFAULT_FILTER_VALUES,
  STATUS_OPTIONS,
  DATE_CONFIG
} from '../constants/reservationFiltersConstants';

/**
 * Hook para manejar filtros y paginación de reservas
 * @param {Array} reservations - Lista de reservas a filtrar
 * @returns {Object} Estados de filtros, resultados filtrados y funciones
 */
export const useReservationFilters = (reservations) => {
  const [searchTerm, setSearchTerm] = useState(DEFAULT_FILTER_VALUES.SEARCH_TERM);
  const [statusFilter, setStatusFilter] = useState(DEFAULT_FILTER_VALUES.STATUS);
  const [dateFrom, setDateFrom] = useState(DEFAULT_FILTER_VALUES.DATE_FROM);
  const [dateTo, setDateTo] = useState(DEFAULT_FILTER_VALUES.DATE_TO);
  const [customerFilter, setCustomerFilter] = useState(DEFAULT_FILTER_VALUES.CUSTOMER);
  const [destinationFilter, setDestinationFilter] = useState('');
  const [minPassengers, setMinPassengers] = useState(DEFAULT_FILTER_VALUES.MIN_PASSENGERS);
  const [maxPassengers, setMaxPassengers] = useState(DEFAULT_FILTER_VALUES.MAX_PASSENGERS);
  const [currentPage, setCurrentPage] = useState(DEFAULT_FILTER_VALUES.CURRENT_PAGE);

  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      // Búsqueda general
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (reservation.tourName || '').toLowerCase().includes(search) ||
        (reservation.clientName || '').toLowerCase().includes(search) ||
        (reservation.id || '').toLowerCase().includes(search);
      
      // Filtro por estado
      const matchesStatus = statusFilter === STATUS_OPTIONS.ALL || reservation.status === statusFilter;
      
      // Filtro por fechas (comparar como strings YYYY-MM-DD para evitar problemas de timezone)
      let matchesDate = true;
      if (dateFrom) {
        // reservation.date puede ser string "YYYY-MM-DD" o "YYYY-MM-DDT..."
        const resDateStr = typeof reservation.date === 'string'
          ? reservation.date.substring(0, 10)
          : new Date(reservation.date).toISOString().substring(0, 10);
        matchesDate = matchesDate && resDateStr >= dateFrom;
      }
      if (dateTo) {
        const resDateStr = typeof reservation.date === 'string'
          ? reservation.date.substring(0, 10)
          : new Date(reservation.date).toISOString().substring(0, 10);
        matchesDate = matchesDate && resDateStr <= dateTo;
      }
      
      // Filtro por cliente
      const matchesCustomer = !customerFilter ||
        (reservation.clientName || '').toLowerCase().includes(customerFilter.toLowerCase());

      // Filtro por destino
      const matchesDestination = !destinationFilter ||
        (reservation.destination && reservation.destination.toLowerCase().includes(destinationFilter.toLowerCase()));

      // Filtro por cantidad de pasajeros
      const totalPassengers = reservation.adults + reservation.children;
      let matchesPassengers = true;
      if (minPassengers) {
        matchesPassengers = matchesPassengers && totalPassengers >= parseInt(minPassengers);
      }
      if (maxPassengers) {
        matchesPassengers = matchesPassengers && totalPassengers <= parseInt(maxPassengers);
      }

      return matchesSearch && matchesStatus && matchesDate && matchesCustomer && matchesDestination && matchesPassengers;
    });
  }, [reservations, searchTerm, statusFilter, dateFrom, dateTo, customerFilter, destinationFilter, minPassengers, maxPassengers]);

  // Paginación
  const totalPages = Math.ceil(filteredReservations.length / PAGINATION.DEFAULT_ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * PAGINATION.DEFAULT_ITEMS_PER_PAGE;
  const paginatedReservations = filteredReservations.slice(
    startIndex, 
    startIndex + PAGINATION.DEFAULT_ITEMS_PER_PAGE
  );

  // Estadísticas para exportación
  const exportStats = useMemo(() => ({
    totalReservations: filteredReservations.length,
    totalTourists: filteredReservations.reduce((sum, res) => sum + res.adults + res.children, 0),
    totalRevenue: filteredReservations.reduce((sum, res) => sum + res.total, 0),
    avgTicket: filteredReservations.length > 0 
      ? filteredReservations.reduce((sum, res) => sum + res.total, 0) / filteredReservations.length 
      : 0
  }), [filteredReservations]);

  const resetFilters = useCallback(() => {
    setSearchTerm(DEFAULT_FILTER_VALUES.SEARCH_TERM);
    setStatusFilter(DEFAULT_FILTER_VALUES.STATUS);
    setDateFrom(DEFAULT_FILTER_VALUES.DATE_FROM);
    setDateTo(DEFAULT_FILTER_VALUES.DATE_TO);
    setCustomerFilter(DEFAULT_FILTER_VALUES.CUSTOMER);
    setDestinationFilter('');
    setMinPassengers(DEFAULT_FILTER_VALUES.MIN_PASSENGERS);
    setMaxPassengers(DEFAULT_FILTER_VALUES.MAX_PASSENGERS);
    setCurrentPage(DEFAULT_FILTER_VALUES.CURRENT_PAGE);
  }, []);

  // Funciones memoizadas para actualizar filtros
  const updateSearchTerm = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(DEFAULT_FILTER_VALUES.CURRENT_PAGE);
  }, []);

  const updateStatusFilter = useCallback((value) => {
    setStatusFilter(value);
    setCurrentPage(DEFAULT_FILTER_VALUES.CURRENT_PAGE);
  }, []);

  const updateDateFrom = useCallback((value) => {
    setDateFrom(value);
    setCurrentPage(DEFAULT_FILTER_VALUES.CURRENT_PAGE);
  }, []);

  const updateDateTo = useCallback((value) => {
    setDateTo(value);
    setCurrentPage(DEFAULT_FILTER_VALUES.CURRENT_PAGE);
  }, []);

  const updateCustomerFilter = useCallback((value) => {
    setCustomerFilter(value);
    setCurrentPage(DEFAULT_FILTER_VALUES.CURRENT_PAGE);
  }, []);

  const updateDestinationFilter = useCallback((value) => {
    setDestinationFilter(value);
    setCurrentPage(DEFAULT_FILTER_VALUES.CURRENT_PAGE);
  }, []);

  const updateMinPassengers = useCallback((value) => {
    setMinPassengers(value);
    setCurrentPage(DEFAULT_FILTER_VALUES.CURRENT_PAGE);
  }, []);

  const updateMaxPassengers = useCallback((value) => {
    setMaxPassengers(value);
    setCurrentPage(DEFAULT_FILTER_VALUES.CURRENT_PAGE);
  }, []);

  // Obtener destinos únicos para el combobox
  const availableDestinations = useMemo(() => {
    const destinations = reservations
      .map(r => r.destination)
      .filter(d => d && d !== 'Sin destino');
    return [...new Set(destinations)].sort();
  }, [reservations]);

  return {
    // Estados de filtros
    searchTerm,
    setSearchTerm: updateSearchTerm,
    statusFilter,
    setStatusFilter: updateStatusFilter,
    dateFrom,
    setDateFrom: updateDateFrom,
    dateTo,
    setDateTo: updateDateTo,
    customerFilter,
    setCustomerFilter: updateCustomerFilter,
    destinationFilter,
    setDestinationFilter: updateDestinationFilter,
    minPassengers,
    setMinPassengers: updateMinPassengers,
    maxPassengers,
    setMaxPassengers: updateMaxPassengers,
    currentPage,
    setCurrentPage,

    // Resultados
    filteredReservations,
    paginatedReservations,
    totalPages,
    exportStats,
    startIndex,
    itemsPerPage: PAGINATION.DEFAULT_ITEMS_PER_PAGE,
    availableDestinations,

    // Acciones
    resetFilters,

    // Constantes
    STATUS_OPTIONS,
    DEFAULT_FILTER_VALUES
  };
};