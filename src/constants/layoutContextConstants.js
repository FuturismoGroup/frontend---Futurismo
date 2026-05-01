/**
 * Constants for LayoutContext
 */

// Breakpoints consistentes con Tailwind CSS
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280
};

// Valores por defecto del viewport
export const DEFAULT_VIEWPORT = {
  width: 1024,
  height: 768,
  isMobile: false,
  isTablet: false,
  isDesktop: true
};

// Delay para debounce del resize event (ms)
export const RESIZE_DEBOUNCE_DELAY = 150;