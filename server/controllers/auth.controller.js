import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(row) {
  // Never expose the password hash.
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

export async function register(req, res, next) {
  try {
    const { name, phone, email, password, role, motorcycleNumber, motorcycleModel } = req.body;

    // --- validation ---
    const errors = [];
    if (!name || !name.trim()) errors.push('Name is required');
    if (!phone || !phone.trim()) errors.push('Phone number is required');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required');
    if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
    if (role !== 'customer' && role !== 'rider') errors.push('Role must be customer or rider');
    if (errors.length) return res.status(400).json({ error: errors.join('. ') });

    const emailNorm = email.trim().toLowerCase();

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [emailNorm]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (name, phone, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), phone.trim(), emailNorm, passwordHash, role]
    );
    const user = result.rows[0];

    if (role === 'rider') {
      await pool.query(
        `INSERT INTO riders (user_id, motorcycle_number, motorcycle_model)
         VALUES ($1, $2, $3)`,
        [user.id, motorcycleNumber?.trim() || null, motorcycleModel?.trim() || null]
      );
    }

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email.trim().toLowerCase(),
    ]);
    const user = result.rows[0];

    const valid = user && (await bcrypt.compare(password, user.password_hash));
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let riderProfile = null;
    if (user.role === 'rider') {
      const riderResult = await pool.query(
        'SELECT * FROM riders WHERE user_id = $1',
        [user.id]
      );
      riderProfile = riderResult.rows[0] || null;
    }

    res.json({ user: publicUser(user), riderProfile });
  } catch (err) {
    next(err);
  }
}
