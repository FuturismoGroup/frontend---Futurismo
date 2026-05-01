import { create } from 'zustand';
import i18next from 'i18next';
import {
  REDEMPTION_STATUS
} from '../constants/rewardsConstants';
import { useAuthStore } from './authStore';
import api from '../services/api';

const useRewardsStore = create((set, get) => ({
  // Estado
  rewards: [],
  rewardCategories: [], // Categorias de premios desde BD (TBL-009)
  agencies: [], // Agencias con sus puntos
  redemptions: [],
  loading: false,
  error: null,

  // Acciones para premios
  // API-043: GET /api/rewards - Lista premios del catalogo
  fetchRewards: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/rewards');
      const result = response.data;

      // Backend devuelve { data: [...], total, page, pageSize }
      const rewardsData = result.data || result || [];
      // Mapear campos del backend al formato esperado por el frontend
      const mappedRewards = rewardsData.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        points: r.pointsCost || r.points || 0,
        category: r.category || r.category_id,
        categoryName: r.categoryName || null,
        stock: r.stock || 0,
        image: r.imageUrl || r.image || '',
        active: r.available !== undefined ? r.available : (r.active !== undefined ? r.active : true)
      }));
      set({ rewards: mappedRewards, loading: false });
    } catch (error) {
      console.error('Error fetching rewards:', error);
      set({ error: error.message, loading: false, rewards: [] });
    }
  },

  // GET /api/rewards/categories - Lista categorias de premios (TBL-009)
  // ELM-424: Panel filtros usa estas categorias para el select de filtrado
  fetchRewardCategories: async () => {
    try {
      const token = useAuthStore.getState().token;

      // Si no hay token, retornar array vacío sin hacer la petición
      if (!token) {
        set({ rewardCategories: [] });
        return [];
      }

      const response = await api.get('/rewards/categories');
      const result = response.data;

      if (result.success) {
        // Mapear categorias del backend
        const categories = (result.data || []).map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          icon: cat.icon || 'gift',
          color: cat.color || '#3B82F6'
        }));
        set({ rewardCategories: categories });
        return categories;
      } else {
        console.warn('Error al cargar categorias de premios:', result.error);
        set({ rewardCategories: [] });
        return [];
      }
    } catch (error) {
      console.error('Error fetching reward categories:', error);
      set({ rewardCategories: [] });
      return [];
    }
  },

  // API-047: POST /api/rewards - Crear premio (Admin)
  // Soporta upload de imagen via FormData
  createReward: async (rewardData) => {
    set({ loading: true, error: null });
    try {
      let response;

      // Si hay un archivo de imagen, usar FormData
      if (rewardData.imageFile instanceof File) {
        const formData = new FormData();
        formData.append('name', rewardData.name);
        formData.append('description', rewardData.description || '');
        formData.append('pointsCost', rewardData.points);
        formData.append('category', rewardData.category || '');
        formData.append('stock', rewardData.stock);
        formData.append('available', rewardData.active);
        formData.append('image', rewardData.imageFile);

        response = await api.post('/rewards', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Sin archivo, enviar JSON normal
        const backendData = {
          name: rewardData.name,
          description: rewardData.description,
          pointsCost: rewardData.points,
          category: rewardData.category,
          stock: rewardData.stock,
          imageUrl: rewardData.image || null,
          available: rewardData.active
        };

        response = await api.post('/rewards', backendData);
      }

      const result = response.data;

      // El backend devuelve { success, data: {...} }
      const createdReward = result.data || result;

      // Mapear respuesta al formato del frontend
      const newReward = {
        id: createdReward.id,
        name: createdReward.name,
        description: createdReward.description,
        points: createdReward.pointsCost || createdReward.points || 0,
        category: createdReward.category || createdReward.category_id,
        categoryName: createdReward.categoryName || null,
        stock: createdReward.stock || 0,
        image: createdReward.imageUrl || createdReward.image || '',
        active: createdReward.available !== undefined ? createdReward.available : true
      };

      set(state => ({
        rewards: [...state.rewards, newReward],
        loading: false
      }));

      return newReward;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // API-048: PUT /api/rewards/:id - Actualizar premio (Admin)
  // Soporta upload de imagen via FormData
  updateReward: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      let response;

      // Si hay un archivo de imagen, usar FormData
      if (updates.imageFile instanceof File) {
        const formData = new FormData();
        formData.append('name', updates.name);
        formData.append('description', updates.description || '');
        formData.append('pointsCost', updates.points);
        formData.append('category', updates.category || '');
        formData.append('stock', updates.stock);
        formData.append('available', updates.active);
        formData.append('image', updates.imageFile);

        response = await api.put(`/rewards/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Sin archivo, enviar JSON normal
        const backendData = {
          name: updates.name,
          description: updates.description,
          pointsCost: updates.points,
          category: updates.category,
          stock: updates.stock,
          imageUrl: updates.image || null,
          available: updates.active
        };

        response = await api.put(`/rewards/${id}`, backendData);
      }

      const result = response.data;

      // El backend devuelve { success, data: {...} }
      const rewardResponse = result.data || result;

      // Mapear respuesta al formato del frontend
      const updatedReward = {
        id: rewardResponse.id,
        name: rewardResponse.name,
        description: rewardResponse.description,
        points: rewardResponse.pointsCost || rewardResponse.points || 0,
        category: rewardResponse.category || rewardResponse.category_id,
        categoryName: rewardResponse.categoryName || null,
        stock: rewardResponse.stock || 0,
        image: rewardResponse.imageUrl || rewardResponse.image || '',
        active: rewardResponse.available !== undefined ? rewardResponse.available : true
      };

      set(state => ({
        rewards: state.rewards.map(reward =>
          reward.id === id ? updatedReward : reward
        ),
        loading: false
      }));

      return updatedReward;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // API-049: DELETE /api/rewards/:id - Eliminar premio (Admin)
  deleteReward: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/rewards/${id}`);

      set(state => ({
        rewards: state.rewards.filter(reward => reward.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Acciones para agencias y puntos
  // Modificado para manejar diferentes roles:
  // - Admin: obtiene todas las agencias con GET /api/agencies
  // - Agency: obtiene solo su propia agencia con GET /api/agencies/:id
  fetchAgencies: async () => {
    set({ loading: true, error: null });
    try {
      const authState = useAuthStore.getState();
      const user = authState.user;
      const userRole = user?.role?.toLowerCase();
      const agencyId = user?.agencyId;

      let agenciesWithPoints = [];

      if (userRole === 'agency' && agencyId) {
        // Para agencias: obtener solo su propia informacion
        const response = await api.get(`/agencies/${agencyId}`);
        const result = response.data;

        if (result.success && result.data) {
          const agency = result.data;
          agenciesWithPoints = [{
            id: agency.id,
            name: agency.businessName || agency.business_name || agency.name,
            email: agency.agencyEmail || agency.agency_email || agency.email,
            totalPoints: agency.totalPoints || agency.total_points || 0,
            availablePoints: agency.availablePoints || agency.available_points || 0,
            usedPoints: (agency.totalPoints || agency.total_points || 0) - (agency.availablePoints || agency.available_points || 0),
            joinDate: agency.createdAt || agency.created_at || new Date().toISOString()
          }];
        }
      } else if (userRole === 'admin' || userRole === 'administrator') {
        // Para admin: obtener todas las agencias
        const response = await api.get('/agencies');
        const result = response.data;

        if (result.success) {
          agenciesWithPoints = (result.data || []).map(agency => ({
            id: agency.id,
            name: agency.businessName || agency.business_name || agency.name,
            email: agency.agencyEmail || agency.agency_email || agency.email,
            totalPoints: agency.totalPoints || agency.total_points || 0,
            availablePoints: agency.availablePoints || agency.available_points || 0,
            usedPoints: agency.usedPoints || agency.used_points || 0,
            joinDate: agency.createdAt || agency.created_at || new Date().toISOString()
          }));
        }
      }

      set({ agencies: agenciesWithPoints, loading: false });
    } catch (error) {
      console.error('Error fetching agencies:', error);
      set({ error: error.message, loading: false, agencies: [] });
    }
  },

  // ELM-414: Modal Asignar Puntos
  // FLW-021, FLW-125: Asignar puntos manualmente a una agencia
  // POST /api/agencies/:id/points
  addPointsToAgency: async (agencyId, points, reason) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/agencies/${agencyId}/points`, { points, reason });
      const result = response.data;

      // Actualizar el estado local con los nuevos puntos
      set(state => ({
        agencies: state.agencies.map(agency =>
          agency.id === agencyId
            ? {
                ...agency,
                totalPoints: result.data.newTotalPoints,
                availablePoints: result.data.newAvailablePoints,
                level: result.data.newLevel
              }
            : agency
        ),
        loading: false
      }));

      return result.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Acciones para canjes
  // ELM-413: GET /api/rewards/redemptions - Lista todos los canjes (Admin)
  fetchRedemptions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/rewards/redemptions');
      const result = response.data;

      if (result.success) {
        // Mapear respuesta del backend al formato del frontend
        const mappedRedemptions = (result.data || []).map(r => ({
          id: r.id,
          agencyId: r.agencyId,
          agencyName: r.agencyName,
          rewardId: r.rewardId,
          rewardName: r.rewardName,
          points: r.points,
          quantity: r.quantity || 1,
          status: r.status,
          notes: r.notes,
          requestDate: r.requestDate,
          approvalDate: r.approvalDate,
          deliveryDate: r.deliveryDate
        }));
        set({ redemptions: mappedRedemptions, loading: false });
      } else {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      set({ error: error.message, loading: false, redemptions: [] });
    }
  },

  // API-046: GET /api/agencies/:id/redemptions - Lista canjes de una agencia especifica
  // ELM-427: Tabla Mis Canjes (RewardsStore.jsx)
  // Tabla: redemptions (TBL-011)
  fetchAgencyRedemptions: async (agencyId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/agencies/${agencyId}/redemptions`);
      const result = response.data;

      // Mapear respuesta del backend (API-046) al formato del frontend
      const mappedRedemptions = (result.data || []).map(r => ({
        id: r.id,
        agencyId: agencyId,
        rewardId: r.reward?.id,
        rewardName: r.reward?.name || 'Premio',
        points: r.pointsUsed,
        quantity: r.quantity || 1,
        status: r.status,
        requestDate: r.requestedAt,
        deliveryDate: r.deliveredAt
      }));
      set({ redemptions: mappedRedemptions, loading: false });
      return mappedRedemptions;
    } catch (error) {
      console.error('Error fetching agency redemptions:', error);
      set({ error: error.message, loading: false, redemptions: [] });
      return [];
    }
  },

  // API-045: POST /api/agencies/:agencyId/points/redeem - Solicitar canje de premio
  requestRedemption: async (agencyId, rewardId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/agencies/${agencyId}/points/redeem`, { rewardId, quantity: 1 });
      const result = response.data;

      // Crear objeto de redemption con la respuesta del servidor
      const newRedemption = {
        id: result.redemptionId,
        agencyId,
        agencyName: get().agencies.find(a => a.id === agencyId)?.name || 'Agencia',
        rewardId,
        rewardName: result.rewardName,
        points: result.pointsDeducted,
        status: result.status || REDEMPTION_STATUS.PENDING,
        requestDate: result.createdAt || new Date().toISOString(),
        notes: 'Solicitud de canje pendiente de aprobacion'
      };

      // Actualizar estado local: nuevos puntos de agencia, stock y lista de canjes
      set(state => ({
        agencies: state.agencies.map(a =>
          a.id === agencyId
            ? { ...a, availablePoints: result.newBalance }
            : a
        ),
        redemptions: [...state.redemptions, newRedemption],
        loading: false
      }));

      // Refrescar rewards para obtener stock actualizado
      get().fetchRewards();

      return newRedemption;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ELM-413: PATCH /api/rewards/redemptions/:id - Actualizar estado de canje (Admin)
  // Estados: pending -> approved -> delivered / cancelled
  updateRedemptionStatus: async (id, status, notes = '') => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/rewards/redemptions/${id}`, { status, notes });
      const result = response.data;

      // Actualizar estado local con la respuesta del servidor
      set(state => ({
        redemptions: state.redemptions.map(redemption =>
          redemption.id === id
            ? {
                ...redemption,
                status: result.data.status,
                approvalDate: result.data.approvalDate || redemption.approvalDate,
                deliveryDate: result.data.deliveryDate || redemption.deliveryDate,
                notes: result.data.notes || redemption.notes
              }
            : redemption
        ),
        loading: false
      }));

      return result.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Reset estado
  resetStore: () => {
    set({
      rewards: [],
      rewardCategories: [],
      agencies: [],
      redemptions: [],
      loading: false,
      error: null
    });
  }
}));

export default useRewardsStore;
