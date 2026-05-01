import { useTranslation } from 'react-i18next';
import {
  CreditCardIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LockClosedIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import useAdminPaymentData from '../../hooks/useAdminPaymentData';
import PaymentMethodCard from './PaymentMethodCard';
import AddPaymentMethodForm from './AddPaymentMethodForm';

const AdminPaymentDataSection = () => {
  const { t } = useTranslation();
  const {
    isCollapsed,
    setIsCollapsed,
    showCardNumbers,
    paymentMethods,
    maskCardNumber,
    toggleShowCardNumber,
    handleAddPaymentMethod,
    handleDeletePaymentMethod,
    handleTogglePaymentMethod,
    handleSetAsMain,
    getPaymentTypeLabel,
    loading
  } = useAdminPaymentData();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-purple-100 rounded-lg">
            <CreditCardIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('profile.payment.title')}
            </h3>
            <p className="text-sm text-gray-500">
              {t('profile.comp.paymentMethodsSubtitle')}
            </p>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={isCollapsed ? t('common.expand') : t('common.collapse')}
          >
            {isCollapsed ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronUpIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div>
          {/* Nota informativa para admin */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <BuildingOfficeIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">{t('profile.comp.companyPaymentMethods')}</p>
                <p>
                  {t('profile.comp.companyPaymentNote')}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de métodos existentes */}
          <div className="space-y-4 mb-6">
            {loading && paymentMethods.length === 0 && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">{t('profile.comp.loadingPaymentMethods')}</span>
              </div>
            )}

            {paymentMethods.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <CreditCardIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">{t('profile.comp.noPaymentMethods')}</p>
                <p className="text-sm mt-1">{t('profile.comp.addPaymentMethodBelow')}</p>
              </div>
            )}

            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                showCardNumber={showCardNumbers[method.id] || false}
                onToggleShowCard={toggleShowCardNumber}
                onSetAsMain={handleSetAsMain}
                onDelete={handleDeletePaymentMethod}
                onToggle={handleTogglePaymentMethod}
                maskCardNumber={maskCardNumber}
                getPaymentTypeLabel={getPaymentTypeLabel}
              />
            ))}
          </div>

          {/* Formulario para agregar */}
          <AddPaymentMethodForm
            onAddPaymentMethod={handleAddPaymentMethod}
            loading={loading}
          />

          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-800 flex items-start gap-2">
              <LockClosedIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <span className="font-medium">{t('profile.payment.securityTitle')}:</span>{' '}
                {t('profile.payment.securityMessage')}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentDataSection;
