import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ message: 'Restaurant Reservation API is running.' }));
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await pool.query('SELECT 1');
    const [admins] = await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    if (!admins.length) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
      await pool.query('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', [
        process.env.ADMIN_NAME || 'Restaurant Admin',
        (process.env.ADMIN_EMAIL || 'admin@restaurant.com').toLowerCase(),
        hash, 'admin'
      ]);
      console.log('Demo admin account created.');
    }
    const [tables] = await pool.query('SELECT id FROM restaurant_tables LIMIT 1');
    if (!tables.length) {
      await pool.query(`INSERT INTO restaurant_tables (table_number,capacity,location) VALUES
        ('T1',2,'Window Side'),('T2',2,'Main Hall'),('T3',4,'Main Hall'),
        ('T4',4,'Garden View'),('T5',6,'Family Section'),('T6',8,'Family Section')`);
    }
    app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
  } catch (error) {
    console.error('Could not connect to MySQL. Check XAMPP and backend/.env.', error.message);
    process.exit(1);
  }
}
start();
