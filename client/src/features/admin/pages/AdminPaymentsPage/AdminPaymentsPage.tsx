import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { fetchAdminPaymentTransactions, fetchAdminPaymentsSummary } from '../../api/adminApi';
import { AdminLoadingBlock } from '../../components/AdminLoadingBlock/AdminLoadingBlock';
import { AdminPageHeader } from '../../components/AdminPageHeader/AdminPageHeader';
import { AdminPagination } from '../../components/AdminPagination/AdminPagination';
import shell from '../../components/adminShell.module.css';

function planLabel(planKey: string, t: (k: string) => string): string {
  const key = `plan_${planKey}`;
  const translated = t(key);
  return translated === key ? planKey : translated;
}

export function AdminPaymentsPage() {
  const { t } = useTranslation('admin');
  const { t: tErrors } = useTranslation('errors');
  const [page, setPage] = useState(1);

  const summaryQuery = useQuery({
    queryKey: ['admin-payments-summary'],
    queryFn: fetchAdminPaymentsSummary,
  });

  const txQuery = useQuery({
    queryKey: ['admin-payments-tx', page],
    queryFn: () => fetchAdminPaymentTransactions(page, 20),
  });

  const totalPages = txQuery.data
    ? Math.max(1, Math.ceil(txQuery.data.total / txQuery.data.limit))
    : 1;

  return (
    <div data-testid="admin-payments-page">
      <AdminPageHeader title={t('nav.payments')} subtitle={t('paymentsSubtitle')} />
      {summaryQuery.data ? (
        <div className={shell.gridStats}>
          <article className={shell.statCard}>
            <p className={shell.statLabel}>{t('totalTransactions')}</p>
            <p className={shell.statValue}>{summaryQuery.data.totalTransactions}</p>
          </article>
          <article className={shell.statCard}>
            <p className={shell.statLabel}>{t('totalAmount')}</p>
            <p className={shell.statValue}>{summaryQuery.data.totalAmount}</p>
          </article>
        </div>
      ) : null}

      <div className={`${shell.card} ${shell.tableCard}`}>
        {txQuery.isLoading ? <AdminLoadingBlock /> : null}
        {txQuery.isError ? (
          <p className={shell.error}>{getApiErrorMessage(txQuery.error, tErrors)}</p>
        ) : null}
        {txQuery.data ? (
          <>
            <div className={shell.tableWrap}>
              <table className={shell.table}>
                <thead>
                  <tr>
                    <th>{t('colEmail')}</th>
                    <th>{t('planKey')}</th>
                    <th>{t('amount')}</th>
                    <th>{t('colSubmitted')}</th>
                  </tr>
                </thead>
                <tbody>
                  {txQuery.data.transactions.map((row) => (
                    <tr key={row._id}>
                      <td>{row.userEmail}</td>
                      <td>{planLabel(row.planKey, t)}</td>
                      <td>
                        {row.amount} {row.currency}
                      </td>
                      <td>{new Date(row.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={page}
              totalPages={totalPages}
              disabled={txQuery.isFetching}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
