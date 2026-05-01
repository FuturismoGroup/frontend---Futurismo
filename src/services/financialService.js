import i18next from 'i18next';
import BaseService from './baseService';


class FinancialService extends BaseService {
  constructor() {
    super('/financial');
    // Usar API real - backend implementado
    this.useMock = false;
    console.log('[FinancialService] Constructor completed - using real API');
  }

  async getExpenses(filters = {}) {
    if (this.useMock) {
      return mockFinancialService.getExpenses(filters);
    }

    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await this.get(`/expenses?${queryParams.toString()}`);
      if (!response.success) return response;
      return { success: true, data: response.data || [], pagination: response.pagination };
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async createExpense(expenseData) {
    if (this.useMock) {
      return mockFinancialService.createExpense(expenseData);
    }

    try {
      const response = await this.post('/expenses', expenseData);
      if (!response.success) return response;
      return this.success(response.data);
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async updateExpense(id, updates) {
    if (this.useMock) {
      return mockFinancialService.updateExpense(id, updates);
    }

    try {
      const response = await this.put(`/expenses/${id}`, updates);
      if (!response.success) return response;
      return this.success(response.data);
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async deleteExpense(id) {
    if (this.useMock) {
      return mockFinancialService.deleteExpense(id);
    }

    try {
      await this.delete(`/expenses/${id}`);
      return this.success({ deleted: true });
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async getIncome(filters = {}) {
    if (this.useMock) {
      return mockFinancialService.getIncome(filters);
    }

    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await this.get(`/income?${queryParams.toString()}`);
      if (!response.success) return response;
      return { success: true, data: response.data || [], pagination: response.pagination };
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async createIncome(incomeData) {
    if (this.useMock) {
      return mockFinancialService.createIncome(incomeData);
    }

    try {
      const response = await this.post('/income', incomeData);
      if (!response.success) return response;
      return this.success(response.data);
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async updateIncome(id, updates) {
    if (this.useMock) {
      return mockFinancialService.updateIncome(id, updates);
    }

    try {
      const response = await this.put(`/income/${id}`, updates);
      if (!response.success) return response;
      return this.success(response.data);
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async deleteIncome(id) {
    if (this.useMock) {
      return mockFinancialService.deleteIncome(id);
    }

    try {
      await this.delete(`/income/${id}`);
      return this.success({ deleted: true });
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async getExpenseCategories() {
    console.log('[FinancialService] Getting expense categories, useMock:', this.useMock);
    if (this.useMock) {
      const result = await mockFinancialService.getExpenseCategories();
      console.log('[FinancialService] Categories result:', result);
      return result;
    }

    try {
      const response = await this.get('/expense-categories');
      if (!response.success) return response;
      return this.success(response.data || []);
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async getIncomeTypes() {
    console.log('[FinancialService] Getting income types, useMock:', this.useMock);
    if (this.useMock) {
      const result = await mockFinancialService.getIncomeTypes();
      console.log('[FinancialService] Income types result:', result);
      return result;
    }

    try {
      const response = await this.get('/income-types');
      if (!response.success) return response;
      return this.success(response.data || []);
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async getFinancialStats(filters = {}) {
    if (this.useMock) {
      return mockFinancialService.getFinancialStats(filters);
    }

    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await this.get(`/stats?${queryParams.toString()}`);
      if (!response.success) return response;
      return this.success(response.data);
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async exportFinancialData(filters = {}) {
    if (this.useMock) {
      return mockFinancialService.exportFinancialData(filters);
    }

    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await this.get(`/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });

      return this.success(response.data);
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async saveCalculation(calculationData) {
    if (this.useMock) {
      return mockFinancialService.saveCalculation(calculationData);
    }

    try {
      const response = await this.post('/calculations', calculationData);
      return this.success(response.data);
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async getCalculations(filters = {}) {
    if (this.useMock) {
      return { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    try {
      const params = new URLSearchParams();
      if (filters.guideId) params.append('guideId', filters.guideId);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await this.get(`/calculations?${params.toString()}`);
      return {
        success: true,
        data: response.data,
        pagination: response.pagination
      };
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async deleteCalculation(id) {
    if (this.useMock) {
      return { success: true };
    }

    try {
      await this.delete(`/calculations/${id}`);
      return { success: true };
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  // Métodos específicos para análisis financiero
  async getMonthlyReport(guideId, year, month) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    return this.getFinancialStats({
      guideId,
      startDate,
      endDate
    });
  }

  async getYearlyReport(guideId, year) {
    const startDate = new Date(year, 0, 1).toISOString().split('T')[0];
    const endDate = new Date(year, 11, 31).toISOString().split('T')[0];

    return this.getFinancialStats({
      guideId,
      startDate,
      endDate
    });
  }

  async getCustomReport(guideId, startDate, endDate) {
    return this.getFinancialStats({
      guideId,
      startDate,
      endDate
    });
  }

  // Métodos de análisis avanzado
  async getProfitabilityTrends(guideId, months = 6) {
    if (this.useMock) {
      // Simular tendencias de rentabilidad
      const trends = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthYear = date.toISOString().slice(0, 7);

        // Datos mock para tendencias
        trends.push({
          period: monthYear,
          income: Math.random() * 2000 + 1000,
          expenses: Math.random() * 800 + 300,
          profit: 0, // Se calculará
          profitMargin: 0 // Se calculará
        });
      }

      // Calcular profit y margin
      trends.forEach(trend => {
        trend.profit = trend.income - trend.expenses;
        trend.profitMargin = trend.income > 0 ? ((trend.profit / trend.income) * 100) : 0;
      });

      return this.success(trends);
    }

    try {
      const response = await this.get(`/trends/${guideId}?months=${months}`);
      if (!response.success) return response;
      return this.success(response.data);
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }

  async getExpenseBudgetAnalysis(guideId, period = 'month') {
    if (this.useMock) {
      // Análisis mock de presupuesto
      const analysis = {
        period,
        budget: 1000, // Presupuesto mock
        actualExpenses: 750,
        variance: -250,
        variancePercent: -25,
        categoryBreakdown: {
          'Transporte': { budget: 400, actual: 320, variance: -80 },
          'Alimentación': { budget: 200, actual: 180, variance: -20 },
          'Materiales': { budget: 150, actual: 100, variance: -50 },
          'Equipamiento': { budget: 250, actual: 150, variance: -100 }
        }
      };

      return this.success(analysis);
    }

    try {
      const response = await this.get(`/budget-analysis/${guideId}?period=${period}`);
      if (!response.success) return response;
      return this.success(response.data);
    } catch (error) {
      return this.error(i18next.t('errors.unexpectedError'), error);
    }
  }
}

// Crear instancia del servicio
const financialService = new FinancialService();

export { financialService };
export default financialService;
