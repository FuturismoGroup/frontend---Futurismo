import { EVENT_TYPES, VISIBILITY_LEVELS } from '../stores/independentAgendaStore';

/**
 * Verifica si el usuario tiene rol de administrador.
 * Centralizado para evitar inconsistencias entre vistas.
 */
export const isAdminRole = (user) => {
  return user?.role === 'admin' || user?.role === 'administrator';
};

// Tipos de eventos agrupados por categoría visible en el calendario.
// El backend (getCompleteAgenda) devuelve varios tipos para "tours":
//   - company_tour      → reservaciones asignadas (reservations.guide_id)
//   - assigned_tour     → tours que el admin agendó vía /guides/:id/tours sin reserva formal
//   - marketplace_service / marketplace_pending → solicitudes del marketplace
// Antes la vista mensual sólo contaba 'company_tour', dejando fuera los otros.
const TOUR_TYPES = new Set(['company_tour', 'assigned_tour', 'marketplace_service', 'marketplace_pending']);
const PERSONAL_TYPES = new Set(['personal']);
const OCCUPIED_TYPES = new Set(['occupied']);

export const isTourEvent = (event) =>
  TOUR_TYPES.has(event?.type) || TOUR_TYPES.has(event?.eventType);

export const isPersonalEvent = (event) =>
  PERSONAL_TYPES.has(event?.type) || PERSONAL_TYPES.has(event?.eventType);

export const isOccupiedEvent = (event) =>
  OCCUPIED_TYPES.has(event?.type) ||
  OCCUPIED_TYPES.has(event?.eventType) ||
  event?.visibility === 'occupied';

/**
 * Filtra eventos por los toggles de visibilidad del sidebar
 * (Mi Agenda / Tours asignados / Reservas). `visibleCalendars` es un objeto
 * { personal, company, reservations } con booleans.
 * Si un toggle viene en `false`, los eventos de esa categoría se ocultan.
 */
export const filterEventsByVisibility = (events, visibleCalendars) => {
  if (!visibleCalendars || !Array.isArray(events)) return events || [];

  const personalOn = visibleCalendars.personal !== false;
  const companyOn = visibleCalendars.company !== false;
  const reservationsOn = visibleCalendars.reservations !== false;

  // Si todos están encendidos, no filtramos
  if (personalOn && companyOn && reservationsOn) return events;

  return events.filter(event => {
    const type = event.eventType || event.type;

    // El orden importa: estas reglas evaluan ANTES que la genérica de
    // `visibility === 'occupied'`, porque el backend marca assigned_tour y
    // marketplace_* con visibility='occupied' (bloquean la disponibilidad del
    // guía). Si dejáramos la regla de "Mi Agenda" arriba, esos eventos
    // caerían en `personalOn` y los toggles del sidebar no tendrían efecto.

    // "Tours asignados" (chip verde): TODO evento renderizado en verde.
    // EventBlock pinta tanto `assigned_tour` como `company_tour` en verde via
    // getEventTypeStyle, así que ambos deben caer bajo el toggle verde. De
    // lo contrario el chip morado ("Reservas") ocultaría eventos verdes y
    // viceversa — el "swap" que reportaron los guías freelance. Incluye:
    //   - assigned_tour → tour que el admin agendó manualmente vía
    //                     /guides/:id/tours (personal_events.event_type)
    //   - company_tour  → reservations.guide_id (booking formal de agencia
    //                     con guía asignado)
    if (type === 'assigned_tour' || type === 'company_tour') {
      return companyOn;
    }

    // "Reservas" (chip morado): solicitudes del marketplace, que EventBlock
    // pinta en morado (#8B5CF6 marketplace_service) o ámbar (#F59E0B
    // marketplace_pending). Son las "reservas" que llegan al guía por el
    // marketplace y son las únicas visualmente moradas en el calendario.
    if (
      type === 'marketplace_service' ||
      type === 'marketplace_pending' ||
      event.source === 'marketplace'
    ) {
      return reservationsOn;
    }

    // Eventos personales del guía u "ocupado" → calendario "Mi Agenda".
    // Incluye personal, occupied, day_off y cualquier otro evento con
    // visibility='occupied' que no haya sido capturado por las reglas de
    // arriba (assigned_tour, company_tour, marketplace_*).
    if (
      type === 'personal' ||
      type === 'occupied' ||
      type === 'day_off' ||
      event.visibility === 'occupied'
    ) {
      return personalOn;
    }

    // Cualquier otro tipo desconocido se respeta (no se oculta por accidente)
    return true;
  });
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
    },
    marketplace_pending: {
      bg: 'bg-amber-100 border-amber-300',
      bgSolid: 'bg-amber-500',
      text: 'text-amber-800',
      textWhite: 'text-white',
      hover: 'hover:bg-amber-600',
      dot: 'bg-amber-500'
    },
    assigned_tour: {
      bg: 'bg-green-100 border-green-300',
      bgSolid: 'bg-green-500',
      text: 'text-green-800',
      textWhite: 'text-white',
      hover: 'hover:bg-green-600',
      dot: 'bg-green-500'
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