import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { PlusIcon } from '@heroicons/react/24/outline';

const MonthDay = ({ 
  date, 
  monthStart, 
  selectedDate, 
  hoveredDate,
  indicators, 
  isAdmin,
  onDateClick,
  onDateHover,
  onQuickAdd,
  onEventBadgeClick 
}) => {
  const { t } = useTranslation();
  const isCurrentMonth = isSameMonth(date, monthStart);
  const isSelected = isSameDay(date, selectedDate);
  const isCurrentDay = isToday(date);
  const dateKey = format(date, 'yyyy-MM-dd');
  const isHovered = hoveredDate === dateKey;

  return (
    <div
      onClick={(e) => onDateClick(date, e)}
      onMouseEnter={() => onDateHover(date, true)}
      onMouseLeave={() => onDateHover(date, false)}
      className={`
        relative h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer overflow-hidden
        transition-all duration-200 hover:bg-gray-50 group
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white text-gray-900'}
        ${isSelected ? 'bg-blue-50 border-blue-300' : ''}
        ${isCurrentDay ? 'ring-2 ring-blue-500 ring-inset' : ''}
        ${isHovered ? 'bg-blue-25 shadow-sm' : ''}
      `}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-2">
        <span className={`
          text-sm font-medium
          ${isCurrentDay ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs' : ''}
          ${isSelected && !isCurrentDay ? 'text-blue-600 font-semibold' : ''}
        `}>
          {format(date, 'd')}
        </span>

        {/* Availability indicator for admin */}
        {isAdmin && indicators.hasAvailability && (
          <div className="w-2 h-2 bg-green-400 rounded-full" title={t('calendar.available')} />
        )}
      </div>

      {/* Event indicators - fixed height */}
      <div className="h-[60px] space-y-1 overflow-hidden">
        {/* Personal events */}
        {indicators.personalEvents > 0 && (
          <div 
            onClick={(e) => onEventBadgeClick(date, 'personal', e)}
            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate hover:bg-blue-200 cursor-pointer transition-colors block"
            title={t('calendar.clickToViewPersonalEvents')}
          >
            {indicators.personalEvents === 1 ? t('calendar.onePersonalEvent') : t('calendar.personalEventCount', { count: indicators.personalEvents })}
          </div>
        )}

        {/* Company tours */}
        {indicators.companyTours > 0 && (
          <div 
            onClick={(e) => onEventBadgeClick(date, 'company_tour', e)}
            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded truncate hover:bg-green-200 cursor-pointer transition-colors block"
            title={t('calendar.clickToViewCompanyTours')}
          >
            {indicators.companyTours === 1 ? t('calendar.oneTour') : t('calendar.tourCount', { count: indicators.companyTours })}
          </div>
        )}

        {/* Occupied time */}
        {indicators.occupiedSlots > 0 && (
          <div 
            onClick={(e) => onEventBadgeClick(date, 'occupied', e)}
            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded truncate hover:bg-gray-200 cursor-pointer transition-colors block"
            title={t('calendar.clickToViewOccupiedTime')}
          >
            {t('calendar.occupied')}
          </div>
        )}

        {/* Availability (for admin) */}
        {isAdmin && indicators.hasAvailability && (
          <div className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded truncate border border-green-200 block">
            {t('calendar.available')}
          </div>
        )}

        {/* More events indicator if cut off */}
        {(indicators.personalEvents + indicators.companyTours + (indicators.occupiedSlots > 0 ? 1 : 0)) > 3 && (
          <div className="text-xs text-gray-500 px-2 py-1 italic">
            {t('calendar.showMore', { count: (indicators.personalEvents + indicators.companyTours + (indicators.occupiedSlots > 0 ? 1 : 0)) - 2 })}
          </div>
        )}
      </div>

      {/* Add button (hover) */}
      {!isAdmin && isCurrentMonth && (
        <div 
          onClick={(e) => onQuickAdd(date, e)}
          className="absolute inset-2 border-2 border-dashed border-blue-300 rounded bg-blue-50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer hover:bg-blue-100"
          title={t('calendar.ctrlClickToAddEvent')}
        >
          <div className="flex items-center space-x-1 text-blue-600">
            <PlusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{t('calendar.addEvent')}</span>
          </div>
        </div>
      )}

      {/* Admin available day indicator */}
      {isAdmin && isCurrentMonth && indicators.hasAvailability && (
        <div className="absolute inset-2 border-2 border-dashed border-green-300 rounded bg-green-50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
          <div className="flex items-center space-x-1 text-green-600">
            <span className="text-sm font-medium">{t('calendar.assignTour')}</span>
          </div>
        </div>
      )}

      {/* Active hover indicator */}
      {isHovered && (
        <div className="absolute top-1 left-1 w-1 h-8 bg-blue-400 rounded-r-full opacity-75"></div>
      )}

      {/* Selected day indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
      )}
    </div>
  );
};

MonthDay.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  monthStart: PropTypes.instanceOf(Date).isRequired,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  hoveredDate: PropTypes.string,
  indicators: PropTypes.shape({
    personalEvents: PropTypes.number,
    companyTours: PropTypes.number,
    occupiedSlots: PropTypes.number,
    availableSlots: PropTypes.number,
    hasEvents: PropTypes.bool,
    hasAvailability: PropTypes.bool
  }).isRequired,
  isAdmin: PropTypes.bool.isRequired,
  onDateClick: PropTypes.func.isRequired,
  onDateHover: PropTypes.func.isRequired,
  onQuickAdd: PropTypes.func.isRequired,
  onEventBadgeClick: PropTypes.func.isRequired
};

export default MonthDay;