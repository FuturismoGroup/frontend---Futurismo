/**
 * Store de usuarios
 * Maneja el estado global de usuarios
 */

import { create } from 'zustand';
import i18next from 'i18next';
import usersService from '../services/usersService';

const useUsersStore = create((set, get) => ({
  // Estado
  users: [],
  roles: [],
  permissions: [],
  currentUser: null,
  isLoading: false,
  error: null,
  
  // Paginación
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  },
  
  // Filtros
  filters: {
    role: '',
    status: '',
    department: '',
    search: ''
  },
  
  // Estadísticas
  stats: null,
  activities: [],
  sessions: [],

  // Acciones de filtros
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }
    }));
    return get().fetchUsers();
  },
  
  clearFilters: () => {
    set({
      filters: {
        role: '',
        status: '',
        department: '',
        search: ''
      },
      pagination: { ...get().pagination, page: 1 }
    });
    return get().fetchUsers();
  },
  
  setSearch: (search) => {
    set((state) => ({
      filters: { ...state.filters, search },
      pagination: { ...state.pagination, page: 1 }
    }));
    return get().fetchUsers();
  },
  
  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page }
    }));
    return get().fetchUsers();
  },

  // Acciones CRUD
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { filters, pagination } = get();
      const params = {
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize
      };
      
      const result = await usersService.getUsers(params);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        users: result.data.users,
        pagination: {
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
  
  fetchUserById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.getUserById(id);
      
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
  
  createUser: async (userData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.createUser(userData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        users: [result.data, ...state.users],
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

  updateUser: async (id, updateData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.updateUser(id, updateData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        users: state.users.map(u => 
          u.id === id ? result.data : u
        ),
        currentUser: state.currentUser?.id === id 
          ? result.data 
          : state.currentUser,
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

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const result = await usersService.deleteUser(id);

      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }

      // Eliminar de la lista (soft delete - el usuario ya no aparecerá)
      set((state) => ({
        users: state.users.filter(u => u.id !== id),
        currentUser: state.currentUser?.id === id
          ? null
          : state.currentUser,
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

  restoreUser: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const result = await usersService.restoreUser(id);

      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }

      // Recargar lista de usuarios para mostrar el restaurado
      await get().fetchUsers();

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

  toggleUserStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.toggleUserStatus(id, status);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        users: state.users.map(u => 
          u.id === id ? result.data : u
        ),
        currentUser: state.currentUser?.id === id 
          ? result.data 
          : state.currentUser,
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

  resetUserPassword: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.resetUserPassword(id);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
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
  
  changeUserPassword: async (id, passwordData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.changeUserPassword(id, passwordData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
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

  updateUserPermissions: async (id, permissions) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.updateUserPermissions(id, permissions);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        users: state.users.map(u => 
          u.id === id ? result.data : u
        ),
        currentUser: state.currentUser?.id === id 
          ? result.data 
          : state.currentUser,
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
  
  updateUserRole: async (id, roleId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.updateUserRole(id, roleId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        users: state.users.map(u => 
          u.id === id ? result.data : u
        ),
        currentUser: state.currentUser?.id === id 
          ? result.data 
          : state.currentUser,
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

  // Roles y permisos
  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.getRoles();
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        roles: result.data,
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
  
  fetchPermissions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.getPermissions();
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        permissions: result.data.permissions,
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

  // Búsqueda
  searchUsers: async (query) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.searchUsers(query);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        users: result.data,
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

  // Estadísticas
  fetchUsersStats: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.getUsersStats();
      
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

  // Actividad de usuario
  fetchUserActivity: async (id, params = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.getUserActivity(id, params);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        activities: result.data.activities,
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

  // Validación
  checkEmailUnique: async (email, excludeId = null) => {
    try {
      const result = await usersService.checkEmailUnique(email, excludeId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      return result.data.unique;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Invitaciones
  inviteUser: async (inviteData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.inviteUser(inviteData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        users: [result.data, ...state.users],
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
  
  resendInvitation: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.resendInvitation(userId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
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

  // Importación/Exportación
  importUsers: async (file, onProgress = null) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.importUsers(file, onProgress);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      // Recargar lista de usuarios
      await get().fetchUsers();
      
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
  
  exportUsers: async (filters = {}, format = 'excel') => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.exportUsers(filters, format);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
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
  
  // Sesiones
  fetchUserSessions: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.getUserSessions(userId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        sessions: result.data,
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
  
  terminateUserSession: async (userId, sessionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.terminateUserSession(userId, sessionId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
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
  
  terminateAllUserSessions: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.terminateAllUserSessions(userId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        sessions: [],
        isLoading: false
      });
      
      return result;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },
  
  // Utilidades
  clearError: () => set({ error: null }),
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  // Helper function to get roles directly (sin fallback - debe usar fetchRoles primero)
  getRoles: () => {
    const { roles } = get();
    return roles;
  },
  
  // Helper function to get permissions by module
  getPermissionsByModule: () => {
    const { permissions } = get();
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});
  },

  // Get users statistics
  getUsersStatistics: () => {
    const { users } = get();

    // Validate that users is an array
    if (!Array.isArray(users)) {
      console.warn('[usersStore] users is not an array in getUsersStatistics:', users);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        activeRate: 0
      };
    }

    const total = users.length;
    const active = users.filter(u => u.status === 'activo' || u.status === 'active').length;
    const inactive = users.filter(u => u.status === 'inactivo' || u.status === 'inactive').length;

    return {
      total,
      active,
      inactive,
      activeRate: total > 0 ? (active / total * 100).toFixed(1) : 0
    };
  },

  resetStore: () => {
    set({
      users: [],
      roles: [],
      permissions: [],
      currentUser: null,
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
      },
      filters: {
        role: '',
        status: '',
        department: '',
        search: ''
      },
      stats: null,
      activities: [],
      sessions: []
    });
  }
}));

export { useUsersStore };
export default useUsersStore;