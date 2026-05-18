import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useAuthStore } from '../../../../store/authStore';
import {
  fetchAdminUsers,
  patchAdminUser,
  postAdminBroadcast,
  type AdminUserRowDto,
} from '../../api/adminApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { AdminLoadingBlock } from '../../components/AdminLoadingBlock/AdminLoadingBlock';
import { AdminPageHeader } from '../../components/AdminPageHeader/AdminPageHeader';
import { AdminPagination } from '../../components/AdminPagination/AdminPagination';
import { AdminStatusBadge } from '../../components/AdminStatusBadge/AdminStatusBadge';
import { SelectField } from '../../../../components/shared/SelectField';
import shell from '../../components/adminShell.module.css';

const BROADCAST_ROLES: AdminUserRowDto['role'][] = [
  'guest',
  'user',
  'gym_owner',
  'admin',
  'super_admin',
];

function assignableRoles(actorRole: string | undefined): AdminUserRowDto['role'][] {
  if (actorRole === 'super_admin') {
    return [...BROADCAST_ROLES];
  }
  return ['guest', 'user', 'gym_owner'];
}

function canEditUserRow(
  actorId: string | undefined,
  actorRole: string | undefined,
  row: AdminUserRowDto,
): boolean {
  if (!actorId) return false;
  if (row._id === actorId) return false;
  if (actorRole === 'admin') {
    if (row.role === 'admin' || row.role === 'super_admin') return false;
  }
  return true;
}

function UserRow({
  row,
  canEdit,
  actorRole,
  lang,
}: {
  row: AdminUserRowDto;
  canEdit: boolean;
  actorRole: string | undefined;
  lang: 'ar' | 'en';
}) {
  const { t } = useTranslation('admin');
  const { t: tErrors } = useTranslation('errors');
  const queryClient = useQueryClient();
  const [rolePick, setRolePick] = useState(row.role);

  useEffect(() => {
    setRolePick(row.role);
  }, [row.role]);

  const patchMutation = useMutation({
    mutationFn: (payload: { userId: string; body: { isActive?: boolean; role?: AdminUserRowDto['role'] } }) =>
      patchAdminUser(payload.userId, payload.body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const busy = patchMutation.isPending;
  const options = assignableRoles(actorRole);

  return (
    <tr data-testid={`admin-user-row-${row._id}`}>
      <td>{row.email}</td>
      <td>
        {row.firstName} {row.lastName}
      </td>
      <td>{t(`role_${row.role}`)}</td>
      <td>
        <AdminStatusBadge
          status={row.isActive ? 'active' : 'inactive'}
          kind="user"
        />
      </td>
      <td>{new Date(row.createdAt).toLocaleString(lang === 'en' ? 'en' : 'ar-SA')}</td>
      <td>
        {canEdit ? (
          <div className={shell.actionGroup}>
            <button
              type="button"
              className={`${shell.btn} ${shell.btnSecondary} ${shell.btnSmall}`}
              disabled={busy}
              onClick={() =>
                patchMutation.mutate({ userId: row._id, body: { isActive: !row.isActive } })
              }
            >
              {row.isActive ? t('deactivateUser') : t('activateUser')}
            </button>
            <SelectField
              size="sm"
              className={shell.inlineSelect}
              value={rolePick}
              disabled={busy}
              onChange={(next) => setRolePick(next as AdminUserRowDto['role'])}
              options={options.map((r) => ({ value: r, label: t(`role_${r}`) }))}
            />
            <button
              type="button"
              className={`${shell.btn} ${shell.btnSecondary} ${shell.btnSmall}`}
              disabled={busy || rolePick === row.role}
              onClick={() => patchMutation.mutate({ userId: row._id, body: { role: rolePick } })}
            >
              {t('saveRole')}
            </button>
            {patchMutation.isError ? (
              <span className={shell.error}>
                {getApiErrorMessage(patchMutation.error, tErrors)}
              </span>
            ) : null}
          </div>
        ) : (
          <span className={shell.badge}>—</span>
        )}
      </td>
    </tr>
  );
}

export function AdminUsersPage() {
  const { t } = useTranslation('admin');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const lang = currentLang === 'en' ? 'en' : 'ar';
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const limit = 20;

  const [broadcastScope, setBroadcastScope] = useState<'all' | 'role'>('all');
  const [broadcastRole, setBroadcastRole] = useState<AdminUserRowDto['role']>('user');
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [broadcastDone, setBroadcastDone] = useState<number | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-users', page, appliedSearch, limit],
    queryFn: () => fetchAdminUsers(page, limit, appliedSearch || undefined),
  });

  const broadcastMutation = useMutation({
    mutationFn: postAdminBroadcast,
    onSuccess: async (data) => {
      setBroadcastDone(data.recipients);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const totalPages = listQuery.data
    ? Math.max(1, Math.ceil(listQuery.data.total / limit))
    : 1;

  return (
    <div data-testid="admin-users-page">
      <AdminPageHeader title={t('usersAndBroadcast')} subtitle={t('usersSectionSubtitle')} />

      <div className={`${shell.card} ${shell.tableCard}`}>
        <h2 className={shell.sectionTitle}>{t('usersTableTitle')}</h2>
        <div className={shell.toolbar}>
          <div className={shell.fieldGrow}>
            <label className={shell.label} htmlFor="admin-users-search">
              {t('searchUsers')}
            </label>
            <input
              id="admin-users-search"
              className={shell.input}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('searchPlaceholderUsers')}
            />
          </div>
          <button
            type="button"
            className={shell.btn}
            onClick={() => {
              setPage(1);
              setAppliedSearch(searchInput.trim());
            }}
          >
            {t('applySearch')}
          </button>
        </div>

        {listQuery.isLoading ? <AdminLoadingBlock /> : null}
      {listQuery.isError ? (
        <p className={shell.error} role="alert">
          {getApiErrorMessage(listQuery.error, tErrors)}
        </p>
      ) : null}

      {listQuery.data ? (
        <>
          <div className={shell.tableWrap}>
            <table className={shell.table} data-testid="admin-users-table">
              <thead>
                <tr>
                  <th scope="col">{t('colEmail')}</th>
                  <th scope="col">{t('colFullName')}</th>
                  <th scope="col">{t('colRole')}</th>
                  <th scope="col">{t('colStatus')}</th>
                  <th scope="col">{t('colJoined')}</th>
                  <th scope="col">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.data.users.map((row) => (
                  <UserRow
                    key={row._id}
                    row={row}
                    canEdit={canEditUserRow(me?.id, me?.role, row)}
                    actorRole={me?.role}
                    lang={lang}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination
            page={page}
            totalPages={totalPages}
            disabled={listQuery.isFetching}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      ) : null}
      </div>

      <section className={shell.card}>
        <h2 className={shell.sectionTitle}>{t('broadcastFormTitle')}</h2>
        <div className={shell.radioRow}>
          <label>
            <input
              type="radio"
              name="bc-scope"
              checked={broadcastScope === 'all'}
              onChange={() => setBroadcastScope('all')}
            />{' '}
            {t('broadcastAllUsers')}
          </label>
          <label>
            <input
              type="radio"
              name="bc-scope"
              checked={broadcastScope === 'role'}
              onChange={() => setBroadcastScope('role')}
            />{' '}
            {t('broadcastByRole')}
          </label>
          {broadcastScope === 'role' ? (
            <SelectField
              size="sm"
              value={broadcastRole}
              onChange={(next) => setBroadcastRole(next as AdminUserRowDto['role'])}
              options={BROADCAST_ROLES.map((r) => ({
                value: r,
                label: t(`role_${r}`),
              }))}
            />
          ) : null}
        </div>
        <div className={shell.field}>
          <label className={shell.label} htmlFor="bc-title-ar">
            {t('broadcastTitleAr')}
          </label>
          <input
            id="bc-title-ar"
            className={shell.input}
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            dir="rtl"
            lang="ar"
          />
        </div>
        <div className={shell.field}>
          <label className={shell.label} htmlFor="bc-title-en">
            {t('broadcastTitleEn')}
          </label>
          <input
            id="bc-title-en"
            className={shell.input}
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            dir="ltr"
            lang="en"
          />
        </div>
        <div className={shell.field}>
          <label className={shell.label} htmlFor="bc-body-ar">
            {t('messageAr')}
          </label>
          <textarea
            id="bc-body-ar"
            className={shell.textarea}
            value={bodyAr}
            onChange={(e) => setBodyAr(e.target.value)}
            dir="rtl"
            lang="ar"
          />
        </div>
        <div className={shell.field}>
          <label className={shell.label} htmlFor="bc-body-en">
            {t('messageEn')}
          </label>
          <textarea
            id="bc-body-en"
            className={shell.textarea}
            value={bodyEn}
            onChange={(e) => setBodyEn(e.target.value)}
            dir="ltr"
            lang="en"
          />
        </div>
        {broadcastMutation.isError ? (
          <p className={shell.error} role="alert">
            {getApiErrorMessage(broadcastMutation.error, tErrors)}
          </p>
        ) : null}
        <button
          type="button"
          className={shell.btn}
          disabled={
            broadcastMutation.isPending ||
            !titleAr.trim() ||
            !titleEn.trim() ||
            !bodyAr.trim() ||
            !bodyEn.trim()
          }
          onClick={() => {
            setBroadcastDone(null);
            broadcastMutation.mutate({
              scope: broadcastScope,
              ...(broadcastScope === 'role' ? { role: broadcastRole } : {}),
              title: { ar: titleAr.trim(), en: titleEn.trim() },
              body: { ar: bodyAr.trim(), en: bodyEn.trim() },
            });
          }}
        >
          {t('sendBroadcast')}
        </button>
        {broadcastDone !== null ? (
          <p className={shell.success}>{t('broadcastRecipientsDone', { count: broadcastDone })}</p>
        ) : null}
      </section>
    </div>
  );
}
