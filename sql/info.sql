-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 26, 2024 at 01:16 PM
-- Server version: 8.2.0
-- PHP Version: 8.2.13

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `test`
--

-- --------------------------------------------------------

DROP TABLE IF EXISTS `cart`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `consumer`;
DROP TABLE IF EXISTS `market`;

CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `img` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci NOT NULL,
  `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci NOT NULL,
  `stock` INT NOT NULL,
  `normal_price` DECIMAL(10, 2) NOT NULL,
  `discount_price` DECIMAL(10, 2) NOT NULL,
  `expire_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `email` varchar(100) NOT NULL,
  `city` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci NOT NULL,
  `district` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `consumer` (
  `email` varchar(100) NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci NOT NULL,
  `city` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci NOT NULL,
  `district` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `market` (
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `market` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci NOT NULL,
  `city` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci NOT NULL,
  `district` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci NOT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cart` (
  `id` INT AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL,
  `product_id` INT NOT NULL,

  PRIMARY KEY (`id`),

  FOREIGN KEY (`email`) REFERENCES `consumer`(`email`)
    ON DELETE CASCADE,

  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
--
-- Dumping data for table `products and market`
--

INSERT INTO `market` 
(`email`, `password`, `market`, `city`, `district`) 
VALUES 
('baris.manco@gmail.com', '$2b$10$z0i5zAPkXSg0pnXkJzoYm.Yu7ZFB5Ho5M9UXlqbbwLOgqD4XmJdGi', 'Moda Manavı', 'İstanbul', 'Moda'),

('best.market@gmail.com', '$2b$10$z0i5zAPkXSg0pnXkJzoYm.Yu7ZFB5Ho5M9UXlqbbwLOgqD4XmJdGi', 'Best Süpermarket', 'İstanbul', 'Beşiktaş'),

('ali.hocam@gmail.com', '$2b$10$z0i5zAPkXSg0pnXkJzoYm.Yu7ZFB5Ho5M9UXlqbbwLOgqD4XmJdGi', 'Hocanın Yeri', 'Bursa', 'Nilüfer');


INSERT INTO `products` 
(`img`, `title`, `stock`, `normal_price`, `discount_price`, `expire_date`, `email`, `city`, `district`) 
VALUES 
('domates.png', 'Salkım Domates', 60, 40.00, 34.90, '2026-05-25', 'baris.manco@gmail.com','İstanbul', 'Moda'),
('biber.png', 'Sivri Biber', 50, 45.00, 39.00, '2026-05-15', 'baris.manco@gmail.com', 'İstanbul','Moda'),
('patlıcan.png', 'Kemer Patlıcan', 35, 35.00, 29.00, '2026-05-20', 'baris.manco@gmail.com', 'İstanbul','Moda'),
('portakal.png', 'Sıkmalık Portakal', 90, 25.00, 19.90, '2026-05-30', 'baris.manco@gmail.com', 'İstanbul','Moda'),

('bal.png', 'Süzme Çiçek Balı', 15, 350.00, 299.90, '2026-05-01', 'best.market@gmail.com', 'İstanbul','Beşiktaş'),
('çikolata.png', 'Sütlü Tablet Çikolata', 100, 35.00, 30.00, '2026-05-10', 'best.market@gmail.com', 'İstanbul','Beşiktaş'),
('cips.png', 'Baharatlı Patates Cipsi', 80, 45.00, 42.50, '2026-05-20', 'best.market@gmail.com','İstanbul', 'Beşiktaş'),
('elma.png', 'Amasya Elması', 120, 30.00, 25.00, '2026-05-01', 'best.market@gmail.com','İstanbul', 'Beşiktaş'),
('kahve.png', 'Türk Kahvesi (100g)', 200, 45.00, 40.00, '2026-05-01', 'best.market@gmail.com','İstanbul', 'Beşiktaş'),

('kayısı.png', 'Gün Kurusu Kayısı', 40, 180.00, 165.00, '2026-05-15', 'ali.hocam@gmail.com','Bursa', 'Nilüfer'),
('kıyma.png', 'Dana Kıyma (%20 Yağlı)', 25, 450.00, 420.00, '2026-05-10', 'ali.hocam@gmail.com','Bursa', 'Nilüfer'),
('süt.png', 'Tam Yağlı Süt 1L', 150, 38.00, 34.00, '2026-05-10', 'ali.hocam@gmail.com','Bursa', 'Nilüfer'),
('tavuk.png', 'Bütün Tavuk', 20, 120.00, 105.00, '2026-05-15', 'ali.hocam@gmail.com', 'Bursa','Nilüfer'),
('yoğurt.png', 'Süzme Yoğurt 1kg', 45, 85.00, 75.00, '2026-05-05', 'ali.hocam@gmail.com', 'Bursa','Nilüfer'),
('yumurta.png', 'Gezen Tavuk Yumurtası (15li)', 60, 75.00, 69.00, '2026-05-01', 'ali.hocam@gmail.com','Bursa', 'Nilüfer');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
