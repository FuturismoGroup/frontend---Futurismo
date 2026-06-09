import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TicketIcon,
  MapIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import useStatisticsStore from '../../stores/statisticsStore';
import useReservationsStore from '../../stores/reservationsStore';
import useClientsStore from '../../stores/clientsStore';
import useProvidersStore from '../../stores/providersStore';
import toursService from '../../services/toursService';
import exportService from '../../services/exportService';
import toast from 'react-hot-toast';

function Reports() {
  const { t } = useTranslation();
  // Store hooks
  const { loadDashboard, kpis, isLoading } = useStatisticsStore();
  const { reservations, fetchReservations } = useReservationsStore();
  const { clients, loadClients } = useClientsStore();
  const { providers, actions } = useProvidersStore();

  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [tours, setTours] = useState([]);

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadDashboard(),
          fetchReservations(),
          loadClients(),
          actions.fetchProviders()
        ]);

        // Cargar tours para relacionar service_id con nombres (API real: GET /api/tours)
        const toursResult = await toursService.getTours();
        if (toursResult.success) {
          // La API puede devolver data.data o data directamente
          const toursArray = toursResult.data?.data || toursResult.data || [];
          setTours(toursArray);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    loadData();
  }, []);

  const loadReports = async () => {
    try {
      await loadDashboard();
    } catch (error) {
      console.error('Error cargando reportes:', error);
      toast.error(t('adminReports.errorLoading'));
    }
  };

  // Filtrar reservas por rango de fechas
  const getFilteredReservations = () => {
    if (!reservations || reservations.length === 0) {
      return [];
    }

    return reservations.filter(reservation => {
      const resDate = new Date(reservation.date);
      return resDate >= startDate && resDate <= endDate;
    });
  };

  const filteredReservations = getFilteredReservations();

  // Calcular estadísticas desde los datos filtrados
  const reportData = {
    totalBookings: filteredReservations?.length || 0,
    totalRevenue: filteredReservations?.reduce((sum, res) => sum + (res.total_amount || res.total || 0), 0) || 0,
    totalUsers: clients?.length || 0,
    totalProviders: providers?.length || 0,
    bookingsByStatus: {
      pending: filteredReservations?.filter(r => r.status === 'pending').length || 0,
      confirmed: filteredReservations?.filter(r => r.status === 'confirmed').length || 0,
      in_progress: filteredReservations?.filter(r => r.status === 'in_progress').length || 0,
      completed: filteredReservations?.filter(r => r.status === 'completed').length || 0,
      cancelled: filteredReservations?.filter(r => r.status === 'cancelled').length || 0
    },
    topDestinations: getTopDestinations(filteredReservations)
  };

  // Función para obtener top destinos
  function getTopDestinations(filteredData) {
    if (!filteredData || filteredData.length === 0) {
      return [];
    }

    const destinationCounts = {};
    filteredData.forEach(reservation => {
      let destination = reservation.service_name || reservation.destination || reservation.tourName;

      // Si no tiene nombre directo, buscar por service_id en la lista de tours
      if (!destination && reservation.service_id && tours.length > 0) {
        const tour = tours.find(t => t.id === reservation.service_id);
        destination = tour ? (tour.name || tour.title) : null;
      }

      // Si aún no hay nombre, usar un fallback
      if (!destination) {
        destination = t('adminReports.unnamedService');
      }

      destinationCounts[destination] = (destinationCounts[destination] || 0) + 1;
    });

    return Object.entries(destinationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }


  const exportToExcel = async () => {
    try {
      const formatReservationDateTime = (rawDate, rawTime) => {
        if (!rawDate) return '';
        const parsed = new Date(rawDate);
        if (isNaN(parsed.getTime())) return '';
        const day = String(parsed.getUTCDate()).padStart(2, '0');
        const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
        const year = parsed.getUTCFullYear();
        let hours = String(parsed.getUTCHours()).padStart(2, '0');
        let minutes = String(parsed.getUTCMinutes()).padStart(2, '0');
        if (hours === '00' && minutes === '00' && typeof rawTime === 'string') {
          const match = rawTime.match(/(\d{1,2}):(\d{2})/);
          if (match) {
            hours = match[1].padStart(2, '0');
            minutes = match[2];
          }
        }
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      };

      const formatCodigo = (reservation) => {
        if (reservation.reservation_code) return reservation.reservation_code;
        if (!reservation.id) return 'N/A';
        return String(reservation.id).substring(0, 8).toUpperCase();
      };

      // Preparar datos para exportar usando las reservas ya filtradas
      const exportData = (filteredReservations || [])
        .map(reservation => {
          // Obtener nombre del servicio
          let serviceName = reservation.service_name || reservation.tourName;
          if (!serviceName && reservation.service_id && tours.length > 0) {
            const tour = tours.find(t => t.id === reservation.service_id);
            serviceName = tour ? (tour.name || tour.title) : 'Sin especificar';
          }
          if (!serviceName) serviceName = t('adminReports.notSpecified');

          return {
            codigo: formatCodigo(reservation),
            fecha: formatReservationDateTime(
              reservation.date || reservation.tour_date,
              reservation.time || reservation.tour_time
            ),
            servicio: serviceName,
            cliente: reservation.client_name || reservation.agencyName || reservation.clientName || t('adminReports.directClient'),
            participantes: reservation.group_size || reservation.participants || (reservation.adults || 0) + (reservation.children || 0),
            monto: reservation.total_amount || reservation.total || 0,
            estado: reservation.status || 'pendiente',
            estado_pago: reservation.payment_status || reservation.paymentStatus || 'pendiente',
            guia: reservation.guideName || t('adminReports.toAssign')
          };
        });

      if (exportData.length === 0) {
        toast.error(t('reports.noDataForExport'));
        return;
      }

      // Usar el servicio de exportación correcto
      exportService.exportToExcel(
        exportData,
        `reporte_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}`,
        t('adminReports.reportTitle')
      );

      toast.success(t('adminReports.exportSuccess'));
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      toast.error(t('adminReports.exportError'));
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t('adminReports.title')}</h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Selector de fechas */}
            <div className="flex gap-2">
              <input
                type="date"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Botón exportar */}
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              {t('adminReports.exportExcel')}
            </button>
          </div>
        </div>

        <p className="mt-2 text-gray-600">
          {t('adminReports.dateRangeLabel', {
            from: format(startDate, 'dd/MM/yyyy', { locale: es }),
            to: format(endDate, 'dd/MM/yyyy', { locale: es })
          })}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Mensaje cuando no hay datos */}
          {filteredReservations.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 font-medium">
                {t('adminReports.noReservationsInPeriod')}
              </p>
              <p className="text-yellow-600 text-sm mt-1">
                {t('adminReports.trySelectDifferentRange')}
              </p>
            </div>
          )}

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={TicketIcon}
              title={t('adminReports.cards.totalReservations')}
              value={reportData.totalBookings}
              subtitle={t('adminReports.cards.inSelectedPeriod')}
              color="blue"
            />
            <StatCard
              icon={CurrencyDollarIcon}
              title={t('adminReports.cards.totalRevenue')}
              value={`S/. ${(reportData.totalRevenue || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle={t('adminReports.cards.sumOfAllReservations')}
              color="green"
            />
            <StatCard
              icon={UserGroupIcon}
              title={t('adminReports.cards.totalUsers')}
              value={reportData.totalUsers}
              subtitle={t('adminReports.cards.registeredUsers')}
              color="purple"
            />
            <StatCard
              icon={MapIcon}
              title={t('adminReports.cards.totalProviders')}
              value={reportData.totalProviders}
              subtitle={t('adminReports.cards.activeProviders')}
              color="orange"
            />
          </div>

          {/* Gráficos y tablas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estados de reservas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('adminReports.reservationsStatusTitle')}</h2>
              <div className="space-y-4">
                {Object.entries(reportData.bookingsByStatus || {}).map(([status, count]) => {
                  const statusLabels = {
                    pending: t('common.status.pending'),
                    confirmed: t('common.status.confirmed'),
                    in_progress: t('common.status.inProgress'),
                    completed: t('common.status.completed'),
                    cancelled: t('common.status.cancelled')
                  };

                  const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
                    in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
                    completed: 'bg-green-100 text-green-800 border-green-200',
                    cancelled: 'bg-red-100 text-red-800 border-red-200'
                  };

                  const statusIcons = {
                    pending: '⏳',
                    confirmed: '✓',
                    in_progress: '▶',
                    completed: '✓✓',
                    cancelled: '✗'
                  };

                  const percentage = reportData.totalBookings > 0
                    ? ((count / reportData.totalBookings) * 100).toFixed(1)
                    : 0;

                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                            <span className="mr-1.5">{statusIcons[status]}</span>
                            {statusLabels[status] || status}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg text-gray-900">{count}</span>
                          <span className="text-sm text-gray-500 ml-2">({percentage}%)</span>
                        </div>
                      </div>
                      {/* Barra de progreso */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            status === 'pending' ? 'bg-yellow-500' :
                            status === 'confirmed' ? 'bg-blue-500' :
                            status === 'in_progress' ? 'bg-purple-500' :
                            status === 'completed' ? 'bg-green-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top destinos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('adminReports.top5Services')}</h2>
              <div className="space-y-4">
                {(reportData.topDestinations || []).length > 0 ? (
                  reportData.topDestinations.map((destination, index) => {
                    const percentage = reportData.totalBookings > 0
                      ? ((destination.count / reportData.totalBookings) * 100).toFixed(1)
                      : 0;

                    const colors = [
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-purple-500',
                      'bg-orange-500',
                      'bg-pink-500'
                    ];

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-sm">
                              {index + 1}
                            </span>
                            <span className="text-gray-900 font-medium">{destination.location}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-lg text-gray-900">{destination.count}</span>
                            <span className="text-sm text-gray-500 ml-2">({percentage}%)</span>
                          </div>
                        </div>
                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${colors[index] || 'bg-gray-500'}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-4">{t('common.noData')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de detalles de reservas */}
          {filteredReservations.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{t('adminReports.reservationsDetailTitle')}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredReservations.length} {filteredReservations.length === 1 ? t('adminReports.reservationFound') : t('adminReports.reservationsFound')}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('search.code')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminReports.table.date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminReports.table.service')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminReports.table.client')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminReports.table.participants')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminReports.table.amount')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminReports.table.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminReports.table.payment')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReservations.map((reservation) => {
                      const statusLabels = {
                        pending: t('common.status.pending'),
                        confirmed: t('common.status.confirmed'),
                        in_progress: t('common.status.inProgress'),
                        completed: t('common.status.completed'),
                        cancelled: t('common.status.cancelled')
                      };

                      const statusColors = {
                        pending: 'bg-yellow-100 text-yellow-800',
                        confirmed: 'bg-blue-100 text-blue-800',
                        in_progress: 'bg-purple-100 text-purple-800',
                        completed: 'bg-green-100 text-green-800',
                        cancelled: 'bg-red-100 text-red-800'
                      };

                      const paymentLabels = {
                        pending: t('common.status.pending'),
                        partial: t('common.status.partial'),
                        paid: t('common.status.paid'),
                        refunded: t('common.status.refunded')
                      };

                      const paymentColors = {
                        pending: 'bg-yellow-100 text-yellow-800',
                        partial: 'bg-orange-100 text-orange-800',
                        paid: 'bg-green-100 text-green-800',
                        refunded: 'bg-gray-100 text-gray-800'
                      };

                      // Obtener nombre del servicio
                      let serviceName = reservation.service_name || reservation.tourName;
                      if (!serviceName && reservation.service_id && tours.length > 0) {
                        const tour = tours.find(t => t.id === reservation.service_id);
                        serviceName = tour ? (tour.name || tour.title) : 'N/A';
                      }
                      if (!serviceName) serviceName = 'N/A';

                      return (
                        <tr key={reservation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {reservation.reservation_code || reservation.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {format(new Date(reservation.date || reservation.tour_date), 'dd/MM/yyyy', { locale: es })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {serviceName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {reservation.client_name || reservation.clientName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                            {reservation.group_size || reservation.participants || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            S/. {(reservation.total_amount || reservation.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[reservation.status] || 'bg-gray-100 text-gray-800'}`}>
                              {statusLabels[reservation.status] || reservation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentColors[reservation.payment_status] || 'bg-gray-100 text-gray-800'}`}>
                              {paymentLabels[reservation.payment_status] || reservation.payment_status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Reports;