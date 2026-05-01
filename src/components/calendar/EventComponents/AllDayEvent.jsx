import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { 
  CalendarDaysIcon, 
  LockClosedIcon, 
  BuildingOfficeIcon, 
  UserIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { VISIBILITY_LEVELS, EVENT_TYPES } from '../../../stores/independentAgendaStore';
import { getEventTypeStyle, getEventDisplayContent } from '../../../utils/eventHelpers';

const AllDayEvent = ({ 
  event, 
  onClick, 
  onDoubleClick,
  isAdmin = false,
  isSelected = false 
}) => {
  const { t } = useTranslation();
  
  if (!event) return null;

  const styles = getEventTypeStyle(event.type);
  const displayContent = getEventDisplayContent(event, isAdmin, t);
  
  if (!displayContent) return null;

  const iconMap = {
    [EVENT_TYPES.PERSONAL]: UserIcon,
    [EVENT_TYPES.COMPANY_TOUR]: BuildingOfficeIcon,
    [EVENT_TYPES.OCCUPIED]: LockClosedIcon
  };
  
  const IconComponent = iconMap[event.type] || CalendarDaysIcon;

  const getEventSubtitle = () => {
    const parts = [];

    // Add client info for tours
    if (event.type === EVENT_TYPES.COMPANY_TOUR && event.client) {
      parts.push(`${t('calendar.client')}: ${event.client}`);
    }

    // Add category if exists
    if (event.category) {
      parts.push(t(`calendar.categories.${event.category}`));
    }

    // Add brief description if no other info
    if (parts.length === 0 && event.description) {
      parts.push(event.description.slice(0, 50) + (event.description.length > 50 ? '...' : ''));
    }

    // Add status if relevant
    if (event.status && event.status !== 'confirmed') {
      parts.push(`(${t(`calendar.status.${event.status}`)})`);
    }

    return parts.join(' • ');
  };

  const subtitle = displayContent.showDetails ? getEventSubtitle() : t('calendar.notAvailable');

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(event);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    onDoubleClick?.(event);
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`
        ${styles.bgSolid} ${styles.textWhite} ${styles.hover}
        rounded-lg px-3 py-2 cursor-pointer transition-all duration-200
        hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
        flex items-center space-x-3 min-h-[40px]
        ${isSelected ? 'ring-2 ring-white ring-opacity-50 shadow-md' : ''}
      `}
    >
      {/* Event type icon */}
      <IconComponent className="w-4 h-4 flex-shrink-0" />
      
      {/* Event content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">
          {displayContent.title}
        </h4>
        
        {subtitle && (
          <p className="text-xs opacity-75 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Indicators */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* Location */}
        {displayContent.showDetails && event.location && (
          <div className="flex items-center space-x-1">
            <MapPinIcon className="w-3 h-3 opacity-75" />
            <span className="text-xs opacity-75 max-w-20 truncate">
              {event.location}
            </span>
          </div>
        )}

        {/* Event type indicators */}
        <div className="flex space-x-1">
          {event.visibility === VISIBILITY_LEVELS.PRIVATE && (
            <div 
              className="w-2 h-2 bg-white bg-opacity-50 rounded-full" 
              title={t('calendar.eventPrivate')}
            />
          )}
          
          {event.visibility === VISIBILITY_LEVELS.OCCUPIED && (
            <div 
              className="w-2 h-2 bg-white bg-opacity-50 rounded-full" 
              title={t('calendar.dayOccupied')}
            />
          )}
          
          {event.type === EVENT_TYPES.COMPANY_TOUR && (
            <div 
              className="w-2 h-2 bg-white bg-opacity-50 rounded-full" 
              title={t('calendar.companyTour')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

AllDayEvent.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    type: PropTypes.string,
    visibility: PropTypes.string,
    location: PropTypes.string,
    description: PropTypes.string,
    client: PropTypes.string,
    category: PropTypes.string,
    status: PropTypes.string
  }).isRequired,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  isAdmin: PropTypes.bool,
  isSelected: PropTypes.bool
};

export default AllDayEvent;