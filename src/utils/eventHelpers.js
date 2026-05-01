import { EVENT_TYPES, VISIBILITY_LEVELS } from '../stores/independentAgendaStore';

/**
 * Verifica si el usuario tiene rol de administrador.
 * Centralizado para evitar inconsistencias entre vistas.
 */
export const isAdminRole = (user) => {
  return user?.role === 'admin' || user?.role === 'administrator';
};

/**
 * Filtra eventos para la vista del admin: enmascara eventos privados/personales
 * del guía como "Ocupado"/"Tiempo ocupado", manteniendo visibles tours asignados
 * y servicios marketplace.
 */
export const filterEventsForAdmin = (events) => {
  return events.map(event => {
    // Marketplace service requests - mostrar detalles al admin
    if (event.source === 'marketplace' || event.eventType === 'marketplace_service' || event.eventType === 'marketplace_pending') {
      return event;
    }
    // Tours asignados por empresa (assigned_tour) - mostrar todo
    if (event.eventType === 'assigned_tour' || event.type === 'assigned_tour') {
      return event;
    }
    // Tours asignados (company) - mostrar todo
    if (event.visibility === 'company' || event.source === 'assigned') {
      return event;
    }
    // Eventos privados que bloquean disponibilidad - mostrar como "Ocupado"
    if (event.visibility === 'occupied' || event.blocksAvailability) {
      return {
        ...event,
        title: 'Tiempo ocupado',
        description: null,
        isPrivate: true
      };
    }
    // Eventos personales del guía - mostrar como ocupado
    if (event.eventType === 'personal' || event.type === 'personal') {
      return {
        ...event,
        title: 'Ocupado',
        description: null,
        isPrivate: true
      };
    }
    // Por defecto, mostrar el evento
    return event;
  }).filter(Boolean);
};

export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return null;
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const diffMinutes = endMinutes - startMinutes;
  
  if (diffMinutes >= 60) {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  return `${diffMinutes}m`;
};

export const isEventInProgress = (event) => {
  if (!event.startTime || !event.endTime) return false;
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);
  
  // Only check if it's today
  if (event.date !== today) return false;
  
  return currentTime >= event.startTime && currentTime <= event.endTime;
};

export const getEventProgress = (event) => {
  if (!isEventInProgress(event)) return 0;
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  
  const [startHour, startMin] = event.startTime.split(':').map(Number);
  const [endHour, endMin] = event.endTime.split(':').map(Number);
  const [currentHour, currentMin] = currentTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const currentMinutes = currentHour * 60 + currentMin;
  
  const totalDuration = endMinutes - startMinutes;
  const elapsed = currentMinutes - startMinutes;
  
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
};

export const getEventTypeStyle = (type) => {
  const styles = {
    [EVENT_TYPES.PERSONAL]: {
      bg: 'bg-blue-100 border-blue-300',
      bgSolid: 'bg-blue-500',
      text: 'text-blue-800',
      textWhite: 'text-white',
      hover: 'hover:bg-blue-600',
      dot: 'bg-blue-500'
    },
    [EVENT_TYPES.COMPANY_TOUR]: {
      bg: 'bg-green-100 border-green-300',
      bgSolid: 'bg-green-500',
      text: 'text-green-800',
      textWhite: 'text-white',
      hover: 'hover:bg-green-600',
      dot: 'bg-green-500'
    },
    [EVENT_TYPES.OCCUPIED]: {
      bg: 'bg-gray-100 border-gray-300',
      bgSolid: 'bg-gray-500',
      text: 'text-gray-600',
      textWhite: 'text-white',
      hover: 'hover:bg-gray-600',
      dot: 'bg-gray-500'
    },
    marketplace_service: {
      bg: 'bg-purple-100 border-purple-300',
      bgSolid: 'bg-purple-500',
      text: 'text-purple-800',
      textWhite: 'text-white',
      hover: 'hover:bg-purple-600',
      dot: 'bg-purple-500'
    }
  };

  return styles[type] || styles[EVENT_TYPES.PERSONAL];
};

export const shouldShowEventDetails = (event, isAdmin) => {
  if (isAdmin && event.visibility === VISIBILITY_LEVELS.PRIVATE) {
    return false;
  }
  if (isAdmin && event.visibility === VISIBILITY_LEVELS.OCCUPIED) {
    return false;
  }
  return true;
};

export const getEventDisplayContent = (event, isAdmin, t) => {
  if (isAdmin && event.visibility === VISIBILITY_LEVELS.PRIVATE) {
    return null;
  }

  if (isAdmin && event.visibility === VISIBILITY_LEVELS.OCCUPIED) {
    return {
      title: t('calendar.occupied'),
      showDetails: false
    };
  }

  return {
    title: event.title || t('calendar.untitled'),
    showDetails: true
  };
};