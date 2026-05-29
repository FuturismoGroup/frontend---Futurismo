import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import useHistoryStore from '../stores/historyStore';
import useAuthStore from '../stores/authStore';
import HistoryFilters from '../components/history/HistoryFilters';
import HistoryTable from '../components/history/HistoryTable';
import HistoryPagination from '../components/history/HistoryPagination';
import ServiceDetailsModal from '../components/history/ServiceDetailsModal';
import RatingModal from '../components/rating/RatingModal';
import ratingsService from '../services/ratingsService';
import api from '../services/api';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const History = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [selectedService, setSelectedService] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [allFilterOptions, setAllFilterOptions] = useState({ allGuides: [], allDrivers: [], allVehicles: [] });
  const [serviceTypes, setServiceTypes] = useState([]);

  const {
    filteredServices,
    filters,
    pagination,
    sort,
    loading,
    error,
    loadHistory,
    updateFilter,
    clearFilters,
    changePage,
    updateSort,
    getPaginatedServices,
    getFilterOptions,
    getAllFilterOptions
  } = useHistoryStore();

  useEffect(() => {
    const loadData = async () => {
      await loadHistory();
      // Cargar todas las opciones disponibles (incluyendo no asignados)
      const allOptions = await getAllFilterOptions();
      setAllFilterOptions(allOptions);

      // Cargar tipos de servicio dinámicos creados por el admin
      try {
        const response = await api.get('/config/service-types');
        if (response.data?.success) {
          setServiceTypes(response.data.data?.serviceTypes || []);
        }
      } catch (err) {
        // Silenciar: la tabla y el filtro caerán al fallback "Sin tipo"
      }
    };
    loadData();
  }, []); // Empty dependency array to run only once

  const handleViewDetails = (service) => {
    setSelectedService(service);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedService(null);
  };

  const handleRate = (service) => {
    setSelectedService(service);
    setIsRatingModalOpen(true);
  };

  const handleCloseRating = () => {
    setIsRatingModalOpen(false);
    setSelectedService(null);
  };

  const handleSubmitRating = async (ratingData) => {
    setRatingLoading(true);
    try {
      // Validar que tenemos el ID de la reserva
      if (!selectedService?.id) {
        toast.error(t('rating.errors.noReservation'));
        return;
      }

      // Mapear datos del modal al formato esperado por API-053
      // El modal envia: {rating, comment, serviceId, type}
      // La API espera: {overallRating, guideRating?, driverRating?, vehicleRating?, comment}
      const apiData = {
        overallRating: ratingData.rating,
        comment: ratingData.comment || ''
      };

      // Si hay guia asignado, tambien calificar al guia con el mismo rating
      if (selectedService.guide_id || selectedService.guideId) {
        apiData.guideRating = ratingData.rating;
      }

      // Llamar a la API real - POST /api/reservations/:reservationId/rating
      const result = await ratingsService.createRating(selectedService.id, apiData);

      if (result.success) {
        toast.success(t('rating.success'));
        // Recargar historial para reflejar el cambio
        await loadHistory();
        handleCloseRating();
      } else {
        // Manejar errores especificos
        if (result.status === 409) {
          toast.error(t('rating.errors.alreadyRated'));
        } else if (result.status === 400) {
          toast.error(result.error || t('rating.errors.invalidData'));
        } else {
          toast.error(result.error || t('rating.errors.submitFailed'));
        }
      }
    } catch (error) {
      toast.error(t('rating.errors.submitFailed'));
    } finally {
      setRatingLoading(false);
    }
  };

  const exportHistory = () => {
    if (!filteredServices || filteredServices.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      // Preparar datos para exportar
      const headers = [[
        'ID Reserva',
        'Fecha',
        'Tour/Servicio',
        'Cliente',
        'Guía',
        'Conductor',
        'Vehículo',
        'Participantes',
        'Precio',
        'Estado',
        'Punto de Encuentro',
        'Hora'
      ]];

      const rows = filteredServices.map(service => [
        service.id || service.reservationId || 'N/A',
        service.date ? format(new Date(service.date), 'dd/MM/yyyy', { locale: es }) : 'N/A',
        service.tour || service.tourName || 'N/A',
        service.client || service.clientName || 'N/A',
        service.guide || service.guideName || 'No asignado',
        service.driver || service.driverName || 'No asignado',
        service.vehicle || service.vehiclePlate || 'No asignado',
        service.participants || 0,
        (service.price ?? service.amount)
          ? `$${(service.price ?? service.amount).toLocaleString()}`
          : 'N/A',
        service.status === 'completed' ? 'Completado' :
        service.status === 'pending' ? 'Pendiente' :
        service.status === 'cancelled' ? 'Cancelado' :
        service.status === 'confirmed' ? 'Confirmado' : service.status,
        service.meetingPoint || 'No especificado',
        service.time || service.startTime || 'N/A'
      ]);

      // Resumen del historial
      const totalCompletedServices = filteredServices.filter(s => s.status === 'completed').length;
      const totalPendingServices = filteredServices.filter(s => s.status === 'pending').length;
      const totalCancelledServices = filteredServices.filter(s => s.status === 'cancelled').length;
      const summaryRows = [
        ['Total de servicios', filteredServices.length],
        ['Servicios completados', totalCompletedServices],
        ['Servicios pendientes', totalPendingServices],
        ['Servicios cancelados', totalCancelledServices]
      ];

      // Agencias no ven información de ingresos
      if (user?.role !== 'agency') {
        const totalRevenue = filteredServices
          .filter(s => s.status === 'completed')
          .reduce((sum, s) => sum + (s.price ?? s.amount ?? 0), 0);
        summaryRows.push(['Ingresos totales (completados)', `$${totalRevenue.toLocaleString()}`]);
      }

      const summaryData = [
        ['HISTORIAL DE SERVICIOS'],
        ['Exportado por', user?.name || user?.email || 'Usuario'],
        ['Fecha de exportación', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })],
        [],
        ['RESUMEN'],
        ...summaryRows,
        [],
        ['FILTROS APLICADOS'],
        ['Estado', filters.status || 'Todos'],
        ['Tour', filters.tour || 'Todos'],
        ['Guía', filters.guide || 'Todos'],
        ['Conductor', filters.driver || 'Todos'],
        ['Fecha desde', filters.dateFrom || 'N/A'],
        ['Fecha hasta', filters.dateTo || 'N/A'],
        [],
        ...headers,
        ...rows
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Configurar anchos de columna
      worksheet['!cols'] = [
        { wch: 15 }, // ID Reserva
        { wch: 12 }, // Fecha
        { wch: 30 }, // Tour/Servicio
        { wch: 25 }, // Cliente
        { wch: 20 }, // Guía
        { wch: 20 }, // Conductor
        { wch: 15 }, // Vehículo
        { wch: 12 }, // Participantes
        { wch: 12 }, // Precio
        { wch: 12 }, // Estado
        { wch: 30 }, // Punto de Encuentro
        { wch: 10 }  // Hora
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de Servicios');

      // Generar nombre de archivo
      const userName = user?.name?.replace(/\s+/g, '_') || 'usuario';
      const fileName = `Historial_Servicios_${userName}_${format(new Date(), 'yyyyMMdd')}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success('✅ Historial exportado correctamente');
    } catch (error) {
      toast.error('Error al exportar el historial');
    }
  };

  const paginatedServices = getPaginatedServices();
  const filterOptions = getFilterOptions();

  // Filtrar opciones según el rol del usuario
  const getFilteredOptions = () => {
    if (user?.role === 'guide') {
      // Los guías solo ven sus propios servicios
      return {
        guides: [user.name],
        drivers: filterOptions.drivers,
        vehicles: filterOptions.vehicles
      };
    }
    return filterOptions;
  };

  const roleFilteredOptions = getFilteredOptions();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-red-500 mb-4">
            <DocumentTextIcon className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('history.error.title')}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {error}
          </p>
          <button
            onClick={loadHistory}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('history.error.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('history.title')}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {(user?.role === 'admin' || user?.role === 'administrator') && t('history.description.admin')}
                {user?.role === 'agency' && t('history.description.agency')}
                {user?.role === 'guide' && t('history.description.guide')}
              </p>
            </div>

            {/* Botón de exportar */}
            <button
              onClick={exportHistory}
              disabled={loading || filteredServices.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Exportar a Excel</span>
            </button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="flex justify-end">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredServices.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('history.stats.filtered')}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredServices.filter(s => s.status === 'completed').length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('history.stats.completed')}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {filteredServices.filter(s => s.status === 'pending').length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('history.stats.pending')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <HistoryFilters
          filters={filters}
          onUpdateFilter={updateFilter}
          onClearFilters={clearFilters}
          filterOptions={roleFilteredOptions}
          allFilterOptions={allFilterOptions}
          serviceTypes={serviceTypes}
          loading={loading}
        />

        {/* Tabla */}
        <div className="mb-6">
          <HistoryTable
            services={paginatedServices}
            sort={sort}
            onSort={updateSort}
            onViewDetails={handleViewDetails}
            onRate={user?.role === 'agency' ? handleRate : undefined}
            serviceTypes={serviceTypes}
            loading={loading}
          />
        </div>

        {/* Paginación */}
        <HistoryPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={changePage}
          loading={loading}
        />

        {/* Modal de detalles */}
        <ServiceDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetails}
          service={selectedService}
        />

        {/* Modal de calificación */}
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={handleCloseRating}
          onSubmit={handleSubmitRating}
          service={selectedService}
          type="service"
          loading={ratingLoading}
        />
      </div>
    </div>
  );
};

export default History;