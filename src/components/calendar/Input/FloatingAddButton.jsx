import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PlusIcon, EyeSlashIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';

const FloatingAddButton = ({ onAddEvent, onMarkOccupied, className = '' }) => {
  const { t } = useTranslation();

  const menuItems = [
    {
      label: t('calendar.addPersonalEvent'),
      icon: CalendarDaysIcon,
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50',
      onClick: () => onAddEvent()
    },
    {
      label: t('calendar.markTimeOccupied'),
      icon: EyeSlashIcon,
      color: 'text-gray-600',
      bgColor: 'hover:bg-gray-50',
      onClick: () => onMarkOccupied()
    }
  ];

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <Menu as="div" className="relative">
        {({ open }) => (
          <>
            <Menu.Button
              className={`
                group flex items-center justify-center w-14 h-14 bg-blue-500 hover:bg-blue-600 
                text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-30
                ${open ? 'rotate-45 scale-110' : 'hover:scale-105'}
              `}
              aria-label={t('calendar.addEventButton')}
            >
              <PlusIcon className="w-6 h-6" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-2"
            >
              <Menu.Items className="absolute bottom-16 right-0 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none">
                <div className="p-1">
                  {menuItems.map((item, index) => (
                    <Menu.Item key={index}>
                      {({ active }) => (
                        <button
                          onClick={item.onClick}
                          className={`
                            group flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors
                            ${active ? `${item.bgColor} ${item.color}` : 'text-gray-700'}
                          `}
                        >
                          <item.icon 
                            className={`w-5 h-5 mr-3 transition-colors ${
                              active ? item.color : 'text-gray-400'
                            }`} 
                          />
                          {item.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
                
                <div className="p-1">
                  <div className="px-3 py-2 text-xs text-gray-500">
                    {t('calendar.shortcuts')}
                  </div>
                </div>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    </div>
  );
};

FloatingAddButton.propTypes = {
  onAddEvent: PropTypes.func.isRequired,
  onMarkOccupied: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default FloatingAddButton;