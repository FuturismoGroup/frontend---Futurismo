/**
 * COMPATIBILITY LAYER - Calendar
 *
 * Este archivo exporta valores por defecto para constantes de calendario.
 * Para acceder a valores dinámicos desde el backend, usa useCalendarConfig() en componentes React.
 *
 * ⚠️ TEMPORAL: Este archivo es parte de la capa de compatibilidad.
 * RECOMENDADO: Migrar a useCalendarConfig() para uso en componentes React.
 */

// Valores por defecto - se sobrescriben con valores del backend al usar hooks

export const VIEW_OPTIONS = [
  { value: 'month', labelKey: 'calendar.viewOptions.month' },
  { value: 'week', labelKey: 'calendar.viewOptions.week' },
  { value: 'day', labelKey: 'calendar.viewOptions.day' }
];

export const EVENT_TYPES = [];

export const EVENT_STATUS = [];

export const TIME_SLOTS = [];

export const DEFAULT_EVENT_DURATION = 60;

export const CALENDAR_COLORS = {
  tour: '#3B82F6',
  meeting: '#8B5CF6',
  training: '#10B981',
  maintenance: '#F59E0B',
  personal: '#6B7280',
  holiday: '#EF4444'
};

// Event status colors
export const EVENT_STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800'
};

// Days of week
export const DAYS_OF_WEEK = [
  { value: 0, labelKey: 'monthView.weekdaysFull.sunday', shortKey: 'monthView.weekdays.sun' },
  { value: 1, labelKey: 'monthView.weekdaysFull.monday', shortKey: 'monthView.weekdays.mon' },
  { value: 2, labelKey: 'monthView.weekdaysFull.tuesday', shortKey: 'monthView.weekdays.tue' },
  { value: 3, labelKey: 'monthView.weekdaysFull.wednesday', shortKey: 'monthView.weekdays.wed' },
  { value: 4, labelKey: 'monthView.weekdaysFull.thursday', shortKey: 'monthView.weekdays.thu' },
  { value: 5, labelKey: 'monthView.weekdaysFull.friday', shortKey: 'monthView.weekdays.fri' },
  { value: 6, labelKey: 'monthView.weekdaysFull.saturday', shortKey: 'monthView.weekdays.sat' }
];

// Time formats
export const TIME_FORMATS = {
  HOUR_12: 'h:mm a',
  HOUR_24: 'HH:mm',
  DATE: 'DD/MM/YYYY',
  DATE_TIME: 'DD/MM/YYYY HH:mm',
  MONTH_YEAR: 'MMMM YYYY'
};

// Calendar view modes
export const CALENDAR_VIEWS = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  AGENDA: 'agenda'
};

// Availability status
export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  TENTATIVE: 'tentative',
  OUT_OF_OFFICE: 'out_of_office'
};

// Calendar messages
export const getCalendarMessages = (t) => ({
  EVENT_CREATED: t('calendar.messages.eventCreated'),
  EVENT_UPDATED: t('calendar.messages.eventUpdated'),
  EVENT_DELETED: t('calendar.messages.eventDeleted'),
  EVENT_ERROR: t('calendar.messages.eventError'),
  CONFLICT_DETECTED: t('calendar.messages.conflictDetected'),
  FETCH_ERROR: t('calendar.messages.fetchError')
});

/** @deprecated Use getCalendarMessages(t) instead */
export const CALENDAR_MESSAGES = {
  EVENT_CREATED: 'calendar.messages.eventCreated',
  EVENT_UPDATED: 'calendar.messages.eventUpdated',
  EVENT_DELETED: 'calendar.messages.eventDeleted',
  EVENT_ERROR: 'calendar.messages.eventError',
  CONFLICT_DETECTED: 'calendar.messages.conflictDetected',
  FETCH_ERROR: 'calendar.messages.fetchError'
};

// Calendar filters
export const CALENDAR_FILTERS = {
  SHOW_TOURS: 'showTours',
  SHOW_MEETINGS: 'showMeetings',
  SHOW_TRAINING: 'showTraining',
  SHOW_MAINTENANCE: 'showMaintenance',
  SHOW_PERSONAL: 'showPersonal',
  SHOW_HOLIDAYS: 'showHolidays'
};

// Default calendar filters
export const DEFAULT_CALENDAR_FILTERS = {
  showTours: true,
  showMeetings: true,
  showTraining: true,
  showMaintenance: true,
  showPersonal: true,
  showHolidays: true
};

// Time filters
export const TIME_FILTERS = {
  ALL: 'all',
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  UPCOMING: 'upcoming',
  PAST: 'past'
};


// Export default para compatibilidad
export default {
  VIEW_OPTIONS,
  EVENT_TYPES,
  EVENT_STATUS,
  TIME_SLOTS,
  DEFAULT_EVENT_DURATION,
  CALENDAR_COLORS,
  EVENT_STATUS_COLORS,
  DAYS_OF_WEEK,
  TIME_FORMATS,
  CALENDAR_VIEWS,
  AVAILABILITY_STATUS,
  CALENDAR_MESSAGES,
  getCalendarMessages,
  CALENDAR_FILTERS,
  DEFAULT_CALENDAR_FILTERS,
  TIME_FILTERS
};
