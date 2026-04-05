/**
 * One-time bootstrap: verifies Firestore is enabled and writable.
 * Run from backend/: npm run db:prepare
 */
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { FieldValue } from 'firebase-admin/firestore';
import { initFirebase, getFirestoreDb } from '../src/db/firebase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  initFirebase();
  const db = getFirestoreDb();
  await db.collection('system').doc('bootstrap').set({
    app: 'wallet-management-api',
    createdAt: FieldValue.serverTimestamp(),
    note: 'Safe to delete. Confirms Firestore API and credentials work.',
  });
  console.log('Firestore is ready: wrote document system/bootstrap');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
