import { create } from 'zustand';
import i18next from 'i18next';
import { devtools, persist } from 'zustand/middleware';
import { format, startOfDay, endOfDay, isWithinInterval, parseISO, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import independentAgendaService from '../services/independentAgendaService';
import guidesService from '../services/guidesService';

const VISIBILITY_LEVELS = {
  PRIVATE: 'private',        // Solo el guía lo ve
  OCCUPIED: 'occupied',      // Admin ve "ocupado" sin detalles  
  COMPANY: 'company',        // Todos ven detalles (tours oficiales)
  PUBLIC: 'public'           // Cliente puede ver disponibilidad
};

const EVENT_TYPES = {
  PERSONAL: 'personal',
  COMPANY_TOUR: 'company_tour', 
  OCCUPIED: 'occupied',
  AVAILABLE: 'available'
};

// Estado inicial vacío - se cargará desde el servicio
const initialState = {
  personalEvents: {},
  assignedTours: {},
  workingHours: {}
};

/**
 * Valida y convierte un valor a fecha válida
 * @param {any} date - Valor a convertir a fecha
 * @returns {Date} - Fecha válida o fecha actual si es inválida
 */
const toValidDate = (date) => {
  if (!date) return new Date();

  const dateObj = date instanceof Date ? date : new Date(date);

  // Verificar si es una fecha válida
  if (isNaN(dateObj.getTime())) {
    return new Date();
  }

  return dateObj;
};

const useIndependentAgendaStore = create(
  persist(
    devtools(
      (set, get) => ({
          // Estado principal
          currentView: 'week', // day, week, month, year
          selectedDate: toValidDate(new Date()),
          currentGuide: null, // Se cargará dinámicamente el primer guía disponible
          
          // Eventos personales del guía (privados)
          personalEvents: initialState.personalEvents,
          
          // Estados de disponibilidad por guía
          availabilitySlots: {},
          
          // Tours asignados por empresa (compartidos)
          assignedTours: initialState.assignedTours,
          
          // Horarios de trabajo por guía
          workingHours: initialState.workingHours,
          
          // Configuración de vista
          viewPreferences: {
            showWeekends: true,
            workingHoursOnly: false,
            timeFormat: '24h',
            firstDayOfWeek: 1 // Lunes
          },
          
          // Estados de carga y error
          isLoading: false,
          error: null,

          // Timestamp para forzar refresh de vistas después de crear/editar eventos
          lastEventUpdate: 0,
        
          // Acciones principales
          actions: {
          // === NAVEGACIÓN Y VISTAS ===
          setCurrentView: (view) => set({ currentView: view }),

          setSelectedDate: (date) => set({ selectedDate: toValidDate(date) }),

          setCurrentGuide: (guideId) => set({ currentGuide: guideId }),

          // === CARGA INICIAL DE GUÍA ===
          loadDefaultGuide: async () => {
            const { currentGuide } = get();

            // Si ya hay un guía seleccionado (persist lo guardó), no hacer nada
            if (currentGuide) {
              return currentGuide;
            }

            try {
              // Cargar el primer guía FREELANCE disponible activo
              // Solo guías freelance tienen agenda independiente
              const result = await guidesService.getGuides({
                pageSize: 1,
                page: 1,
                status: 'active',
                guideType: 'FREELANCE'
              });

              // La respuesta viene en result.data.guides, no result.data
              if (result.success && result.data?.guides?.length > 0) {
                const firstGuide = result.data.guides[0];
                set({ currentGuide: firstGuide.id });
                return firstGuide.id;
              }

              // Si no hay guías freelance, mantener null
              return null;
            } catch {
              // No se pudo cargar guía por defecto
              return null;
            }
          },
          
          // === EVENTOS PERSONALES (SOLO GUÍA) ===
          addPersonalEvent: async (guideId, event) => {
            set({ isLoading: true, error: null });

            try {
              const result = await independentAgendaService.createPersonalEvent(guideId, event);

              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }

              const { personalEvents } = get();
              const dateKey = result.data.date;

              set({
                personalEvents: {
                  ...personalEvents,
                  [guideId]: {
                    ...personalEvents[guideId],
                    [dateKey]: [
                      ...(personalEvents[guideId]?.[dateKey] || []),
                      result.data
                    ]
                  }
                },
                isLoading: false,
                lastEventUpdate: Date.now() // Trigger refresh en las vistas
              });

              return result.data;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          updatePersonalEvent: async (guideId, eventId, updates) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.updatePersonalEvent(guideId, eventId, updates);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              const { personalEvents } = get();
              const guideEvents = personalEvents[guideId] || {};
              
              const updatedEvents = {};
              Object.entries(guideEvents).forEach(([dateKey, events]) => {
                updatedEvents[dateKey] = events.map(event => 
                  event.id === eventId ? result.data : event
                );
              });
              
              // Si cambió la fecha, mover el evento
              if (updates.date && updates.date !== result.data.date) {
                const oldDate = Object.keys(guideEvents).find(date => 
                  guideEvents[date].some(e => e.id === eventId)
                );
                if (oldDate) {
                  updatedEvents[oldDate] = updatedEvents[oldDate].filter(e => e.id !== eventId);
                  if (!updatedEvents[result.data.date]) {
                    updatedEvents[result.data.date] = [];
                  }
                  updatedEvents[result.data.date].push(result.data);
                }
              }
              
              set({
                personalEvents: {
                  ...personalEvents,
                  [guideId]: updatedEvents
                },
                isLoading: false
              });
              
              return result.data;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          deletePersonalEvent: async (guideId, eventId) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.deletePersonalEvent(guideId, eventId);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              const { personalEvents } = get();
              const guideEvents = personalEvents[guideId] || {};
              
              const updatedEvents = {};
              Object.entries(guideEvents).forEach(([dateKey, events]) => {
                updatedEvents[dateKey] = events.filter(event => event.id !== eventId);
              });
              
              set({
                personalEvents: {
                  ...personalEvents,
                  [guideId]: updatedEvents
                },
                isLoading: false
              });
              
              return true;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          // === TIEMPO OCUPADO (VISIBLE PARA ADMIN COMO "OCUPADO") ===
          markTimeAsOccupied: async (guideId, timeSlot) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.markTimeAsOccupied(guideId, timeSlot);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              const { personalEvents } = get();
              const dateKey = result.data.date;
              
              set({
                personalEvents: {
                  ...personalEvents,
                  [guideId]: {
                    ...personalEvents[guideId],
                    [dateKey]: [
                      ...(personalEvents[guideId]?.[dateKey] || []),
                      result.data
                    ]
                  }
                },
                isLoading: false
              });
              
              return result.data;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          // === HORARIOS DE TRABAJO ===
          setWorkingHours: async (guideId, schedule) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.updateWorkingHours(guideId, schedule);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              const { workingHours } = get();
              set({
                workingHours: {
                  ...workingHours,
                  [guideId]: result.data
                },
                isLoading: false
              });
              
              return result.data;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          loadWorkingHours: async (guideId) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.getWorkingHours(guideId);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              const { workingHours } = get();
              set({
                workingHours: {
                  ...workingHours,
                  [guideId]: result.data
                },
                isLoading: false
              });
              
              return result.data;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          // === TOURS ASIGNADOS POR EMPRESA ===
          assignTourToGuide: async (guideId, tour) => {
            set({ isLoading: true, error: null });

            try {
              const result = await independentAgendaService.assignTourToGuide(guideId, tour);

              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }

              const { assignedTours } = get();
              const dateKey = result.data.date;

              set({
                assignedTours: {
                  ...assignedTours,
                  [guideId]: {
                    ...assignedTours[guideId],
                    [dateKey]: [
                      ...(assignedTours[guideId]?.[dateKey] || []),
                      result.data
                    ]
                  }
                },
                isLoading: false,
                lastEventUpdate: Date.now() // Trigger refresh en las vistas del calendario
              });

              return result.data;
            } catch (error) {
              set({
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          updateAssignedTour: async (guideId, tourId, updates) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.updateAssignedTour(guideId, tourId, updates);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              const { assignedTours } = get();
              const guideTours = assignedTours[guideId] || {};
              
              const updatedTours = {};
              Object.entries(guideTours).forEach(([dateKey, tours]) => {
                updatedTours[dateKey] = tours.map(tour => 
                  tour.id === tourId ? result.data : tour
                );
              });
              
              // Si cambió la fecha, mover el tour
              if (updates.date && updates.date !== result.data.date) {
                const oldDate = Object.keys(guideTours).find(date => 
                  guideTours[date].some(t => t.id === tourId)
                );
                if (oldDate) {
                  updatedTours[oldDate] = updatedTours[oldDate].filter(t => t.id !== tourId);
                  if (!updatedTours[result.data.date]) {
                    updatedTours[result.data.date] = [];
                  }
                  updatedTours[result.data.date].push(result.data);
                }
              }
              
              set({
                assignedTours: {
                  ...assignedTours,
                  [guideId]: updatedTours
                },
                isLoading: false
              });
              
              return result.data;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          // === VISTA COMPLETA PARA GUÍA ===
          getGuideCompleteAgenda: async (guideId, filters = {}) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.getGuideCompleteAgenda(guideId, filters);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              set({ isLoading: false });
              
              return result.data;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          // === CARGAR DATOS DE AGENDA ===
          loadPersonalEvents: async (guideId, filters = {}) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.getPersonalEvents(guideId, filters);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              // Organizar eventos por fecha
              const eventsByDate = {};
              result.data.forEach(event => {
                if (!eventsByDate[event.date]) {
                  eventsByDate[event.date] = [];
                }
                eventsByDate[event.date].push(event);
              });
              
              const { personalEvents } = get();
              set({
                personalEvents: {
                  ...personalEvents,
                  [guideId]: eventsByDate
                },
                isLoading: false
              });
              
              return result.data;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          loadAssignedTours: async (guideId, filters = {}) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.getAssignedTours(guideId, filters);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              // Organizar tours por fecha
              const toursByDate = {};
              result.data.forEach(tour => {
                if (!toursByDate[tour.date]) {
                  toursByDate[tour.date] = [];
                }
                toursByDate[tour.date].push(tour);
              });
              
              const { assignedTours } = get();
              set({
                assignedTours: {
                  ...assignedTours,
                  [guideId]: toursByDate
                },
                isLoading: false
              });
              
              return result.data;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          // === GESTIÓN DE PREFERENCIAS ===
          updateViewPreferences: (preferences) => {
            const { viewPreferences } = get();
            set({
              viewPreferences: {
                ...viewPreferences,
                ...preferences
              }
            });
          },
          
          // === VERIFICACIÓN DE CONFLICTOS ===
          checkScheduleConflicts: async (guideId, eventData) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.checkScheduleConflicts(guideId, eventData);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              set({ isLoading: false });
              
              return result.data;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          // === UTILIDADES ===
          getEventsForDateRange: async (guideId, startDate, endDate) => {
            set({ isLoading: true, error: null });
            
            try {
              const filters = {
                startDate: format(new Date(startDate), 'yyyy-MM-dd'),
                endDate: format(new Date(endDate), 'yyyy-MM-dd')
              };
              
              const result = await independentAgendaService.getGuideCompleteAgenda(guideId, filters);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              set({ isLoading: false });
              
              return result.data.events || [];
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          // === EXPORTACIÓN ===
          exportAgenda: async (guideId, options = {}) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.exportAgenda(guideId, options);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              // Descargar archivo
              if (result.data.content) {
                const blob = new Blob([result.data.content], { type: result.data.mimeType });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = result.data.filename;
                link.click();
                URL.revokeObjectURL(url);
              }
              
              set({ isLoading: false });
              
              return result;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          // === LIMPIEZA Y MANTENIMIENTO ===
          clearOldEvents: async (guideId, daysToKeep = 30) => {
            set({ isLoading: true, error: null });
            
            try {
              const result = await independentAgendaService.clearOldEvents(guideId, daysToKeep);
              
              if (!result.success) {
                throw new Error(result.error || i18next.t('errors.unexpectedError'));
              }
              
              // Recargar datos después de limpiar
              await Promise.all([
                get().actions.loadPersonalEvents(guideId),
                get().actions.loadAssignedTours(guideId)
              ]);
              
              set({ isLoading: false });
              
              return result;
            } catch (error) {
              set({ 
                isLoading: false,
                error: error.message
              });
              throw error;
            }
          },
          
          // === UTILIDADES ADICIONALES ===
          clearError: () => set({ error: null }),
          
          resetStore: () => {
            set({
              currentView: 'week',
              selectedDate: toValidDate(new Date()),
              currentGuide: null,
              personalEvents: {},
              availabilitySlots: {},
              assignedTours: {},
              workingHours: {},
              viewPreferences: {
                showWeekends: true,
                workingHoursOnly: false,
                timeFormat: '24h',
                firstDayOfWeek: 1
              },
              isLoading: false,
              error: null
            });
          }
        }
      }),
    { 
      name: 'IndependentAgendaStore' 
    }
  ),
  {
    name: 'independent-agenda-store',
    version: 3, // v3: solo persistir preferencias, no datos de eventos (se cargan desde API)
    partialize: (state) => ({
      currentGuide: state.currentGuide,
      currentView: state.currentView,
      viewPreferences: state.viewPreferences
    })
  }
));

export default useIndependentAgendaStore;
export { VISIBILITY_LEVELS, EVENT_TYPES };