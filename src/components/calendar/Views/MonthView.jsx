import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import useMonthView from '../../../hooks/useMonthView';
import MonthDay from './MonthDay';

const MonthView = ({ onTimeSlotClick, onDateClick, onEventClick, onEventEdit }) => {
  const { t, i18n } = useTranslation();
  const {
    monthStart,
    monthEnd,
    startDate,
    endDate,
    monthEvents,
    hoveredDate,
    selectedDate,
    isAdmin,
    totalEvents,
    availableDays,
    setSelectedDate,
    setCurrentView,
    handleDateHover,
    getDayEventIndicators,
    handleEventBadgeClick
  } = useMonthView();

  const handleDateClick = (date, event) => {
    if (onDateClick) {
      onDateClick(date);
    } else {
      setSelectedDate(date);
      setCurrentView('day');
    }
    
    if (event && (event.shiftKey || event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.stopPropagation();
      if (onTimeSlotClick) {
        onTimeSlotClick(date, '09:00');
      }
    }
  };

  const handleQuickAdd = (date, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (onTimeSlotClick) {
      onTimeSlotClick(date, '09:00');
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dateToAdd = new Date(currentDate);
      const indicators = getDayEventIndicators(currentDate);

      days.push(
        <MonthDay
          key={currentDate.toString()}
          date={dateToAdd}
          monthStart={monthStart}
          selectedDate={selectedDate}
          hoveredDate={hoveredDate}
          indicators={indicators}
          isAdmin={isAdmin}
          onDateClick={handleDateClick}
          onDateHover={handleDateHover}
          onQuickAdd={handleQuickAdd}
          onEventBadgeClick={(date, eventType, event) => handleEventBadgeClick(date, eventType, event, onEventClick)}
        />
      );

      currentDate = addDays(currentDate, 1);
    }

    return days;
  };

  const weekDays = t('calendar.monthView.weekDays', { returnObjects: true });

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header del mes */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 capitalize">
              {format(selectedDate, 'MMMM yyyy', { locale: i18n.language === 'es' ? es : undefined })}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isAdmin ? t('calendar.monthView.availabilityView') : t('calendar.monthView.monthlyView')}
              {isAdmin && (
                <span className="ml-2">• {t('calendar.monthView.availableDays', { count: availableDays })}</span>
              )}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-semibold text-gray-900">{totalEvents}</p>
            <p className="text-sm text-gray-500">{t('calendar.monthView.events')}</p>
          </div>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="flex-shrink-0 grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => (
          <div key={day} className="p-4 text-center border-r border-gray-200 last:border-r-0">
            <span className="text-sm font-medium text-gray-500">{day}</span>
          </div>
        ))}
      </div>

      {/* Grid del calendario */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-y-auto">
        {renderCalendarDays()}
      </div>

      {/* Footer con resumen */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{format(selectedDate, 'MMMM yyyy', { locale: i18n.language === 'es' ? es : undefined })}</span>
            <span>•</span>
            <span>{t('calendar.monthView.totalEvents', { count: totalEvents })}</span>
            {isAdmin && (
              <>
                <span>•</span>
                <span>{t('calendar.monthView.daysWithAvailability', { count: availableDays })}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-3 h-3 bg-blue-100 rounded" />
              <span>{t('calendar.eventTypes.personal')}</span>
              <div className="w-3 h-3 bg-green-100 rounded ml-2" />
              <span>{t('calendar.eventTypes.tours')}</span>
              <div className="w-3 h-3 bg-gray-100 rounded ml-2" />
              <span>{t('calendar.occupied')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

MonthView.propTypes = {
  onTimeSlotClick: PropTypes.func,
  onDateClick: PropTypes.func,
  onEventClick: PropTypes.func,
  onEventEdit: PropTypes.func
};

export default MonthView;