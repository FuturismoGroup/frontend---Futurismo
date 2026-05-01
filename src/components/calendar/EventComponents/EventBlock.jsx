import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { 
  ClockIcon, 
  LockClosedIcon, 
  BuildingOfficeIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';
import { VISIBILITY_LEVELS, EVENT_TYPES } from '../../../stores/independentAgendaStore';
import EventTooltip from './EventTooltip';
import { 
  getEventTypeStyle, 
  getEventDisplayContent,
  isEventInProgress,
  getEventProgress 
} from '../../../utils/eventHelpers';

const EventBlock = ({ 
  event, 
  isAdmin = false, 
  isSelected = false,
  onClick, 
  onDoubleClick,
  onEdit,
  onDelete,
  onView,
  className = '',
  draggable = true,
  showTooltip = true,
  style = {}
}) => {
  const { t } = useTranslation();
  
  if (!event) return null;
  
  // Validate event data to avoid date errors
  const validatedEvent = {
    ...event,
    date: event.date || new Date().toISOString().split('T')[0],
    createdAt: event.createdAt || new Date()
  };

  const styles = getEventTypeStyle(event.type);
  const displayContent = getEventDisplayContent(event, isAdmin, t);
  
  if (!displayContent) return null;

  const iconMap = {
    [EVENT_TYPES.PERSONAL]: UserIcon,
    [EVENT_TYPES.COMPANY_TOUR]: BuildingOfficeIcon,
    [EVENT_TYPES.OCCUPIED]: LockClosedIcon
  };
  
  const IconComponent = iconMap[event.type] || ClockIcon;

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(event);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    onDoubleClick?.(event);
  };

  const handleDragStart = (e) => {
    if (!draggable || isAdmin) return;
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
      eventId: event.id,
      eventType: event.type,
      startTime: event.startTime,
      endTime: event.endTime
    }));
    
    e.dataTransfer.effectAllowed = 'move';
  };

  const eventComponent = (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onDragStart={handleDragStart}
      draggable={draggable && !isAdmin}
      className={`
        ${styles.bg} ${styles.text} ${className}
        border rounded-md p-1 cursor-pointer transition-all duration-200
        hover:shadow-lg hover:z-30 active:scale-[0.98]
        relative overflow-hidden select-none text-xs
        ${isSelected ? 'ring-1 ring-blue-400 shadow-md' : ''}
        ${draggable && !isAdmin ? 'cursor-move' : 'cursor-pointer'}
      `}
      style={style}
      title={showTooltip ? t('calendar.hoverForDetails') : `${event.title} - ${t('calendar.doubleClickToEdit')}`}
    >
      {/* Compact event content */}
      <div className="flex items-start justify-between h-full">
        <div className="flex items-start space-x-1 flex-1 min-w-0">
          <IconComponent className="w-3 h-3 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            {/* Compact title */}
            <div className="font-medium text-xs truncate leading-tight">
              {displayContent.title}
            </div>
            
            {/* Compact time */}
            {event.startTime && event.endTime && (
              <div className="text-xs opacity-60 truncate leading-tight mt-0.5">
                {event.startTime}-{event.endTime}
              </div>
            )}
          </div>
        </div>

        {/* Type indicator */}
        <div className="flex-shrink-0 mt-0.5">
          {event.visibility === VISIBILITY_LEVELS.PRIVATE && (
            <div className="w-1 h-1 bg-blue-500 rounded-full" />
          )}
          {event.visibility === VISIBILITY_LEVELS.OCCUPIED && (
            <div className="w-1 h-1 bg-gray-500 rounded-full" />
          )}
          {event.type === EVENT_TYPES.COMPANY_TOUR && (
            <div className="w-1 h-1 bg-green-500 rounded-full" />
          )}
        </div>
      </div>

      {/* Progress line (if event is in progress) */}
      {isEventInProgress(event) && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-50 overflow-hidden">
          <div 
            className="h-full bg-current transition-all duration-1000"
            style={{ width: `${getEventProgress(event)}%` }}
          />
        </div>
      )}
    </div>
  );

  // If showTooltip is false, return the component directly
  if (!showTooltip) {
    return eventComponent;
  }

  // Wrap with tooltip
  return (
    <EventTooltip
      event={validatedEvent}
      isAdmin={isAdmin}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      position="top"
    >
      {eventComponent}
    </EventTooltip>
  );
};

EventBlock.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    type: PropTypes.string,
    visibility: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    date: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }).isRequired,
  isAdmin: PropTypes.bool,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  className: PropTypes.string,
  draggable: PropTypes.bool,
  showTooltip: PropTypes.bool,
  style: PropTypes.object
};

export default EventBlock;