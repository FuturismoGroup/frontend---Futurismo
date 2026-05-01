/**
 * Store de clientes
 * En este sistema, CLIENTES = AGENCIAS
 * Este store es un wrapper que redirige a los datos de agencias
 */

import { create } from 'zustand';
import i18next from 'i18next';
import agencyService from '../services/agencyService';

const useClientsStore = create((set, get) => ({
  // Estado
  clients: [],
  isLoading: false,
  error: null,
  hasInitialized: false,

  // Inicializar (cargar agencias como clientes)
  initialize: async () => {
    const { hasInitialized } = get();
    if (hasInitialized) return;

    set({ isLoading: true, error: null });

    try {
      const result = await agencyService.getAgencies();

      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }

      // Mapear agencias a formato de clientes
      const agencies = result.data?.data || result.data || [];
      const clients = agencies.map(agency => ({
        id: agency.id,
        name: agency.business_name || agency.businessName,
        email: agency.agency_email || agency.agencyEmail,
        phone: agency.agency_phone || agency.agencyPhone,
        ruc: agency.ruc,
        address: agency.agency_address || agency.agencyAddress,
        level: agency.level,
        status: agency.status,
        // Datos del usuario asociado
        contactName: agency.user ? `${agency.user.first_name} ${agency.user.last_name}` : null,
        contactEmail: agency.user?.email,
        userId: agency.user_id
      }));

      set({
        clients,
        isLoading: false,
        hasInitialized: true
      });

      return clients;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Alias para compatibilidad
  loadClients: async () => {
    return get().initialize();
  },

  // Obtener cliente por ID
  getClientById: (id) => {
    const { clients } = get();
    return clients.find(client => client.id === id);
  },

  // Buscar clientes
  searchClients: (term) => {
    const { clients } = get();
    if (!term) return clients;

    const searchTerm = term.toLowerCase();
    return clients.filter(client =>
      client.name?.toLowerCase().includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm) ||
      client.ruc?.includes(searchTerm)
    );
  },

  // Limpiar estado
  reset: () => {
    set({
      clients: [],
      isLoading: false,
      error: null,
      hasInitialized: false
    });
  }
}));

export { useClientsStore };
export default useClientsStore;
