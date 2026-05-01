import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { PlusIcon } from '@heroicons/react/24/outline';

const WeekSlot = ({
  day,
  hour,
  slotKey,
  hoveredSlot,
  draggedOver,
  isAdmin,
  isOccupied,
  onSlotClick,
  onSlotHover,
  onDragOver,
  onDragLeave,
  onDrop,
  children
}) => {
  const { t } = useTranslation();
  const dateKey = format(day, 'yyyy-MM-dd');
  const isHovered = hoveredSlot === slotKey;
  const isDraggedOver = draggedOver === slotKey;

  return (
    <div 
      className={`
        flex-1 h-[60px] border-r border-gray-200 last:border-r-0 cursor-pointer relative overflow-visible
        transition-colors
        ${isHovered ? 'bg-blue-50' : ''}
        ${isDraggedOver ? 'bg-green-50 border-green-300' : ''}
      `}
      onClick={() => onSlotClick(day, hour)}
      onMouseEnter={() => onSlotHover(day, hour, true)}
      onMouseLeave={() => onSlotHover(day, hour, false)}
      onDragOver={(e) => onDragOver(e, day, hour)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, day, hour)}
    >
      {/* Events content */}
      {children}

      {/* Hover to add event - only if no events */}
      {!isAdmin && !isOccupied && (
        <div className="absolute inset-1 border border-dashed border-blue-300 rounded bg-blue-50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
          <div className="flex items-center space-x-1 text-blue-600">
            <PlusIcon className="w-3 h-3" />
            <span className="text-xs font-medium">
              {String(hour).padStart(2, '0')}:00
            </span>
          </div>
        </div>
      )}

      {/* Availability indicator for admin */}
      {isAdmin && !isOccupied && (
        <div className="absolute inset-1 border border-dashed border-green-300 rounded bg-green-50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
          <span className="text-xs text-green-600 font-medium">
            {t('calendar.available')}
          </span>
        </div>
      )}

      {/* Drop zone indicator */}
      {isDraggedOver && (
        <div className="absolute inset-1 border-2 border-dashed border-green-400 rounded bg-green-100 bg-opacity-50 flex items-center justify-center">
          <div className="flex items-center space-x-1 text-green-600">
            <span className="text-xs font-medium">
              {t('calendar.weekView.moveHere')}
            </span>
          </div>
        </div>
      )}

      {/* Selected time indicator */}
      {isHovered && !isAdmin && (
        <div className="absolute left-0 top-0 w-1 h-full bg-blue-400 rounded-r-full opacity-75"></div>
      )}
    </div>
  );
};

WeekSlot.propTypes = {
  day: PropTypes.instanceOf(Date).isRequired,
  hour: PropTypes.number.isRequired,
  slotKey: PropTypes.string.isRequired,
  hoveredSlot: PropTypes.string,
  draggedOver: PropTypes.string,
  isAdmin: PropTypes.bool.isRequired,
  isOccupied: PropTypes.bool.isRequired,
  onSlotClick: PropTypes.func.isRequired,
  onSlotHover: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  children: PropTypes.node
};

export default WeekSlot;