import { useState } from 'react';
import { PlusIcon, ListBulletIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import ReservationWizard from '../components/reservations/ReservationWizard';
import ReservationList from '../components/reservations/ReservationList';
import ReservationCalendar from '../components/reservations/ReservationCalendar';

const Reservations = () => {
  const [view, setView] = useState('list'); // 'list', 'new', 'calendar'
  const [showWizard, setShowWizard] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col -m-4 lg:-m-6">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 text-center sm:text-left break-words">{t('reservations.reservations')}</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setView('list')}
            >
              <ListBulletIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('reservations.list')}</span>
              <span className="sm:hidden">Lista</span>
            </button>
            <button
              className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                view === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setView('calendar')}
            >
              <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('reservations.calendar')}</span>
              <span className="sm:hidden">Calendario</span>
            </button>
          </div>

          <button 
            onClick={() => setShowWizard(true)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="whitespace-nowrap">{t('reservations.newReservation')}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {showWizard ? (
          <ReservationWizard onClose={() => setShowWizard(false)} />
        ) : (
          <>
            {view === 'list' && <ReservationList />}
            
            {view === 'calendar' && (
              <ReservationCalendar 
                onNewReservation={() => setShowWizard(true)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reservations;