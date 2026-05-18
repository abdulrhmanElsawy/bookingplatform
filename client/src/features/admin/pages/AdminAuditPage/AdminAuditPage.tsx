import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { fetchAdminAudit } from '../../api/adminApi';
import { AdminLoadingBlock } from '../../components/AdminLoadingBlock/AdminLoadingBlock';
import { AdminPageHeader } from '../../components/AdminPageHeader/AdminPageHeader';
import { AdminPagination } from '../../components/AdminPagination/AdminPagination';
import shell from '../../components/adminShell.module.css';

export function AdminAuditPage() {
  const { t } = useTranslation('admin');
  const { t: tErrors } = useTranslation('errors');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['admin-audit', page, action],
    queryFn: () => fetchAdminAudit(page, 30, action || undefined),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div data-testid="admin-audit-page">
      <AdminPageHeader title={t('auditLog')} subtitle={t('auditSubtitle')} />
      <div className={`${shell.card} ${shell.tableCard}`}>
        <div className={shell.toolbar}>
          <div className={shell.fieldGrow}>
            <label className={shell.label}>{t('filterAction')}</label>
            <input
              className={shell.input}
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              placeholder={t('filterActionPlaceholder')}
            />
          </div>
        </div>

        {isLoading ? <AdminLoadingBlock /> : null}
        {isError ? <p className={shell.error}>{getApiErrorMessage(error, tErrors)}</p> : null}

        {data ? (
          <>
            <div className={shell.tableWrap}>
              <table className={shell.table}>
                <thead>
                  <tr>
                    <th>{t('auditAction')}</th>
                    <th>{t('auditTarget')}</th>
                    <th>{t('colSubmitted')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={shell.emptyCell}>
                        {t('auditEmpty')}
                      </td>
                    </tr>
                  ) : (
                    data.entries.map((row) => (
                      <tr key={row._id}>
                        <td>{row.action}</td>
                        <td>
                          {row.targetType}
                          {row.targetId ? ` / ${row.targetId}` : ''}
                        </td>
                        <td>{new Date(row.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={page}
              totalPages={totalPages}
              disabled={isFetching}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
