import { useState, useEffect, useMemo } from 'react';
import { format, isToday } from 'date-fns';
import useIndependentAgendaStore from '../stores/independentAgendaStore';
import useAuthStore from '../stores/authStore';
import { isAdminRole, filterEventsForAdmin } from '../utils/eventHelpers';

const useDayView = () => {
  const { user } = useAuthStore();
  const {
    selectedDate,
    currentGuide,
    lastEventUpdate,
    actions: { getGuideCompleteAgenda }
  } = useIndependentAgendaStore();

  const [dayEvents, setDayEvents] = useState([]);
  const [allDayEvents, setAllDayEvents] = useState([]);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const isAdmin = isAdminRole(user);
  const isCurrentDay = isToday(selectedDate);

  // Dynamic hours range: extends beyond 6-21 if events exist outside that window
  const hours = useMemo(() => {
    let minHour = 6;
    let maxHour = 21;
    dayEvents.forEach(event => {
      const sh = parseInt(event.startTime?.split(':')[0]);
      const eh = parseInt(event.endTime?.split(':')[0]);
      if (!isNaN(sh) && sh < minHour) minHour = sh;
      if (!isNaN(eh) && eh > maxHour) maxHour = eh;
    });
    return Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour);
  }, [dayEvents]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Load day events
  useEffect(() => {
    const loadEvents = async () => {
      // Determinar qué guideId usar
      const targetGuideId = isAdmin ? currentGuide : user?.guideId;

      if (!targetGuideId) {
        setDayEvents([]);
        setAllDayEvents([]);
        return;
      }

      try {
        const result = await getGuideCompleteAgenda(targetGuideId, {
          date: format(selectedDate, 'yyyy-MM-dd')
        });
        // Backend returns { success, data: { allEvents } }
        const events = result?.data?.allEvents || result?.allEvents || result?.events || [];

        // Si es admin, filtrar por visibilidad
        const processedEvents = isAdmin ? filterEventsForAdmin(events) : events;

        // Separate all-day events
        const allDay = processedEvents.filter(event => event.allDay);
        const timedEvents = processedEvents.filter(event => !event.allDay);

        setAllDayEvents(allDay);
        setDayEvents(timedEvents);
        setAvailabilityData(null);
      } catch {
        setDayEvents([]);
        setAllDayEvents([]);
      }
    };

    loadEvents();
  }, [selectedDate, currentGuide, user?.guideId, isAdmin, getGuideCompleteAgenda, lastEventUpdate]);

  const handleTimeSlotClick = (hour, minutes = 0, onTimeSlotClick) => {
    const clickDate = new Date(selectedDate);
    clickDate.setHours(hour, minutes, 0, 0);
    
    const timeString = format(clickDate, 'HH:mm');
    
    if (onTimeSlotClick) {
      onTimeSlotClick(selectedDate, timeString);
    }
  };

  const handleEventClick = (event, onEventClick) => {
    setSelectedEvent(event);
    
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const handleEventDoubleClick = (event, onEventEdit) => {
    if (onEventEdit) {
      onEventEdit(event);
    }
  };

  const handleSlotHover = (hour, isHovering) => {
    if (isHovering) {
      setHoveredSlot(hour);
    } else {
      setHoveredSlot(null);
    }
  };

  const handleDragOver = (e, hour) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(hour);
  };

  const handleDragLeave = (e) => {
    // Only clear if we really left the area
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggedOver(null);
    }
  };

  const handleDrop = (e, hour) => {
    e.preventDefault();
    setDraggedOver(null);
    setIsDragging(false);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { eventId, eventType, startTime, endTime } = dragData;
      
      // TODO: Integrate with store to move event

    } catch {
      // Error parsing drag data
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const getCurrentTimePosition = () => {
    if (!isCurrentDay) return null;

    const now = new Date();
    const h = now.getHours();
    const minutes = now.getMinutes();
    const firstHour = hours[0] ?? 6;
    const lastHour = hours[hours.length - 1] ?? 21;

    if (h < firstHour || h > lastHour + 1) return null;

    const hourIndex = h - firstHour;
    const minutePercent = minutes / 60;
    const position = (hourIndex + minutePercent) * 60; // 60px per hour

    return position;
  };

  const getEventsForHour = (hour) => {
    return dayEvents.filter(event => {
      const eventHour = parseInt(event.startTime?.split(':')[0] || '0');
      return eventHour === hour;
    });
  };

  return {
    // State
    dayEvents,
    allDayEvents,
    availabilityData,
    currentTime,
    hoveredSlot,
    selectedEvent,
    draggedOver,
    isDragging,
    isAdmin,
    isCurrentDay,
    hours,

    // Handlers
    handleTimeSlotClick,
    handleEventClick,
    handleEventDoubleClick,
    handleSlotHover,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnter,

    // Utils
    getCurrentTimePosition,
    getEventsForHour
  };
};

export default useDayView;