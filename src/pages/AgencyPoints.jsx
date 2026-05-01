import { useState, useEffect } from 'react';
import { StarIcon, ArrowTrendingUpIcon, TrophyIcon, GiftIcon, CalendarIcon, UserIcon, CreditCardIcon, FunnelIcon, ArrowDownTrayIcon, ClockIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import useAgencyStore from '../stores/agencyStore';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const AgencyPoints = () => {
  const { currentAgency, pointsTransactions, actions, isLoading } = useAgencyStore();
  const [filterType, setFilterType] = useState('all');

  // Fetch points data on component mount
  useEffect(() => {
    actions.fetchPointsTransactions();
    actions.fetchPointsBalance();
  }, [actions]);

  const pointsHistory = pointsTransactions || [];
  const pointsBalance = currentAgency ? {
    balance: currentAgency.pointsBalance || 0,
    totalEarned: currentAgency.totalEarned || 0,
    totalRedeemed: currentAgency.totalRedeemed || 0
  } : {
    balance: 0,
    totalEarned: 0,
    totalRedeemed: 0
  };

  const filteredHistory = filterType === 'all' 
    ? pointsHistory 
    : pointsHistory.filter(t => t.type === filterType);

  const getTransactionIcon = (type) => {
    return type === 'earned' ? 
      <StarIcon className="w-4 h-4 text-green-600" /> : 
      <GiftIcon className="w-4 h-4 text-red-600" />;
  };

  const getTransactionColor = (type) => {
    return type === 'earned' ? 
      'text-green-600' : 
      'text-red-600';
  };

  const exportHistory = () => {
    if (!filteredHistory || filteredHistory.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      // Preparar datos para exportar
      const headers = [['Fecha', 'Tipo', 'Descripción', 'Puntos', 'Procesado Por', 'Referencia']];

      const rows = filteredHistory.map(transaction => [
        format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }),
        transaction.type === 'earned' ? 'Ganados' : 'Canjeados',
        transaction.reason || transaction.description || 'N/A',
        transaction.type === 'earned' ? `+${transaction.points}` : `-${transaction.points}`,
        transaction.processedBy === 'manual' ? 'Manual' : 'Sistema',
        transaction.relatedReservation || 'N/A'
      ]);

      // Agregar resumen al inicio
      const summaryData = [
        ['HISTORIAL DE PUNTOS'],
        ['Agencia', currentAgency?.name || 'N/A'],
        ['Fecha de exportación', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })],
        [],
        ['RESUMEN'],
        ['Balance Actual', `${pointsBalance.balance} puntos`],
        ['Total Ganados', `${pointsBalance.totalEarned} puntos`],
        ['Total Canjeados', `${pointsBalance.totalRedeemed} puntos`],
        ['Filtro Aplicado', filterType === 'all' ? 'Todas las transacciones' : filterType === 'earned' ? 'Solo ganados' : 'Solo canjeados'],
        [],
        ...headers,
        ...rows
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Configurar anchos de columna
      worksheet['!cols'] = [
        { wch: 18 }, // Fecha
        { wch: 12 }, // Tipo
        { wch: 50 }, // Descripción
        { wch: 10 }, // Puntos
        { wch: 15 }, // Procesado Por
        { wch: 20 }  // Referencia
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de Puntos');

      // Generar nombre de archivo
      const agencyId = currentAgency?.id || 'agencia';
      const filterSuffix = filterType === 'all' ? 'todos' : filterType === 'earned' ? 'ganados' : 'canjeados';
      const fileName = `Historial_Puntos_${agencyId}_${filterSuffix}_${format(new Date(), 'yyyyMMdd')}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success('✅ Historial de puntos exportado correctamente');
    } catch (error) {
      console.error('Error al exportar historial:', error);
      toast.error('❌ Error al exportar el historial');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <StarIcon className="w-8 h-8 mr-3 text-yellow-500" />
            Sistema de Puntos
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona puntos y recompensas de la agencia
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/agency/rewards"
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            <span>Tienda de Premios</span>
          </Link>
          
          <button
            onClick={exportHistory}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Call to Action para Tienda de Premios */}
      {pointsBalance.balance > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">🎁 ¡Tienes {pointsBalance.balance.toLocaleString()} puntos disponibles!</h3>
              <p className="text-purple-100">
                Canjea tus puntos por increíbles premios en nuestra tienda de recompensas.
              </p>
            </div>
            <Link
              to="/agency/rewards"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center space-x-2"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              <span>Ir a la Tienda</span>
            </Link>
          </div>
        </div>
      )}

      {/* Información sobre puntos automáticos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <TrophyIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Sistema de Puntos Automático</h3>
            <p className="text-sm text-blue-700 mt-1">
              Los puntos se otorgan automáticamente cuando el administrador confirma tus reservas. La cantidad de puntos se calcula en base al monto total de la reserva.
            </p>
          </div>
        </div>
      </div>

      {/* Resumen de puntos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <StarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {pointsBalance.balance.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Balance Actual</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {pointsBalance.totalEarned.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Ganados</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <GiftIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {pointsBalance.totalRedeemed.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Canjeados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de transacciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-blue-500" />
              Historial de Transacciones
            </h3>
            
            <div className="flex items-center space-x-3">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Todas las transacciones</option>
                <option value="earned">Puntos ganados</option>
                <option value="redeemed">Puntos canjeados</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay transacciones
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Aún no hay historial de puntos para mostrar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {transaction.serviceDetails?.serviceName || transaction.reason}
                        </h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              {transaction.serviceDetails?.date
                                ? format(new Date(transaction.serviceDetails.date), 'd \'de\' MMMM \'de\' yyyy', { locale: es })
                                : format(new Date(transaction.createdAt), 'd \'de\' MMMM \'de\' yyyy', { locale: es })
                              }
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <UserIcon className="w-4 h-4" />
                            <span>
                              {transaction.serviceDetails?.clientName || (transaction.processedBy === 'manual' ? 'Manual' : 'Sistema')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                      </p>
                      <p className="text-sm text-gray-600">puntos</p>
                    </div>
                  </div>

                  {/* Detalles del servicio para puntos ganados */}
                  {transaction.type === 'earned' && transaction.serviceDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Código de Reserva</p>
                          <p className="font-medium text-gray-900">{transaction.serviceDetails.reservationCode}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Participantes</p>
                          <p className="font-medium text-gray-900">{transaction.serviceDetails.participants} personas</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Monto del Servicio</p>
                          <p className="font-medium text-green-600">
                            S/. {transaction.serviceDetails.amount?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Estado</p>
                          <p className="font-medium text-gray-900 capitalize">{transaction.serviceDetails.status}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detalles de canje para puntos canjeados */}
                  {transaction.type === 'redeemed' && transaction.referenceId && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CreditCardIcon className="w-4 h-4" />
                        <span>Premio canjeado: {transaction.referenceId}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyPoints;