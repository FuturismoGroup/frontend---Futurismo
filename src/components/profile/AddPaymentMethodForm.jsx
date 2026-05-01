import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PlusIcon } from '@heroicons/react/24/outline';
import {
  PAYMENT_METHOD_TYPES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_REQUIRED_FIELDS,
  PAYMENT_METHOD_VISIBLE_FIELDS,
  ACCOUNT_TYPES,
  CARD_TYPES,
  CURRENCIES
} from '../../constants/profileConstants';

const EMPTY_FORM = {
  type: '',
  label: '',
  bank: '',
  accountNumber: '',
  cci: '',
  cardNumber: '',
  phoneNumber: '',
  holderName: '',
  currency: 'PEN',
  accountType: '',
  cardType: '',
  expiryDate: '',
  description: ''
};

const AddPaymentMethodForm = ({ onAddPaymentMethod, loading }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const selectedType = form.type;
  const visibleFields = selectedType ? (PAYMENT_METHOD_VISIBLE_FIELDS[selectedType] || []) : [];
  const requiredFields = selectedType ? (PAYMENT_METHOD_REQUIRED_FIELDS[selectedType] || []) : [];

  const isFieldVisible = (field) => visibleFields.includes(field);

  const isFormValid = () => {
    if (!selectedType) return false;
    return requiredFields.every(field => form[field] && form[field].trim() !== '');
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (newType) => {
    setForm({ ...EMPTY_FORM, type: newType });
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    const success = await onAddPaymentMethod(form);
    if (success) {
      setForm({ ...EMPTY_FORM });
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        {t('profile.payment.addNewMethod')}
      </h4>
      <div className="space-y-4">
        {/* Tipo de método */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('profile.payment.methodType')} *</label>
            <select
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('profile.payment.selectType')}</option>
              {Object.values(PAYMENT_METHOD_TYPES).map(type => (
                <option key={type} value={type}>
                  {t(PAYMENT_METHOD_LABELS[type])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('profile.payment.label')}</label>
            <input
              type="text"
              placeholder={t('profile.comp.labelPlaceholder')}
              value={form.label}
              onChange={(e) => handleChange('label', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Campos condicionales */}
        {selectedType && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isFieldVisible('bank') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile.payment.bankEntity')}
                </label>
                <input
                  type="text"
                  placeholder={t('profile.comp.bankPlaceholder')}
                  value={form.bank}
                  onChange={(e) => handleChange('bank', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {isFieldVisible('accountNumber') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile.payment.accountNumber')}
                </label>
                <input
                  type="text"
                  placeholder={t('profile.comp.accountNumberPlaceholder')}
                  value={form.accountNumber}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {isFieldVisible('cci') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile.payment.cci')}
                </label>
                <input
                  type="text"
                  placeholder={t('profile.comp.cciPlaceholder')}
                  value={form.cci}
                  onChange={(e) => handleChange('cci', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {isFieldVisible('cardNumber') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile.payment.cardNumber')}
                </label>
                <input
                  type="text"
                  placeholder={t('profile.comp.cardNumberPlaceholder')}
                  value={form.cardNumber}
                  onChange={(e) => handleChange('cardNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {isFieldVisible('phoneNumber') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile.payment.phoneNumber')} *
                </label>
                <input
                  type="text"
                  placeholder="999 888 777"
                  value={form.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {isFieldVisible('holderName') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile.payment.holder')} {requiredFields.includes('holderName') ? '*' : ''}
                </label>
                <input
                  type="text"
                  placeholder={t('profile.comp.holderPlaceholder')}
                  value={form.holderName}
                  onChange={(e) => handleChange('holderName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {isFieldVisible('currency') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile.payment.currency')}
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.values(CURRENCIES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {isFieldVisible('accountType') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile.payment.accountType')}
                </label>
                <select
                  value={form.accountType}
                  onChange={(e) => handleChange('accountType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('common.select')}</option>
                  {Object.values(ACCOUNT_TYPES).map(type => (
                    <option key={type} value={type}>
                      {type === 'checking' ? t('profile.comp.accountChecking') : type === 'savings' ? t('profile.comp.accountSavings') : t('profile.comp.accountCTS')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isFieldVisible('cardType') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile.payment.cardType')}
                </label>
                <select
                  value={form.cardType}
                  onChange={(e) => handleChange('cardType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('common.select')}</option>
                  {Object.values(CARD_TYPES).map(type => (
                    <option key={type} value={type}>
                      {type === 'visa' ? 'Visa' : type === 'mastercard' ? 'Mastercard' : type === 'amex' ? 'American Express' : 'Diners'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isFieldVisible('expiryDate') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile.payment.expiryDate')}
                </label>
                <input
                  type="text"
                  placeholder="MM/YYYY"
                  value={form.expiryDate}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {isFieldVisible('description') && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile.payment.description')}
                </label>
                <input
                  type="text"
                  placeholder={t('profile.comp.descriptionPlaceholder')}
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-4 h-4" />
            {loading ? t('profile.payment.adding') : t('profile.payment.addMethod')}
          </button>
        </div>
      </div>
    </div>
  );
};

AddPaymentMethodForm.propTypes = {
  onAddPaymentMethod: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default AddPaymentMethodForm;
