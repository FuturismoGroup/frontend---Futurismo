import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Switch } from '@headlessui/react';
import useCalendarFilters from '../../../hooks/useCalendarFilters';

const FilterToggle = ({ label, checked, onChange, colorClass = 'bg-blue-500' }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-700">{label}</span>
    <Switch
      checked={checked}
      onChange={onChange}
      className={`${
        checked ? colorClass : 'bg-gray-200'
      } relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-${colorClass.split('-')[1]}-500 focus:ring-offset-2`}
    >
      <span
        className={`${
          checked ? 'translate-x-4' : 'translate-x-1'
        } inline-block h-2 w-2 transform rounded-full bg-white transition-transform`}
      />
    </Switch>
  </div>
);

FilterToggle.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  colorClass: PropTypes.string
};

const FilterPanel = () => {
  const { t } = useTranslation();
  const {
    filters,
    timeFilter,
    setTimeFilter,
    toggleFilter,
    resetFilters
  } = useCalendarFilters();

  const timeFilterOptions = [
    { value: 'all', label: t('calendar.filters.all') },
    { value: 'today', label: t('calendar.filters.today') },
    { value: 'thisWeek', label: t('calendar.filters.thisWeek') },
    { value: 'thisMonth', label: t('calendar.filters.thisMonth') }
  ];

  const filterOptions = [
    {
      key: 'showWeekends',
      label: t('calendar.filters.weekends'),
      colorClass: 'bg-blue-500'
    },
    {
      key: 'showPersonalEvents',
      label: t('calendar.filters.personalEvents'),
      colorClass: 'bg-blue-500'
    },
    {
      key: 'showCompanyTours',
      label: t('calendar.filters.companyTours'),
      colorClass: 'bg-green-500'
    },
    {
      key: 'showOccupiedTime',
      label: t('calendar.filters.occupiedTime'),
      colorClass: 'bg-red-500'
    }
  ];

  const optionFilters = [
    {
      key: 'workingHoursOnly',
      label: t('calendar.filters.workingHoursOnly'),
      colorClass: 'bg-purple-500'
    },
    {
      key: 'showPastEvents',
      label: t('calendar.filters.pastEvents'),
      colorClass: 'bg-gray-500'
    }
  ];

  return (
    <div className="px-4 space-y-4">
      {/* Time filters */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {t('calendar.filters.period')}
        </h4>
        <div className="space-y-1">
          {timeFilterOptions.map((option) => (
            <label key={option.value} className="flex items-center space-x-2">
              <input
                type="radio"
                name="timeFilter"
                value={option.value}
                checked={timeFilter === option.value}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-3 h-3 text-blue-500 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Visibility filters */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {t('calendar.filters.show')}
        </h4>
        <div className="space-y-3">
          {filterOptions.map((filter) => (
            <FilterToggle
              key={filter.key}
              label={filter.label}
              checked={filters[filter.key]}
              onChange={() => toggleFilter(filter.key)}
              colorClass={filter.colorClass}
            />
          ))}
        </div>
      </div>

      {/* Additional options */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {t('calendar.filters.options')}
        </h4>
        <div className="space-y-3">
          {optionFilters.map((filter) => (
            <FilterToggle
              key={filter.key}
              label={filter.label}
              checked={filters[filter.key]}
              onChange={() => toggleFilter(filter.key)}
              colorClass={filter.colorClass}
            />
          ))}
        </div>
      </div>

      {/* Clear filters button */}
      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={resetFilters}
          className="w-full text-xs text-gray-500 hover:text-gray-700 py-2 hover:bg-gray-50 rounded transition-colors"
        >
          {t('calendar.filters.clearFilters')}
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;