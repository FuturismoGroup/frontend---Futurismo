import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Popover, Transition } from '@headlessui/react';
import { 
  ClockIcon, 
  MapPinIcon, 
  UserIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { VISIBILITY_LEVELS, EVENT_TYPES } from '../../../stores/independentAgendaStore';
import { calculateDuration, shouldShowEventDetails } from '../../../utils/eventHelpers';

const EventTooltip = ({ 
  event, 
  isAdmin = false, 
  children, 
  onEdit, 
  onDelete, 
  onView,
  position = 'top' 
}) => {
  const { t } = useTranslation();
  
  if (!event) return children;

  const showDetails = shouldShowEventDetails(event, isAdmin);
  const duration = calculateDuration(event.startTime, event.endTime);

  const formatEventTime = () => {
    if (event.allDay) {
      return t('calendar.allDay');
    }
    if (event.startTime && event.endTime) {
      return `${event.startTime} - ${event.endTime}`;
    }
    return t('calendar.timeNotDefined');
  };

  const getEventTypeBadgeColor = () => {
    switch (event.type) {
      case EVENT_TYPES.PERSONAL:
        return 'bg-blue-400';
      case EVENT_TYPES.COMPANY_TOUR:
        return 'bg-green-400';
      case EVENT_TYPES.OCCUPIED:
        return 'bg-gray-400';
      default:
        return 'bg-purple-400';
    }
  };

  return (
    <Popover className="relative block w-full h-full">
      {({ open }) => (
        <>
          <Popover.Button as="div" className="cursor-pointer w-full h-full">
            {children}
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel 
              className={`absolute z-50 w-80 px-4 mt-3 transform ${
                position === 'bottom' ? 'top-full' : 'bottom-full mb-3'
              } -translate-x-1/2 left-1/2 sm:px-0`}
            >
              <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="relative bg-white p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {showDetails ? event.title : t('calendar.occupied')}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {t(`calendar.eventTypes.${event.type}`)}
                      </p>
                    </div>
                    
                    {/* Status indicator */}
                    <div className={`
                      flex-shrink-0 w-3 h-3 rounded-full ml-2 mt-1
                      ${getEventTypeBadgeColor()}
                    `} />
                  </div>

                  {/* Time details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4" />
                      <span>{formatEventTime()}</span>
                      {duration && (
                        <>
                          <span>•</span>
                          <span className="font-medium">{duration}</span>
                        </>
                      )}
                    </div>

                    {/* Date */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>📅</span>
                      <span>
                        {event.date && !isNaN(new Date(event.date)) 
                          ? format(new Date(event.date), 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es })
                          : t('calendar.dateNotAvailable')
                        }
                      </span>
                    </div>

                    {/* Location */}
                    {showDetails && event.location && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}

                    {/* Client (for tours) */}
                    {showDetails && event.type === EVENT_TYPES.COMPANY_TOUR && event.client && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <UserIcon className="w-4 h-4" />
                        <span className="truncate">{event.client}</span>
                      </div>
                    )}

                    {/* Price (for tours) */}
                    {showDetails && event.type === EVENT_TYPES.COMPANY_TOUR && event.price && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>💰</span>
                        <span className="font-medium">S/. {event.price}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {showDetails && event.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {event.description}
                      </p>
                    </div>
                  )}

                  {/* Privacy info */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
                    <EyeIcon className="w-3 h-3" />
                    <span>{t(`calendar.visibility.${event.visibility}`)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                    {onView && (
                      <button
                        onClick={() => onView(event)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      >
                        <EyeIcon className="w-3 h-3 mr-1" />
                        {t('common.view')}
                      </button>
                    )}
                    
                    {!isAdmin && onEdit && showDetails && (
                      <button
                        onClick={() => onEdit(event)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                      >
                        <PencilIcon className="w-3 h-3 mr-1" />
                        {t('common.edit')}
                      </button>
                    )}
                    
                    {!isAdmin && onDelete && showDetails && (
                      <button
                        onClick={() => onDelete(event)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
                      >
                        <TrashIcon className="w-3 h-3 mr-1" />
                        {t('common.delete')}
                      </button>
                    )}
                  </div>

                  {/* Metadata */}
                  {showDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>ID: {event.id}</span>
                        {event.createdAt && (
                          <span>
                            {t('calendar.created')}: {event.createdAt && !isNaN(new Date(event.createdAt)) 
                              ? format(new Date(event.createdAt), 'dd/MM/yyyy')
                              : t('calendar.dateNotAvailable')
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

EventTooltip.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    type: PropTypes.string,
    visibility: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    date: PropTypes.string,
    location: PropTypes.string,
    description: PropTypes.string,
    client: PropTypes.string,
    price: PropTypes.number,
    allDay: PropTypes.bool,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }).isRequired,
  isAdmin: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  position: PropTypes.oneOf(['top', 'bottom'])
};

export default EventTooltip;