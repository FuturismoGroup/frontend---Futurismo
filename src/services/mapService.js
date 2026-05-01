import L from 'leaflet';
import { MAP_CONFIG, STATUS_COLORS } from '../utils/constants';

class MapService {
  constructor() {
    this.map = null;
    this.markers = new Map();
    this.routes = new Map();
    this.currentLocation = null;
    this.watchId = null;
  }

  // Inicializar mapa
  initializeMap(containerId, options = {}) {
    const defaultOptions = {
      center: MAP_CONFIG.DEFAULT_CENTER,
      zoom: MAP_CONFIG.DEFAULT_ZOOM,
      minZoom: MAP_CONFIG.MIN_ZOOM,
      maxZoom: MAP_CONFIG.MAX_ZOOM,
      zoomControl: true,
      attributionControl: true
    };

    this.map = L.map(containerId, { ...defaultOptions, ...options });

    // Agregar capa de tiles
    L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
      attribution: MAP_CONFIG.ATTRIBUTION,
      maxZoom: MAP_CONFIG.MAX_ZOOM
    }).addTo(this.map);

    // Configurar iconos personalizados
    this.setupCustomIcons();

    return this.map;
  }

  // Configurar iconos personalizados
  setupCustomIcons() {
    // Icono para guías
    this.guideIcon = L.divIcon({
      className: 'custom-guide-marker',
      html: `
        <div class="relative">
          <div class="absolute -inset-2 bg-blue-500 rounded-full animate-ping opacity-75"></div>
          <div class="relative bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });

    // Iconos para diferentes tipos de servicios
    this.serviceIcons = {
      transfer: this.createServiceIcon('🚌'),
      tour: this.createServiceIcon('🏛️'),
      package: this.createServiceIcon('📦'),
      custom: this.createServiceIcon('⭐')
    };

    // Icono para ubicación actual del usuario
    this.currentLocationIcon = L.divIcon({
      className: 'current-location-marker',
      html: `
        <div class="relative">
          <div class="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
          <div class="relative bg-green-500 border-2 border-white rounded-full w-4 h-4 shadow-lg"></div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }

  createServiceIcon(emoji) {
    return L.divIcon({
      className: 'custom-service-marker',
      html: `
        <div class="bg-white rounded-lg shadow-lg p-2 text-2xl">
          ${emoji}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  // Agregar marcador de guía
  addGuideMarker(guide, service) {
    const { id, name, currentLocation } = guide;
    
    if (!currentLocation) return;

    const marker = L.marker(
      [currentLocation.latitude, currentLocation.longitude],
      { icon: this.guideIcon }
    );

    // Configurar popup
    const popupContent = `
      <div class="p-3 min-w-[200px]">
        <h3 class="font-semibold text-lg">${name}</h3>
        <p class="text-sm text-gray-600 mt-1">Servicio: ${service.code}</p>
        <p class="text-sm text-gray-600">Estado: ${this.getStatusLabel(service.status)}</p>
        <div class="mt-2">
          <span class="inline-block px-2 py-1 text-xs font-medium rounded-full" 
                style="background-color: ${STATUS_COLORS[service.status]}20; color: ${STATUS_COLORS[service.status]}">
            ${this.getStatusLabel(service.status)}
          </span>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(this.map);

    this.markers.set(id, marker);

    return marker;
  }

  // Agregar marcador de servicio
  addServiceMarker(service) {
    const { id, type, destination, touristName, status } = service;
    
    if (!destination?.coordinates) return;

    const icon = this.serviceIcons[type] || this.serviceIcons.custom;
    
    const marker = L.marker(
      [destination.coordinates.latitude, destination.coordinates.longitude],
      { icon }
    );

    const popupContent = `
      <div class="p-3 min-w-[200px]">
        <h3 class="font-semibold text-lg">${destination.name}</h3>
        <p class="text-sm text-gray-600 mt-1">Turista: ${touristName}</p>
        <p class="text-sm text-gray-600">Código: ${service.code}</p>
        <div class="mt-2">
          <span class="inline-block px-2 py-1 text-xs font-medium rounded-full" 
                style="background-color: ${STATUS_COLORS[status]}20; color: ${STATUS_COLORS[status]}">
            ${this.getStatusLabel(status)}
          </span>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(this.map);

    this.markers.set(`service-${id}`, marker);

    return marker;
  }

  // Actualizar posición de marcador
  updateMarkerPosition(markerId, newPosition, animate = true) {
    const marker = this.markers.get(markerId);
    
    if (!marker) return;

    const newLatLng = L.latLng(newPosition.latitude, newPosition.longitude);

    if (animate) {
      // Animar el movimiento del marcador
      this.animateMarker(marker, newLatLng);
    } else {
      marker.setLatLng(newLatLng);
    }
  }

  // Animar marcador
  animateMarker(marker, newLatLng, duration = 1000) {
    const startLatLng = marker.getLatLng();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const lat = startLatLng.lat + (newLatLng.lat - startLatLng.lat) * progress;
      const lng = startLatLng.lng + (newLatLng.lng - startLatLng.lng) * progress;

      marker.setLatLng([lat, lng]);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Eliminar marcador
  removeMarker(markerId) {
    const marker = this.markers.get(markerId);
    
    if (marker) {
      marker.remove();
      this.markers.delete(markerId);
    }
  }

  // Dibujar ruta
  drawRoute(routeId, waypoints, options = {}) {
    const defaultOptions = {
      color: '#1E40AF',
      weight: 4,
      opacity: 0.7,
      smoothFactor: 1
    };

    const route = L.polyline(waypoints, { ...defaultOptions, ...options });
    route.addTo(this.map);

    this.routes.set(routeId, route);

    return route;
  }

  // Actualizar ruta
  updateRoute(routeId, waypoints) {
    const route = this.routes.get(routeId);
    
    if (route) {
      route.setLatLngs(waypoints);
    }
  }

  // Eliminar ruta
  removeRoute(routeId) {
    const route = this.routes.get(routeId);
    
    if (route) {
      route.remove();
      this.routes.delete(routeId);
    }
  }

  // Mostrar ubicación actual del usuario
  showCurrentLocation() {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (this.currentLocation) {
          this.currentLocation.setLatLng([latitude, longitude]);
        } else {
          this.currentLocation = L.marker(
            [latitude, longitude],
            { icon: this.currentLocationIcon }
          ).addTo(this.map);
        }

        this.map.setView([latitude, longitude], 15);
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  }

  // Seguir ubicación del usuario
  watchUserLocation(callback) {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        if (callback) {
          callback({ latitude, longitude, accuracy });
        }

        if (this.currentLocation) {
          this.currentLocation.setLatLng([latitude, longitude]);
        }
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  }

  // Detener seguimiento de ubicación
  stopWatchingLocation() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Centrar mapa en bounds
  fitBounds(padding = 50) {
    if (this.markers.size === 0) return;

    const bounds = L.latLngBounds([]);
    
    this.markers.forEach(marker => {
      bounds.extend(marker.getLatLng());
    });

    this.map.fitBounds(bounds, { padding: [padding, padding] });
  }

  // Obtener etiqueta de estado
  getStatusLabel(status) {
    const labels = {
      pending: 'Pendiente',
      on_way: 'En camino',
      in_service: 'En servicio',
      finished: 'Finalizado',
      cancelled: 'Cancelado'
    };

    return labels[status] || status;
  }

  // Limpiar mapa
  clearMap() {
    this.markers.forEach(marker => marker.remove());
    this.markers.clear();
    
    this.routes.forEach(route => route.remove());
    this.routes.clear();
    
    if (this.currentLocation) {
      this.currentLocation.remove();
      this.currentLocation = null;
    }
  }

  // Destruir mapa
  destroy() {
    this.clearMap();
    this.stopWatchingLocation();
    
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

// Exportar instancia única
const mapService = new MapService();

export default mapService;