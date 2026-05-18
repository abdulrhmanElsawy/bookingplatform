import { useTranslation } from 'react-i18next';

import shell from '../adminShell.module.css';

const LISTING_STATUSES = new Set(['draft', 'pending', 'active', 'rejected', 'suspended']);
const SUBSCRIPTION_STATUSES = new Set(['active', 'cancelled', 'expired']);
const REVIEW_STATUSES = new Set(['pending', 'approved', 'rejected']);

function badgeClass(status: string): string {
  switch (status) {
    case 'active':
    case 'approved':
      return `${shell.badge} ${shell.badgeSuccess}`;
    case 'pending':
      return `${shell.badge} ${shell.badgeWarning}`;
    case 'rejected':
    case 'suspended':
    case 'cancelled':
    case 'expired':
      return `${shell.badge} ${shell.badgeDanger}`;
    case 'draft':
      return `${shell.badge} ${shell.badgeMuted}`;
    default:
      return shell.badge;
  }
}

type AdminStatusBadgeProps = {
  status: string;
  kind?: 'listing' | 'review' | 'subscription' | 'user';
};

export function AdminStatusBadge({ status, kind = 'listing' }: AdminStatusBadgeProps) {
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');

  let label = status;
  if (kind === 'user') {
    label = status === 'active' ? tCommon('active') : tCommon('inactive');
  } else if (kind === 'subscription' && SUBSCRIPTION_STATUSES.has(status)) {
    label = t(`subscriptionStatus_${status}` as 'subscriptionStatus_active');
  } else if (kind === 'review' && REVIEW_STATUSES.has(status)) {
    label = status === 'approved' ? t('reviewApproved') : tCommon(status);
  } else if (LISTING_STATUSES.has(status)) {
    label = tCommon(status);
  }

  return <span className={badgeClass(status)}>{label}</span>;
}
