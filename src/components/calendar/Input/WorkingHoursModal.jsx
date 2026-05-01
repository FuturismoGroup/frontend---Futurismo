import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  ClockIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import useWorkingHours from '../../../hooks/useWorkingHours';

const WorkingHoursModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    workingHoursForm,
    updateDaySchedule,
    handleSave,
    resetForm
  } = useWorkingHours(isOpen);

  const daysOfWeek = [
    { key: 'monday', label: t('calendar.days.monday') },
    { key: 'tuesday', label: t('calendar.days.tuesday') },
    { key: 'wednesday', label: t('calendar.days.wednesday') },
    { key: 'thursday', label: t('calendar.days.thursday') },
    { key: 'friday', label: t('calendar.days.friday') },
    { key: 'saturday', label: t('calendar.days.saturday') },
    { key: 'sunday', label: t('calendar.days.sunday') }
  ];

  const handleSubmit = () => {
    if (handleSave()) {
      onClose();
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Cog6ToothIcon className="w-5 h-5 text-purple-500" />
                      <span>{t('calendar.configureWorkingHours')}</span>
                    </div>
                  </Dialog.Title>
                  
                  <button
                    onClick={handleClose}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={t('common.close')}
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-4">
                    {t('calendar.workingHoursDescription')}
                  </p>
                  
                  <div className="space-y-4">
                    {daysOfWeek.map((day) => (
                      <div key={day.key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-gray-700">
                            {day.label}
                          </label>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={workingHoursForm[day.key].enabled}
                              onChange={(e) => updateDaySchedule(day.key, 'enabled', e.target.checked)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              id={`${day.key}-enabled`}
                            />
                            <label 
                              htmlFor={`${day.key}-enabled`}
                              className="ml-2 text-sm text-gray-500"
                            >
                              {t('calendar.active')}
                            </label>
                          </div>
                        </div>
                        
                        {workingHoursForm[day.key].enabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label 
                                htmlFor={`${day.key}-start`}
                                className="block text-xs font-medium text-gray-600 mb-1"
                              >
                                <ClockIcon className="w-3 h-3 inline mr-1" />
                                {t('calendar.startTime')}
                              </label>
                              <input
                                id={`${day.key}-start`}
                                type="time"
                                value={workingHoursForm[day.key].start}
                                onChange={(e) => updateDaySchedule(day.key, 'start', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div>
                              <label 
                                htmlFor={`${day.key}-end`}
                                className="block text-xs font-medium text-gray-600 mb-1"
                              >
                                {t('calendar.endTime')}
                              </label>
                              <input
                                id={`${day.key}-end`}
                                type="time"
                                value={workingHoursForm[day.key].end}
                                onChange={(e) => updateDaySchedule(day.key, 'end', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    onClick={handleClose}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                    onClick={handleSubmit}
                  >
                    {t('calendar.saveWorkingHours')}
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

WorkingHoursModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default WorkingHoursModal;