import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  EyeSlashIcon,
  CalendarDaysIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import FantasticalLayout from '../calendar/FantasticalLayout';
import CalendarSidebar from '../calendar/Sidebar/CalendarSidebar';
import DayView from '../calendar/Views/DayView';
import WeekView from '../calendar/Views/WeekView';
import MonthView from '../calendar/Views/MonthView';
import QuickAddModal from '../calendar/Input/QuickAddModal';
import FloatingAddButton from '../calendar/Input/FloatingAddButton';
import WorkingHoursModal from '../calendar/Input/WorkingHoursModal';
import QuickEditModal from '../calendar/Input/QuickEditModal';
import useIndependentAgendaStore from '../../stores/independentAgendaStore';
import useAuthStore from '../../stores/authStore';

const FreelancePersonalAgenda = () => {
  const { user } = useAuthStore();
  const { 
    currentView,
    selectedDate,
    actions: { 
      setCurrentView,
      setSelectedDate,
      updateViewPreferences
    }
  } = useIndependentAgendaStore();

  // Estados para modales
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isWorkingHoursModalOpen, setIsWorkingHoursModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalMode, setModalMode] = useState('event'); // 'event' | 'occupied' | 'edit'

  // Funciones para manejar eventos
  const handleAddEvent = (date = null, time = null) => {
    setSelectedTimeSlot({ date, time });
    setModalMode('event');
    setIsAddEventModalOpen(true);
  };

  const handleMarkOccupied = (date = null, time = null) => {
    setSelectedTimeSlot({ date, time });
    setModalMode('occupied');
    setIsAddEventModalOpen(true); // Usamos el mismo modal con modo diferente
  };


  const handleCloseModal = () => {
    setIsAddEventModalOpen(false);
    setSelectedTimeSlot(null);
    setModalMode('event');
  };

  const handleEventClick = (event) => {
    console.log('Event clicked in agenda:', event);
    // Aquí podrías mostrar un popover con detalles del evento
  };

  const handleEventEdit = (event) => {
    console.log('Event edit requested:', event);
    // Abrir modal de edición con datos del evento
    setSelectedEvent(event);
    setIsEditEventModalOpen(true);
  };

  const handleEventSave = (updatedEvent) => {
    console.log('Event saved:', updatedEvent);
    // El store ya se actualiza en QuickEditModal
  };

  const handleEventDelete = (deletedEvent) => {
    console.log('Event deleted:', deletedEvent);
    // El store ya se actualiza en QuickEditModal
  };

  const handleEventDuplicate = (duplicatedEvent) => {
    console.log('Event duplicated:', duplicatedEvent);
    // El store ya se actualiza en QuickEditModal
  };

  // Navegación con fechas
  const navigateToToday = () => {
    setSelectedDate(new Date());
  };

  const navigatePrevious = () => {
    const currentDate = new Date(selectedDate);
    switch (currentView) {
      case 'day':
        currentDate.setDate(currentDate.getDate() - 1);
        break;
      case 'week':
        currentDate.setDate(currentDate.getDate() - 7);
        break;
      case 'month':
        currentDate.setMonth(currentDate.getMonth() - 1);
        break;
    }
    setSelectedDate(currentDate);
  };

  const navigateNext = () => {
    const currentDate = new Date(selectedDate);
    switch (currentView) {
      case 'day':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'week':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'month':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
    setSelectedDate(currentDate);
  };


  const renderCurrentView = () => {
    const commonProps = {
      onTimeSlotClick: handleAddEvent,
      onDateClick: handleAddEvent,
      onEventClick: handleEventClick,
      onEventEdit: handleEventEdit
    };

    switch (currentView) {
      case 'day':
        return <DayView {...commonProps} />;
      case 'week':
        return <WeekView {...commonProps} />;
      case 'month':
        return <MonthView {...commonProps} />;
      default:
        return <DayView {...commonProps} />;
    }
  };

  const quickActions = [
    {
      label: 'Agregar evento personal',
      icon: PlusIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => handleAddEvent()
    },
    {
      label: 'Marcar tiempo ocupado',
      icon: EyeSlashIcon,
      color: 'bg-gray-500 hover:bg-gray-600',
      onClick: () => handleMarkOccupied()
    },
    {
      label: 'Configurar horarios',
      icon: Cog6ToothIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => setIsWorkingHoursModalOpen(true)
    }
  ];

  const sidebar = (
    <div className="h-full flex flex-col">
      <CalendarSidebar />
      
      {/* Acciones rápidas */}
      <div className="p-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Acciones rápidas</h4>
        <div className="space-y-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`
                w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-white text-sm font-medium
                transition-colors ${action.color}
              `}
            >
              <action.icon className="w-4 h-4" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <FantasticalLayout
        sidebar={sidebar}
        viewComponent={renderCurrentView()}
      />

      {/* Botón flotante para agregar eventos */}
      <FloatingAddButton
        onAddEvent={() => handleAddEvent()}
        onMarkOccupied={() => handleMarkOccupied()}
      />

      {/* Modal universal para agregar eventos */}
      <QuickAddModal
        isOpen={isAddEventModalOpen}
        onClose={handleCloseModal}
        selectedDate={selectedTimeSlot?.date}
        selectedTime={selectedTimeSlot?.time}
        mode={modalMode}
      />

      {/* Modal para configurar horarios de trabajo */}
      <WorkingHoursModal
        isOpen={isWorkingHoursModalOpen}
        onClose={() => setIsWorkingHoursModalOpen(false)}
      />

      {/* Modal para edición rápida de eventos */}
      <QuickEditModal
        isOpen={isEditEventModalOpen}
        onClose={() => setIsEditEventModalOpen(false)}
        event={selectedEvent}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        onDuplicate={handleEventDuplicate}
      />

    </>
  );
};

export default FreelancePersonalAgenda;