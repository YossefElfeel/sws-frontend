import type { ReactNode } from 'react';
import { AppShell } from './AppShell';

/**
 * The client-area page wrapper — spec 5.4 and 9.
 *
 * Every account screen already calls this, so the shell swap lives here rather than in
 * eighteen files. It is a name for "a screen inside the application", and AppShell is what
 * that means.
 */
export function AccountLayout({
  title,
  lede,
  crumbs,
  actions,
  children,
}: {
  title: string;
  lede?: string;
  crumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppShell title={title} lede={lede} crumbs={crumbs} actions={actions}>
      {children}
    </AppShell>
  );
}
