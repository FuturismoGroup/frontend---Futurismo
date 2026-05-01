import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useEmergencyStore from '../stores/emergencyStore';
import { iconToEmoji, transformCategoriesIcons } from '../utils/iconUtils';

const useMaterialsManager = () => {
  const materials = useEmergencyStore((state) => state.materials);
  const categories = useEmergencyStore((state) => state.categories);
  const updateMaterial = useEmergencyStore((state) => state.updateMaterial);
  const createMaterial = useEmergencyStore((state) => state.createMaterial);
  const deleteMaterial = useEmergencyStore((state) => state.deleteMaterial);
  const fetchMaterials = useEmergencyStore((state) => state.fetchMaterials);
  const initialize = useEmergencyStore((state) => state.initialize);

  const [isEditing, setIsEditing] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [expandedMaterial, setExpandedMaterial] = useState(null);
  const [showOnlyMandatory, setShowOnlyMandatory] = useState(false);
  const { t } = useTranslation();

  // Load materials and categories on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!categories || categories.length === 0) {
          await initialize();
        }
        if (!materials || materials.length === 0) {
          await fetchMaterials();
        }
      } catch (error) {
        console.error('Error loading materials data:', error);
      }
    };
    loadData();
  }, []);

  // Filter materials
  // Backend devuelve isMandatory (camelCase), mantenemos compatibilidad con ambos nombres
  const filteredMaterials = (materials || []).filter(material => {
    const matchesSearch = !searchQuery ||
      material.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !filterCategory || material.category === filterCategory;
    const matchesMandatory = !showOnlyMandatory || material.isMandatory || material.mandatory;

    return matchesSearch && matchesCategory && matchesMandatory;
  });

  const handleSaveMaterial = (materialData) => {
    if (editingMaterial) {
      updateMaterial(editingMaterial.id, materialData);
    } else {
      createMaterial(materialData);
    }
    setIsEditing(false);
    setEditingMaterial(null);
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setIsEditing(true);
  };

  const handleDeleteMaterial = (materialId) => {
    if (confirm(t('emergency.materials.confirmDelete'))) {
      deleteMaterial(materialId);
    }
  };

  const handleViewMaterial = (material) => {
    setExpandedMaterial(expandedMaterial?.id === material.id ? null : material);
  };

  const getCategoryInfo = (categoryId) => {
    const category = (categories || []).find(c => c.id === categoryId);

    if (category) {
      return {
        ...category,
        icon: iconToEmoji(category.icon) // Convertir nombre de ícono a emoji
      };
    }

    return {
      name: categoryId,
      icon: '📦',
      color: '#6B7280'
    };
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
    setShowOnlyMandatory(false);
  };

  const stats = {
    total: materials?.length || 0,
    mandatory: materials?.filter(m => m.isMandatory || m.mandatory).length || 0,
    categories: categories?.length || 0,
    filtered: filteredMaterials?.length || 0
  };

  // Transformar categorías para que los íconos sean emojis (para uso en formularios, filtros, etc.)
  const transformedCategories = transformCategoriesIcons(categories);

  return {
    // State
    isEditing,
    setIsEditing,
    editingMaterial,
    setEditingMaterial,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    expandedMaterial,
    showOnlyMandatory,
    setShowOnlyMandatory,

    // Data
    materials,
    categories: transformedCategories, // Categorías con íconos como emojis
    filteredMaterials,
    stats,

    // Handlers
    handleSaveMaterial,
    handleEditMaterial,
    handleDeleteMaterial,
    handleViewMaterial,
    getCategoryInfo,
    resetFilters
  };
};

export default useMaterialsManager;