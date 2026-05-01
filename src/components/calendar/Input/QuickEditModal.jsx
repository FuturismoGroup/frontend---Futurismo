import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { 
  XMarkIcon, 
  TrashIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Components
import EventFormFields from './EventFormFields';

// Hooks
import useEventForm from '../../../hooks/useEventForm';
import useIndependentAgendaStore from '../../../stores/independentAgendaStore';
import useAuthStore from '../../../stores/authStore';

const QuickEditModal = ({ 
  isOpen, 
  onClose, 
  event,
  onSave,
  onDelete,
  onDuplicate
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { 
    actions: { updatePersonalEvent, deletePersonalEvent, addPersonalEvent }
  } = useIndependentAgendaStore();

  const {
    formData,
    errors,
    isDirty,
    isSubmitting,
    updateField,
    toggleAllDay,
    validate,
    reset,
    setIsSubmitting,
    getFormData
  } = useEventForm(event);

  const handleSave = async () => {
    if (!validate() || !event) return;

    try {
      setIsSubmitting(true);
      const updatedEvent = {
        ...event,
        ...getFormData(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.id
      };

      await updatePersonalEvent(user.guideId, event.id, updatedEvent);
      
      if (onSave) {
        onSave(updatedEvent);
      }
      
      toast.success(t('calendar.messages.eventUpdated'));
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(t('calendar.messages.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !window.confirm(t('calendar.confirmDelete'))) return;

    try {
      setIsSubmitting(true);
      await deletePersonalEvent(user.guideId, event.id);
      
      if (onDelete) {
        onDelete(event);
      }
      
      toast.success(t('calendar.messages.eventDeleted'));
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(t('calendar.messages.deleteError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!event) return;

    try {
      const duplicatedEvent = {
        ...getFormData(),
        id: `event-${Date.now()}`,
        title: `${formData.title} (${t('calendar.copy')})`,
        createdAt: new Date().toISOString(),
        createdBy: user?.id
      };

      await addPersonalEvent(user.guideId, duplicatedEvent);
      
      if (onDuplicate) {
        onDuplicate(duplicatedEvent);
      }
      
      toast.success(t('calendar.messages.eventDuplicated'));
      onClose();
    } catch (error) {
      console.error('Error duplicating event:', error);
      toast.error(t('calendar.messages.duplicateError'));
    }
  };

  const handleClose = () => {
    if (isDirty && !window.confirm(t('calendar.confirmDiscardChanges'))) {
      return;
    }
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
                    {t('calendar.editEvent')}
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
                  />
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                      {t('common.delete')}
                    </button>
                    <button
                      onClick={handleDuplicate}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      {t('calendar.duplicate')}
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSubmitting || !isDirty}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckIcon className="h-4 w-4" />
                      {isSubmitting ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

QuickEditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  event: PropTypes.object,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func
};

export default QuickEditModal;