/**
 * COMPATIBILITY LAYER - Marketplace
 *
 * Este archivo exporta valores por defecto para constantes del marketplace.
 * Para acceder a valores dinámicos desde el backend, usa useMarketplaceConfig() en componentes React.
 *
 * ⚠️ TEMPORAL: Este archivo es parte de la capa de compatibilidad.
 * RECOMENDADO: Migrar a useMarketplaceConfig() para uso en componentes React.
 */

// Valores por defecto - se sobrescriben con valores del backend al usar hooks

export const LANGUAGES = [];

export const SORT_OPTIONS = [
  { value: 'rating', labelKey: 'marketplace.sortOptions.rating' },
  { value: 'price', labelKey: 'marketplace.sortOptions.price' },
  { value: 'experience', labelKey: 'marketplace.sortOptions.experience' }
];

export const PRICE_RANGE_CONFIG = {
  min: { min: 0, max: 400, step: 10 },
  max: { min: 100, max: 500, step: 10 }
};

export const RATING_OPTIONS = [5, 4, 3];

export const WORK_ZONES = [];

// Work zone names mapping for display
export const WORK_ZONE_NAMES = {
  'centro-historico': 'marketplace.workZones.centroHistorico',
  'miraflores': 'marketplace.workZones.miraflores',
  'barranco': 'marketplace.workZones.barranco',
  'san-isidro': 'marketplace.workZones.sanIsidro',
  'callao': 'marketplace.workZones.callao',
  'cusco': 'marketplace.workZones.cusco',
  'arequipa': 'marketplace.workZones.arequipa',
  'lima-norte': 'marketplace.workZones.limaNorte',
  'lima-sur': 'marketplace.workZones.limaSur'
};

export const TOUR_TYPES = [];

export const GROUP_TYPES = [
  { value: 'individual', labelKey: 'marketplace.groupTypes.individual' },
  { value: 'small', labelKey: 'marketplace.groupTypes.small' },
  { value: 'medium', labelKey: 'marketplace.groupTypes.medium' },
  { value: 'large', labelKey: 'marketplace.groupTypes.large' }
];

// Default filters for marketplace search
export const DEFAULT_FILTERS = {
  languages: [],
  workZones: [],
  tourTypes: [],
  groupTypes: [],
  priceRange: { min: 0, max: 500 },
  minRating: 0,
  rating: 0,
  verified: false,
  instantBooking: false,
  availability: 'all'
};

// Filter sections expanded state
export const FILTER_SECTIONS = {
  languages: true,
  tourTypes: false,
  workZones: false,
  groupTypes: false,
  rating: false,
  price: false
};

// Marketplace view modes
export const MARKETPLACE_VIEWS = {
  GRID: 'grid',
  LIST: 'list',
  MAP: 'map'
};

// Request status values
export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Marketplace messages for toast notifications
export const getMarketplaceMessages = (t) => ({
  FETCH_ERROR: t('marketplace.messages.fetchError'),
  REQUEST_CREATED: t('marketplace.messages.requestCreated'),
  REQUEST_ERROR: t('marketplace.messages.requestError'),
  RESPONSE_SENT: t('marketplace.messages.responseSent'),
  RESPONSE_ERROR: t('marketplace.messages.responseError'),
  REVIEW_CREATED: t('marketplace.messages.reviewCreated'),
  REVIEW_ERROR: t('marketplace.messages.reviewError')
});

/** @deprecated Use getMarketplaceMessages(t) instead */
export const MARKETPLACE_MESSAGES = {
  FETCH_ERROR: 'marketplace.messages.fetchError',
  REQUEST_CREATED: 'marketplace.messages.requestCreated',
  REQUEST_ERROR: 'marketplace.messages.requestError',
  RESPONSE_SENT: 'marketplace.messages.responseSent',
  RESPONSE_ERROR: 'marketplace.messages.responseError',
  REVIEW_CREATED: 'marketplace.messages.reviewCreated',
  REVIEW_ERROR: 'marketplace.messages.reviewError'
};


// Export default para compatibilidad
export default {
  LANGUAGES,
  SORT_OPTIONS,
  PRICE_RANGE_CONFIG,
  RATING_OPTIONS,
  WORK_ZONES,
  WORK_ZONE_NAMES,
  TOUR_TYPES,
  GROUP_TYPES,
  DEFAULT_FILTERS,
  FILTER_SECTIONS,
  MARKETPLACE_VIEWS,
  REQUEST_STATUS,
  MARKETPLACE_MESSAGES,
  getMarketplaceMessages
};
