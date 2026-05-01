/**
 * Constantes de Monitoring
 * Valores estáticos para el módulo
 */

export const GUIDE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BUSY: 'busy',
  AVAILABLE: 'available',
  OFFLINE: 'offline',
  EMERGENCY: 'emergency'
};

export const TOUR_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PAUSED: 'paused'
};

export const TABS = {
  MAP: 'map',
  INFO: 'info',
  CHAT: 'chat',
  ACTIVITY: 'activity',
  STATS: 'stats'
};

export const SIGNAL_QUALITY = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  REGULAR: 'regular',
  POOR: 'poor'
};

export const BATTERY_LEVELS = {
  HIGH: 60,
  MEDIUM: 30,
  LOW: 15
};

export const PROGRESS_CIRCLE = {
  size: 32,
  cx: 32,
  cy: 32,
  r: 28,
  strokeWidth: 4
};

export const MAP_MOBILE_HEIGHT = '400px';

export const MAX_PHOTOS_PER_STOP = 5;

// Tour status colors
export const TOUR_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  paused: 'bg-orange-100 text-orange-800'
};

// Guide status colors
export const GUIDE_STATUS_COLORS = {
  available: 'bg-green-100 text-green-800',
  busy: 'bg-yellow-100 text-yellow-800',
  offline: 'bg-gray-100 text-gray-800',
  emergency: 'bg-red-100 text-red-800'
};

// Alert types
export const ALERT_TYPES = {
  DELAY: 'delay',
  EMERGENCY: 'emergency',
  LOCATION_LOST: 'location_lost',
  LOW_BATTERY: 'low_battery',
  INFO: 'info'
};

// Map settings
export const MAP_SETTINGS = {
  DEFAULT_ZOOM: 13,
  DEFAULT_CENTER: [-12.0464, -77.0428],
  UPDATE_INTERVAL: 30000,
  MARKER_COLORS: {
    guide: '#3B82F6',
    tourist: '#10B981',
    waypoint: '#F59E0B',
    emergency: '#EF4444'
  }
};

// Monitoring messages
export const getMonitoringMessages = (t) => ({
  FETCH_ERROR: t('monitoring.messages.fetchError'),
  UPDATE_SUCCESS: t('monitoring.messages.updateSuccess'),
  UPDATE_ERROR: t('monitoring.messages.updateError'),
  LOCATION_UPDATED: t('monitoring.messages.locationUpdated'),
  CONNECTION_LOST: t('monitoring.messages.connectionLost'),
  CONNECTION_RESTORED: t('monitoring.messages.connectionRestored')
});

/** @deprecated Use getMonitoringMessages(t) instead */
export const MONITORING_MESSAGES = {
  FETCH_ERROR: 'monitoring.messages.fetchError',
  UPDATE_SUCCESS: 'monitoring.messages.updateSuccess',
  UPDATE_ERROR: 'monitoring.messages.updateError',
  LOCATION_UPDATED: 'monitoring.messages.locationUpdated',
  CONNECTION_LOST: 'monitoring.messages.connectionLost',
  CONNECTION_RESTORED: 'monitoring.messages.connectionRestored'
};

// Export default para compatibilidad
export default {
  GUIDE_STATUS,
  TOUR_STATUS,
  TABS,
  SIGNAL_QUALITY,
  BATTERY_LEVELS,
  PROGRESS_CIRCLE,
  MAP_MOBILE_HEIGHT,
  MAX_PHOTOS_PER_STOP,
  TOUR_STATUS_COLORS,
  GUIDE_STATUS_COLORS,
  ALERT_TYPES,
  MAP_SETTINGS,
  MONITORING_MESSAGES,
  getMonitoringMessages
};
