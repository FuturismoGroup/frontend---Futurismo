/**
 * Servicio de puntos para agencias
 * Maneja la logica de puntos con el backend real
 * APIs relacionadas: API-041 a API-046
 */

import BaseService from './baseService';

class PointsService extends BaseService {
  constructor() {
    super('/agencies');
  }

  /**
   * API-041: GetAgencyPoints
   * GET /api/agencies/:id/points
   * Obtener balance de puntos de una agencia
   * @param {string} agencyId - ID de la agencia
   * @returns {Promise<Object>}
   */
  async getAgencyPoints(agencyId) {
    return this.get(`/${agencyId}/points`);
  }

  /**
   * API-042: GetPointsTransactions
   * GET /api/agencies/:id/points/transactions
   * Obtener historial de transacciones de puntos
   * @param {string} agencyId - ID de la agencia
   * @param {Object} params - Parametros de paginacion/filtros
   * @returns {Promise<Object>}
   */
  async getPointsTransactions(agencyId, params = {}) {
    return this.get(`/${agencyId}/points/transactions`, params);
  }

  /**
   * ELM-414: AddPointsToAgency
   * POST /api/agencies/:id/points
   * Agregar puntos manualmente a una agencia (Admin)
   * @param {string} agencyId - ID de la agencia
   * @param {Object} data - { points, description, type }
   * @returns {Promise<Object>}
   */
  async addPointsToAgency(agencyId, data) {
    return this.post(`/${agencyId}/points`, data);
  }

  /**
   * API-045: RedeemReward
   * POST /api/agencies/:id/points/redeem
   * Canjear puntos por un premio
   * @param {string} agencyId - ID de la agencia
   * @param {Object} data - { rewardId, points }
   * @returns {Promise<Object>}
   */
  async redeemReward(agencyId, data) {
    return this.post(`/${agencyId}/points/redeem`, data);
  }

  /**
   * API-046: GetRedemptions
   * GET /api/agencies/:id/redemptions
   * Obtener historial de canjes de una agencia
   * @param {string} agencyId - ID de la agencia
   * @param {Object} params - Parametros de paginacion
   * @returns {Promise<Object>}
   */
  async getRedemptions(agencyId, params = {}) {
    return this.get(`/${agencyId}/redemptions`, params);
  }

  /**
   * API-043: ListRewards
   * GET /api/rewards
   * Obtener lista de premios disponibles
   * @param {Object} params - Parametros de filtro
   * @returns {Promise<Object>}
   */
  async getRewards(params = {}) {
    // Usar api directamente para ruta fuera de /agencies
    try {
      const response = await this.api.get('/rewards', { params });
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data;
      }
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

const pointsService = new PointsService();
export default pointsService;
