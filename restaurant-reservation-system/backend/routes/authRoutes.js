import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

function makeToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'development_secret_change_me', { expiresIn: '1d' });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 6)
      return res.status(400).json({ message: 'Enter name, valid email and password (at least 6 characters).' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length) return res.status(409).json({ message: 'Email is already registered.' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',
      [name.trim(), email.trim().toLowerCase(), hash, 'customer']
    );
    const user = { id: result.insertId, name: name.trim(), email: email.trim().toLowerCase(), role: 'customer' };
    res.status(201).json({ message: 'Registration successful.', token: makeToken(user), user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not register user.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email || '']);
    if (!rows.length || !(await bcrypt.compare(password || '', rows[0].password)))
      return res.status(401).json({ message: 'Invalid email or password.' });

    const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role };
    res.json({ message: 'Login successful.', token: makeToken(user), user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not log in.' });
  }
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));
export default router;
