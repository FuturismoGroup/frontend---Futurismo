import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GiftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XCircleIcon,
  PhotoIcon,
  TagIcon,
  CubeIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusCircleIcon,
  SwatchIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import useRewardsStore from '../../stores/rewardsStore';
import {
  REWARD_CATEGORIES,
  REWARD_CATEGORY_LABELS,
  REDEMPTION_STATUS_LABELS,
  REDEMPTION_STATUS_COLORS
} from '../../constants/rewardsConstants';
import toast from 'react-hot-toast';
import CategoryManager from '../../components/rewards/CategoryManager';
import { getStorageKey } from '../../config/app.config';
import { resolveFileUrl } from '../../utils/fileUrl';

const RewardsManagement = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('rewards');
  const [showForm, setShowForm] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [categories, setCategories] = useState([]);
  const [pointsData, setPointsData] = useState({
    points: '',
    reason: ''
  });
  const [pointsConfig, setPointsConfig] = useState({
    pointsPerSol: 1,
    expirationMonths: 12,
    levels: [
      { name: 'Bronze', minPoints: 0 },
      { name: 'Silver', minPoints: 1000 },
      { name: 'Gold', minPoints: 5000 },
      { name: 'Platinum', minPoints: 20000 }
    ]
  });
  const [configLoading, setConfigLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points: '',
    category: '',
    stock: '',
    image: '',
    active: true
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const {
    rewards,
    agencies,
    redemptions,
    loading,
    fetchRewards,
    fetchAgencies,
    fetchRedemptions,
    createReward,
    updateReward,
    deleteReward,
    updateRedemptionStatus,
    addPointsToAgency
  } = useRewardsStore();

  useEffect(() => {
    fetchRewards();
    fetchAgencies();
    fetchRedemptions();
    loadCategories();
    loadPointsConfig();
  }, []);

  const loadPointsConfig = async () => {
    try {
      const token = localStorage.getItem(getStorageKey('authToken')) ||
                    sessionStorage.getItem(getStorageKey('authToken'));
      const response = await fetch('/api/config/points', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const result = await response.json();
      if (result.pointsPerSol !== undefined) {
        setPointsConfig({
          pointsPerSol: result.pointsPerSol ?? 1,
          expirationMonths: result.expirationMonths ?? 12,
          levels: Array.isArray(result.levels) && result.levels.length === 4
            ? result.levels
            : pointsConfig.levels
        });
      }
    } catch (error) {
      console.error('Error loading points config:', error);
    }
  };

  const savePointsConfig = async () => {
    // Validar que niveles sean ascendentes
    for (let i = 1; i < pointsConfig.levels.length; i++) {
      if (pointsConfig.levels[i].minPoints <= pointsConfig.levels[i - 1].minPoints) {
        toast.error(t('rewards.messages.pointsMustAscend'));
        return;
      }
    }
    if (pointsConfig.pointsPerSol <= 0) {
      toast.error('Puntos por sol debe ser mayor a 0');
      return;
    }

    setConfigLoading(true);
    try {
      const token = localStorage.getItem(getStorageKey('authToken')) ||
                    sessionStorage.getItem(getStorageKey('authToken'));
      const response = await fetch('/api/config/points', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(pointsConfig)
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(t('rewards.messages.pointsConfigUpdated'));
        setPointsConfig({
          pointsPerSol: result.pointsPerSol,
          expirationMonths: result.expirationMonths,
          levels: result.levels
        });
      } else {
        toast.error(result.error || t('rewards.messages.pointsConfigError'));
      }
    } catch (error) {
      console.error('Error saving points config:', error);
      toast.error(t('rewards.messages.pointsConfigError'));
    } finally {
      setConfigLoading(false);
    }
  };

  const handleLevelChange = (index, value) => {
    const newLevels = [...pointsConfig.levels];
    newLevels[index] = { ...newLevels[index], minPoints: Math.max(0, parseInt(value) || 0) };
    setPointsConfig({ ...pointsConfig, levels: newLevels });
  };

  const loadCategories = async () => {
    try {
      // Usar la clave correcta del storage con el prefijo de la app
      const token = localStorage.getItem(getStorageKey('authToken')) ||
                    sessionStorage.getItem(getStorageKey('authToken'));
      const response = await fetch('/api/rewards/categories', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = t('rewards.messages.descriptionRequired');
    }

    if (!formData.points || formData.points < 100) {
      newErrors.points = 'Los puntos deben ser al menos 100';
    }

    if (!formData.category) {
      newErrors.category = t('rewards.messages.categoryRequired');
    }

    if (!formData.stock || formData.stock < 1) {
      newErrors.stock = 'El stock debe ser al menos 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambio de archivo de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast.error(t('rewards.messages.onlyImages'));
        return;
      }
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('rewards.messages.fileTooLarge'));
        return;
      }
      setImageFile(file);
      // Crear URL de vista previa
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const rewardData = {
        ...formData,
        points: parseInt(formData.points),
        stock: parseInt(formData.stock),
        imageFile: imageFile // Incluir el archivo si existe
      };

      if (editingReward) {
        await updateReward(editingReward.id, rewardData);
        toast.success('Premio actualizado exitosamente');
      } else {
        await createReward(rewardData);
        toast.success('Premio creado exitosamente');
      }

      resetForm();
    } catch (error) {
      toast.error(error.message || 'Error al procesar la solicitud');
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      points: '',
      category: '',
      stock: '',
      image: '',
      active: true
    });
    setErrors({});
    setEditingReward(null);
    setShowForm(false);
    // Limpiar archivo e imagen preview
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  // Manejar edición
  const handleEdit = (reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description,
      points: reward.points.toString(),
      category: reward.category,
      stock: reward.stock.toString(),
      image: reward.image || '',
      active: reward.active
    });
    // Limpiar archivo previo y establecer preview de imagen existente
    // (resolveFileUrl convierte URLs relativas en absolutas hacia el backend).
    setImageFile(null);
    setImagePreview(reward.image ? resolveFileUrl(reward.image) : null);
    setShowForm(true);
  };

  // Manejar eliminación
  const handleDelete = async (reward) => {
    if (window.confirm(`¿Está seguro de eliminar el premio "${reward.name}"?`)) {
      try {
        await deleteReward(reward.id);
        toast.success('Premio eliminado exitosamente');
      } catch (error) {
        toast.error('Error al eliminar el premio');
      }
    }
  };

  // Ver detalles
  const handleViewDetails = (item, type) => {
    setSelectedItem({ ...item, type });
    setShowDetails(true);
  };

  // Manejar asignación de puntos
  const handleAssignPoints = (agency) => {
    setSelectedAgency(agency);
    setPointsData({ points: '', reason: '' });
    setShowPointsModal(true);
  };

  const handlePointsSubmit = async (e) => {
    e.preventDefault();
    
    if (!pointsData.points || !pointsData.reason.trim()) {
      toast.error('Completa todos los campos');
      return;
    }

    const points = parseInt(pointsData.points);
    if (points <= 0) {
      toast.error('Los puntos deben ser mayores a 0');
      return;
    }

    try {
      await addPointsToAgency(selectedAgency.id, points, pointsData.reason);
      toast.success(`${points} puntos asignados a ${selectedAgency.name}`);
      setShowPointsModal(false);
      setSelectedAgency(null);
      setPointsData({ points: '', reason: '' });
    } catch (error) {
      toast.error('Error al asignar puntos');
    }
  };

  // Actualizar estado del canje
  const handleUpdateRedemption = async (id, status, notes = '') => {
    try {
      await updateRedemptionStatus(id, status, notes);
      toast.success('Estado del canje actualizado');
      setShowDetails(false);
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <GiftIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sistema de Premios</h1>
                <p className="text-gray-600">Gestiona premios y canjes del sistema de puntos</p>
              </div>
            </div>
            {activeTab === 'rewards' && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuevo Premio
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('rewards')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rewards'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <GiftIcon className="h-5 w-5 inline mr-2" />
              Premios ({rewards.length})
            </button>
            <button
              onClick={() => setActiveTab('agencies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'agencies'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <StarIcon className="h-5 w-5 inline mr-2" />
              Agencias ({agencies.length})
            </button>
            <button
              onClick={() => setActiveTab('redemptions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'redemptions'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircleIcon className="h-5 w-5 inline mr-2" />
              Canjes ({redemptions.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <SwatchIcon className="h-5 w-5 inline mr-2" />
              Categorías ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Cog6ToothIcon className="h-5 w-5 inline mr-2" />
              Configuración
            </button>
          </nav>
        </div>

        {/* Contenido por pestañas */}
        {activeTab === 'rewards' && (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Puntos</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        Cargando premios...
                      </td>
                    </tr>
                  ) : rewards.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No hay premios registrados
                      </td>
                    </tr>
                  ) : (
                    rewards.map((reward) => (
                      <tr key={reward.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {reward.image ? (
                              <img className="h-10 w-10 rounded object-cover mr-3" src={resolveFileUrl(reward.image)} alt="" />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center mr-3">
                                <PhotoIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{reward.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {reward.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {reward.categoryName ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {reward.categoryName}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Sin categoría</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-purple-600">
                            {reward.points.toLocaleString()} pts
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-medium ${
                            reward.stock > 10 ? 'text-green-600' : 
                            reward.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {reward.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`badge ${reward.active ? 'badge-green' : 'badge-red'}`}>
                            {reward.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(reward, 'reward')}
                              className="text-blue-600 hover:text-blue-800"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(reward)}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Editar"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(reward)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'agencies' && (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agencia</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Puntos Totales</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Puntos Disponibles</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Puntos Usados</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fecha Registro</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {agencies.map((agency) => (
                    <tr key={agency.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{agency.name}</div>
                          <div className="text-sm text-gray-500">{agency.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-purple-600">
                          {agency.totalPoints.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-green-600">
                          {agency.availablePoints.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-gray-600">
                          {agency.usedPoints.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        {new Date(agency.joinDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(agency, 'agency')}
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver detalles"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleAssignPoints(agency)}
                            className="text-green-600 hover:text-green-800"
                            title="Asignar puntos"
                          >
                            <PlusCircleIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'redemptions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agencia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premio</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Puntos</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {redemptions.map((redemption) => (
                    <tr key={redemption.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{redemption.agencyName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{redemption.rewardName}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-purple-600">
                          {redemption.points.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${REDEMPTION_STATUS_COLORS[redemption.status] || 'bg-gray-100 text-gray-800'}`}>
                          {t(REDEMPTION_STATUS_LABELS[redemption.status] || '', { defaultValue: redemption.status })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        {new Date(redemption.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewDetails(redemption, 'redemption')}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab de Categorías */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-lg shadow p-6">
            <CategoryManager onCategoriesChanged={loadCategories} />
          </div>
        )}

        {/* Tab de Configuración */}
        {activeTab === 'config' && (
          <div className="max-w-2xl">
            {/* Fórmula de puntos */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Fórmula de Puntos</h3>
              <p className="text-sm text-gray-500 mb-4">
                Configura cuántos puntos gana una agencia por cada sol gastado en reservaciones confirmadas.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puntos por Sol (S/)
                  </label>
                  <input
                    type="number"
                    value={pointsConfig.pointsPerSol}
                    onChange={(e) => setPointsConfig({ ...pointsConfig, pointsPerSol: parseFloat(e.target.value) || 0 })}
                    className="w-48 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="0.01"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Ejemplo: Si vale 0.1, una reserva de S/ 500 otorga {Math.floor(500 * (pointsConfig.pointsPerSol || 0))} puntos
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meses de Expiración
                  </label>
                  <input
                    type="number"
                    value={pointsConfig.expirationMonths}
                    onChange={(e) => setPointsConfig({ ...pointsConfig, expirationMonths: parseInt(e.target.value) || 0 })}
                    className="w-48 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="0"
                  />
                  <p className="text-xs text-gray-400 mt-1">0 = sin expiración</p>
                </div>
              </div>
            </div>

            {/* Niveles */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Niveles de Agencia</h3>
              <p className="text-sm text-gray-500 mb-4">
                Configura los puntos totales acumulados necesarios para alcanzar cada nivel. Los niveles solo otorgan un badge distintivo.
              </p>

              <div className="space-y-3">
                {pointsConfig.levels.map((level, index) => {
                  const levelColors = {
                    Bronze: 'bg-amber-100 text-amber-800 border-amber-300',
                    Silver: 'bg-gray-100 text-gray-700 border-gray-300',
                    Gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    Platinum: 'bg-indigo-100 text-indigo-800 border-indigo-300'
                  };
                  return (
                    <div key={level.name} className="flex items-center gap-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border w-28 justify-center ${levelColors[level.name]}`}>
                        {level.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">desde</span>
                        <input
                          type="number"
                          value={level.minPoints}
                          onChange={(e) => handleLevelChange(index, e.target.value)}
                          disabled={index === 0}
                          className={`w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            index === 0 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                          }`}
                          min="0"
                        />
                        <span className="text-sm text-gray-500">puntos</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end">
              <button
                onClick={savePointsConfig}
                disabled={configLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {configLoading ? t('rewards.messages.saving') : t('rewards.messages.saveConfig')}
              </button>
            </div>
          </div>
        )}

        {/* Modal de formulario */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">
                    {editingReward ? 'Editar Premio' : 'Nuevo Premio'}
                  </h2>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Premio *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full border rounded-lg px-3 py-2 ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="Ej: iPad Air 10.9"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className={`w-full border rounded-lg px-3 py-2 ${errors.description ? 'border-red-500' : ''}`}
                      placeholder={t('rewards.messages.exampleDescription')}
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Puntos Requeridos *
                      </label>
                      <input
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData({...formData, points: e.target.value})}
                        className={`w-full border rounded-lg px-3 py-2 ${errors.points ? 'border-red-500' : ''}`}
                        placeholder="1000"
                        min="100"
                      />
                      {errors.points && <p className="text-red-500 text-sm mt-1">{errors.points}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock *
                      </label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        className={`w-full border rounded-lg px-3 py-2 ${errors.stock ? 'border-red-500' : ''}`}
                        placeholder="10"
                        min="1"
                      />
                      {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className={`w-full border rounded-lg px-3 py-2 ${errors.category ? 'border-red-500' : ''}`}
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Imagen del Premio
                    </label>
                    <div className="space-y-3">
                      {/* Vista previa de imagen */}
                      {imagePreview && (
                        <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Vista previa"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              if (imagePreview && !formData.image) {
                                URL.revokeObjectURL(imagePreview);
                              }
                              setImagePreview(null);
                              setFormData({ ...formData, image: '' });
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {/* Input de archivo */}
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <PhotoIcon className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-1 text-sm text-gray-500">
                              <span className="font-semibold">Click para subir imagen</span>
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF o WEBP (máx. 5MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="active" className="text-sm text-gray-700">
                      Premio activo y disponible para canje
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : editingReward ? 'Actualizar' : 'Crear Premio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de detalles */}
        {showDetails && selectedItem && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">
                    {selectedItem.type === 'reward' ? 'Detalles del Premio' :
                     selectedItem.type === 'agency' ? 'Detalles de la Agencia' : 'Detalles del Canje'}
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Contenido específico por tipo */}
                {selectedItem.type === 'reward' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Información del Premio</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Nombre:</span>
                          <span className="font-medium">{selectedItem.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Categoría:</span>
                          <span className="font-medium">
                            {categories.find(c => c.id === selectedItem.category)?.name || selectedItem.category}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Puntos Requeridos:</span>
                          <span className="font-medium text-purple-600">
                            {selectedItem.points.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Stock:</span>
                          <span className="font-medium">{selectedItem.stock}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Estado:</span>
                          <span className={`badge ${selectedItem.active ? 'badge-green' : 'badge-gray'}`}>
                            {selectedItem.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedItem.description && (
                      <div>
                        <h4 className="font-medium mb-2">Descripción</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {selectedItem.description}
                        </p>
                      </div>
                    )}

                    {selectedItem.image && (
                      <div>
                        <h4 className="font-medium mb-2">Imagen</h4>
                        <img
                          src={resolveFileUrl(selectedItem.image)}
                          alt={selectedItem.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}

                {selectedItem.type === 'agency' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Información de la Agencia</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Nombre:</span>
                          <span className="font-medium">{selectedItem.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Puntos Actuales:</span>
                          <span className="font-medium text-purple-600">
                            {selectedItem.points?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Puntos Totales Ganados:</span>
                          <span className="font-medium text-green-600">
                            {selectedItem.totalPointsEarned?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Canjes Realizados:</span>
                          <span className="font-medium">{selectedItem.redemptionsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem.type === 'redemption' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Información del Canje</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Agencia:</span>
                          <span className="font-medium">{selectedItem.agencyName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Premio:</span>
                          <span className="font-medium">{selectedItem.rewardName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Puntos:</span>
                          <span className="font-medium text-purple-600">
                            {selectedItem.points.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Estado:</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${REDEMPTION_STATUS_COLORS[selectedItem.status] || 'bg-gray-100 text-gray-800'}`}>
                            {t(REDEMPTION_STATUS_LABELS[selectedItem.status] || '', { defaultValue: selectedItem.status })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedItem.notes && (
                      <div>
                        <h4 className="font-medium mb-2">Notas</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {selectedItem.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      {selectedItem.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateRedemption(selectedItem.id, 'approved', 'Canje aprobado para entrega')}
                            className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleUpdateRedemption(selectedItem.id, 'cancelled', 'Canje cancelado')}
                            className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {selectedItem.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateRedemption(selectedItem.id, 'delivered', 'Premio entregado exitosamente')}
                          className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Marcar Entregado
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal para asignar puntos */}
        {showPointsModal && selectedAgency && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <form onSubmit={handlePointsSubmit} className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Asignar Puntos</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPointsModal(false);
                      setSelectedAgency(null);
                      setPointsData({ points: '', reason: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Info de la agencia */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <StarIcon className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="font-medium text-gray-900">{selectedAgency.name}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Puntos actuales:</span>
                      <span className="font-medium text-purple-600">
                        {selectedAgency.availablePoints.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total histórico:</span>
                      <span className="font-medium">
                        {selectedAgency.totalPoints.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puntos a Asignar *
                    </label>
                    <input
                      type="number"
                      value={pointsData.points}
                      onChange={(e) => setPointsData({...pointsData, points: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="1000"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo/Razón *
                    </label>
                    <textarea
                      value={pointsData.reason}
                      onChange={(e) => setPointsData({...pointsData, reason: e.target.value})}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: Bonificación por desempeño excepcional, Premio por meta alcanzada, etc."
                      required
                    />
                  </div>

                  {pointsData.points && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                        <div className="text-sm">
                          <span className="text-green-800">
                            Nuevos puntos totales: {' '}
                            <span className="font-semibold">
                              {(selectedAgency.availablePoints + parseInt(pointsData.points || 0)).toLocaleString()}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPointsModal(false);
                      setSelectedAgency(null);
                      setPointsData({ points: '', reason: '' });
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !pointsData.points || !pointsData.reason.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    {loading ? 'Asignando...' : 'Asignar Puntos'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsManagement;