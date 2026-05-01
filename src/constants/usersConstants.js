/**
 * Constantes de Users
 * Valores estáticos para el módulo
 */

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

export const USER_ROLES = {
  ADMINISTRATOR: 'administrator',
  AGENCY: 'agency',
  GUIDE: 'guide'
};

export const GUIDE_TYPES = {
  FREELANCE: 'FREELANCE',
  PLANT: 'AGENCY'  // Backend espera 'AGENCY' para guías de planta
};

// User status colors
export const USER_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  suspended: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800'
};

// User role colors
export const USER_ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-800',
  agency: 'bg-blue-100 text-blue-800',
  guide: 'bg-green-100 text-green-800',
  client: 'bg-yellow-100 text-yellow-800',
  driver: 'bg-orange-100 text-orange-800'
};

// Validation rules
export const USER_VALIDATIONS = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^9\d{8}$/,
  DNI_LENGTH: 8,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 3
};

// Default values
export const DEFAULT_VALUES = {
  TEMPORARY_PASSWORD: 'Temp123456',
  DEFAULT_AVATAR: 'https://ui-avatars.com/api/?name=User&background=3B82F6&color=fff',
  DEFAULT_ROLE: 'client',
  DEFAULT_STATUS: 'active'
};

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^9\d{8}$/,
  RUC: /^\d{11}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  DNI: /^\d{8}$/
};

// Form limits
export const FORM_LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  NAME_MIN: 2,
  NAME_MAX: 50,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 50,
  BIO_MAX: 500
};

// Date formats
export const DATE_FORMATS = {
  LOCALE: 'es-PE',
  DATE_TIME_FORMAT: { hour: '2-digit', minute: '2-digit' }
};

// Default permissions por rol
export const DEFAULT_PERMISSIONS = {
  admin: ['users.create', 'users.read', 'users.update', 'users.delete', 'tours.create', 'tours.read', 'tours.update', 'tours.delete', 'reservations.create', 'reservations.read', 'reservations.update', 'reservations.delete', 'reports.read', 'settings.update'],
  agency: ['tours.create', 'tours.read', 'tours.update', 'reservations.create', 'reservations.read', 'reservations.update', 'clients.create', 'clients.read', 'reports.read'],
  guide: ['tours.read', 'reservations.read', 'profile.update'],
  'guide-planta': ['tours.read', 'reservations.read', 'profile.update', 'availability.update'],
  'guide-freelance': ['tours.read', 'reservations.read', 'profile.update', 'availability.update', 'marketplace.read'],
  client: ['profile.update', 'reservations.read'],
  driver: ['tours.read', 'reservations.read', 'profile.update']
};

// Default preferences (preferencias por defecto del usuario)
export const DEFAULT_PREFERENCES = {
  language: 'es',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  theme: 'light',
  timezone: 'America/Lima'
};

// Export default para compatibilidad
export default {
  USER_STATUS,
  USER_ROLES,
  GUIDE_TYPES,
  USER_STATUS_COLORS,
  USER_ROLE_COLORS,
  USER_VALIDATIONS,
  DEFAULT_VALUES,
  VALIDATION_PATTERNS,
  FORM_LIMITS,
  DATE_FORMATS,
  DEFAULT_PERMISSIONS,
  DEFAULT_PREFERENCES
};
