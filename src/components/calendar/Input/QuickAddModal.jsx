import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { 
  XMarkIcon, 
  CalendarDaysIcon,
  EyeSlashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Components
import EventFormFields from './EventFormFields';

// Hooks  
import useEventForm from '../../../hooks/useEventForm';
import useIndependentAgendaStore from '../../../stores/independentAgendaStore';
import useAuthStore from '../../../stores/authStore';

const QuickAddModal = ({ 
  isOpen, 
  onClose, 
  selectedDate = null, 
  selectedTime = null,
  mode = 'event' // 'event' | 'occupied'
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { 
    actions: { addPersonalEvent, markTimeAsOccupied }
  } = useIndependentAgendaStore();

  const {
    formData,
    errors,
    isSubmitting,
    updateField,
    updateFields,
    toggleAllDay,
    validate,
    reset,
    setIsSubmitting,
    getFormData
  } = useEventForm();

  // Update form when props change
  useEffect(() => {
    const updates = {};
    
    if (selectedDate) {
      updates.date = format(selectedDate, 'yyyy-MM-dd');
    }
    
    if (selectedTime) {
      updates.startTime = selectedTime;
      // Add 1 hour to get end time
      const [h, m] = selectedTime.split(':').map(Number);
      const endHour = (h + 1) % 24;
      updates.endTime = `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    
    if (Object.keys(updates).length > 0) {
      updateFields(updates);
    }
  }, [selectedDate, selectedTime, updateFields]);

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    try {
      setIsSubmitting(true);
      const eventData = getFormData();

      if (mode === 'occupied') {
        await markTimeAsOccupied(user.guideId, {
          date: eventData.date,
          startTime: eventData.allDay ? null : eventData.startTime,
          endTime: eventData.allDay ? null : eventData.endTime,
          note: eventData.description
        });
        toast.success(t('calendar.messages.timeMarkedOccupied'));
      } else {
        const newEvent = {
          ...eventData,
          id: `event-${Date.now()}`,
          type: 'personal',
          visibility: 'private',
          createdAt: new Date().toISOString(),
          createdBy: user.id
        };
        
        await addPersonalEvent(user.guideId, newEvent);
        toast.success(t('calendar.messages.eventCreated'));
      }

      handleClose();
    } catch {
      toast.error(
        mode === 'occupied' 
          ? t('calendar.messages.markOccupiedError')
          : t('calendar.messages.createError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[1050]" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/70" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      {mode === 'occupied' ? (
                        <>
                          <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                          <span>{t('calendar.markTimeOccupied')}</span>
                        </>
                      ) : (
                        <>
                          <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
                          <span>{t('calendar.addEvent')}</span>
                        </>
                      )}
                    </div>
                  </Dialog.Title>
                  
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                    aria-label={t('common.close')}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Form */}
                <div className="max-h-[60vh] overflow-y-auto px-1">
                  <EventFormFields
                    formData={formData}
                    errors={errors}
                    onFieldChange={updateField}
                    onToggleAllDay={toggleAllDay}
                    mode={mode}
                  />
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                      mode === 'occupied'
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <CheckIcon className="h-4 w-4" />
                    {isSubmitting 
                      ? t('common.saving') 
                      : mode === 'occupied' 
                        ? t('calendar.markAsOccupied')
                        : t('calendar.createEvent')
                    }
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

QuickAddModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  selectedTime: PropTypes.string,
  mode: PropTypes.oneOf(['event', 'occupied'])
};

export default QuickAddModal;