import { useAuthStore } from '../../store/useAuthStore';

const STORAGE_KEY = 'kettan-audit-logs';
const MAX_AUDIT_ROWS = 500;

export type AuditAction =
  | 'ReturnFiled'
  | 'ReturnResolved'
  | 'ReturnRejected'
  | 'ReturnDetailViewed'
  | 'ReturnsPageViewed'
  | 'AuditLogsViewed';

export interface AuditLogEntry {
  id: string;
  occurredAt: string;
  action: AuditAction;
  entityName: string;
  entityId: string;
  actorName: string;
  actorRole: string;
  details: string;
}

interface RecordAuditLogInput {
  action: AuditAction;
  entityName: string;
  entityId: string | number;
  details: string;
}

function isBrowserEnvironment() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAuditLogs(): AuditLogEntry[] {
  if (!isBrowserEnvironment()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as AuditLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAuditLogs(rows: AuditLogEntry[]) {
  if (!isBrowserEnvironment()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function listAuditLogs(): AuditLogEntry[] {
  return readAuditLogs().sort((left, right) => {
    return new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();
  });
}

export function recordAuditLog(input: RecordAuditLogInput) {
  const { user } = useAuthStore.getState();
  const actorName = user?.name || 'System User';
  const actorRole = user?.role || 'UnknownRole';

  const newEntry: AuditLogEntry = {
    id: `AL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: new Date().toISOString(),
    action: input.action,
    entityName: input.entityName,
    entityId: String(input.entityId),
    actorName,
    actorRole,
    details: input.details,
  };

  const current = readAuditLogs();
  const next = [newEntry, ...current].slice(0, MAX_AUDIT_ROWS);
  writeAuditLogs(next);
}
