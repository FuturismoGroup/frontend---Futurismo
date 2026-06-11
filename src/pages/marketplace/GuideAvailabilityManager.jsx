import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SignalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../stores/authStore';
import useMarketplaceStore from '../../stores/marketplaceStore';
import useIndependentAgendaStore from '../../stores/independentAgendaStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DAY_CONFIGS = [
  { key: 'lunes', i18nKey: 'monday' },
  { key: 'martes', i18nKey: 'tuesday' },
  { key: 'miercoles', i18nKey: 'wednesday' },
  { key: 'jueves', i18nKey: 'thursday' },
  { key: 'viernes', i18nKey: 'friday' },
  { key: 'sabado', i18nKey: 'saturday' },
  { key: 'domingo', i18nKey: 'sunday' },
];

const dayOfWeekToKey = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
};

const MONTH_I18N_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const DAY_LABEL_I18N_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const GuideAvailabilityManager = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { currentGuide, isLoading: mpLoading, fetchGuideProfile, toggleGuideOnline } = useMarketplaceStore();

  const {
    personalEvents,
    workingHours: storedWorkingHours,
    actions,
  } = useIndependentAgendaStore();

  const guideId = user?.guideId;

  // --- Sección 1: Toggle online/offline ---
  const [online, setOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // --- Sección 2: Horario semanal ---
  const [schedule, setSchedule] = useState(() =>
    DAY_CONFIGS.reduce((acc, d) => {
      acc[d.key] = { enabled: false, start: '08:00', end: '18:00' };
      return acc;
    }, {})
  );
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);

  // --- Sección 3: Calendario ---
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [actionInProgress, setActionInProgress] = useState(null); // dateString being toggled

  // Carga inicial: perfil + horario + eventos
  useEffect(() => {
    if (!guideId) return;

    fetchGuideProfile(guideId)
      .then((guide) => {
        setOnline(!!guide?.online);
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));

    actions.loadWorkingHours(guideId)
      .then(() => setScheduleLoaded(true))
      .catch(() => setScheduleLoaded(true));
  }, [guideId]);

  // Cargar eventos del mes visible
  useEffect(() => {
    if (!guideId) return;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    actions.loadPersonalEvents(guideId, { startDate, endDate }).catch(() => {});
  }, [guideId, currentMonth]);

  // Sync schedule state when storedWorkingHours changes
  useEffect(() => {
    const wh = storedWorkingHours?.[guideId];
    if (!wh) return;
    const newSchedule = {};
    DAY_CONFIGS.forEach(({ key }) => {
      const dayData = wh[key];
      if (dayData) {
        newSchedule[key] = {
          enabled: dayData.enabled ?? dayData.isWorkingDay ?? dayData.is_working_day ?? false,
          start: dayData.start ?? dayData.startTime ?? dayData.start_time ?? '08:00',
          end: dayData.end ?? dayData.endTime ?? dayData.end_time ?? '18:00',
        };
      } else {
        newSchedule[key] = { enabled: false, start: '08:00', end: '18:00' };
      }
    });
    setSchedule(newSchedule);
  }, [storedWorkingHours, guideId]);

  // --- Handlers Toggle ---
  const handleToggle = async () => {
    const newValue = !online;
    setToggling(true);
    try {
      await toggleGuideOnline(guideId, newValue);
      setOnline(newValue);
      toast.success(newValue ? t('marketplace.availability.nowVisible') : t('marketplace.availability.noLongerVisible'));
    } catch (err) {
      toast.error(err.message || t('errors.unexpectedError'));
    } finally {
      setToggling(false);
    }
  };

  // --- Handlers Horario ---
  const handleScheduleChange = (dayKey, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }));
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await actions.setWorkingHours(guideId, schedule);
      toast.success(t('marketplace.availability.scheduleSaved'));
    } catch (err) {
      toast.error(err.message || t('errors.unexpectedError'));
    } finally {
      setSavingSchedule(false);
    }
  };

  // --- Calendario helpers ---
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  }, [currentMonth]);

  const guideEvents = personalEvents?.[guideId] || {};

  const getEventsForDay = useCallback(
    (day) => {
      if (!day) return [];
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return guideEvents[dateStr] || [];
    },
    [guideEvents, currentMonth]
  );

  const getDayStatus = useCallback(
    (day) => {
      if (!day) return 'empty';
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayKey = dayOfWeekToKey[date.getDay()];
      const isWorkDay = schedule[dayKey]?.enabled;
      const events = getEventsForDay(day);

      const hasBlockingEvent = events.some(
        (e) => e.event_type === 'day_off' || e.eventType === 'day_off'
      );
      const hasMarketplaceService = events.some(
        (e) => e.event_type === 'marketplace_service' || e.eventType === 'marketplace_service'
      );
      const hasAssignedTour = events.some(
        (e) => e.event_type === 'assigned_tour' || e.eventType === 'assigned_tour'
      );

      if (hasMarketplaceService) return 'marketplace';
      if (hasAssignedTour) return 'assigned_tour';
      if (hasBlockingEvent) return 'blocked';
      if (!isWorkDay) return 'non_working';
      return 'available';
    },
    [schedule, getEventsForDay, currentMonth]
  );

  const handleDayClick = async (day) => {
    if (!day || actionInProgress) return;

    const status = getDayStatus(day);
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (status === 'marketplace') {
      toast(t('availability.dayHasMarketplace'), { icon: 'ℹ️' });
      return;
    }
    if (status === 'assigned_tour') {
      toast(t('availability.dayHasTour'), { icon: 'ℹ️' });
      return;
    }
    if (status === 'non_working') {
      toast(t('availability.changeWeeklySchedule'), { icon: 'ℹ️' });
      return;
    }

    setActionInProgress(dateStr);

    try {
      if (status === 'available') {
        // Bloquear día
        await actions.addPersonalEvent(guideId, {
          title: t('availability.dayNotAvailable'),
          date: dateStr,
          allDay: true,
          type: 'day_off',
          blocksAvailability: true,
          color: '#EF4444',
        });
        toast.success(t('availability.dayBlocked'));
      } else if (status === 'blocked') {
        // Desbloquear día - encontrar el evento day_off
        const events = getEventsForDay(day);
        const dayOffEvent = events.find(
          (e) => e.event_type === 'day_off' || e.eventType === 'day_off'
        );
        if (dayOffEvent) {
          await actions.deletePersonalEvent(guideId, dayOffEvent.id);
          toast.success(t('availability.dayUnblocked'));
        }
      }
    } catch (err) {
      toast.error(err.message || t('marketplace.availability.updateError'));
    } finally {
      setActionInProgress(null);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + direction);
      return next;
    });
  };

  const getDayCellClass = (day) => {
    if (!day) return 'invisible';
    const status = getDayStatus(day);
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isLoading = actionInProgress === dateStr;

    const base = 'relative p-1 sm:p-2 h-10 sm:h-12 text-center rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 select-none flex items-center justify-center';

    if (isLoading) return `${base} bg-gray-200 text-gray-400 animate-pulse cursor-wait`;

    switch (status) {
      case 'available':
        return `${base} bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer ring-1 ring-green-200`;
      case 'blocked':
        return `${base} bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer ring-1 ring-red-200`;
      case 'marketplace':
        return `${base} bg-purple-50 text-purple-700 cursor-default ring-1 ring-purple-200`;
      case 'assigned_tour':
        return `${base} bg-blue-50 text-blue-700 cursor-default ring-1 ring-blue-200`;
      case 'non_working':
        return `${base} bg-gray-50 text-gray-400 cursor-default`;
      default:
        return `${base} bg-gray-50 text-gray-400`;
    }
  };

  if (mpLoading && !profileLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('marketplace.availability.title')}</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          {t('marketplace.availability.subtitle')}
        </p>
      </div>

      {/* === SECCIÓN 1: Toggle Visibilidad === */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`p-2 rounded-lg flex-shrink-0 ${online ? 'bg-green-100' : 'bg-gray-100'}`}>
              <SignalIcon className={`h-5 w-5 ${online ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{t('marketplace.availability.marketplaceVisibility')}</p>
              <span className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium ${online ? 'text-green-700' : 'text-gray-500'}`}>
                <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
                {online ? t('marketplace.availability.visibleForAgencies') : t('marketplace.availability.notVisible')}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={online}
            disabled={toggling}
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 ${online ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${online ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      {/* === SECCIÓN 2: Horario Semanal === */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <ClockIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('marketplace.availability.weeklySchedule')}</h2>
        </div>

        {!scheduleLoaded ? (
          <div className="text-center py-6 text-gray-400">{t('marketplace.availability.loadingSchedule')}</div>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-2">
              {DAY_CONFIGS.map(({ key, i18nKey }) => (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-1.5 border-b border-gray-50 sm:border-b-0 last:border-b-0 pb-2 sm:pb-1.5"
                >
                  {/* Checkbox + nombre del día */}
                  <label className="flex items-center gap-2 sm:w-28 cursor-pointer select-none flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={schedule[key].enabled}
                      onChange={(e) => handleScheduleChange(key, 'enabled', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className={`text-sm font-medium ${schedule[key].enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                      {t(`monthView.weekdaysFull.${i18nKey}`)}
                    </span>
                  </label>

                  {/* Inputs de hora - se ajustan en móvil */}
                  {schedule[key].enabled ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0">
                      <input
                        type="time"
                        value={schedule[key].start}
                        onChange={(e) => handleScheduleChange(key, 'start', e.target.value)}
                        className="block flex-1 sm:flex-none sm:w-28 min-w-0 rounded-md border-gray-300 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500 px-2 py-1.5"
                      />
                      <span className="text-gray-400 text-sm flex-shrink-0">a</span>
                      <input
                        type="time"
                        value={schedule[key].end}
                        onChange={(e) => handleScheduleChange(key, 'end', e.target.value)}
                        className="block flex-1 sm:flex-none sm:w-28 min-w-0 rounded-md border-gray-300 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500 px-2 py-1.5"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic sm:ml-0">{t('marketplace.availability.notWorking')}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {savingSchedule ? t('marketplace.availability.saving') : t('marketplace.availability.saveSchedule')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* === SECCIÓN 3: Calendario de Bloqueos === */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <CalendarDaysIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('marketplace.availability.blockedCalendar')}</h2>
        </div>

        {/* Navegación de mes */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-medium text-gray-900">
            {t(`monthView.months.${MONTH_I18N_KEYS[currentMonth.getMonth()]}`)} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Encabezado días */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_LABEL_I18N_KEYS.map((key) => (
            <div key={key} className="text-center text-xs font-medium text-gray-500 py-1">
              {t(`monthView.weekdays.${key}`)}
            </div>
          ))}
        </div>

        {/* Grilla del mes */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, idx) => (
            <div
              key={idx}
              onClick={() => handleDayClick(day)}
              className={getDayCellClass(day)}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-100 ring-1 ring-green-200" />
              <span className="text-gray-600">{t('marketplace.availability.available')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-100" />
              <span className="text-gray-600">{t('marketplace.availability.notWorking')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-100 ring-1 ring-red-200" />
              <span className="text-gray-600">{t('marketplace.availability.blocked')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-purple-100 ring-1 ring-purple-200" />
              <span className="text-gray-600">{t('marketplace.availability.marketplaceService')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-100 ring-1 ring-blue-200" />
              <span className="text-gray-600">{t('marketplace.availability.assignedTour')}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            {t('marketplace.availability.calendarHint')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuideAvailabilityManager;
