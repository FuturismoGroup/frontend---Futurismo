/**
 * Store de marketplace
 * Maneja el estado global del marketplace de guías
 */

import { create } from 'zustand';
import i18next from 'i18next';
import marketplaceService from '../services/marketplaceService';
import {
  WORK_ZONES,
  TOUR_TYPES,
  GROUP_TYPES,
  DEFAULT_FILTERS,
  MARKETPLACE_VIEWS
} from '../constants/marketplaceConstants';

const useMarketplaceStore = create((set, get) => ({
  // Estado
  freelanceGuides: [],
  currentGuide: null,
  serviceRequests: [],
  currentRequest: null,
  reviews: [],
  isLoading: false,
  error: null,
  
  // Configuración
  workZones: WORK_ZONES,
  tourTypes: TOUR_TYPES,
  groupTypes: GROUP_TYPES,
  
  // Filtros y búsqueda
  activeFilters: { ...DEFAULT_FILTERS },
  searchQuery: '',
  sortBy: 'rating', // rating, price, experience, reviews
  currentView: MARKETPLACE_VIEWS.GRID,
  
  // Paginación
  pagination: {
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0
  },

  // Estadísticas
  marketplaceStats: null,
  guideStats: null,

  // Acciones de búsqueda y filtros
  searchGuides: async (query) => {
    set({ searchQuery: query, pagination: { ...get().pagination, page: 1 } });
    return get().fetchFreelanceGuides();
  },
  
  setFilters: (filters) => {
    set({ 
      activeFilters: { ...get().activeFilters, ...filters },
      pagination: { ...get().pagination, page: 1 }
    });
    return get().fetchFreelanceGuides();
  },
  
  clearFilters: () => {
    set({
      activeFilters: { ...DEFAULT_FILTERS },
      searchQuery: '',
      pagination: { ...get().pagination, page: 1 }
    });
    return get().fetchFreelanceGuides();
  },
  
  setSortBy: (sortBy) => {
    set({ sortBy });
    return get().fetchFreelanceGuides();
  },

  setView: (view) => {
    set({ currentView: view });
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page }
    }));
    return get().fetchFreelanceGuides();
  },

  // Acciones CRUD - Guías
  fetchFreelanceGuides: async () => {
    set({ isLoading: true, error: null });

    try {
      const { activeFilters, searchQuery, sortBy, pagination } = get();

      const params = {
        ...activeFilters,
        search: searchQuery,
        sortBy,
        page: pagination.page,
        pageSize: pagination.pageSize
      };

      const result = await marketplaceService.getFreelanceGuides(params);

      if (!result.success) {
        // No lanzar error, solo usar datos vacíos
        set({
          freelanceGuides: [],
          pagination: {
            page: 1,
            pageSize: pagination.pageSize,
            total: 0,
            totalPages: 0
          },
          isLoading: false,
          error: result.error || i18next.t('errors.unexpectedError')
        });
        return { guides: [], page: 1, pageSize: pagination.pageSize, total: 0, totalPages: 0 };
      }

      // El backend devuelve { data: [...], pagination: {...} }
      // Mapeamos los datos para normalizar nombres de propiedades
      const guides = Array.isArray(result.data) ? result.data : (result.data?.guides || []);
      const paginationData = result.pagination || result.data?.pagination || {};

      // Normalizar propiedades de cada guía para el frontend
      const normalizedGuides = guides.map(guide => ({
        ...guide,
        // Normalizar nombres de propiedades
        fullName: guide.name || `${guide.firstName || ''} ${guide.lastName || ''}`.trim(),
        profileImage: guide.profilePhoto || guide.guidePhoto,
        reviewCount: guide.reviewCount || guide.reviewsCount || 0,
        completedTours: guide.completedTours || guide.toursCompleted || 0,
        workZones: typeof guide.workZones === 'string' ? JSON.parse(guide.workZones) : (guide.workZones || []),
        languages: typeof guide.languages === 'string' ? JSON.parse(guide.languages) : (guide.languages || []),
        specialties: typeof guide.specialties === 'string' ? JSON.parse(guide.specialties) : (guide.specialties || []),
        status: guide.online ? 'available' : (guide.status || 'inactive')
      }));

      set({
        freelanceGuides: normalizedGuides,
        pagination: {
          page: paginationData.page || 1,
          pageSize: paginationData.pageSize || pagination.pageSize,
          total: paginationData.total || normalizedGuides.length,
          totalPages: paginationData.totalPages || 1
        },
        isLoading: false,
        error: null
      });

      return { guides: normalizedGuides, ...paginationData };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
        freelanceGuides: [], // Asegurar que sea un array
        pagination: {
          page: 1,
          pageSize: get().pagination?.pageSize || 12,
          total: 0,
          totalPages: 0
        }
      });
      // No lanzar error para permitir que la aplicación continúe
      return { guides: [], page: 1, pageSize: 12, total: 0, totalPages: 0 };
    }
  },

  fetchGuideProfile: async (guideId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.getGuideProfile(guideId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }

      // Normalizar datos para el frontend
      const raw = result.data;
      const normalized = {
        ...raw,
        reviewCount: raw.reviewCount || raw.reviewsCount || 0,
        completedTours: raw.completedTours || raw.toursCompleted || 0,
        joinedDate: raw.joinedDate || raw.createdAt,
        verified: raw.verified || false,
        workZones: typeof raw.workZones === 'string' ? JSON.parse(raw.workZones) : (raw.workZones || raw.work_zones || []),
        languages: typeof raw.languages === 'string' ? JSON.parse(raw.languages) : (raw.languages || []),
        specialties: typeof raw.specialties === 'string' ? JSON.parse(raw.specialties) : (raw.specialties || []),
        museums: typeof raw.museums === 'string' ? JSON.parse(raw.museums) : (raw.museums || []),
        certifications: typeof raw.certifications === 'string' ? JSON.parse(raw.certifications) : (raw.certifications || []),
        fullName: raw.name || `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
        profileImage: raw.profilePhoto || raw.guidePhoto
      };

      set({
        currentGuide: normalized,
        isLoading: false
      });

      return normalized;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Verificar disponibilidad de fecha
  checkDateAvailability: async (guideId, date) => {
    try {
      const result = await marketplaceService.checkDateAvailability(guideId, date);
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  // Acciones CRUD - Solicitudes de servicio
  createServiceRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.createServiceRequest(requestData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        serviceRequests: [result.data, ...state.serviceRequests],
        currentRequest: result.data,
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

  fetchServiceRequests: async (filters = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.getServiceRequests(filters);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        serviceRequests: result.data,
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

  fetchServiceRequestById: async (requestId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.getServiceRequestById(requestId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        currentRequest: result.data,
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

  updateServiceRequest: async (requestId, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.updateServiceRequest(requestId, updates);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        serviceRequests: state.serviceRequests.map(req =>
          req.id === requestId ? result.data : req
        ),
        currentRequest: state.currentRequest?.id === requestId
          ? result.data
          : state.currentRequest,
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

  respondToServiceRequest: async (requestId, response) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.respondToServiceRequest(requestId, response);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        serviceRequests: state.serviceRequests.map(req =>
          req.id === requestId ? result.data : req
        ),
        currentRequest: state.currentRequest?.id === requestId
          ? result.data
          : state.currentRequest,
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

  cancelServiceRequest: async (requestId, reason) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.cancelServiceRequest(requestId, reason);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        serviceRequests: state.serviceRequests.map(req =>
          req.id === requestId ? result.data : req
        ),
        currentRequest: state.currentRequest?.id === requestId
          ? result.data
          : state.currentRequest,
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

  completeService: async (requestId, completionData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.completeService(requestId, completionData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        serviceRequests: state.serviceRequests.map(req =>
          req.id === requestId ? result.data : req
        ),
        currentRequest: state.currentRequest?.id === requestId
          ? result.data
          : state.currentRequest,
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

  // Acciones CRUD - Reseñas
  fetchGuideReviews: async (guideId, params = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.getGuideReviews(guideId, params);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        reviews: result.data.reviews,
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

  createReview: async (reviewData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.createReview(reviewData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        reviews: [result.data, ...state.reviews],
        isLoading: false
      }));
      
      // Actualizar estadísticas del guía si está cargado
      if (get().currentGuide?.id === reviewData.guideId) {
        get().fetchGuideProfile(reviewData.guideId);
      }
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Estadísticas
  fetchMarketplaceStats: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.getMarketplaceStats();
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        marketplaceStats: result.data,
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

  fetchGuideStats: async (guideId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.getGuideStats(guideId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        guideStats: result.data,
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

  // Administración de guías
  updateGuideMarketplaceProfile: async (guideId, profileData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.updateGuideMarketplaceProfile(guideId, profileData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        freelanceGuides: state.freelanceGuides.map(g =>
          g.id === guideId ? result.data : g
        ),
        currentGuide: state.currentGuide?.id === guideId
          ? result.data
          : state.currentGuide,
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

  // Actualizar tarifa del guía
  updateGuideRate: async (guideId, pricePerPerson) => {
    set({ isLoading: true, error: null });
    try {
      const result = await marketplaceService.updateGuideRate(guideId, { pricePerPerson });
      if (!result.success) throw new Error(result.error || i18next.t('errors.unexpectedError'));
      set((state) => ({
        currentGuide: state.currentGuide ? { ...state.currentGuide, pricePerPerson: result.data.pricePerPerson } : null,
        isLoading: false
      }));
      return result.data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Toggle disponibilidad online/offline
  toggleGuideOnline: async (guideId, online) => {
    set({ isLoading: true, error: null });
    try {
      const result = await marketplaceService.toggleGuideOnline(guideId, online);
      if (!result.success) throw new Error(result.error || i18next.t('errors.unexpectedError'));
      set((state) => ({
        currentGuide: state.currentGuide ? { ...state.currentGuide, online: result.data.online } : null,
        isLoading: false
      }));
      return result.data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  verifyGuide: async (guideId, verificationData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.verifyGuide(guideId, verificationData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        freelanceGuides: state.freelanceGuides.map(g =>
          g.id === guideId 
            ? { ...g, marketplaceStatus: result.data }
            : g
        ),
        currentGuide: state.currentGuide?.id === guideId
          ? { ...state.currentGuide, marketplaceStatus: result.data }
          : state.currentGuide,
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

  // Búsqueda avanzada
  searchGuidesByCompetencies: async (requirements) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.searchGuidesByCompetencies(requirements);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        freelanceGuides: result.data,
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

  fetchFeaturedGuides: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await marketplaceService.getFeaturedGuides();
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Utilidades
  clearError: () => set({ error: null }),
  
  resetStore: () => {
    set({
      freelanceGuides: [],
      currentGuide: null,
      serviceRequests: [],
      currentRequest: null,
      reviews: [],
      isLoading: false,
      error: null,
      activeFilters: { ...DEFAULT_FILTERS },
      searchQuery: '',
      sortBy: 'rating',
      currentView: MARKETPLACE_VIEWS.GRID,
      pagination: {
        page: 1,
        pageSize: 12,
        total: 0,
        totalPages: 0
      },
      marketplaceStats: null,
      guideStats: null
    });
  }
}));

export { useMarketplaceStore };
export default useMarketplaceStore;