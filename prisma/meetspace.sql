-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 16, 2026 at 03:39 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `meetspace`
--

-- --------------------------------------------------------

--
-- Table structure for table `booking`
--

CREATE TABLE `booking` (
  `id` int(11) NOT NULL,
  `roomId` int(11) NOT NULL,
  `title` varchar(190) NOT NULL,
  `bookingDate` date NOT NULL,
  `startTime` varchar(5) NOT NULL,
  `endTime` varchar(5) NOT NULL,
  `organizerId` int(11) DEFAULT NULL,
  `departmentId` int(11) DEFAULT NULL,
  `attendees` int(11) NOT NULL DEFAULT 1,
  `status` enum('CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'CONFIRMED',
  `checkinCode` varchar(24) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `booking`
--

INSERT INTO `booking` (`id`, `roomId`, `title`, `bookingDate`, `startTime`, `endTime`, `organizerId`, `departmentId`, `attendees`, `status`, `checkinCode`, `createdAt`, `updatedAt`) VALUES
(39, 12, 'Sprint training', '2026-03-13', '09:00', '10:00', 17, 16, 5, 'CHECKED_IN', 'MR100844', '2026-03-13 06:58:20.859', '2026-03-13 06:58:30.612'),
(40, 8, 'test', '2026-03-14', '09:00', '10:00', 22, 9, 8, 'CANCELLED', 'MR270958', '2026-03-13 07:51:10.963', '2026-03-13 07:51:49.363');

-- --------------------------------------------------------

--
-- Table structure for table `department`
--

CREATE TABLE `department` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `color` varchar(32) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `headId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `department`
--

INSERT INTO `department` (`id`, `name`, `color`, `description`, `active`, `headId`, `createdAt`, `updatedAt`) VALUES
(9, 'Production Engineering', '#6366f1', 'Infrastruktur teknis & preventive maintenance mesin', 1, 9, '2026-03-13 04:21:05.812', '2026-03-13 04:35:06.329'),
(10, 'Production Control', '#10b981', 'Product strategy & roadmap', 1, 32, '2026-03-13 04:21:05.821', '2026-03-13 07:00:04.246'),
(11, 'Marketing', '#f59e0b', 'Brand, campaigns & growth', 1, 11, '2026-03-13 04:21:05.827', '2026-03-13 04:21:06.375'),
(12, 'Human Resource', '#ec4899', 'People operations & culture', 1, 12, '2026-03-13 04:21:05.832', '2026-03-13 06:34:00.598'),
(13, 'Finance & Accounting', '#14b8a6', 'Finance, budgeting & compliance', 1, 18, '2026-03-13 04:21:05.838', '2026-03-13 06:16:12.814'),
(14, 'Production', '#f97316', 'Departemen utama produksi', 1, 29, '2026-03-13 04:21:05.843', '2026-03-13 07:00:17.118'),
(15, 'General Affairs', '#8b5cf6', 'Legal affairs & contracts', 1, 15, '2026-03-13 04:21:05.851', '2026-03-13 04:35:49.371'),
(16, 'Developer', '#06b6d4', 'System App Developer', 1, 17, '2026-03-13 04:21:05.857', '2026-03-13 06:26:35.923'),
(17, 'Quality Assurance', '#84cc16', 'Pencegahan cacat melalui pengaturan sistem', 1, 30, '2026-03-13 06:31:02.698', '2026-03-13 06:31:02.698'),
(18, 'Quality Control', '#84cc16', 'Pemeriksaan fisik produk untuk memastikan standar kualitas terpenuhi', 1, 31, '2026-03-13 06:31:35.437', '2026-03-13 07:00:28.193'),
(19, 'Maintenance', '#ef4444', 'Memastikan mesin produksi dalam kondisi prima dan perbaikan jika terjadi kerusakan', 1, 33, '2026-03-13 06:32:27.044', '2026-03-13 07:01:27.064'),
(20, 'HSE / K3', '#14b8a6', 'Fokus pada keselamatan dan kesehatan kerja para karyawan', 1, 20, '2026-03-13 06:35:00.380', '2026-03-13 06:35:15.092'),
(21, 'Production System Development', '#f97316', NULL, 1, NULL, '2026-03-13 06:35:57.871', '2026-03-13 06:36:23.019');

-- --------------------------------------------------------

--
-- Table structure for table `room`
--

CREATE TABLE `room` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `capacity` int(11) NOT NULL,
  `floor` varchar(40) NOT NULL,
  `color` varchar(32) NOT NULL,
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`amenities`)),
  `description` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `room`
--

INSERT INTO `room` (`id`, `name`, `capacity`, `floor`, `color`, `amenities`, `description`, `active`, `createdAt`, `updatedAt`) VALUES
(7, 'Sumatra 2', 15, '1F', '#f59e0b', '[\"projector\",\"whiteboard\",\"wifi\"]', 'Rekomendasi untuk training dan sosialisasi', 1, '2026-03-13 04:21:06.422', '2026-03-13 06:08:31.477'),
(8, 'Lombok', 8, '1F', '#84cc16', '[\"whiteboard\",\"wifi\",\"projector\"]', 'Ruang meeting standar dengan kapasitas anggota yang minim', 1, '2026-03-13 04:21:06.430', '2026-03-13 06:11:45.338'),
(9, 'Jawa', 6, '1F', '#6366f1', '[\"wifi\",\"whiteboard\",\"coffee\"]', 'Khusus untuk expatriat dan ramu expatriat', 1, '2026-03-13 04:21:06.439', '2026-03-13 06:11:39.597'),
(10, 'Aula', 40, '1F', '#ec4899', '[\"wifi\",\"projector\",\"whiteboard\",\"coffee\",\"mic\"]', 'Gabungan dari Sumatra 1 dan Sumatra 2, cocok untuk event dan training dengan jumlah yang besar', 1, '2026-03-13 04:21:06.444', '2026-03-13 06:06:18.848'),
(11, 'Sumatra 1', 25, '1F', '#f97316', '[\"projector\",\"mic\",\"whiteboard\",\"wifi\"]', 'Cocok digunakan training dan meeting dengan jumlah anggota yang cukup banyak', 1, '2026-03-13 04:21:06.449', '2026-03-13 06:07:19.981'),
(12, 'Bali', 6, '1F', '#06b6d4', '[\"wifi\",\"whiteboard\",\"projector\"]', 'Ruang rekomendasi untuk menerima tamu', 1, '2026-03-13 04:21:06.455', '2026-03-13 06:09:56.267');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` enum('ADMIN','MEMBER','VIEWER') NOT NULL DEFAULT 'MEMBER',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `avatarColor` varchar(32) NOT NULL DEFAULT '#6366f1',
  `departmentId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `email`, `passwordHash`, `phone`, `role`, `active`, `avatarColor`, `departmentId`, `createdAt`, `updatedAt`) VALUES
(9, 'Hendra Kusuma', 'penm01@fine-sinter.co.id', '$2b$10$BXqeg/tBYzbMaOGfue1Xw.1hDUY5X52LxP/Ef6lFj6PTZKswdSGrK', NULL, 'ADMIN', 1, '#6366f1', 9, '2026-03-13 04:21:05.924', '2026-03-13 06:20:28.654'),
(11, 'Rodi Lisaputra', 'ae01@fine-sinter.co.id', '$2b$10$V26IwZYzVsbC8vv760SG3O/4InzQfsxI072y92WdinfMXW/oE8b.y', '+62 812-0001-0003', 'ADMIN', 1, '#f59e0b', 11, '2026-03-13 04:21:06.046', '2026-03-13 07:36:58.801'),
(12, 'Elina Indah', 'hrd01@fine-sinter.co.id', '$2b$10$vWC9rFP9/qMAYIJ2VNkmvOPANQz1bPZHtri7XLL7NpL/FsGYZGBRa', '+62 812-0001-0004', 'ADMIN', 1, '#ec4899', 12, '2026-03-13 04:21:06.104', '2026-03-13 04:38:45.458'),
(15, 'Happy Karunia Robbi', 'gamg@fine-sinter.co.id', '$2b$10$j1bBQ5HZMwJ7xtDVE4wGUOLILXwbdoZT8in3GtmA9ga8J/vnLXPaC', '+62 812-0001-0007', 'ADMIN', 1, '#8b5cf6', 15, '2026-03-13 04:21:06.285', '2026-03-13 04:38:52.326'),
(17, 'Administrator App', 'it.rdk@outlook.co.id', '$2b$10$Hywpj8NPTbgqb.SPQh4/pOSPjjUP3YLOQZd8Os6oKxuRdQ.mJIMF.', '+6285211223161', 'ADMIN', 1, '#06b6d4', 16, '2026-03-13 04:32:00.948', '2026-03-13 06:25:44.557'),
(18, 'Ayu Wulandari', 'acc01@fine-sinter.co.id', '$2b$10$g7R9MFti.8Xx3P0DK6PYd.1vS3oxvLUlsrdHyfzHGwhWYQVrhn9fO', NULL, 'ADMIN', 1, '#14b8a6', 13, '2026-03-13 06:15:57.965', '2026-03-13 06:18:14.271'),
(19, 'Rike Imaniar', 'adm01@fine-sinter.co.id', '$2b$10$bXGfPrHqbMM2D.6XtvPynOCSbfHhONhjTnBNEzKLZE/VvsquEZmiy', NULL, 'MEMBER', 1, '#8b5cf6', 15, '2026-03-13 06:17:04.616', '2026-03-13 06:18:29.656'),
(20, 'Amelia Yogi Safitri', 'adm02@fine-sinter.co.id', '$2b$10$cundDe3eDygezOfdjke4rO6cyY1y7.5TKN0jpvK3P4tmp8DysbjHS', NULL, 'MEMBER', 1, '#ec4899', 12, '2026-03-13 06:17:38.367', '2026-03-13 06:17:59.341'),
(21, 'Agus Ariyanto', 'penm02@fine-sinter.co.id', '$2b$10$7.7sinSB4nXwO7a.L9dy9e.tkMDBRmZ3jEhYU/Jcc.0QWKIrsC9.q', NULL, 'MEMBER', 1, '#6366f1', 9, '2026-03-13 06:19:30.782', '2026-03-13 06:19:30.782'),
(22, 'Indah Prawitasari', 'penm03@fine-sinter.co.id', '$2b$10$2NiB76yACI/UJdmxHXuh5OMpjr4X1nASBmHpg./Z/BSliT1hnf97O', NULL, 'MEMBER', 1, '#6366f1', 9, '2026-03-13 06:19:57.843', '2026-03-13 06:20:07.269'),
(23, 'Thoyibatun Nikmah', 'thoyibatun.penm04@fine-sinter.co.id', '$2b$10$HAwwtIe1wkxifH4tCo7eSOBr3COZJwwe/SttWmeFYpUb1RHV7ydim', NULL, 'MEMBER', 1, '#6366f1', 9, '2026-03-13 06:21:04.223', '2026-03-13 06:21:04.223'),
(24, 'Setiawan', 'penm05@fine-sinter.co.id', '$2b$10$JjDOXhHY.r7PPYv3JhSu8e/is4HCetx9rJIwgpAoe9dSwIujdoYPS', NULL, 'MEMBER', 1, '#6366f1', 9, '2026-03-13 06:21:59.197', '2026-03-13 06:22:23.763'),
(25, 'Siswanto', 'penm06@fine-sinter.co.id', '$2b$10$8HR7htZBg.QdsBayoyJ6lOlrzC.IZ.EuFmf0mnRAaVgffdKXvXn4C', NULL, 'MEMBER', 1, '#6366f1', 9, '2026-03-13 06:22:49.642', '2026-03-13 06:22:49.642'),
(26, 'Siti Sarifah', 'mold@fine-sinter.co.id', '$2b$10$fB4eycaSYDi5EEI03way/Or9OsY0NHH3/5LhwqSriS9XuwyqW1zH.', NULL, 'MEMBER', 1, '#6366f1', 9, '2026-03-13 06:23:36.899', '2026-03-13 06:23:36.899'),
(28, 'Rey Dwi Kosasih', 'it.penm@fine-sinter.co.id', '$2b$10$jk9UKPHZu1Y2OqnlXYg6gO3iHSyLHMUSYi2unIbcMqVXz/LY6cYfm', NULL, 'MEMBER', 1, '#6366f1', 9, '2026-03-13 06:25:05.864', '2026-03-13 06:26:06.134'),
(29, 'Aen Suhendra', 'prod01@fine-sinter.co.id', '$2b$10$ZkxU64eQMH5zoaLIVW25ue8iM1DCoXT6um7u4MPALtQytHOf/A99W', NULL, 'ADMIN', 1, '#f97316', 14, '2026-03-13 06:27:57.793', '2026-03-13 06:28:04.833'),
(30, 'Amin', 'amin.qa01@fine-sinter.co.id', '$2b$10$s/DIvC7JZL1JKlbioxHwPeM8t5Tc8ZFCH0gGhOAyXZtix4Vz3dLR.', NULL, 'ADMIN', 1, '#84cc16', 17, '2026-03-13 06:29:20.318', '2026-03-13 06:37:12.556'),
(31, 'Budiman', 'budiman.qc01@fine-sinter.co.id', '$2b$10$zLu6sA648OeQ6oI7y.WnvuX8xr26N8lpnarcleZyNXFBveUmHcotq', NULL, 'ADMIN', 1, '#84cc16', 18, '2026-03-13 06:37:55.580', '2026-03-13 06:37:55.580'),
(32, 'Casmana', 'casmana.pc01@fine-sinter.co.id', '$2b$10$E65srVo8Qpyt.CDHNSQmh.iTpxB7Q9g9MQ9rM9av3jmOh09IymdMW', NULL, 'ADMIN', 1, '#14b8a6', 10, '2026-03-13 06:59:47.974', '2026-03-13 06:59:47.974'),
(33, 'Aliyudin', 'mtc01@fine-sinter.co.id', '$2b$10$Sl7O3GEcd4GUj/DYHXFcPeM2i.XZOp/ufYsnuFGYhqhClzq.LZUOq', NULL, 'ADMIN', 1, '#ef4444', 19, '2026-03-13 07:01:07.408', '2026-03-13 07:01:07.408');

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('298331ba-0374-4b45-9136-2c7f03da46ca', '4f069e5a583427bf882c9f20c31d518ee24711285633c1f1f454aa8cfe62a2b1', '2026-03-13 04:04:35.814', '20260313040434_init', NULL, NULL, '2026-03-13 04:04:34.996', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Booking_checkinCode_key` (`checkinCode`),
  ADD KEY `Booking_roomId_bookingDate_idx` (`roomId`,`bookingDate`),
  ADD KEY `Booking_organizerId_idx` (`organizerId`),
  ADD KEY `Booking_departmentId_idx` (`departmentId`),
  ADD KEY `Booking_status_idx` (`status`);

--
-- Indexes for table `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Department_name_key` (`name`),
  ADD KEY `Department_headId_fkey` (`headId`);

--
-- Indexes for table `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Room_name_key` (`name`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`),
  ADD KEY `User_departmentId_fkey` (`departmentId`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `booking`
--
ALTER TABLE `booking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `department`
--
ALTER TABLE `department`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `room`
--
ALTER TABLE `room`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `Booking_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Booking_organizerId_fkey` FOREIGN KEY (`organizerId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Booking_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `department`
--
ALTER TABLE `department`
  ADD CONSTRAINT `Department_headId_fkey` FOREIGN KEY (`headId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `User_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
