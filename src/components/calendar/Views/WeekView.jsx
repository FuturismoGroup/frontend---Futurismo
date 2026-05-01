import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClockIcon } from '@heroicons/react/24/outline';
import useWeekView from '../../../hooks/useWeekView';
import EventBlock from '../EventComponents/EventBlock';
import WeekSlot from './WeekSlot';

const WeekView = ({ onTimeSlotClick, onDateClick, onEventClick, onEventEdit }) => {
  const { t, i18n } = useTranslation();
  const {
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
  } = useWeekView();

  const handleTimeSlotClick = (day, hour, minutes = 0) => {
    const clickDate = new Date(day);
    clickDate.setHours(hour, minutes, 0, 0);

    const timeString = format(clickDate, 'HH:mm');

    if (onTimeSlotClick) {
      onTimeSlotClick(day, timeString);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const handleEventDoubleClick = (event) => {
    if (onEventEdit) {
      onEventEdit(event);
    }
  };

  const getEventDurationPx = (event) => {
    if (!event.startTime || !event.endTime) return 56;
    const [sh, sm] = event.startTime.split(':').map(Number);
    const [eh, em] = event.endTime.split(':').map(Number);
    const durationHours = (eh + em / 60) - (sh + sm / 60);
    if (durationHours <= 0) return 56;
    return Math.max(24, Math.round(durationHours * 60) - 4); // 60px/hour minus padding
  };

  const renderEventsForDayAndHour = (day, hour) => {
    const hourEvents = getEventsForSlot(day, hour);
    const visibleEvents = hourEvents.slice(0, 1);
    const hiddenCount = Math.max(0, hourEvents.length - 1);

    return (
      <>
        {visibleEvents.map((event) => {
          const heightPx = getEventDurationPx(event);
          return (
            <div
              key={event.id}
              className="absolute inset-x-1 top-1 z-10"
              style={{
                height: `${heightPx}px`,
                minHeight: '24px'
              }}
            >
              <EventBlock
                event={event}
                isAdmin={isAdmin}
                isSelected={selectedEvent?.id === event.id}
                onClick={() => handleEventClick(event)}
                onDoubleClick={() => handleEventDoubleClick(event)}
                className="w-full h-full"
                showTooltip={true}
              />
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <div
            className="absolute top-1 right-1 text-xs text-gray-500 bg-white border border-gray-300 rounded px-1 shadow-sm z-20 cursor-pointer hover:bg-gray-100"
            style={{
              fontSize: '10px',
              lineHeight: '12px',
              height: '12px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to day view to see all events
              setSelectedEvent(null);
              if (onDateClick) onDateClick(day);
            }}
            title={t('calendar.weekView.moreEvents', { count: hiddenCount })}
          >
            +{hiddenCount}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Scrollable container for header + body (prevents scrollbar misalignment) */}
      <div className="flex-1 overflow-y-auto">
        {/* Week header - sticky inside scroll container */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex">
            {/* Space for hours column */}
            <div className="w-16 flex-shrink-0 border-r border-gray-200" />

            {/* Días */}
            {weekDays.map((day) => (
              <div
                key={day.toString()}
                className={`
                  flex-1 p-4 text-center border-r border-gray-200 last:border-r-0
                  ${isToday(day) ? 'bg-blue-50' : 'hover:bg-gray-50'}
                `}
              >
                <div className={`text-sm font-medium ${isToday(day) ? 'text-blue-600' : 'text-gray-500'}`}>
                  {format(day, 'EEE', { locale: i18n.language === 'es' ? es : undefined }).toUpperCase()}
                </div>
                <div className={`text-2xl font-semibold mt-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
                {isToday(day) && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* All-day events section */}
        {totalAllDayEvents > 0 && (
          <div className="sticky top-[88px] z-10 border-b border-gray-200 bg-gray-50">
            <div className="flex">
              {/* Label column */}
              <div className="w-16 flex-shrink-0 p-2 text-right border-r border-gray-200">
                <span className="text-xs text-gray-500 font-medium">
                  {t('calendar.allDay', 'Todo el día')}
                </span>
              </div>

              {/* All-day events for each day */}
              {weekDays.map((day) => {
                const dayAllDayEvents = getAllDayEventsForDay(day);
                return (
                  <div
                    key={`allday-${day.toString()}`}
                    className={`
                      flex-1 p-1 border-r border-gray-200 last:border-r-0 min-h-[40px]
                      ${isToday(day) ? 'bg-blue-50/50' : ''}
                    `}
                  >
                    {dayAllDayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        onDoubleClick={() => handleEventDoubleClick(event)}
                        className={`
                          text-xs px-2 py-1 mb-1 rounded cursor-pointer truncate
                          ${event.color ? '' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}
                          ${selectedEvent?.id === event.id ? 'ring-2 ring-blue-500' : ''}
                        `}
                        style={event.color ? { backgroundColor: `${event.color}20`, color: event.color } : {}}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week content */}
        <div className="relative">
          {/* Current time line */}
          {currentTimePosition !== null && todayColumn >= 0 && (
            <div
              className="absolute z-10 flex items-center pointer-events-none"
              style={{
                top: `${currentTimePosition}px`,
                left: `calc(64px + ${todayColumn} * (100% - 64px) / 7)`,
                width: `calc((100% - 64px) / 7)`
              }}
            >
              <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
              <div className="flex-1 h-0.5 bg-red-500"></div>
            </div>
          )}

          {/* Hours grid */}
          {hours.map((hour) => (
            <div key={hour} className="flex border-b border-gray-100 hover:bg-gray-50 group">
              {/* Hour column */}
              <div className="w-16 flex-shrink-0 p-2 text-right border-r border-gray-200">
                <span className="text-xs text-gray-500 font-medium">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>

              {/* Day columns */}
              {weekDays.map((day) => {
                const slotKey = `${format(day, 'yyyy-MM-dd')}-${hour}`;
                return (
                  <WeekSlot
                    key={day.toString()}
                    day={day}
                    hour={hour}
                    slotKey={slotKey}
                    hoveredSlot={hoveredSlot}
                    draggedOver={draggedOver}
                    isAdmin={isAdmin}
                    isOccupied={isSlotOccupied(day, hour)}
                    onSlotClick={handleTimeSlotClick}
                    onSlotHover={handleSlotHover}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {renderEventsForDayAndHour(day, hour)}
                  </WeekSlot>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer with information */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{t('calendar.weekView.weekOf', { date: format(weekStart, 'd MMM', { locale: i18n.language === 'es' ? es : undefined }) })}</span>
            <span>•</span>
            <span>
              {t('calendar.weekView.eventCount', { count: totalEvents })}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {todayColumn >= 0 && (
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-blue-500" />
                <span className="text-blue-600 font-medium">
                  {format(currentTime, 'HH:mm')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

WeekView.propTypes = {
  onTimeSlotClick: PropTypes.func,
  onDateClick: PropTypes.func,
  onEventClick: PropTypes.func,
  onEventEdit: PropTypes.func
};

export default WeekView;