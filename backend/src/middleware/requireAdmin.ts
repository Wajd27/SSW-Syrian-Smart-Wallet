import { Response, NextFunction } from 'express';
import { getFirestoreDb } from '../db/firebase.js';
import type { AuthRequest } from './auth.js';

const USERS = 'users';

/** Requires Firestore `users/{id}.role === 'admin'`. */
export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const db = getFirestoreDb();
    const doc = await db.collection(USERS).doc(req.user!.id).get();
    if (!doc.exists) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const role = doc.data()!.role ?? 'user';
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  } catch (e) {
    console.error('requireAdmin:', e);
    res.status(500).json({ error: 'Authorization check failed' });
  }
}
