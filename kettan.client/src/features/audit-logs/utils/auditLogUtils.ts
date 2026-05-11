
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

const ACTION_VERBS: Record<string, string> = {
  'GET': 'Viewed',
  'POST': 'Created',
  'PUT': 'Updated',
  'PATCH': 'Modified',
  'DELETE': 'Removed',
};

export function humanizeRoute(route: string, method: string): string {
  const [path] = route.split('?');
  const parts = path.split('/').filter(Boolean);
  
  if (parts[0] === 'api') {
    const resource = parts[1];
    const id = parts[2];
    const subResource = parts[3];
    
    let friendlyResource = ROUTE_MAP[`/api/${resource}`] || resource;
    const verb = ACTION_VERBS[method] || 'Accessed';
    
    if (subResource) {
      const friendlySub = subResource.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
      return `${verb} ${friendlySub} for ${friendlyResource.replace(/s$/, '')} #${id}`;
    }
    
    if (id && (!isNaN(Number(id)) || id.length > 20)) {
      return `${verb} ${friendlyResource.replace(/s$/, '')} Details`;
    }

    return `${verb} ${friendlyResource}`;
  }
  
  return `${ACTION_VERBS[method] || 'Accessed'} ${route}`;
}

export function humanizeRequestDetails(row: AuditLogEntry): string {
  if (!row.route) return '';

  const [path, queryString] = row.route.split('?');
  let details = '';

  if (queryString) {
    const params = new URLSearchParams(queryString);
    const pairs: string[] = [];
    params.forEach((value, key) => {
      if (key !== 'tenantId' && key !== 'branchId') { // Hide internal IDs
        pairs.push(`${key}: ${value}`);
      }
    });
    if (pairs.length > 0) {
      details = `Parameters: ${pairs.join(', ')}`;
    }
  }

  // Add latency if present in metadata
  if (row.metadataJson) {
    try {
      const meta = JSON.parse(row.metadataJson);
      if (meta.LatencyMs) {
        details += details ? ` • Response Time: ${meta.LatencyMs}ms` : `Response Time: ${meta.LatencyMs}ms`;
      }
    } catch (e) {}
  }

  if (!details) {
    return `Accessed system resource via ${row.httpMethod} endpoint`;
  }

  return details;
}

export function humanizeEntityAction(action: string, entity: string, id: string | null): string {
  const entityFriendly = entity.replace(/([A-Z])/g, ' $1').trim();
  const idSuffix = id ? ` (#${id})` : '';

  switch (action.toLowerCase()) {
    case 'created':
      return `Registered new ${entityFriendly}${idSuffix}`;
    case 'updated':
      return `Modified ${entityFriendly}${idSuffix}`;
    case 'deleted':
      return `Removed ${entityFriendly}${idSuffix}`;
    case 'archived':
      return `Archived ${entityFriendly}${idSuffix}`;
    default:
      return `${action} ${entityFriendly}${idSuffix}`;
  }
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export function parseChanges(oldValuesJson: string | null, newValuesJson: string | null): FieldChange[] {
  try {
    const oldValues = oldValuesJson ? JSON.parse(oldValuesJson) : {};
    const newValues = newValuesJson ? JSON.parse(newValuesJson) : {};
    
    const changes: FieldChange[] = [];
    
    // For "Updated" events, we have both old and new
    if (oldValuesJson && newValuesJson) {
      for (const key of Object.keys(newValues)) {
        if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
          changes.push({
            field: key.replace(/([A-Z])/g, ' $1').trim(),
            oldValue: oldValues[key],
            newValue: newValues[key]
          });
        }
      }
    } 
    // For "Created" events, we might only have new values
    else if (newValuesJson) {
      for (const key of Object.keys(newValues)) {
        changes.push({
          field: key.replace(/([A-Z])/g, ' $1').trim(),
          oldValue: null,
          newValue: newValues[key]
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
