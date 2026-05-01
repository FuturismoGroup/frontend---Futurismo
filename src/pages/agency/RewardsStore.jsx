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
    name: user?.name || 'Mi Agencia',
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
      toast.error('No tienes suficientes puntos para este canje');
      return;
    }

    if (selectedReward.stock <= 0) {
      toast.error('Este premio no tiene stock disponible');
      return;
    }

    try {
      await requestRedemption(currentAgency.id, selectedReward.id);
      toast.success('Solicitud de canje enviada. Te notificaremos cuando sea aprobada.');
      setShowRedeemModal(false);
      setSelectedReward(null);
      // ELM-427: Recargar canjes desde API-046 para reflejar el nuevo canje
      if (agencyId) {
        fetchAgencyRedemptions(agencyId);
      }
    } catch (error) {
      toast.error(error.message || 'Error al procesar la solicitud');
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con puntos de la agencia */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Tienda de Premios</h1>
                <p className="text-purple-100">
                  Canjea tus puntos por increíbles premios y experiencias
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-2">
                    <StarIconSolid className="h-6 w-6 text-yellow-300 mr-2" />
                    <span className="text-2xl font-bold">
                      {currentAgency.availablePoints.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-purple-100">Puntos disponibles</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <StarIconSolid className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Puntos Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentAgency.totalPoints.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Canjes Exitosos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myRedemptions.filter(r => r.status === 'delivered').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myRedemptions.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <GiftIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Premios Disponibles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAndSortedRewards.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('store')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'store'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <GiftIcon className="h-5 w-5 inline mr-2" />
              Tienda ({filteredAndSortedRewards.length})
            </button>
            <button
              onClick={() => setActiveTab('my_redemptions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my_redemptions'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingCartIcon className="h-5 w-5 inline mr-2" />
              Mis Canjes ({myRedemptions.length})
            </button>
          </nav>
        </div>

        {activeTab === 'store' && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Filtros:</span>
                  </div>
                  
                  {/* ELM-424: Select de categorias - Usa API real /api/rewards/categories */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Todas las categorias</option>
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
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="points_asc">Menos puntos primero</option>
                    <option value="points_desc">Más puntos primero</option>
                    <option value="name_asc">Nombre A-Z</option>
                    <option value="stock_desc">Mayor stock</option>
                  </select>
                </div>
                
                <div className="text-sm text-gray-500">
                  {filteredAndSortedRewards.length} premio(s) disponible(s)
                </div>
              </div>
            </div>

            {/* Grid de premios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay premios disponibles</h3>
                  <p className="text-gray-500">
                    {selectedCategory ? 'Intenta con otra categoría' : 'Vuelve pronto para ver nuevos premios'}
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
                            src={reward.image}
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
                              Últimas {reward.stock} unidades
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
                            <span className="text-sm text-gray-500 ml-1">pts</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Stock: {reward.stock}
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
                            Ver
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
                            {!canRedeem ? 'Sin puntos' : reward.stock === 0 ? 'Sin stock' : 'Canjear'}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premio</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Puntos</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {myRedemptions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        <ShoppingCartIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p>No tienes canjes registrados</p>
                        <p className="text-sm">¡Comienza canjeando tus primeros puntos!</p>
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
                          <span className={`badge badge-${REDEMPTION_STATUS_COLORS[redemption.status]}`}>
                            {REDEMPTION_STATUS_LABELS[redemption.status]}
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
                  <h2 className="text-xl font-bold">Confirmar Canje</h2>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">{selectedReward.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{selectedReward.description}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Puntos requeridos:</span>
                      <span className="text-sm font-medium text-purple-600">
                        {selectedReward.points.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tus puntos actuales:</span>
                      <span className="text-sm font-medium">
                        {currentAgency.availablePoints.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-gray-900">Puntos restantes:</span>
                      <span className="text-sm font-medium text-green-600">
                        {(currentAgency.availablePoints - selectedReward.points).toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        Tu solicitud será revisada por el administrador. Te notificaremos cuando sea aprobada y esté lista para entrega.
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
                    Cancelar
                  </button>
                  <button
                    onClick={handleRedeemRequest}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : 'Confirmar Canje'}
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
                  <h2 className="text-2xl font-bold">Detalles del Premio</h2>
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
                      src={selectedReward.image}
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
                        <span className="text-sm font-medium text-gray-700">Puntos</span>
                      </div>
                      <span className="text-xl font-bold text-purple-600">
                        {selectedReward.points.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CubeIcon className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Stock</span>
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
                      <span className="text-sm text-gray-400">Sin categoría</span>
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
                    Canjear Premio
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