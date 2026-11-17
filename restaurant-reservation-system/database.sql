CREATE DATABASE IF NOT EXISTS restaurant_reservation;
USE restaurant_reservation;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_number VARCHAR(20) NOT NULL UNIQUE,
  capacity INT NOT NULL,
  location VARCHAR(100) DEFAULT 'Main Hall',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  table_id INT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guests INT NOT NULL,
  special_request VARCHAR(500) DEFAULT '',
  status ENUM('Pending','Confirmed','Rejected','Cancelled') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservation_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE RESTRICT,
  INDEX idx_reservation_date_time (reservation_date, reservation_time),
  INDEX idx_reservation_table (table_id)
);

INSERT IGNORE INTO restaurant_tables (table_number, capacity, location) VALUES
('T1', 2, 'Window Side'),
('T2', 2, 'Main Hall'),
('T3', 4, 'Main Hall'),
('T4', 4, 'Garden View'),
('T5', 6, 'Family Section'),
('T6', 8, 'Family Section');
