import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para manejar transiciones suaves en modales
 * @param {boolean} isOpen - Estado de apertura del modal
 * @param {Function} onClose - Función para cerrar el modal
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Funciones y refs para el modal
 */
const useModalTransitions = (isOpen, onClose, options = {}) => {
  const modalRef = useRef(null);
  const isClosingRef = useRef(false);
  
  const {
    closeOnEscape = true,
    closeOnOverlay = true,
    transitionDuration = 1000,
    animationType = 'scale'
  } = options;

  // Función para cerrar con animación
  const closeWithAnimation = () => {
    if (isClosingRef.current) return;
    
    isClosingRef.current = true;
    const modalElement = modalRef.current;
    
    if (modalElement) {
      // Añadir clase de cierre
      modalElement.classList.add('modal-closing');
      
      // Esperar a que termine la animación
      setTimeout(() => {
        isClosingRef.current = false;
        onClose();
      }, transitionDuration);
    } else {
      isClosingRef.current = false;
      onClose();
    }
  };

  // Manejar tecla Escape
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeWithAnimation();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape]);

  // Manejar clic en overlay
  const handleOverlayClick = (event) => {
    if (closeOnOverlay && event.target === event.currentTarget) {
      closeWithAnimation();
    }
  };

  // Manejar animaciones de entrada
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Reset closing state
      isClosingRef.current = false;
      
      // Asegurar que las clases de animación se apliquen
      setTimeout(() => {
        const modalElement = modalRef.current;
        if (modalElement) {
          modalElement.classList.remove('modal-closing');
          modalElement.classList.add('modal-entered');
        }
      }, 50);
    }
  }, [isOpen]);

  // Función para obtener las props del modal
  const getModalProps = () => ({
    ref: modalRef,
    onClick: handleOverlayClick
  });

  // Función para obtener las props del diálogo
  const getDialogProps = () => ({
    onClick: (e) => e.stopPropagation()
  });

  return {
    modalRef,
    closeWithAnimation,
    getModalProps,
    getDialogProps,
    isClosing: isClosingRef.current
  };
};

export default useModalTransitions;