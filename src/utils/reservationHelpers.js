import { STATUS_BADGE_COLORS, PAYMENT_BADGE_COLORS } from '../constants/reservationConstants';

// Mapeo de estados inglés -> español
const STATUS_MAP = {
  pending: 'pendiente',
  confirmed: 'confirmada',
  cancelled: 'cancelada',
  completed: 'completada'
};

const PAYMENT_MAP = {
  pending: 'pendiente',
  paid: 'pagado',
  refunded: 'reembolsado'
};

export const getStatusBadge = (status) => {
  // Intentar primero con el status original
  if (STATUS_BADGE_COLORS[status]) {
    return STATUS_BADGE_COLORS[status];
  }

  // Si está en inglés, convertir a español
  const spanishStatus = STATUS_MAP[status];
  if (spanishStatus && STATUS_BADGE_COLORS[spanishStatus]) {
    return STATUS_BADGE_COLORS[spanishStatus];
  }

  return STATUS_BADGE_COLORS.default;
};

export const getPaymentBadge = (status) => {
  // Intentar primero con el status original
  if (PAYMENT_BADGE_COLORS[status]) {
    return PAYMENT_BADGE_COLORS[status];
  }

  // Si está en inglés, convertir a español
  const spanishStatus = PAYMENT_MAP[status];
  if (spanishStatus && PAYMENT_BADGE_COLORS[spanishStatus]) {
    return PAYMENT_BADGE_COLORS[spanishStatus];
  }

  return PAYMENT_BADGE_COLORS.default;
};

export const canRateService = (reservation) => {
  // Aceptar tanto 'completada' como 'completed'
  return (reservation.status === 'completada' || reservation.status === 'completed') && !reservation.isRated;
};