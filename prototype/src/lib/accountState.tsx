import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DOMAINS,
  SERVICES,
  DNS_BY_DOMAIN,
  INVOICES,
  type DomainRecord,
  type Service,
  type DnsRecord,
  type Invoice,
} from './account';

/**
 * The account's editable state — the part of the fixtures a person can change.
 *
 * Domain management is eight screens now, and a lock switched off on Transfer-out has to read
 * as off on Overview a moment later. Local state per screen cannot do that: each screen would
 * boot from the fixture and quietly forget what the last one did. So the editable copies live
 * here, seeded once from the fixtures, the same way the cart lives in its own provider.
 *
 * Nothing is persisted. There is no server to save to, and a prototype that remembered edits
 * across reloads would review as though it had one.
 */
interface AccountStateValue {
  domains: DomainRecord[];
  services: Service[];
  dns: Record<string, DnsRecord[]>;
  invoices: Invoice[];
  domain: (id: string) => DomainRecord | undefined;
  service: (id: string) => Service | undefined;
  invoice: (id: string) => Invoice | undefined;
  updateDomain: (id: string, patch: Partial<DomainRecord>) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  setDns: (domainId: string, rows: DnsRecord[]) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  /** Takes the row off the account's own list. Nothing here deletes an accounting record. */
  removeInvoice: (id: string) => void;
}

const AccountStateContext = createContext<AccountStateValue | null>(null);

export function AccountStateProvider({ children }: { children: ReactNode }) {
  const [domains, setDomains] = useState<DomainRecord[]>(DOMAINS);
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [dns, setDnsState] = useState<Record<string, DnsRecord[]>>(DNS_BY_DOMAIN);
  /*
   * The invoices joined the editable state when the list grew a row menu. Cancelling one has
   * to read as cancelled on the dashboard's amount due and in the sidebar's badge a moment
   * later, not only in the table it was cancelled from — the same reason the domains are here.
   */
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES);

  const updateDomain = useCallback((id: string, patch: Partial<DomainRecord>) => {
    setDomains((all) => all.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const updateService = useCallback((id: string, patch: Partial<Service>) => {
    setServices((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const setDns = useCallback((domainId: string, rows: DnsRecord[]) => {
    setDnsState((all) => ({ ...all, [domainId]: rows }));
  }, []);

  const updateInvoice = useCallback((id: string, patch: Partial<Invoice>) => {
    setInvoices((all) => all.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const removeInvoice = useCallback((id: string) => {
    setInvoices((all) => all.filter((i) => i.id !== id));
  }, []);

  const value = useMemo<AccountStateValue>(
    () => ({
      domains,
      services,
      dns,
      invoices,
      domain: (id) => domains.find((d) => d.id === id),
      service: (id) => services.find((s) => s.id === id),
      invoice: (id) => invoices.find((i) => i.id === id),
      updateDomain,
      updateService,
      setDns,
      updateInvoice,
      removeInvoice,
    }),
    [
      domains,
      services,
      dns,
      invoices,
      updateDomain,
      updateService,
      setDns,
      updateInvoice,
      removeInvoice,
    ],
  );

  return <AccountStateContext.Provider value={value}>{children}</AccountStateContext.Provider>;
}

export function useAccountState(): AccountStateValue {
  const ctx = useContext(AccountStateContext);
  if (!ctx) throw new Error('useAccountState must be used inside AccountStateProvider');
  return ctx;
}
