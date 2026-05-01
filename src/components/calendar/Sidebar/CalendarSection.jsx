import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { 
  CalendarIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { CalendarDaysIcon } from '@heroicons/react/24/solid';

const CalendarSection = ({ 
  expanded, 
  visibleCalendars, 
  onToggle, 
  onToggleVisibility 
}) => {
  const { t } = useTranslation();

  const calendars = [
    {
      id: 'personal',
      name: t('calendar.sidebar.myAgenda'),
      icon: UserIcon,
      color: 'bg-blue-500',
      visible: visibleCalendars.personal,
      description: t('calendar.sidebar.personalEvents')
    },
    {
      id: 'company',
      name: t('calendar.sidebar.assignedTours'),
      icon: BuildingOfficeIcon,
      color: 'bg-green-500',
      visible: visibleCalendars.company,
      description: t('calendar.sidebar.companyTours')
    },
    {
      id: 'reservations',
      name: t('calendar.sidebar.reservations'),
      icon: CalendarDaysIcon,
      color: 'bg-purple-500',
      visible: visibleCalendars.reservations,
      description: t('calendar.sidebar.reservationCalendar')
    }
  ];

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {t('calendar.sidebar.calendars')}
          </span>
        </div>
        <div className={`transform transition-transform ${expanded ? 'rotate-90' : ''}`}>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="pb-2">
          {calendars.map((calendar) => (
            <div key={calendar.id} className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 group">
              <div className="flex items-center space-x-3 flex-1">
                <button
                  onClick={() => onToggleVisibility(calendar.id)}
                  className="p-1 rounded hover:bg-gray-100"
                  aria-label={calendar.visible ? t('calendar.hide') : t('calendar.show')}
                >
                  {calendar.visible ? (
                    <EyeIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <EyeSlashIcon className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                <div className="flex items-center space-x-2 flex-1">
                  <div className={`w-3 h-3 rounded-full ${calendar.color} ${!calendar.visible ? 'opacity-50' : ''}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${calendar.visible ? 'text-gray-700' : 'text-gray-400'}`}>
                      {calendar.name}
                    </p>
                    <p className="text-xs text-gray-500">{calendar.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
            <PlusIcon className="w-4 h-4" />
            <span className="text-sm">{t('calendar.sidebar.addCalendar')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

CalendarSection.propTypes = {
  expanded: PropTypes.bool.isRequired,
  visibleCalendars: PropTypes.shape({
    personal: PropTypes.bool,
    company: PropTypes.bool,
    reservations: PropTypes.bool
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onToggleVisibility: PropTypes.func.isRequired
};

export default CalendarSection;