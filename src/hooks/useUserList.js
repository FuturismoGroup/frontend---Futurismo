import { useState, useEffect, useMemo } from 'react';
import { useUsersStore } from '../stores/usersStoreSimple';

export const useUserList = () => {
  // Suscribirse directamente a las funciones del store
  const toggleUserStatus = useUsersStore((state) => state.toggleUserStatus);
  const resetUserPassword = useUsersStore((state) => state.resetUserPassword);
  const setFilters = useUsersStore((state) => state.setFilters);
  const clearFilters = useUsersStore((state) => state.clearFilters);
  const initialize = useUsersStore((state) => state.initialize);
  const hasInitialized = useUsersStore((state) => state.hasInitialized);
  const getUsers = useUsersStore((state) => state.getUsers);

  // Suscribirse a datos reactivos del store
  const allUsers = useUsersStore((state) => state.users);
  const filters = useUsersStore((state) => state.filters);
  const roleStats = useUsersStore((state) => state.getRoleStatistics());
  const roles = useUsersStore((state) => state.getRoles());

  // Computar usuarios filtrados cuando cambien users o filters
  const users = useMemo(() => getUsers(filters), [allUsers, filters, getUsers]);
  const stats = useMemo(() => {
    const total = allUsers.length;
    const active = allUsers.filter(u => u.status === 'active').length;
    const inactive = allUsers.filter(u => u.status === 'inactive').length;
    return { total, active, inactive, activeRate: total > 0 ? (active / total * 100).toFixed(1) : 0 };
  }, [allUsers]);

  const [showFilters, setShowFilters] = useState(false);

  // Inicializar el store al montar el componente
  useEffect(() => {
    if (!hasInitialized) {
      initialize().catch(err => console.error('Error initializing users:', err));
    }
  }, [hasInitialized, initialize]);

  const handleSearch = (e) => {
    setFilters({ search: e.target.value });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  const handleStatusToggle = (userId) => {
    toggleUserStatus(userId);
  };

  const handlePasswordReset = async (userId, onConfirm, onSuccess) => {
    try {
      // Llama API-027: POST /api/users/:id/reset-password
      // Backend genera password aleatorio y lo retorna
      const result = await resetUserPassword(userId);
      if (onSuccess && result?.newPassword) {
        onSuccess(result.newPassword);
      }
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
    }
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(v => v !== '');
  };

  const getDepartments = () => {
    return [...new Set(users.map(user => user.department))];
  };

  return {
    // State
    users,
    stats,
    roleStats,
    roles,
    showFilters,
    filters,
    
    // Actions
    handleSearch,
    handleFilterChange,
    handleStatusToggle,
    handlePasswordReset,
    clearFilters,
    setShowFilters,
    
    // Computed
    hasActiveFilters,
    getDepartments
  };
};