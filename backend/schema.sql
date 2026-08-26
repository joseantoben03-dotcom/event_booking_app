-- FX Event Booking ERP - MySQL schema
-- Run: mysql -u <user> -p <db> < schema.sql

CREATE TABLE venue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Venue VARCHAR(50) NULL,
  time_ TIMESTAMP NULL,
  date_ DATE NULL,
  status_ TINYINT(1) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO venue (Venue) VALUES
('Main Auditorium'), ('APJ Auditorium'), ('MBA Hall'), ('Library Hall'), ('Presentation Hall');

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  contactno VARCHAR(20) NULL,
  designation ENUM('ap', 'hod', 'principal', 'campus_manager') NOT NULL,
  department VARCHAR(100) NOT NULL,
  google_id VARCHAR(100) NULL UNIQUE,
  avatar_url TEXT NULL,
  venue_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_venue FOREIGN KEY (venue_id) REFERENCES venue(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  venue VARCHAR(50) NOT NULL,
  event_name VARCHAR(200) NOT NULL,
  purpose TEXT NOT NULL,
  organizer VARCHAR(150) NOT NULL,
  no_of_participants INT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hod_approved ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  principal_approved ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  campus_manager_approved ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  hod_approved_at TIMESTAMP NULL,
  principal_approved_at TIMESTAMP NULL,
  campus_manager_approved_at TIMESTAMP NULL,
  is_cancelled TINYINT(1) NOT NULL DEFAULT 0,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_participants_positive CHECK (no_of_participants > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_slot ON events(venue, event_date, start_time, end_time);

-- Sample users (placeholder emails - replace with real institutional emails)
INSERT INTO users (name, email, contactno, designation, department) VALUES
('Dr. Mary Joseph', 'mary.joseph@francisxavier.ac.in', '9000000001', 'campus_manager', 'Administration'),
('Dr. Arun Kumar', 'arun.principal@francisxavier.ac.in', '9000000002', 'principal', 'Administration'),
('Prof. Latha Menon', 'latha.hod@francisxavier.ac.in', '9000000003', 'hod', 'Computer Science and Engineering'),
('Prof. Ravi Shankar', 'ravi.ap@francisxavier.ac.in', '9000000004', 'ap', 'Computer Science and Engineering');
