/**
 * Helper functions for layout management
 */

import { BREAKPOINTS } from '../constants/layoutContextConstants';

/**
 * Determina el tipo de dispositivo basado en el ancho de la ventana
 * @param {number} width - Ancho de la ventana en píxeles
 * @returns {Object} Objeto con flags de tipo de dispositivo
 */
export const getDeviceType = (width) => ({
  isMobile: width < BREAKPOINTS.TABLET,
  isTablet: width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.DESKTOP,
  isDesktop: width >= BREAKPOINTS.DESKTOP,
  // isCompact: dispositivos que deben usar sidebar overlay (mobile + tablet)
  isCompact: width < BREAKPOINTS.DESKTOP,
  // isSmall: pantallas muy pequeñas (< 640px)
  isSmall: width < BREAKPOINTS.MOBILE
});

/**
 * Obtiene las dimensiones actuales del viewport
 * @returns {Object} Objeto con dimensiones y tipo de dispositivo
 */
export const getViewportDimensions = () => {
  if (typeof window === 'undefined') {
    return {
      width: BREAKPOINTS.DESKTOP,
      height: 768,
      ...getDeviceType(BREAKPOINTS.DESKTOP)
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    width,
    height,
    ...getDeviceType(width)
  };
};

/**
 * Función debounce para optimizar eventos frecuentes
 * @param {Function} func - Función a ejecutar
 * @param {number} delay - Delay en milisegundos
 * @returns {Function} Función con debounce
 */
export const debounce = (func, delay) => {
  let timeoutId;
  
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Maneja el bloqueo/desbloqueo del scroll del body
 * @param {boolean} shouldLock - Si se debe bloquear el scroll
 */
export const toggleBodyScroll = (shouldLock) => {
  if (typeof document === 'undefined') return;

  document.body.style.overflow = shouldLock ? 'hidden' : 'unset';
};