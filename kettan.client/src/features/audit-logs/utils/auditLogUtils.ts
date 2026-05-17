
export interface AuditLogEntry {
  id: number;
  action: string;       // Created, Updated, Deleted
  entityName: string;
  entityId: string | null;
  actorName: string;
  actorRole: string;
  occurredAt: string;
  oldValues?: string;   // JSON
  newValues?: string;   // JSON
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

const IGNORED_FIELDS = ['tenantId', 'branchId', 'id', 'updatedAt', 'createdAt', 'deletedAt', 'isDeleted', 'password', 'token'];

/**
 * Humanize an entity class name: "SupplyRequest" → "Supply Request"
 */
function humanizeEntity(name: string): string {
  return name.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Humanize a field name: "FirstName" or "first_name" → "First Name"
 */
function humanizeField(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}

/**
 * Format a value for display. Handles nulls, booleans, numbers, and enums.
 */
function formatValue(val: any): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return String(val);
  const str = String(val);
  // Try to humanize enum-style values like "InTransit" → "In Transit"
  if (/^[A-Z][a-zA-Z]+$/.test(str) && str.length > 2) {
    return str.replace(/([A-Z])/g, ' $1').trim();
  }
  return str;
}

/**
 * Parse OldValues/NewValues JSON into a list of human-readable field changes.
 */
export function parseChanges(oldValuesJson: string | null | undefined, newValuesJson: string | null | undefined): FieldChange[] {
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
          field: humanizeField(key),
          oldValue: oldVal,
          newValue: newVal
        });
      }
    }

    return changes;
  } catch {
    return [];
  }
}

/**
 * Build a single, human-readable event description for an audit log row.
 * 
 * Examples:
 * - Created Branch — Name: "Kettan Cafe - BGC"
 * - Updated User #1 — Name: "John" → "Johnny", Email: "old@x.com" → "new@x.com"
 * - Deleted Supply Request #45
 */
export function buildEventDescription(row: AuditLogEntry): string {
  const entity = humanizeEntity(row.entityName);
  const idSuffix = row.entityId ? ` #${row.entityId}` : '';
  const verb = row.action; // Already "Created", "Updated", "Deleted"

  if (row.action === 'Created') {
    // Show key identifying fields for new records
    const newFields = parseNewValues(row.newValues);
    if (newFields) {
      return `${verb} ${entity}${idSuffix} — ${newFields}`;
    }
    return `${verb} ${entity}${idSuffix}`;
  }

  if (row.action === 'Updated') {
    const changes = parseChanges(row.oldValues, row.newValues);
    if (changes.length > 0) {
      const summary = changes.slice(0, 4).map(c => 
        `${c.field}: "${formatValue(c.oldValue)}" → "${formatValue(c.newValue)}"`
      ).join(', ');
      const more = changes.length > 4 ? ` (+${changes.length - 4} more)` : '';
      return `${verb} ${entity}${idSuffix} — ${summary}${more}`;
    }
    return `${verb} ${entity}${idSuffix}`;
  }

  if (row.action === 'Deleted') {
    return `${verb} ${entity}${idSuffix}`;
  }

  return `${verb} ${entity}${idSuffix}`;
}

/**
 * Parse NewValues JSON for Created actions to show key fields.
 */
function parseNewValues(newValuesJson: string | null | undefined): string | null {
  if (!newValuesJson) return null;
  try {
    const data = JSON.parse(newValuesJson);
    const entries = Object.entries(data)
      .filter(([key]) => !IGNORED_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase())))
      .slice(0, 4);
    if (entries.length === 0) return null;
    return entries.map(([key, val]) => `${humanizeField(key)}: "${formatValue(val)}"`).join(', ');
  } catch {
    return null;
  }
}
