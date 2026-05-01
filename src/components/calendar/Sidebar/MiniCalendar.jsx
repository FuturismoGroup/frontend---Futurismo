import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { es } from 'date-fns/locale';
import useIndependentAgendaStore from '../../../stores/independentAgendaStore';

const MiniCalendar = () => {
  const { t, i18n } = useTranslation();
  const { 
    selectedDate, 
    actions: { setSelectedDate } 
  } = useIndependentAgendaStore();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday as first day
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const navigateMonth = (direction) => {
    setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const renderCalendarDays = () => {
    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const formattedDate = format(currentDate, 'd');
      const isCurrentMonth = isSameMonth(currentDate, monthStart);
      const isSelected = isSameDay(currentDate, selectedDate);
      const isCurrentDay = isToday(currentDate);
      const dateToAdd = new Date(currentDate);

      days.push(
        <button
          key={currentDate.toString()}
          onClick={() => handleDateClick(dateToAdd)}
          className={`
            w-8 h-8 text-xs font-medium rounded-full transition-all duration-150 hover:bg-gray-100
            ${!isCurrentMonth 
              ? 'text-gray-300 hover:text-gray-400' 
              : 'text-gray-700 hover:text-gray-900'
            }
            ${isSelected 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : ''
            }
            ${isCurrentDay && !isSelected 
              ? 'bg-red-100 text-red-600 font-semibold' 
              : ''
            }
          `}
          aria-label={format(currentDate, 'EEEE, d MMMM yyyy', { locale: i18n.language === 'es' ? es : undefined })}
        >
          {formattedDate}
        </button>
      );

      currentDate = addDays(currentDate, 1);
    }

    return days;
  };

  const weekDays = t('calendar.miniCalendar.weekDays', { returnObjects: true });

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label={t('calendar.miniCalendar.previousMonth')}
        >
          <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
        </button>
        
        <h3 className="text-sm font-semibold text-gray-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: i18n.language === 'es' ? es : undefined })}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label={t('calendar.miniCalendar.nextMonth')}
        >
          <ChevronRightIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>

      {/* Event indicators */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">{t('calendar.miniCalendar.personal')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">{t('calendar.miniCalendar.tours')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;