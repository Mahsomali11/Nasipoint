-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: maaldhis
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_roles`
--

DROP TABLE IF EXISTS `admin_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_roles` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_roles_user_id_foreign` (`user_id`),
  CONSTRAINT `admin_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_roles`
--

LOCK TABLES `admin_roles` WRITE;
/*!40000 ALTER TABLE `admin_roles` DISABLE KEYS */;
INSERT INTO `admin_roles` VALUES ('736854be-3f76-44e6-b063-8ed92da22956','01a0956d-91f7-729f-a258-62daade1e660','super_owner',1,NULL,NULL),('a022c179-c161-4c51-a77e-6e2be780b6f8','01a0956d-1a91-728b-a5b0-bdd476c73323','super_owner',1,NULL,NULL);
/*!40000 ALTER TABLE `admin_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` char(36) NOT NULL,
  `action` varchar(255) NOT NULL,
  `admin_user_id` char(36) NOT NULL,
  `entity_type` varchar(255) NOT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_admin_user_id_foreign` (`admin_user_id`),
  CONSTRAINT `audit_logs_admin_user_id_foreign` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_movements`
--

DROP TABLE IF EXISTS `cash_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cash_movements` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `cash_session_id` char(36) NOT NULL,
  `movement_type` varchar(255) NOT NULL DEFAULT '',
  `direction` varchar(255) NOT NULL DEFAULT 'in',
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `source_module` varchar(255) NOT NULL DEFAULT '',
  `reference_id` varchar(255) NOT NULL DEFAULT '',
  `note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cash_movements_store_id_foreign` (`store_id`),
  KEY `cash_movements_cash_session_id_foreign` (`cash_session_id`),
  CONSTRAINT `cash_movements_cash_session_id_foreign` FOREIGN KEY (`cash_session_id`) REFERENCES `cash_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cash_movements_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_movements`
--

LOCK TABLES `cash_movements` WRITE;
/*!40000 ALTER TABLE `cash_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `cash_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_sessions`
--

DROP TABLE IF EXISTS `cash_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cash_sessions` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `business_date` date NOT NULL,
  `opening_cash` decimal(12,2) NOT NULL DEFAULT 0.00,
  `closing_cash` decimal(12,2) NOT NULL DEFAULT 0.00,
  `opened_by` char(36) NOT NULL,
  `closed_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cash_sessions_store_id_foreign` (`store_id`),
  KEY `cash_sessions_opened_by_foreign` (`opened_by`),
  KEY `cash_sessions_closed_by_foreign` (`closed_by`),
  CONSTRAINT `cash_sessions_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `cash_sessions_opened_by_foreign` FOREIGN KEY (`opened_by`) REFERENCES `users` (`id`),
  CONSTRAINT `cash_sessions_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_sessions`
--

LOCK TABLES `cash_sessions` WRITE;
/*!40000 ALTER TABLE `cash_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `cash_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` char(36) NOT NULL,
  `store_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `categories_store_id_foreign` (`store_id`),
  CONSTRAINT `categories_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('01a0a031-8816-7039-92fe-a2bdbafd51b3','01a09566-448c-7075-bd19-ef317d35572e','Mobile',NULL,'2026-09-14 10:53:15','2026-09-14 10:53:15');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_debts`
--

DROP TABLE IF EXISTS `customer_debts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_debts` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `customer_id` char(36) NOT NULL,
  `customer_name` varchar(255) NOT NULL DEFAULT '',
  `sale_id` char(36) DEFAULT NULL,
  `original_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `balance_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` varchar(255) NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_debts_store_id_foreign` (`store_id`),
  KEY `customer_debts_customer_id_foreign` (`customer_id`),
  KEY `customer_debts_sale_id_foreign` (`sale_id`),
  CONSTRAINT `customer_debts_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_debts_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE SET NULL,
  CONSTRAINT `customer_debts_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_debts`
--

LOCK TABLES `customer_debts` WRITE;
/*!40000 ALTER TABLE `customer_debts` DISABLE KEYS */;
INSERT INTO `customer_debts` VALUES ('981f7a66-c970-4563-bf5f-b7c4f193a544','01a09566-448c-7075-bd19-ef317d35572e','7fdaed28-6cae-4470-a359-3474b0b90945','mohamed',NULL,50.00,50.00,'open','2026-09-12 10:40:49','2026-09-12 10:40:49');
/*!40000 ALTER TABLE `customer_debts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `customer_code` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customers_store_id_foreign` (`store_id`),
  CONSTRAINT `customers_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('7fdaed28-6cae-4470-a359-3474b0b90945','01a09566-448c-7075-bd19-ef317d35572e','001','mohamed','615903208',NULL,'2026-09-12 10:40:31','2026-09-12 10:40:31');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_sessions`
--

DROP TABLE IF EXISTS `device_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `device_sessions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `store_id` char(36) DEFAULT NULL,
  `device_id` varchar(255) NOT NULL,
  `device_name` varchar(255) NOT NULL DEFAULT '',
  `device_type` varchar(255) NOT NULL DEFAULT '',
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `last_login` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `device_sessions_user_id_foreign` (`user_id`),
  KEY `device_sessions_store_id_foreign` (`store_id`),
  CONSTRAINT `device_sessions_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `device_sessions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_sessions`
--

LOCK TABLES `device_sessions` WRITE;
/*!40000 ALTER TABLE `device_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `device_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exchange_rates`
--

DROP TABLE IF EXISTS `exchange_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exchange_rates` (
  `id` char(36) NOT NULL,
  `currency_code` varchar(255) NOT NULL,
  `currency_name` varchar(255) DEFAULT NULL,
  `currency_symbol` varchar(255) DEFAULT NULL,
  `rate_to_usd` decimal(12,4) NOT NULL DEFAULT 1.0000,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exchange_rates`
--

LOCK TABLES `exchange_rates` WRITE;
/*!40000 ALTER TABLE `exchange_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `exchange_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `expenses` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `expense_type` varchar(255) NOT NULL DEFAULT '',
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `note` text DEFAULT NULL,
  `employee_user_id` char(36) DEFAULT NULL,
  `employee_name` varchar(255) NOT NULL DEFAULT '',
  `payment_method` varchar(255) NOT NULL DEFAULT 'cash',
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expenses_store_id_foreign` (`store_id`),
  KEY `expenses_employee_user_id_foreign` (`employee_user_id`),
  KEY `expenses_created_by_foreign` (`created_by`),
  CONSTRAINT `expenses_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_employee_user_id_foreign` FOREIGN KEY (`employee_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES ('760a39fc-fda1-4d5d-9cd2-e7c93f6f4f0e','01a09566-448c-7075-bd19-ef317d35572e','baabuur raac',5.00,NULL,'01a09566-446d-729b-bd2b-96474b4f37f1','Mohamed','cash','01a09566-446d-729b-bd2b-96474b4f37f1','2026-09-12 10:41:48','2026-09-12 10:41:48');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `items` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `item_code` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'product',
  `barcode` varchar(255) DEFAULT NULL,
  `cost_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sell_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `low_stock_threshold` int(11) NOT NULL DEFAULT 5,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `items_store_id_foreign` (`store_id`),
  CONSTRAINT `items_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES ('1ec5d4ca-3002-4a5a-a46a-f8986de53476','01a09566-448c-7075-bd19-ef317d35572e','#002','Book','product','6982017587016',2.00,5.00,10,5,1,'2026-09-15 06:30:31','2026-09-23 10:45:42',NULL),('7c6cb479-7a70-4aa6-9270-7651a15734d1','01a09566-448c-7075-bd19-ef317d35572e','#001','mobile','product',NULL,50.00,100.00,1,5,1,'2026-09-12 10:35:08','2026-09-23 12:18:53','Mobile');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `license_extensions`
--

DROP TABLE IF EXISTS `license_extensions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `license_extensions` (
  `id` char(36) NOT NULL,
  `license_id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `old_expiry_date` varchar(255) NOT NULL,
  `new_expiry_date` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `activation_time` timestamp NULL DEFAULT NULL,
  `admin_id` char(36) NOT NULL,
  `activated_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `license_extensions_license_id_foreign` (`license_id`),
  KEY `license_extensions_store_id_foreign` (`store_id`),
  KEY `license_extensions_admin_id_foreign` (`admin_id`),
  CONSTRAINT `license_extensions_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `license_extensions_license_id_foreign` FOREIGN KEY (`license_id`) REFERENCES `licenses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `license_extensions_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `license_extensions`
--

LOCK TABLES `license_extensions` WRITE;
/*!40000 ALTER TABLE `license_extensions` DISABLE KEYS */;
/*!40000 ALTER TABLE `license_extensions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `licenses`
--

DROP TABLE IF EXISTS `licenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `licenses` (
  `id` char(36) NOT NULL,
  `license_key` varchar(255) NOT NULL,
  `owner_user_id` char(36) NOT NULL,
  `store_id` char(36) DEFAULT NULL,
  `plan_id` char(36) NOT NULL,
  `max_users` int(11) NOT NULL DEFAULT 0,
  `max_devices` int(11) NOT NULL DEFAULT 0,
  `start_date` timestamp NULL DEFAULT NULL,
  `expiry_date` timestamp NULL DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `features_enabled` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features_enabled`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `licenses_owner_user_id_foreign` (`owner_user_id`),
  KEY `licenses_store_id_foreign` (`store_id`),
  KEY `licenses_plan_id_foreign` (`plan_id`),
  CONSTRAINT `licenses_owner_user_id_foreign` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `licenses_plan_id_foreign` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `licenses_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `licenses`
--

LOCK TABLES `licenses` WRITE;
/*!40000 ALTER TABLE `licenses` DISABLE KEYS */;
INSERT INTO `licenses` VALUES ('01a09596-9d73-7282-a246-fb2385de2e83','ZHP-M08K-SPEL','01a09566-446d-729b-bd2b-96474b4f37f1',NULL,'01a09592-8945-7369-b568-d2b41ab642c1',24,1,'2026-09-11 21:00:00','2026-10-11 21:00:00','active','{\"pos_sales\":true,\"inventory\":true,\"customers\":true,\"credit_sales\":true,\"expenses\":true,\"cash_flow\":true,\"staff_accounts\":true,\"advanced_reports\":true,\"multi_store\":true,\"api_integrations\":true,\"payment_integrations\":true,\"stock_transfers\":true,\"suppliers\":true,\"returns\":true,\"receipt_history\":true,\"stock_report\":true}','2026-09-12 09:27:51','2026-09-14 13:29:32'),('01a09596-addd-7033-978e-8ca4d5d27495','ZHP-F82L-52GS','01a09566-446d-729b-bd2b-96474b4f37f1',NULL,'01a09592-8945-7369-b568-d2b41ab642c1',24,1,'2026-09-11 21:00:00','2026-10-11 21:00:00','suspended','{\"pos_sales\":true,\"inventory\":true,\"customers\":true,\"credit_sales\":true,\"expenses\":true,\"cash_flow\":true,\"staff_accounts\":true,\"advanced_reports\":true,\"multi_store\":true,\"api_integrations\":true,\"payment_integrations\":true,\"stock_transfers\":true,\"suppliers\":true,\"returns\":true,\"receipt_history\":true,\"stock_report\":true}','2026-09-12 09:27:55','2026-09-12 10:43:37');
/*!40000 ALTER TABLE `licenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_09_12_094159_create_personal_access_tokens_table',1),(5,'2026_09_12_094252_create_maaldhis_tables',1),(6,'2026_09_12_094300_create_missing_tables',2),(7,'2026_09_12_121839_add_missing_columns_to_plans_table',3),(8,'2026_09_12_123406_add_missing_columns_to_subscriptions',4),(9,'2026_09_12_130505_add_preferences_to_stores',5),(10,'2026_09_12_130629_add_missing_store_fields_to_stores',6),(11,'2026_09_12_130731_rename_receipt_footer_to_receipt_footer_text',7),(12,'2026_09_12_132213_fix_nullable_columns_in_items',8),(13,'2026_09_12_132243_fix_nullable_string_columns_in_all_tables',9),(14,'2026_09_12_132409_fix_staff_accounts_nullable',10),(15,'2026_09_13_122726_add_user_id_to_staff_accounts',11),(16,'2026_09_13_131241_add_category_to_items_table',12),(17,'2026_09_14_134611_create_categories_table',13),(18,'2026_09_14_151154_add_tax_rate_to_stores_and_sales',14),(19,'2026_09_15_092932_make_category_nullable_in_items_table',15);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_accounts`
--

DROP TABLE IF EXISTS `payment_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_accounts` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `account_name` varchar(255) NOT NULL,
  `account_number` varchar(255) DEFAULT NULL,
  `provider_name` varchar(255) DEFAULT NULL,
  `account_type` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_accounts_store_id_foreign` (`store_id`),
  CONSTRAINT `payment_accounts_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_accounts`
--

LOCK TABLES `payment_accounts` WRITE;
/*!40000 ALTER TABLE `payment_accounts` DISABLE KEYS */;
INSERT INTO `payment_accounts` VALUES ('695430f7-ccab-42b5-87bd-2a843b45ceca','01a09566-448c-7075-bd19-ef317d35572e','Cash',NULL,NULL,'Cash',1,NULL,NULL),('6ee81129-4ecf-48f3-83fd-750a396dbee7','01a09566-448c-7075-bd19-ef317d35572e','Marchent','737061','Mohamed','Mobile Money',1,'2026-09-14 11:32:03','2026-09-14 11:32:03');
/*!40000 ALTER TABLE `payment_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_integrations`
--

DROP TABLE IF EXISTS `payment_integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_integrations` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `provider_name` varchar(255) DEFAULT NULL,
  `consumer_key` varchar(255) DEFAULT NULL,
  `consumer_secret_encrypted` varchar(255) DEFAULT NULL,
  `passkey_encrypted` varchar(255) DEFAULT NULL,
  `shortcode` varchar(255) DEFAULT NULL,
  `initiator_name` varchar(255) DEFAULT NULL,
  `security_credential_encrypted` varchar(255) DEFAULT NULL,
  `callback_url` varchar(255) DEFAULT NULL,
  `validation_url` varchar(255) DEFAULT NULL,
  `confirmation_url` varchar(255) DEFAULT NULL,
  `environment` varchar(255) DEFAULT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(255) DEFAULT NULL,
  `last_tested_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_integrations_store_id_foreign` (`store_id`),
  CONSTRAINT `payment_integrations_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_integrations`
--

LOCK TABLES `payment_integrations` WRITE;
/*!40000 ALTER TABLE `payment_integrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_integrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_sessions`
--

DROP TABLE IF EXISTS `payment_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_sessions` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `plan_id` char(36) NOT NULL,
  `amount` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `billing_cycle` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `checkout_request_id` varchar(255) DEFAULT NULL,
  `expired_reason` varchar(255) DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_sessions_store_id_foreign` (`store_id`),
  KEY `payment_sessions_plan_id_foreign` (`plan_id`),
  CONSTRAINT `payment_sessions_plan_id_foreign` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_sessions_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_sessions`
--

LOCK TABLES `payment_sessions` WRITE;
/*!40000 ALTER TABLE `payment_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `sale_id` char(36) DEFAULT NULL,
  `customer_id` char(36) DEFAULT NULL,
  `supplier_id` char(36) DEFAULT NULL,
  `payment_type` varchar(255) NOT NULL DEFAULT 'sale',
  `direction` varchar(255) NOT NULL DEFAULT 'in',
  `method` varchar(255) NOT NULL DEFAULT 'cash',
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `reference` varchar(255) NOT NULL DEFAULT '',
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_store_id_foreign` (`store_id`),
  KEY `payments_sale_id_foreign` (`sale_id`),
  KEY `payments_customer_id_foreign` (`customer_id`),
  KEY `payments_supplier_id_foreign` (`supplier_id`),
  KEY `payments_created_by_foreign` (`created_by`),
  CONSTRAINT `payments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `payments_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES ('138aeacc-68e7-4323-a8a0-ed5d22a09901','01a09566-448c-7075-bd19-ef317d35572e','1b8173b3-6466-41a8-b776-2d538d83bbfd',NULL,NULL,'sale','in','Cash',5.25,'RCP-1790171140902','01a09566-446d-729b-bd2b-96474b4f37f1','2026-09-23 10:45:43','2026-09-23 10:45:43'),('44b5e832-b4df-4a22-b4bc-58ae28589489','01a09566-448c-7075-bd19-ef317d35572e','4aac7188-ac68-4950-aa09-2721026aa0ee',NULL,NULL,'sale','in','Cash',100.00,'RCP-1789395197281','01a09566-446d-729b-bd2b-96474b4f37f1','2026-09-14 11:13:20','2026-09-14 11:13:20'),('658bdee1-6a48-4231-a6ee-2eeb4d624feb','01a09566-448c-7075-bd19-ef317d35572e','0ba9b616-1fc0-4836-a0f2-9c5ae85999c2',NULL,NULL,'sale','in','Marchent',105.00,'RCP-1789399343839','01a09566-446d-729b-bd2b-96474b4f37f1','2026-09-14 12:22:26','2026-09-14 12:22:26'),('746e1f55-612e-45fb-b924-ff6edc1e75af','01a09566-448c-7075-bd19-ef317d35572e','8795e4d4-3141-4c67-9579-435e0fccd5aa',NULL,NULL,'sale','in','Marchent',100.00,'RCP-1789396351399','01a09566-446d-729b-bd2b-96474b4f37f1','2026-09-14 11:32:34','2026-09-14 11:32:34'),('80529125-1de6-41f9-bef1-5dbe658c5683','01a09566-448c-7075-bd19-ef317d35572e','e7b81239-39f6-46a1-b333-06e560e3b615',NULL,NULL,'sale','in','Cash',100.00,'RCP-1789220126562','01a09566-446d-729b-bd2b-96474b4f37f1','2026-09-12 10:35:31','2026-09-12 10:35:31'),('8f403c26-827b-4c25-ba4c-20939b5b3265','01a09566-448c-7075-bd19-ef317d35572e','03faf5ff-763c-45e3-8fcc-69ebac720d5c',NULL,NULL,'sale','in','Cash',105.00,'RCP-1790176731757','01a09566-446d-729b-bd2b-96474b4f37f1','2026-09-23 12:18:53','2026-09-23 12:18:53'),('f3807476-c191-4e6e-bdc2-2da1f8128fd7','01a09566-448c-7075-bd19-ef317d35572e','4aac7188-ac68-4950-aa09-2721026aa0ee',NULL,NULL,'sale','out','cash',-100.00,'REFUND-c3a9a9f2','01a09566-446d-729b-bd2b-96474b4f37f1','2026-09-14 12:14:02','2026-09-14 12:14:02');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` char(36) NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User','01a09519-d36d-712c-af7f-0c01ee2a1aaa','auth_token','1ce5e133c404aed16d9f0b588388b420900bbe37e6a895ad379331cbbfdab72b','[\"*\"]',NULL,NULL,'2026-09-12 07:11:32','2026-09-12 07:11:32'),(2,'App\\Models\\User','01a0951c-91cf-7144-acaf-0b67307c3cd9','auth_token','0d1b24f686fb2bd54cae34e32fd02c82240345494669cab4c41f849001fffb56','[\"*\"]',NULL,NULL,'2026-09-12 07:14:32','2026-09-12 07:14:32'),(3,'App\\Models\\User','01a0951d-74d1-72b0-9f28-3d8f810e383f','auth_token','e388fbd31a54932c89b527dfd5a72a51b0121a74e650e82ff413497eb72bf230','[\"*\"]',NULL,NULL,'2026-09-12 07:15:30','2026-09-12 07:15:30'),(4,'App\\Models\\User','01a09566-446d-729b-bd2b-96474b4f37f1','auth_token','a1c01f0c3c45678754ea5f4c73f0a882e4a91cae203ff42eb4f90d13d52c7389','[\"*\"]',NULL,NULL,'2026-09-12 08:35:02','2026-09-12 08:35:02'),(5,'App\\Models\\User','01a09566-446d-729b-bd2b-96474b4f37f1','auth_token','3831a62a8c8e193f7e94879daa93994e344f85d38cf589564884cf91ab61ac2c','[\"*\"]','2026-09-12 08:35:14',NULL,'2026-09-12 08:35:03','2026-09-12 08:35:14'),(9,'App\\Models\\User','01a09566-446d-729b-bd2b-96474b4f37f1','auth_token','1c2c223b140f92d6c34e3f4525b5463201d2abec5b763662f7fed247d14f7fd7','[\"*\"]','2026-09-12 09:12:14',NULL,'2026-09-12 09:11:47','2026-09-12 09:12:14'),(11,'App\\Models\\User','01a0956d-91f7-729f-a258-62daade1e660','auth_token','805611229a827eb1bd7142644d3ef3d08a206b9d7277c0c6561b69ed98cd2a71','[\"*\"]','2026-09-12 09:13:39',NULL,'2026-09-12 09:13:36','2026-09-12 09:13:39'),(13,'App\\Models\\User','01a09566-446d-729b-bd2b-96474b4f37f1','auth_token','0fbd1b2d2e011335223fae33275e47cef9c3b0f42d2ef73f37941b31dc929f2a','[\"*\"]','2026-09-12 11:36:21',NULL,'2026-09-12 09:29:01','2026-09-12 11:36:21'),(14,'App\\Models\\User','01a09519-d36d-712c-af7f-0c01ee2a1aaa','test','d779643f680fd133729f560f3748a0213b904314ec31f0f573210c2b9e0b5475','[\"*\"]','2026-09-12 10:34:25',NULL,'2026-09-12 10:21:13','2026-09-12 10:34:25'),(15,'App\\Models\\User','01a0956d-91f7-729f-a258-62daade1e660','auth_token','79b19b26bb4f797ff156dd08bfc5c002fc7a4eeaf496287f961237f54f2b5399','[\"*\"]','2026-09-12 10:39:09',NULL,'2026-09-12 10:39:03','2026-09-12 10:39:09'),(16,'App\\Models\\User','01a0956d-91f7-729f-a258-62daade1e660','auth_token','f7bba055627feb64eef058c6c114c34f5c6fdb7828ef388c4c3ada6c2476f7e9','[\"*\"]','2026-09-12 11:36:17',NULL,'2026-09-12 10:39:12','2026-09-12 11:36:17'),(17,'App\\Models\\User','01a09566-446d-729b-bd2b-96474b4f37f1','auth_token','68aaccfbd631d972a75403791bd932b8de0c52dc501e4d66b9c7084293701cb0','[\"*\"]','2026-09-12 12:39:44',NULL,'2026-09-12 12:37:16','2026-09-12 12:39:44'),(18,'App\\Models\\User','01a09566-446d-729b-bd2b-96474b4f37f1','auth_token','ce7be9c2690abc126303e31caf2e034d6c96a70420ece90c047b2aec66c55855','[\"*\"]','2026-09-13 04:53:01',NULL,'2026-09-13 03:45:40','2026-09-13 04:53:01'),(19,'App\\Models\\User','01a09566-446d-729b-bd2b-96474b4f37f1','auth_token','0ea32d239a1a8535f384fbff0b0162a98a7875a22d5fae62fb336c4b7d257b42','[\"*\"]','2026-09-13 09:16:59',NULL,'2026-09-13 09:00:36','2026-09-13 09:16:59'),(25,'App\\Models\\User','01a09566-446d-729b-bd2b-96474b4f37f1','auth_token','947b897fe6f5ad63a74b37b0099a3fe0d63724ccf444fc88efe8bdb17f88939a','[\"*\"]','2026-09-14 05:13:40',NULL,'2026-09-13 09:50:46','2026-09-14 05:13:40'),(26,'App\\Models\\User','01a09566-446d-729b-bd2b-96474b4f37f1','auth_token','81473e1dbd60da3397164a928845b74b18ce830a50bb6f945ebde37bbd247d01','[\"*\"]','2026-09-14 05:13:51',NULL,'2026-09-14 05:13:43','2026-09-14 05:13:51'),(27,'App\\Models\\User','01a09566-446d-729b-bd2b-96474b4f37f1','test','015a5d56ad80f17c9581100f39462dd8e22529f78a534e4253cc208077ade44c','[\"*\"]','2026-09-14 10:29:07',NULL,'2026-09-14 06:22:18','2026-09-14 10:29:07');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `plans` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `max_users` int(11) NOT NULL DEFAULT 0,
  `max_devices` int(11) NOT NULL DEFAULT 0,
  `max_stores` int(11) NOT NULL DEFAULT 1,
  `storage_limit` int(11) NOT NULL DEFAULT 1,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monthly_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `yearly_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `duration` varchar(255) NOT NULL DEFAULT 'monthly',
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plans`
--

LOCK TABLES `plans` WRITE;
/*!40000 ALTER TABLE `plans` DISABLE KEYS */;
INSERT INTO `plans` VALUES ('01a09592-8945-7369-b568-d2b41ab642c1','free',24,1,1,1,0.00,0.00,0.00,'monthly','{\"pos_sales\":true,\"inventory\":true,\"customers\":true,\"credit_sales\":true,\"expenses\":true,\"cash_flow\":true,\"staff_accounts\":true,\"advanced_reports\":true,\"multi_store\":true,\"api_integrations\":true,\"payment_integrations\":true,\"stock_transfers\":true,\"suppliers\":true,\"returns\":true,\"receipt_history\":true,\"stock_report\":true}',1,'2026-09-12 09:23:23','2026-09-12 09:23:23');
/*!40000 ALTER TABLE `plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platform_payments`
--

DROP TABLE IF EXISTS `platform_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `platform_payments` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(255) NOT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `reference_number` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platform_payments`
--

LOCK TABLES `platform_payments` WRITE;
/*!40000 ALTER TABLE `platform_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `platform_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `return_items`
--

DROP TABLE IF EXISTS `return_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `return_items` (
  `id` char(36) NOT NULL,
  `return_id` char(36) NOT NULL,
  `sale_item_id` char(36) NOT NULL,
  `item_id` char(36) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `return_items_return_id_foreign` (`return_id`),
  KEY `return_items_sale_item_id_foreign` (`sale_item_id`),
  KEY `return_items_item_id_foreign` (`item_id`),
  CONSTRAINT `return_items_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `return_items_return_id_foreign` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `return_items_sale_item_id_foreign` FOREIGN KEY (`sale_item_id`) REFERENCES `sale_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `return_items`
--

LOCK TABLES `return_items` WRITE;
/*!40000 ALTER TABLE `return_items` DISABLE KEYS */;
INSERT INTO `return_items` VALUES ('5c137a70-9cd4-4571-8bd2-c61a406fa0be','c3a9a9f2-1060-4f6c-93e3-6ce88f63cfc8','0acca303-19c7-45b9-bccd-dc4dcf7a46e6','7c6cb479-7a70-4aa6-9270-7651a15734d1',1,100.00,'2026-09-14 12:14:02','2026-09-14 12:14:02');
/*!40000 ALTER TABLE `return_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `returns`
--

DROP TABLE IF EXISTS `returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `returns` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `sale_id` char(36) NOT NULL,
  `processed_by` char(36) NOT NULL,
  `refund_method` varchar(255) NOT NULL DEFAULT 'cash',
  `refund_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `returns_store_id_foreign` (`store_id`),
  KEY `returns_sale_id_foreign` (`sale_id`),
  KEY `returns_processed_by_foreign` (`processed_by`),
  CONSTRAINT `returns_processed_by_foreign` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `returns_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `returns_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `returns`
--

LOCK TABLES `returns` WRITE;
/*!40000 ALTER TABLE `returns` DISABLE KEYS */;
INSERT INTO `returns` VALUES ('c3a9a9f2-1060-4f6c-93e3-6ce88f63cfc8','01a09566-448c-7075-bd19-ef317d35572e','4aac7188-ac68-4950-aa09-2721026aa0ee','01a09566-446d-729b-bd2b-96474b4f37f1','cash',100.00,'2026-09-14 12:14:02','2026-09-14 12:14:02');
/*!40000 ALTER TABLE `returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sale_items` (
  `id` char(36) NOT NULL,
  `sale_id` char(36) NOT NULL,
  `item_id` char(36) NOT NULL,
  `item_name` varchar(255) NOT NULL DEFAULT '',
  `quantity` int(11) NOT NULL DEFAULT 1,
  `cost_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sell_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_items_sale_id_foreign` (`sale_id`),
  KEY `sale_items_item_id_foreign` (`item_id`),
  CONSTRAINT `sale_items_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sale_items_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES ('0acca303-19c7-45b9-bccd-dc4dcf7a46e6','4aac7188-ac68-4950-aa09-2721026aa0ee','7c6cb479-7a70-4aa6-9270-7651a15734d1','mobile',0,50.00,100.00,0.00,NULL,'2026-09-14 12:14:02'),('13267970-8645-40ca-9311-66707d65051e','1b8173b3-6466-41a8-b776-2d538d83bbfd','1ec5d4ca-3002-4a5a-a46a-f8986de53476','Book',1,2.00,5.00,5.00,NULL,NULL),('542da580-a44e-49b7-9750-35606487f304','0ba9b616-1fc0-4836-a0f2-9c5ae85999c2','7c6cb479-7a70-4aa6-9270-7651a15734d1','mobile',1,50.00,100.00,100.00,NULL,NULL),('aca3706d-35ad-4212-8397-1852b842b908','03faf5ff-763c-45e3-8fcc-69ebac720d5c','7c6cb479-7a70-4aa6-9270-7651a15734d1','mobile',1,50.00,100.00,100.00,NULL,NULL),('acaae1c4-66fd-4ffe-9904-f9a85e41902b','e7b81239-39f6-46a1-b333-06e560e3b615','7c6cb479-7a70-4aa6-9270-7651a15734d1','mobile',1,50.00,100.00,100.00,NULL,NULL),('f32334fd-41ae-4fb3-ad5d-d7aeef5d4d73','8795e4d4-3141-4c67-9579-435e0fccd5aa','7c6cb479-7a70-4aa6-9270-7651a15734d1','mobile',1,50.00,100.00,100.00,NULL,NULL);
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `receipt_no` varchar(255) NOT NULL,
  `customer_id` char(36) DEFAULT NULL,
  `staff_user_id` char(36) NOT NULL,
  `sale_type` varchar(255) NOT NULL DEFAULT 'cash',
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `outstanding_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` varchar(255) NOT NULL DEFAULT 'completed',
  `sold_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `sales_store_id_foreign` (`store_id`),
  KEY `sales_customer_id_foreign` (`customer_id`),
  KEY `sales_staff_user_id_foreign` (`staff_user_id`),
  CONSTRAINT `sales_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_staff_user_id_foreign` FOREIGN KEY (`staff_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `sales_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES ('03faf5ff-763c-45e3-8fcc-69ebac720d5c','01a09566-448c-7075-bd19-ef317d35572e','RCP-1790176731757',NULL,'01a09566-446d-729b-bd2b-96474b4f37f1','cash',100.00,0.00,5.00,105.00,105.00,0.00,'completed','2026-09-23 15:18:52','2026-09-23 12:18:52','2026-09-23 12:18:52',5.00),('0ba9b616-1fc0-4836-a0f2-9c5ae85999c2','01a09566-448c-7075-bd19-ef317d35572e','RCP-1789399343839',NULL,'01a09566-446d-729b-bd2b-96474b4f37f1','cash',100.00,0.00,5.00,105.00,105.00,0.00,'completed','2026-09-14 15:22:24','2026-09-14 12:22:24','2026-09-14 12:22:24',5.00),('1b8173b3-6466-41a8-b776-2d538d83bbfd','01a09566-448c-7075-bd19-ef317d35572e','RCP-1790171140902',NULL,'01a09566-446d-729b-bd2b-96474b4f37f1','cash',5.00,0.00,0.25,5.25,5.25,0.00,'completed','2026-09-23 13:45:41','2026-09-23 10:45:41','2026-09-23 10:45:41',5.00),('4aac7188-ac68-4950-aa09-2721026aa0ee','01a09566-448c-7075-bd19-ef317d35572e','RCP-1789395197281',NULL,'01a09566-446d-729b-bd2b-96474b4f37f1','cash',0.00,0.00,0.00,0.00,0.00,0.00,'returned','2026-09-14 14:13:17','2026-09-14 11:13:17','2026-09-14 12:14:02',0.00),('8795e4d4-3141-4c67-9579-435e0fccd5aa','01a09566-448c-7075-bd19-ef317d35572e','RCP-1789396351399',NULL,'01a09566-446d-729b-bd2b-96474b4f37f1','cash',100.00,0.00,0.00,100.00,100.00,0.00,'completed','2026-09-14 14:32:32','2026-09-14 11:32:32','2026-09-14 11:32:32',0.00),('e7b81239-39f6-46a1-b333-06e560e3b615','01a09566-448c-7075-bd19-ef317d35572e','RCP-1789220126562',NULL,'01a09566-446d-729b-bd2b-96474b4f37f1','cash',100.00,0.00,0.00,100.00,100.00,0.00,'completed','2026-09-12 13:35:27','2026-09-12 10:35:27','2026-09-12 10:35:27',0.00);
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('9FODJAALPlRVsTxY6aJYsJ9IYROBzMgLIfvgKVX0','01a09566-446d-729b-bd2b-96474b4f37f1','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0','YTo1OntzOjY6Il90b2tlbiI7czo0MDoicnBNZkFDNkN3emVlSE1jdndoZXVIMGc2SDJxdEk3aFhLckd6b1Q0TyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzE6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9kYXNoYm9hcmQiO3M6NToicm91dGUiO3M6OToiZGFzaGJvYXJkIjt9czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO3M6MzY6IjAxYTA5NTY2LTQ0NmQtNzI5Yi1iZDJiLTk2NDc0YjRmMzdmMSI7czoxNzoicGFzc3dvcmRfaGFzaF93ZWIiO3M6NjQ6IjkwM2ViOWZkN2U0MGVkNGNjMWM0OWJkMzVlMWNjMGQzMmRlMGM3Yjg5YzU1ZDU4MmZjZmUxZjU0ODBiNGZiNDgiO30=',1790404936),('hhqNOsxDIOdz8pGKOY9QFOefVtrz8xrCuwAQv78A','01a09566-446d-729b-bd2b-96474b4f37f1','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0','YTo2OntzOjY6Il90b2tlbiI7czo0MDoiYlFXU3VOVjhzc2g4UVBwczI0R0I0SVlBVW0yeUZNdFplNndtSW8yVyI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czozMDoiaHR0cDovL21hYWxkaGlzLnRlc3QvZGFzaGJvYXJkIjt9czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHA6Ly9tYWFsZGhpcy50ZXN0L3NhbGVzLXJlcG9ydCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO3M6MzY6IjAxYTA5NTY2LTQ0NmQtNzI5Yi1iZDJiLTk2NDc0YjRmMzdmMSI7czoxNzoicGFzc3dvcmRfaGFzaF93ZWIiO3M6NjQ6IjkwM2ViOWZkN2U0MGVkNGNjMWM0OWJkMzVlMWNjMGQzMmRlMGM3Yjg5YzU1ZDU4MmZjZmUxZjU0ODBiNGZiNDgiO30=',1790404810);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_accounts`
--

DROP TABLE IF EXISTS `staff_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `staff_accounts` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'cashier',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `staff_accounts_store_id_foreign` (`store_id`),
  KEY `staff_accounts_user_id_foreign` (`user_id`),
  CONSTRAINT `staff_accounts_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `staff_accounts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_accounts`
--

LOCK TABLES `staff_accounts` WRITE;
/*!40000 ALTER TABLE `staff_accounts` DISABLE KEYS */;
INSERT INTO `staff_accounts` VALUES ('ab4381da-aac2-4873-a977-5c53d7695746','01a09566-448c-7075-bd19-ef317d35572e','xasan','asxaabteyda@gmail.com',NULL,'cashier',1,'2026-09-13 09:17:46','2026-09-13 09:49:53','b8d8c15d-e341-4b71-a972-a7dab1355ef0');
/*!40000 ALTER TABLE `staff_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfer_items`
--

DROP TABLE IF EXISTS `stock_transfer_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_transfer_items` (
  `id` char(36) NOT NULL,
  `stock_transfer_id` char(36) NOT NULL,
  `item_id` char(36) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_transfer_items_stock_transfer_id_foreign` (`stock_transfer_id`),
  KEY `stock_transfer_items_item_id_foreign` (`item_id`),
  CONSTRAINT `stock_transfer_items_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_transfer_items_stock_transfer_id_foreign` FOREIGN KEY (`stock_transfer_id`) REFERENCES `stock_transfers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfer_items`
--

LOCK TABLES `stock_transfer_items` WRITE;
/*!40000 ALTER TABLE `stock_transfer_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfer_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfers`
--

DROP TABLE IF EXISTS `stock_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_transfers` (
  `id` char(36) NOT NULL,
  `source_store_id` char(36) NOT NULL,
  `destination_store_id` char(36) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `requested_by` char(36) NOT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `received_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_transfers_source_store_id_foreign` (`source_store_id`),
  KEY `stock_transfers_destination_store_id_foreign` (`destination_store_id`),
  KEY `stock_transfers_requested_by_foreign` (`requested_by`),
  KEY `stock_transfers_approved_by_foreign` (`approved_by`),
  KEY `stock_transfers_received_by_foreign` (`received_by`),
  CONSTRAINT `stock_transfers_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `stock_transfers_destination_store_id_foreign` FOREIGN KEY (`destination_store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_transfers_received_by_foreign` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`),
  CONSTRAINT `stock_transfers_requested_by_foreign` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  CONSTRAINT `stock_transfers_source_store_id_foreign` FOREIGN KEY (`source_store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfers`
--

LOCK TABLES `stock_transfers` WRITE;
/*!40000 ALTER TABLE `stock_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stores` (
  `id` char(36) NOT NULL,
  `owner_user_id` char(36) NOT NULL,
  `store_name` varchar(255) NOT NULL,
  `store_code` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `currency` varchar(255) NOT NULL DEFAULT 'KSh',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `tax_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `low_stock_threshold` int(11) NOT NULL DEFAULT 5,
  `receipt_footer_text` varchar(255) DEFAULT '''Thank you for shopping with us!''',
  `logo_url` varchar(255) DEFAULT NULL,
  `show_logo_on_receipt` tinyint(1) NOT NULL DEFAULT 0,
  `receipt_thank_you_message` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `stores_owner_user_id_foreign` (`owner_user_id`),
  CONSTRAINT `stores_owner_user_id_foreign` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES ('01a09566-448c-7075-bd19-ef317d35572e','01a09566-446d-729b-bd2b-96474b4f37f1','7 Star Electronics','','Suuqbacad','615331989','$','2026-09-12 08:35:02','2026-09-23 12:29:11',1,5,'Thank you for shopping with us!',NULL,0,'Thank you for your purchase!',NULL,5.00);
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscriptions` (
  `id` char(36) NOT NULL,
  `owner_user_id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `plan_id` char(36) NOT NULL,
  `billing_cycle` varchar(255) NOT NULL DEFAULT 'monthly',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `current_period_start` timestamp NULL DEFAULT NULL,
  `current_period_end` timestamp NULL DEFAULT NULL,
  `cancel_at_period_end` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suppliers` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `supplier_code` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `suppliers_store_id_foreign` (`store_id`),
  CONSTRAINT `suppliers_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_tickets`
--

DROP TABLE IF EXISTS `support_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `support_tickets` (
  `id` char(36) NOT NULL,
  `store_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'open',
  `priority` varchar(255) NOT NULL DEFAULT 'normal',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_tickets`
--

LOCK TABLES `support_tickets` WRITE;
/*!40000 ALTER TABLE `support_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_settings` (
  `id` char(36) NOT NULL,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_setting_key_unique` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL DEFAULT '',
  `phone` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('01a09519-d36d-712c-af7f-0c01ee2a1aaa','Test User','','','test2@example.com',NULL,'$2y$12$7wmilEa82tExyPwUsMKoIOWMpYUBZexG8oI0vYJwkE16qxMq0MI6.',NULL,'2026-09-12 07:11:32','2026-09-12 07:11:32'),('01a0951c-91cf-7144-acaf-0b67307c3cd9','Test User','','','test3@example.com',NULL,'$2y$12$E9n3.oVf8KlchrttDe.UPuYvldHEcteu7a7PPoVM/n8SOrGWI6M1O',NULL,'2026-09-12 07:14:32','2026-09-12 07:14:32'),('01a0951d-74d1-72b0-9f28-3d8f810e383f','Test','','','test5@example.com',NULL,'$2y$12$onJwPE7YmB47oXEW4SjxTek2e0C63Peg/sYZ.oL.5yxCP6fiRLqPe',NULL,'2026-09-12 07:15:30','2026-09-12 07:15:30'),('01a09566-446d-729b-bd2b-96474b4f37f1','Mohamed','Mohamed','','Mahamedsomali15@gmail.com',NULL,'$2y$12$9wGJYf8idPP8MKY7njy6WO9TRiocfyeP4h.tgLzqqg9iXZMKeuJJO',NULL,'2026-09-12 08:35:02','2026-09-12 08:35:02'),('01a0956d-1a91-728b-a5b0-bdd476c73323','Super Admin','Super Admin','123456789','admin@maaldhis.com',NULL,'$2y$12$myvJM/DfddWhV6LezempVeddSEffpQyfXUk0KI3A29yojrUsNaqT.',NULL,'2026-09-12 08:42:30','2026-09-12 08:42:30'),('01a0956d-91f7-729f-a258-62daade1e660','Super Admin','Super Admin','123456789','superadmin@maaldhis.com',NULL,'$2y$12$NX5VVjCE24g7bKmbZXK6tuk5kKms5B0gHzwZtfKOG4raIdhgX4Ytu',NULL,'2026-09-12 08:43:01','2026-09-12 08:43:01'),('b8d8c15d-e341-4b71-a972-a7dab1355ef0','xasan','xasan','','asxaabteyda@gmail.com',NULL,'$2y$12$IKMOgIsfnis4wB5eAuvMtuYuz8JFfDEdHL0ZfwDnuX2wYTZDG0wPu',NULL,'2026-09-13 09:17:46','2026-09-13 09:17:46');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-26  9:47:18
