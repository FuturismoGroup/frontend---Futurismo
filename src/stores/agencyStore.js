/**
 * Store de agencias
 * Maneja el estado global de agencias
 */

import { create } from 'zustand';
import i18next from 'i18next';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import agencyService from '../services/agencyService';
import api from '../services/api';
import {
  DATE_FORMATS,
  DEFAULT_AGENCY,
  STORAGE_CONFIG,
  RESERVATION_STATUS
} from '../constants/agencyConstants';

const useAgencyStore = create(
  persist(
    (set, get) => ({
      // Estado
      currentAgency: null,
      agencies: [], // Lista de todas las agencias (para admin)
      reservations: [],
      pointsTransactions: [],
      availableSlots: {},
      isLoading: false,
      error: null,
      
      // Paginación
      reservationsPagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
      },
      
      transactionsPagination: {
        page: 1,
        pageSize: 50,
        total: 0,
        totalPages: 0
      },
      
      // Filtros
      reservationsFilters: {
        startDate: '',
        endDate: '',
        status: '',
        serviceType: ''
      },
      
      transactionsFilters: {
        startDate: '',
        endDate: '',
        type: ''
      },
      
      // Estadísticas
      stats: null,
      monthlyReport: null,
      yearlyComparison: null,
      // Acciones
      actions: {
        // Inicialización
        initialize: async (agencyId = DEFAULT_AGENCY.ID) => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await agencyService.getAgencyById(agencyId);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            set({
              currentAgency: result.data,
              isLoading: false
            });

            // Cargar datos adicionales
            try {
              await Promise.all([
                get().actions.fetchReservations(),
                get().actions.fetchPointsTransactions().catch(() => {})
              ]);
            } catch {
              // Algunos datos adicionales no pudieron cargarse
            }

            return true;
          } catch (error) {
            set({
              isLoading: false,
              error: error.message
            });
            throw error;
          }
        },

        // Cargar lista de todas las agencias (para admin)
        fetchAgencies: async () => {
          set({ isLoading: true, error: null });

          try {
            const result = await agencyService.getAgencies();

            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }

            set({
              agencies: result.data || [],
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

        // === GESTIÓN DE RESERVAS ===
        fetchReservations: async () => {
          const { currentAgency, reservationsFilters, reservationsPagination } = get();
          
          if (!currentAgency) return;
          
          set({ isLoading: true, error: null });
          
          try {
            const params = {
              ...reservationsFilters,
              page: reservationsPagination.page,
              pageSize: reservationsPagination.pageSize
            };
            
            const result = await agencyService.getReservations(currentAgency.id, params);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            set({
              reservations: result.data.reservations,
              reservationsPagination: {
                page: result.data.page,
                pageSize: result.data.pageSize,
                total: result.data.total,
                totalPages: result.data.totalPages
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
        
        getReservationsByDate: (date) => {
          const { reservations } = get();
          const dateKey = format(new Date(date), DATE_FORMATS.DATE_KEY);
          return reservations.filter(res => res.date === dateKey);
        },
        
        createReservation: async (reservationData) => {
          const { currentAgency } = get();
          
          if (!currentAgency) {
            throw new Error(i18next.t('errors.unexpectedError'));
          }
          
          set({ isLoading: true, error: null });
          
          try {
            const data = {
              ...reservationData,
              agencyId: currentAgency.id
            };
            
            const result = await agencyService.createReservation(data);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            set((state) => ({
              reservations: [result.data, ...state.reservations],
              isLoading: false
            }));
            
            return result.data;
          } catch (error) {
            set({ 
              isLoading: false,
              error: error.message
            });
            throw error;
          }
        },
        
        updateReservation: async (id, updateData) => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await agencyService.updateReservation(id, updateData);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            set((state) => ({
              reservations: state.reservations.map(res => 
                res.id === id ? result.data : res
              ),
              isLoading: false
            }));
            
            // Si se confirmó la reserva, actualizar balance de puntos
            if (updateData.status === RESERVATION_STATUS.CONFIRMED) {
              await get().actions.fetchPointsBalance();
            }
            
            return result.data;
          } catch (error) {
            set({ 
              isLoading: false,
              error: error.message
            });
            throw error;
          }
        },
        
        deleteReservation: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const result = await agencyService.deleteReservation(id);

            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }

            set((state) => ({
              reservations: state.reservations.filter(res => res.id !== id),
              isLoading: false
            }));

            return true;
          } catch (error) {
            set({
              isLoading: false,
              error: error.message
            });
            throw error;
          }
        },

        // API-007: AssignGuideToReservation
        // PATCH /api/reservations/:id/assign-guide
        assignGuideToReservation: async (reservationId, guideId) => {
          set({ isLoading: true, error: null });

          try {
            const result = await agencyService.assignGuideToReservation(reservationId, guideId);

            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }

            // Actualizar la reserva en el estado local
            set((state) => ({
              reservations: state.reservations.map(res =>
                res.id === reservationId
                  ? { ...res, guideId: result.data.guideId, guide: result.data.guide }
                  : res
              ),
              isLoading: false
            }));

            return result.data;
          } catch (error) {
            set({
              isLoading: false,
              error: error.message
            });
            throw error;
          }
        },

        confirmReservation: async (id) => {
          return get().actions.updateReservation(id, { status: RESERVATION_STATUS.CONFIRMED });
        },
        
        cancelReservation: async (id, reason = '') => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await agencyService.cancelReservation(id, reason);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            set((state) => ({
              reservations: state.reservations.map(res => 
                res.id === id ? result.data : res
              ),
              isLoading: false
            }));
            
            return result.data;
          } catch (error) {
            set({ 
              isLoading: false,
              error: error.message
            });
            throw error;
          }
        },
        
        // === REPORTES Y ESTADÍSTICAS ===
        fetchMonthlyReport: async (year, month) => {
          set({ isLoading: true, error: null });

          try {
            // Importar authStore dinámicamente
            const useAuthStore = (await import('./authStore')).useAuthStore;
            const user = useAuthStore.getState().user;

            if (!user) {
              set({ isLoading: false });
              return null;
            }

            // El agencyId viene en camelCase desde el backend
            const agencyId = user.agencyId;

            if (!agencyId) {
              set({ isLoading: false });
              return null;
            }

            const result = await agencyService.getMonthlyReport(agencyId, year, month);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            set({
              monthlyReport: result.data,
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
        
        fetchYearlyComparison: async (year) => {
          set({ isLoading: true, error: null });

          try {
            // Importar authStore dinámicamente
            const useAuthStore = (await import('./authStore')).useAuthStore;
            const user = useAuthStore.getState().user;

            if (!user) {
              set({ isLoading: false });
              return null;
            }

            // El agencyId viene en camelCase desde el backend
            const agencyId = user.agencyId;

            if (!agencyId) {
              set({ isLoading: false });
              return null;
            }

            const result = await agencyService.getYearlyComparison(agencyId, year);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            set({
              yearlyComparison: result.data,
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
        
        // === SISTEMA DE PUNTOS ===
        // API-042: GetPointsTransactions - GET /api/agencies/:id/points/transactions
        fetchPointsTransactions: async () => {
          const { currentAgency, transactionsFilters, transactionsPagination } = get();

          if (!currentAgency) return;

          set({ isLoading: true, error: null });

          try {
            const params = {
              ...transactionsFilters,
              page: transactionsPagination.page,
              pageSize: transactionsPagination.pageSize
            };

            const result = await agencyService.getPointsTransactions(currentAgency.id, params);

            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }

            // API-042 returns { data: [...], total, page, pageSize }
            // Map 'data' to 'transactions' for frontend compatibility
            const transactions = result.data.data || result.data.transactions || result.data || [];

            set({
              pointsTransactions: transactions,
              transactionsPagination: {
                page: result.data.page || 1,
                pageSize: result.data.pageSize || 20,
                total: result.data.total || 0,
                totalPages: result.data.totalPages || Math.ceil((result.data.total || 0) / (result.data.pageSize || 20))
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
        
        fetchPointsBalance: async () => {
          const { currentAgency } = get();

          if (!currentAgency) return;

          try {
            const result = await agencyService.getPointsBalance(currentAgency.id);

            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }

            // API-041 returns: availablePoints, totalPointsEarned, totalPointsRedeemed, currentLevel
            // Map to frontend expected names
            const data = result.data;
            set((state) => ({
              currentAgency: {
                ...state.currentAgency,
                pointsBalance: data.availablePoints ?? data.balance ?? 0,
                totalEarned: data.totalPointsEarned ?? data.totalEarned ?? 0,
                totalRedeemed: data.totalPointsRedeemed ?? data.totalRedeemed ?? 0,
                tier: data.currentLevel ?? data.tier ?? 'BRONZE'
              }
            }));

            return result.data;
          } catch (error) {
            set({ error: error.message });
            throw error;
          }
        },
        
        createPointsTransaction: async (transactionData) => {
          const { currentAgency } = get();
          
          if (!currentAgency) {
            throw new Error(i18next.t('errors.unexpectedError'));
          }
          
          set({ isLoading: true, error: null });
          
          try {
            const data = {
              ...transactionData,
              agencyId: currentAgency.id
            };
            
            const result = await agencyService.createPointsTransaction(data);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            set((state) => ({
              pointsTransactions: [result.data, ...state.pointsTransactions],
              isLoading: false
            }));
            
            // Actualizar balance
            await get().actions.fetchPointsBalance();
            
            return result.data;
          } catch (error) {
            set({ 
              isLoading: false,
              error: error.message
            });
            throw error;
          }
        },
        
        redeemPoints: async (redemptionData) => {
          const { currentAgency } = get();
          
          if (!currentAgency) {
            throw new Error(i18next.t('errors.unexpectedError'));
          }
          
          set({ isLoading: true, error: null });
          
          try {
            const result = await agencyService.redeemPoints(currentAgency.id, redemptionData);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            set((state) => ({
              pointsTransactions: [result.data, ...state.pointsTransactions],
              isLoading: false
            }));
            
            // Actualizar balance
            await get().actions.fetchPointsBalance();
            
            return result.data;
          } catch (error) {
            set({ 
              isLoading: false,
              error: error.message
            });
            throw error;
          }
        },
        
        // === DISPONIBILIDAD ===
        fetchAvailableSlots: async (date) => {
          const { currentAgency } = get();
          
          if (!currentAgency) return [];
          
          try {
            const result = await agencyService.getAvailableSlots(currentAgency.id, date);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            const dateKey = format(new Date(date), DATE_FORMATS.DATE_KEY);
            set((state) => ({
              availableSlots: {
                ...state.availableSlots,
                [dateKey]: result.data
              }
            }));
            
            return result.data;
          } catch (error) {
            set({ error: error.message });
            throw error;
          }
        },
        
        setAvailableSlots: async (date, slots) => {
          const { currentAgency } = get();
          
          if (!currentAgency) return;
          
          set({ isLoading: true, error: null });
          
          try {
            const result = await agencyService.setAvailableSlots(currentAgency.id, date, slots);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            const dateKey = format(new Date(date), DATE_FORMATS.DATE_KEY);
            set((state) => ({
              availableSlots: {
                ...state.availableSlots,
                [dateKey]: result.data
              },
              isLoading: false
            }));
            
            return result.data;
          } catch (error) {
            set({ 
              isLoading: false,
              error: error.message
            });
            throw error;
          }
        },
        
        // === CONFIGURACIÓN DE AGENCIA ===
        updateAgencyProfile: async (updates) => {
          const { currentAgency } = get();
          
          if (!currentAgency) return;
          
          set({ isLoading: true, error: null });
          
          try {
            const result = await agencyService.updateAgency(currentAgency.id, updates);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            set({
              currentAgency: result.data,
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
        
        // === UTILIDADES ===
        fetchAgencyStats: async () => {
          const { currentAgency } = get();
          
          if (!currentAgency) return null;
          
          set({ isLoading: true, error: null });
          
          try {
            const result = await agencyService.getAgencyStats(currentAgency.id);
            
            if (!result.success) {
              throw new Error(result.error || i18next.t('errors.unexpectedError'));
            }
            
            set({
              stats: result.data,
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
        
        // Filtros
        setReservationsFilters: (filters) => {
          set((state) => ({
            reservationsFilters: { ...state.reservationsFilters, ...filters },
            reservationsPagination: { ...state.reservationsPagination, page: 1 }
          }));
          return get().actions.fetchReservations();
        },
        
        setTransactionsFilters: (filters) => {
          set((state) => ({
            transactionsFilters: { ...state.transactionsFilters, ...filters },
            transactionsPagination: { ...state.transactionsPagination, page: 1 }
          }));
          return get().actions.fetchPointsTransactions();
        },
        
        setReservationsPage: (page) => {
          set((state) => ({
            reservationsPagination: { ...state.reservationsPagination, page }
          }));
          return get().actions.fetchReservations();
        },
        
        setTransactionsPage: (page) => {
          set((state) => ({
            transactionsPagination: { ...state.transactionsPagination, page }
          }));
          return get().actions.fetchPointsTransactions();
        },
        
        // === METODOS PARA ADMIN RESERVATIONS ===
        // Obtener todas las reservas (para admin)
        getReservations: () => {
          const { reservations } = get();
          return reservations || [];
        },

        // Calcular puntos para una reservacion
        calculatePointsForReservation: (reservation) => {
          // Logica de calculo de puntos: 1 punto por cada $10
          const totalAmount = parseFloat(reservation?.totalAmount) || 0;
          return Math.floor(totalAmount / 10);
        },

        // Utilidades
        clearError: () => set({ error: null }),
        
        resetStore: () => {
          set({
            currentAgency: null,
            reservations: [],
            pointsTransactions: [],
            availableSlots: {},
            isLoading: false,
            error: null,
            reservationsPagination: {
              page: 1,
              pageSize: 20,
              total: 0,
              totalPages: 0
            },
            transactionsPagination: {
              page: 1,
              pageSize: 50,
              total: 0,
              totalPages: 0
            },
            reservationsFilters: {
              startDate: '',
              endDate: '',
              status: '',
              serviceType: ''
            },
            transactionsFilters: {
              startDate: '',
              endDate: '',
              type: ''
            },
            stats: null,
            monthlyReport: null,
            yearlyComparison: null,
          });
        }
      }
    }),
    {
      name: STORAGE_CONFIG.KEY,
      partialize: (state) => ({
        currentAgency: state.currentAgency,
        reservations: state.reservations,
        pointsTransactions: state.pointsTransactions,
        availableSlots: state.availableSlots
      })
    }
  )
);

export { useAgencyStore };
export default useAgencyStore;