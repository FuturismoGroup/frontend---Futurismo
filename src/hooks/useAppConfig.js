import { useState, useEffect, useRef } from 'react';
import { api } from '../services';
import useModulesConfigStore from '../stores/modulesConfigStore';
import { APP_CONFIG } from '../config/app.config';

// Timeout para la carga inicial de configuración (5 segundos)
const CONFIG_LOAD_TIMEOUT = 5000;

// Default configuration fallback - uses environment variables
const defaultConfig = {
  app: {
    name: APP_CONFIG.app.name,
    version: APP_CONFIG.app.version,
    environment: APP_CONFIG.app.environment
  },
  contact: {
    whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '+51999888777',
    email: import.meta.env.VITE_COMPANY_EMAIL || 'info@futurismo.com',
    website: import.meta.env.VITE_COMPANY_WEBSITE || 'https://futurismo.com',
    emergency: {
      police: import.meta.env.VITE_EMERGENCY_POLICE || '105',
      fire: import.meta.env.VITE_EMERGENCY_FIRE || '116',
      medical: import.meta.env.VITE_EMERGENCY_MEDICAL || '106',
      company: import.meta.env.VITE_EMERGENCY_COMPANY || '+51 999 888 777'
    }
  },
  api: {
    baseUrl: APP_CONFIG.api.baseUrl,
    wsUrl: APP_CONFIG.websocket.url,
    timeout: APP_CONFIG.api.timeout
  },
  features: {
    notifications: APP_CONFIG.features.mockData !== true,
    emergency_alerts: true,
    multi_language: true,
    payment_gateway: false,
    real_time_tracking: true
  },
  limits: {
    max_file_size: APP_CONFIG.limits.maxFileSize,
    max_group_size: parseInt(import.meta.env.VITE_MAX_GROUP_SIZE, 10) || 50,
    max_tour_capacity: parseInt(import.meta.env.VITE_MAX_TOUR_CAPACITY, 10) || 20,
    reservation_days_ahead: parseInt(import.meta.env.VITE_RESERVATION_DAYS_AHEAD, 10) || 365,
    cancellation_hours: parseInt(import.meta.env.VITE_CANCELLATION_HOURS, 10) || 24,
    session_timeout: APP_CONFIG.security.sessionTimeout,
    whatsapp_cutoff_hour: parseInt(import.meta.env.VITE_WHATSAPP_CUTOFF_HOUR, 10) || 17
  },
  intervals: {
    fast_update: parseInt(import.meta.env.VITE_UPDATE_INTERVAL_FAST, 10) || 30000,
    medium_update: parseInt(import.meta.env.VITE_UPDATE_INTERVAL_MEDIUM, 10) || 60000,
    slow_update: parseInt(import.meta.env.VITE_UPDATE_INTERVAL_SLOW, 10) || 300000,
    debounce_delay: APP_CONFIG.ui.debounceDelay
  },
  formats: {
    date: import.meta.env.VITE_DATE_FORMAT || 'DD/MM/YYYY',
    time: import.meta.env.VITE_TIME_FORMAT || 'HH:mm',
    currency: import.meta.env.VITE_DEFAULT_CURRENCY || 'USD',
    timezone: import.meta.env.VITE_TIMEZONE || 'America/Lima'
  },
  external_services: {
    google_maps_api: APP_CONFIG.external.googleMapsApiKey,
    avatars_service: APP_CONFIG.external.avatarServiceUrl,
    osm_tiles: APP_CONFIG.external.mapTileUrl
  }
};

export const useAppConfig = () => {
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Usar ref para prevenir múltiples inicializaciones (más estable que state)
  const hasInitializedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Prevenir ejecución múltiple con ref (más confiable que state)
    if (hasInitializedRef.current) {
      console.log('[useAppConfig] Ya inicializado, omitiendo...');
      return;
    }

    // Marcar como inicializado ANTES de la llamada async
    hasInitializedRef.current = true;
    mountedRef.current = true;

    const loadConfig = async () => {
      if (!mountedRef.current) return;

      try {
        setLoading(true);
        setError(null);

        // Obtener referencia al store fuera del render
        const modulesStore = useModulesConfigStore.getState();

        // Crear promesa con timeout para evitar que la app se quede colgada
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout al cargar configuración')), CONFIG_LOAD_TIMEOUT);
        });

        // Load both app settings and modules config in parallel con timeout
        const [settingsResponse] = await Promise.race([
          Promise.all([
            api.get('/config/settings'),
            modulesStore.loadModules() // Load all module configurations
          ]),
          timeoutPromise.then(() => { throw new Error('Timeout'); })
        ]);

        if (!mountedRef.current) return;

        if (settingsResponse?.data?.success) {
          setConfig(settingsResponse.data.data);
        } else {
          // Si no hay success, usar config por defecto (ya establecido)
          console.warn('[useAppConfig] Usando configuración por defecto');
        }
      } catch (err) {
        if (!mountedRef.current) return;
        console.error('[useAppConfig] Error loading app config:', err);
        // No establecer error para evitar bloquear la app - usar config por defecto
        console.warn('[useAppConfig] Continuando con configuración por defecto');
        // Solo mostrar error si es crítico
        if (err.message !== 'Timeout' && err.message !== 'Timeout al cargar configuración') {
          setError(err.message);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      mountedRef.current = false;
    };
  }, []); // ✅ Sin dependencias - solo se ejecuta una vez al montar

  const refreshConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener referencia al store fuera del render
      const modulesStore = useModulesConfigStore.getState();

      // Reload both app settings and modules config in parallel
      const [response] = await Promise.all([
        api.get('/config/settings'),
        modulesStore.loadModules()
      ]);

      if (response.data.success) {
        setConfig(response.data.data);
      }
    } catch (err) {
      console.error('Error refreshing config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for common config access
  const getContactInfo = () => config?.contact || defaultConfig.contact;
  const getApiConfig = () => config?.api || defaultConfig.api;
  const getFeatures = () => config?.features || defaultConfig.features;
  const getLimits = () => config?.limits || defaultConfig.limits;
  const getIntervals = () => config?.intervals || defaultConfig.intervals;
  const getFormats = () => config?.formats || defaultConfig.formats;
  const getExternalServices = () => config?.external_services || defaultConfig.external_services;

  // Specific helper functions
  const getWhatsappNumber = () => getContactInfo().whatsapp;
  const getEmergencyContacts = () => getContactInfo().emergency;
  const getMaxTourCapacity = () => getLimits().max_tour_capacity;
  const getSessionTimeout = () => getLimits().session_timeout;
  const getDebounceDelay = () => getIntervals().debounce_delay;
  const getUpdateInterval = (type = 'medium') => {
    const intervals = getIntervals();
    const key = `${type}_update`;
    return intervals[key] || intervals.medium_update;
  };

  return {
    config,
    loading,
    error,
    refreshConfig,
    // Helper functions
    getContactInfo,
    getApiConfig,
    getFeatures,
    getLimits,
    getIntervals,
    getFormats,
    getExternalServices,
    // Specific helpers
    getWhatsappNumber,
    getEmergencyContacts,
    getMaxTourCapacity,
    getSessionTimeout,
    getDebounceDelay,
    getUpdateInterval
  };
};