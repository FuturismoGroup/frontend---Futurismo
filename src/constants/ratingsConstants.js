/**
 * Constantes de Ratings
 * Valores estáticos para el módulo
 */

export const FEEDBACK_TYPES = [
  { value: 'positive', labelKey: 'ratings.feedbackTypes.positive' },
  { value: 'negative', labelKey: 'ratings.feedbackTypes.negative' },
  { value: 'suggestion', labelKey: 'ratings.feedbackTypes.suggestion' }
];

export const RATING_STEPS = {
  RATING: 'rating',
  SUMMARY: 'summary'
};

export const UI_DELAYS = {
  toast: 3000,
  transition: 300,
  API_SIMULATION: 1000
};

// Tourist rating values
export const TOURIST_RATING_VALUES = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  POOR: 'poor'
};

// Rating icons (emojis)
export const RATING_ICONS = {
  EXCELLENT: '😊',
  GOOD: '👍',
  POOR: '☹️'
};

// Rating colors
export const RATING_COLORS = {
  EXCELLENT: {
    text: 'text-green-600',
    bg: 'bg-green-50',
    selected: 'bg-green-500 border-green-600 text-white'
  },
  GOOD: {
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    selected: 'bg-blue-500 border-blue-600 text-white'
  },
  POOR: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    selected: 'bg-red-500 border-red-600 text-white'
  }
};

// Rated by types
export const RATED_BY_TYPES = {
  AGENCY: 'agency',
  GUIDE: 'guide',
  ADMIN: 'admin',
  SYSTEM: 'system'
};

export const RATING_ASPECTS = [];

export const EVALUATION_CRITERIA = [];

// Export default para compatibilidad
export default {
  FEEDBACK_TYPES,
  RATING_STEPS,
  UI_DELAYS,
  TOURIST_RATING_VALUES,
  RATING_ICONS,
  RATING_COLORS,
  RATED_BY_TYPES,
  RATING_ASPECTS,
  EVALUATION_CRITERIA
};
