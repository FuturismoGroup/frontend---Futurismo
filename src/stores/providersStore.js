/**
 * Store de proveedores
 * Maneja el estado global de proveedores
 */

import { create } from 'zustand';
import i18next from 'i18next';
import { persist, devtools } from 'zustand/middleware';
import providersService from '../services/providersService';

const useProvidersStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Estado
        locations: [],
        categories: [],
        services: [],
        providers: [],
        currentProvider: null,
        selectedLocation: null,
        selectedCategory: null,
        isLoading: false,
        error: null,
        
        // Paginación
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0
        },
        
        // Filtros
        filters: {
          search: '',
          location: '',
          category: '',
          minRating: null,
          status: ''
        },
        
        // Estadísticas
        stats: null,

        // Acciones
        actions: {
          // Inicialización
          initialize: async () => {
            set({ isLoading: true, error: null });

            try {
              // Cargar datos de manera independiente para evitar que un error bloquee todo
              let locations = [];
              let categories = [];
              let services = [];

              try {
                const locationsResult = await providersService.getLocations();
                locations = locationsResult.success ? locationsResult.data || [] : [];
              } catch (err) {
                console.warn('Error cargando locations de providers:', err);
                locations = []; // Continuar con array vacío
              }

              try {
                const categoriesResult = await providersService.getCategories();
                categories = categoriesResult.success ? categoriesResult.data || [] : [];
              } catch (err) {
                console.warn('Error cargando categories de providers:', err);
                categories = []; // Continuar con array vacío
              }

              try {
                const servicesResult = await providersService.getServices();
                services = servicesResult.success ? servicesResult.data || [] : [];
              } catch (err) {
                console.warn('Error cargando services de providers:', err);
                services = []; // Continuar con array vacío
              }

              set({
                locations,
                categories,
                services,
                isLoading: false,
                error: null
              });

              return true;
            } catch (error) {
              console.error('Error en initialize providersStore:', error);
              set({
                isLoading: false,
                error: error.message,
                locations: [], // Asegurar que sean arrays
                categories: [],
                services: []
              });
              // No lanzar error para permitir que la aplicación continúe
              return false;
            }
          },
          
          // Acciones de filtros
          setFilters: (filters) => {
            set((state) => ({
              filters: { ...state.filters, ...filters },
              pagination: { ...state.pagination, page: 1 }
            }));
            return get().actions.fetchProviders();
          },
          
          clearFilters: () => {
            set({
              filters: {
                search: '',
                location: '',
                category: '',
                minRating: null,
                status: ''
              },
              pagination: { ...get().pagination, page: 1 }
            });
            return get().actions.fetchProviders();
          },
          
          setSearch: (search) => {
            set((state) => ({
              filters: { ...state.filters, search },
              pagination: { ...state.pagination, page: 1 }
            }));
            return get().actions.fetchProviders();
          },
          
          setPage: (page) => {
            set((state) => ({
              pagination: { ...state.pagination, page }
            }));
            return get().actions.fetchProviders();
          },
          
          setSelectedLocation: (locationId) => {
            set({ selectedLocation: locationId });
            return get().actions.setFilters({ location: locationId });
          },
          
          setSelectedCategory: (categoryId) => {
            set({ selectedCategory: categoryId });
            return get().actions.setFilters({ category: categoryId });
          },

          // CRUD de proveedores
          fetchProviders: async () => {
            set({ isLoading: true, error: null });
            
            try {
              const { filters, pagination } = get();
              const params = {
                ...filters,
                page: pagination.page,
                pageSize: pagination.pageSize
              };
              
              const result = await providersService.getProviders(params);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              set({
                providers: result.data.providers || result.data || [],
                pagination: {
                  page: result.data.page || 1,
                  pageSize: result.data.pageSize || 20,
                  total: result.data.total || 0,
                  totalPages: result.data.totalPages || 0
                },
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
          
          fetchProviderById: async (id) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await providersService.getProviderById(id);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              set({
                currentProvider: result.data,
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
          
          createProvider: async (providerData) => {
            set({ isLoading: true, error: null });

            try {
              const result = await providersService.createProvider(providerData);

              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }

              set((state) => {
                // Asegurar que state.providers sea un array válido
                const currentProviders = Array.isArray(state.providers) ? state.providers : [];

                console.log('✅ Proveedor creado, agregando a la lista:', {
                  nuevo: result.data.name,
                  cantidadActual: currentProviders.length,
                  cantidadNueva: currentProviders.length + 1
                });

                return {
                  providers: [result.data, ...currentProviders],
                  isLoading: false
                };
              });

              return result.data;
            } catch (error) {
              console.error('❌ Error creando proveedor:', error);
              set({
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },

          updateProvider: async (id, updateData) => {
            set({ isLoading: true, error: null });

            try {
              const result = await providersService.updateProvider(id, updateData);

              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }

              set((state) => ({
                providers: (state.providers || []).map(p =>
                  p.id === id ? result.data : p
                ),
                currentProvider: state.currentProvider?.id === id
                  ? result.data
                  : state.currentProvider,
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

          deleteProvider: async (id) => {
            set({ isLoading: true, error: null });

            try {
              const result = await providersService.deleteProvider(id);

              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }

              set((state) => ({
                providers: (state.providers || []).filter(p => p.id !== id),
                currentProvider: state.currentProvider?.id === id
                  ? null
                  : state.currentProvider,
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
          
          toggleProviderStatus: async (id, status) => {
            set({ isLoading: true, error: null });

            try {
              const result = await providersService.toggleProviderStatus(id, status);

              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }

              set((state) => ({
                providers: (state.providers || []).map(p =>
                  p.id === id ? result.data : p
                ),
                currentProvider: state.currentProvider?.id === id
                  ? result.data
                  : state.currentProvider,
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

          // Búsqueda y validación
          searchProviders: async (query, filters = {}) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await providersService.searchProviders(query, filters);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              set({
                providers: result.data.providers,
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
          
          checkProviderAvailability: async (providerId, date, startTime, endTime) => {
            try {
              const result = await providersService.checkProviderAvailability(
                providerId, date, startTime, endTime
              );
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              return result.data;
            } catch (error) {
              set({ error: error.message });
              throw error;
            }
          },
          
          // Estadísticas
          fetchProvidersStats: async () => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await providersService.getProvidersStats();
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              set({
                stats: result.data,
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
          
          // Importación/Exportación
          importProviders: async (file, onProgress = null) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await providersService.importProviders(file, onProgress);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              // Recargar lista de proveedores
              await get().actions.fetchProviders();
              
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
          
          exportProviders: async (filters = {}, format = 'excel') => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await providersService.exportProviders(filters, format);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              set({ isLoading: false });
              
              return result;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          // Crear ubicación
          createLocation: async (locationData) => {
            set({ isLoading: true, error: null });

            try {
              const result = await providersService.createLocation(locationData);

              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }

              // Agregar la nueva ubicación al estado inmediatamente
              set((state) => ({
                locations: [...state.locations, result.data],
                isLoading: false
              }));

              // Opcionalmente, recargar todas las ubicaciones para sincronizar
              try {
                const locationsResult = await providersService.getLocations();
                if (locationsResult.success) {
                  set({ locations: locationsResult.data || [] });
                }
              } catch (reloadError) {
                console.warn('Error recargando ubicaciones:', reloadError);
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

          // Crear categoría
          createCategory: async (categoryData) => {
            set({ isLoading: true, error: null });

            try {
              const result = await providersService.createCategory(categoryData);

              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }

              // Agregar la nueva categoría al estado inmediatamente
              set((state) => ({
                categories: [...state.categories, result.data],
                isLoading: false
              }));

              // Opcionalmente, recargar todas las categorías para sincronizar
              try {
                const categoriesResult = await providersService.getCategories();
                if (categoriesResult.success) {
                  set({ categories: categoriesResult.data || [] });
                }
              } catch (reloadError) {
                console.warn('Error recargando categorías:', reloadError);
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

          // Crear servicio
          createService: async (serviceData) => {
            set({ isLoading: true, error: null });

            try {
              const result = await providersService.createService(serviceData);

              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }

              // Agregar el nuevo servicio al estado inmediatamente para evitar delay
              set((state) => ({
                services: [...state.services, result.data],
                isLoading: false
              }));

              // Opcionalmente, recargar todos los servicios para sincronizar
              try {
                const servicesResult = await providersService.getServices();
                if (servicesResult.success) {
                  set({ services: servicesResult.data || [] });
                }
              } catch (reloadError) {
                console.warn('Error recargando servicios:', reloadError);
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
          getCategoriesByLocation: (locationId) => {
            const location = get().locations.find(loc => loc.id === locationId);
            if (!location) return [];

            const allCategories = get().categories;
            if (!allCategories || allCategories.length === 0) return [];

            // El backend devuelve 'categoryCounts' con IDs de categorías
            // o 'categories' como array de IDs
            const categoryIds = location.categories ||
              (location.categoryCounts ? Object.keys(location.categoryCounts) : []);

            if (!categoryIds || categoryIds.length === 0) {
              // Si no hay categorías específicas, devolver todas
              return allCategories;
            }

            return categoryIds.map(catId =>
              allCategories.find(cat => cat.id === catId)
            ).filter(Boolean);
          },
          
          getProvidersByLocationAndCategory: (locationId, categoryId = null) => {
            const { providers } = get();

            if (!providers || providers.length === 0) {
              return [];
            }

            // Defensa en profundidad: nunca contar soft-deleted, aunque por una
            // carrera entre fetchProviders, updateProvider o toggleProviderStatus
            // un eliminado se cuele en state.providers. El backend ya excluye
            // status='deleted', pero este filtro evita que los badges del árbol
            // de ubicaciones reporten un número distinto del que ve la grilla.
            let filteredProviders = providers.filter(p => p?.status !== 'deleted');

            // Filtrar por ubicación - soporta múltiples formatos del backend
            if (locationId) {
              filteredProviders = filteredProviders.filter(provider =>
                provider.location === locationId ||  // Backend devuelve 'location' (UUID)
                provider.locationId === locationId ||
                provider.location_id === locationId
              );
            }

            // Filtrar por categoría si se especifica - soporta múltiples formatos
            if (categoryId) {
              filteredProviders = filteredProviders.filter(provider =>
                provider.category === categoryId ||  // Backend devuelve 'category' (UUID)
                provider.categoryId === categoryId ||
                provider.category_id === categoryId
              );
            }

            return filteredProviders;
          },

          getTotalProvidersCount: () => {
            const { providers } = get();
            if (!providers) return 0;
            // Mismo razonamiento que getProvidersByLocationAndCategory: el conteo
            // total nunca debe incluir soft-deleted.
            return providers.filter(p => p?.status !== 'deleted').length;
          },
          
          clearError: () => set({ error: null }),
          
          resetStore: () => {
            set({
              providers: [],
              currentProvider: null,
              selectedLocation: null,
              selectedCategory: null,
              isLoading: false,
              error: null,
              pagination: {
                page: 1,
                pageSize: 20,
                total: 0,
                totalPages: 0
              },
              filters: {
                search: '',
                location: '',
                category: '',
                minRating: null,
                status: ''
              },
              stats: null
            });
          }
        }
      }),
      {
        name: 'providers-store',
        version: 3, // Bump: dejamos de persistir 'providers' para evitar mostrar
        // soft-deleted en cache después de una recarga o cambio de filtros.
        // Ya no persistimos nada del módulo: providers se cargan frescos vía
        // fetchProviders() en cada montaje, y los catálogos (categories,
        // locations, services) en initialize(). Esto garantiza que un
        // proveedor eliminado en el backend no reaparezca por cache local.
        partialize: () => ({}),
        merge: (_persistedState, currentState) => ({
          ...currentState,
          providers: [],
          locations: [],
          categories: [],
          services: []
        })
      }
    ),
    {
      name: 'providers-store'
    }
  )
);

export default useProvidersStore;