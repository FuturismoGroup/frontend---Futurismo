/**
 * Store para la gestión de choferes
 */

import { create } from 'zustand';
import i18next from 'i18next';
import { persist } from 'zustand/middleware';
import driversService from '../services/driversService';
import { toast } from 'react-hot-toast';
import { DRIVER_MESSAGES } from '../constants/driversConstants';

const useDriversStore = create(
  persist(
    (set, get) => ({
      // Estado
      drivers: [],
      selectedDriver: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      },
      filters: {
        search: ''
      },

      // Actions
      
      // Obtener lista de choferes
      fetchDrivers: async (params = {}) => {
        set({ loading: true, error: null });
        
        try {
          const mergedParams = {
            ...get().filters,
            ...params,
            page: params.page || get().pagination.page,
            pageSize: params.pageSize || get().pagination.pageSize
          };
          
          const result = await driversService.getDrivers(mergedParams);
          
          if (result.success) {
            set({
              drivers: result.data.items,
              pagination: result.data.pagination,
              loading: false
            });
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({ 
            error: error.message || DRIVER_MESSAGES.FETCH_ERROR, 
            loading: false 
          });
          toast.error(error.message || DRIVER_MESSAGES.FETCH_ERROR);
        }
      },

      // Obtener un chofer por ID
      fetchDriverById: async (id) => {
        set({ loading: true, error: null });
        
        try {
          const result = await driversService.getDriverById(id);
          
          if (result.success) {
            set({
              selectedDriver: result.data,
              loading: false
            });
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({ 
            error: error.message || i18next.t('errors.unexpectedError'), 
            loading: false 
          });
          toast.error(error.message || i18next.t('errors.unexpectedError'));
          return null;
        }
      },

      // Crear nuevo chofer
      createDriver: async (driverData) => {
        set({ loading: true, error: null });

        try {
          const result = await driversService.createDriver(driverData);

          if (result.success) {
            // Asegurar que el driver tenga fullName
            const newDriver = result.data;
            if (!newDriver.fullName) {
              newDriver.fullName = `${newDriver.first_name || newDriver.firstName || ''} ${newDriver.last_name || newDriver.lastName || ''}`.trim();
            }

            // Recargar lista
            await get().fetchDrivers();

            set({ loading: false });
            toast.success(result.message || DRIVER_MESSAGES.CREATE_SUCCESS);
            return newDriver;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({
            error: error.message || DRIVER_MESSAGES.CREATE_ERROR,
            loading: false
          });
          toast.error(error.message || DRIVER_MESSAGES.CREATE_ERROR);
          return null;
        }
      },

      // Actualizar chofer
      updateDriver: async (id, driverData) => {
        set({ loading: true, error: null });

        try {
          const result = await driversService.updateDriver(id, driverData);

          if (result.success) {
            // Asegurar que el driver tenga fullName
            const updatedDriver = result.data;
            if (!updatedDriver.fullName) {
              updatedDriver.fullName = `${updatedDriver.first_name || updatedDriver.firstName || ''} ${updatedDriver.last_name || updatedDriver.lastName || ''}`.trim();
            }

            // Actualizar en la lista
            set(state => ({
              drivers: state.drivers.map(driver =>
                driver.id === id ? updatedDriver : driver
              ),
              selectedDriver: state.selectedDriver?.id === id
                ? updatedDriver
                : state.selectedDriver,
              loading: false
            }));

            toast.success(result.message || DRIVER_MESSAGES.UPDATE_SUCCESS);
            return updatedDriver;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({
            error: error.message || DRIVER_MESSAGES.UPDATE_ERROR,
            loading: false
          });
          toast.error(error.message || DRIVER_MESSAGES.UPDATE_ERROR);
          return null;
        }
      },

      // Eliminar chofer
      deleteDriver: async (id) => {
        set({ loading: true, error: null });
        
        try {
          const result = await driversService.deleteDriver(id);
          
          if (result.success) {
            // Eliminar de la lista
            set(state => ({
              drivers: state.drivers.filter(driver => driver.id !== id),
              selectedDriver: state.selectedDriver?.id === id 
                ? null 
                : state.selectedDriver,
              loading: false
            }));
            
            // Actualizar paginación
            const { totalItems } = get().pagination;
            if (totalItems > 0) {
              set(state => ({
                pagination: {
                  ...state.pagination,
                  totalItems: totalItems - 1
                }
              }));
            }
            
            toast.success(result.message || DRIVER_MESSAGES.DELETE_SUCCESS);
            return true;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({ 
            error: error.message || DRIVER_MESSAGES.DELETE_ERROR, 
            loading: false 
          });
          toast.error(error.message || DRIVER_MESSAGES.DELETE_ERROR);
          return false;
        }
      },

      // Verificar disponibilidad
      checkDriverAvailability: async (driverId, date, duration) => {
        try {
          const result = await driversService.checkAvailability(driverId, date, duration);
          
          if (result.success) {
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          toast.error(error.message || i18next.t('errors.unexpectedError'));
          return null;
        }
      },

      // Obtener choferes disponibles
      fetchAvailableDrivers: async (date, vehicleType, excludeReservationId = null) => {
        set({ loading: true, error: null });

        try {
          const result = await driversService.getAvailableDrivers(date, vehicleType, excludeReservationId);
          
          if (result.success) {
            set({ loading: false });
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({ 
            error: error.message || i18next.t('errors.unexpectedError'), 
            loading: false 
          });
          toast.error(error.message || i18next.t('errors.unexpectedError'));
          return [];
        }
      },

      // Asignar chofer
      assignDriver: async (driverId, assignmentData) => {
        try {
          const result = await driversService.assignDriver(driverId, assignmentData);
          
          if (result.success) {
            // Actualizar chofer en la lista si está cargado
            const driver = get().drivers.find(d => d.id === driverId);
            if (driver) {
              set(state => ({
                drivers: state.drivers.map(d =>
                  d.id === driverId
                    ? {
                        ...d,
                        currentAssignments: [...(d.currentAssignments || []), result.data]
                      }
                    : d
                )
              }));
            }
            
            toast.success(result.message || DRIVER_MESSAGES.ASSIGN_SUCCESS);
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          toast.error(error.message || DRIVER_MESSAGES.ASSIGN_ERROR);
          return null;
        }
      },



      // Actualizar filtros
      setFilters: (filters) => {
        set(state => ({
          filters: { ...state.filters, ...filters }
        }));
      },

      // Limpiar filtros
      clearFilters: () => {
        set({
          filters: {
            search: ''
          }
        });
      },

      // Cambiar página
      setPage: (page) => {
        set(state => ({
          pagination: { ...state.pagination, page }
        }));
      },

      // Cambiar tamaño de página
      setPageSize: (pageSize) => {
        set(state => ({
          pagination: { ...state.pagination, pageSize, page: 1 }
        }));
      },

      // Seleccionar chofer
      selectDriver: (driver) => {
        set({ selectedDriver: driver });
      },

      // Limpiar selección
      clearSelection: () => {
        set({ selectedDriver: null });
      },

      // Limpiar errores
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'drivers-storage',
      partialize: (state) => ({
        pagination: state.pagination,
        filters: state.filters
      })
    }
  )
);

export default useDriversStore;