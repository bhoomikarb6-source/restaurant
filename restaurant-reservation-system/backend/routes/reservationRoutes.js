import express from 'express';
import pool from '../config/db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const blocked = ['Pending', 'Confirmed'];

async function hasConflict(tableId, date, time, excludeId = null) {
  const params = [tableId, date, date, time, time];
  let sql = `SELECT id FROM reservations
    WHERE table_id=? AND reservation_date=?
    AND status IN ('Pending','Confirmed')
    AND ADDTIME(reservation_time,'02:00:00') > ?
    AND reservation_time < ADDTIME(?,'02:00:00')`;
  // Use SQL time comparisons; parameters correspond to table, date, requested time, requested time.
  params.splice(2, 0); 
  const values = [tableId, date, time, time];
  if (excludeId) { sql += ' AND id <> ?'; values.push(excludeId); }
  const [rows] = await pool.query(sql, values);
  return rows.length > 0;
}

router.get('/mine', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, t.table_number, t.location
       FROM reservations r JOIN restaurant_tables t ON t.id=r.table_id
       WHERE r.user_id=? ORDER BY r.reservation_date DESC, r.reservation_time DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ message: 'Could not load reservations.' }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { table_id, reservation_date, reservation_time, guests, special_request = '' } = req.body;
    const guestCount = Number(guests);
    if (!table_id || !reservation_date || !reservation_time || !Number.isInteger(guestCount) || guestCount < 1)
      return res.status(400).json({ message: 'Complete all required reservation fields.' });
    const [tables] = await pool.query('SELECT * FROM restaurant_tables WHERE id=?', [table_id]);
    if (!tables.length) return res.status(404).json({ message: 'Table not found.' });
    if (guestCount > tables[0].capacity) return res.status(400).json({ message: `This table seats up to ${tables[0].capacity} guests.` });
    if (new Date(`${reservation_date}T${reservation_time}:00`) < new Date())
      return res.status(400).json({ message: 'Please select a future date and time.' });
    if (await hasConflict(table_id, reservation_date, reservation_time))
      return res.status(409).json({ message: 'This table is already booked for that time. Choose another table or time.' });

    const [result] = await pool.query(
      `INSERT INTO reservations (user_id,table_id,reservation_date,reservation_time,guests,special_request)
       VALUES (?,?,?,?,?,?)`,
      [req.user.id, table_id, reservation_date, reservation_time, guestCount, special_request]
    );
    res.status(201).json({ message: 'Reservation created successfully.', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create reservation.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { table_id, reservation_date, reservation_time, guests, special_request = '' } = req.body;
    const [current] = await pool.query('SELECT * FROM reservations WHERE id=?', [req.params.id]);
    if (!current.length) return res.status(404).json({ message: 'Reservation not found.' });
    if (req.user.role !== 'admin' && current[0].user_id !== req.user.id)
      return res.status(403).json({ message: 'You cannot edit this reservation.' });
    if (current[0].status === 'Cancelled' || current[0].status === 'Rejected')
      return res.status(400).json({ message: 'This reservation cannot be edited.' });

    const [tables] = await pool.query('SELECT * FROM restaurant_tables WHERE id=?', [table_id]);
    if (!tables.length) return res.status(404).json({ message: 'Table not found.' });
    if (!Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > tables[0].capacity)
      return res.status(400).json({ message: `Guest count must be between 1 and ${tables[0].capacity}.` });
    if (await hasConflict(table_id, reservation_date, reservation_time, req.params.id))
      return res.status(409).json({ message: 'This table is already booked for that time.' });

    await pool.query(
      `UPDATE reservations SET table_id=?,reservation_date=?,reservation_time=?,guests=?,special_request=? WHERE id=?`,
      [table_id, reservation_date, reservation_time, guests, special_request, req.params.id]
    );
    res.json({ message: 'Reservation updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update reservation.' });
  }
});

router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Reservation not found.' });
    if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id)
      return res.status(403).json({ message: 'You cannot cancel this reservation.' });
    await pool.query("UPDATE reservations SET status='Cancelled' WHERE id=?", [req.params.id]);
    res.json({ message: 'Reservation cancelled.' });
  } catch (error) { res.status(500).json({ message: 'Could not cancel reservation.' }); }
});

router.get('/admin/all', authenticate, adminOnly, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.name AS customer_name, u.email, t.table_number, t.location
       FROM reservations r JOIN users u ON u.id=r.user_id
       JOIN restaurant_tables t ON t.id=r.table_id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ message: 'Could not load all reservations.' }); }
});

router.patch('/:id/status', authenticate, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!['Pending','Confirmed','Rejected','Cancelled'].includes(status))
    return res.status(400).json({ message: 'Invalid reservation status.' });
  try {
    const [result] = await pool.query('UPDATE reservations SET status=? WHERE id=?', [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Reservation not found.' });
    res.json({ message: `Reservation ${status.toLowerCase()}.` });
  } catch (error) { res.status(500).json({ message: 'Could not update status.' }); }
});

router.get('/admin/customers', authenticate, adminOnly, async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id,u.name,u.email,u.created_at,COUNT(r.id) AS total_reservations
     FROM users u LEFT JOIN reservations r ON r.user_id=u.id
     WHERE u.role='customer' GROUP BY u.id ORDER BY u.created_at DESC`
  );
  res.json(rows);
});

export default router;
