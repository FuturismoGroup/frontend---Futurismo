/**
 * Constantes de MonthView
 * Valores estáticos para el módulo
 */

export const MONTH_VIEW_CONFIG = {};

export const HOVER_CONFIG = {};

export const EVENT_COLORS = {};

export const WEEKDAY_LABELS = [
  'monthView.weekdays.sun', 'monthView.weekdays.mon', 'monthView.weekdays.tue',
  'monthView.weekdays.wed', 'monthView.weekdays.thu', 'monthView.weekdays.fri',
  'monthView.weekdays.sat'
];

export const MONTH_LABELS = [
  'monthView.months.january', 'monthView.months.february', 'monthView.months.march',
  'monthView.months.april', 'monthView.months.may', 'monthView.months.june',
  'monthView.months.july', 'monthView.months.august', 'monthView.months.september',
  'monthView.months.october', 'monthView.months.november', 'monthView.months.december'
];

// Event types
export const EVENT_TYPES = {
  PERSONAL: 'personal',
  COMPANY_TOUR: 'company_tour',
  OCCUPIED: 'occupied',
  AVAILABLE: 'available',
  TOUR: 'tour',
  MEETING: 'meeting',
  TRAINING: 'training',
  MAINTENANCE: 'maintenance',
  HOLIDAY: 'holiday'
};

// Calendar configuration
export const CALENDAR_CONFIG = {
  WEEK_START_DAY: 0, // 0 = Sunday, 1 = Monday
  DATE_FORMAT: 'yyyy-MM-dd',
  DISPLAY_FORMAT: 'dd/MM/yyyy',
  MONTH_FORMAT: 'MMMM yyyy',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm'
};

// Calendar views
export const CALENDAR_VIEWS = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  AGENDA: 'agenda'
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  AGENCY: 'agency',
  GUIDE: 'guide',
  CLIENT: 'client',
  DRIVER: 'driver'
};

// Export default para compatibilidad
export default {
  MONTH_VIEW_CONFIG,
  HOVER_CONFIG,
  EVENT_COLORS,
  WEEKDAY_LABELS,
  MONTH_LABELS,
  EVENT_TYPES,
  CALENDAR_CONFIG,
  CALENDAR_VIEWS,
  USER_ROLES
};
