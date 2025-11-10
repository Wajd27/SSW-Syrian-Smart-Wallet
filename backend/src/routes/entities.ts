import express from 'express';
import { sql } from '../db/connection.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { updateEntity } from '../utils/sql-helpers.js';

const router = express.Router();

// Apply authentication to all entity routes
router.use(authenticateToken);

// Helper function to get pg Pool for dynamic queries
async function getPool() {
  const { Pool } = await import('pg');
  return new Pool({
    connectionString: process.env.POSTGRES_URL,
  });
}

// Wallet routes
router.get('/wallet', async (req: AuthRequest, res) => {
  const result = await sql`
    SELECT * FROM wallets
    WHERE owner_email = ${req.user!.email}
    ${req.query.is_active !== undefined ? sql`AND is_active = ${req.query.is_active === 'true'}` : sql``}
    ${req.query.currency ? sql`AND currency = ${req.query.currency as string}` : sql``}
  `;
  res.json(result.rows);
});

router.get('/wallet/:id', async (req: AuthRequest, res) => {
  const result = await sql`
    SELECT * FROM wallets
    WHERE id = ${req.params.id} AND owner_email = ${req.user!.email}
  `;
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  res.json(result.rows[0]);
});

router.post('/wallet', async (req: AuthRequest, res) => {
  const { name, type, currency, initial_balance, is_active } = req.body;
  const result = await sql`
    INSERT INTO wallets (name, type, currency, initial_balance, owner_email, is_active)
    VALUES (${name}, ${type}, ${currency}, ${initial_balance}, ${req.user!.email}, ${is_active ?? true})
    RETURNING *
  `;
  res.status(201).json(result.rows[0]);
});

router.patch('/wallet/:id', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['name', 'type', 'currency', 'initial_balance', 'is_active'];
    const filteredUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await updateEntity('wallets', req.params.id, filteredUpdates, 'owner_email', req.user!.email);
    if (result.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    res.json(result[0]);
  } catch (error: any) {
    console.error('Update wallet error:', error);
    res.status(500).json({ error: error.message || 'Failed to update wallet' });
  }
});

router.delete('/wallet/:id', async (req: AuthRequest, res) => {
  const result = await sql`
    DELETE FROM wallets
    WHERE id = ${req.params.id} AND owner_email = ${req.user!.email}
    RETURNING *
  `;
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  res.json({ message: 'Wallet deleted successfully' });
});

// Transaction routes
router.get('/transaction', async (req: AuthRequest, res) => {
  let query = sql`
    SELECT t.* FROM transactions t
    INNER JOIN wallets w ON t.wallet_id = w.id
    WHERE w.owner_email = ${req.user!.email}
  `;

  if (req.query.wallet_id) {
    query = sql`${query} AND t.wallet_id = ${req.query.wallet_id as string}`;
  }
  if (req.query.type) {
    query = sql`${query} AND t.type = ${req.query.type as string}`;
  }
  if (req.query.category) {
    query = sql`${query} AND t.category = ${req.query.category as string}`;
  }
  if (req.query.start_date) {
    query = sql`${query} AND t.transaction_date >= ${req.query.start_date as string}`;
  }
  if (req.query.end_date) {
    query = sql`${query} AND t.transaction_date <= ${req.query.end_date as string}`;
  }

  const result = await query;
  res.json(result.rows);
});

router.get('/transaction/:id', async (req: AuthRequest, res) => {
  const result = await sql`
    SELECT t.* FROM transactions t
    INNER JOIN wallets w ON t.wallet_id = w.id
    WHERE t.id = ${req.params.id} AND w.owner_email = ${req.user!.email}
  `;
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json(result.rows[0]);
});

router.post('/transaction', async (req: AuthRequest, res) => {
  const data = req.body;
  // Verify wallet ownership
  const walletCheck = await sql`
    SELECT id FROM wallets WHERE id = ${data.wallet_id} AND owner_email = ${req.user!.email}
  `;
  if (walletCheck.rows.length === 0) {
    return res.status(403).json({ error: 'Wallet not found or access denied' });
  }

  const result = await sql`
    INSERT INTO transactions (
      wallet_id, title, amount_syp, amount_usd, exchange_rate, primary_currency,
      type, category, family_member_id, transaction_date, notes, receipt_uri
    )
    VALUES (
      ${data.wallet_id}, ${data.title}, ${data.amount_syp}, ${data.amount_usd},
      ${data.exchange_rate}, ${data.primary_currency}, ${data.type}, ${data.category || null},
      ${data.family_member_id || null}, ${data.transaction_date}, ${data.notes || null},
      ${data.receipt_uri || null}
    )
    RETURNING *
  `;
  res.status(201).json(result.rows[0]);
});

router.patch('/transaction/:id', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['title', 'amount_syp', 'amount_usd', 'exchange_rate', 'primary_currency', 'type', 'category', 'family_member_id', 'transaction_date', 'notes', 'receipt_uri'];
    const filteredUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Build SET clause with parameterized values
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(filteredUpdates)) {
      if (value === null) {
        setParts.push(`${field} = NULL`);
      } else {
        setParts.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    setParts.push(`updated_date = CURRENT_TIMESTAMP`);

    // Add WHERE clause parameters
    values.push(req.params.id);
    values.push(req.user!.email);

    const query = `
      UPDATE transactions
      SET ${setParts.join(', ')}
      WHERE id = $${paramIndex}
      AND wallet_id IN (SELECT id FROM wallets WHERE owner_email = $${paramIndex + 1})
      RETURNING *
    `;

    const pool = await getPool();
    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json(result.rows[0]);
    } finally {
      await pool.end();
    }
  } catch (error: any) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: error.message || 'Failed to update transaction' });
  }
});

router.delete('/transaction/:id', async (req: AuthRequest, res) => {
  const result = await sql`
    DELETE FROM transactions
    WHERE id = ${req.params.id}
    AND wallet_id IN (SELECT id FROM wallets WHERE owner_email = ${req.user!.email})
    RETURNING *
  `;
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json({ message: 'Transaction deleted successfully' });
});

// Add similar routes for other entities...
// For brevity, I'll create a helper function approach for the remaining entities

// Recurring Transaction routes
router.get('/recurring-transaction', async (req: AuthRequest, res) => {
  const result = await sql`
    SELECT * FROM recurring_transactions
    WHERE wallet_owner = ${req.user!.email}
    ${req.query.is_active !== undefined ? sql`AND is_active = ${req.query.is_active === 'true'}` : sql``}
  `;
  res.json(result.rows);
});

router.post('/recurring-transaction', async (req: AuthRequest, res) => {
  const data = { ...req.body, wallet_owner: req.user!.email };
  const result = await sql`
    INSERT INTO recurring_transactions (
      wallet_id, title, amount_syp, amount_usd, exchange_rate, primary_currency,
      type, category, frequency, next_occurrence, is_active, family_member_id, wallet_owner
    )
    VALUES (
      ${data.wallet_id}, ${data.title}, ${data.amount_syp}, ${data.amount_usd},
      ${data.exchange_rate}, ${data.primary_currency}, ${data.type}, ${data.category || null},
      ${data.frequency}, ${data.next_occurrence}, ${data.is_active ?? true},
      ${data.family_member_id || null}, ${data.wallet_owner}
    )
    RETURNING *
  `;
  res.status(201).json(result.rows[0]);
});

router.patch('/recurring-transaction/:id', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['title', 'amount_syp', 'amount_usd', 'exchange_rate', 'primary_currency', 'type', 'category', 'frequency', 'next_occurrence', 'is_active', 'family_member_id'];
    const filteredUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await updateEntity('recurring_transactions', req.params.id, filteredUpdates, 'wallet_owner', req.user!.email);
    if (result.length === 0) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }
    res.json(result[0]);
  } catch (error: any) {
    console.error('Update recurring transaction error:', error);
    res.status(500).json({ error: error.message || 'Failed to update recurring transaction' });
  }
});

router.delete('/recurring-transaction/:id', async (req: AuthRequest, res) => {
  const result = await sql`
    DELETE FROM recurring_transactions
    WHERE id = ${req.params.id} AND wallet_owner = ${req.user!.email}
    RETURNING *
  `;
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Recurring transaction not found' });
  }
  res.json({ message: 'Recurring transaction deleted successfully' });
});

// Budget routes
router.get('/budget', async (req: AuthRequest, res) => {
  let query = sql`
    SELECT b.* FROM budgets b
    INNER JOIN wallets w ON b.wallet_id = w.id
    WHERE w.owner_email = ${req.user!.email}
  `;
  if (req.query.month) {
    query = sql`${query} AND b.month = ${req.query.month as string}`;
  }
  if (req.query.category) {
    query = sql`${query} AND b.category = ${req.query.category as string}`;
  }
  const result = await query;
  res.json(result.rows);
});

router.post('/budget', async (req: AuthRequest, res) => {
  const data = req.body;
  // Verify wallet ownership
  const walletCheck = await sql`
    SELECT id FROM wallets WHERE id = ${data.wallet_id} AND owner_email = ${req.user!.email}
  `;
  if (walletCheck.rows.length === 0) {
    return res.status(403).json({ error: 'Wallet not found or access denied' });
  }

  const result = await sql`
    INSERT INTO budgets (wallet_id, category, amount, month)
    VALUES (${data.wallet_id}, ${data.category}, ${data.amount}, ${data.month})
    RETURNING *
  `;
  res.status(201).json(result.rows[0]);
});

router.patch('/budget/:id', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['category', 'amount', 'month'];
    const filteredUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Build query with subquery for wallet ownership
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(filteredUpdates)) {
      setParts.push(`${field} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    setParts.push(`updated_date = CURRENT_TIMESTAMP`);

    // Add WHERE clause parameters
    values.push(req.params.id);
    values.push(req.user!.email);

    const query = `
      UPDATE budgets
      SET ${setParts.join(', ')}
      WHERE id = $${paramIndex}
      AND wallet_id IN (SELECT id FROM wallets WHERE owner_email = $${paramIndex + 1})
      RETURNING *
    `;

    const pool = await getPool();
    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Budget not found' });
      }
      res.json(result.rows[0]);
    } finally {
      await pool.end();
    }
  } catch (error: any) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: error.message || 'Failed to update budget' });
  }
});

router.delete('/budget/:id', async (req: AuthRequest, res) => {
  const result = await sql`
    DELETE FROM budgets
    WHERE id = ${req.params.id}
    AND wallet_id IN (SELECT id FROM wallets WHERE owner_email = ${req.user!.email})
    RETURNING *
  `;
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Budget not found' });
  }
  res.json({ message: 'Budget deleted successfully' });
});

// Savings Goal routes
router.get('/savings-goal', async (req: AuthRequest, res) => {
  let query = sql`
    SELECT sg.* FROM savings_goals sg
    INNER JOIN wallets w ON sg.wallet_id = w.id
    WHERE w.owner_email = ${req.user!.email}
  `;
  if (req.query.is_active !== undefined) {
    query = sql`${query} AND sg.is_active = ${req.query.is_active === 'true'}`;
  }
  const result = await query;
  res.json(result.rows);
});

router.post('/savings-goal', async (req: AuthRequest, res) => {
  const data = req.body;
  const walletCheck = await sql`
    SELECT id FROM wallets WHERE id = ${data.wallet_id} AND owner_email = ${req.user!.email}
  `;
  if (walletCheck.rows.length === 0) {
    return res.status(403).json({ error: 'Wallet not found or access denied' });
  }

  const result = await sql`
    INSERT INTO savings_goals (
      wallet_id, title, target_amount, current_amount, target_date,
      description, category, is_active
    )
    VALUES (
      ${data.wallet_id}, ${data.title}, ${data.target_amount}, ${data.current_amount || 0},
      ${data.target_date}, ${data.description || null}, ${data.category || null},
      ${data.is_active ?? true}
    )
    RETURNING *
  `;
  res.status(201).json(result.rows[0]);
});

router.patch('/savings-goal/:id', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['title', 'target_amount', 'current_amount', 'target_date', 'description', 'category', 'is_active'];
    const filteredUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(filteredUpdates)) {
      if (value === null) {
        setParts.push(`${field} = NULL`);
      } else {
        setParts.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    setParts.push(`updated_date = CURRENT_TIMESTAMP`);

    // Add WHERE clause parameters
    values.push(req.params.id);
    values.push(req.user!.email);

    const query = `
      UPDATE savings_goals
      SET ${setParts.join(', ')}
      WHERE id = $${paramIndex}
      AND wallet_id IN (SELECT id FROM wallets WHERE owner_email = $${paramIndex + 1})
      RETURNING *
    `;

    const pool = await getPool();
    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Savings goal not found' });
      }
      res.json(result.rows[0]);
    } finally {
      await pool.end();
    }
  } catch (error: any) {
    console.error('Update savings goal error:', error);
    res.status(500).json({ error: error.message || 'Failed to update savings goal' });
  }
});

router.delete('/savings-goal/:id', async (req: AuthRequest, res) => {
  const result = await sql`
    DELETE FROM savings_goals
    WHERE id = ${req.params.id}
    AND wallet_id IN (SELECT id FROM wallets WHERE owner_email = ${req.user!.email})
    RETURNING *
  `;
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Savings goal not found' });
  }
  res.json({ message: 'Savings goal deleted successfully' });
});

// Investment routes
router.get('/investment', async (req: AuthRequest, res) => {
  let query = sql`
    SELECT * FROM investments
    WHERE wallet_owner = ${req.user!.email}
  `;
  if (req.query.is_active !== undefined) {
    query = sql`${query} AND is_active = ${req.query.is_active === 'true'}`;
  }
  if (req.query.savings_goal_id) {
    query = sql`${query} AND savings_goal_id = ${req.query.savings_goal_id as string}`;
  }
  const result = await query;
  res.json(result.rows);
});

router.post('/investment', async (req: AuthRequest, res) => {
  const data = { ...req.body, wallet_owner: req.user!.email };
  const result = await sql`
    INSERT INTO investments (
      wallet_owner, savings_goal_id, name, type, initial_amount, current_value,
      currency, purchase_date, risk_level, expected_return, notes, is_active, history
    )
    VALUES (
      ${data.wallet_owner}, ${data.savings_goal_id || null}, ${data.name}, ${data.type},
      ${data.initial_amount}, ${data.current_value}, ${data.currency}, ${data.purchase_date},
      ${data.risk_level || null}, ${data.expected_return || null}, ${data.notes || null},
      ${data.is_active ?? true}, ${JSON.stringify(data.history || [])}::jsonb
    )
    RETURNING *
  `;
  res.status(201).json(result.rows[0]);
});

router.patch('/investment/:id', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['name', 'type', 'initial_amount', 'current_value', 'currency', 'purchase_date', 'risk_level', 'expected_return', 'notes', 'is_active', 'savings_goal_id', 'history'];
    const filteredUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await updateEntity('investments', req.params.id, filteredUpdates, 'wallet_owner', req.user!.email);
    if (result.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json(result[0]);
  } catch (error: any) {
    console.error('Update investment error:', error);
    res.status(500).json({ error: error.message || 'Failed to update investment' });
  }
});

router.delete('/investment/:id', async (req: AuthRequest, res) => {
  const result = await sql`
    DELETE FROM investments
    WHERE id = ${req.params.id} AND wallet_owner = ${req.user!.email}
    RETURNING *
  `;
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Investment not found' });
  }
  res.json({ message: 'Investment deleted successfully' });
});

// Debt routes
router.get('/debt', async (req: AuthRequest, res) => {
  let query = sql`
    SELECT * FROM debts
    WHERE wallet_owner = ${req.user!.email}
  `;
  if (req.query.is_active !== undefined) {
    query = sql`${query} AND is_active = ${req.query.is_active === 'true'}`;
  }
  const result = await query;
  res.json(result.rows);
});

router.post('/debt', async (req: AuthRequest, res) => {
  const data = { ...req.body, wallet_owner: req.user!.email };
  const result = await sql`
    INSERT INTO debts (
      wallet_owner, name, type, original_amount, current_balance, minimum_payment,
      interest_rate, due_date, creditor, is_active
    )
    VALUES (
      ${data.wallet_owner}, ${data.name}, ${data.type}, ${data.original_amount},
      ${data.current_balance}, ${data.minimum_payment}, ${data.interest_rate || 0},
      ${data.due_date || null}, ${data.creditor || null}, ${data.is_active ?? true}
    )
    RETURNING *
  `;
  res.status(201).json(result.rows[0]);
});

router.patch('/debt/:id', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['name', 'type', 'original_amount', 'current_balance', 'minimum_payment', 'interest_rate', 'due_date', 'creditor', 'is_active'];
    const filteredUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await updateEntity('debts', req.params.id, filteredUpdates, 'wallet_owner', req.user!.email);
    if (result.length === 0) {
      return res.status(404).json({ error: 'Debt not found' });
    }
    res.json(result[0]);
  } catch (error: any) {
    console.error('Update debt error:', error);
    res.status(500).json({ error: error.message || 'Failed to update debt' });
  }
});

router.delete('/debt/:id', async (req: AuthRequest, res) => {
  const result = await sql`
    DELETE FROM debts
    WHERE id = ${req.params.id} AND wallet_owner = ${req.user!.email}
    RETURNING *
  `;
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Debt not found' });
  }
  res.json({ message: 'Debt deleted successfully' });
});

// Family Member routes
router.get('/family-member', async (req: AuthRequest, res) => {
  let query = sql`
    SELECT * FROM family_members
    WHERE added_by = ${req.user!.email}
  `;
  if (req.query.is_active !== undefined) {
    query = sql`${query} AND is_active = ${req.query.is_active === 'true'}`;
  }
  const result = await query;
  res.json(result.rows);
});

router.post('/family-member', async (req: AuthRequest, res) => {
  const data = { ...req.body, added_by: req.user!.email };
  const result = await sql`
    INSERT INTO family_members (name, relationship, date_of_birth, is_active, added_by)
    VALUES (${data.name}, ${data.relationship || null}, ${data.date_of_birth || null}, ${data.is_active ?? true}, ${data.added_by})
    RETURNING *
  `;
  res.status(201).json(result.rows[0]);
});

router.patch('/family-member/:id', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['name', 'relationship', 'date_of_birth', 'is_active'];
    const filteredUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await updateEntity('family_members', req.params.id, filteredUpdates, 'added_by', req.user!.email);
    if (result.length === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }
    res.json(result[0]);
  } catch (error: any) {
    console.error('Update family member error:', error);
    res.status(500).json({ error: error.message || 'Failed to update family member' });
  }
});

router.delete('/family-member/:id', async (req: AuthRequest, res) => {
  const result = await sql`
    DELETE FROM family_members
    WHERE id = ${req.params.id} AND added_by = ${req.user!.email}
    RETURNING *
  `;
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Family member not found' });
  }
  res.json({ message: 'Family member deleted successfully' });
});

// Exchange Rate routes
router.get('/exchange-rate', async (req: AuthRequest, res) => {
  const result = await sql`
    SELECT * FROM exchange_rates
    ORDER BY date DESC
    ${req.query.limit ? sql`LIMIT ${parseInt(req.query.limit as string)}` : sql``}
  `;
  res.json(result.rows);
});

router.post('/exchange-rate', async (req: AuthRequest, res) => {
  const data = req.body;
  const result = await sql`
    INSERT INTO exchange_rates (rate, source, date)
    VALUES (${data.rate}, ${data.source}, ${data.date})
    RETURNING *
  `;
  res.status(201).json(result.rows[0]);
});

// Notification routes
router.get('/notification', async (req: AuthRequest, res) => {
  let query = sql`
    SELECT * FROM notifications
    WHERE wallet_owner = ${req.user!.email}
  `;
  if (req.query.is_read !== undefined) {
    query = sql`${query} AND is_read = ${req.query.is_read === 'true'}`;
  }
  if (req.query.type) {
    query = sql`${query} AND type = ${req.query.type as string}`;
  }
  query = sql`${query} ORDER BY created_date DESC`;
  const result = await query;
  res.json(result.rows);
});

router.post('/notification', async (req: AuthRequest, res) => {
  const data = { ...req.body, wallet_owner: req.user!.email };
  const result = await sql`
    INSERT INTO notifications (title, message, type, is_read, action_url, wallet_owner)
    VALUES (${data.title}, ${data.message}, ${data.type}, ${data.is_read ?? false}, ${data.action_url || null}, ${data.wallet_owner})
    RETURNING *
  `;
  res.status(201).json(result.rows[0]);
});

router.patch('/notification/:id', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['title', 'message', 'type', 'is_read', 'action_url'];
    const filteredUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await updateEntity('notifications', req.params.id, filteredUpdates, 'wallet_owner', req.user!.email);
    if (result.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(result[0]);
  } catch (error: any) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: error.message || 'Failed to update notification' });
  }
});

// AI Recommendation routes
router.get('/ai-recommendation', async (req: AuthRequest, res) => {
  const result = await sql`
    SELECT * FROM ai_recommendations
    WHERE wallet_owner = ${req.user!.email}
    ORDER BY created_date DESC
  `;
  res.json(result.rows);
});

router.post('/ai-recommendation', async (req: AuthRequest, res) => {
  const data = { ...req.body, wallet_owner: req.user!.email };
  const result = await sql`
    INSERT INTO ai_recommendations (
      wallet_owner, type, title, description, impact, effort,
      estimated_savings, target_id, is_implemented
    )
    VALUES (
      ${data.wallet_owner}, ${data.type}, ${data.title}, ${data.description},
      ${data.impact}, ${data.effort}, ${data.estimated_savings || null},
      ${data.target_id || null}, ${data.is_implemented ?? false}
    )
    RETURNING *
  `;
  res.status(201).json(result.rows[0]);
});

router.patch('/ai-recommendation/:id', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['type', 'title', 'description', 'impact', 'effort', 'estimated_savings', 'target_id', 'is_implemented'];
    const filteredUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await updateEntity('ai_recommendations', req.params.id, filteredUpdates, 'wallet_owner', req.user!.email);
    if (result.length === 0) {
      return res.status(404).json({ error: 'AI recommendation not found' });
    }
    res.json(result[0]);
  } catch (error: any) {
    console.error('Update AI recommendation error:', error);
    res.status(500).json({ error: error.message || 'Failed to update AI recommendation' });
  }
});

export default router;

