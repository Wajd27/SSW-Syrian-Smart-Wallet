import { DocumentSnapshot, Timestamp } from 'firebase-admin/firestore';

export function tsToIso(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as Timestamp).toDate === 'function') {
    return (v as Timestamp).toDate().toISOString();
  }
  if (typeof v === 'string') return v;
  return undefined;
}

export function docToRow<T extends Record<string, unknown>>(doc: DocumentSnapshot): T {
  const data = doc.data();
  if (!data) {
    return { id: doc.id } as unknown as T;
  }
  const row: Record<string, unknown> = { ...data, id: doc.id };
  if (data.created_date !== undefined) row.created_date = tsToIso(data.created_date) ?? data.created_date;
  if (data.updated_date !== undefined) row.updated_date = tsToIso(data.updated_date) ?? data.updated_date;
  if (data.created_date === undefined && data.created_at !== undefined) {
    row.created_date = tsToIso(data.created_at) ?? data.created_at;
  }
  if (data.updated_date === undefined && data.updated_at !== undefined) {
    row.updated_date = tsToIso(data.updated_at) ?? data.updated_at;
  }
  return row as T;
}

export function nowTimestamp(): Timestamp {
  return Timestamp.now();
}
