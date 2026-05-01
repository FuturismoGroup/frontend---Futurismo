import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserGroupIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import MiniCalendar from './MiniCalendar';
import FilterPanel from './FilterPanel';
import CalendarSection from './CalendarSection';
import useCalendarSidebar from '../../../hooks/useCalendarSidebar';

const CalendarSidebar = ({ hideGuides = false, hideFilters = false }) => {
  const { t } = useTranslation();
  const {
    expandedSections,
    visibleCalendars,
    currentGuide,
    guides,
    canListGuides,
    toggleSection,
    toggleCalendarVisibility,
    setCurrentGuide
  } = useCalendarSidebar({ hideGuides });

  return (
    <div className="flex flex-col h-full">
      {/* Mini Calendar */}
      <div className="p-4 border-b border-gray-100">
        <MiniCalendar />
      </div>

      {/* Calendars Section */}
      {!hideFilters && (
        <CalendarSection
          expanded={expandedSections.calendars}
          visibleCalendars={visibleCalendars}
          onToggle={() => toggleSection('calendars')}
          onToggleVisibility={toggleCalendarVisibility}
        />
      )}

      {/* Guides Section (admin/agency only) - hidden when parent provides its own list */}
      {canListGuides && !hideGuides && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection('guides')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{t('calendar.sidebar.guides')}</span>
            </div>
            <div className={`transform transition-transform ${expandedSections.guides ? 'rotate-90' : ''}`}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {expandedSections.guides && (
            <div className="pb-2">
              {guides.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => setCurrentGuide(guide.id)}
                  className={`w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                    currentGuide === guide.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {guide.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {guide.online && (
                      <div 
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" 
                        aria-label={t('calendar.sidebar.online')}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${currentGuide === guide.id ? 'text-blue-700' : 'text-gray-700'}`}>
                      {guide.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{guide.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters Section */}
      {!hideFilters && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection('filters')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{t('calendar.sidebar.filters')}</span>
            </div>
            <div className={`transform transition-transform ${expandedSections.filters ? 'rotate-90' : ''}`}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {expandedSections.filters && (
            <div className="pb-2">
              <FilterPanel />
            </div>
          )}
        </div>
      )}

      {/* Flexible space */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">{t('calendar.sidebar.guides', 'Agenda Guías')}</p>
      </div>
    </div>
  );
};

export default CalendarSidebar;