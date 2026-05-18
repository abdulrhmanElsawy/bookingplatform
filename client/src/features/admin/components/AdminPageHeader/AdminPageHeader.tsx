import shell from '../adminShell.module.css';

type AdminPageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function AdminPageHeader({ title, subtitle }: AdminPageHeaderProps) {
  return (
    <header className={shell.pageHeader}>
      <h1 className={shell.pageTitle}>{title}</h1>
      {subtitle ? <p className={shell.pageSub}>{subtitle}</p> : null}
    </header>
  );
}
