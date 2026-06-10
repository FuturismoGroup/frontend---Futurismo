import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { es } from 'date-fns/locale';
import useFantasticalLayout from '../../hooks/useFantasticalLayout';

const FantasticalLayout = ({ sidebar, viewComponent }) => {
  const { t, i18n } = useTranslation();
  const {
    user,
    currentView,
    isLoading,
    viewOptions,
    navigateDate,
    goToToday,
    getDateTitle,
    getCurrentViewIcon,
    handleViewChange
  } = useFantasticalLayout();

  // Estado para abrir el sidebar interno en móvil/tablet (<lg)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Sidebar header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || t('calendar.layout.user')}
            </p>
            <p className="text-xs text-gray-500 capitalize truncate">
              {user?.role || t('calendar.layout.userRole')}
            </p>
          </div>
        </div>
        {/* Botón cerrar solo en móvil */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden p-1.5 -mr-1 rounded-md hover:bg-gray-100 text-gray-500"
          aria-label="Cerrar panel"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar content */}
      <div className="flex-1 overflow-y-auto">
        {sidebar || (
          <div className="p-4">
            <p className="text-sm text-gray-500">{t('calendar.layout.loadingSidebar')}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100dvh-5rem)] sm:h-[calc(100dvh-6rem)] lg:h-[calc(100dvh-7rem)] flex bg-gray-50 relative overflow-hidden rounded-lg">
      {/* Overlay para sidebar móvil */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar móvil (drawer) */}
      <div
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-[80vw] max-w-[18rem]
          bg-white border-r border-gray-200 shadow-xl
          transform transition-transform duration-200 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-hidden={!mobileSidebarOpen}
      >
        {sidebarContent}
      </div>

      {/* Sidebar desktop (persistente >=lg) */}
      <div className="hidden lg:block w-64 bg-white border-r border-gray-200 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main header */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Botón hamburguesa móvil + navegación de fecha */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 text-gray-600 flex-shrink-0"
                aria-label="Abrir panel"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => navigateDate('prev')}
                  disabled={isLoading}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  aria-label={t('calendar.layout.previousPeriod')}
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>

                <button
                  onClick={goToToday}
                  disabled={isLoading}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('calendar.today')}
                </button>

                <button
                  onClick={() => navigateDate('next')}
                  disabled={isLoading}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  aria-label={t('calendar.layout.nextPeriod')}
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Título de fecha actual */}
              <div className="flex items-center gap-2 min-w-0">
                {React.createElement(getCurrentViewIcon(), {
                  className: 'w-5 h-5 text-gray-400 hidden sm:block flex-shrink-0'
                })}
                <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 capitalize truncate">
                  {getDateTitle(i18n.language === 'es' ? es : undefined)}
                </h1>

                {isLoading && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                )}
              </div>
            </div>

            {/* Controles de vista */}
            <div className="flex items-center flex-shrink-0">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {viewOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.key}
                      onClick={() => handleViewChange(option.key)}
                      disabled={isLoading}
                      className={`
                        flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all
                        disabled:opacity-50
                        ${currentView === option.key
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                      aria-label={t(option.label)}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="hidden sm:inline">{t(option.label)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <div
            className={`
              h-full transition-opacity duration-150
              ${isLoading ? 'opacity-50' : 'opacity-100'}
            `}
          >
            {viewComponent || (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-gray-500">{t('calendar.layout.loadingView')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-5 z-50 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">{t('common.loading')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

FantasticalLayout.propTypes = {
  sidebar: PropTypes.node,
  viewComponent: PropTypes.node
};

export default FantasticalLayout;
