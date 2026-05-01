import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAgencyStore } from '../stores/agencyStore';
import agencyService from '../services/agencyService';
import { PAYMENT_METHOD_LABELS } from '../constants/profileConstants';

const usePaymentData = () => {
  const { t } = useTranslation();
  const currentAgency = useAgencyStore((state) => state.currentAgency);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCardNumbers, setShowCardNumbers] = useState({});
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);

  const agencyId = currentAgency?.id;

  // Cargar métodos de pago desde la API
  const fetchPaymentMethods = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const result = await agencyService.getPaymentMethods(agencyId);
      if (result.success && result.data) {
        setPaymentMethods(result.data);
      } else {
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error al cargar métodos de pago:', error);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

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
    if (!agencyId) return;
    setLoading(true);
    try {
      const result = await agencyService.createPaymentMethod(agencyId, methodData);
      if (result.success) {
        await fetchPaymentMethods();
        toast.success(t('profile.payment.methodAdded'));
        return true;
      } else {
        toast.error(result.error || t('profile.payment.error'));
        return false;
      }
    } catch (error) {
      console.error('Error al agregar método de pago:', error);
      toast.error(t('profile.payment.error'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async (pmId, updateData) => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const result = await agencyService.updatePaymentMethod(agencyId, pmId, updateData);
      if (result.success) {
        await fetchPaymentMethods();
        toast.success(t('profile.payment.saved'));
      } else {
        toast.error(result.error || t('profile.payment.error'));
      }
    } catch (error) {
      console.error('Error al actualizar método de pago:', error);
      toast.error(t('profile.payment.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (pmId) => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const result = await agencyService.deletePaymentMethod(agencyId, pmId);
      if (result.success) {
        await fetchPaymentMethods();
        toast.success(t('profile.payment.methodDeleted'));
      } else {
        toast.error(result.error || t('profile.payment.error'));
      }
    } catch (error) {
      console.error('Error al eliminar método de pago:', error);
      toast.error(t('profile.payment.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaymentMethod = async (pmId) => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const result = await agencyService.togglePaymentMethod(agencyId, pmId);
      if (result.success) {
        await fetchPaymentMethods();
        const newState = result.data?.isActive ? 'activado' : 'desactivado';
        toast.success(`Método de pago ${newState}`);
      } else {
        toast.error(result.error || t('profile.payment.error'));
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error(t('profile.payment.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsMain = async (pmId) => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const result = await agencyService.updatePaymentMethod(agencyId, pmId, { isMain: true });
      if (result.success) {
        await fetchPaymentMethods();
        toast.success(t('profile.payment.mainMethodUpdated'));
      } else {
        toast.error(result.error || t('profile.payment.error'));
      }
    } catch (error) {
      console.error('Error al establecer como principal:', error);
      toast.error(t('profile.payment.error'));
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

export default usePaymentData;
