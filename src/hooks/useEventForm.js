import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  INITIAL_EVENT_FORM_STATE,
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  EVENT_VISIBILITY,
  EVENT_REMINDERS,
  EVENT_VALIDATION_LIMITS,
  DEFAULT_EVENT_TIMES,
  EVENT_ERROR_KEYS
} from '../constants/eventFormConstants';

/**
 * Hook para manejar formularios de eventos con validación
 * @param {Object|null} initialEvent - Evento inicial para edición
 * @returns {Object} Estado del formulario y funciones de manejo
 */
const useEventForm = (initialEvent = null) => {
  const { t } = useTranslation();
  
  const initialFormState = useMemo(() => INITIAL_EVENT_FORM_STATE, []);

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load event data when provided
  useEffect(() => {
    if (initialEvent) {
      setFormData({
        ...initialFormState,
        ...initialEvent,
        date: initialEvent.date || '',
        startTime: initialEvent.startTime || '',
        endTime: initialEvent.endTime || ''
      });
      setIsDirty(false);
    }
  }, [initialEvent]);

  // Update form field
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Batch update multiple fields
  const updateFields = useCallback((updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    setIsDirty(true);
  }, []);

  // Validate form
  const validate = useCallback(() => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = t(EVENT_ERROR_KEYS.TITLE_REQUIRED);
    } else if (formData.title.length > EVENT_VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
      newErrors.title = t(EVENT_ERROR_KEYS.TITLE_TOO_LONG);
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = t(EVENT_ERROR_KEYS.DATE_REQUIRED);
    }

    // Time validation for non-allDay events
    if (!formData.allDay) {
      if (!formData.startTime) {
        newErrors.startTime = t(EVENT_ERROR_KEYS.START_TIME_REQUIRED);
      }
      if (!formData.endTime) {
        newErrors.endTime = t(EVENT_ERROR_KEYS.END_TIME_REQUIRED);
      }
      if (formData.startTime && formData.endTime) {
        const start = new Date(`2000-01-01 ${formData.startTime}`);
        const end = new Date(`2000-01-01 ${formData.endTime}`);
        if (start >= end) {
          newErrors.endTime = t(EVENT_ERROR_KEYS.INVALID_TIME_RANGE);
        }
      }
    }

    // Description length validation
    if (formData.description && formData.description.length > EVENT_VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      newErrors.description = t(EVENT_ERROR_KEYS.DESCRIPTION_TOO_LONG);
    }

    // Location length validation
    if (formData.location && formData.location.length > EVENT_VALIDATION_LIMITS.LOCATION_MAX_LENGTH) {
      newErrors.location = t(EVENT_ERROR_KEYS.LOCATION_TOO_LONG);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Reset form
  const reset = useCallback(() => {
    setFormData(initialFormState);
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialFormState]);

  // Handle all day toggle
  const toggleAllDay = useCallback(() => {
    const newAllDay = !formData.allDay;
    updateFields({
      allDay: newAllDay,
      startTime: newAllDay ? '' : (DEFAULT_EVENT_TIMES.START || '09:00'),
      endTime: newAllDay ? '' : (DEFAULT_EVENT_TIMES.END || '17:00')
    });
  }, [formData.allDay, updateFields]);

  // Add attendee
  const addAttendee = useCallback((email) => {
    if (!email || formData.attendees.includes(email)) return;
    
    updateField('attendees', [...formData.attendees, email]);
  }, [formData.attendees, updateField]);

  // Remove attendee
  const removeAttendee = useCallback((email) => {
    updateField('attendees', formData.attendees.filter(e => e !== email));
  }, [formData.attendees, updateField]);

  // Add tag
  const addTag = useCallback((tag) => {
    if (!tag || formData.tags.includes(tag)) return;
    
    updateField('tags', [...formData.tags, tag]);
  }, [formData.tags, updateField]);

  // Remove tag
  const removeTag = useCallback((tag) => {
    updateField('tags', formData.tags.filter(t => t !== tag));
  }, [formData.tags, updateField]);

  // Get form data for submission
  const getFormData = useCallback(() => {
    return {
      ...formData,
      // Ensure times are empty strings for allDay events
      startTime: formData.allDay ? '' : formData.startTime,
      endTime: formData.allDay ? '' : formData.endTime
    };
  }, [formData]);

  return {
    // State
    formData,
    errors,
    isDirty,
    isSubmitting,
    
    // Actions
    updateField,
    updateFields,
    validate,
    reset,
    toggleAllDay,
    addAttendee,
    removeAttendee,
    addTag,
    removeTag,
    getFormData,
    setIsSubmitting,
    
    // Constants
    EVENT_CATEGORIES,
    EVENT_PRIORITIES,
    EVENT_VISIBILITY,
    EVENT_REMINDERS,
    VALIDATION_LIMITS: EVENT_VALIDATION_LIMITS
  };
};

export default useEventForm;