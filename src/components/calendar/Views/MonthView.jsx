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
      <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl lg:text-2xl font-semibold text-gray-900 capitalize truncate">
              {format(selectedDate, 'MMMM yyyy', { locale: i18n.language === 'es' ? es : undefined })}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">
              {isAdmin ? t('calendar.monthView.availabilityView') : t('calendar.monthView.monthlyView')}
              {isAdmin && (
                <span className="ml-1 sm:ml-2">• {t('calendar.monthView.availableDays', { count: availableDays })}</span>
              )}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{totalEvents}</p>
            <p className="text-[10px] sm:text-sm text-gray-500">{t('calendar.monthView.events')}</p>
          </div>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="flex-shrink-0 grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => (
          <div key={day} className="p-1.5 sm:p-3 lg:p-4 text-center border-r border-gray-200 last:border-r-0">
            <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-500">{day}</span>
          </div>
        ))}
      </div>

      {/* Grid del calendario */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-y-auto min-h-0">
        {renderCalendarDays()}
      </div>

      {/* Footer con resumen */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-gray-600 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-wrap">
            <span className="capitalize truncate">{format(selectedDate, 'MMM yyyy', { locale: i18n.language === 'es' ? es : undefined })}</span>
            <span className="hidden sm:inline">•</span>
            <span className="truncate">{t('calendar.monthView.totalEvents', { count: totalEvents })}</span>
            {isAdmin && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="truncate">{t('calendar.monthView.daysWithAvailability', { count: availableDays })}</span>
              </>
            )}
          </div>

          <div className="flex items-center">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-100 rounded" />
                <span>{t('calendar.eventTypes.personal')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-100 rounded" />
                <span>{t('calendar.eventTypes.tours')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-100 rounded" />
                <span>{t('calendar.occupied')}</span>
              </div>
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