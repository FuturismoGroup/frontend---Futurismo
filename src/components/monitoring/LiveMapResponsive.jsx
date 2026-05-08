import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPinIcon, UserGroupIcon, ClockIcon, ExclamationTriangleIcon, PlusIcon, MinusIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline';
import { useLayout } from '../../contexts/LayoutContext';
import PropTypes from 'prop-types';

const LiveMapResponsive = ({ services = [], loading = false, filters, onServiceSelect, focusServiceId }) => {
  const { t } = useTranslation();
  const { viewport, sidebarOpen } = useLayout();
  const [selectedService, setSelectedService] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  // Flag para forzar la re-corrida del useEffect de marcadores cuando el mapa
  // termina de inicializarse (caso: tab que se desmonta y remonta).
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const resizeTimeoutRef = useRef(null);
  const initialFitDoneRef = useRef(false);

  // Calcular altura dinámica según viewport
  const getMapHeight = () => {
    // El contenedor padre ya tiene altura, así que usamos 100%
    return '100%';
  };

  // Cargar Leaflet desde CDN
  useEffect(() => {
    // Verificar si Leaflet ya está cargado
    if (window.L) {
      console.log('✅ Leaflet ya está disponible, inicializando mapa...');
      // Pequeño delay para asegurar que el CSS está aplicado
      setTimeout(() => initializeMap(), 100);
      return;
    }

    let jsLoaded = false;

    // El CSS ya está en el index.html, solo necesitamos cargar el JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';

    script.onload = () => {
      console.log('✅ Leaflet JS cargado correctamente');

      // Fix para iconos por defecto de Leaflet
      if (window.L) {
        delete window.L.Icon.Default.prototype._getIconUrl;
        window.L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        jsLoaded = true;
        // Delay para asegurar que todo está listo
        setTimeout(() => {
          console.log('🗺️ Inicializando mapa Leaflet...');
          initializeMap();
        }, 200);
      }
    };

    script.onerror = () => {
      console.error('❌ Error al cargar Leaflet JS');
    };

    document.head.appendChild(script);

    return () => {
      // Limpiar al desmontar
      if (leafletMapRef.current) {
        console.log('🧹 Limpiando mapa...');
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      markersRef.current = {};
      setMapReady(false);
    };
  }, []);

  // Inicializar el mapa
  const initializeMap = () => {
    if (!mapRef.current) {
      console.error('❌ mapRef.current no existe');
      return;
    }

    if (leafletMapRef.current) {
      console.log('⚠️ Mapa ya inicializado, saltando...');
      return;
    }

    console.log('🗺️ Creando instancia del mapa Leaflet...');

    try {
      // Crear mapa con configuración responsive
      // Zona de operacion: Lima - Ica (Pisco como punto central)
      const map = window.L.map(mapRef.current, {
        center: [-13.7167, -76.2000], // Pisco - zona Lima-Ica
        zoom: viewport.isMobile ? 9 : 10,
        zoomControl: false, // Controles personalizados
        attributionControl: viewport.isDesktop,
        tap: true,
        touchZoom: true,
        dragging: true,
        doubleClickZoom: !viewport.isMobile,
        scrollWheelZoom: true
      });

      console.log('✅ Mapa creado exitosamente');

      // Agregar capa de mapa (tiles)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: viewport.isMobile ? 10 : 8
      }).addTo(map);

      console.log('✅ Capa de tiles agregada');

      leafletMapRef.current = map;
      // Permitir el ajuste inicial al fitBounds tras el remount.
      initialFitDoneRef.current = false;
      // Disparar el useEffect que pinta los marcadores (importante al remontar).
      setMapReady(true);

      // IMPORTANTE: Forzar redimensionamiento después de inicializar
      // Esto asegura que Leaflet calcule correctamente el tamaño del contenedor
      setTimeout(() => {
        if (map) {
          console.log('🔄 Invalidando tamaño del mapa (primera vez)...');
          map.invalidateSize();
        }
      }, 100);

      // Segundo invalidate para asegurar que se ajuste completamente
      setTimeout(() => {
        if (map) {
          console.log('🔄 Invalidando tamaño del mapa (segunda vez)...');
          map.invalidateSize({ animate: false });
        }
      }, 300);

      // Tercer invalidate para casos donde el contenedor tarda en renderizar
      setTimeout(() => {
        if (map) {
          console.log('🔄 Invalidando tamaño del mapa (tercera vez)...');
          map.invalidateSize({ animate: false });
        }
      }, 500);

      // Cuarto invalidate para roles como agencia que pueden tener layout diferente
      setTimeout(() => {
        if (map) {
          console.log('🔄 Invalidando tamaño del mapa (cuarta vez - final)...');
          map.invalidateSize({ animate: false });
        }
      }, 1000);

      // Log de servicios disponibles
      if (services.length === 0) {
        console.log('⚠️ No hay servicios activos para mostrar en el mapa');
      } else {
        console.log(`✅ ${services.length} servicios listos para el mapa`);
      }
    } catch (error) {
      console.error('❌ Error al inicializar el mapa:', error);
    }
  };

  // Manejar cambios en el sidebar - redimensionar mapa
  useEffect(() => {
    if (!leafletMapRef.current) return;

    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      leafletMapRef.current.invalidateSize({
        animate: true,
        duration: 0.25
      });
    }, 350);
  }, [sidebarOpen, viewport]);

  // Observador de redimensionamiento del contenedor
  useEffect(() => {
    if (!mapRef.current || !leafletMapRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [leafletMapRef.current]);

  // Actualizar marcadores en tiempo real cuando cambian los servicios activos.
  // Depende de `mapReady` para que se re-ejecute cuando el mapa termina de
  // inicializarse despues de un remount (tab Mapa <-> Mis Tours).
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !window.L) return;

    console.log('🗺️ Actualizando marcadores del mapa:', services.length, 'servicios');

    // Mostrar indicador de actualización
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 500);

    // Limpiar marcadores antiguos
    Object.values(markersRef.current).forEach(marker => {
      marker.remove();
    });
    markersRef.current = {};

    // Crear icono personalizado para servicios
    const createServiceIcon = (service) => {
      const statusColors = {
        'enroute': 'bg-green-500',
        'stopped': 'bg-yellow-500',
        'delayed': 'bg-red-500'
      };

      return window.L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative">
            <div class="absolute -top-1 -right-1 w-3 h-3 ${statusColors[service.status]} rounded-full animate-pulse"></div>
            <div class="bg-white rounded-full p-2 shadow-lg border-2 border-gray-200">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
    };

    // Agregar marcadores para cada servicio
    if (Array.isArray(services)) {
      services.forEach(service => {
      if (!service.currentLocation?.lat || !service.currentLocation?.lng) return;

      const marker = window.L.marker(
        [service.currentLocation.lat, service.currentLocation.lng],
        { icon: createServiceIcon(service) }
      ).addTo(leafletMapRef.current);

      // Popup responsive
      const popupContent = `
        <div class="${viewport.isMobile ? 'text-sm' : ''} p-2">
          <h3 class="font-bold text-gray-900">${service.tourName}</h3>
          <p class="text-gray-600 text-xs mt-1">
            <span class="inline-flex items-center">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              ${service.guideName}
            </span>
          </p>
          <p class="text-xs text-gray-500 mt-1">${service.tourists} turistas</p>
          <div class="mt-2 flex items-center justify-between">
            <span class="text-xs px-2 py-1 rounded-full ${
              service.status === 'enroute' ? 'bg-green-100 text-green-700' :
              service.status === 'stopped' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }">
              ${service.status === 'enroute' ? t('monitoring.comp.enRoute') :
                service.status === 'stopped' ? t('monitoring.comp.stopped') : t('monitoring.comp.delayed')}
            </span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: !viewport.isMobile,
        maxWidth: viewport.isMobile ? 200 : 300,
        className: 'custom-popup'
      });

      marker.on('click', () => {
        setSelectedService(service);
        if (onServiceSelect) {
          onServiceSelect(service);
        }
      });

      markersRef.current[service.id] = marker;
      });
    }

    // Auto-ajustar vista para mostrar todos los marcadores (solo la primera vez)
    if (leafletMapRef.current && leafletMapRef.current._loaded && !initialFitDoneRef.current) {
      const markerKeys = Object.keys(markersRef.current);
      if (markerKeys.length > 0) {
        const bounds = window.L.latLngBounds(
          markerKeys.map(k => markersRef.current[k].getLatLng())
        );
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        initialFitDoneRef.current = true;
      } else if (!Array.isArray(services) || services.length === 0) {
        // Sin servicios: centrar en Lima por defecto
        leafletMapRef.current.setView([-12.0464, -77.0428], viewport.isMobile ? 11 : 12);
      }
    }
  }, [services, viewport, mapReady]);

  // Centrar mapa en un servicio específico cuando cambia focusServiceId
  useEffect(() => {
    if (!mapReady || !focusServiceId || !leafletMapRef.current || !markersRef.current[focusServiceId]) return;
    const marker = markersRef.current[focusServiceId];
    const latLng = marker.getLatLng();
    leafletMapRef.current.setView(latLng, 15, { animate: true });
    marker.openPopup();
    // Buscar el servicio correspondiente y seleccionarlo
    const service = services.find(s => s.id === focusServiceId);
    if (service) setSelectedService(service);
  }, [focusServiceId, services, mapReady]);

  // Funciones de control
  const handleZoom = (direction) => {
    if (!leafletMapRef.current) return;
    const currentZoom = leafletMapRef.current.getZoom();
    leafletMapRef.current.setZoom(currentZoom + direction);
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation || !leafletMapRef.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Agregar marcador de ubicación
        window.L.marker([latitude, longitude], {
          icon: window.L.divIcon({
            className: 'user-location',
            html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
            iconSize: [16, 16]
          })
        }).addTo(leafletMapRef.current);

        leafletMapRef.current.setView([latitude, longitude], 14);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
      }
    );
  };

  return (
    <div className="relative w-full h-full" style={{ minHeight: '500px' }}>
      <div className="relative bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 h-full">
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: '500px' }} />

        {/* Indicador de actualización en tiempo real */}
        <div className="absolute top-4 left-4 z-[10]">
          <div className={`flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md transition-opacity ${isUpdating ? 'opacity-100' : 'opacity-70'}`}>
            <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-xs font-medium text-gray-700">
              {isUpdating ? t('monitoring.comp.updating') : t('monitoring.comp.live')}
            </span>
            <span className="text-xs text-gray-500">
              {Array.isArray(services) ? services.length : 0} servicios
            </span>
          </div>
        </div>

        {/* Controles personalizados para móvil */}
        <div className="absolute top-4 right-4 z-[10] flex flex-col gap-2">
          {/* Zoom */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => handleZoom(1)}
              className="p-2 hover:bg-gray-50 transition-colors touch-manipulation"
              aria-label={t('monitoring.comp.zoomIn')}
            >
              <PlusIcon className="w-5 h-5 text-gray-700" />
            </button>
            <div className="border-t border-gray-200" />
            <button
              onClick={() => handleZoom(-1)}
              className="p-2 hover:bg-gray-50 transition-colors touch-manipulation"
              aria-label={t('monitoring.comp.zoomOut')}
            >
              <MinusIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Mi ubicación */}
          <button
            onClick={handleLocateUser}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors touch-manipulation"
            aria-label={t('monitoring.comp.myLocation')}
          >
            <ViewfinderCircleIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Info panel para móvil */}
        {viewport.isMobile && selectedService && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[10]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedService.tourName}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedService.guideName}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="w-4 h-4" />
                    {selectedService.tourists}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {selectedService.startTime}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-[5]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600 font-medium">{t('monitoring.comp.loadingActiveServices')}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && (!Array.isArray(services) || services.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-[5]">
            <div className="text-center px-4">
              <MapPinIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">{t('monitoring.comp.noActiveTours')}</p>
              <p className="text-sm text-gray-400">{t('monitoring.comp.toursWillAppear')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

LiveMapResponsive.propTypes = {
  services: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  filters: PropTypes.object,
  onServiceSelect: PropTypes.func,
  focusServiceId: PropTypes.string
};

export default LiveMapResponsive;