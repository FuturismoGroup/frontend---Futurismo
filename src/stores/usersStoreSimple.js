import { create } from 'zustand';
import i18next from 'i18next';
import usersService from '../services/usersService';

// Datos iniciales vacíos - se cargarán desde el servicio
const initialUsersData = [];

const useUsersStore = create((set, get) => ({
  // Estado
  users: initialUsersData,
  roles: [],
  roleStats: null, // Estadisticas de roles desde backend (API-021/API-030)
  isLoading: false,
  error: null,
  hasInitialized: false,
  
  // Filtros
  filters: {
    role: '',
    status: '',
    guideType: '', // Para filtrar guías planta/freelance
    search: ''
  },

  // Cargar roles desde API
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

  // Acciones básicas
  initialize: async () => {
    const { hasInitialized } = get();
    if (hasInitialized) return;
    
    set({ isLoading: true, error: null });
    
    try {
      // Cargar usuarios
      const usersResult = await usersService.getUsers();
      if (!usersResult.success) {
        throw new Error(usersResult.error || i18next.t('errors.unexpectedError'));
      }
      
      // Cargar roles
      const rolesResult = await usersService.getRoles();
      if (!rolesResult.success) {
        throw new Error(rolesResult.error || i18next.t('errors.unexpectedError'));
      }
      
      // Extraer roleStats del backend (API-021 lo incluye en la respuesta)
      const usersData = usersResult.data.data || usersResult.data.users || usersResult.data || [];
      const backendRoleStats = usersResult.data.roleStats || null;

      set({
        users: usersData,
        roles: rolesResult.data,
        roleStats: backendRoleStats,
        isLoading: false,
        hasInitialized: true
      });
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },
  
  getUsers: (filters = {}) => {
    const { users } = get();

    // Validar que users sea un array antes de intentar iterarlo
    if (!Array.isArray(users)) {
      console.warn('[usersStore] users is not an array:', users);
      return [];
    }

    let filtered = [...users];

    if (filters.role) {
      filtered = filtered.filter(user => {
        // Normalizar rol para comparación (puede venir como objeto o string)
        const userRole = typeof user.role === 'object' ? user.role?.name?.toLowerCase() : user.role?.toLowerCase();
        const filterRole = filters.role.toLowerCase();

        // Mapear aliases de roles (guia <-> guide, agencia <-> agency, etc)
        const roleAliases = {
          'guia': 'guide',
          'guide': 'guide',
          'agencia': 'agency',
          'agency': 'agency',
          'administrador': 'admin',
          'administrator': 'admin',
          'admin': 'admin'
        };

        const normalizedUserRole = roleAliases[userRole] || userRole;
        const normalizedFilterRole = roleAliases[filterRole] || filterRole;

        return normalizedUserRole === normalizedFilterRole;
      });
    }

    if (filters.status) {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    if (filters.guideType) {
      filtered = filtered.filter(user => {
        // Normalizar rol del usuario
        const userRole = typeof user.role === 'object' ? user.role?.name?.toLowerCase() : user.role?.toLowerCase();
        const isGuide = userRole === 'guide' || userRole === 'guia';

        if (!isGuide) return false;

        // El guideType puede venir en user.guide.guide_type o user.guideType
        const guideType = user.guide?.guide_type || user.guideType;
        return guideType === filters.guideType;
      });
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.username && user.username.toLowerCase().includes(searchTerm)) ||
        (user.company && user.company.toLowerCase().includes(searchTerm)) ||
        (user.ruc && user.ruc.includes(searchTerm))
      );
    }

    return filtered;
  },

  getFilteredUsers: () => {
    const { filters } = get();
    return get().getUsers(filters);
  },

  getUserById: (userId) => {
    const { users } = get();
    return users.find(user => user.id === userId);
  },

  createUser: async (userData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.createUser(userData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        users: [...state.users, result.data],
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

  updateUser: async (userId, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.updateUser(userId, updates);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        users: state.users.map(user =>
          user.id === userId ? result.data : user
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

  deleteUser: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await usersService.deleteUser(userId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        users: state.users.filter(user => user.id !== userId),
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

  toggleUserStatus: async (userId) => {
    const user = get().getUserById(userId);
    if (!user) return;

    // Cambiar status usando API-026: PATCH /api/users/:id/status
    // Backend usa 'active'/'inactive' (ingles)
    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    set({ isLoading: true, error: null });

    try {
      const result = await usersService.toggleUserStatus(userId, newStatus);

      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }

      // Actualizar el usuario en el estado local
      set((state) => ({
        users: state.users.map(u =>
          u.id === userId ? { ...u, status: newStatus } : u
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

  getRoles: () => {
    const { roles } = get();
    return roles;
  },

  getUsersStatistics: () => {
    const { users } = get();

    // Validar que users sea un array
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
    // Backend usa 'active'/'inactive' (ingles)
    const active = users.filter(u => u.status === 'active').length;
    const inactive = users.filter(u => u.status === 'inactive').length;

    return {
      total,
      active,
      inactive,
      activeRate: total > 0 ? (active / total * 100).toFixed(1) : 0
    };
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        role: '',
        status: '',
        guideType: '',
        search: ''
      }
    });
  },

  // Funciones específicas por tipo de usuario
  getAdministrators: () => {
    const { users } = get();
    if (!Array.isArray(users)) {
      console.warn('[usersStore] users is not an array in getAdministrators:', users);
      return [];
    }
    return users.filter(user => {
      const roleName = typeof user.role === 'object' ? user.role?.name?.toLowerCase() : user.role?.toLowerCase();
      return roleName === 'admin' || roleName === 'administrador' || roleName === 'administrator';
    });
  },

  getAgencies: () => {
    const { users } = get();
    if (!Array.isArray(users)) {
      console.warn('[usersStore] users is not an array in getAgencies:', users);
      return [];
    }
    return users.filter(user => {
      const roleName = typeof user.role === 'object' ? user.role?.name?.toLowerCase() : user.role?.toLowerCase();
      return roleName === 'agency' || roleName === 'agencia';
    });
  },

  getGuides: (type = null) => {
    const { users } = get();
    if (!Array.isArray(users)) {
      console.warn('[usersStore] users is not an array in getGuides:', users);
      return [];
    }
    const guides = users.filter(user => {
      const roleName = typeof user.role === 'object' ? user.role?.name?.toLowerCase() : user.role?.toLowerCase();
      return roleName === 'guide' || roleName === 'guia';
    });
    if (type) {
      return guides.filter(guide => {
        const guideType = guide.guide?.guide_type || guide.guideType;
        return guideType === type;
      });
    }
    return guides;
  },

  getGuidesByType: () => {
    const { users } = get();
    if (!Array.isArray(users)) {
      console.warn('[usersStore] users is not an array in getGuidesByType:', users);
      return { planta: [], freelance: [] };
    }
    const guides = users.filter(user => {
      const roleName = typeof user.role === 'object' ? user.role?.name?.toLowerCase() : user.role?.toLowerCase();
      return roleName === 'guide' || roleName === 'guia';
    });
    return {
      planta: guides.filter(guide => {
        const guideType = guide.guide?.guide_type || guide.guideType;
        // Backend usa 'AGENCY' para guías de planta (empleados internos)
        return guideType?.toUpperCase() === 'AGENCY';
      }),
      freelance: guides.filter(guide => {
        const guideType = guide.guide?.guide_type || guide.guideType;
        return guideType?.toUpperCase() === 'FREELANCE';
      })
    };
  },

  // Estadísticas específicas por rol - usa datos del backend (API-021/API-030)
  getRoleStatistics: () => {
    const { roleStats, users } = get();

    // Si hay roleStats del backend (API-021 o API-030), usarlos directamente
    if (roleStats) {
      return {
        total: roleStats.total || 0,
        administradores: roleStats.administradores || 0,
        agencias: roleStats.agencias || 0,
        guias: roleStats.guias || 0,
        guiasPlanta: roleStats.guiasPlanta || 0,
        guiasFreelance: roleStats.guiasFreelance || 0
      };
    }

    // Fallback: calcular desde usuarios locales (solo si backend no envio roleStats)
    if (!Array.isArray(users)) {
      console.warn('[usersStore] users is not an array in getRoleStatistics:', users);
      return {
        total: 0,
        administradores: 0,
        agencias: 0,
        guias: 0,
        guiasPlanta: 0,
        guiasFreelance: 0
      };
    }

    // Mapeo de roles backend a frontend
    // Backend usa role.name en minusculas: 'admin', 'agency', 'guide'
    const total = users.length;
    const administradores = users.filter(u => {
      const roleName = typeof u.role === 'object' ? u.role?.name?.toLowerCase() : u.role?.toLowerCase();
      return roleName === 'admin' || roleName === 'administrador';
    }).length;
    const agencias = users.filter(u => {
      const roleName = typeof u.role === 'object' ? u.role?.name?.toLowerCase() : u.role?.toLowerCase();
      return roleName === 'agency' || roleName === 'agencia';
    }).length;
    const guias = users.filter(u => {
      const roleName = typeof u.role === 'object' ? u.role?.name?.toLowerCase() : u.role?.toLowerCase();
      return roleName === 'guide' || roleName === 'guia';
    }).length;
    const guiasPlanta = users.filter(u => {
      const roleName = typeof u.role === 'object' ? u.role?.name?.toLowerCase() : u.role?.toLowerCase();
      const isGuide = roleName === 'guide' || roleName === 'guia';
      const guideType = u.guide?.guideType?.toUpperCase() || u.guideType?.toUpperCase();
      // Backend usa 'AGENCY' para guías de planta (empleados internos)
      return isGuide && guideType === 'AGENCY';
    }).length;
    const guiasFreelance = users.filter(u => {
      const roleName = typeof u.role === 'object' ? u.role?.name?.toLowerCase() : u.role?.toLowerCase();
      const isGuide = roleName === 'guide' || roleName === 'guia';
      const guideType = u.guide?.guideType?.toUpperCase() || u.guideType?.toUpperCase();
      return isGuide && guideType === 'FREELANCE';
    }).length;

    return {
      total,
      administradores,
      agencias,
      guias,
      guiasPlanta,
      guiasFreelance
    };
  },

  // Refrescar estadisticas desde API-030: GET /api/users/stats
  refreshRoleStats: async () => {
    try {
      const result = await usersService.getUsersStats();
      if (result.success && result.data) {
        set({ roleStats: result.data });
        return result.data;
      }
    } catch (error) {
      console.error('[usersStore] Error refreshing role stats:', error);
    }
    return null;
  },

  resetUserPassword: async (userId) => {
    set({ isLoading: true, error: null });

    try {
      // Llama API-027: POST /api/users/:id/reset-password
      const result = await usersService.resetUserPassword(userId);

      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }

      set({ isLoading: false });

      // Retorna la data con newPassword generada por el backend
      return result.data;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Estados de carga
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

export { useUsersStore };
export default useUsersStore;