import express from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreDb } from '../db/firebase.js';
import { docToRow } from '../utils/firestore-serializers.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

const COL = {
  wallets: 'wallets',
  transactions: 'transactions',
  recurring: 'recurring_transactions',
  budgets: 'budgets',
  savings: 'savings_goals',
  investments: 'investments',
  debts: 'debts',
  family: 'family_members',
  exchange: 'exchange_rates',
  notifications: 'notifications',
  ai: 'ai_recommendations',
} as const;

async function updateOwnedDoc(
  collection: string,
  id: string,
  body: Record<string, unknown>,
  allowedFields: string[],
  ownerField: string,
  ownerValue: string
): Promise<Record<string, unknown> | null | 'no_fields'> {
  const db = getFirestoreDb();
  const ref = db.collection(collection).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (data[ownerField] !== ownerValue) return null;

  const patch: Record<string, unknown> = { updated_date: Timestamp.now() };
  for (const f of allowedFields) {
    if (body[f] !== undefined) patch[f] = body[f];
  }
  const keys = Object.keys(patch).filter((k) => k !== 'updated_date');
  if (keys.length === 0) return 'no_fields';
  await ref.update(patch);
  const after = await ref.get();
  return docToRow(after);
}

async function walletOwned(db: Firestore, walletId: string, ownerEmail: string) {
  const w = await db.collection(COL.wallets).doc(walletId).get();
  if (!w.exists) return null;
  const d = w.data()!;
  if (d.owner_email !== ownerEmail) return null;
  return w;
}

// --- Wallets ---
router.get('/wallet', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const email = req.user!.email;
  const snap = await db.collection(COL.wallets).where('owner_email', '==', email).get();
  let rows = snap.docs.map((d) => docToRow(d)) as Record<string, unknown>[];
  if (req.query.is_active !== undefined) {
    const want = req.query.is_active === 'true';
    rows = rows.filter((r) => r.is_active === want);
  }
  if (req.query.currency) {
    rows = rows.filter((r) => r.currency === req.query.currency);
  }
  res.json(rows);
});

router.get('/wallet/:id', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const doc = await db.collection(COL.wallets).doc(req.params.id).get();
  if (!doc.exists || doc.data()!.owner_email !== req.user!.email) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  res.json(docToRow(doc));
});

router.post('/wallet', async (req: AuthRequest, res) => {
  const { name, type, currency, initial_balance, is_active } = req.body;
  const db = getFirestoreDb();
  const now = Timestamp.now();
  const ref = db.collection(COL.wallets).doc();
  await ref.set({
    name,
    type,
    currency,
    initial_balance,
    owner_email: req.user!.email,
    is_active: is_active ?? true,
    created_date: now,
    updated_date: now,
  });
  const snap = await ref.get();
  res.status(201).json(docToRow(snap));
});

router.patch('/wallet/:id', async (req: AuthRequest, res) => {
  const allowed = ['name', 'type', 'currency', 'initial_balance', 'is_active'];
  const updated = await updateOwnedDoc(COL.wallets, req.params.id, req.body, allowed, 'owner_email', req.user!.email);
  if (updated === 'no_fields') return res.status(400).json({ error: 'No valid fields to update' });
  if (!updated) return res.status(404).json({ error: 'Wallet not found' });
  res.json(updated);
});

router.delete('/wallet/:id', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const ref = db.collection(COL.wallets).doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.owner_email !== req.user!.email) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  await ref.delete();
  res.json({ message: 'Wallet deleted successfully' });
});

function filterTx(rows: any[], q: express.Request) {
  let out = rows;
  if (q.query.wallet_id) out = out.filter((r) => r.wallet_id === q.query.wallet_id);
  if (q.query.type) out = out.filter((r) => r.type === q.query.type);
  if (q.query.category) out = out.filter((r) => r.category === q.query.category);
  const start = q.query.start_date;
  if (start) out = out.filter((r) => r.transaction_date >= String(start));
  const end = q.query.end_date;
  if (end) out = out.filter((r) => r.transaction_date <= String(end));
  return out;
}

router.get('/transaction', async (req: AuthRequest, res) => {
  try {
    const db = getFirestoreDb();
    const snap = await db.collection(COL.transactions).where('owner_email', '==', req.user!.email).get();
    let rows = snap.docs.map((d) => docToRow(d));
    rows = filterTx(rows as any[], req);
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions', message: error.message });
  }
});

router.get('/transaction/:id', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const doc = await db.collection(COL.transactions).doc(req.params.id).get();
  if (!doc.exists || doc.data()!.owner_email !== req.user!.email) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json(docToRow(doc));
});

router.post('/transaction', async (req: AuthRequest, res) => {
  const data = req.body;
  const db = getFirestoreDb();
  const w = await walletOwned(db, data.wallet_id, req.user!.email);
  if (!w) return res.status(403).json({ error: 'Wallet not found or access denied' });

  const now = Timestamp.now();
  const ref = db.collection(COL.transactions).doc();
  await ref.set({
    wallet_id: data.wallet_id,
    title: data.title,
    amount_syp: data.amount_syp,
    amount_usd: data.amount_usd,
    exchange_rate: data.exchange_rate,
    primary_currency: data.primary_currency,
    type: data.type,
    category: data.category || null,
    family_member_id: data.family_member_id || null,
    transaction_date: data.transaction_date,
    notes: data.notes || null,
    receipt_uri: data.receipt_uri || null,
    owner_email: req.user!.email,
    created_date: now,
    updated_date: now,
  });
  res.status(201).json(docToRow(await ref.get()));
});

router.patch('/transaction/:id', async (req: AuthRequest, res) => {
  try {
    const allowed = [
      'title', 'amount_syp', 'amount_usd', 'exchange_rate', 'primary_currency', 'type', 'category',
      'family_member_id', 'transaction_date', 'notes', 'receipt_uri',
    ];
    const db = getFirestoreDb();
    const ref = db.collection(COL.transactions).doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()!.owner_email !== req.user!.email) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const patch: Record<string, unknown> = { updated_date: Timestamp.now() };
    for (const f of allowed) {
      if (req.body[f] !== undefined) patch[f] = req.body[f];
    }
    if (Object.keys(patch).length === 1) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    await ref.update(patch);
    res.json(docToRow(await ref.get()));
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction', message: error.message });
  }
});

router.delete('/transaction/:id', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const ref = db.collection(COL.transactions).doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.owner_email !== req.user!.email) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  await ref.delete();
  res.json({ message: 'Transaction deleted successfully' });
});

// --- Recurring ---
router.get('/recurring-transaction', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const snap = await db.collection(COL.recurring).where('wallet_owner', '==', req.user!.email).get();
  let rows = snap.docs.map((d) => docToRow(d)) as Record<string, unknown>[];
  if (req.query.is_active !== undefined) {
    const want = req.query.is_active === 'true';
    rows = rows.filter((r) => r.is_active === want);
  }
  res.json(rows);
});

router.post('/recurring-transaction', async (req: AuthRequest, res) => {
  const data = { ...req.body, wallet_owner: req.user!.email };
  const db = getFirestoreDb();
  const now = Timestamp.now();
  const ref = db.collection(COL.recurring).doc();
  await ref.set({
    wallet_id: data.wallet_id,
    title: data.title,
    amount_syp: data.amount_syp,
    amount_usd: data.amount_usd,
    exchange_rate: data.exchange_rate,
    primary_currency: data.primary_currency,
    type: data.type,
    category: data.category || null,
    frequency: data.frequency,
    next_occurrence: data.next_occurrence,
    is_active: data.is_active ?? true,
    family_member_id: data.family_member_id || null,
    wallet_owner: data.wallet_owner,
    created_date: now,
    updated_date: now,
  });
  res.status(201).json(docToRow(await ref.get()));
});

router.patch('/recurring-transaction/:id', async (req: AuthRequest, res) => {
  const allowed = [
    'title', 'amount_syp', 'amount_usd', 'exchange_rate', 'primary_currency', 'type', 'category',
    'frequency', 'next_occurrence', 'is_active', 'family_member_id',
  ];
  const updated = await updateOwnedDoc(COL.recurring, req.params.id, req.body, allowed, 'wallet_owner', req.user!.email);
  if (updated === 'no_fields') return res.status(400).json({ error: 'No valid fields to update' });
  if (!updated) return res.status(404).json({ error: 'Recurring transaction not found' });
  res.json(updated);
});

router.delete('/recurring-transaction/:id', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const ref = db.collection(COL.recurring).doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.wallet_owner !== req.user!.email) {
    return res.status(404).json({ error: 'Recurring transaction not found' });
  }
  await ref.delete();
  res.json({ message: 'Recurring transaction deleted successfully' });
});

// --- Budgets ---
router.get('/budget', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const snap = await db.collection(COL.budgets).where('owner_email', '==', req.user!.email).get();
  let rows = snap.docs.map((d) => docToRow(d)) as any[];
  if (req.query.month) rows = rows.filter((r) => r.month === req.query.month);
  if (req.query.category) rows = rows.filter((r) => r.category === req.query.category);
  res.json(rows);
});

router.post('/budget', async (req: AuthRequest, res) => {
  const data = req.body;
  const db = getFirestoreDb();
  const w = await walletOwned(db, data.wallet_id, req.user!.email);
  if (!w) return res.status(403).json({ error: 'Wallet not found or access denied' });

  const now = Timestamp.now();
  const ref = db.collection(COL.budgets).doc();
  await ref.set({
    wallet_id: data.wallet_id,
    category: data.category,
    amount: data.amount,
    month: data.month,
    family_member_id: data.family_member_id || null,
    owner_email: req.user!.email,
    created_date: now,
    updated_date: now,
  });
  res.status(201).json(docToRow(await ref.get()));
});

router.patch('/budget/:id', async (req: AuthRequest, res) => {
  try {
    const allowed = ['category', 'amount', 'month', 'family_member_id'];
    const db = getFirestoreDb();
    const ref = db.collection(COL.budgets).doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()!.owner_email !== req.user!.email) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    const patch: Record<string, unknown> = { updated_date: Timestamp.now() };
    for (const f of allowed) {
      if (req.body[f] !== undefined) patch[f] = req.body[f];
    }
    if (Object.keys(patch).length === 1) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    await ref.update(patch);
    res.json(docToRow(await ref.get()));
  } catch (error: any) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget', message: error.message });
  }
});

router.delete('/budget/:id', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const ref = db.collection(COL.budgets).doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.owner_email !== req.user!.email) {
    return res.status(404).json({ error: 'Budget not found' });
  }
  await ref.delete();
  res.json({ message: 'Budget deleted successfully' });
});

// --- Savings goals ---
router.get('/savings-goal', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const snap = await db.collection(COL.savings).where('owner_email', '==', req.user!.email).get();
  let rows = snap.docs.map((d) => docToRow(d)) as Record<string, unknown>[];
  if (req.query.is_active !== undefined) {
    const want = req.query.is_active === 'true';
    rows = rows.filter((r) => r.is_active === want);
  }
  res.json(rows);
});

router.post('/savings-goal', async (req: AuthRequest, res) => {
  const data = req.body;
  const db = getFirestoreDb();
  const w = await walletOwned(db, data.wallet_id, req.user!.email);
  if (!w) return res.status(403).json({ error: 'Wallet not found or access denied' });

  const now = Timestamp.now();
  const ref = db.collection(COL.savings).doc();
  await ref.set({
    wallet_id: data.wallet_id,
    title: data.title,
    target_amount: data.target_amount,
    current_amount: data.current_amount || 0,
    target_date: data.target_date,
    description: data.description || null,
    category: data.category || null,
    is_active: data.is_active ?? true,
    owner_email: req.user!.email,
    created_date: now,
    updated_date: now,
  });
  res.status(201).json(docToRow(await ref.get()));
});

router.patch('/savings-goal/:id', async (req: AuthRequest, res) => {
  try {
    const allowed = ['title', 'target_amount', 'current_amount', 'target_date', 'description', 'category', 'is_active'];
    const db = getFirestoreDb();
    const ref = db.collection(COL.savings).doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()!.owner_email !== req.user!.email) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }
    const patch: Record<string, unknown> = { updated_date: Timestamp.now() };
    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        patch[f] = req.body[f] === null ? null : req.body[f];
      }
    }
    if (Object.keys(patch).length === 1) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    await ref.update(patch);
    res.json(docToRow(await ref.get()));
  } catch (error: any) {
    console.error('Error updating savings goal:', error);
    res.status(500).json({ error: 'Failed to update savings goal', message: error.message });
  }
});

router.delete('/savings-goal/:id', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const ref = db.collection(COL.savings).doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.owner_email !== req.user!.email) {
    return res.status(404).json({ error: 'Savings goal not found' });
  }
  await ref.delete();
  res.json({ message: 'Savings goal deleted successfully' });
});

// --- Investments ---
router.get('/investment', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const snap = await db.collection(COL.investments).where('wallet_owner', '==', req.user!.email).get();
  let rows = snap.docs.map((d) => docToRow(d)) as Record<string, unknown>[];
  if (req.query.is_active !== undefined) {
    const want = req.query.is_active === 'true';
    rows = rows.filter((r) => r.is_active === want);
  }
  if (req.query.savings_goal_id) {
    rows = rows.filter((r) => r.savings_goal_id === req.query.savings_goal_id);
  }
  res.json(rows);
});

router.post('/investment', async (req: AuthRequest, res) => {
  const data = { ...req.body, wallet_owner: req.user!.email };
  const db = getFirestoreDb();
  const now = Timestamp.now();
  const ref = db.collection(COL.investments).doc();
  await ref.set({
    wallet_owner: data.wallet_owner,
    savings_goal_id: data.savings_goal_id || null,
    name: data.name,
    type: data.type,
    initial_amount: data.initial_amount,
    current_value: data.current_value,
    currency: data.currency,
    purchase_date: data.purchase_date,
    risk_level: data.risk_level || null,
    expected_return: data.expected_return || null,
    notes: data.notes || null,
    is_active: data.is_active ?? true,
    history: data.history || [],
    created_date: now,
    updated_date: now,
  });
  res.status(201).json(docToRow(await ref.get()));
});

router.patch('/investment/:id', async (req: AuthRequest, res) => {
  const allowed = [
    'name', 'type', 'initial_amount', 'current_value', 'currency', 'purchase_date', 'risk_level',
    'expected_return', 'notes', 'is_active', 'savings_goal_id', 'history',
  ];
  const updated = await updateOwnedDoc(COL.investments, req.params.id, req.body, allowed, 'wallet_owner', req.user!.email);
  if (updated === 'no_fields') return res.status(400).json({ error: 'No valid fields to update' });
  if (!updated) return res.status(404).json({ error: 'Investment not found' });
  res.json(updated);
});

router.delete('/investment/:id', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const ref = db.collection(COL.investments).doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.wallet_owner !== req.user!.email) {
    return res.status(404).json({ error: 'Investment not found' });
  }
  await ref.delete();
  res.json({ message: 'Investment deleted successfully' });
});

// --- Debts ---
router.get('/debt', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const snap = await db.collection(COL.debts).where('wallet_owner', '==', req.user!.email).get();
  let rows = snap.docs.map((d) => docToRow(d)) as Record<string, unknown>[];
  if (req.query.is_active !== undefined) {
    const want = req.query.is_active === 'true';
    rows = rows.filter((r) => r.is_active === want);
  }
  res.json(rows);
});

router.post('/debt', async (req: AuthRequest, res) => {
  const data = { ...req.body, wallet_owner: req.user!.email };
  const db = getFirestoreDb();
  const now = Timestamp.now();
  const ref = db.collection(COL.debts).doc();
  await ref.set({
    wallet_owner: data.wallet_owner,
    name: data.name,
    type: data.type,
    original_amount: data.original_amount,
    current_balance: data.current_balance,
    minimum_payment: data.minimum_payment,
    interest_rate: data.interest_rate || 0,
    due_date: data.due_date || null,
    creditor: data.creditor || null,
    currency: data.currency || 'SYP',
    is_active: data.is_active ?? true,
    created_date: now,
    updated_date: now,
  });
  res.status(201).json(docToRow(await ref.get()));
});

router.patch('/debt/:id', async (req: AuthRequest, res) => {
  const allowed = [
    'name', 'type', 'original_amount', 'current_balance', 'minimum_payment', 'interest_rate',
    'due_date', 'creditor', 'currency', 'is_active',
  ];
  const updated = await updateOwnedDoc(COL.debts, req.params.id, req.body, allowed, 'wallet_owner', req.user!.email);
  if (updated === 'no_fields') return res.status(400).json({ error: 'No valid fields to update' });
  if (!updated) return res.status(404).json({ error: 'Debt not found' });
  res.json(updated);
});

router.delete('/debt/:id', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const ref = db.collection(COL.debts).doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.wallet_owner !== req.user!.email) {
    return res.status(404).json({ error: 'Debt not found' });
  }
  await ref.delete();
  res.json({ message: 'Debt deleted successfully' });
});

// --- Family ---
router.get('/family-member', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const snap = await db.collection(COL.family).where('added_by', '==', req.user!.email).get();
  let rows = snap.docs.map((d) => docToRow(d)) as Record<string, unknown>[];
  if (req.query.is_active !== undefined) {
    const want = req.query.is_active === 'true';
    rows = rows.filter((r) => r.is_active === want);
  }
  res.json(rows);
});

router.post('/family-member', async (req: AuthRequest, res) => {
  const data = { ...req.body, added_by: req.user!.email };
  const db = getFirestoreDb();
  const now = Timestamp.now();
  const ref = db.collection(COL.family).doc();
  await ref.set({
    name: data.name,
    relationship: data.relationship || null,
    date_of_birth: data.date_of_birth || null,
    spending_limit: data.spending_limit || null,
    spending_limit_currency: data.spending_limit_currency || 'SYP',
    is_active: data.is_active ?? true,
    added_by: data.added_by,
    created_date: now,
    updated_date: now,
  });
  res.status(201).json(docToRow(await ref.get()));
});

router.patch('/family-member/:id', async (req: AuthRequest, res) => {
  const allowed = ['name', 'relationship', 'date_of_birth', 'spending_limit', 'spending_limit_currency', 'is_active'];
  const updated = await updateOwnedDoc(COL.family, req.params.id, req.body, allowed, 'added_by', req.user!.email);
  if (updated === 'no_fields') return res.status(400).json({ error: 'No valid fields to update' });
  if (!updated) return res.status(404).json({ error: 'Family member not found' });
  res.json(updated);
});

router.delete('/family-member/:id', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const ref = db.collection(COL.family).doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.added_by !== req.user!.email) {
    return res.status(404).json({ error: 'Family member not found' });
  }
  await ref.delete();
  res.json({ message: 'Family member deleted successfully' });
});

// --- Exchange rates (global) ---
router.get('/exchange-rate', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  let q = db.collection(COL.exchange).orderBy('date', 'desc');
  if (limit && !Number.isNaN(limit)) {
    q = q.limit(limit);
  }
  const snap = await q.get();
  res.json(snap.docs.map((d) => docToRow(d)));
});

router.post('/exchange-rate', async (req: AuthRequest, res) => {
  const data = req.body;
  const db = getFirestoreDb();
  const now = Timestamp.now();
  const ref = db.collection(COL.exchange).doc();
  await ref.set({
    rate: data.rate,
    source: data.source,
    date: data.date,
    created_date: now,
    updated_date: now,
  });
  res.status(201).json(docToRow(await ref.get()));
});

// --- Notifications ---
router.get('/notification', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const snap = await db.collection(COL.notifications).where('wallet_owner', '==', req.user!.email).get();
  let rows = snap.docs.map((d) => docToRow(d)) as Record<string, unknown>[];
  if (req.query.is_read !== undefined) {
    const want = req.query.is_read === 'true';
    rows = rows.filter((r) => r.is_read === want);
  }
  if (req.query.type) {
    rows = rows.filter((r) => r.type === req.query.type);
  }
  rows.sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));
  res.json(rows);
});

router.post('/notification', async (req: AuthRequest, res) => {
  const data = { ...req.body, wallet_owner: req.user!.email };
  const db = getFirestoreDb();
  const now = Timestamp.now();
  const ref = db.collection(COL.notifications).doc();
  await ref.set({
    title: data.title,
    message: data.message,
    type: data.type,
    is_read: data.is_read ?? false,
    action_url: data.action_url || null,
    wallet_owner: data.wallet_owner,
    created_date: now,
    updated_date: now,
  });
  res.status(201).json(docToRow(await ref.get()));
});

router.patch('/notification/:id', async (req: AuthRequest, res) => {
  const allowed = ['title', 'message', 'type', 'is_read', 'action_url'];
  const updated = await updateOwnedDoc(COL.notifications, req.params.id, req.body, allowed, 'wallet_owner', req.user!.email);
  if (updated === 'no_fields') return res.status(400).json({ error: 'No valid fields to update' });
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  res.json(updated);
});

// --- AI recommendations ---
router.get('/ai-recommendation', async (req: AuthRequest, res) => {
  const db = getFirestoreDb();
  const snap = await db.collection(COL.ai).where('wallet_owner', '==', req.user!.email).get();
  let rows = snap.docs.map((d) => docToRow(d)) as any[];
  rows.sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
  res.json(rows);
});

router.post('/ai-recommendation', async (req: AuthRequest, res) => {
  const data = { ...req.body, wallet_owner: req.user!.email };
  const db = getFirestoreDb();
  const now = Timestamp.now();
  const ref = db.collection(COL.ai).doc();
  await ref.set({
    wallet_owner: data.wallet_owner,
    type: data.type,
    title: data.title,
    description: data.description,
    impact: data.impact,
    effort: data.effort,
    estimated_savings: data.estimated_savings || null,
    target_id: data.target_id || null,
    is_implemented: data.is_implemented ?? false,
    created_date: now,
    updated_date: now,
  });
  res.status(201).json(docToRow(await ref.get()));
});

router.patch('/ai-recommendation/:id', async (req: AuthRequest, res) => {
  const allowed = [
    'type', 'title', 'description', 'impact', 'effort', 'estimated_savings', 'target_id', 'is_implemented',
  ];
  const updated = await updateOwnedDoc(COL.ai, req.params.id, req.body, allowed, 'wallet_owner', req.user!.email);
  if (updated === 'no_fields') return res.status(400).json({ error: 'No valid fields to update' });
  if (!updated) return res.status(404).json({ error: 'AI recommendation not found' });
  res.json(updated);
});

export default router;
