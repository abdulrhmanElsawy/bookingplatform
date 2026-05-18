import { useTranslation } from 'react-i18next';

import shell from '../adminShell.module.css';

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
};

export function AdminPagination({
  page,
  totalPages,
  onPrev,
  onNext,
  disabled,
}: AdminPaginationProps) {
  const { t } = useTranslation('admin');

  return (
    <div className={shell.pagination}>
      <span className={shell.pageInfo}>{t('pageOf', { page, total: totalPages })}</span>
      <div className={shell.actionGroup}>
        <button
          type="button"
          className={`${shell.btn} ${shell.btnSecondary}`}
          disabled={disabled || page <= 1}
          onClick={onPrev}
        >
          {t('pagePrev')}
        </button>
        <button
          type="button"
          className={`${shell.btn} ${shell.btnSecondary}`}
          disabled={disabled || page >= totalPages}
          onClick={onNext}
        >
          {t('pageNext')}
        </button>
      </div>
    </div>
  );
}
