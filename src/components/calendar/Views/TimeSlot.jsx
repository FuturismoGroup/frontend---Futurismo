import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PlusIcon } from '@heroicons/react/24/outline';

const TimeSlot = ({ 
  hour, 
  isHovered,
  isDraggedOver,
  isCurrentHour,
  onHover,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  children
}) => {
  const { t } = useTranslation();
  
  const getSlotClassName = () => {
    let className = "h-[60px] border-b border-gray-200 relative group transition-colors";
    
    if (isDraggedOver) {
      className += " bg-blue-50 border-blue-300";
    } else if (isHovered) {
      className += " bg-gray-50";
    }
    
    if (isCurrentHour) {
      className += " bg-blue-50/30";
    }
    
    return className;
  };
  
  return (
    <div
      className={getSlotClassName()}
      onMouseEnter={() => onHover(hour, true)}
      onMouseLeave={() => onHover(hour, false)}
      onDragOver={(e) => onDragOver(e, hour)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, hour)}
      onClick={() => onClick(hour)}
    >
      {/* Quick add button */}
      <button
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 z-20"
        onClick={(e) => {
          e.stopPropagation();
          onClick(hour);
        }}
        aria-label={t('calendar.addEventAt', { time: `${hour}:00` })}
      >
        <PlusIcon className="h-4 w-4 text-gray-500" />
      </button>
      
      {/* Events container */}
      <div className="relative h-full">
        {children}
      </div>
    </div>
  );
};

TimeSlot.propTypes = {
  hour: PropTypes.number.isRequired,
  isHovered: PropTypes.bool,
  isDraggedOver: PropTypes.bool,
  isCurrentHour: PropTypes.bool,
  onHover: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node
};

TimeSlot.defaultProps = {
  isHovered: false,
  isDraggedOver: false,
  isCurrentHour: false
};

export default TimeSlot;