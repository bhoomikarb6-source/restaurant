# Restaurant Table Reservation System

Full-stack MCA mini project using React, Node.js, Express and MySQL.

## Requirements
- Node.js LTS
- XAMPP (MySQL)
- VS Code

## 1. Database setup
1. Open XAMPP Control Panel and start **MySQL**.
2. Open `http://localhost/phpmyadmin`.
3. Select **Import**, choose `database.sql` from this project, then click Import.
   - Alternatively, open the SQL tab, paste the contents of `database.sql`, and run it.

The database is named `restaurant_reservation`.

## 2. Backend setup
Open this project folder in VS Code. Open Terminal > New Terminal:

```bash
cd backend
```

Copy `.env.example` to `.env` and check the MySQL settings. The default XAMPP settings are:
- DB_HOST=localhost
- DB_USER=root
- DB_PASSWORD= (empty)
- DB_NAME=restaurant_reservation

Install and start:

```bash
npm install
npm run dev
```

Backend runs at `http://localhost:5000`.
On first startup, it creates a demo admin and sample tables if they do not exist.

Demo admin:
- Email: `admin@restaurant.com`
- Password: `Admin@123`

Change the demo admin password before using the project beyond a classroom demonstration.

## 3. Frontend setup
Open a **second** VS Code terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## 4. Customer demonstration
1. Register a customer account.
2. Log in with that account.
3. Open Book a Table.
4. Select a date, time, number of guests and available table.
5. Submit the reservation.
6. Open My Reservations to edit or cancel it.

## 5. Admin demonstration
1. Log out.
2. Log in using the demo admin credentials above.
3. Open Admin Dashboard.
4. View reservations and change their status to Confirmed or Rejected.
5. Add or delete restaurant tables.

## Notes
- A reservation holds a table for two hours.
- The backend checks overlapping reservations before creating or updating a booking.
- Cancelled and rejected bookings do not block a table.
- This is an educational mini project. For production use, add HTTPS, rate limiting, stronger admin provisioning, audit logs, email verification and more extensive validation.
