import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays
} from 'date-fns';
import useIndependentAgendaStore from '../stores/independentAgendaStore';
import useAuthStore from '../stores/authStore';
import { isAdminRole, filterEventsForAdmin, filterEventsByVisibility, isTourEvent, isPersonalEvent, isOccupiedEvent } from '../utils/eventHelpers';
import {
  EVENT_TYPES,
  CALENDAR_CONFIG,
  CALENDAR_VIEWS
} from '../constants/monthViewConstants';

const useMonthView = () => {
  const { user } = useAuthStore();
  const {
    selectedDate: rawSelectedDate,
    currentGuide,
    lastEventUpdate,
    visibleCalendars,
    actions: {
      getGuideCompleteAgenda,
      setSelectedDate,
      setCurrentView
    }
  } = useIndependentAgendaStore();

  // Validar selectedDate para evitar "Invalid time value"
  const selectedDate = React.useMemo(() => {
    if (!rawSelectedDate) return new Date();
    const dateObj = rawSelectedDate instanceof Date ? rawSelectedDate : new Date(rawSelectedDate);
    return isNaN(dateObj.getTime()) ? new Date() : dateObj;
  }, [rawSelectedDate]);

  const [monthEvents, setMonthEvents] = useState({});
  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const isAdmin = isAdminRole(user);

  // Memoizar fechas del calendario para evitar bucles infinitos en useEffect
  const { monthStart, monthEnd, startDate, endDate } = React.useMemo(() => {
    const mStart = startOfMonth(selectedDate);
    const mEnd = endOfMonth(mStart);
    const sDate = startOfWeek(mStart, { weekStartsOn: CALENDAR_CONFIG.WEEK_START_DAY });
    const eDate = endOfWeek(mEnd, { weekStartsOn: CALENDAR_CONFIG.WEEK_START_DAY });
    return { monthStart: mStart, monthEnd: mEnd, startDate: sDate, endDate: eDate };
  }, [selectedDate]);

  // Load month events
  useEffect(() => {
    const loadMonthEvents = async () => {
      const eventsData = {};
      let currentDate = startDate;

      // Initialize all days with empty data
      while (currentDate <= endDate) {
        const dateKey = format(currentDate, CALENDAR_CONFIG.DATE_FORMAT);
        eventsData[dateKey] = {
          events: [],
          availability: []
        };
        currentDate = addDays(currentDate, 1);
      }

      // Determinar qué guideId usar
      const targetGuideId = isAdmin ? currentGuide : user?.guideId;

      if (!targetGuideId) {
        setMonthEvents(eventsData);
        return;
      }

      try {
        const result = await getGuideCompleteAgenda(targetGuideId, {
          startDate: format(startDate, CALENDAR_CONFIG.DATE_FORMAT),
          endDate: format(endDate, CALENDAR_CONFIG.DATE_FORMAT)
        });
        // Backend returns { success, data: { allEvents } }
        const events = result?.data?.allEvents || result?.allEvents || [];

        // Si es admin, filtrar por visibilidad (enmascara privados como "Ocupado")
        const adminFiltered = isAdmin ? filterEventsForAdmin(events) : events;
        // Aplicar toggles del sidebar (Mi Agenda / Tours / Reservas)
        const processedEvents = filterEventsByVisibility(adminFiltered, visibleCalendars);

        // Group events by date
        processedEvents.forEach(event => {
          if (eventsData[event.date]) {
            eventsData[event.date].events.push(event);
          }
        });
      } catch {
        // Error loading events
      }

      setMonthEvents(eventsData);
    };

    loadMonthEvents();
  }, [selectedDate, currentGuide, user?.guideId, isAdmin, getGuideCompleteAgenda, startDate, endDate, lastEventUpdate, visibleCalendars]);

  const handleDateHover = (date, isHovering) => {
    if (isHovering) {
      setHoveredDate(format(date, CALENDAR_CONFIG.DATE_FORMAT));
    } else {
      setHoveredDate(null);
    }
  };

  const getDayEventIndicators = (date) => {
    const dateKey = format(date, CALENDAR_CONFIG.DATE_FORMAT);
    const dayData = monthEvents[dateKey] || { events: [], availability: [] };

    // Agrupar por categoría: contamos como "company tours" cualquier servicio
    // (reservación, tour asignado por admin, o solicitud del marketplace) para que
    // el badge mensual no se trague los eventos de tipo assigned_tour/marketplace_*.
    const personalEvents = dayData.events.filter(isPersonalEvent).length;
    const companyTours = dayData.events.filter(isTourEvent).length;
    const occupiedSlots = dayData.events.filter(isOccupiedEvent).length;
    const availableSlots = dayData.availability.length;

    return {
      personalEvents,
      companyTours,
      occupiedSlots,
      availableSlots,
      hasEvents: dayData.events.length > 0,
      hasAvailability: availableSlots > 0,
      totalEvents: dayData.events.length
    };
  };

  const handleEventBadgeClick = (date, eventType, event, onEventClick) => {
    event.preventDefault();
    event.stopPropagation();

    const dateKey = format(date, CALENDAR_CONFIG.DATE_FORMAT);
    const dayData = monthEvents[dateKey] || { events: [] };

    // Filtrar usando los mismos predicados que getDayEventIndicators para que
    // el click del badge muestre exactamente los eventos contados.
    let eventsOfType;
    if (eventType === EVENT_TYPES.COMPANY_TOUR) {
      eventsOfType = dayData.events.filter(isTourEvent);
    } else if (eventType === EVENT_TYPES.PERSONAL) {
      eventsOfType = dayData.events.filter(isPersonalEvent);
    } else if (eventType === EVENT_TYPES.OCCUPIED) {
      eventsOfType = dayData.events.filter(isOccupiedEvent);
    } else {
      eventsOfType = dayData.events.filter(e => e.type === eventType);
    }

    if (eventsOfType.length === 1 && onEventClick) {
      // If only one event, click it directly
      onEventClick(eventsOfType[0]);
    } else {
      // If multiple events, go to day view
      setSelectedDate(date);
      setCurrentView(CALENDAR_VIEWS.DAY);
    }
  };

  const totalEvents = Object.values(monthEvents).reduce((total, dayData) => 
    total + (dayData.events?.length || 0), 0
  );

  const availableDays = Object.values(monthEvents).filter(dayData => 
    (dayData.availability?.length || 0) > 0
  ).length;

  return {
    selectedDate,
    monthStart,
    monthEnd,
    startDate,
    endDate,
    monthEvents,
    hoveredDate,
    selectedEvent,
    isAdmin,
    totalEvents,
    availableDays,
    setSelectedDate,
    setCurrentView,
    setSelectedEvent,
    handleDateHover,
    getDayEventIndicators,
    handleEventBadgeClick
  };
};

export default useMonthView;