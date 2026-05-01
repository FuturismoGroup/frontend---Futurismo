import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ClockIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  EyeIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FantasticalLayout from '../calendar/FantasticalLayout';
import CalendarSidebar from '../calendar/Sidebar/CalendarSidebar';
import DayView from '../calendar/Views/DayView';
import WeekView from '../calendar/Views/WeekView';
import MonthView from '../calendar/Views/MonthView';
import useIndependentAgendaStore from '../../stores/independentAgendaStore';
import useAuthStore from '../../stores/authStore';
import useGuidesStore from '../../stores/guidesStore';
import { useTranslation } from 'react-i18next';

const AdminAvailabilityView = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    currentView,
    currentGuide,
    selectedDate,
    actions: {
      assignTourToGuide,
      setCurrentGuide,
      loadDefaultGuide,
      getGuideCompleteAgenda
    }
  } = useIndependentAgendaStore();

  const { guides: guidesData, fetchGuides, setFilters } = useGuidesStore();

  const [isAssignTourModalOpen, setIsAssignTourModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [tourForm, setTourForm] = useState({
    title: '',
    client: '',
    location: '',
    duration: 4,
    description: '',
    price: '',
    status: 'confirmed'
  });

  // Load FREELANCE guides from API (only freelance guides have independent agendas)
  useEffect(() => {
    setFilters({ guideType: 'FREELANCE', status: 'active' });
  }, [setFilters]);

  // Transform guides data from API
  const guides = (guidesData || []).map(guide => ({
    id: guide.id,
    userId: guide.user?.id || guide.userId,
    name: guide.name || `${guide.firstName || ''} ${guide.lastName || ''}`.trim(),
    online: guide.isOnline || guide.online || false,
    role: guide.type || guide.guideType || 'freelance',
    phone: guide.phone || guide.phoneNumber || 'N/A',
    specialities: guide.specialities || guide.specializations || [],
    rating: guide.rating || guide.averageRating || 0,
    avatar: guide.avatar || guide.profileImage || ''
  }));

  const currentGuideInfo = guides.find(g => g.id === currentGuide) || guides[0];

  useEffect(() => {
    // Cargar guía por defecto si no hay ninguno seleccionado
    if (!currentGuide) {
      loadDefaultGuide();
    }
  }, [currentGuide, loadDefaultGuide]);

  // Función para abrir chat con el guía (usa userId = users.id, NO guide.id)
  const handleChatWithGuide = (guide) => {
    const chatUserId = guide.userId || guide.id;
    const chatUrl = `/chat?guide=${chatUserId}&name=${encodeURIComponent(guide.name)}`;
    navigate(chatUrl);
  };

  // Función para llamar al guía
  const handleCallGuide = (guide) => {
    window.location.href = `tel:${guide.phone}`;
  };

  // Detectar conflictos de horario antes de asignar
  const checkConflicts = async (dateStr, startTime, duration) => {
    if (!currentGuide) return null;
    try {
      const result = await getGuideCompleteAgenda(currentGuide, {
        startDate: dateStr,
        endDate: dateStr
      });
      const events = result?.data?.allEvents || result?.allEvents || [];
      const [sh, sm] = startTime.split(':').map(Number);
      const newStart = sh * 60 + sm;
      const newEnd = newStart + (duration || 4) * 60;

      const conflicts = events.filter(event => {
        if (!event.startTime || !event.endTime) return false;
        const [esh, esm] = event.startTime.split(':').map(Number);
        const [eeh, eem] = event.endTime.split(':').map(Number);
        const evStart = esh * 60 + esm;
        const evEnd = eeh * 60 + eem;
        return newStart < evEnd && newEnd > evStart;
      });
      return conflicts.length > 0 ? conflicts : null;
    } catch {
      return null;
    }
  };

  const handleAssignTour = async () => {
    if (!tourForm.title?.trim()) {
      toast.error(t('validation.tourNameRequired'));
      return;
    }
    if (!selectedTimeSlot) {
      toast.error(t('validation.noScheduleSelected'));
      return;
    }
    if (!currentGuide) {
      toast.error(t('validation.guideNotSelected'));
      return;
    }

    const dateStr = format(selectedTimeSlot.date, 'yyyy-MM-dd');

    // Detectar conflictos (solo la primera vez, no si ya se confirmó)
    if (!conflictWarning) {
      setIsSubmitting(true);
      const conflicts = await checkConflicts(dateStr, selectedTimeSlot.startTime, tourForm.duration);
      setIsSubmitting(false);
      if (conflicts) {
        setConflictWarning(conflicts);
        return; // Mostrar warning, no asignar aún
      }
    }

    setIsSubmitting(true);
    setConflictWarning(null);

    try {
      const newTour = {
        title: tourForm.title.trim(),
        client: tourForm.client?.trim() || '',
        location: tourForm.location?.trim() || '',
        description: tourForm.description?.trim() || '',
        date: dateStr,
        time: selectedTimeSlot.startTime,
        duration: tourForm.duration || 4,
        price: tourForm.price ? parseFloat(tourForm.price) : null,
        status: tourForm.status || 'confirmed'
      };

      await assignTourToGuide(currentGuide, newTour);
      toast.success(t('agenda.admin.assignSuccess', { name: currentGuideInfo?.name }));

      setTourForm({
        title: '', client: '', location: '', duration: 4,
        description: '', price: '', status: 'confirmed'
      });
      setSelectedTimeSlot(null);
      setIsAssignTourModalOpen(false);
    } catch (error) {
      console.error('Error al asignar tour:', error);
      toast.error(error.message || t('agenda.admin.assignError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeSlotSelect = (date, timeString) => {
    // Convertir timeString a objeto de slot
    const [hours, minutes] = timeString.split(':').map(Number);
    const endHours = hours + tourForm.duration;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    const timeSlot = {
      date: date,
      startTime: timeString,
      endTime: endTime
    };
    
    setSelectedTimeSlot(timeSlot);
    setIsAssignTourModalOpen(true);
  };

  const handleEventClick = (event) => {
    setSelectedEventDetail(event);
  };

  const handleDateClick = (date) => {
    // Reservado para futuro: cambiar a vista día
  };

  const renderCurrentView = () => {
    const commonProps = {
      onTimeSlotClick: handleTimeSlotSelect,
      onDateClick: handleDateClick,
      onEventClick: handleEventClick
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

  const sidebar = (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <CalendarSidebar hideGuides hideFilters />
      </div>

      {/* Info del guía seleccionado */}
      {currentGuideInfo && (
        <div className="flex-shrink-0 p-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">{t('agenda.admin.guideSelected')}</h4>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {currentGuideInfo.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                {currentGuideInfo.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                )}
              </div>
              
              <div className="flex-1">
                <p className="font-medium text-gray-900">{currentGuideInfo.name}</p>
                <p className="text-xs text-gray-500">⭐ {currentGuideInfo.rating}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <span>📱</span>
                <span>{currentGuideInfo.phone}</span>
              </div>
              {currentGuideInfo.specialities && currentGuideInfo.specialities.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>{currentGuideInfo.specialities.join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2 mt-3">
              <button 
                onClick={() => handleChatWithGuide(currentGuideInfo)}
                className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-3 h-3" />
                <span>Chat</span>
              </button>
              <button 
                onClick={() => handleCallGuide(currentGuideInfo)}
                className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
              >
                <PhoneIcon className="w-3 h-3" />
                <span>{t('agenda.admin.call')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de guías freelance */}
      <div className="p-4 border-t border-gray-100 flex-1 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t('agenda.admin.freelanceGuides')}</h4>
        {guides.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">{t('agenda.admin.noFreelanceGuides')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('agenda.admin.onlyFreelanceGuides')}</p>
          </div>
        ) : null}
        <div className="space-y-2">
          {guides.map(guide => (
            <div
              key={guide.id}
              className={`w-full rounded-lg border transition-colors ${
                currentGuide === guide.id 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <button
                onClick={() => setCurrentGuide(guide.id)}
                className="w-full flex items-center space-x-2 p-2 text-left"
              >
                <div className="relative">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {guide.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  {guide.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 border border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{guide.name}</p>
                  <p className="text-xs text-gray-500">⭐ {guide.rating}</p>
                </div>
              </button>
              
              {/* Botones de acción rápida */}
              <div className="flex space-x-1 px-2 pb-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChatWithGuide(guide);
                  }}
                  className="flex-1 flex items-center justify-center space-x-1 px-1 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                  title={t('agenda.admin.chatWith', { name: guide.name })}
                >
                  <ChatBubbleLeftRightIcon className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCallGuide(guide);
                  }}
                  className="flex-1 flex items-center justify-center space-x-1 px-1 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                  title={t('agenda.admin.callTo', { name: guide.name })}
                >
                  <PhoneIcon className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">{t('agenda.admin.call')}</span>
                </button>
              </div>
            </div>
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

      {/* Modal Asignar Tour */}
      <Transition appear show={isAssignTourModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsAssignTourModalOpen}>
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
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    {t('agenda.admin.assignTourTo', { name: currentGuideInfo?.name })}
                  </Dialog.Title>

                  {selectedTimeSlot && (() => {
                    // Calcular endTime dinámicamente basado en la duración actual
                    const [startHours, startMinutes] = selectedTimeSlot.startTime.split(':').map(Number);
                    const endHours = startHours + (tourForm.duration || 4);
                    const dynamicEndTime = `${String(endHours).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;

                    return (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          📅 {format(selectedTimeSlot.date, 'EEEE, d \'de\' MMMM', { locale: es })}
                        </p>
                        <p className="text-sm text-blue-600">
                          🕒 {selectedTimeSlot.startTime} - {dynamicEndTime}
                        </p>
                      </div>
                    );
                  })()}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('agenda.admin.tourName')} *
                      </label>
                      <input
                        type="text"
                        value={tourForm.title}
                        onChange={(e) => setTourForm({...tourForm, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('agenda.admin.tourNamePlaceholder')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('agenda.admin.client')}
                        </label>
                        <input
                          type="text"
                          value={tourForm.client}
                          onChange={(e) => setTourForm({...tourForm, client: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={t('agenda.admin.clientPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('agenda.admin.durationHours')}
                        </label>
                        <input
                          type="number"
                          value={tourForm.duration}
                          onChange={(e) => setTourForm({...tourForm, duration: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="12"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('agenda.admin.locationMeetingPoint')}
                      </label>
                      <input
                        type="text"
                        value={tourForm.location}
                        onChange={(e) => setTourForm({...tourForm, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('agenda.admin.locationPlaceholder')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('agenda.admin.priceSoles')}
                        </label>
                        <input
                          type="number"
                          value={tourForm.price}
                          onChange={(e) => setTourForm({...tourForm, price: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('agenda.admin.initialStatus')}
                        </label>
                        <select
                          value={tourForm.status}
                          onChange={(e) => setTourForm({...tourForm, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">{t('agenda.admin.statusPending')}</option>
                          <option value="confirmed">{t('agenda.admin.statusConfirmed')}</option>
                          <option value="tentative">{t('agenda.admin.statusTentative')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('agenda.admin.descriptionNotes')}
                      </label>
                      <textarea
                        value={tourForm.description}
                        onChange={(e) => setTourForm({...tourForm, description: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('agenda.admin.descriptionPlaceholder')}
                      />
                    </div>
                  </div>

                  {/* Conflict warning */}
                  {conflictWarning && (
                    <div className="mt-4 bg-amber-50 border border-amber-300 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            {t('agenda.admin.conflictDetected')}
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            {t('agenda.admin.guideHasEvents', { count: conflictWarning.length })}
                          </p>
                          <ul className="mt-1 space-y-1">
                            {conflictWarning.map((c, i) => (
                              <li key={i} className="text-xs text-amber-700">
                                - {c.title || t('agenda.admin.timeOccupied')} ({c.startTime} - {c.endTime})
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-amber-600 mt-2 font-medium">
                            {t('agenda.admin.pressAssignAnyway')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                      onClick={() => { setIsAssignTourModalOpen(false); setConflictWarning(null); }}
                      disabled={isSubmitting}
                    >
                      {t('agenda.admin.cancel')}
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        conflictWarning
                          ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                          : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      }`}
                      onClick={handleAssignTour}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t('agenda.admin.verifying') : conflictWarning ? t('agenda.admin.assignAnyway') : t('agenda.admin.assignTour')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Detalle de Evento (solo lectura) */}
      <Transition appear show={!!selectedEventDetail} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedEventDetail(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-xl bg-white p-5 text-left shadow-xl transition-all">
                  {selectedEventDetail && (() => {
                    const evt = selectedEventDetail;
                    const isPrivate = evt.isPrivate || evt.visibility === 'occupied' || evt.visibility === 'private';
                    const isMarketplace = evt.source === 'marketplace' || evt.eventType === 'marketplace_service' || evt.eventType === 'marketplace_pending';
                    const typeLabels = {
                      assigned_tour: t('agenda.admin.typeLabels.assigned_tour'),
                      company_tour: t('agenda.admin.typeLabels.company_tour'),
                      personal: t('agenda.admin.typeLabels.personal'),
                      occupied: t('agenda.admin.typeLabels.occupied'),
                      marketplace_service: t('agenda.admin.typeLabels.marketplace_service'),
                      marketplace_pending: t('agenda.admin.typeLabels.marketplace_pending')
                    };
                    const typeLabel = typeLabels[evt.eventType || evt.type] || t('agenda.admin.typeLabels.event');
                    const statusLabels = {
                      pending: t('agenda.admin.statusPending'),
                      accepted: t('agenda.admin.statusAccepted'),
                      completed: t('agenda.admin.statusCompleted'),
                      confirmed: t('agenda.admin.statusConfirmed'),
                      in_progress: t('agenda.admin.statusInProgress')
                    };

                    return (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: evt.color || '#6B7280' }}
                            />
                            <Dialog.Title className="text-base font-semibold text-gray-900">
                              {isPrivate ? t('agenda.admin.timeOccupied') : (evt.title || t('agenda.admin.untitled'))}
                            </Dialog.Title>
                          </div>
                          <button
                            onClick={() => setSelectedEventDetail(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600 flex-wrap gap-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              isMarketplace ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'
                            }`}>
                              {typeLabel}
                            </span>
                            {isPrivate && (
                              <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">
                                {t('agenda.admin.guidePrivate')}
                              </span>
                            )}
                            {evt.eventType === 'marketplace_pending' && (
                              <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                                {t('agenda.admin.waitingGuideResponse')}
                              </span>
                            )}
                          </div>

                          {evt.date && (
                            <div className="flex items-center space-x-2 text-gray-700">
                              <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                              <span>{evt.date}</span>
                            </div>
                          )}

                          {evt.startTime && (
                            <div className="flex items-center space-x-2 text-gray-700">
                              <ClockIcon className="w-4 h-4 text-gray-400" />
                              <span>{evt.startTime} - {evt.endTime || '?'}</span>
                            </div>
                          )}

                          {isMarketplace && evt.agency && (
                            <div className="flex items-center space-x-2 text-gray-700">
                              <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                              <span>{evt.agency}</span>
                            </div>
                          )}

                          {isMarketplace && evt.location && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <MapPinIcon className="w-4 h-4 text-gray-400" />
                              <span>{evt.location}</span>
                            </div>
                          )}

                          {isMarketplace && evt.price != null && (
                            <div className="flex items-center space-x-2 text-gray-700">
                              <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                              <span>S/. {Number(evt.price).toFixed(2)}</span>
                            </div>
                          )}

                          {!isPrivate && !isMarketplace && evt.description && (
                            <div className="flex items-start space-x-2 text-gray-600">
                              <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                              <span>{evt.description}</span>
                            </div>
                          )}

                          {(evt.passengers || evt.groupSize) && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <UserGroupIcon className="w-4 h-4 text-gray-400" />
                              <span>{evt.passengers || evt.groupSize} {t('agenda.admin.passengers')}</span>
                            </div>
                          )}

                          {evt.status && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <EyeIcon className="w-4 h-4 text-gray-400" />
                              <span>{statusLabels[evt.status] || evt.status}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-5 flex justify-end">
                          <button
                            onClick={() => setSelectedEventDetail(null)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                            {t('agenda.admin.close')}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default AdminAvailabilityView;