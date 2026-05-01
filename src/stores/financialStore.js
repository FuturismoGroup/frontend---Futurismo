import { create } from 'zustand';
import i18next from 'i18next';
import { financialService } from '../services/financialService';

const useFinancialStore = create((set, get) => ({
  // Estado
  expenses: [],
  income: [],
  calculations: [],
  categories: [],
  incomeTypes: [],
  financialStats: null,
  trends: [],
  budgetAnalysis: null,

  // Filtros y paginación para gastos
  expenseFilters: {
    category: 'all',
    tourId: '',
    startDate: '',
    endDate: '',
    search: ''
  },
  expensePagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },

  // Filtros y paginación para ingresos
  incomeFilters: {
    type: 'all',
    tourId: '',
    startDate: '',
    endDate: '',
    search: ''
  },
  incomePagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },

  // Paginación para cálculos
  calculationsPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },

  // Estados de carga y error
  isLoading: false,
  isLoadingCalculations: false,
  error: null,
  hasInitialized: false,
  currentGuideId: null,

  // Acciones de inicialización
  initialize: async (guideId) => {
    console.log('[FinancialStore] Initializing with guideId:', guideId);
    const { hasInitialized } = get();
    if (hasInitialized && get().currentGuideId === guideId) {
      console.log('[FinancialStore] Already initialized, skipping');
      return;
    }
    
    set({ isLoading: true, error: null, currentGuideId: guideId });
    
    try {
      // Cargar categorías y tipos
      console.log('[FinancialStore] Loading categories and income types...');
      const [categoriesResult, incomeTypesResult] = await Promise.all([
        financialService.getExpenseCategories(),
        financialService.getIncomeTypes()
      ]);
      console.log('[FinancialStore] Categories result:', categoriesResult);
      console.log('[FinancialStore] Income types result:', incomeTypesResult);
      
      if (!categoriesResult.success) {
        throw new Error(categoriesResult.error || i18next.t('errors.unexpectedError'));
      }
      
      if (!incomeTypesResult.success) {
        throw new Error(incomeTypesResult.error || i18next.t('errors.unexpectedError'));
      }
      
      // Cargar datos iniciales
      console.log('[FinancialStore] Loading initial data...');
      await Promise.all([
        get().loadExpenses({ guideId }),
        get().loadIncome({ guideId }),
        get().loadFinancialStats({ guideId })
      ]);
      console.log('[FinancialStore] Initial data loaded successfully');
      
      set({
        categories: categoriesResult.data,
        incomeTypes: incomeTypesResult.data,
        isLoading: false,
        hasInitialized: true
      });
      console.log('[FinancialStore] Initialization completed successfully');
    } catch (error) {
      console.error('[FinancialStore] Initialization error:', error);
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Acciones para gastos
  loadExpenses: async (customFilters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const { expenseFilters, expensePagination, currentGuideId } = get();
      // Fallback defensivo para paginación
      const safePagination = expensePagination || { page: 1, limit: 10 };
      const combinedFilters = {
        ...expenseFilters,
        ...customFilters,
        guideId: customFilters.guideId || currentGuideId,
        page: customFilters.page || safePagination.page || 1,
        limit: customFilters.limit || safePagination.limit || 10
      };
      
      const result = await financialService.getExpenses(combinedFilters);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        expenses: result.data,
        expensePagination: result.pagination,
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

  createExpense: async (expenseData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentGuideId } = get();
      const fullExpenseData = {
        ...expenseData,
        guideId: expenseData.guideId || currentGuideId
      };
      
      const result = await financialService.createExpense(fullExpenseData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      // Recargar gastos y estadísticas
      await Promise.all([
        get().loadExpenses(),
        get().loadFinancialStats({ guideId: currentGuideId })
      ]);
      
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

  updateExpense: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await financialService.updateExpense(id, updates);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      // Actualizar en la lista local
      set((state) => ({
        expenses: state.expenses.map(expense =>
          expense.id === id ? result.data : expense
        ),
        isLoading: false
      }));

      // Recalcular estadísticas
      await get().loadFinancialStats({ guideId: get().currentGuideId });

      return result.data;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const result = await financialService.deleteExpense(id);

      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }

      // Eliminar de la lista local
      set((state) => ({
        expenses: state.expenses.filter(expense => expense.id !== id),
        isLoading: false
      }));
      
      // Recalcular estadísticas
      await get().loadFinancialStats({ guideId: get().currentGuideId });
      
      return true;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Acciones para ingresos
  loadIncome: async (customFilters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const { incomeFilters, incomePagination, currentGuideId } = get();
      // Fallback defensivo para paginación
      const safePagination = incomePagination || { page: 1, limit: 10 };
      const combinedFilters = {
        ...incomeFilters,
        ...customFilters,
        guideId: customFilters.guideId || currentGuideId,
        page: customFilters.page || safePagination.page || 1,
        limit: customFilters.limit || safePagination.limit || 10
      };
      
      const result = await financialService.getIncome(combinedFilters);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        income: result.data,
        incomePagination: result.pagination,
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

  createIncome: async (incomeData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentGuideId } = get();
      const fullIncomeData = {
        ...incomeData,
        guideId: incomeData.guideId || currentGuideId
      };
      
      const result = await financialService.createIncome(fullIncomeData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      // Recargar ingresos y estadísticas
      await Promise.all([
        get().loadIncome(),
        get().loadFinancialStats({ guideId: currentGuideId })
      ]);
      
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

  updateIncome: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await financialService.updateIncome(id, updates);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      // Actualizar en la lista local
      set((state) => ({
        income: state.income.map(incomeItem =>
          incomeItem.id === id ? result.data : incomeItem
        ),
        isLoading: false
      }));

      // Recalcular estadísticas
      await get().loadFinancialStats({ guideId: get().currentGuideId });

      return result.data;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  deleteIncome: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const result = await financialService.deleteIncome(id);

      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }

      // Eliminar de la lista local
      set((state) => ({
        income: state.income.filter(incomeItem => incomeItem.id !== id),
        isLoading: false
      }));
      
      // Recalcular estadísticas
      await get().loadFinancialStats({ guideId: get().currentGuideId });
      
      return true;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Acciones para estadísticas
  loadFinancialStats: async (customFilters = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentGuideId } = get();
      const filters = {
        guideId: currentGuideId,
        ...customFilters
      };
      
      const result = await financialService.getFinancialStats(filters);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        financialStats: result.data,
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

  loadTrends: async (months = 6) => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentGuideId } = get();
      
      const result = await financialService.getProfitabilityTrends(currentGuideId, months);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        trends: result.data,
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

  loadBudgetAnalysis: async (period = 'month') => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentGuideId } = get();
      
      const result = await financialService.getExpenseBudgetAnalysis(currentGuideId, period);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        budgetAnalysis: result.data,
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

  // Acciones para calculadora
  saveCalculation: async (calculationData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentGuideId } = get();
      const fullCalculationData = {
        ...calculationData,
        guideId: currentGuideId
      };
      
      const result = await financialService.saveCalculation(fullCalculationData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      // Recargar datos
      await Promise.all([
        get().loadExpenses(),
        get().loadIncome(),
        get().loadFinancialStats({ guideId: currentGuideId })
      ]);
      
      set({ isLoading: false });

      // Recargar cálculos si la lista está cargada
      get().loadCalculations();

      return result.data;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  loadCalculations: async (customFilters = {}) => {
    set({ isLoadingCalculations: true });

    try {
      const { calculationsPagination, currentGuideId } = get();
      const safePagination = calculationsPagination || { page: 1, limit: 10 };

      // Importar authStore dinámicamente para evitar dependencias circulares
      const { default: useAuthStore } = await import('./authStore');
      const user = useAuthStore.getState().user;
      const guideId = customFilters.guideId || currentGuideId || user?.guideId || user?.id;

      if (!guideId) {
        throw new Error(i18next.t('errors.unexpectedError'));
      }

      const filters = {
        guideId,
        page: customFilters.page || safePagination.page || 1,
        limit: customFilters.limit || safePagination.limit || 10,
        startDate: customFilters.startDate,
        endDate: customFilters.endDate
      };

      const result = await financialService.getCalculations(filters);

      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }

      set({
        calculations: result.data || [],
        calculationsPagination: result.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
        isLoadingCalculations: false
      });

      return result.data;
    } catch (error) {
      set({
        isLoadingCalculations: false,
        calculations: []
      });
      // No re-lanzar el error para evitar que se rompa la UI
      console.error('Error loading calculations:', error);
      return [];
    }
  },

  deleteCalculation: async (id) => {
    try {
      const result = await financialService.deleteCalculation(id);

      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }

      // Recargar cálculos
      await get().loadCalculations();

      return true;
    } catch (error) {
      console.error('Error deleting calculation:', error);
      throw error;
    }
  },

  setCalculationsPage: (page) => {
    set((state) => {
      const safePagination = state.calculationsPagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
      return {
        calculationsPagination: { ...safePagination, page }
      };
    });

    get().loadCalculations();
  },

  // Acciones para filtros
  setExpenseFilters: (newFilters) => {
    set((state) => {
      const safePagination = state.expensePagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
      return {
        expenseFilters: { ...state.expenseFilters, ...newFilters },
        expensePagination: { ...safePagination, page: 1 }
      };
    });

    get().loadExpenses();
  },

  setIncomeFilters: (newFilters) => {
    set((state) => {
      const safePagination = state.incomePagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
      return {
        incomeFilters: { ...state.incomeFilters, ...newFilters },
        incomePagination: { ...safePagination, page: 1 }
      };
    });

    get().loadIncome();
  },

  setExpensePage: (page) => {
    set((state) => {
      const safePagination = state.expensePagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
      return {
        expensePagination: { ...safePagination, page }
      };
    });

    get().loadExpenses();
  },

  setIncomePage: (page) => {
    set((state) => {
      const safePagination = state.incomePagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
      return {
        incomePagination: { ...safePagination, page }
      };
    });

    get().loadIncome();
  },

  // Acciones para exportar
  exportData: async (filters = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentGuideId } = get();
      const exportFilters = {
        guideId: currentGuideId,
        ...filters
      };
      
      const result = await financialService.exportFinancialData(exportFilters);
      
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

  // Métodos de utilidad
  getCategoryInfo: (categoryValue) => {
    const { categories } = get();
    return categories.find(cat => cat.value === categoryValue) || categories[categories.length - 1];
  },

  getIncomeTypeInfo: (typeValue) => {
    const { incomeTypes } = get();
    return incomeTypes.find(type => type.value === typeValue) || incomeTypes[0];
  },

  getExpensesByCategory: () => {
    const { expenses } = get();
    return expenses.reduce((acc, expense) => {
      const category = get().getCategoryInfo(expense.category);
      const categoryName = category ? category.label : i18next.t('common.noData');
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(expense);
      return acc;
    }, {});
  },

  getIncomeByType: () => {
    const { income } = get();
    return income.reduce((acc, incomeItem) => {
      const type = get().getIncomeTypeInfo(incomeItem.type);
      const typeName = type ? type.label : i18next.t('common.noData');
      if (!acc[typeName]) {
        acc[typeName] = [];
      }
      acc[typeName].push(incomeItem);
      return acc;
    }, {});
  },

  // Acciones de gestión de estado
  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  clearStore: () => {
    set({
      expenses: [],
      income: [],
      categories: [],
      incomeTypes: [],
      financialStats: null,
      trends: [],
      budgetAnalysis: null,
      expenseFilters: {
        category: 'all',
        tourId: '',
        startDate: '',
        endDate: '',
        search: ''
      },
      expensePagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      },
      incomeFilters: {
        type: 'all',
        tourId: '',
        startDate: '',
        endDate: '',
        search: ''
      },
      incomePagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      },
      isLoading: false,
      error: null,
      hasInitialized: false,
      currentGuideId: null
    });
  }
}));

export { useFinancialStore };
export default useFinancialStore;