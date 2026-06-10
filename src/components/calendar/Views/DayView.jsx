import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClockIcon } from '@heroicons/react/24/outline';

// Components
import EventBlock from '../EventComponents/EventBlock';
import AllDayEvent from '../EventComponents/AllDayEvent';
import TimeSlot from './TimeSlot';
import TimeLabel from './TimeLabel';
import CurrentTimeIndicator from './CurrentTimeIndicator';

// Hooks
import useDayView from '../../../hooks/useDayView';

const DayView = ({ onTimeSlotClick, onDateClick, onEventClick, onEventEdit }) => {
  const { t } = useTranslation();
  
  const {
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
    handleTimeSlotClick,
    handleEventClick,
    handleEventDoubleClick,
    handleSlotHover,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnter,
    getCurrentTimePosition,
    getEventsForHour
  } = useDayView();

  const renderEventsForHour = (hour) => {
    const hourEvents = getEventsForHour(hour);
    
    // Show only first 2 events if more than 3
    const visibleEvents = hourEvents.slice(0, 2);
    const hiddenCount = Math.max(0, hourEvents.length - 2);

    return (
      <>
        {visibleEvents.map((event, index) => (
          <EventBlock
            key={event.id}
            event={event}
            isAdmin={isAdmin}
            isSelected={selectedEvent?.id === event.id}
            onClick={() => handleEventClick(event, onEventClick)}
            onDoubleClick={() => handleEventDoubleClick(event, onEventEdit)}
            className="absolute inset-x-2 z-10"
            style={{
              top: `${2 + (index * 24)}px`,
              height: '22px',
              minHeight: '22px',
              maxHeight: '22px'
            }}
            showTooltip={true}
          />
        ))}
        {hiddenCount > 0 && (
          <div 
            className="absolute inset-x-2 z-10 flex items-center justify-center text-xs text-gray-500 bg-gray-100 border border-gray-300 rounded cursor-pointer hover:bg-gray-200"
            style={{
              top: `${2 + (visibleEvents.length * 24)}px`,
              height: '20px'
            }}
            onClick={() => console.log(t('calendar.showMore', { count: hiddenCount }))}
          >
            +{hiddenCount} {t('calendar.more')}
          </div>
        )}
      </>
    );
  };

  return (
    // `relative` es CRÍTICO: contiene el overlay `absolute inset-0` del
    // empty state. Sin esto, el overlay se posiciona contra el viewport
    // y captura clicks del menú lateral, dejando la página "congelada".
    <div className="relative h-full bg-white rounded-lg">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {t('calendar.allDayEvents')}
          </h3>
          <div className="space-y-2">
            {allDayEvents.map(event => (
              <AllDayEvent
                key={event.id}
                event={event}
                isAdmin={isAdmin}
                isSelected={selectedEvent?.id === event.id}
                onClick={() => handleEventClick(event, onEventClick)}
                onDoubleClick={() => handleEventDoubleClick(event, onEventEdit)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main calendar grid */}
      <div 
        className="flex-1 overflow-hidden"
        onDragEnter={handleDragEnter}
      >
        <div className="h-full overflow-y-auto">
          <div className="grid grid-cols-[60px,1fr] sm:grid-cols-[80px,1fr]">
            {/* Time labels column */}
            <div className="sticky left-0 bg-white z-10 border-r border-gray-200">
              {hours.map(hour => {
                const isCurrentHour = isCurrentDay && new Date().getHours() === hour;
                return (
                  <TimeLabel 
                    key={hour}
                    hour={hour}
                    isCurrentHour={isCurrentHour}
                  />
                );
              })}
            </div>

            {/* Time slots column */}
            <div className="relative">
              {/* Current time indicator */}
              <CurrentTimeIndicator 
                position={getCurrentTimePosition()}
                currentTime={currentTime}
              />

              {/* Hour slots */}
              {hours.map(hour => {
                const isCurrentHour = isCurrentDay && new Date().getHours() === hour;
                
                return (
                  <TimeSlot
                    key={hour}
                    hour={hour}
                    isHovered={hoveredSlot === hour}
                    isDraggedOver={draggedOver === hour}
                    isCurrentHour={isCurrentHour}
                    onHover={handleSlotHover}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={(h) => handleTimeSlotClick(h, 0, onTimeSlotClick)}
                  >
                    {renderEventsForHour(hour)}
                  </TimeSlot>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state — overlay decorativo: pointer-events-none para no
          interceptar clicks del grid de horas ni del menú lateral. */}
      {dayEvents.length === 0 && allDayEvents.length === 0 && !isAdmin && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-lg font-medium">{t('calendar.noEvents')}</p>
            <p className="text-sm mt-1">{t('calendar.clickToAdd')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

DayView.propTypes = {
  onTimeSlotClick: PropTypes.func,
  onDateClick: PropTypes.func,
  onEventClick: PropTypes.func,
  onEventEdit: PropTypes.func
};

export default DayView;