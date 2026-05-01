import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name || t('calendar.layout.user')}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || t('calendar.layout.userRole')}</p>
              </div>
            </div>
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
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Date navigation */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateDate('prev')}
                  disabled={isLoading}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  aria-label={t('calendar.layout.previousPeriod')}
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                
                <button
                  onClick={goToToday}
                  disabled={isLoading}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('calendar.today')}
                </button>
                
                <button
                  onClick={() => navigateDate('next')}
                  disabled={isLoading}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  aria-label={t('calendar.layout.nextPeriod')}
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Current date title */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {React.createElement(getCurrentViewIcon(), { 
                    className: "w-5 h-5 text-gray-400" 
                  })}
                  <h1 className="text-lg font-semibold text-gray-900 capitalize">
                    {getDateTitle(i18n.language === 'es' ? es : undefined)}
                  </h1>
                </div>
                
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </div>

            {/* View controls */}
            <div className="flex items-center space-x-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {viewOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.key}
                      onClick={() => handleViewChange(option.key)}
                      disabled={isLoading}
                      className={`
                        flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all
                        disabled:opacity-50
                        ${currentView === option.key
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="hidden sm:block">{t(option.label)}</span>
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