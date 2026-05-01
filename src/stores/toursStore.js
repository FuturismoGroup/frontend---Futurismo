import { create } from 'zustand';
import i18next from 'i18next';
import toursService from '../services/toursService';

const useToursStore = create((set, get) => ({
  // Estado
  tours: [],
  categories: [],
  selectedTour: null,
  filters: {
    category: '',
    priceRange: null,
    duration: '',
    language: '',
    difficulty: '',
    status: '',
    featured: undefined,
    search: '',
    sortBy: 'popularity'
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  isLoading: false,
  error: null,
  hasInitialized: false,

  // Acciones
  initialize: async () => {
    const { hasInitialized } = get();
    if (hasInitialized) return;

    set({ isLoading: true, error: null });

    try {
      // Cargar categorías - usar datos por defecto si falla
      let categories = [];
      try {
        const categoriesResult = await toursService.getCategories();
        categories = categoriesResult.success ? categoriesResult.data : [];
      } catch (err) {
        console.warn('Error cargando categorías de tours:', err);
        categories = []; // Continuar con array vacío
      }

      // Cargar tours iniciales - usar datos por defecto si falla
      let tours = [];
      let pagination = { page: 1, limit: 10, total: 0, totalPages: 0 };
      try {
        const toursResult = await toursService.getTours({ page: 1, limit: 10 });
        if (toursResult.success) {
          tours = toursResult.data || [];
          pagination = toursResult.pagination || pagination;
        }
      } catch (err) {
        console.warn('Error cargando tours:', err);
        tours = []; // Continuar con array vacío
      }

      set({
        categories,
        tours,
        pagination,
        isLoading: false,
        hasInitialized: true,
        error: null
      });
    } catch (error) {
      console.error('Error en initialize toursStore:', error);
      set({
        isLoading: false,
        error: error.message,
        tours: [], // Asegurar que tours sea un array
        categories: [],
        hasInitialized: true // Marcar como inicializado para evitar bucles
      });
    }
  },

  // Cargar tours con filtros
  loadTours: async (customFilters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const { filters, pagination } = get();
      // Validar que pagination exista y tenga las propiedades necesarias
      const safePagination = pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

      const combinedFilters = {
        ...filters,
        ...customFilters,
        page: customFilters.page || safePagination.page,
        limit: customFilters.limit || safePagination.limit
      };

      const result = await toursService.getTours(combinedFilters);

      if (!result.success) {
        console.warn('Error en loadTours:', result.error);
        set({
          isLoading: false,
          error: result.error || i18next.t('errors.unexpectedError'),
          tours: [],
          pagination: safePagination
        });
        return [];
      }

      // El backend devuelve { data: [...], total, page, pageSize, totalPages }
      // BaseService lo envuelve en { success: true, data: { data: [...], ... } }
      const responseData = result.data || {};
      const tours = Array.isArray(responseData) ? responseData : (responseData.data || []);
      const paginationData = {
        page: responseData.page || 1,
        limit: responseData.pageSize || 10,
        total: responseData.total || 0,
        totalPages: responseData.totalPages || 0
      };

      set({
        tours,
        pagination: paginationData,
        isLoading: false,
        error: null
      });

      return tours;
    } catch (error) {
      console.error('Error en loadTours:', error);
      set({
        isLoading: false,
        error: error.message,
        tours: [], // Asegurar que tours sea un array
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
      return [];
    }
  },

  // Obtener tour por ID
  getTourById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.getTourById(id);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        selectedTour: result.data,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Crear nuevo tour
  createTour: async (tourData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.createTour(tourData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      // Recargar tours
      await get().loadTours();
      
      set({ isLoading: false });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Actualizar tour
  updateTour: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.updateTour(id, updates);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        tours: state.tours.map(tour =>
          tour.id === id ? result.data : tour
        ),
        selectedTour: state.selectedTour?.id === id ? result.data : state.selectedTour,
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Eliminar tour
  deleteTour: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.deleteTour(id);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        tours: state.tours.filter(tour => tour.id !== id),
        selectedTour: state.selectedTour?.id === id ? null : state.selectedTour,
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Cambiar estado del tour
  toggleTourStatus: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.toggleTourStatus(id);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        tours: state.tours.map(tour =>
          tour.id === id ? result.data : tour
        ),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Destacar/Quitar destacado
  toggleTourFeatured: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.toggleTourFeatured(id);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        tours: state.tours.map(tour =>
          tour.id === id ? result.data : tour
        ),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Duplicar tour
  duplicateTour: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.duplicateTour(id);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      // Recargar tours
      await get().loadTours();
      
      set({ isLoading: false });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Establecer filtros
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 } // Reset página al cambiar filtros
    }));
    
    // Cargar tours con nuevos filtros
    get().loadTours();
  },

  // Limpiar filtros
  clearFilters: () => {
    set({
      filters: {
        category: '',
        priceRange: null,
        duration: '',
        language: '',
        difficulty: '',
        status: '',
        featured: undefined,
        search: '',
        sortBy: 'popularity'
      },
      pagination: { ...get().pagination, page: 1 }
    });
    
    // Cargar tours sin filtros
    get().loadTours();
  },

  // Cambiar página
  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page }
    }));
    
    get().loadTours();
  },

  // Buscar tours
  searchTours: async (searchTerm) => {
    set({ 
      filters: { ...get().filters, search: searchTerm },
      pagination: { ...get().pagination, page: 1 }
    });
    
    return get().loadTours();
  },

  // Obtener tours disponibles para una fecha
  getAvailableTours: async (date, filters = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.getAvailableTours(date, filters);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({ isLoading: false });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Obtener estadísticas
  getStatistics: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.getStatistics();
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({ isLoading: false });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Obtener tours por categoría
  getToursByCategory: (category) => {
    const { tours } = get();
    return tours.filter(tour => tour.category === category);
  },

  // Obtener tours destacados
  getFeaturedTours: () => {
    const { tours } = get();
    return tours.filter(tour => tour.featured);
  },

  // Obtener tours activos
  getActiveTours: () => {
    const { tours } = get();
    return tours.filter(tour => tour.status === 'activo');
  },

  // Seleccionar tour
  selectTour: (tour) => set({ selectedTour: tour }),

  // Limpiar tour seleccionado
  clearSelectedTour: () => set({ selectedTour: null }),

  // Asignar guía a tour con validaciones
  assignGuideToTour: async (tourId, guideId, options = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      // Validar disponibilidad del guía
      const availabilityResult = await toursService.checkGuideAvailability(tourId, guideId);
      
      if (!availabilityResult.success) {
        throw new Error(availabilityResult.error || i18next.t('errors.unexpectedError'));
      }

      if (!availabilityResult.data.isAvailable) {
        const conflicts = availabilityResult.data.conflicts || [];
        throw new Error(`El guía tiene conflictos de horario: ${conflicts.join(', ')}`);
      }

      // Validar competencias si es necesario
      if (options.validateCompetences) {
        const competenceResult = await toursService.checkGuideCompetences(tourId, guideId);
        
        if (!competenceResult.success || !competenceResult.data.hasRequiredCompetences) {
          throw new Error(i18next.t('errors.unexpectedError'));
        }
      }

      // Asignar el guía
      const result = await toursService.assignGuideToTour(tourId, guideId, options);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        tours: state.tours.map(tour =>
          tour.id === tourId ? result.data : tour
        ),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Asignar tour a agencia
  assignTourToAgency: async (tourId, agencyId, options = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.assignTourToAgency(tourId, agencyId, options);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        tours: state.tours.map(tour =>
          tour.id === tourId ? result.data : tour
        ),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Obtener disponibilidad de guías para un tour
  getAvailableGuidesForTour: async (tourId, date) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.getAvailableGuidesForTour(tourId, date);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({ isLoading: false });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Remover asignación
  removeAssignment: async (tourId, assignmentType = 'guide') => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await toursService.removeAssignment(tourId, assignmentType);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        tours: state.tours.map(tour =>
          tour.id === tourId ? result.data : tour
        ),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Establecer estado de carga
  setLoading: (isLoading) => set({ isLoading }),

  // Establecer error
  setError: (error) => set({ error }),

  // Limpiar error
  clearError: () => set({ error: null }),

  // Limpiar store
  clearStore: () => {
    set({
      tours: [],
      categories: [],
      selectedTour: null,
      filters: {
        category: '',
        priceRange: null,
        duration: '',
        language: '',
        difficulty: '',
        status: '',
        featured: undefined,
        search: '',
        sortBy: 'popularity'
      },
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      },
      isLoading: false,
      error: null,
      hasInitialized: false
    });
  }
}));

export { useToursStore };
export default useToursStore;