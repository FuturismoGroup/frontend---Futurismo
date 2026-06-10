import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StarIcon, ArrowTrendingUpIcon, TrophyIcon, GiftIcon, CalendarIcon, UserIcon, CreditCardIcon, FunnelIcon, ArrowDownTrayIcon, ClockIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import useAgencyStore from '../stores/agencyStore';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const AgencyPoints = () => {
  const { t } = useTranslation();
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
      toast.error(t('agencyPoints.exportNoData'));
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      // Preparar datos para exportar
      const headers = [[
        t('agencyPoints.exportColDate'),
        t('agencyPoints.exportColType'),
        t('agencyPoints.exportColDescription'),
        t('agencyPoints.exportColPoints'),
        t('agencyPoints.exportColProcessedBy'),
        t('agencyPoints.exportColReference')
      ]];

      const rows = filteredHistory.map(transaction => [
        format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }),
        transaction.type === 'earned' ? t('agencyPoints.exportTypeEarned') : t('agencyPoints.exportTypeRedeemed'),
        transaction.reason || transaction.description || 'N/A',
        transaction.type === 'earned' ? `+${transaction.points}` : `-${transaction.points}`,
        transaction.processedBy === 'manual' ? t('agencyPoints.manualSource') : t('agencyPoints.systemSource'),
        transaction.relatedReservation || 'N/A'
      ]);

      // Agregar resumen al inicio
      const summaryData = [
        [t('agencyPoints.exportHeader')],
        [t('agencyPoints.exportAgencyLabel'), currentAgency?.name || 'N/A'],
        [t('agencyPoints.exportDateLabel'), format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })],
        [],
        [t('agencyPoints.exportSummary')],
        [t('agencyPoints.exportBalanceLabel'), `${pointsBalance.balance} ${t('agencyPoints.exportPointsSuffix')}`],
        [t('agencyPoints.exportEarnedLabel'), `${pointsBalance.totalEarned} ${t('agencyPoints.exportPointsSuffix')}`],
        [t('agencyPoints.exportRedeemedLabel'), `${pointsBalance.totalRedeemed} ${t('agencyPoints.exportPointsSuffix')}`],
        [t('agencyPoints.exportFilterLabel'), filterType === 'all' ? t('agencyPoints.exportFilterAll') : filterType === 'earned' ? t('agencyPoints.exportFilterEarned') : t('agencyPoints.exportFilterRedeemed')],
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

      XLSX.utils.book_append_sheet(workbook, worksheet, t('agencyPoints.exportSheet'));

      // Generar nombre de archivo
      const agencyId = currentAgency?.id || 'agencia';
      const filterSuffix = filterType === 'all' ? 'todos' : filterType === 'earned' ? 'ganados' : 'canjeados';
      const fileName = `Historial_Puntos_${agencyId}_${filterSuffix}_${format(new Date(), 'yyyyMMdd')}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success(t('agencyPoints.exportSuccess'));
    } catch (error) {
      console.error('Error al exportar historial:', error);
      toast.error(t('agencyPoints.exportError'));
    }
  };

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <StarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0" />
            <span className="truncate">{t('agencyPoints.title')}</span>
          </h1>
          <p className="text-xs sm:text-base text-gray-600 mt-1">
            {t('agencyPoints.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link
            to="/agency/rewards"
            className="px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <ShoppingBagIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{t('agencyPoints.rewardsStore')}</span>
          </Link>

          <button
            onClick={exportHistory}
            className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <ArrowDownTrayIcon className="w-4 h-4 flex-shrink-0" />
            <span>{t('agencyPoints.export')}</span>
          </button>
        </div>
      </div>

      {/* Call to Action para Tienda de Premios */}
      {pointsBalance.balance > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2 break-words">{t('agencyPoints.ctaTitle', { points: pointsBalance.balance.toLocaleString() })}</h3>
              <p className="text-xs sm:text-base text-purple-100">
                {t('agencyPoints.ctaSubtitle')}
              </p>
            </div>
            <Link
              to="/agency/rewards"
              className="bg-white text-purple-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
            >
              <ShoppingBagIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{t('agencyPoints.goToStore')}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Información sobre puntos automáticos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0">
            <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-medium text-blue-800">{t('agencyPoints.autoTitle')}</h3>
            <p className="text-xs sm:text-sm text-blue-700 mt-1">
              {t('agencyPoints.autoText')}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen de puntos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {pointsBalance.balance.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{t('agencyPoints.currentBalance')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <ArrowTrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {pointsBalance.totalEarned.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{t('agencyPoints.totalEarned')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <GiftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {pointsBalance.totalRedeemed.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{t('agencyPoints.totalRedeemed')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de transacciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0" />
              <span className="truncate">{t('agencyPoints.transactionHistory')}</span>
            </h3>

            <div className="flex items-center gap-2 sm:gap-3">
              <FunnelIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">{t('agencyPoints.allTransactions')}</option>
                <option value="earned">{t('agencyPoints.earnedFilter')}</option>
                <option value="redeemed">{t('agencyPoints.redeemedFilter')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {t('agencyPoints.noTransactions')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('agencyPoints.noTransactionsSubtitle')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 sm:gap-4 min-w-0 flex-1">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 break-words">
                          {transaction.serviceDetails?.serviceName || transaction.reason}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">
                              {transaction.serviceDetails?.date
                                ? format(new Date(transaction.serviceDetails.date), 'd \'de\' MMMM \'de\' yyyy', { locale: es })
                                : format(new Date(transaction.createdAt), 'd \'de\' MMMM \'de\' yyyy', { locale: es })
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1 min-w-0">
                            <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">
                              {transaction.serviceDetails?.clientName || (transaction.processedBy === 'manual' ? t('agencyPoints.manualSource') : t('agencyPoints.systemSource'))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-base sm:text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">{t('agencyPoints.pointsLabel')}</p>
                    </div>
                  </div>

                  {/* Detalles del servicio para puntos ganados */}
                  {transaction.type === 'earned' && transaction.serviceDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">{t('agencyPoints.reservationCode')}</p>
                          <p className="font-medium text-gray-900">{transaction.serviceDetails.reservationCode}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('agencyPoints.participants')}</p>
                          <p className="font-medium text-gray-900">{t('agencyPoints.participantsCount', { count: transaction.serviceDetails.participants })}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('agencyPoints.serviceAmount')}</p>
                          <p className="font-medium text-green-600">
                            S/. {transaction.serviceDetails.amount?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('agencyPoints.state')}</p>
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
                        <span>{t('agencyPoints.rewardRedeemed', { id: transaction.referenceId })}</span>
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