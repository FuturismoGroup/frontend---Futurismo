/**
 * Utilidades para manejo de fechas en el frontend
 * Evita problemas de timezone al mostrar fechas
 */

/**
 * Formatea una fecha para mostrar, manejando correctamente el timezone
 * @param {string|Date} dateInput - Fecha en formato ISO o Date object
 * @param {object} options - Opciones de formato (year, month, day, etc.)
 * @returns {string} Fecha formateada
 */
export const formatDateSafe = (dateInput, options = {}) => {
  if (!dateInput) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  // Si es string, extraer la parte de fecha sin timezone
  if (typeof dateInput === 'string') {
    // Extraer YYYY-MM-DD del string (ignorar parte de hora/timezone)
    const dateOnly = dateInput.split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);

    // Crear fecha usando componentes locales (evita conversion UTC)
    const localDate = new Date(year, month - 1, day);

    return localDate.toLocaleDateString('es-ES', defaultOptions);
  }

  // Si es objeto Date, usar metodos UTC para evitar desfase de timezone
  // Los metodos locales (getDate) dependen del timezone del navegador
  // y pueden devolver el dia anterior para fechas de medianoche UTC
  if (dateInput instanceof Date) {
    const localDate = new Date(
      dateInput.getUTCFullYear(),
      dateInput.getUTCMonth(),
      dateInput.getUTCDate()
    );
    return localDate.toLocaleDateString('es-ES', defaultOptions);
  }

  return '';
};

/**
 * Convierte una fecha a formato YYYY-MM-DD sin problemas de timezone
 * @param {string|Date} dateInput
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const toDateString = (dateInput) => {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    // Si ya es string, extraer solo la parte de fecha
    return dateInput.split('T')[0];
  }

  if (dateInput instanceof Date) {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '';
};

/**
 * Parsea un string de fecha a Date sin desfase de timezone
 * @param {string} dateString - Fecha en formato YYYY-MM-DD o ISO
 * @returns {Date|null}
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return null;

  const dateOnly = String(dateString).split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Compara dos fechas ignorando la hora
 * @param {string|Date} date1
 * @param {string|Date} date2
 * @returns {boolean} true si son el mismo dia
 */
export const isSameDay = (date1, date2) => {
  return toDateString(date1) === toDateString(date2);
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD usando timezone local
 * @returns {string} Fecha actual en formato YYYY-MM-DD
 */
export const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formatea un timestamp (TIMESTAMPTZ) para mostrar fecha y hora en America/Lima
 * Maneja correctamente ISO strings con offset (-05:00) y UTC (Z)
 *
 * @param {string|Date} timestamp - ISO string o Date object
 * @param {object} options - Opciones de formato override
 * @returns {string} Fecha y hora formateada en zona horaria Lima
 *
 * Ejemplos:
 *   formatTimestampSafe("2026-02-22T22:30:00-05:00") → "22 feb 2026, 22:30"
 *   formatTimestampSafe("2026-02-23T03:30:00.000Z")  → "22 feb 2026, 22:30"
 */
export const formatTimestampSafe = (timestamp, options = {}) => {
  if (!timestamp) return '';

  const APP_TIMEZONE = 'America/Lima';

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const defaultOptions = {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  };

  return date.toLocaleString('es-PE', defaultOptions);
};

/**
 * Formatea solo la fecha de un timestamp en America/Lima (sin hora)
 * Util para mostrar la fecha de creacion/actualizacion sin hora
 *
 * @param {string|Date} timestamp - ISO string o Date object
 * @param {object} options - Opciones de formato override
 * @returns {string} Fecha formateada en zona horaria Lima
 */
export const formatDateFromTimestamp = (timestamp, options = {}) => {
  if (!timestamp) return '';

  const APP_TIMEZONE = 'America/Lima';

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const defaultOptions = {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return date.toLocaleDateString('es-PE', defaultOptions);
};

export default {
  formatDateSafe,
  toDateString,
  parseLocalDate,
  isSameDay,
  getTodayString,
  formatTimestampSafe,
  formatDateFromTimestamp
};
