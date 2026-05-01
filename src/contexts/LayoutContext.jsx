import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  BREAKPOINTS, 
  DEFAULT_VIEWPORT, 
  RESIZE_DEBOUNCE_DELAY 
} from '../constants/layoutContextConstants';
import { 
  getViewportDimensions, 
  debounce, 
  toggleBodyScroll 
} from '../utils/layoutHelpers';

const LayoutContext = createContext();

/**
 * Hook personalizado para acceder al contexto de layout
 * @returns {Object} Valores y funciones del contexto
 */
export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout debe ser usado dentro de LayoutProvider');
  }
  return context;
};

/**
 * Provider del contexto de layout
 * Maneja el estado del sidebar y las dimensiones del viewport
 */
export const LayoutProvider = ({ children }) => {
  const [viewport, setViewport] = useState(() => {
    // Inicialización lazy para evitar cálculos innecesarios
    return typeof window !== 'undefined' 
      ? getViewportDimensions() 
      : DEFAULT_VIEWPORT;
  });
  
  // Sidebar abierto por defecto en desktop, cerrado en mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  });

  // Memoizar funciones para evitar re-renders innecesarios
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  // Función optimizada con debounce para manejar el resize
  const handleResize = useMemo(
    () => debounce(() => {
      setViewport(getViewportDimensions());
    }, RESIZE_DEBOUNCE_DELAY),
    []
  );

  // Detectar cambios en el viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Establecer dimensiones iniciales
    setViewport(getViewportDimensions());

    // Agregar listener con opción passive para mejor performance
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel?.(); // Cancelar debounce pendiente si existe
    };
  }, [handleResize]);

  // Auto-cerrar sidebar cuando se cambia de móvil a desktop
  useEffect(() => {
    // Solo cerrar si estamos cambiando DE móvil A desktop
    if (!viewport.isMobile && sidebarOpen) {
      // Mantener abierto en desktop si ya estaba abierto
    }
  }, [viewport.isMobile]);

  // Prevenir scroll cuando sidebar está abierto en móvil
  useEffect(() => {
    if (viewport.isMobile && sidebarOpen) {
      toggleBodyScroll(true);
      
      return () => {
        toggleBodyScroll(false);
      };
    }
  }, [viewport.isMobile, sidebarOpen]);

  // Memoizar el valor del contexto para evitar re-renders
  const contextValue = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      closeSidebar,
      openSidebar,
      viewport,
      breakpoints: BREAKPOINTS
    }),
    [sidebarOpen, viewport, toggleSidebar, closeSidebar, openSidebar]
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

LayoutProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Exportar el contexto para casos de uso avanzados
export default LayoutContext;