/**
 * Constantes de Reservation
 * Valores estáticos para el módulo
 */

// Badge colors for reservation status
export const STATUS_BADGE_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  completada: 'bg-blue-100 text-blue-800',
  en_proceso: 'bg-indigo-100 text-indigo-800',
  default: 'bg-gray-100 text-gray-800'
};

// Badge colors for payment status
export const PAYMENT_BADGE_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  pagado: 'bg-green-100 text-green-800',
  reembolsado: 'bg-purple-100 text-purple-800',
  default: 'bg-gray-100 text-gray-800'
};

// Pagination settings
export const PAGINATION = {
  DEFAULT_ITEMS_PER_PAGE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};
