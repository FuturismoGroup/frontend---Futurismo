/**
 * Store para la gestión de vehículos
 */

import { create } from 'zustand';
import i18next from 'i18next';
import { persist } from 'zustand/middleware';
import vehiclesService from '../services/vehiclesService';
import { toast } from 'react-hot-toast';
import { VEHICLE_MESSAGES } from '../constants/vehiclesConstants';

const useVehiclesStore = create(
  persist(
    (set, get) => ({
      // Estado
      vehicles: [],
      selectedVehicle: null,
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
      
      // Obtener lista de vehículos
      fetchVehicles: async (params = {}) => {
        set({ loading: true, error: null });
        
        try {
          const mergedParams = {
            ...get().filters,
            ...params,
            page: params.page || get().pagination.page,
            pageSize: params.pageSize || get().pagination.pageSize
          };
          
          const result = await vehiclesService.getVehicles(mergedParams);
          
          if (result.success) {
            set({
              vehicles: result.data.items,
              pagination: result.data.pagination,
              loading: false
            });
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({ 
            error: error.message || VEHICLE_MESSAGES.FETCH_ERROR, 
            loading: false 
          });
          toast.error(error.message || VEHICLE_MESSAGES.FETCH_ERROR);
        }
      },

      // Obtener un vehículo por ID
      fetchVehicleById: async (id) => {
        set({ loading: true, error: null });
        
        try {
          const result = await vehiclesService.getVehicleById(id);
          
          if (result.success) {
            set({
              selectedVehicle: result.data,
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

      // Crear nuevo vehículo
      createVehicle: async (vehicleData) => {
        set({ loading: true, error: null });
        
        try {
          const result = await vehiclesService.createVehicle(vehicleData);
          
          if (result.success) {
            // Recargar lista
            await get().fetchVehicles();
            
            set({ loading: false });
            toast.success(result.message || VEHICLE_MESSAGES.CREATE_SUCCESS);
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({ 
            error: error.message || VEHICLE_MESSAGES.CREATE_ERROR, 
            loading: false 
          });
          toast.error(error.message || VEHICLE_MESSAGES.CREATE_ERROR);
          return null;
        }
      },

      // Actualizar vehículo
      updateVehicle: async (id, vehicleData) => {
        set({ loading: true, error: null });
        
        try {
          const result = await vehiclesService.updateVehicle(id, vehicleData);
          
          if (result.success) {
            // Actualizar en la lista
            set(state => ({
              vehicles: state.vehicles.map(vehicle => 
                vehicle.id === id ? result.data : vehicle
              ),
              selectedVehicle: state.selectedVehicle?.id === id 
                ? result.data 
                : state.selectedVehicle,
              loading: false
            }));
            
            toast.success(result.message || VEHICLE_MESSAGES.UPDATE_SUCCESS);
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({ 
            error: error.message || VEHICLE_MESSAGES.UPDATE_ERROR, 
            loading: false 
          });
          toast.error(error.message || VEHICLE_MESSAGES.UPDATE_ERROR);
          return null;
        }
      },

      // Eliminar vehículo
      deleteVehicle: async (id) => {
        set({ loading: true, error: null });
        
        try {
          const result = await vehiclesService.deleteVehicle(id);
          
          if (result.success) {
            // Eliminar de la lista
            set(state => ({
              vehicles: state.vehicles.filter(vehicle => vehicle.id !== id),
              selectedVehicle: state.selectedVehicle?.id === id 
                ? null 
                : state.selectedVehicle,
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
            
            toast.success(result.message || VEHICLE_MESSAGES.DELETE_SUCCESS);
            return true;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({ 
            error: error.message || VEHICLE_MESSAGES.DELETE_ERROR, 
            loading: false 
          });
          toast.error(error.message || VEHICLE_MESSAGES.DELETE_ERROR);
          return false;
        }
      },

      // Verificar disponibilidad
      checkVehicleAvailability: async (vehicleId, date, passengers) => {
        try {
          const result = await vehiclesService.checkAvailability(vehicleId, date, passengers);
          
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

      // Obtener vehículos disponibles
      fetchAvailableVehicles: async (date, minCapacity, vehicleType, excludeReservationId = null) => {
        set({ loading: true, error: null });

        try {
          const result = await vehiclesService.getAvailableVehicles(date, minCapacity, vehicleType, excludeReservationId);
          
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

      // Asignar vehículo
      assignVehicle: async (vehicleId, assignmentData) => {
        try {
          const result = await vehiclesService.assignVehicle(vehicleId, assignmentData);
          
          if (result.success) {
            // Actualizar vehículo en la lista si está cargado
            const vehicle = get().vehicles.find(v => v.id === vehicleId);
            if (vehicle) {
              set(state => ({
                vehicles: state.vehicles.map(v =>
                  v.id === vehicleId
                    ? {
                        ...v,
                        currentAssignments: [...(v.currentAssignments || []), result.data]
                      }
                    : v
                )
              }));
            }
            
            toast.success(result.message || VEHICLE_MESSAGES.ASSIGN_SUCCESS);
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          toast.error(error.message || VEHICLE_MESSAGES.ASSIGN_ERROR);
          return null;
        }
      },

      // Registrar mantenimiento
      registerMaintenance: async (vehicleId, maintenanceData) => {
        try {
          const result = await vehiclesService.registerMaintenance(vehicleId, maintenanceData);
          
          if (result.success) {
            // Actualizar vehículo
            await get().fetchVehicleById(vehicleId);
            
            toast.success(result.message || i18next.t('common.create'));
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          toast.error(error.message || i18next.t('errors.unexpectedError'));
          return null;
        }
      },

      // Obtener estadísticas
      fetchStatistics: async () => {
        try {
          const result = await vehiclesService.getVehiclesStatistics();
          
          if (result.success) {
            set({ statistics: result.data });
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          toast.error(error.message || i18next.t('errors.unexpectedError'));
          return null;
        }
      },

      // Obtener vehículos que requieren mantenimiento
      fetchMaintenanceRequired: async () => {
        try {
          const result = await vehiclesService.getMaintenanceRequired();
          
          if (result.success) {
            set({ maintenanceRequired: result.data });
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          toast.error(error.message || i18next.t('errors.unexpectedError'));
          return [];
        }
      },

      // Subir foto
      uploadVehiclePhoto: async (vehicleId, photoType, file, onProgress) => {
        try {
          const result = await vehiclesService.uploadPhoto(vehicleId, photoType, file, onProgress);
          
          if (result.success) {
            // Actualizar vehículo con nueva foto
            await get().fetchVehicleById(vehicleId);
            toast.success(i18next.t('common.update'));
            return result.data;
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          toast.error(error.message || i18next.t('errors.unexpectedError'));
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
            status: '',
            type: '',
            fuelType: '',
            minCapacity: '',
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

      // Seleccionar vehículo
      selectVehicle: (vehicle) => {
        set({ selectedVehicle: vehicle });
      },

      // Limpiar selección
      clearSelection: () => {
        set({ selectedVehicle: null });
      },

      // Limpiar errores
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'vehicles-storage',
      partialize: (state) => ({
        pagination: state.pagination,
        filters: state.filters
      })
    }
  )
);

export default useVehiclesStore;