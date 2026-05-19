import { useTranslation } from 'react-i18next';

import styles from './ListingBranchesEditor.module.css';

export type BranchDraft = {
  key: string;
  nameAr: string;
  nameEn: string;
  addrAr: string;
  addrEn: string;
  cityAr: string;
  cityEn: string;
  distAr: string;
  distEn: string;
  googleMapsUrl: string;
  phone: string;
  whatsapp: string;
  isMain: boolean;
  isActive: boolean;
};

export function emptyBranchDraft(overrides?: Partial<BranchDraft>): BranchDraft {
  return {
    key:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `b-${Date.now()}`,
    nameAr: '',
    nameEn: '',
    addrAr: '',
    addrEn: '',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    distAr: '',
    distEn: '',
    googleMapsUrl: '',
    phone: '',
    whatsapp: '',
    isMain: false,
    isActive: true,
    ...overrides,
  };
}

type ListingBranchesEditorProps = {
  branches: BranchDraft[];
  onChange: (branches: BranchDraft[]) => void;
};

export function ListingBranchesEditor({ branches, onChange }: ListingBranchesEditorProps) {
  const { t } = useTranslation('dashboard');

  function updateBranch(key: string, patch: Partial<BranchDraft>): void {
    onChange(branches.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  }

  function setMain(key: string): void {
    onChange(branches.map((b) => ({ ...b, isMain: b.key === key })));
  }

  function removeBranch(key: string): void {
    const next = branches.filter((b) => b.key !== key);
    if (next.length > 0 && !next.some((b) => b.isMain)) {
      next[0]!.isMain = true;
    }
    onChange(next);
  }

  function addBranch(): void {
    onChange([...branches, emptyBranchDraft({ isMain: branches.length === 0 })]);
  }

  return (
    <div className={styles.root} data-testid="listing-branches-editor">
      <div className={styles.header}>
        <h3>{t('branchesTitle')}</h3>
        <p>{t('branchesHint')}</p>
      </div>

      {branches.map((branch, index) => (
        <div key={branch.key} className={styles.card}>
          <div className={styles.cardHead}>
            <strong>{t('branchNumber', { number: index + 1 })}</strong>
            <div className={styles.cardActions}>
              <label className={styles.mainLabel}>
                <input
                  type="radio"
                  name="branch-main"
                  checked={branch.isMain}
                  onChange={() => setMain(branch.key)}
                />
                {t('branchMain')}
              </label>
              {branches.length > 1 ? (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeBranch(branch.key)}
                >
                  {t('branchRemove')}
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>{t('branchNameAr')}</label>
              <input
                className={styles.input}
                value={branch.nameAr}
                onChange={(e) => updateBranch(branch.key, { nameAr: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>{t('branchNameEn')}</label>
              <input
                className={styles.input}
                value={branch.nameEn}
                onChange={(e) => updateBranch(branch.key, { nameEn: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>{t('addressAr')}</label>
              <input
                className={styles.input}
                value={branch.addrAr}
                onChange={(e) => updateBranch(branch.key, { addrAr: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>{t('addressEn')}</label>
              <input
                className={styles.input}
                value={branch.addrEn}
                onChange={(e) => updateBranch(branch.key, { addrEn: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>{t('cityAr')}</label>
              <input
                className={styles.input}
                value={branch.cityAr}
                onChange={(e) => updateBranch(branch.key, { cityAr: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>{t('cityEn')}</label>
              <input
                className={styles.input}
                value={branch.cityEn}
                onChange={(e) => updateBranch(branch.key, { cityEn: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>{t('districtAr')}</label>
              <input
                className={styles.input}
                value={branch.distAr}
                onChange={(e) => updateBranch(branch.key, { distAr: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>{t('districtEn')}</label>
              <input
                className={styles.input}
                value={branch.distEn}
                onChange={(e) => updateBranch(branch.key, { distEn: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>{t('googleMapsUrl')}</label>
            <input
              className={styles.input}
              value={branch.googleMapsUrl}
              onChange={(e) => updateBranch(branch.key, { googleMapsUrl: e.target.value })}
              placeholder={t('googleMapsUrlHint')}
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>{t('branchPhone')}</label>
              <input
                className={styles.input}
                value={branch.phone}
                onChange={(e) => updateBranch(branch.key, { phone: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>{t('branchWhatsapp')}</label>
              <input
                className={styles.input}
                value={branch.whatsapp}
                onChange={(e) => updateBranch(branch.key, { whatsapp: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}

      <button type="button" className={styles.addBtn} onClick={addBranch}>
        {t('branchAdd')}
      </button>
    </div>
  );
}


