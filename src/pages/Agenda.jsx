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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <CalendarDaysIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Gestión de Agenda
            </h1>
            <p className="text-gray-600 mb-6">
              Esta función está disponible para guías freelance y administradores.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
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