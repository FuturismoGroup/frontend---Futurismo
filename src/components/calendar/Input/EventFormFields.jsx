import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
  UserGroupIcon,
  BellIcon,
  FlagIcon
} from '@heroicons/react/24/outline';

const EventFormFields = ({ formData, errors, onFieldChange, onToggleAllDay, mode = 'event' }) => {
  const { t } = useTranslation();

  const categories = [
    { value: 'personal', label: t('calendar.categories.personal') },
    { value: 'work', label: t('calendar.categories.work') },
    { value: 'meeting', label: t('calendar.categories.meeting') },
    { value: 'tour', label: t('calendar.categories.tour') },
    { value: 'other', label: t('calendar.categories.other') }
  ];

  const priorities = [
    { value: 'low', label: t('calendar.priorities.low'), color: 'text-gray-600' },
    { value: 'medium', label: t('calendar.priorities.medium'), color: 'text-yellow-600' },
    { value: 'high', label: t('calendar.priorities.high'), color: 'text-red-600' }
  ];

  const reminders = [
    { value: '0', label: t('calendar.reminders.none') },
    { value: '5', label: t('calendar.reminders.5min') },
    { value: '15', label: t('calendar.reminders.15min') },
    { value: '30', label: t('calendar.reminders.30min') },
    { value: '60', label: t('calendar.reminders.1hour') },
    { value: '1440', label: t('calendar.reminders.1day') }
  ];

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1">
          {mode === 'occupied' ? t('calendar.fields.reason') : t('calendar.fields.title')} *
        </label>
        <input
          id="event-title"
          type="text"
          value={formData.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={mode === 'occupied' ? t('calendar.placeholders.reason') : t('calendar.placeholders.title')}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1">
            <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
            {t('calendar.fields.date')} *
          </label>
          <input
            id="event-date"
            type="date"
            value={formData.date}
            onChange={(e) => onFieldChange('date', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'date-error' : undefined}
          />
          {errors.date && (
            <p id="date-error" className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.allDay}
              onChange={onToggleAllDay}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              {t('calendar.fields.allDay')}
            </span>
          </label>
        </div>
      </div>

      {/* Time fields */}
      {!formData.allDay && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              {t('calendar.fields.startTime')} *
            </label>
            <input
              id="start-time"
              type="time"
              value={formData.startTime}
              onChange={(e) => onFieldChange('startTime', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.startTime ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.startTime}
              aria-describedby={errors.startTime ? 'start-time-error' : undefined}
            />
            {errors.startTime && (
              <p id="start-time-error" className="mt-1 text-sm text-red-600">{errors.startTime}</p>
            )}
          </div>

          <div>
            <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              {t('calendar.fields.endTime')} *
            </label>
            <input
              id="end-time"
              type="time"
              value={formData.endTime}
              onChange={(e) => onFieldChange('endTime', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.endTime ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.endTime}
              aria-describedby={errors.endTime ? 'end-time-error' : undefined}
            />
            {errors.endTime && (
              <p id="end-time-error" className="mt-1 text-sm text-red-600">{errors.endTime}</p>
            )}
          </div>
        </div>
      )}

      {/* Location - Only show for events */}
      {mode !== 'occupied' && (
        <div>
          <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-1">
            <MapPinIcon className="w-4 h-4 inline mr-1" />
            {t('calendar.fields.location')}
          </label>
          <input
            id="event-location"
            type="text"
            value={formData.location}
            onChange={(e) => onFieldChange('location', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('calendar.placeholders.location')}
            aria-invalid={!!errors.location}
            aria-describedby={errors.location ? 'location-error' : undefined}
          />
          {errors.location && (
            <p id="location-error" className="mt-1 text-sm text-red-600">{errors.location}</p>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
          {mode === 'occupied' ? t('calendar.fields.personalNote') : t('calendar.fields.description')}
        </label>
        <textarea
          id="event-description"
          value={formData.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={mode === 'occupied' ? t('calendar.placeholders.personalNote') : t('calendar.placeholders.description')}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Category and Priority - Only show for events */}
      {mode !== 'occupied' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="event-category" className="block text-sm font-medium text-gray-700 mb-1">
                <TagIcon className="w-4 h-4 inline mr-1" />
                {t('calendar.fields.category')}
              </label>
              <select
                id="event-category"
                value={formData.category}
                onChange={(e) => onFieldChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="event-priority" className="block text-sm font-medium text-gray-700 mb-1">
                <FlagIcon className="w-4 h-4 inline mr-1" />
                {t('calendar.fields.priority')}
              </label>
              <select
                id="event-priority"
                value={formData.priority}
                onChange={(e) => onFieldChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label htmlFor="event-reminder" className="block text-sm font-medium text-gray-700 mb-1">
              <BellIcon className="w-4 h-4 inline mr-1" />
              {t('calendar.fields.reminder')}
            </label>
            <select
              id="event-reminder"
              value={formData.reminder}
              onChange={(e) => onFieldChange('reminder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {reminders.map(reminder => (
                <option key={reminder.value} value={reminder.value}>
                  {reminder.label}
                </option>
              ))}
            </select>
          </div>

          {/* Recurring */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.recurring}
                onChange={(e) => onFieldChange('recurring', e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {t('calendar.fields.recurring')}
              </span>
            </label>
          </div>
        </>
      )}
    </div>
  );
};

EventFormFields.propTypes = {
  formData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    date: PropTypes.string.isRequired,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    location: PropTypes.string,
    allDay: PropTypes.bool,
    category: PropTypes.string,
    recurring: PropTypes.bool,
    reminder: PropTypes.string,
    priority: PropTypes.string
  }).isRequired,
  errors: PropTypes.object,
  onFieldChange: PropTypes.func.isRequired,
  onToggleAllDay: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['event', 'occupied'])
};

export default EventFormFields;