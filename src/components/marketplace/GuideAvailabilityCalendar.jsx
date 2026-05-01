import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import PropTypes from 'prop-types';
import api from '../../services/api';

const GuideAvailabilityCalendar = ({ guideId, selectedDate, onDateSelect }) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workingHours, setWorkingHours] = useState({});
  const [personalEvents, setPersonalEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const monthNames = [
    t('marketplace.comp.months.january'), t('marketplace.comp.months.february'), t('marketplace.comp.months.march'),
    t('marketplace.comp.months.april'), t('marketplace.comp.months.may'), t('marketplace.comp.months.june'),
    t('marketplace.comp.months.july'), t('marketplace.comp.months.august'), t('marketplace.comp.months.september'),
    t('marketplace.comp.months.october'), t('marketplace.comp.months.november'), t('marketplace.comp.months.december')
  ];

  const dayNames = [
    t('marketplace.comp.days.sun'), t('marketplace.comp.days.mon'), t('marketplace.comp.days.tue'),
    t('marketplace.comp.days.wed'), t('marketplace.comp.days.thu'), t('marketplace.comp.days.fri'),
    t('marketplace.comp.days.sat')
  ];

  const dayOfWeekToKey = {
    0: 'domingo',
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sabado'
  };

  useEffect(() => {
    if (guideId) {
      fetchWorkingHours();
    }
  }, [guideId]);

  // Fetch personal events when month changes
  useEffect(() => {
    if (guideId) {
      fetchPersonalEvents();
    }
  }, [guideId, currentMonth]);

  const fetchWorkingHours = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/guides/${guideId}/working-hours`);
      const data = response.data?.data || response.data;
      const hoursMap = {};
      if (Array.isArray(data)) {
        data.forEach((day) => {
          hoursMap[day.dayName || day.day_name || ''] = day;
        });
      } else if (data && typeof data === 'object') {
        Object.entries(data).forEach(([key, val]) => {
          hoursMap[key] = val;
        });
      }
      setWorkingHours(hoursMap);
    } catch (err) {
      console.error('Error fetching working hours:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalEvents = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const response = await api.get(`/guides/${guideId}/personal-events`, {
        params: { startDate, endDate }
      });
      const data = response.data?.data || response.data;
      setPersonalEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching personal events:', err);
      setPersonalEvents([]);
    }
  };

  const getEventsForDay = useCallback((day) => {
    if (!day) return [];
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return personalEvents.filter((e) => e.date === dateStr);
  }, [personalEvents, currentMonth]);

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const getDayStatus = (day) => {
    if (!day) return 'empty';

    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (date < new Date().setHours(0, 0, 0, 0)) return 'past';

    const dayOfWeek = date.getDay();
    const dayKey = dayOfWeekToKey[dayOfWeek];
    const dayConfig = workingHours[dayKey];
    const isWorkDay = dayConfig && (dayConfig.isWorkingDay === true || dayConfig.is_working_day === true || dayConfig.enabled === true);

    const events = getEventsForDay(day);
    const hasBlocking = events.some(
      (e) => (e.event_type === 'day_off' || e.eventType === 'day_off') ||
             (e.blocks_availability === true || e.blocksAvailability === true)
    );
    const hasMarketplace = events.some(
      (e) => e.event_type === 'marketplace_service' || e.eventType === 'marketplace_service'
    );
    const hasAssignedTour = events.some(
      (e) => e.event_type === 'assigned_tour' || e.eventType === 'assigned_tour'
    );

    if (hasMarketplace) return 'marketplace';
    if (hasAssignedTour) return 'assigned_tour';
    if (hasBlocking) return 'blocked';
    if (!isWorkDay) return 'non_working';
    return 'available';
  };

  const isDateSelected = (day) => {
    if (!day || !selectedDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleDateClick = (day) => {
    const status = getDayStatus(day);
    if (status !== 'available') return;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateSelect(date);
  };

  const getDateClassName = (day) => {
    if (!day) return 'invisible';
    const base = 'p-2 text-center rounded-lg transition-colors text-sm font-medium';

    if (isDateSelected(day)) {
      return `${base} bg-purple-600 text-white hover:bg-purple-700 cursor-pointer`;
    }

    const status = getDayStatus(day);
    switch (status) {
      case 'available':
        return `${base} bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer ring-1 ring-green-200`;
      case 'blocked':
        return `${base} bg-red-50 text-red-600 cursor-not-allowed ring-1 ring-red-200`;
      case 'marketplace':
        return `${base} bg-purple-50 text-purple-600 cursor-not-allowed ring-1 ring-purple-200`;
      case 'assigned_tour':
        return `${base} bg-blue-50 text-blue-600 cursor-not-allowed ring-1 ring-blue-200`;
      case 'past':
        return `${base} bg-gray-50 text-gray-300 cursor-not-allowed`;
      default:
        return `${base} bg-gray-50 text-gray-400 cursor-not-allowed`;
    }
  };

  const days = getDaysInMonth();

  const getSelectedDayHours = () => {
    if (!selectedDate) return null;
    const dayOfWeek = selectedDate.getDay();
    const dayKey = dayOfWeekToKey[dayOfWeek];
    return workingHours[dayKey] || null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('marketplace.comp.guideAvailability')}</h3>

      {loading ? (
        <div className="text-center py-8 text-gray-400">{t('marketplace.comp.loadingAvailability')}</div>
      ) : Object.keys(workingHours).length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('marketplace.comp.noScheduleConfigured')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('marketplace.comp.guideNoSchedule')}</p>
        </div>
      ) : (
        <>
          {/* Header del calendario */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={currentMonth <= new Date()}
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <h4 className="text-lg font-medium text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h4>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div
                key={index}
                onClick={() => day && handleDateClick(day)}
                className={getDateClassName(day)}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-100 rounded ring-1 ring-green-200"></div>
                <span className="text-gray-600">{t('marketplace.comp.available')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                <span className="text-gray-600">{t('marketplace.comp.notAvailable')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-100 rounded ring-1 ring-red-200"></div>
                <span className="text-gray-600">{t('marketplace.comp.blocked')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-purple-100 rounded ring-1 ring-purple-200"></div>
                <span className="text-gray-600">{t('marketplace.comp.service')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-100 rounded ring-1 ring-blue-200"></div>
                <span className="text-gray-600">{t('marketplace.comp.tour')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-purple-600 rounded"></div>
                <span className="text-gray-600">{t('marketplace.comp.selected')}</span>
              </div>
            </div>
          </div>

          {/* Horarios para la fecha seleccionada */}
          {selectedDate && (() => {
            const dayHours = getSelectedDayHours();
            if (!dayHours || !(dayHours.isWorkingDay || dayHours.is_working_day || dayHours.enabled)) {
              return (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">{t('marketplace.comp.noAvailableSchedules')}</p>
                </div>
              );
            }
            const startTime = dayHours.startTime || dayHours.start_time || dayHours.start || '08:00';
            const endTime = dayHours.endTime || dayHours.end_time || dayHours.end || '18:00';
            return (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  {t('marketplace.comp.workSchedule')}
                </h4>
                <div className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50">
                  <span className="text-sm font-medium text-gray-900">
                    {startTime} - {endTime}
                  </span>
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span className="text-sm">{t('marketplace.comp.available')}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
};

GuideAvailabilityCalendar.propTypes = {
  guideId: PropTypes.string.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  onDateSelect: PropTypes.func.isRequired
};

export default GuideAvailabilityCalendar;
