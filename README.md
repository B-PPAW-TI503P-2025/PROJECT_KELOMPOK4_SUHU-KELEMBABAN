[PROJEK JAMUR SQL.sql](https://github.com/user-attachments/files/24765929/PROJEK.JAMUR.SQL.sql)
-- 1. Membuat Database
CREATE DATABASE IF NOT EXISTS db_kumbung_jamur;
USE db_kumbung_jamur;

-- 2. Tabel Users
-- Menyimpan data akun untuk login Admin dan Petani
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin', 'petani') NOT NULL DEFAULT 'petani',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Tabel Sensor Data
-- Menyimpan history pembacaan suhu dan kelembapan dari Mikrokontroler
CREATE TABLE sensor_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Tabel Settings
-- Hanya akan berisi 1 baris (ID=1) sebagai konfigurasi pusat alat
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    min_humidity FLOAT DEFAULT 80.0,
    mode ENUM('otomatis', 'manual') DEFAULT 'otomatis',
    pump_status TINYINT(1) DEFAULT 0, -- 0: OFF, 1: ON
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Tabel Logs
-- Mencatat setiap kali pompa nyala/mati, baik otomatis maupun manual
CREATE TABLE logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL, -- Jika manual, catat siapa yang klik. Jika otomatis, NULL.
    action VARCHAR(100) NOT NULL, -- Contoh: "Pompa Menyala Otomatis" atau "Manual OFF"
    duration INT DEFAULT 0, -- Durasi penyemprotan dalam detik
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
ini)
INSERT INTO settings (id, min_humidity, mode, pump_status) 
VALUES (1, 80.0, 'otomatis', 0);
