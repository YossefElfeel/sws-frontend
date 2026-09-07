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
  type DomainRecord,
  type Service,
  type DnsRecord,
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
  domain: (id: string) => DomainRecord | undefined;
  service: (id: string) => Service | undefined;
  updateDomain: (id: string, patch: Partial<DomainRecord>) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  setDns: (domainId: string, rows: DnsRecord[]) => void;
}

const AccountStateContext = createContext<AccountStateValue | null>(null);

export function AccountStateProvider({ children }: { children: ReactNode }) {
  const [domains, setDomains] = useState<DomainRecord[]>(DOMAINS);
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [dns, setDnsState] = useState<Record<string, DnsRecord[]>>(DNS_BY_DOMAIN);

  const updateDomain = useCallback((id: string, patch: Partial<DomainRecord>) => {
    setDomains((all) => all.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const updateService = useCallback((id: string, patch: Partial<Service>) => {
    setServices((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const setDns = useCallback((domainId: string, rows: DnsRecord[]) => {
    setDnsState((all) => ({ ...all, [domainId]: rows }));
  }, []);

  const value = useMemo<AccountStateValue>(
    () => ({
      domains,
      services,
      dns,
      domain: (id) => domains.find((d) => d.id === id),
      service: (id) => services.find((s) => s.id === id),
      updateDomain,
      updateService,
      setDns,
    }),
    [domains, services, dns, updateDomain, updateService, setDns],
  );

  return <AccountStateContext.Provider value={value}>{children}</AccountStateContext.Provider>;
}

export function useAccountState(): AccountStateValue {
  const ctx = useContext(AccountStateContext);
  if (!ctx) throw new Error('useAccountState must be used inside AccountStateProvider');
  return ctx;
}
