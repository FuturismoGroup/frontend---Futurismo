import { useState, useCallback } from 'react';
import { 
  DEFAULT_CALENDAR_FILTERS, 
  TIME_FILTERS,
  CALENDAR_FILTERS 
} from '../constants/calendarConstants';

/**
 * Hook personalizado para gestionar filtros del calendario
 * @returns {Object} Estado y funciones para manejar filtros
 */
const useCalendarFilters = () => {
  const [filters, setFilters] = useState(DEFAULT_CALENDAR_FILTERS);

  const [timeFilter, setTimeFilter] = useState(TIME_FILTERS.ALL);

  const toggleFilter = useCallback((filterKey) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_CALENDAR_FILTERS);
    setTimeFilter(TIME_FILTERS.ALL);
  }, []);

  return {
    // Estado
    filters,
    timeFilter,
    
    // Acciones
    setTimeFilter,
    toggleFilter,
    resetFilters,
    
    // Constantes exportadas para uso externo
    FILTER_KEYS: CALENDAR_FILTERS,
    TIME_FILTER_OPTIONS: TIME_FILTERS
  };
};

export default useCalendarFilters;