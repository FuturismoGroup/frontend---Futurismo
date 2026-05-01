import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { PAYMENT_METHOD_TYPES, PAYMENT_METHOD_LABELS } from '../../constants/profileConstants';

const TYPE_BADGE_COLORS = {
  [PAYMENT_METHOD_TYPES.BANK_TRANSFER]: 'bg-green-100 text-green-800',
  [PAYMENT_METHOD_TYPES.CREDIT_CARD]: 'bg-blue-100 text-blue-800',
  [PAYMENT_METHOD_TYPES.DEBIT_CARD]: 'bg-indigo-100 text-indigo-800',
  [PAYMENT_METHOD_TYPES.CASH]: 'bg-yellow-100 text-yellow-800',
  [PAYMENT_METHOD_TYPES.YAPE]: 'bg-purple-100 text-purple-800',
  [PAYMENT_METHOD_TYPES.PLIN]: 'bg-teal-100 text-teal-800'
};

const PaymentMethodCard = ({
  method,
  showCardNumber,
  onToggleShowCard,
  onSetAsMain,
  onDelete,
  onToggle,
  maskCardNumber,
  getPaymentTypeLabel
}) => {
  const { t } = useTranslation();

  const badgeColor = TYPE_BADGE_COLORS[method.type] || 'bg-gray-100 text-gray-800';
  const isInactive = method.isActive === false;

  return (
    <div className={`border rounded-lg p-4 transition-opacity ${
      method.isMain ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
    } ${isInactive ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium px-2 py-1 rounded ${badgeColor}`}>
            {getPaymentTypeLabel(method.type)}
          </span>
          {method.label && (
            <span className="text-sm text-gray-600">{method.label}</span>
          )}
          {method.isMain && (
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
              {t('profile.payment.main')}
            </span>
          )}
          {isInactive && (
            <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded">
              {t('profile.payment.inactive')}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {onToggle && (
            <button
              onClick={() => onToggle(method.id)}
              className={`text-xs px-2 py-1 rounded ${
                isInactive
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {isInactive ? t('profile.payment.activate') : t('profile.payment.deactivate')}
            </button>
          )}
          {!method.isMain && onSetAsMain && (
            <button
              onClick={() => onSetAsMain(method.id)}
              className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
            >
              {t('profile.payment.setAsMain')}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(method.id)}
              className="text-red-600 hover:bg-red-50 p-1 rounded"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Bank - para bank_transfer, credit_card, debit_card */}
        {method.bank && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.payment.bankEntity')}
            </label>
            <p className="text-gray-900 font-medium">{method.bank}</p>
          </div>
        )}

        {/* Account Number - para bank_transfer */}
        {method.accountNumber && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.payment.accountNumber')}
            </label>
            <div className="flex items-center gap-2">
              <p className="text-gray-900 flex-1">
                {showCardNumber
                  ? method.accountNumber
                  : maskCardNumber(method.accountNumber)
                }
              </p>
              <button
                onClick={() => onToggleShowCard(method.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showCardNumber ?
                  <EyeSlashIcon className="w-4 h-4" /> :
                  <EyeIcon className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        )}

        {/* CCI - para bank_transfer */}
        {method.cci && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.payment.cci')}
            </label>
            <p className="text-gray-900">{method.cci}</p>
          </div>
        )}

        {/* Card Number - para credit_card, debit_card */}
        {method.cardNumber && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.payment.cardNumber')}
            </label>
            <div className="flex items-center gap-2">
              <p className="text-gray-900 flex-1">
                {showCardNumber
                  ? method.cardNumber
                  : maskCardNumber(method.cardNumber)
                }
              </p>
              <button
                onClick={() => onToggleShowCard(method.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showCardNumber ?
                  <EyeSlashIcon className="w-4 h-4" /> :
                  <EyeIcon className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        )}

        {/* Phone Number - para yape, plin */}
        {method.phoneNumber && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.payment.phoneNumber')}
            </label>
            <p className="text-gray-900 font-medium">{method.phoneNumber}</p>
          </div>
        )}

        {/* Account Type - para bank_transfer */}
        {method.accountType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.payment.accountType')}
            </label>
            <p className="text-gray-900">
              {method.accountType === 'checking' ? t('profile.comp.accountChecking') : method.accountType === 'savings' ? t('profile.comp.accountSavings') : t('profile.comp.accountCTS')}
            </p>
          </div>
        )}

        {/* Currency - para bank_transfer */}
        {method.currency && method.type === PAYMENT_METHOD_TYPES.BANK_TRANSFER && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.payment.currency')}
            </label>
            <p className="text-gray-900">{method.currency}</p>
          </div>
        )}

        {/* Card Type - para credit_card, debit_card */}
        {method.cardType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.payment.cardType')}
            </label>
            <p className="text-gray-900">
              {method.cardType === 'visa' ? 'Visa' : method.cardType === 'mastercard' ? 'Mastercard' : method.cardType === 'amex' ? 'American Express' : method.cardType}
            </p>
          </div>
        )}

        {/* Expiry Date - para credit_card, debit_card */}
        {method.expiryDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.payment.expiryDate')}
            </label>
            <p className="text-gray-900">{method.expiryDate}</p>
          </div>
        )}

        {/* Holder Name */}
        {method.holderName && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.payment.holder')}
            </label>
            <p className="text-gray-900">{method.holderName}</p>
          </div>
        )}

        {/* Description - para cash */}
        {method.description && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.payment.description')}
            </label>
            <p className="text-gray-900">{method.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

PaymentMethodCard.propTypes = {
  method: PropTypes.object.isRequired,
  showCardNumber: PropTypes.bool,
  onToggleShowCard: PropTypes.func.isRequired,
  onSetAsMain: PropTypes.func,
  onDelete: PropTypes.func,
  onToggle: PropTypes.func,
  maskCardNumber: PropTypes.func.isRequired,
  getPaymentTypeLabel: PropTypes.func.isRequired
};

export default PaymentMethodCard;
