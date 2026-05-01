import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../services';
import { PAYMENT_METHOD_LABELS } from '../constants/profileConstants';

/**
 * Hook para gestionar los métodos de pago del sistema (admin)
 * Similar a usePaymentData pero para los métodos de pago de Futurismo Tours
 */
const useAdminPaymentData = () => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCardNumbers, setShowCardNumbers] = useState({});
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar métodos de pago desde la API
  const fetchPaymentMethods = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/system/payment-methods');
      if (response.data.success && response.data.data) {
        setPaymentMethods(response.data.data);
      } else {
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error al cargar métodos de pago del sistema:', error);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const maskCardNumber = (number) => {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length < 8) return cleaned;
    return `${cleaned.slice(0, 4)}-****-****-${cleaned.slice(-4)}`;
  };

  const toggleShowCardNumber = (id) => {
    setShowCardNumbers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddPaymentMethod = async (methodData) => {
    setLoading(true);
    try {
      const response = await api.post('/system/payment-methods', methodData);
      if (response.data.success) {
        await fetchPaymentMethods();
        toast.success(t('profile.payment.methodAdded'));
        return true;
      } else {
        toast.error(response.data.error || t('profile.payment.error'));
        return false;
      }
    } catch (error) {
      console.error('Error al agregar método de pago:', error);
      toast.error(error.response?.data?.error || t('profile.payment.error'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async (pmId, updateData) => {
    setLoading(true);
    try {
      const response = await api.put(`/system/payment-methods/${pmId}`, updateData);
      if (response.data.success) {
        await fetchPaymentMethods();
        toast.success(t('profile.payment.saved'));
      } else {
        toast.error(response.data.error || t('profile.payment.error'));
      }
    } catch (error) {
      console.error('Error al actualizar método de pago:', error);
      toast.error(error.response?.data?.error || t('profile.payment.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (pmId) => {
    setLoading(true);
    try {
      const response = await api.delete(`/system/payment-methods/${pmId}`);
      if (response.data.success) {
        await fetchPaymentMethods();
        toast.success(t('profile.payment.methodDeleted'));
      } else {
        toast.error(response.data.error || t('profile.payment.error'));
      }
    } catch (error) {
      console.error('Error al eliminar método de pago:', error);
      toast.error(error.response?.data?.error || t('profile.payment.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaymentMethod = async (pmId) => {
    setLoading(true);
    try {
      const response = await api.patch(`/system/payment-methods/${pmId}/toggle`);
      if (response.data.success) {
        await fetchPaymentMethods();
        const newState = response.data.data?.isActive ? 'activado' : 'desactivado';
        toast.success(`Método de pago ${newState}`);
      } else {
        toast.error(response.data.error || t('profile.payment.error'));
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error(error.response?.data?.error || t('profile.payment.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsMain = async (pmId) => {
    setLoading(true);
    try {
      const response = await api.put(`/system/payment-methods/${pmId}`, { isMain: true });
      if (response.data.success) {
        await fetchPaymentMethods();
        toast.success(t('profile.payment.mainMethodUpdated'));
      } else {
        toast.error(response.data.error || t('profile.payment.error'));
      }
    } catch (error) {
      console.error('Error al establecer como principal:', error);
      toast.error(error.response?.data?.error || t('profile.payment.error'));
    } finally {
      setLoading(false);
    }
  };

  const getPaymentTypeLabel = (type) => {
    const labelKey = PAYMENT_METHOD_LABELS[type];
    return labelKey ? t(labelKey) : type;
  };

  return {
    isCollapsed,
    setIsCollapsed,
    showCardNumbers,
    paymentMethods,
    maskCardNumber,
    toggleShowCardNumber,
    handleAddPaymentMethod,
    handleUpdatePaymentMethod,
    handleDeletePaymentMethod,
    handleTogglePaymentMethod,
    handleSetAsMain,
    fetchPaymentMethods,
    getPaymentTypeLabel,
    loading
  };
};

export default useAdminPaymentData;
