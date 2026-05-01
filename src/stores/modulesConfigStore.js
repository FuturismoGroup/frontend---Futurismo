/**
 * Store para configuraciones de módulos específicos
 * Centraliza la configuración de todos los módulos del sistema
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useModulesConfigStore = create(
  persist(
    (set, get) => ({
      // Estado
      modules: null,
      isLoaded: false,
      isLoading: false,
      error: null,

      // Cargar todas las configuraciones de módulos
      loadModules: async () => {
        // ✅ Prevenir llamadas duplicadas - verificar si ya está cargado o cargando
        const currentState = get();
        if (currentState.isLoading || currentState.isLoaded) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Timeout de 5 segundos para evitar que se quede colgado
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 5000);
          });

          const response = await Promise.race([
            api.get('/config/modules'),
            timeoutPromise
          ]);

          // El backend devuelve { modules: {...} } directamente
          const data = response.data;
          if (data && data.modules) {
            set({
              modules: data.modules,
              isLoaded: true,
              isLoading: false,
              error: null
            });
          } else {
            // Si no hay datos, usar valores por defecto
            console.warn('[modulesConfigStore] Usando módulos por defecto');
            set({
              modules: {
                reservations: { enabled: true, label: 'Reservas' },
                tours: { enabled: true, label: 'Tours' },
                guides: { enabled: true, label: 'Guías' },
                agencies: { enabled: true, label: 'Agencias' }
              },
              isLoaded: true,
              isLoading: false,
              error: null
            });
          }
        } catch (error) {
          console.error('[modulesConfigStore] Error loading modules config:', error);
          // En caso de error, establecer valores por defecto para que la app funcione
          set({
            modules: {
              reservations: { enabled: true, label: 'Reservas' },
              tours: { enabled: true, label: 'Tours' },
              guides: { enabled: true, label: 'Guías' },
              agencies: { enabled: true, label: 'Agencias' }
            },
            error: null, // No bloquear con error
            isLoading: false,
            isLoaded: true // Marcar como cargado para evitar loops
          });
        }
      },

      // Cargar un módulo específico
      loadModule: async (moduleName) => {
        try {
          const response = await api.get(`/config/${moduleName}`);

          if (response.data.success) {
            set(state => ({
              modules: {
                ...state.modules,
                [moduleName]: response.data.data
              }
            }));
          }
        } catch (error) {
          console.error(`Error loading ${moduleName} config:`, error);
          throw error;
        }
      },

      // Limpiar configuración
      clearModules: () => {
        set({
          modules: null,
          isLoaded: false,
          isLoading: false,
          error: null
        });
      },

      // Recargar configuración
      reloadModules: async () => {
        get().clearModules();
        await get().loadModules();
      }
    }),
    {
      name: 'modules-config-store',
      partialize: (state) => ({
        modules: state.modules,
        isLoaded: state.isLoaded
      })
    }
  )
);

export default useModulesConfigStore;
