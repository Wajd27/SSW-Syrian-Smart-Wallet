import { readFileSync } from 'fs';
import { resolve } from 'path';
import admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let firestore: Firestore | null = null;

type ServiceAccountJson = admin.ServiceAccount & { project_id?: string };

/** Strips common .env mistakes: extra quotes, or wrapping like {"C:\\...\\file.json"} */
function normalizeCredentialPath(raw: string): string {
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  if (s.startsWith('{') && s.endsWith('}')) {
    s = s.slice(1, -1).trim();
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

function resolveProjectId(parsed: ServiceAccountJson | null, fromEnv: string | undefined): string {
  const expected = fromEnv?.trim();
  const fromKey = parsed?.project_id?.trim();
  if (parsed && fromKey) {
    if (expected && expected !== fromKey) {
      throw new Error(
        `FIREBASE_PROJECT_ID (${expected}) does not match project_id in the service account (${fromKey}). ` +
          'Use a key from Firebase Console → Project settings → Service accounts for the same project as FIREBASE_PROJECT_ID.'
      );
    }
    return fromKey;
  }
  if (expected) {
    return expected;
  }
  if (parsed) {
    throw new Error('Service account JSON must include a project_id field.');
  }
  const fallback =
    process.env.GOOGLE_CLOUD_PROJECT?.trim() || process.env.GCLOUD_PROJECT?.trim();
  if (!fallback) {
    throw new Error(
      'Set FIREBASE_SERVICE_ACCOUNT_JSON (recommended) or FIREBASE_PROJECT_ID with Application Default Credentials (GOOGLE_CLOUD_PROJECT).'
    );
  }
  return fallback;
}

export function initFirebase(): void {
  if (admin.apps.length > 0) {
    firestore = getFirestore();
    return;
  }

  const expectedProjectId = process.env.FIREBASE_PROJECT_ID;
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const hasAdcFile = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim());
  let parsed: ServiceAccountJson | null = null;

  if (jsonRaw) {
    try {
      parsed = JSON.parse(jsonRaw) as ServiceAccountJson;
    } catch {
      if (hasAdcFile) {
        console.warn(
          'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON; using GOOGLE_APPLICATION_CREDENTIALS instead. Remove or fix FIREBASE_SERVICE_ACCOUNT_JSON in .env.'
        );
      }
    }
  }

  const pathFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!parsed && pathFromEnv) {
    const absolutePath = normalizeCredentialPath(pathFromEnv);
    try {
      const fileRaw = readFileSync(resolve(absolutePath), 'utf-8');
      parsed = JSON.parse(fileRaw) as ServiceAccountJson;
    } catch (e: any) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_PATH (${absolutePath}): ${e?.message || e}. Use a plain path, e.g. FIREBASE_SERVICE_ACCOUNT_PATH=C:/Users/You/Downloads/key.json`
      );
    }
  }

  if (!parsed && jsonRaw && !hasAdcFile) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON on one line. Easier: remove that line and set FIREBASE_SERVICE_ACCOUNT_PATH=C:\\\\path\\\\to\\\\serviceAccount.json (or GOOGLE_APPLICATION_CREDENTIALS to the same file).'
    );
  }

  const projectId = resolveProjectId(parsed, expectedProjectId);
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() || `${projectId}.appspot.com`;

  if (parsed) {
    admin.initializeApp({
      credential: admin.credential.cert(parsed),
      projectId,
      storageBucket,
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
      storageBucket,
    });
  }

  firestore = getFirestore();
  firestore.settings({ ignoreUndefinedProperties: true });
}

export function getFirestoreDb(): Firestore {
  if (!firestore) {
    initFirebase();
  }
  return firestore!;
}

export { admin };
