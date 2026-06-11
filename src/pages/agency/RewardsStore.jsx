import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GiftIcon,
  StarIcon,
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  FunnelIcon,
  TagIcon,
  CubeIcon,
  SparklesIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import useRewardsStore from '../../stores/rewardsStore';
import useAuthStore from '../../stores/authStore';
import {
  REWARD_CATEGORIES,
  REWARD_CATEGORY_LABELS,
  REDEMPTION_STATUS_LABELS,
  REDEMPTION_STATUS_COLORS
} from '../../constants/rewardsConstants';
// NOTA: ELM-424 - Las categorias del filtro ahora se cargan desde API real
// GET /api/rewards/categories (TBL-009 reward_categories)
import toast from 'react-hot-toast';
import { resolveFileUrl } from '../../utils/fileUrl';

const RewardsStore = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('store');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('points_asc');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const {
    rewards,
    rewardCategories, // ELM-424: Categorias desde BD (TBL-009)
    agencies,
    redemptions,
    loading,
    fetchRewards,
    fetchRewardCategories, // ELM-424: Cargar categorias desde API
    fetchAgencies,
    fetchAgencyRedemptions, // API-046: GET /api/agencies/:id/redemptions (ELM-427)
    requestRedemption
  } = useRewardsStore();

  // Obtener datos de la agencia actual (usar agencyId del usuario autenticado)
  const agencyId = user?.agencyId || user?.id;
  const currentAgency = agencies.find(agency => agency.id === agencyId) || {
    id: agencyId || '1',
    name: user?.name || t('rewards.store.myAgency'),
    email: user?.email || 'mi@agencia.com',
    totalPoints: 0,
    availablePoints: 0,
    usedPoints: 0
  };

  // ELM-427: Usar redemptions directamente (ya filtrados por API-046)
  // La API GET /api/agencies/:id/redemptions devuelve solo los canjes de la agencia
  const myRedemptions = redemptions;

  useEffect(() => {
    fetchRewards();
    fetchRewardCategories(); // ELM-424: Cargar categorias desde API real
    fetchAgencies();
    // ELM-427: API-046 - Cargar canjes especificos de la agencia desde BD real
    if (agencyId) {
      fetchAgencyRedemptions(agencyId);
    }
  }, [agencyId]);

  // Filtrar y ordenar premios
  const filteredAndSortedRewards = rewards
    .filter(reward => reward.active && reward.stock > 0)
    .filter(reward => !selectedCategory || reward.categoryName === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'points_asc':
          return a.points - b.points;
        case 'points_desc':
          return b.points - a.points;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'stock_desc':
          return b.stock - a.stock;
        default:
          return 0;
      }
    });

  // Manejar solicitud de canje
  const handleRedeemRequest = async () => {
    if (!selectedReward) return;

    if (currentAgency.availablePoints < selectedReward.points) {
      toast.error(t('rewards.store.insufficientPoints'));
      return;
    }

    if (selectedReward.stock <= 0) {
      toast.error(t('rewards.store.outOfStock'));
      return;
    }

    try {
      await requestRedemption(currentAgency.id, selectedReward.id);
      toast.success(t('rewards.store.redemptionSent'));
      setShowRedeemModal(false);
      setSelectedReward(null);
      // ELM-427: Recargar canjes desde API-046 para reflejar el nuevo canje
      if (agencyId) {
        fetchAgencyRedemptions(agencyId);
      }
    } catch (error) {
      toast.error(error.message || t('rewards.store.requestError'));
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      [REWARD_CATEGORIES.ELECTRONICS]: CubeIcon,
      [REWARD_CATEGORIES.TRAVEL]: TrophyIcon,
      [REWARD_CATEGORIES.GIFT_CARDS]: TagIcon,
      [REWARD_CATEGORIES.EXPERIENCES]: SparklesIcon,
      [REWARD_CATEGORIES.MERCHANDISE]: GiftIcon
    };
    return icons[category] || GiftIcon;
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      [REWARD_CATEGORIES.ELECTRONICS]: 'blue',
      [REWARD_CATEGORIES.TRAVEL]: 'green',
      [REWARD_CATEGORIES.GIFT_CARDS]: 'purple',
      [REWARD_CATEGORIES.EXPERIENCES]: 'orange',
      [REWARD_CATEGORIES.MERCHANDISE]: 'gray'
    };
    return colors[category] || 'gray';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con puntos de la agencia */}
        <div className="mb-4 sm:mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">{t('rewards.store.title')}</h1>
                <p className="text-xs sm:text-base text-purple-100">
                  {t('rewards.store.subtitle')}
                </p>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="bg-white bg-opacity-20 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-1 sm:mb-2">
                    <StarIconSolid className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300 mr-2" />
                    <span className="text-lg sm:text-2xl font-bold">
                      {currentAgency.availablePoints.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-100">{t('rewards.store.availablePoints')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-white rounded-lg p-3 sm:p-6 shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                <StarIconSolid className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('rewards.store.totalPoints')}</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900 truncate">
                  {currentAgency.totalPoints.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-6 shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('rewards.store.successfulRedemptions')}</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900">
                  {myRedemptions.filter(r => r.status === 'delivered').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-6 shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('rewards.store.pending')}</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900">
                  {myRedemptions.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-6 shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <GiftIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('rewards.store.availableRewards')}</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900">
                  {filteredAndSortedRewards.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 sm:mb-6">
          <nav className="flex gap-4 sm:gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('store')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'store'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <GiftIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
              {t('rewards.store.storeTab')} ({filteredAndSortedRewards.length})
            </button>
            <button
              onClick={() => setActiveTab('my_redemptions')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'my_redemptions'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingCartIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
              {t('rewards.store.myRedemptionsTab')} ({myRedemptions.length})
            </button>
          </nav>
        </div>

        {activeTab === 'store' && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-3 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
                  <div className="flex items-center">
                    <FunnelIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{t('rewards.store.filters')}</span>
                  </div>

                  {/* ELM-424: Select de categorias - Usa API real /api/rewards/categories */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">{t('rewards.store.allCategories')}</option>
                    {/* Prioriza categorias desde BD, fallback a constantes */}
                    {rewardCategories && rewardCategories.length > 0
                      ? rewardCategories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))
                      : Object.entries(REWARD_CATEGORY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))
                    }
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="points_asc">{t('rewards.store.sortPointsAsc')}</option>
                    <option value="points_desc">{t('rewards.store.sortPointsDesc')}</option>
                    <option value="name_asc">{t('rewards.store.sortNameAsc')}</option>
                    <option value="stock_desc">{t('rewards.store.sortStockDesc')}</option>
                  </select>
                </div>

                <div className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                  {t('rewards.store.rewardsAvailableCount', { count: filteredAndSortedRewards.length })}
                </div>
              </div>
            </div>

            {/* Grid de premios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {loading ? (
                // Skeletons de carga
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : filteredAndSortedRewards.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <GiftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('rewards.store.noRewardsAvailable')}</h3>
                  <p className="text-gray-500">
                    {selectedCategory ? t('rewards.store.tryAnotherCategory') : t('rewards.store.comeBackSoon')}
                  </p>
                </div>
              ) : (
                filteredAndSortedRewards.map((reward) => {
                  const canRedeem = currentAgency.availablePoints >= reward.points;
                  const CategoryIcon = getCategoryIcon(reward.category);
                  
                  return (
                    <div key={reward.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                      {/* Imagen */}
                      <div className="relative">
                        {reward.image ? (
                          <img
                            className="h-48 w-full object-cover rounded-t-lg"
                            src={resolveFileUrl(reward.image)}
                            alt={reward.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center ${reward.image ? 'hidden' : ''}`}>
                          <CategoryIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        
                        {/* Badge de categoría */}
                        {reward.categoryName && (
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {reward.categoryName}
                            </span>
                          </div>
                        )}
                        
                        {/* Stock bajo warning */}
                        {reward.stock <= 5 && (
                          <div className="absolute top-2 right-2">
                            <span className="badge badge-red text-xs">
                              {t('rewards.store.lastUnits', { count: reward.stock })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contenido */}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {reward.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {reward.description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <StarIconSolid className="h-5 w-5 text-yellow-400 mr-1" />
                            <span className="text-lg font-bold text-purple-600">
                              {reward.points.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">{t('rewards.pointsUnit')}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {t('rewards.store.stockLabel')}: {reward.stock}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedReward(reward);
                              setShowDetailsModal(true);
                            }}
                            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-2" />
                            {t('rewards.store.view')}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReward(reward);
                              setShowRedeemModal(true);
                            }}
                            disabled={!canRedeem || reward.stock === 0}
                            className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center ${
                              canRedeem && reward.stock > 0
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <GiftIcon className="h-4 w-4 mr-2" />
                            {!canRedeem ? t('rewards.store.noPoints') : reward.stock === 0 ? t('rewards.store.noStock') : t('rewards.store.redeem')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {activeTab === 'my_redemptions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('rewards.admin.table.reward')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('rewards.admin.table.points')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('rewards.admin.table.status')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('rewards.admin.redemptionsTable.requestDate')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('rewards.admin.detail.notes')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {myRedemptions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        <ShoppingCartIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p>{t('rewards.store.noRedemptions')}</p>
                        <p className="text-sm">{t('rewards.store.startRedeeming')}</p>
                      </td>
                    </tr>
                  ) : (
                    myRedemptions.map((redemption) => (
                      <tr key={redemption.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{redemption.rewardName}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-purple-600 font-medium">
                            {redemption.points.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${REDEMPTION_STATUS_COLORS[redemption.status] || 'bg-gray-100 text-gray-800'}`}>
                            {t(REDEMPTION_STATUS_LABELS[redemption.status] || 'rewards.redemptionStatus.pending')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                          {new Date(redemption.requestDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                          {redemption.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de confirmación de canje */}
        {showRedeemModal && selectedReward && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-purple-100 rounded-full mr-4">
                    <GiftIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold">{t('rewards.store.confirmRedemption')}</h2>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">{selectedReward.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{selectedReward.description}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('rewards.store.requiredPoints')}</span>
                      <span className="text-sm font-medium text-purple-600">
                        {selectedReward.points.toLocaleString()} {t('rewards.pointsUnit')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('rewards.store.yourCurrentPoints')}</span>
                      <span className="text-sm font-medium">
                        {currentAgency.availablePoints.toLocaleString()} {t('rewards.pointsUnit')}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-gray-900">{t('rewards.store.remainingPoints')}</span>
                      <span className="text-sm font-medium text-green-600">
                        {(currentAgency.availablePoints - selectedReward.points).toLocaleString()} {t('rewards.pointsUnit')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        {t('rewards.store.requestReviewNote')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowRedeemModal(false);
                      setSelectedReward(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {t('rewards.admin.rewardForm.cancel')}
                  </button>
                  <button
                    onClick={handleRedeemRequest}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? t('rewards.admin.rewardForm.processing') : t('rewards.store.confirmRedemption')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalles del premio */}
        {showDetailsModal && selectedReward && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">{t('rewards.admin.detail.rewardTitle')}</h2>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedReward(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Imagen */}
                <div className="mb-6">
                  {selectedReward.image ? (
                    <img
                      className="h-64 w-full object-cover rounded-lg"
                      src={resolveFileUrl(selectedReward.image)}
                      alt={selectedReward.name}
                    />
                  ) : (
                    <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <GiftIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Información */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedReward.name}</h3>
                    <p className="text-gray-600 mt-1">{selectedReward.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <StarIconSolid className="h-5 w-5 text-yellow-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">{t('rewards.admin.table.points')}</span>
                      </div>
                      <span className="text-xl font-bold text-purple-600">
                        {selectedReward.points.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CubeIcon className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">{t('rewards.admin.table.stock')}</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {selectedReward.stock}
                      </span>
                    </div>
                  </div>

                  <div>
                    {selectedReward.categoryName ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {selectedReward.categoryName}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">{t('rewards.admin.noCategory')}</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowRedeemModal(true);
                    }}
                    disabled={currentAgency.availablePoints < selectedReward.points || selectedReward.stock === 0}
                    className={`px-6 py-2 rounded-lg ${
                      currentAgency.availablePoints >= selectedReward.points && selectedReward.stock > 0
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {t('rewards.store.redeemReward')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsStore;