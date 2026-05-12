
export interface AuditLogEntry {
  id: number;
  action: string;
  actionCode?: string;
  outcome?: string;
  severity?: string;
  source?: string;
  httpMethod?: string;
  route?: string;
  statusCode?: number;
  correlationId?: string;
  branchId?: number | null;
  module?: string;
  referenceType?: string;
  referenceId?: string;
  errorCode?: string;
  errorMessage?: string;
  metadataJson?: string;
  oldValues?: string;
  newValues?: string;
  entityName: string;
  entityId: string | null;
  eventCategory: string;
  actorName: string;
  actorRole: string;
  tenantId: number | null;
  tenantName: string | null;
  occurredAt: string;
  ipAddress: string | null;
}

const ROUTE_MAP: Record<string, string> = {
  '/api/audit-logs': 'Audit Logs',
  '/api/Notifications': 'Notifications',
  '/api/Orders': 'Orders',
  '/api/BranchOrders': 'Branch Orders',
  '/api/SupplyRequests': 'Supply Requests',
  '/api/Returns': 'Returns',
  '/api/Items': 'Inventory Items',
  '/api/Branches': 'Branches',
  '/api/Users': 'User Accounts',
  '/api/Tenants': 'Tenant Profiles',
  '/api/Consumption': 'Consumption Logs',
  '/api/Reports': 'Analytical Reports',
  '/api/MenuItems': 'Menu Items',
  '/api/Employees': 'Employee Records',
  '/api/Suppliers': 'Suppliers',
  '/api/Vehicles': 'Vehicles',
  '/api/Settings': 'System Settings',
  '/api/Auth/login': 'System Login',
  '/api/Auth/logout': 'System Logout',
};


export function toPastTense(verb: string): string {
  const normalized = verb.toLowerCase().trim();
  switch (normalized) {
    case 'create':
    case 'created':
      return 'Registered';
    case 'update':
    case 'updated':
      return 'Modified';
    case 'delete':
    case 'deleted':
      return 'Removed';
    case 'archive':
    case 'archived':
      return 'Archived';
    case 'unarchive':
    case 'unarchived':
      return 'Restored';
    case 'activate':
    case 'activated':
      return 'Activated';
    case 'deactivate':
    case 'deactivated':
      return 'Deactivated';
    case 'get':
      return 'Viewed';
    case 'post':
      return 'Created';
    case 'put':
    case 'patch':
      return 'Modified';
    default:
      if (normalized.endsWith('ed')) return normalized.charAt(0).toUpperCase() + normalized.slice(1);
      if (normalized.endsWith('e')) return normalized.charAt(0).toUpperCase() + normalized.slice(1) + 'd';
      return normalized.charAt(0).toUpperCase() + normalized.slice(1) + 'ed';
  }
}

export function humanizeRoute(route: string, method: string): string {
  const [path] = route.split('?');
  const parts = path.split('/').filter(Boolean);
  
  if (parts[0] === 'api') {
    const resource = parts[1];
    const id = parts[2];
    const subResource = parts[3];
    
    let friendlyResource = ROUTE_MAP[`/api/${resource}`] || resource;
    const verb = toPastTense(method);
    
    if (subResource) {
      const friendlySub = subResource.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
      return `${verb} ${friendlySub} for ${friendlyResource.replace(/s$/, '')} #${id}`;
    }
    
    if (id && (!isNaN(Number(id)) || id.length > 20)) {
      return `${verb} ${friendlyResource.replace(/s$/, '')} Details`;
    }

    return `${verb} ${friendlyResource}`;
  }
  
  return `${toPastTense(method)} ${route}`;
}

export function humanizeRequestDetails(row: AuditLogEntry): string {
  if (!row.route) return '';

  const [_path, queryString] = row.route.split('?');
  let details = '';

  // Only show parameters if it's a mutation (not GET)
  if (queryString && row.httpMethod !== 'GET') {
    const params = new URLSearchParams(queryString);
    const pairs: string[] = [];
    params.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!lowerKey.includes('id') && !lowerKey.includes('tenant') && !lowerKey.includes('branch')) { 
        pairs.push(`${key}: ${value}`);
      }
    });
    if (pairs.length > 0) {
      details = `Parameters: ${pairs.join(', ')}`;
    }
  }

  // Only show errors for status details
  if (row.outcome !== 'Success' && row.errorMessage) {
    const err = `Error: ${row.errorMessage}${row.errorCode ? ` (${row.errorCode})` : ''}`;
    details = details ? `${details} • ${err}` : err;
  }

  return details;
}

export function humanizeEntityAction(action: string, entity: string, id: string | null): string {
  const entityFriendly = (entity || 'Unknown Entity').replace(/([A-Z])/g, ' $1').trim();
  const verb = toPastTense(action);
  const idSuffix = id ? ` (#${id})` : '';

  return `${verb} ${entityFriendly}${idSuffix}`;
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

const IGNORED_FIELDS = ['tenantId', 'branchId', 'id', 'updatedAt', 'createdAt', 'deletedAt', 'isDeleted', 'password', 'token'];

export function parseChanges(oldValuesJson: string | null, newValuesJson: string | null): FieldChange[] {
  try {
    const oldValues = oldValuesJson ? JSON.parse(oldValuesJson) : {};
    const newValues = newValuesJson ? JSON.parse(newValuesJson) : {};
    
    const changes: FieldChange[] = [];
    
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const key of allKeys) {
      if (IGNORED_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) continue;

      const oldVal = oldValues[key];
      const newVal = newValues[key];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          field: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim(),
          oldValue: oldVal,
          newValue: newVal
        });
      }
    }

    return changes;
  } catch (e) {
    console.error('Failed to parse audit log changes', e);
    return [];
  }
}

export function getSeverityColor(severity?: string) {
  switch (severity?.toLowerCase()) {
    case 'high':
    case 'critical':
      return '#B91C1C';
    case 'medium':
    case 'warning':
      return '#D97706';
    case 'low':
    case 'info':
      return '#059669';
    default:
      return '#6B7280';
  }
}
