import express from 'express';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getFirestoreDb } from '../db/firebase.js';
import { tsToIso } from '../utils/firestore-serializers.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const USERS = 'users';

function userPublicFields(data: Record<string, unknown>, id: string) {
  return {
    id,
    email: data.email,
    full_name: data.full_name,
    role: data.role ?? 'user',
    last_exchange_rate: data.last_exchange_rate,
    default_currency: data.default_currency ?? 'SYP',
    notification_settings: data.notification_settings ?? {},
    created_date: tsToIso(data.created_date) ?? data.created_date,
    updated_date: tsToIso(data.updated_date) ?? data.updated_date,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const db = getFirestoreDb();
    const emailNorm = String(email).toLowerCase().trim();

    const existing = await db.collection(USERS).where('email', '==', emailNorm).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await hashPassword(password);
    const now = Timestamp.now();
    const docRef = db.collection(USERS).doc();
    await docRef.set({
      email: emailNorm,
      password_hash: passwordHash,
      full_name,
      role: 'user',
      default_currency: 'SYP',
      notification_settings: {},
      created_date: now,
      updated_date: now,
    });

    const snap = await docRef.get();
    const data = snap.data()!;
    const token = generateToken({
      email: emailNorm,
      id: docRef.id,
      full_name: data.full_name as string,
    });

    res.status(201).json({
      user: userPublicFields(data, docRef.id),
      token,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      error: error.message || 'Registration failed',
      code: error.code || 'UNKNOWN_ERROR',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getFirestoreDb();
    const emailNorm = String(email).toLowerCase().trim();

    const q = await db.collection(USERS).where('email', '==', emailNorm).limit(1).get();
    if (q.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const doc = q.docs[0];
    const data = doc.data();
    const isValid = await comparePassword(password, data.password_hash as string);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      email: emailNorm,
      id: doc.id,
      full_name: data.full_name as string,
    });

    res.json({
      user: userPublicFields(data, doc.id),
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const db = getFirestoreDb();
    const doc = await db.collection(USERS).doc(req.user!.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const data = doc.data()!;
    res.json(userPublicFields(data, doc.id));
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

router.patch('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const allowedFields = ['full_name', 'default_currency', 'notification_settings', 'last_exchange_rate'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const db = getFirestoreDb();
    const ref = db.collection(USERS).doc(req.user!.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await ref.update({
      ...updates,
      updated_date: FieldValue.serverTimestamp(),
    });

    const after = await ref.get();
    const data = after.data()!;
    res.json(userPublicFields(data, after.id));
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

router.post('/logout', authenticateToken, (req: AuthRequest, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
