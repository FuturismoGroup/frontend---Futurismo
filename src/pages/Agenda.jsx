import React from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import FreelancePersonalAgenda from '../components/agenda/FreelancePersonalAgenda';
import AdminAvailabilityView from '../components/agenda/AdminAvailabilityView';
import useAuthStore from '../stores/authStore';

const Agenda = () => {
  const { user } = useAuthStore();

  // Verificar el tipo de usuario
  const isFreelanceGuide = user?.role === 'guide' && user?.guideType === 'freelance';
  const isAdmin = user?.role === 'admin' || user?.role === 'administrator';

  if (!isFreelanceGuide && !isAdmin) {
    return (
      <div className="w-full">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 lg:p-8 text-center">
            <CalendarDaysIcon className="mx-auto h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-gray-400 mb-3 sm:mb-4" />
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
              Gestión de Agenda
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Esta función está disponible para guías freelance y administradores.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-left">
              <div className="flex items-start gap-2 sm:gap-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-blue-800 min-w-0">
                  <p className="font-medium mb-1">Acceso a la Agenda</p>
                  <p>
                    Los guías freelance pueden gestionar su disponibilidad y horarios
                    desde esta sección. Los administradores pueden coordinar y visualizar
                    las agendas de todos los guías freelance. Los guías de planta tienen
                    horarios fijos gestionados por el administrador.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Agenda Component con layout completo estilo Fantastical */}
      {isFreelanceGuide ? <FreelancePersonalAgenda /> : <AdminAvailabilityView />}
    </>
  );
};

export default Agenda;