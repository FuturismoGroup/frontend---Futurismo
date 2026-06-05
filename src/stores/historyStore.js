import { create } from 'zustand';
import i18next from 'i18next';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useHistoryStore = create(
  persist(
    (set, get) => ({
      // Estado del historial
      services: [],
      filteredServices: [],
      loading: false,
      error: null,
      
      // Filtros
      filters: {
        dateRange: 'all', // all, today, week, month, year
        status: 'all', // all, completed, cancelled, pending
        serviceType: 'all', // all, regular, private, transfer
        search: '',
        guide: 'all',
        driver: 'all',
        vehicle: 'all'
      },

      // Paginación
      pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0
      },

      // Ordenamiento
      sort: {
        field: 'date',
        direction: 'desc' // asc, desc
      },

      // Cargar servicios del historial desde la API
      loadHistory: async () => {
        set({ loading: true, error: null });
        try {
          // Importar los stores necesarios dinámicamente
          const useReservationsStore = (await import('./reservationsStore')).default;
          const useAuthStore = (await import('./authStore')).useAuthStore;

          // Obtener datos de los stores
          const reservationsStore = useReservationsStore.getState();
          const currentUser = useAuthStore.getState().user;

          // Siempre re-fetch para obtener datos actualizados (ej: después de calificar)
          await reservationsStore.fetchReservations();

          // Cargar tours para obtener nombres
          const toursResponse = await api.get('/data/section/tours');
          const toursData = toursResponse.data;

          // Cargar guías
          const guidesResponse = await api.get('/data/section/guides');
          const guidesData = guidesResponse.data;

          // Cargar drivers
          const driversResponse = await api.get('/data/section/drivers');
          const driversData = driversResponse.data;

          // Cargar vehicles
          const vehiclesResponse = await api.get('/data/section/vehicles');
          const vehiclesData = vehiclesResponse.data;

          // Obtener las reservaciones actualizadas después del fetch
          const updatedReservationsStore = useReservationsStore.getState();

          let reservations = updatedReservationsStore.reservations || [];
          const tours = toursData.success ? toursData.data : [];
          const guides = guidesData.success ? guidesData.data : [];
          const drivers = driversData.success ? driversData.data : [];
          const vehicles = vehiclesData.success ? vehiclesData.data : [];

          // Cargar agencias para obtener nombres de clientes
          // Solo admin puede cargar todas las agencias
          // Para usuarios de tipo agency, usamos su propia información
          let agencies = [];
          if (currentUser?.role === 'admin' || currentUser?.role === 'administrator') {
            try {
              const agenciesResponse = await api.get('/agencies');
              if (agenciesResponse.data.success) {
                agencies = agenciesResponse.data.data || [];
              }
            } catch (e) {
              // Silently handle agency load failure
            }
          } else if (currentUser?.role === 'agency' && currentUser?.agencyId) {
            // Para agencias, usar la información del usuario actual
            agencies = [{
              id: currentUser.agencyId,
              business_name: currentUser.agencyName || currentUser.name || i18next.t('common.noData')
            }];
          }

          // ✅ FILTRAR POR AGENCIA si el usuario es de tipo agency
          // NOTA: El backend ya filtra las reservaciones por agencia en el endpoint,
          // pero hacemos un filtro adicional por seguridad usando el agencyId del usuario
          if (currentUser?.role === 'agency') {
            // El backend envía agencyId (camelCase) en el objeto user
            const agencyId = currentUser.agencyId || currentUser.agency_id;

            // Filtrar solo las reservaciones de esta agencia
            if (agencyId) {
              // Las reservaciones pueden venir con agency_id o agencyId
              reservations = reservations.filter(r =>
                r.agency_id === agencyId || r.agencyId === agencyId
              );
            }
          }

          // ✅ FILTRAR POR GUÍA si el usuario es de tipo guide
          // NOTA: El backend ya filtra las reservaciones por guía,
          // este filtro adicional es una capa extra de seguridad
          if (currentUser?.role === 'guide') {
            // Usar guideId del token del usuario (más confiable)
            const guideId = currentUser.guideId || currentUser.guide_id;

            if (guideId) {
              // Soportar ambos formatos: guide_id (snake_case) y guideId (camelCase)
              reservations = reservations.filter(r =>
                r.guide_id === guideId || r.guideId === guideId
              );
            } else {
              // Fallback: buscar por email si no hay guideId en el token
              const currentGuide = guides.find(g => g.email === currentUser.email);
              if (currentGuide) {
                reservations = reservations.filter(r =>
                  r.guide_id === currentGuide.id || r.guideId === currentGuide.id
                );
              } else {
                reservations = [];
              }
            }
          }

          // Transformar reservas a formato de historial de servicios
          const historyData = reservations.map(reservation => {
            // El backend ya incluye tour, guide, agency como objetos anidados
            // Usar esos datos directamente, o hacer fallback a búsqueda por ID

            // Nombre del servicio/tour
            let serviceName = i18next.t('common.noData');
            if (reservation.tour?.name) {
              serviceName = reservation.tour.name;
            } else if (reservation.tourId) {
              const tour = tours.find(t => t.id === reservation.tourId);
              serviceName = tour?.name || tour?.title || serviceName;
            }

            // Nombre del guía
            let guideName = i18next.t('common.noData');
            if (reservation.guide) {
              // El backend devuelve guide.firstName y guide.lastName
              guideName = [reservation.guide.firstName, reservation.guide.lastName]
                .filter(Boolean).join(' ') || guideName;
            } else if (reservation.tourAssignment?.guideName) {
              guideName = reservation.tourAssignment.guideName;
            } else if (reservation.guideId) {
              const guide = guides.find(g => g.id === reservation.guideId);
              if (guide) {
                guideName = guide.name || guide.fullName ||
                  [guide.first_name, guide.last_name].filter(Boolean).join(' ') || guideName;
              }
            }

            // Nombre de la agencia/cliente
            let clientName = i18next.t('common.noData');
            if (reservation.agency?.businessName) {
              clientName = reservation.agency.businessName;
            } else if (reservation.agency?.name) {
              clientName = reservation.agency.name;
            } else if (reservation.agencyId) {
              const agency = agencies.find(a => a.id === reservation.agencyId);
              clientName = agency?.business_name || agency?.name || clientName;
            }

            // Nombre del chofer
            let driverName = i18next.t('common.noData');
            if (reservation.tourAssignment?.driverName) {
              driverName = reservation.tourAssignment.driverName;
            } else if (reservation.driverId) {
              const driver = drivers.find(d => d.id === reservation.driverId);
              if (driver) {
                driverName = driver.name || driver.fullName ||
                  [driver.first_name, driver.last_name].filter(Boolean).join(' ') || driverName;
              }
            }

            // Información del vehículo
            let vehicleInfo = i18next.t('common.noData');
            if (reservation.tourAssignment?.vehicleInfo) {
              vehicleInfo = reservation.tourAssignment.vehicleInfo;
              if (reservation.tourAssignment.vehiclePlate) {
                vehicleInfo += ` (${reservation.tourAssignment.vehiclePlate})`;
              }
            } else if (reservation.vehicleId) {
              const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
              if (vehicle) {
                vehicleInfo = `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`;
              }
            }

            // Duración del tour
            const duration = reservation.tour?.duration || reservation.duration || 4;

            return {
              id: reservation.id,
              serviceName: serviceName,
              clientName: clientName,
              date: typeof reservation.date === 'string'
                ? reservation.date
                : reservation.date?.toISOString?.().split('T')[0] || '',
              time: (() => {
                const t = reservation.time || '00:00';
                return typeof t === 'string' && t.includes('T') ? t.split('T')[1].substring(0, 5) : t;
              })(),
              duration: duration,
              status: reservation.status || (reservation.guideId ? 'confirmed' : 'pending'),
              serviceType: reservation.tour?.tourType || reservation.serviceType || '',
              guide: guideName,
              driver: driverName,
              vehicle: vehicleInfo,
              participants: reservation.participants || 0,
              passengers: reservation.participants || 0,
              amount: parseFloat(reservation.totalAmount) || 0,
              rating: reservation.rating || reservation.ratings?.overall_rating || 0,
              review_comment: reservation.ratingComment || reservation.ratings?.comment || null,
              reviewed_at: reservation.ratingDate || reservation.ratings?.created_at || null,
              hasRating: !!(reservation.rating || reservation.ratings?.overall_rating),
              paymentStatus: reservation.paymentStatus || 'pending',
              reservationCode: reservation.id
            };
          });

          const totalItems = historyData.length;
          const totalPages = Math.ceil(totalItems / get().pagination.itemsPerPage);

          set({
            services: historyData,
            filteredServices: historyData,
            loading: false,
            pagination: {
              ...get().pagination,
              totalItems,
              totalPages
            }
          });
        } catch (error) {
          set({
            error: error.message || i18next.t('errors.unexpectedError'),
            loading: false
          });
        }
      },

      // Aplicar filtros (legacy - not used anymore to avoid circular calls)
      applyFilters: () => {
        // This function is kept for compatibility but not used
        // All filtering is now done inline in updateFilter, clearFilters, etc.
      },

      // Actualizar filtros
      updateFilter: (filterName, value) => {
        const state = get();
        const newFilters = {
          ...state.filters,
          [filterName]: value
        };
        
        // Apply filters immediately without calling applyFilters
        let filtered = [...state.services];

        // Filter logic (moved here to avoid circular calls)
        if (newFilters.search.trim()) {
          const searchTerm = newFilters.search.toLowerCase();
          filtered = filtered.filter(service => 
            service.serviceName.toLowerCase().includes(searchTerm) ||
            service.clientName.toLowerCase().includes(searchTerm) ||
            service.guide?.toLowerCase().includes(searchTerm) ||
            service.driver?.toLowerCase().includes(searchTerm)
          );
        }

        if (newFilters.dateRange !== 'all') {
          const now = new Date();
          // El módulo es "Historial": ningún rango debe incluir fechas futuras,
          // por eso aplicamos también un techo en el fin del día de hoy.
          const { start, end } = getDateByRange(newFilters.dateRange, now);
          filtered = filtered.filter(service => {
            const serviceDate = new Date(service.date);
            return serviceDate >= start && serviceDate <= end;
          });
        }

        if (newFilters.status !== 'all') {
          filtered = filtered.filter(service => service.status === newFilters.status);
        }

        if (newFilters.serviceType !== 'all') {
          filtered = filtered.filter(service => service.serviceType === newFilters.serviceType);
        }

        if (newFilters.guide !== 'all') {
          filtered = filtered.filter(service => service.guide === newFilters.guide);
        }

        if (newFilters.driver !== 'all') {
          filtered = filtered.filter(service => service.driver === newFilters.driver);
        }

        if (newFilters.vehicle !== 'all') {
          filtered = filtered.filter(service => service.vehicle === newFilters.vehicle);
        }

        // Sort
        filtered.sort((a, b) => {
          const { field, direction } = state.sort;
          let aVal = a[field];
          let bVal = b[field];

          if (field === 'date') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
          }

          if (direction === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });

        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / state.pagination.itemsPerPage);

        set({
          filters: newFilters,
          filteredServices: filtered,
          pagination: {
            ...state.pagination,
            currentPage: 1,
            totalItems,
            totalPages
          }
        });
      },

      // Limpiar filtros
      clearFilters: () => {
        const state = get();
        const totalItems = state.services.length;
        const totalPages = Math.ceil(totalItems / state.pagination.itemsPerPage);
        
        set({
          filters: {
            dateRange: 'all',
            status: 'all',
            serviceType: 'all',
            search: '',
            guide: 'all',
            driver: 'all',
            vehicle: 'all'
          },
          filteredServices: [...state.services],
          pagination: {
            ...state.pagination,
            currentPage: 1,
            totalItems,
            totalPages
          }
        });
      },

      // Cambiar página
      changePage: (page) => {
        set(state => ({
          pagination: {
            ...state.pagination,
            currentPage: page
          }
        }));
      },

      // Cambiar ordenamiento
      updateSort: (field) => {
        const state = get();
        const currentSort = state.sort;
        const newDirection = currentSort.field === field && currentSort.direction === 'desc' 
          ? 'asc' 
          : 'desc';
        
        // Sort filtered services directly
        const sortedServices = [...state.filteredServices];
        sortedServices.sort((a, b) => {
          let aVal = a[field];
          let bVal = b[field];

          if (field === 'date') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
          }

          if (newDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
        
        set({
          sort: {
            field,
            direction: newDirection
          },
          filteredServices: sortedServices
        });
      },

      // Obtener servicios paginados
      getPaginatedServices: () => {
        const { filteredServices, pagination } = get();
        const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
        const endIndex = startIndex + pagination.itemsPerPage;
        return filteredServices.slice(startIndex, endIndex);
      },

      // Obtener opciones únicas para filtros
      getFilterOptions: () => {
        const { services } = get();

        // Obtener los que están asignados en reservas
        const assignedGuides = new Set(services.map(s => s.guide).filter(g => g && g !== i18next.t('common.noData') && g !== 'N/A'));
        const assignedDrivers = new Set(services.map(s => s.driver).filter(d => d && d !== i18next.t('common.noData') && d !== 'N/A'));
        const assignedVehicles = new Set(services.map(s => s.vehicle).filter(v => v && v !== i18next.t('common.noData') && v !== 'N/A'));

        return {
          guides: [...assignedGuides],
          drivers: [...assignedDrivers],
          vehicles: [...assignedVehicles],
          assignedGuides: assignedGuides,
          assignedDrivers: assignedDrivers,
          assignedVehicles: assignedVehicles
        };
      },

      // Obtener todas las opciones disponibles (incluyendo no asignados)
      getAllFilterOptions: async () => {
        try {
          // Cargar todos los drivers disponibles
          const driversResponse = await api.get('/data/section/drivers');
          const driversData = driversResponse.data;

          // Cargar todos los vehicles disponibles
          const vehiclesResponse = await api.get('/data/section/vehicles');
          const vehiclesData = vehiclesResponse.data;

          // Cargar todas las guías disponibles
          const guidesResponse = await api.get('/data/section/guides');
          const guidesData = guidesResponse.data;

          const allDrivers = driversData.success ? driversData.data : [];
          const allVehicles = vehiclesData.success ? vehiclesData.data : [];
          const allGuides = guidesData.success ? guidesData.data : [];

          // Obtener los asignados
          const filterOptions = get().getFilterOptions();

          return {
            allGuides: allGuides.map(g => ({
              id: g.id,
              name: g.name || g.fullName || (g.first_name && g.last_name ? `${g.first_name} ${g.last_name}` : i18next.t('common.noData')),
              assigned: filterOptions.assignedGuides.has(g.name || g.fullName || (g.first_name && g.last_name ? `${g.first_name} ${g.last_name}` : ''))
            })),
            allDrivers: allDrivers.map(d => ({
              id: d.id,
              name: d.name || d.fullName || (d.first_name && d.last_name ? `${d.first_name} ${d.last_name}` : i18next.t('common.noData')),
              assigned: filterOptions.assignedDrivers.has(d.name || d.fullName || (d.first_name && d.last_name ? `${d.first_name} ${d.last_name}` : ''))
            })),
            allVehicles: allVehicles.map(v => ({
              id: v.id,
              name: `${v.brand} ${v.model} (${v.plate})`,
              assigned: filterOptions.assignedVehicles.has(`${v.brand} ${v.model} (${v.plate})`)
            }))
          };
        } catch (error) {
          return {
            allGuides: [],
            allDrivers: [],
            allVehicles: []
          };
        }
      }
    }),
    {
      name: 'history-store',
      partialize: (state) => ({ 
        filters: state.filters,
        pagination: state.pagination,
        sort: state.sort 
      })
    }
  )
);

// Devuelve el rango {start, end} para filtrar el historial.
// `end` siempre es el fin del día de hoy (nunca futuro), porque el módulo
// es "Historial" — un servicio con fecha posterior a hoy no debería aparecer
// aunque exista en la base. Antes esta función devolvía solo `start` y se
// filtraba con `>= start`, lo que dejaba pasar todas las reservas futuras.
function getDateByRange(range, baseDate) {
  const start = new Date(baseDate);
  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      return { start: new Date(0), end };
  }

  return { start, end };
}

export default useHistoryStore;