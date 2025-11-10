import express from 'express';
import { sql } from '../db/connection.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, default_currency, notification_settings)
      VALUES (${email}, ${passwordHash}, ${full_name}, 'SYP', '{}'::jsonb)
      RETURNING id, email, full_name, role, default_currency, notification_settings, created_date, updated_date
    `;

    const user = result.rows[0];
    const token = generateToken({
      email: user.email,
      id: user.id,
      full_name: user.full_name,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        default_currency: user.default_currency,
        notification_settings: user.notification_settings,
        created_date: user.created_date,
        updated_date: user.updated_date,
      },
      token,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await sql`
      SELECT id, email, password_hash, full_name, role, default_currency, notification_settings, created_date, updated_date
      FROM users
      WHERE email = ${email}
    `;

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      email: user.email,
      id: user.id,
      full_name: user.full_name,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        default_currency: user.default_currency,
        notification_settings: user.notification_settings,
        created_date: user.created_date,
        updated_date: user.updated_date,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await sql`
      SELECT id, email, full_name, role, last_exchange_rate, default_currency, notification_settings, created_date, updated_date
      FROM users
      WHERE email = ${req.user!.email}
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      last_exchange_rate: user.last_exchange_rate,
      default_currency: user.default_currency,
      notification_settings: user.notification_settings,
      created_date: user.created_date,
      updated_date: user.updated_date,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

// Update current user
router.patch('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const updates: any = {};
    const allowedFields = ['full_name', 'default_currency', 'notification_settings', 'last_exchange_rate'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'notification_settings') {
          updates[field] = JSON.stringify(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const allowedFields = ['full_name', 'default_currency', 'notification_settings', 'last_exchange_rate'];
    const updateFields: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'notification_settings') {
          updateFields.push(`${field} = $${values.length + 1}::jsonb`);
          values.push(JSON.stringify(updates[field]));
        } else {
          updateFields.push(`${field} = $${values.length + 1}`);
          values.push(updates[field]);
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.user!.email);

    // Build the query with proper escaping
    let query = `UPDATE users SET `;
    const setParts: string[] = [];
    
    for (let i = 0; i < updateFields.length; i++) {
      const field = updateFields[i].split(' = ')[0];
      const value = values[i];
      if (field === 'notification_settings') {
        setParts.push(`${field} = '${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`);
      } else if (typeof value === 'string') {
        setParts.push(`${field} = '${value.replace(/'/g, "''")}'`);
      } else {
        setParts.push(`${field} = ${value}`);
      }
    }
    
    query += setParts.join(', ') + `, updated_date = CURRENT_TIMESTAMP WHERE email = '${req.user!.email.replace(/'/g, "''")}' RETURNING id, email, full_name, role, last_exchange_rate, default_currency, notification_settings, created_date, updated_date`;

    const result = await sql.unsafe(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      last_exchange_rate: user.last_exchange_rate,
      default_currency: user.default_currency,
      notification_settings: user.notification_settings,
      created_date: user.created_date,
      updated_date: user.updated_date,
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

// Logout (client-side token removal, but we can track it if needed)
router.post('/logout', authenticateToken, (req: AuthRequest, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;

