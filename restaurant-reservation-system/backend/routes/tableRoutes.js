import express from 'express';
import pool from '../config/db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const [tables] = await pool.query('SELECT * FROM restaurant_tables ORDER BY table_number');
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Could not load tables.' });
  }
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { table_number, capacity, location } = req.body;
    if (!table_number?.trim() || !Number.isInteger(Number(capacity)) || Number(capacity) < 1)
      return res.status(400).json({ message: 'Enter a table number and valid capacity.' });
    const [result] = await pool.query(
      'INSERT INTO restaurant_tables (table_number,capacity,location) VALUES (?,?,?)',
      [table_number.trim(), Number(capacity), location?.trim() || 'Main Hall']
    );
    const [rows] = await pool.query('SELECT * FROM restaurant_tables WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ message: error.code === 'ER_DUP_ENTRY' ? 'Table number already exists.' : 'Could not add table.' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM restaurant_tables WHERE id=?', [req.params.id]);
    res.json({ message: 'Table deleted.' });
  } catch (error) {
    res.status(error.code === 'ER_ROW_IS_REFERENCED_2' ? 409 : 500)
      .json({ message: error.code === 'ER_ROW_IS_REFERENCED_2' ? 'This table has reservation history and cannot be deleted.' : 'Could not delete table.' });
  }
});

export default router;
