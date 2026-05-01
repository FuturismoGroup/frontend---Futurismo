/**
 * Constantes de Rewards
 * Valores estáticos para el módulo
 */

// Reward categories as object (for use in components)
export const REWARD_CATEGORIES = {
  ELECTRONICS: 'electronics',
  TRAVEL: 'travel',
  GIFT_CARDS: 'gift_cards',
  EXPERIENCES: 'experiences',
  MERCHANDISE: 'merchandise',
  SERVICES: 'services'
};

// Reward category labels (labelKey pattern - use t(value) in components)
export const REWARD_CATEGORY_LABELS = {
  electronics: 'rewards.categoryLabels.electronics',
  travel: 'rewards.categoryLabels.travel',
  gift_cards: 'rewards.categoryLabels.giftCards',
  experiences: 'rewards.categoryLabels.experiences',
  merchandise: 'rewards.categoryLabels.merchandise',
  services: 'rewards.categoryLabels.services'
};

// Redemption status as object (for use in components)
export const REDEMPTION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Redemption status labels (labelKey pattern - use t(value) in components)
export const REDEMPTION_STATUS_LABELS = {
  pending: 'rewards.redemptionStatus.pending',
  approved: 'rewards.redemptionStatus.approved',
  rejected: 'rewards.redemptionStatus.rejected',
  delivered: 'rewards.redemptionStatus.delivered',
  cancelled: 'rewards.redemptionStatus.cancelled'
};

// Redemption status colors
export const REDEMPTION_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

// Rewards messages for toast notifications
export const getRewardsMessages = (t) => ({
  FETCH_ERROR: t('rewards.messages.fetchError'),
  CREATE_SUCCESS: t('rewards.messages.createSuccess'),
  CREATE_ERROR: t('rewards.messages.createError'),
  UPDATE_SUCCESS: t('rewards.messages.updateSuccess'),
  UPDATE_ERROR: t('rewards.messages.updateError'),
  DELETE_SUCCESS: t('rewards.messages.deleteSuccess'),
  DELETE_ERROR: t('rewards.messages.deleteError'),
  REDEMPTION_SUCCESS: t('rewards.messages.redemptionSuccess'),
  REDEMPTION_ERROR: t('rewards.messages.redemptionError'),
  INSUFFICIENT_POINTS: t('rewards.messages.insufficientPoints'),
  OUT_OF_STOCK: t('rewards.messages.outOfStock')
});

/** @deprecated Use getRewardsMessages(t) instead */
export const REWARDS_MESSAGES = {
  FETCH_ERROR: 'rewards.messages.fetchError',
  CREATE_SUCCESS: 'rewards.messages.createSuccess',
  CREATE_ERROR: 'rewards.messages.createError',
  UPDATE_SUCCESS: 'rewards.messages.updateSuccess',
  UPDATE_ERROR: 'rewards.messages.updateError',
  DELETE_SUCCESS: 'rewards.messages.deleteSuccess',
  DELETE_ERROR: 'rewards.messages.deleteError',
  REDEMPTION_SUCCESS: 'rewards.messages.redemptionSuccess',
  REDEMPTION_ERROR: 'rewards.messages.redemptionError',
  INSUFFICIENT_POINTS: 'rewards.messages.insufficientPoints',
  OUT_OF_STOCK: 'rewards.messages.outOfStock'
};

// Export default para compatibilidad
export default {
  REWARD_CATEGORIES,
  REWARD_CATEGORY_LABELS,
  REDEMPTION_STATUS,
  REDEMPTION_STATUS_LABELS,
  REDEMPTION_STATUS_COLORS,
  REWARDS_MESSAGES,
  getRewardsMessages
};
