import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import useIndependentAgendaStore from '../stores/independentAgendaStore';
import useAuthStore from '../stores/authStore';
import { isAdminRole, filterEventsForAdmin } from '../utils/eventHelpers';

const useWeekView = () => {
  const { user } = useAuthStore();
  const {
    selectedDate,
    currentGuide,
    lastEventUpdate,
    actions: { getGuideCompleteAgenda }
  } = useIndependentAgendaStore();

  const [weekEvents, setWeekEvents] = useState({});
  const [allDayEvents, setAllDayEvents] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);

  const isAdmin = isAdminRole(user);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday as first day
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Dynamic hours range: extends beyond 6-21 if events exist outside that window
  const hours = useMemo(() => {
    let minHour = 6;
    let maxHour = 21;
    Object.values(weekEvents).forEach(dayEvts => {
      dayEvts.forEach(event => {
        const sh = parseInt(event.startTime?.split(':')[0]);
        const eh = parseInt(event.endTime?.split(':')[0]);
        if (!isNaN(sh) && sh < minHour) minHour = sh;
        if (!isNaN(eh) && eh > maxHour) maxHour = eh;
      });
    });
    return Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour);
  }, [weekEvents]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Load week events
  useEffect(() => {
    const loadWeekEvents = async () => {
      const eventsData = {};
      const allDayData = {};
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);

      // Determinar qué guideId usar
      const targetGuideId = isAdmin ? currentGuide : user?.guideId;

      if (!targetGuideId) {
        setWeekEvents({});
        setAllDayEvents({});
        return;
      }

      try {
        const result = await getGuideCompleteAgenda(targetGuideId, {
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd')
        });
        // Backend returns { success, data: { allEvents } }
        const events = result?.data?.allEvents || result?.allEvents || [];

        // Si es admin, filtrar por visibilidad
        const processedEvents = isAdmin ? filterEventsForAdmin(events) : events;

        // Group events by date, separating all-day events
        processedEvents.forEach(event => {
          if (event.allDay) {
            // All-day events
            if (!allDayData[event.date]) {
              allDayData[event.date] = [];
            }
            allDayData[event.date].push(event);
          } else {
            // Timed events
            if (!eventsData[event.date]) {
              eventsData[event.date] = [];
            }
            eventsData[event.date].push(event);
          }
        });

        setAllDayEvents(allDayData);
      } catch {
        // Error loading events
        setAllDayEvents({});
      }

      setWeekEvents(eventsData);
    };

    loadWeekEvents();
  }, [selectedDate, currentGuide, user?.guideId, isAdmin, getGuideCompleteAgenda, lastEventUpdate]);

  const handleSlotHover = (day, hour, isHovering) => {
    if (isHovering) {
      setHoveredSlot(`${format(day, 'yyyy-MM-dd')}-${hour}`);
    } else {
      setHoveredSlot(null);
    }
  };

  // Drag & drop disabled for admin (read-only view of guide's schedule)
  const handleDragOver = (e) => {
    if (isAdmin) return;
    e.preventDefault();
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedOver(null);
  };

  const getCurrentTimePosition = () => {
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

  const getEventsForSlot = (day, hour) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEvents = weekEvents[dateKey] || [];
    
    // Only show events that START at this exact hour
    const hourEvents = dayEvents.filter(event => {
      const eventHour = parseInt(event.startTime?.split(':')[0] || '0');
      return eventHour === hour;
    });

    return hourEvents;
  };

  const isSlotOccupied = (day, hour) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEvents = weekEvents[dateKey] || [];
    
    return dayEvents.some(event => {
      const eventHour = parseInt(event.startTime?.split(':')[0] || '0');
      const endHour = parseInt(event.endTime?.split(':')[0] || '0');
      return eventHour <= hour && endHour > hour;
    });
  };

  const currentTimePosition = getCurrentTimePosition();
  const todayColumn = weekDays.findIndex(day => isToday(day));

  const totalEvents = Object.values(weekEvents).reduce((total, dayEvents) =>
    total + dayEvents.length, 0
  );

  const totalAllDayEvents = Object.values(allDayEvents).reduce((total, dayEvents) =>
    total + dayEvents.length, 0
  );

  const getAllDayEventsForDay = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return allDayEvents[dateKey] || [];
  };

  return {
    weekStart,
    weekDays,
    hours,
    weekEvents,
    allDayEvents,
    currentTime,
    hoveredSlot,
    selectedEvent,
    draggedOver,
    isAdmin,
    currentTimePosition,
    todayColumn,
    totalEvents,
    totalAllDayEvents,
    setSelectedEvent,
    handleSlotHover,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    getEventsForSlot,
    getAllDayEventsForDay,
    isSlotOccupied
  };
};

export default useWeekView;