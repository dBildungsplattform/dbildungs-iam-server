/*!999999\- enable the sandbox mode */
-- MariaDB dump 10.19-11.4.2-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database:
-- ------------------------------------------------------
-- Server version	11.4.2-MariaDB-ubu2404

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Current Database: `ducsxqm001`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `ducsxqm001` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;

USE `ducsxqm001`;

--
-- Sequence structure for `audit_seq`
--

DROP SEQUENCE IF EXISTS `audit_seq`;
CREATE SEQUENCE `audit_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`audit_seq`, 1001, 0);

--
-- Sequence structure for `authcache_seq`
--

DROP SEQUENCE IF EXISTS `authcache_seq`;
CREATE SEQUENCE `authcache_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`authcache_seq`, 1, 0);

--
-- Sequence structure for `caconfig_seq`
--

DROP SEQUENCE IF EXISTS `caconfig_seq`;
CREATE SEQUENCE `caconfig_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`caconfig_seq`, 1, 0);

--
-- Sequence structure for `caconnector_seq`
--

DROP SEQUENCE IF EXISTS `caconnector_seq`;
CREATE SEQUENCE `caconnector_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`caconnector_seq`, 1, 0);

--
-- Sequence structure for `challenge_seq`
--

DROP SEQUENCE IF EXISTS `challenge_seq`;
CREATE SEQUENCE `challenge_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`challenge_seq`, 1, 0);

--
-- Sequence structure for `clientapp_seq`
--

DROP SEQUENCE IF EXISTS `clientapp_seq`;
CREATE SEQUENCE `clientapp_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`clientapp_seq`, 1, 0);

--
-- Sequence structure for `customuserattribute_seq`
--

DROP SEQUENCE IF EXISTS `customuserattribute_seq`;
CREATE SEQUENCE `customuserattribute_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`customuserattribute_seq`, 1, 0);

--
-- Sequence structure for `eventcounter_seq`
--

DROP SEQUENCE IF EXISTS `eventcounter_seq`;
CREATE SEQUENCE `eventcounter_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`eventcounter_seq`, 1, 0);

--
-- Sequence structure for `eventhandler_seq`
--

DROP SEQUENCE IF EXISTS `eventhandler_seq`;
CREATE SEQUENCE `eventhandler_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`eventhandler_seq`, 1, 0);

--
-- Sequence structure for `eventhandlercond_seq`
--

DROP SEQUENCE IF EXISTS `eventhandlercond_seq`;
CREATE SEQUENCE `eventhandlercond_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`eventhandlercond_seq`, 1, 0);

--
-- Sequence structure for `eventhandleropt_seq`
--

DROP SEQUENCE IF EXISTS `eventhandleropt_seq`;
CREATE SEQUENCE `eventhandleropt_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`eventhandleropt_seq`, 1, 0);

--
-- Sequence structure for `machineresolver_seq`
--

DROP SEQUENCE IF EXISTS `machineresolver_seq`;
CREATE SEQUENCE `machineresolver_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`machineresolver_seq`, 1, 0);

--
-- Sequence structure for `machineresolverconf_seq`
--

DROP SEQUENCE IF EXISTS `machineresolverconf_seq`;
CREATE SEQUENCE `machineresolverconf_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`machineresolverconf_seq`, 1, 0);

--
-- Sequence structure for `machinetoken_seq`
--

DROP SEQUENCE IF EXISTS `machinetoken_seq`;
CREATE SEQUENCE `machinetoken_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`machinetoken_seq`, 1, 0);

--
-- Sequence structure for `machtokenopt_seq`
--

DROP SEQUENCE IF EXISTS `machtokenopt_seq`;
CREATE SEQUENCE `machtokenopt_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`machtokenopt_seq`, 1, 0);

--
-- Sequence structure for `monitoringstats_seq`
--

DROP SEQUENCE IF EXISTS `monitoringstats_seq`;
CREATE SEQUENCE `monitoringstats_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`monitoringstats_seq`, 1, 0);

--
-- Sequence structure for `periodictask_seq`
--

DROP SEQUENCE IF EXISTS `periodictask_seq`;
CREATE SEQUENCE `periodictask_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`periodictask_seq`, 1, 0);

--
-- Sequence structure for `periodictasklastrun_seq`
--

DROP SEQUENCE IF EXISTS `periodictasklastrun_seq`;
CREATE SEQUENCE `periodictasklastrun_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`periodictasklastrun_seq`, 1, 0);

--
-- Sequence structure for `periodictaskopt_seq`
--

DROP SEQUENCE IF EXISTS `periodictaskopt_seq`;
CREATE SEQUENCE `periodictaskopt_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`periodictaskopt_seq`, 1, 0);

--
-- Sequence structure for `policy_seq`
--

DROP SEQUENCE IF EXISTS `policy_seq`;
CREATE SEQUENCE `policy_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`policy_seq`, 1, 0);

--
-- Sequence structure for `policycondition_seq`
--

DROP SEQUENCE IF EXISTS `policycondition_seq`;
CREATE SEQUENCE `policycondition_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`policycondition_seq`, 1, 0);

--
-- Sequence structure for `privacyideaserver_seq`
--

DROP SEQUENCE IF EXISTS `privacyideaserver_seq`;
CREATE SEQUENCE `privacyideaserver_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`privacyideaserver_seq`, 1, 0);

--
-- Sequence structure for `pwreset_seq`
--

DROP SEQUENCE IF EXISTS `pwreset_seq`;
CREATE SEQUENCE `pwreset_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`pwreset_seq`, 1, 0);

--
-- Sequence structure for `radiusserver_seq`
--

DROP SEQUENCE IF EXISTS `radiusserver_seq`;
CREATE SEQUENCE `radiusserver_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`radiusserver_seq`, 1, 0);

--
-- Sequence structure for `realm_seq`
--

DROP SEQUENCE IF EXISTS `realm_seq`;
CREATE SEQUENCE `realm_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`realm_seq`, 1001, 0);

--
-- Sequence structure for `resolver_seq`
--

DROP SEQUENCE IF EXISTS `resolver_seq`;
CREATE SEQUENCE `resolver_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`resolver_seq`, 1001, 0);

--
-- Sequence structure for `resolverconf_seq`
--

DROP SEQUENCE IF EXISTS `resolverconf_seq`;
CREATE SEQUENCE `resolverconf_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`resolverconf_seq`, 1001, 0);

--
-- Sequence structure for `resolverrealm_seq`
--

DROP SEQUENCE IF EXISTS `resolverrealm_seq`;
CREATE SEQUENCE `resolverrealm_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`resolverrealm_seq`, 1001, 0);

--
-- Sequence structure for `serviceid_seq`
--

DROP SEQUENCE IF EXISTS `serviceid_seq`;
CREATE SEQUENCE `serviceid_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`serviceid_seq`, 1, 0);

--
-- Sequence structure for `smsgateway_seq`
--

DROP SEQUENCE IF EXISTS `smsgateway_seq`;
CREATE SEQUENCE `smsgateway_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`smsgateway_seq`, 1, 0);

--
-- Sequence structure for `smsgwoption_seq`
--

DROP SEQUENCE IF EXISTS `smsgwoption_seq`;
CREATE SEQUENCE `smsgwoption_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`smsgwoption_seq`, 1, 0);

--
-- Sequence structure for `smtpserver_seq`
--

DROP SEQUENCE IF EXISTS `smtpserver_seq`;
CREATE SEQUENCE `smtpserver_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`smtpserver_seq`, 1, 0);

--
-- Sequence structure for `subscription_seq`
--

DROP SEQUENCE IF EXISTS `subscription_seq`;
CREATE SEQUENCE `subscription_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`subscription_seq`, 1, 0);

--
-- Sequence structure for `token_seq`
--

DROP SEQUENCE IF EXISTS `token_seq`;
CREATE SEQUENCE `token_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`token_seq`, 1001, 0);

--
-- Sequence structure for `tokengroup_seq`
--

DROP SEQUENCE IF EXISTS `tokengroup_seq`;
CREATE SEQUENCE `tokengroup_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`tokengroup_seq`, 1, 0);

--
-- Sequence structure for `tokeninfo_seq`
--

DROP SEQUENCE IF EXISTS `tokeninfo_seq`;
CREATE SEQUENCE `tokeninfo_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`tokeninfo_seq`, 1001, 0);

--
-- Sequence structure for `tokenowner_seq`
--

DROP SEQUENCE IF EXISTS `tokenowner_seq`;
CREATE SEQUENCE `tokenowner_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`tokenowner_seq`, 1001, 0);

--
-- Sequence structure for `tokenrealm_seq`
--

DROP SEQUENCE IF EXISTS `tokenrealm_seq`;
CREATE SEQUENCE `tokenrealm_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`tokenrealm_seq`, 1001, 0);

--
-- Sequence structure for `tokentokengroup_seq`
--

DROP SEQUENCE IF EXISTS `tokentokengroup_seq`;
CREATE SEQUENCE `tokentokengroup_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`tokentokengroup_seq`, 1, 0);

--
-- Sequence structure for `usercache_seq`
--

DROP SEQUENCE IF EXISTS `usercache_seq`;
CREATE SEQUENCE `usercache_seq` start with 1 minvalue 1 maxvalue 9223372036854775806 increment by 0 cache 1000 nocycle ENGINE=InnoDB;
SELECT SETVAL(`usercache_seq`, 1, 0);

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin` (
  `username` varchar(120) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES
('admin','$argon2id$v=19$m=65536,t=9,p=4$fc8ZI8S411qL0bqXUirFWA$j9/5vfS3pJvB5FsKNVs6o9WCd7jU3++FPIO6rfkqNHM',NULL);
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authcache`
--

DROP TABLE IF EXISTS `authcache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `authcache` (
  `id` int(11) NOT NULL,
  `first_auth` datetime(6) DEFAULT NULL,
  `last_auth` datetime(6) DEFAULT NULL,
  `username` varchar(64) DEFAULT NULL,
  `resolver` varchar(120) DEFAULT NULL,
  `realm` varchar(120) DEFAULT NULL,
  `client_ip` varchar(40) DEFAULT NULL,
  `user_agent` varchar(120) DEFAULT NULL,
  `auth_count` int(11) DEFAULT NULL,
  `authentication` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_authcache_username` (`username`),
  KEY `ix_authcache_realm` (`realm`),
  KEY `ix_authcache_last_auth` (`last_auth`),
  KEY `ix_authcache_resolver` (`resolver`),
  KEY `ix_authcache_first_auth` (`first_auth`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authcache`
--

LOCK TABLES `authcache` WRITE;
/*!40000 ALTER TABLE `authcache` DISABLE KEYS */;
/*!40000 ALTER TABLE `authcache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `caconnector`
--

DROP TABLE IF EXISTS `caconnector`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `caconnector` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `catype` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caconnector`
--

LOCK TABLES `caconnector` WRITE;
/*!40000 ALTER TABLE `caconnector` DISABLE KEYS */;
/*!40000 ALTER TABLE `caconnector` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `caconnectorconfig`
--

DROP TABLE IF EXISTS `caconnectorconfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `caconnectorconfig` (
  `id` int(11) NOT NULL,
  `caconnector_id` int(11) DEFAULT NULL,
  `Key` varchar(255) NOT NULL,
  `Value` varchar(2000) DEFAULT NULL,
  `Type` varchar(2000) DEFAULT NULL,
  `Description` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ccix_2` (`caconnector_id`,`Key`),
  CONSTRAINT `caconnectorconfig_ibfk_1` FOREIGN KEY (`caconnector_id`) REFERENCES `caconnector` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caconnectorconfig`
--

LOCK TABLES `caconnectorconfig` WRITE;
/*!40000 ALTER TABLE `caconnectorconfig` DISABLE KEYS */;
/*!40000 ALTER TABLE `caconnectorconfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenge`
--

DROP TABLE IF EXISTS `challenge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `challenge` (
  `id` int(11) NOT NULL,
  `transaction_id` varchar(64) NOT NULL,
  `data` varchar(512) DEFAULT NULL,
  `challenge` varchar(512) DEFAULT NULL,
  `session` varchar(512) DEFAULT NULL,
  `serial` varchar(40) DEFAULT NULL,
  `timestamp` datetime(6) DEFAULT NULL,
  `expiration` datetime(6) DEFAULT NULL,
  `received_count` int(11) DEFAULT NULL,
  `otp_valid` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_challenge_timestamp` (`timestamp`),
  KEY `ix_challenge_transaction_id` (`transaction_id`),
  KEY `ix_challenge_serial` (`serial`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge`
--

LOCK TABLES `challenge` WRITE;
/*!40000 ALTER TABLE `challenge` DISABLE KEYS */;
/*!40000 ALTER TABLE `challenge` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientapplication`
--

DROP TABLE IF EXISTS `clientapplication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clientapplication` (
  `id` int(11) NOT NULL,
  `ip` varchar(255) NOT NULL,
  `hostname` varchar(255) DEFAULT NULL,
  `clienttype` varchar(255) NOT NULL,
  `lastseen` datetime(6) DEFAULT NULL,
  `node` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `caix` (`ip`,`clienttype`,`node`),
  KEY `ix_clientapplication_lastseen` (`lastseen`),
  KEY `ix_clientapplication_ip` (`ip`),
  KEY `ix_clientapplication_clienttype` (`clienttype`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientapplication`
--

LOCK TABLES `clientapplication` WRITE;
/*!40000 ALTER TABLE `clientapplication` DISABLE KEYS */;
/*!40000 ALTER TABLE `clientapplication` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `config` (
  `Key` varchar(255) NOT NULL,
  `Value` varchar(2000) DEFAULT NULL,
  `Type` varchar(2000) DEFAULT NULL,
  `Description` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`Key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config`
--

LOCK TABLES `config` WRITE;
/*!40000 ALTER TABLE `config` DISABLE KEYS */;
INSERT INTO `config` VALUES
('__timestamp__','1722001250','','config timestamp. last changed.');
/*!40000 ALTER TABLE `config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customuserattribute`
--

DROP TABLE IF EXISTS `customuserattribute`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customuserattribute` (
  `id` int(11) NOT NULL,
  `user_id` varchar(320) DEFAULT NULL,
  `resolver` varchar(120) DEFAULT NULL,
  `realm_id` int(11) DEFAULT NULL,
  `Key` varchar(255) NOT NULL,
  `Value` text DEFAULT NULL,
  `Type` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `realm_id` (`realm_id`),
  KEY `ix_customuserattribute_user_id` (`user_id`),
  KEY `ix_customuserattribute_resolver` (`resolver`),
  CONSTRAINT `customuserattribute_ibfk_1` FOREIGN KEY (`realm_id`) REFERENCES `realm` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customuserattribute`
--

LOCK TABLES `customuserattribute` WRITE;
/*!40000 ALTER TABLE `customuserattribute` DISABLE KEYS */;
/*!40000 ALTER TABLE `customuserattribute` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventcounter`
--

DROP TABLE IF EXISTS `eventcounter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `eventcounter` (
  `id` int(11) NOT NULL,
  `counter_name` varchar(80) NOT NULL,
  `counter_value` int(11) DEFAULT NULL,
  `node` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `evctr_1` (`counter_name`,`node`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventcounter`
--

LOCK TABLES `eventcounter` WRITE;
/*!40000 ALTER TABLE `eventcounter` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventcounter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventhandler`
--

DROP TABLE IF EXISTS `eventhandler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `eventhandler` (
  `id` int(11) NOT NULL,
  `name` varchar(64) DEFAULT NULL,
  `active` tinyint(1) DEFAULT NULL,
  `ordering` int(11) NOT NULL,
  `position` varchar(10) DEFAULT NULL,
  `event` varchar(255) NOT NULL,
  `handlermodule` varchar(255) NOT NULL,
  `condition` varchar(1024) DEFAULT NULL,
  `action` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventhandler`
--

LOCK TABLES `eventhandler` WRITE;
/*!40000 ALTER TABLE `eventhandler` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventhandler` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventhandlercondition`
--

DROP TABLE IF EXISTS `eventhandlercondition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `eventhandlercondition` (
  `id` int(11) NOT NULL,
  `eventhandler_id` int(11) DEFAULT NULL,
  `Key` varchar(255) NOT NULL,
  `Value` varchar(2000) DEFAULT NULL,
  `comparator` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ehcix_1` (`eventhandler_id`,`Key`),
  CONSTRAINT `eventhandlercondition_ibfk_1` FOREIGN KEY (`eventhandler_id`) REFERENCES `eventhandler` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventhandlercondition`
--

LOCK TABLES `eventhandlercondition` WRITE;
/*!40000 ALTER TABLE `eventhandlercondition` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventhandlercondition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventhandleroption`
--

DROP TABLE IF EXISTS `eventhandleroption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `eventhandleroption` (
  `id` int(11) NOT NULL,
  `eventhandler_id` int(11) DEFAULT NULL,
  `Key` varchar(255) NOT NULL,
  `Value` varchar(2000) DEFAULT NULL,
  `Type` varchar(2000) DEFAULT NULL,
  `Description` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ehoix_1` (`eventhandler_id`,`Key`),
  CONSTRAINT `eventhandleroption_ibfk_1` FOREIGN KEY (`eventhandler_id`) REFERENCES `eventhandler` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventhandleroption`
--

LOCK TABLES `eventhandleroption` WRITE;
/*!40000 ALTER TABLE `eventhandleroption` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventhandleroption` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machineresolver`
--

DROP TABLE IF EXISTS `machineresolver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `machineresolver` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rtype` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machineresolver`
--

LOCK TABLES `machineresolver` WRITE;
/*!40000 ALTER TABLE `machineresolver` DISABLE KEYS */;
/*!40000 ALTER TABLE `machineresolver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machineresolverconfig`
--

DROP TABLE IF EXISTS `machineresolverconfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `machineresolverconfig` (
  `id` int(11) NOT NULL,
  `resolver_id` int(11) DEFAULT NULL,
  `Key` varchar(255) NOT NULL,
  `Value` varchar(2000) DEFAULT NULL,
  `Type` varchar(2000) DEFAULT NULL,
  `Description` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mrcix_2` (`resolver_id`,`Key`),
  CONSTRAINT `machineresolverconfig_ibfk_1` FOREIGN KEY (`resolver_id`) REFERENCES `machineresolver` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machineresolverconfig`
--

LOCK TABLES `machineresolverconfig` WRITE;
/*!40000 ALTER TABLE `machineresolverconfig` DISABLE KEYS */;
/*!40000 ALTER TABLE `machineresolverconfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machinetoken`
--

DROP TABLE IF EXISTS `machinetoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `machinetoken` (
  `id` int(11) NOT NULL,
  `token_id` int(11) DEFAULT NULL,
  `machineresolver_id` int(11) DEFAULT NULL,
  `machine_id` varchar(255) DEFAULT NULL,
  `application` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `token_id` (`token_id`),
  CONSTRAINT `machinetoken_ibfk_1` FOREIGN KEY (`token_id`) REFERENCES `token` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machinetoken`
--

LOCK TABLES `machinetoken` WRITE;
/*!40000 ALTER TABLE `machinetoken` DISABLE KEYS */;
/*!40000 ALTER TABLE `machinetoken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machinetokenoptions`
--

DROP TABLE IF EXISTS `machinetokenoptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `machinetokenoptions` (
  `id` int(11) NOT NULL,
  `machinetoken_id` int(11) DEFAULT NULL,
  `mt_key` varchar(64) NOT NULL,
  `mt_value` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `machinetoken_id` (`machinetoken_id`),
  CONSTRAINT `machinetokenoptions_ibfk_1` FOREIGN KEY (`machinetoken_id`) REFERENCES `machinetoken` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machinetokenoptions`
--

LOCK TABLES `machinetokenoptions` WRITE;
/*!40000 ALTER TABLE `machinetokenoptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `machinetokenoptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `monitoringstats`
--

DROP TABLE IF EXISTS `monitoringstats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `monitoringstats` (
  `id` int(11) NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `stats_key` varchar(128) NOT NULL,
  `stats_value` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `msix_1` (`timestamp`,`stats_key`),
  KEY `ix_monitoringstats_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monitoringstats`
--

LOCK TABLES `monitoringstats` WRITE;
/*!40000 ALTER TABLE `monitoringstats` DISABLE KEYS */;
/*!40000 ALTER TABLE `monitoringstats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passwordreset`
--

DROP TABLE IF EXISTS `passwordreset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `passwordreset` (
  `id` int(11) NOT NULL,
  `recoverycode` varchar(255) NOT NULL,
  `username` varchar(64) NOT NULL,
  `realm` varchar(64) NOT NULL,
  `resolver` varchar(64) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `timestamp` datetime(6) DEFAULT NULL,
  `expiration` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_passwordreset_realm` (`realm`),
  KEY `ix_passwordreset_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passwordreset`
--

LOCK TABLES `passwordreset` WRITE;
/*!40000 ALTER TABLE `passwordreset` DISABLE KEYS */;
/*!40000 ALTER TABLE `passwordreset` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periodictask`
--

DROP TABLE IF EXISTS `periodictask`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `periodictask` (
  `id` int(11) NOT NULL,
  `name` varchar(64) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `retry_if_failed` tinyint(1) NOT NULL,
  `interval` varchar(256) NOT NULL,
  `nodes` varchar(256) NOT NULL,
  `taskmodule` varchar(256) NOT NULL,
  `ordering` int(11) NOT NULL,
  `last_update` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periodictask`
--

LOCK TABLES `periodictask` WRITE;
/*!40000 ALTER TABLE `periodictask` DISABLE KEYS */;
/*!40000 ALTER TABLE `periodictask` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periodictasklastrun`
--

DROP TABLE IF EXISTS `periodictasklastrun`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `periodictasklastrun` (
  `id` int(11) NOT NULL,
  `periodictask_id` int(11) DEFAULT NULL,
  `node` varchar(255) NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ptlrix_1` (`periodictask_id`,`node`),
  CONSTRAINT `periodictasklastrun_ibfk_1` FOREIGN KEY (`periodictask_id`) REFERENCES `periodictask` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periodictasklastrun`
--

LOCK TABLES `periodictasklastrun` WRITE;
/*!40000 ALTER TABLE `periodictasklastrun` DISABLE KEYS */;
/*!40000 ALTER TABLE `periodictasklastrun` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periodictaskoption`
--

DROP TABLE IF EXISTS `periodictaskoption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `periodictaskoption` (
  `id` int(11) NOT NULL,
  `periodictask_id` int(11) DEFAULT NULL,
  `key` varchar(255) NOT NULL,
  `value` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ptoix_1` (`periodictask_id`,`key`),
  CONSTRAINT `periodictaskoption_ibfk_1` FOREIGN KEY (`periodictask_id`) REFERENCES `periodictask` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periodictaskoption`
--

LOCK TABLES `periodictaskoption` WRITE;
/*!40000 ALTER TABLE `periodictaskoption` DISABLE KEYS */;
/*!40000 ALTER TABLE `periodictaskoption` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pidea_audit`
--

DROP TABLE IF EXISTS `pidea_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pidea_audit` (
  `id` int(11) NOT NULL,
  `date` datetime(6) DEFAULT NULL,
  `startdate` datetime(6) DEFAULT NULL,
  `duration` datetime(6) DEFAULT NULL,
  `signature` varchar(620) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `success` int(11) DEFAULT NULL,
  `serial` varchar(40) DEFAULT NULL,
  `token_type` varchar(12) DEFAULT NULL,
  `user` varchar(20) DEFAULT NULL,
  `realm` varchar(20) DEFAULT NULL,
  `resolver` varchar(50) DEFAULT NULL,
  `administrator` varchar(20) DEFAULT NULL,
  `action_detail` varchar(50) DEFAULT NULL,
  `info` varchar(50) DEFAULT NULL,
  `privacyidea_server` varchar(255) DEFAULT NULL,
  `client` varchar(50) DEFAULT NULL,
  `loglevel` varchar(12) DEFAULT NULL,
  `clearance_level` varchar(12) DEFAULT NULL,
  `thread_id` varchar(20) DEFAULT NULL,
  `policies` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_pidea_audit_user` (`user`),
  KEY `ix_pidea_audit_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pidea_audit`
--

LOCK TABLES `pidea_audit` WRITE;
/*!40000 ALTER TABLE `pidea_audit` DISABLE KEYS */;
INSERT INTO `pidea_audit` VALUES
(1,'2024-07-26 13:36:08.104616','2024-07-26 13:36:07.772208','1970-01-01 00:00:00.332291','rsa_sha256_pss:4d6cb5550dea90941414f024b1a1fc7d6cb6f60600186b0013984d50514ea9b85f06e72ac50dfc58551b6fdcd201cd9edc20dff2d41265a73b9631c76203cf4a97880bf3629c77ab69d1ab547bcb2e6e2be68d0e916cba417f9d5414e6c835b82ed952109bcee7c0b3d61c0c454a68184447d6712b14e26416b9a0c16a1eae83c731a0da6037381e0a7d390132b5cbf4b4fa7a0920e47f9c321b1403a1f7dfb0375ec78856f021425a485c79680d747b2934398a6757f1d63dc2647ea7ee717f514f895519fbc6f371509e200545f310d3ca2246415eb57c6826f75f33edcbdb2bfe62488bf6064d26933488f8a66922c595efc34e9bcc6b209f4f2574cf632f','GET /register',1,NULL,NULL,NULL,NULL,NULL,NULL,'','False','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(2,'2024-07-26 13:36:11.342132','2024-07-26 13:36:10.973627','1970-01-01 00:00:00.368448','rsa_sha256_pss:26de10590ce4df981124e7d2e0eaa7878788122a6c700249031e73d413596a2adaac88b42596c92a911e496111a17cea231fb7463cd8dfad8dfdc093d0a23c555266b482c79e24648bd4e0583e3925eca741a07cafc67f3cfadce379fdccc9843ef6e5b60ffe2ed0f9be84257b95db8529a6cb4096d006107990c8208928ec2cebd8b0f04edf8c1321ac49090ad6cb3569571ab842d1fdbe0145b4e696318d761b5254245535c77b66efbf00fc1fca4acc852880f8e07dcf6a2e6bdc535450ac8e2e24980863a78ce95979cad693293053754f7bd1f101e102f4d6a2229d6d9ba65f3014b424cb499b9dea2bb7a1aefe2dadd86bb4e1423993b98e7116345cdc','POST /auth',1,NULL,NULL,'','',NULL,'admin','','internal admin','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(3,'2024-07-26 13:36:11.607899','2024-07-26 13:36:11.371113','1970-01-01 00:00:00.236719','rsa_sha256_pss:7400bf46035e48d8dfadadfa69147f4f2b60101e08824277bb1c9e33ad5e329e4c78a04fae4f64469569b26c1ca6823a74da80c3ee28bfd654f3e1234f8e697742c4f6a7d316fcabc00cb2e8888a51a2b94efaf340265ebe093f3ff415f4c3e1744b36b542c71a450f2b2cc701bc002aa6bb8e4f109727e14888498a323362d60779e7b65544958e71eb55cd35fc19bf3b01763a933858d8663bcebacba937a626d33e21eb88a80e9816ac4fa70264a0c87f52debbb5b150210051b96a4b14ca9fd6b4bf48c654267af37c83c37bddf8ba28bb24ec2091e52da66d391f0147cf7ebdd774e20ce21e27996ccb27d6d10665e2b27fe7bc5798faf6ff177785e52a','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(4,'2024-07-26 13:36:11.720657','2024-07-26 13:36:11.512270','1970-01-01 00:00:00.208320','rsa_sha256_pss:a883ecacc26c148adf842b7541667dd1da07bc70e1b5fa7b655432772cc63af468a0cf6a24810ac57436f6ea929a6ac992f2f1906d9ea300c0fd0e4b1249d1aa25b8526f2cfe28a529ee81433209ed9db5828f9912be6c84a13c8fba1b1b85c39a23befa96c1f9d1f3b22915535aad750161dcaf01ca533fd2a704093547894e0c17f2dd87c766634240d3ac43d99a19122634d299ce51efaacc39a0a8e65f7f983307b4170dfe3a2acaf6e962ba454eda1cfe1b894663461f7a0c29748562de7fbdfaee961d7da485d3002495b45de8a8a597a04d3545eddebcd23dbb86f4fc7f4c3087eeffdc3fc7f31a6460ea511afedd8c66e1b8f0eff9c4ca3433475497','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(5,'2024-07-26 13:36:20.165124','2024-07-26 13:36:20.040018','1970-01-01 00:00:00.125030','rsa_sha256_pss:44dfcfede6b524e5210c6a8a74f565aa7baf354f80a9ceeb13e5bd07a85d9133adc8a02483fa2992e8d221a77f7370780ac898d4e6a2b7e598c901d17f2dbdba4969127d1e570b207212c63bb3fb83024580463fb9638a99c7c8881044dbf257defe0d5a1c79f84a4a105bc1cddfc1a6ce8decc365d007ea4f8671f063ddffa500b49f003dae25ff097fc4be5fb11847771508ffab18e7cc20b95bf29229afb7c491be7646cdddae562f1432bdd092fec4f4fa0c62d5f3195a2e9bf0c0bcc0f433c4d8264efb0eed5389262ba180def6ad0f85e3dc9dbde659fe85f3baf9adf50fba270a8669bac3d3c2f364ddf51587455881b798726ef3ca1c86b4e3fd25e7','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(6,'2024-07-26 13:36:20.273106','2024-07-26 13:36:20.045629','1970-01-01 00:00:00.227409','rsa_sha256_pss:15137d1c6620c7f7a1ca3bc27f96df43ed4d958b7f27943d09a97edb88fa5166f83cb7dc6444fe6d8c1f4254e7acca376c17ff74677afd94d70798a85aa77fce04b0220b2f6c4881e396f545519b01059b63eb48901f8700679c8349237fed0df3c506dc9d420df56d6e11accced55d171a13e81dda220846f8b3920e5e4c9a796f4004ddf5531d036d0502e388db34dd8c025c83b35664aa7f5e68d89825c81e7f999372251a086e0665d02e66c2d0366f9c52bae0a92072979b154142c7315c00c48d9e0e250f1096e8270208d924f3843d601f2590bbd769af5528a3db11fc850324986c8aec6244d6beac17cd66408f482422c139d1779ff68ce2e0912c6','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(7,'2024-07-26 13:36:20.279394','2024-07-26 13:36:20.184377','1970-01-01 00:00:00.094963','rsa_sha256_pss:0aadb23b47a275ddbf844151971f43cecd8628229a575b94730418ef1e9943e8ce7f651f75886da7469c173fc786422085e032950b53da4a50b5eeeb54c0559d670b6a981f678cfbe407c8d794f93521ac5dcbd6e36444984a6d6bac5ab1126f76892cedae12a8e91cd9fb79e8d65cc808d0abf8231d2b344f719fe2ae70f5595c3ae096740a94c661ac958ba47610932f87858703159deb8ed7a9ca25e0b4ceb4c41a903347e889971cb238a11ad851a998567a068e562f6c6ad30dc7d25983923364b9a81a809356c1188636137531fcf3c853b3f604df23d18d3d6f59598c8d5146af8dca332c7a1c88ed37d28ffd3148bba60f7f2f80a3d3da7d140757a5','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(8,'2024-07-26 13:36:20.495476','2024-07-26 13:36:20.302826','1970-01-01 00:00:00.192565','rsa_sha256_pss:2c94732e4513f28ed7ea5434aa44c3c823abe2d1c9efaa6c6ce8b5f81d7f1a246f37e1d0ce4b819930970e25d451012a2de149a3e0ca608c164b3318676bbe0f293da2db9a4e174d303d0a7399bf62f0a96eee14a352c78870a90366da89801cafc64495ea21e60d811607e6356acff09785db1213005cbf19ff00b0d8083d97c56327cdf94ad3eea4eb8d36d6b009d18c936b804d9c4352bc2aef752b70adb5c13329bdcdc1b86425058144d889814688b0b9c567fdc87399693f80c71b77396e70c99520e90fffb23764a920c4176185e3f67b5838d35f5c1caf1c92a1cb2e050f3f69420477a9629b77528d41508ed352d22e9bc6c6d4e0c89bac40226255','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(9,'2024-07-26 13:36:20.727955','2024-07-26 13:36:20.564343','1970-01-01 00:00:00.163560','rsa_sha256_pss:836209c23794fce916aa00f5c382b3d4e49b71f5e8aec117d86bfe9fec551656c944a364573c75ac11b534b8e9273aa4f7c242f69e2cb364dde1c62ecc6723d1796889978c2665bfa80d7bccd1b045f20ba3cf87a3379c76674d212e90c349c104fd65ed16553838939e0362e597bd84da2b520c4323b0881101124c51ecb84de1fd09fff3e07f04d199a81bf4c054d0be2585dd9d31fa92c48b1743d9baa74ce1ae2031342c040fcbe69ffce064cd359b049e2919d30495db43a720f499539b76c0c77795b0f326fc1cb1960c1cbfef92c34b5bf38d0124129c46229af3782c0bcb7432e67d7543b27cf4c52231eb246fced80a9a6eb8d034194d4916675d8c','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(10,'2024-07-26 13:36:21.016000','2024-07-26 13:36:20.748481','1970-01-01 00:00:00.267460','rsa_sha256_pss:77d4e7be811ef2d9d512823cdbde3c6b4b886e0fc082fea79ee6b2094c6fe9cffe3af1d5e11f0b9200de269f5db13ab75f605045a42815e21e22178936763ca3215ebf6f4622f9435953997031855f1d370221d005d947677ec8429e52e156f2db3291c5d99ac44db37864b0345768bb613582e8d4a977861808b2de70cd3be3e384072248ba8141169d0ead2b7861d8609c6343853589f463ab5b3c8bc2aa049e8f0873a58702c33c0d1bfcb8459bf4fad495fd4c41bea0f38a872184a40d6f8ace194e7e7d0614213319a20cb06ff851f4e99cf7738d6d15eeb345c5deda262d65e30e6e4f8a20634666aabed6f93ac88eb4a3c89895b1dfe1734ce7c8233b','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(11,'2024-07-26 13:36:21.280301','2024-07-26 13:36:21.135607','1970-01-01 00:00:00.144613','rsa_sha256_pss:6f7f01ecb1f9fa27d60458f66d72f9a70abc624819bcead4ca16bf10279ad13c83944300018654ce1f3abacde2cab66497ae0a47903d4ce06c3df25aaea41896703984f2b4d2c8b3efcf4cfd725e3b17fe4c499cd6a23f6400d22d244bcdd9e2400a867f2016d0483e5819048442998b408d5862857a17266c6c89501d8e6b2d1d219c9bc01d1b97c4153b7d4b626720b6c295806b7bd31b03f4179f58bf915e24dc5297e22ee8589453b8272bccf805143f72554159e1b81d142168b216590b6ddeca4958ee3740a32d4832b2f11a066f96a6fa72f09e2f8070faefd300f86fb5bcd42137990347579792432dbf20fca4f258fd7534d304c128a2c8fdbd7fed','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(12,'2024-07-26 13:36:21.293727','2024-07-26 13:36:21.135482','1970-01-01 00:00:00.158014','rsa_sha256_pss:343b842d97ac93c78206cc456a8e582c6d25b1818a34cbbbdb4a8866c63e3a4133f4163645feea209af36ef212abdb9d4c463c0162a3727d86d234236b0bee66435f41cc8744f27880ab697d35c9181909e0de9dee3fdea645bce7688e80c85bb741a28b862f4fa9f16b04d95fe5fdf3543b91f64e88486be2489fc9aa19ec093652d6569f6af8088610ed363c86bd69699f110ec086239f8ae31cf861d753147a94de7175982f285b1b52c12ddc6f00269435d8f644e24f9d8031b64cd4de7ec5e0b3c37e4e5553f7c2fd4d0a1b74d308d21abf02b18af5a7a35b146715437b8fa78a5c060332aa19471f0f62489779d538929fe055e72ca1087f3d27eb92b6','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(13,'2024-07-26 13:36:21.388535','2024-07-26 13:36:21.135123','1970-01-01 00:00:00.253339','rsa_sha256_pss:77daec565601c012f11ecc6936c2d47de5fc4c77b0cc9aede6340603d00f773255a30a2bf9f8049c5fc496907b3b5fc319c06e1369b1cb7d13f7f649e3d1e357ffe0591709553e49007347619226f11cba7d39f6f49ebd3778a723ba8ecb76f0ddbaffbb5174d9e6567ecc35fe0ce1c8f0abf5fcec5a53c21c6bdf8caa719ec531cc8aa64cb7b96d417962c11b3cfa6636b4534972172cff08088d9d1e444498bbd18ed99ae089c8fae4300010f26843b7417ebf42f29482dfdc455b04e53c797d049a95eef796d3bc376500813e7569a73caea1b67dc6a03a5aa45ad1675beb27b9b83904dd400aa523f70e941df8e6e59c4dabc5253bd8b8cda7c3a8369895','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(14,'2024-07-26 13:36:21.391005','2024-07-26 13:36:21.137298','1970-01-01 00:00:00.253620','rsa_sha256_pss:198db8db4d04f3133a7998cafb4b59935b337a6dccc665baccbdb8107d395dfcaaf5391231868b62607184fa5ae1d700d73c88f2cd110540bc230c6d9107c1d24a17941cbaa3e8dc3debb973b0d4c54e97f2384ace33e72d6d430e8e87027e8969b208cfaa6744a598e347c7a6f0387f231c241d00788ed90bdd9171407ba017d7a7c67c5200d27c99956cb8bbf48a36e20bf5e912bf2ad4e78c704c06be9a30ac51751ad7254103c11cbaca107af841236fcf1045befebc268a914f0d50807a6ef8168159178c539fdb3f2136b9cb9f2fb74ff0afb5588ad1d6cfb074a01e2c5953470672d4bea7d960ea959b3b1d20220b04435955e70859de860777b5f757','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(15,'2024-07-26 13:36:21.393453','2024-07-26 13:36:21.137989','1970-01-01 00:00:00.255380','rsa_sha256_pss:69d9f54f814277863d42fb7060fc92d737fa6ff5bd7068ecce6136d1b39da2b91f70654298a15c39a797848b8a8706117831cd457c40bc4df61fc2bce5da7e517dc1ee787264719bf4a81844d2ef9cf59b7874660b53b0cafdbb18af35b589ad4f7c7481e7c7627bfa465cdfe0c139e0b070c57495211852645d84c302103cd680ef399ec05b83fade66f7b30d4089c93022c6d1ec94b2d184f65696ad301e6a526bbb8ae5d348bd3dce7a222cf6667e5133d2341c7aa58ea2dbe5d7299af617d8d6148c060457f89f976e782ab3ceed1018024137fcd0b15f02c37f23136f82981409a1e8d7ec698324ac77bbf63dd2d86371f505f218c89bf752a5b48345ad','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(16,'2024-07-26 13:36:24.476327','2024-07-26 13:36:24.382832','1970-01-01 00:00:00.093445','rsa_sha256_pss:44a51f52cc4aa6ba8a25c94bba7e90387c7ca00d77f5e35f513a7210deffc0f96663b457bf2255d79617ff8ca9e7a46df1f7e89907174859f5aa8a109d6bda4c562b7193553b4cd561e54ef8dff86523b5a79fd7e03d44a8adb89c691cc216d44aff80757a50750624ecee00d24dc23a881f9c9b595ddbb1aac399b2a1fbf3c5199e0f17daf45483386a58ad12ff341fa861941093b1415be901e4b689ed28c39b433ec769746ea94b454da795ea6a4faf6c676408d51063d3a14dcea5023c47dfd58d18e51c4ea36320cac68fc5d6e47f898fc4408344af99bea5bd1b2b7e7ee193328ba154afa1f28d4afdcbce19f8937d58df9b69817a00727958e52b97bb','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(17,'2024-07-26 13:36:25.189268','2024-07-26 13:36:25.098615','1970-01-01 00:00:00.090601','rsa_sha256_pss:a90695d639a8e20f7e852b181b4ab07f6894d1c501c6429e9bc8056afedcfaa0d17fd8094a67f350e3b8d20cda8d2717f969f6e57c8ca17b9f25365de44a3511fdad809200277e47376573f470e4b621ae58b095582d86cae753989ea3d92b29e7bb47baae98447e97a959ea5a84bf5442ededbe05f193021c7cf045460ac7cf091349bd2f010e374d49c5b1534bc5df1958117c7483cfcaf9f34cd862376cb759ff08199ba904139b1e34c8cc6b2d0a7c5ba5e537a421bd646cae1ea218e5385d62420ac07f69ce1c68b9687a98e6f12df5954ac20724bab57a9b8f27fd74b2ed94d88b22b0cb5d6ad25c53a6e8253b9dccf2bc2255dca630ed2a2fcc2a7cc6','GET /machine/',1,NULL,NULL,NULL,NULL,NULL,'admin','','hostname: None, ip: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(18,'2024-07-26 13:36:28.129562','2024-07-26 13:36:28.034996','1970-01-01 00:00:00.094515','rsa_sha256_pss:43b42be202e6e4bd4b68a4091fc7b7b7fc89279702d91e4504b7eaa8195e22dd8b3e8026430541335be7c69769bccca1529dc5f0bfd0def7acb4ab6e07d3742738cd52e059d34eb2c7b76eceeb567e721df560e3bb7efd2c0910de9d6bc537ad6b37743332b77a0374bf4cc6164028c643180262991e85cf1d8ca19f5a393a2414bfa766434e96a5b9da8658fc71483e3c5532967c0463f71927a698bf14e590b36ab27f8cc880025dbd8a9a68ff8d35ce7e7562e583c7449d019bf798ae3d0172290ec882fd6a7e9d76cf8dc565898e427852ae5dba5471e9a508c61d3c85b6092646474f911e32161b018cd3e63377b100c10e0a9afee8b96d1beb6d2a8cb6','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(19,'2024-07-26 13:36:29.175080','2024-07-26 13:36:29.060707','1970-01-01 00:00:00.114319','rsa_sha256_pss:22312db9fdc83dfea8010e3c85071c9881e954ac19d4fc30336ab3afda0cf460899b3174f8f82a08cddb1c6086417c3abfc45e59effff241dcb41e44bfdb7971666a138fbd4a78e22dd0ea9b697f45153d5c40cc9173ba9702e05623ccf62bd337a08b9f9141d4f7d11dd023e5f248983eac39d59c2dd80e33ded9e72f677ae46c1d0ce0f99b673fcd34c5a6f78b0cbdfd64f4e2eb86a35649128a7ee06de1602a1aa7bd3276403ac5a76bfff11b1bae226e73cce48911d17d7d8f4f0bb34d4f3d83a20f52e32fa674694ff4f215c588dd78a40ea7265c3be33dfc85eca2fb7f43bea09293e30462bc578b70f55ebd12ddfe1f2932ef372e7b4ffe8d005a0455','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(20,'2024-07-26 13:36:29.276211','2024-07-26 13:36:29.071012','1970-01-01 00:00:00.205097','rsa_sha256_pss:1062eabe50b1b9551a7be746024e60226d6fbbfcec6d8eb16c390f3571da7b21da32648170f7e4571e8af37534bd500bd853dc68876225b134e8397b4b44e5af42839350a14ce3ce9105d664046a283435f711a93463844318c7561c332d661a748a9f31e20d052f69414e0e6ccfbbc290fe9f13e476907a6eaa4dd615537e79179a034d3d4313b867480085669a2ed5d6ccaee20b303cae85c2a13fa6097503043cfad1940218cad14c5143c654f67b3d9195af5916c4acf3dd5a3aefedb5c7a775879a55ad8a6c38f0346a0be846c7d6ff5e2d306ea1499bfa649717e936ca784cc4487af6d8b6d5096fff27cf7f2a16e5e0b08324440207ae0fe13f1b9b06','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(21,'2024-07-26 13:36:30.927097','2024-07-26 13:36:30.828751','1970-01-01 00:00:00.098260','rsa_sha256_pss:3de8c23e2d5a774b2da2deb8a5cb1702e0f04005002490f0241b506309cffcc7c0da93be11e363265ee73474de68bec28a0e8a4f5dc9b521c493380252fc2762b35c202e169cf3e824c9948d99a1b45fb5585755e94685a111bd9b9b6f22e14c5b7eefe677a6697513dfd60f4e81eabb8c9a6ecda93032ea12b1d674d30749ada73e6faffe5ce948f6d58f41dccd368ec4fbfe61b9e5078dd5d589369e97537502d6175724cbef79e037e3c5ebae9cd7108192b482b05e722c78263913914f2ab18323a9b95d3829e6db8e78ac60912a8763504684deeecae4296e2ca43cd74dfd7e746661a90d04ddad33f07a1af8dc7c095afefe11f3627ca9367c184b8836','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(22,'2024-07-26 13:36:31.525098','2024-07-26 13:36:31.433843','1970-01-01 00:00:00.091203','rsa_sha256_pss:63f6e12c11b1619e6ab26715d67134226fab8823f8c89ba45ce83284cb9ace1ee49fa5f779e337cbb54dc11f52a02beb8109b9bd5d9f87993157777146679072ab2b34dc4e0a4e43ebbd63d102be6b1440fcd2627d0982533d1cb6dc7cfd9b36f9a8690ae46b4e24ea29ea1da4854c0a75d50520207d611747a396352e953e2e6eb53bbd6eebfe4a9ff3ef4d07fe8c7b6dcf46203320e139eb1298fc6a9948c64056ab5bfc1f7ef0aca02054825deb175be92244fcff3a52296dfdb1203a918271911ab1fa97b6e2ad314dea2c20fbd159b9d91a3c7cfcf54bdbd4f3147c9accdfabadda4974f939989c3182d34ab61a24db6a00737bdafbbb9135ac20d05dd3','GET /machine/',1,NULL,NULL,NULL,NULL,NULL,'admin','','hostname: None, ip: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(23,'2024-07-26 13:36:32.391929','2024-07-26 13:36:32.300303','1970-01-01 00:00:00.091570','rsa_sha256_pss:7db411170d3c4a9ff52110a46a1af9ab2ed00a274cf8c3a35c952cacae903739a1a792f5a6da805a363d844409dc7dd15f776f6e9ac86ab75d79b38faf260ecf0fb21b67fa5e262011903a3ce309571669172c9e92fd544b72f908818f662e5c3fe87da926c9ca69f4552bf88a0cddce18cf550eab116cf5fa9516343a29b0f5b4e81614133809d1f031fb3280cf616e01009b3ba06d0d7ecb25c10a2c8dc30e58a38fabe5d47ff5a73c34d7683fdc29c774e8d81d824c380749e4760271c9689a527bbc0b103008621ecc1736036429dc4d1986d4ddc633e66e1370b99ed485c3e87f34e37d46ab10d3325b1d13dca7f4649ec57508dbbf34d3b4dd2c461a41','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(24,'2024-07-26 13:36:32.401258','2024-07-26 13:36:32.300724','1970-01-01 00:00:00.100448','rsa_sha256_pss:7eeaaafba2d3122003449b2da908719c0b681be187fcb06171074399b2a8000f56551266a67da8dedf67c05090e1fb3afb4ef0b273904f0971784c96462d0515c86b0627c38c4637172840d2db5a97ec0fed84fa9c07505634658ff3f6c0a554b601dc3e41a8ff4435c884af72029f264e716e195cab5b2dc7e043af53faff6853e8c102dd44c46c82326e6c99c0de83e5e8814e7ce429d23a44d74fd6cb975d1cb74899c6c33a6d0f9d8d022ffddf696123d3146f05df5a0d7725922620b98f512f35f9b2687fd8650d8f9352fcded2b59066f55c2a039a2d9e2cc3b593994072cf22e093af8f654a5466fa28af53104ba907221cebceb741b7ffb52a9af972','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(25,'2024-07-26 13:36:32.510016','2024-07-26 13:36:32.414031','1970-01-01 00:00:00.095920','rsa_sha256_pss:28930c056711644ed370690bab06a4443ebb9568a5881fcfa8d77dc99f56709f4ef5e3668fcf3594f2f8e2518e329b36ed34341515c75729f02e028826a6ba33c1be793de7bb586d6cf84c49c0cba8745f8e2c8b6adc16715b7b02606ad97a4533733c6f4c8512567b36172ca37b4af74651c97d215b438c5b9b66092ca4e47d08529935771922dfa5dd1a601aad5db0e9274babf865f828c481fd253f6f5ab9cfce98de9a908019fe073689b1768122202d303be690eab3d9f467fc5e7b894c1bbfaac312381271ef367f54481bafb0ca17fa6a9468782d49f2a04f36beba101252c28f3893b1ce128a562238f80cc402a89f0cd5468fc4a7b18d397f5d245e','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(26,'2024-07-26 13:36:32.518054','2024-07-26 13:36:32.419143','1970-01-01 00:00:00.098857','rsa_sha256_pss:85e00d42efae592b4c257acfa6cc969c91c1e3d7bda1a45d405809bde1e6c7a90d49c62cc7c635a3b17c29e57609f1a5b5df6383a6dfa2df3a04d140ee58cb74d99b4507a7e02659d75dbfa364d4acde1b569a2f1b6f25d2806151baa7ad64f18fee1b096d75555030a37e287af02892c9f4d2b7e283d03fc3460be35f9a948339a13f749e2151541049be900d2ad586b20f9c414aaf4a4507d4dc813fa2ca6db05694688c8dde1a5a0b9aeb23b745ad62b2545073d4890c715cecf77fe5ac47a51329f0d2a94fe8ae4baff5da2fa35f9b4a5bbd18bd4d15f121b5ecaabaeac4507acd6e67613872ba153a11b2b03ea1cfff3498a99918846142d372854252bb','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(27,'2024-07-26 13:36:32.790546','2024-07-26 13:36:32.665228','1970-01-01 00:00:00.125262','rsa_sha256_pss:0e197752b75d99f471058b801e1dc34e2ba4b6f829fb89f17b390f8aa23f4925ff07f8e5b03a086a08fd5ba31c6cd07a92fee0743e644a9e0a7eb5c7893698a4d6804c7227217ad58287b1ac2a9d9eb42f76a7b932c1283d723c7dfac26fb522584eb5e6dd8d3604d1b4829ae42fab7509034099d2434ca508cd4ebbd96e65d558c3ca02f7fbd5bf4176bc57bf22e9c6b8bad6bd52145ea6e6cab01768140b6aaa5491cf1c130c19daf202068ed03f2f675b8adf2f9ceb6f317ad8100300a9adc8926f3b270b2ac2edd7d8cbf720bba51e99a2901b7c1cd48386b9d27b0f66d5badf2f213a362f5086b0d9891e38db6071705c34d765c31a810f9dccf53059d8','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(28,'2024-07-26 13:36:32.806589','2024-07-26 13:36:32.667025','1970-01-01 00:00:00.139506','rsa_sha256_pss:8b0bb9efbb32c98856245ed7fdd3b17748e26e33433f6c26e12831c3f8fe00e069dc7e650f6479f87059f61dca64903657ae15c371ad09af015f19331fdb55e0abd29123492415bbfecf22aaf2dd91f3b8387747274bbb376b97cebcaec3bedbef24b3bde0ab4fcba8d5d2a02a9cd2e7b602f8c3cabcb6ef9ccea7dc5cb136a07ff25541097f42ac72222fed439f4a7f8caca52e0ff473353ea25869861b1e9a948d91f1a8463f16de93c305a9738751b687a0988915dfe28bcd48ef694e035a4136783004583440cad05b67703b73b8cf45960562c8c99e9629a08b4e6e4bb4659f5f9d10453c2ee71d9d6c56cff898cc769fc73bad3c280a082949563ea40d','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(29,'2024-07-26 13:36:32.807210','2024-07-26 13:36:32.670017','1970-01-01 00:00:00.137095','rsa_sha256_pss:94c9439d33b1c0dd4859a518c305597c5b0bc25f573aeea7ffb67875af75a8127358b8e183172af4988b8d780cfbaa31bd212b47d28c727edd21efbebb39c5d3996c0c9d5ca3f7dc35afb32b936b42b8ee77897e64f0a74c6e13d20fa961bd2201c95badb44b12687f2f15c87b63cd6116651f3d8f81982675d536d4c009dd610e71206340c501c85d9e0bbae5c9b36215c496124303e05f25f123e043723038cdfc4dd2ac0a61d3a5320a0aeec310eab7c703bd2ddb7c1355fecaa2e3e624eedf6b6bed90986d8623756dc310a4a9726c074a1c2df1ad60d6c30a09a5120a4cc9490753eaa259f90c059da6221047218354476c879c4fe9df782466357c7b07','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(30,'2024-07-26 13:36:32.811024','2024-07-26 13:36:32.668760','1970-01-01 00:00:00.142189','rsa_sha256_pss:7246363240c8f66e3b65b841d90f95ef0d40dc6fbd8ffcfd22f746908ce84a4f3eedf95b454b1ceac743e924930170cfe91fffaffaa4710e4377d84774f506b5df60aa7120c104b92819bcf04a3759af0a99b9f2f0b6a9c4eb6bf694004a9bdd52e577518764ab2b15ed47c457cbac96090a80663201dce62e7b653ce8dcc144078f9826f8b8d9e7643064819c87d7622f07e1e2804103c3cbd2246b529213a03cdb6eb348c1ebf6edb1fcbf8c59b4645530b039fc26e80468dda2ab5096972e62654542f359a673a44f0e1454a955eecae93f8fcf11926c1be45fd2419ad6f833892946341ee1fd0d771ac22100cc1304611811a65d09a94a4bf84fe8ee1a87','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(31,'2024-07-26 13:36:32.909696','2024-07-26 13:36:32.669013','1970-01-01 00:00:00.240618','rsa_sha256_pss:30caa8dc86cab90e00317b555aa8655cb0f2ad9e1826388c1671fd55c6beabb026da26280143691f3b7c9bcb3eb166ecd1de7946607f32b2d1a1342dc010fb337dbaf6c2eb82d2758dcde88eca5960616588d4e26a150f119410ef88aa6db6fafaa732ba8e06d3c55c511fa4a62b08e7e6a2effd398d92882264eaae5cb06ee97f68aade15d2cc3cd7b999b219c08aec673542eaf88112520f3bd7b8cbfdf179866d549b069c8bd3d4a1cf9ee6ce187d4203ace290ce833ac5e36dcda66a2bc13efd1c79ed047150de2da765986b1ce5071f7a1adaf976455798d38a0d5776924f473b7b7ba10bc153a86fb5d8932bceb0b327c439eabfed2de5bdd789d42ce3','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(32,'2024-07-26 13:36:33.760564','2024-07-26 13:36:33.648268','1970-01-01 00:00:00.112232','rsa_sha256_pss:39e46440a3c8282fbf30e98c4ba9e1f447ac2cc10ed4dd7a1647cf258e1f554f48db09089b5123c3d34e2abbb00c5294760a6e73564f8aaf5d9b451e9b5c9cad4132318601339249f1662f1000678c451ec6195c1dd637f8cc54ea5d078a9275fddc1c58266bab31100acac87c7d4ca96c5cbe176735a51e085b0cbff263dd0e3a0406323742bc331ccdf48757ba727aac2956ebf7e775a45e150df10a001179ede48ce008e4625fc44a43a6741dcd1e0a9d12a9275e3c38cf40c32fd14257cc33632b362959a0e561c9407705b94c98fa4342165e62cb53f3aad4ba6db409c2ea645120e090623969131910f1003e47c7580c65133239bdfa7b9fe4cefd8803','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(33,'2024-07-26 13:36:33.770986','2024-07-26 13:36:33.648337','1970-01-01 00:00:00.122593','rsa_sha256_pss:4e74bed05513056d9b4bdc4439c7426e462c45dd947d7f54272c78af5de1d5309c0349b5b7bee98fdd861be4601a2e044be5facbc9290b0b0e4ff2bbfb08de35c8518b65d8dc97457fc040e1ec1f064eeb9e253d5123fd35d3449163c5b63070f1f2d83077312814d3987f2821021892141bee9d805b765b74f04398624f6e5818b9e28128c8433428e8ab9645ccf5c4c49ef4eb67401d75c54ce0fa2ec176e0280634d54fc8264c3a4b68d4beba6e3b79cd9e2b17f9ec5d7d3847d01fcf596f08f7a0a545d55f60eb1f7fa1e92feee5c7f8599c0ea684f7c20e8f0cd7e7a97e136abe2857f452e60e1022fc4829f36bdd882c23c0b0402f0d34e110c07ef6e2','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(34,'2024-07-26 13:36:33.772821','2024-07-26 13:36:33.667525','1970-01-01 00:00:00.105222','rsa_sha256_pss:26345e7cd9dd94366c0705a6dc92abf16f088a7726a7c1a32d121fd03f81288111fd656289d256fc6c319d93e7e679bb071bf1736517ed918c2ad50c02fc336a82240526338233eea71e6fc4b5a18cb06b3af0490e3d324b8bd2c324571b361e165ecc78ec940ad90c084962cc8c064db3a664fffc523e414ca8c8117bac8a1387a0040285ede9bb743453f7311db7c6dcd59f639abfebf030db52f4493979989d76fd96bb6c342c06d016e30c3dea7e870121d5b9bdb044f682f496579a7883c18082c29233e97d817944ab6a4be2df2b836fc84f6273c8bd511b543bad788c90da4054f52bc5d28a02ebccbbb20922655fa14b41f4dcffa3fbb843362c6d4b','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(35,'2024-07-26 13:36:33.777683','2024-07-26 13:36:33.667040','1970-01-01 00:00:00.110531','rsa_sha256_pss:38dbf59a60cff8d7b6ee4603819c8a6e4215ac90c17eaa4d348a7e87143f3ac12d837f6648dabc3412f796b4b1d438aff196a352436e1e73ce37d4fe41d1e70b4c895c109abeed12bb1b74bb798459e954c66cc2c38316f7637d0e22b05e3c8ce38a3d1beb316fc2b959e80fcc48c9f1da85cfd329bb2dc320476374ed9f3d6d1ed683434d5e8b24d31086ceb1dd1dadd5fd8e8a3c0abff4af4406d274f1b2daa89e0f632c563ed4f4e235f1f17ed6a0ef17741cab2eb5cba4cc8aca2dab6e29c8316ff0a0d6f0d5a16700bdc38d22f47d90710b9052d308533f22136ae92d70c49a87c7be7f069c1adfdc48f8d7d2ab8590b7cbd696febd6c33d4b91e2e4dc7','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(36,'2024-07-26 13:36:33.790999','2024-07-26 13:36:33.666826','1970-01-01 00:00:00.124096','rsa_sha256_pss:20a2b74101b7f6a5d409ef06a0e0b890a79ba9f4ab96bcb4bea62abb79e11ed9535585d13378e61350231ab78562c4597d9bc00b17119a04efd73f28e32f66c8be98a722fb9771adc48433114e131a0b79793dee1c8865547ff60c4c7a2b4784f40fe0fef698667ed10a24f60ee93be68ddfa5a88430a5e427ef61400eaf2ac1d855ba572cdf8129db11e0dba8fa813797b38d9f09f521f02115b9a3d3ee2cd5794e8501647889ac61a66f69608f02ef83860abe9784a5c65cf105283292ee0d6c23f1bf69e9f5c200ce1325869943c55d113fc704857f87a9e757aa5f87860eafe194c301cb1ed5757e0a4a7c2597bbf4ad296302db58270ad52732024af838','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(37,'2024-07-26 13:36:34.160544','2024-07-26 13:36:34.071153','1970-01-01 00:00:00.089333','rsa_sha256_pss:3fa1fc9ebc08b9a0df340f7288529be1abdf2d00f313a9436598cbc7ee455726825b01223a219505fe1d7b0d7c4034ef3e88cdae41c6eadce7e41e1e8704809b99afb457bbc16437bc193ae4bcd8249ed14ab28bd6b007e359440e424799bb1187a6df8d4f6012cd44f66f6b52a5204346f58bb53278caa5288987aefaa45d4872abff4ec357c5263361ed35e955647a9482aea725a10f4aa916289f565e724e7d96a3907252d7887ba62acd450f8b23ab9609898644e2bf14a08386874b82a554a7ca545bb7136bd60feb6101a606bd74320abf37c9d86f136adc5f7fcd6ac8cd8772b7582f494cc8c2c8bb90382df4fc89fade2b193bebf7ca39dfc099397f','GET /machineresolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(38,'2024-07-26 13:36:34.672055','2024-07-26 13:36:34.574691','1970-01-01 00:00:00.097286','rsa_sha256_pss:6377f68fee6848ba1d93e28fd458e38fd2c8f608a6c7576d61c5528861c07e440eaba7eb0c8b32df97725b5e84ced5c27818cbba78a151c45446ba7f2c7833ebc67008c79ad34b1a52de75dd86e5eff2151b9f32ddb775cda897649f6ec46c11040b44b876ac9ce573b8af1cd8ac80b93042c5238208295a7770d2015fa8c622cd7e20766e34bd731340696c184901eb0f53edd90e860dc1a7cf6204178f1aa74f821525c08ca40c29edca4cc3a2e37d9299d4cd9c111b1b58289e242c25dc598c53180fd954984ed0deb143dcf5a38d2ac1010ec13c62cdd0e0fe964cb8d96ba9342d85d26ac8dc7aa84f6a49944a860c0846039fb2d0d18c157794fd8f6936','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(39,'2024-07-26 13:36:34.676595','2024-07-26 13:36:34.571244','1970-01-01 00:00:00.105293','rsa_sha256_pss:4f0f29297c5e2e8cf47492fa166d3b73cc4b736b3e56ca0d601205c9d44bfdf3413a25c2640cf92eb99abfdd6bf25181c843f5a6aad4e1b2e4b1be7d36c623d942b853724f3d3eacfd87ad75898c4c404c3971eb2d0986f68ee7599b90754e104a8c0e45672df642d1ff636dc14db1c8e3318a8c75f9c5ea4e95c8f230957c98f7f598f5d5c4cde61bd86144b9c601911f6f8ea51a191f1ce93e7fa380dfa66766457eb16048e1dbb437c9c6472b790bc3fe6b809982f0e7c59be595e775cce938d49c9863b6f7b89ae5de7a7b592d7dd46dac54f3730be0b33cb00b2b322b986b964b628d60c8057f70e3af735814bc003e987736773fb60d4691bde795fd0a','GET /smsgateway/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(40,'2024-07-26 13:36:34.679370','2024-07-26 13:36:34.569809','1970-01-01 00:00:00.109456','rsa_sha256_pss:8005cd8a92f4c08da020effbf35778cbe352a21e164df4f106d626c32bcd258ab77b6d883cc532e4b324819456e4dc05b5cf7759fc5d0dcbaab1f586343b63476706cb18276e61694c06fda2edcc4f1a64e7ea9edf5cf779817c960b2510013a94fa2f67b171df9149c2ee41e72ec057172e16089e2e81e6fc5201055c87b3b8fa43db9f6da481cf33675fbeea7cbb663b80f397b3d1ace33002f480e610d3ec057e1f01ab78389736d66a2139c47a9c21735eb72abd7d0ab56c6ce50ea6d0b165e655dc3015a8b58af7f9286b7bc4ae342de9a6e7223c4951597a6b95db42edd04adc4d16da4483ca71a994d6b58afb9a840fa1e67f8910ab0de4f3380f93c7','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(41,'2024-07-26 13:36:34.793404','2024-07-26 13:36:34.695050','1970-01-01 00:00:00.098283','rsa_sha256_pss:5ebae5b955208c450fc2eb521da6d536d44c2e85692d85796ff0e53bc62596b1107375cc5a3acec99f4a9b023bedc46f3a52ffaf1bdcd66645435c3906d14c7b981448bf69784c7df302c7d182b22542e49cb19f58dd6ddac90ff56d8d8de9a9c09fa230be34f53af2bb084bf70054bafd405c5717c84bbac1596258a232ab4af8a71f07d8e6647a30728d346b453f60c7a46254a507bc4e297a004fcf440133bfea43bba89152fe9ad3605e2c1c66ce0d69633e5143217b89937c96f5132c9e2a31965e6ded2f071e13839d7f5f09e08e5586c9293ed3324bec0d88049d611cb3cd34423668d57730d22296a7435e2d4e70466edc0625e3973536909e39e1ee','GET /smsgateway/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(42,'2024-07-26 13:36:34.793816','2024-07-26 13:36:34.699499','1970-01-01 00:00:00.094246','rsa_sha256_pss:13d2fabb9c0811ec565f24a7185d11d6ab2e310d2389fe34b6041698e9da0d820894c888ff805d51be8deb8d725c6152c4fa668fb4a6e5e62fbcf488e31c8c53e674bd6a64be92bb58fd6a1ce6a01792249ab7d026393ca7897ee022feb1111025c95a5104f2b90bf31eef0841fbc90544737016fe4dfd1302578f8daa7f866e22ba3254e3e042e5bbe207a64561ba0cdb92ffba1c9ff1b5f12aca079da1fca112166fb0bd8b523162eb357faea226d2d87b93a5d186aeb5bcf833e38f41fef6ea092b2a236e560ed3fd5ee81ea5f5ef325ed607d894e07d49f5447fde7ee032f6be92f35e2b1a90d91fb4bd3791a852496da59804d0bfe546e869dfc3f8be88','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(43,'2024-07-26 13:36:34.795882','2024-07-26 13:36:34.693160','1970-01-01 00:00:00.102661','rsa_sha256_pss:696237bf4cc2f05febff96cbdcd6f739a78c0926873169f1b935b2364d4f8593a3eb072e344e0586cc4bb65b78843f7fd6aad933174ef1080dc25cc8d1db574511161282f98f79e65587d6c7679c26202bac06708c3838b9331b9e2728993674599de899a36e4f586652d780f221a6544fef4c9964e8253f2fbba0705c286beff5fd25e633dd46c51b34d4f67ef104c6edfda115f5a82c969aac47f8c8f416188e73aa2e8eb0399291eba06736b7c77d6e8ba1ef3c5dcead8fc0e07b2ae2120c42c020652c9e8db46552f0913c118eb5af3fea762461de2d4e08a195c4428cc6921ff4e95cca141a28eceace2ee9b237dab84eb4528032d4934e2456eb8b0e55','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(44,'2024-07-26 13:36:35.509293','2024-07-26 13:36:35.420189','1970-01-01 00:00:00.089053','rsa_sha256_pss:17d30e5bc3914e949621db16eef63cca69b073bd7f256004cab5d0d3e028de7e2a92ca96383ac05ad84d164ce8fabfc38348cc0bf15a0105bf167668918e88c7a573313510ddd058393bf4d262aeeee5770d9960e919fd022b06915a9b789fa39102714dedb47b21befc9b622548099c047bebbe0c2836240b3266d6a9a62e414684fdc9aba6e2fca9dfb6db809b79d62b020070a81366279170522c6ab0ca03a1961b2e45346759b4361b5944aa1555ea95fb29c14ec69026b3ac2fe194ef1cdc8bd157e0411cdf1cbd54b62432eb0e20e1a374ec6e6fe08955b2df869a8af4a8d4c5e6b47e16963fd9e809e3bad19d360bd8f0fc96664413897e63bfe4b8d4','GET /machineresolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(45,'2024-07-26 13:36:37.924768','2024-07-26 13:36:37.835859','1970-01-01 00:00:00.088856','rsa_sha256_pss:7999c932d76945287503ae08f64368b9c9108d2fb6070708c25096eee2002be8267fadd6dfbae943e536179dadc646bf66cfa2760f95166d5203bbb9be1994c92bb99de8ae5f0cc8cfb2e465ba74a7b3663f69904cb84c1de382bfae932e7bf6b043d5f89d335c8602ff3f20ae8eb973b36cc2f3ee28af4c01e93d4db3d996d33828f8ed395f6af2d9b8e7d6a974d31b26bb4161bd81a59b761f56d4793f2d1f9e75981966f46a24c4ef012430fb326741151239235d763a3d92310798fd4cc99b9c46cab2c23747d3d776823c3790aa10daba7bae6f26c01304c523b04f57b7ec8c5c4ba27b42c81aa5e9c96ef52f1a0ae8664079cde081f123f030eb993ae1','GET /machineresolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(46,'2024-07-26 13:36:37.928407','2024-07-26 13:36:37.835977','1970-01-01 00:00:00.092376','rsa_sha256_pss:a1e32fd1ce18cd730dbbc937a699d957270ce36b0f79ee61883b86fe805489260df6b9a3feaa2e930fc3f1d4ebb56990a92bc24087a558359fd5ce02e1bda76bbd0eb6d1639ef734973532a17fb78551c23aae5a02581fd3109462fca72a5527549e2b3252c64019efeafc9e698f5420405a760222afebb965842e661275aa248cd72ac22b05b0c959e012d42b3712592b4a1aef51a1f9efb6dc87933cdefc00d88f5062c19132106697d82343274db78fa7773302ce8ef734c23fcab9af2d5c687726be5ab9c9d01c1f9cbc4f8112828cc45c62beaa0b63116a64a25cb5e0f8e21db3a67795ee929535e5c865ff33bdee667ee7f32ec049ae074d9d531c9af1','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(47,'2024-07-26 13:36:38.078335','2024-07-26 13:36:37.955590','1970-01-01 00:00:00.122683','rsa_sha256_pss:2092bbd99c11b775a73a65e4969722660276f13b2d808a9ec56faa7a94f5c07b9097c5015a6c077a70e9ffcb9369719037d895e432edeb532cc5f236410473ea0e361e8bd7e47cb292f6e1b98da43a0c793607efe5be256e0a129ccd02114b37c84ca4748dd7b5bb742fbeaec182ac2db588bdfe33b0a04a6bb13952e3f380c4eea8b22fc365f759caa99be9f96802986e4f47c4e52fd92af63c6788e0d9e286ea5a68fa9756ad59124153591e0b2f565c839f3a39c2bbdd12fafe2de53367956f4a5a957d68afae5bf35cd10ca9322e3b70179abe4d21547ad3bcb4bb7531e32dd808fdf44644586d6f5cb37f6318264d7b8f2a6d964601a36dfaf56d32aa73','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(48,'2024-07-26 13:36:38.078497','2024-07-26 13:36:37.949308','1970-01-01 00:00:00.129132','rsa_sha256_pss:7eba2bac21506fa892b4b7d6028c56a6056cbd90bc094a5cce79e5f3fa5b596c74638fd3c3db3025f0aefa410e5c245e82421a5dc16cf401be0dddf44e13f6593a139503accfa5868d71867f032840e5b42a81c4d3e236b5e6e152a88ce60d1d1a79c5be4e4cf8289b25f7277a9cedb643577b2ce873aa477d2e7fb347ef160898a472031c62d17fa641076ae1ee363318f4ebeabf1a20900d0c91f907e4cc0bc2a1efb886d461ad878f7d7e4f84ea79c9031e4baaaa13b686a366f4439dc73a0b91092f994e67bd9f0f8c07c986e97c96f8f5a73a629295136229a0e4d324fff8f5385c1b0d8a49a350a4b7410156131604242e693a5449ca77011d128ada1b','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(49,'2024-07-26 13:36:38.089028','2024-07-26 13:36:37.964354','1970-01-01 00:00:00.124585','rsa_sha256_pss:55d0e64903499697bfc931d46791e95fca23729aa1192afc23ff4956102ad63bdfc266d0c8948641aecbcec5ca6469c7b5b52ffe40012d3a9880e058ace8499177ab443cfa53d83dbfb16221bc7452ca5f66d9edfc9d8fe7e1c3b221472c80f4ce6f3e9d86562adc32f209d2568679ef8747dadf127a1f77ccfa283eb8ec3625f3a5d7c99e22fccbfb2a6fbe1fcc1f30f65e09f2cb4ebd95b466781c6993441f7d7bf6a0dfde9512cc0785ea13fd19fe1f2bec928b028dc7b876a132b3cec9b445131d532e86b6aebefd7d15ff3bc2470163f10f73a8c69664d4d10abc149cd4c60b6efbc0969eadbb41ab48c8b9cac82f3a18d39b853207ed39ddce671b001f','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(50,'2024-07-26 13:36:38.091262','2024-07-26 13:36:37.955371','1970-01-01 00:00:00.135836','rsa_sha256_pss:3a03b7cd5427c59412b614a7bd7e5ed0f43b6bbbedee59a7ab60ac2bad266d319e26ea2c990b555c3826831be847d88d97dea0251aa0dda0cbc0a161a692bcc631d6855a0fa702c5e73484efdbfa4c02dc30c82307c5b806ef229286cc503c73fdd82d3e3f688011dea9482fe772fa652cf6ac000f909c8958acbfe219083a9233ed56b422aae24d1de6665225b586b1655f913124a019bcc8cf2c2f7d9e3e42ee04e2f0a53f012830c6cc6b1d330183cdd2306b4dec10beb510f1d8d8c0e62fd03e3079f6ad18891ab0cd22ddf16445971bae91ea1fedf7db37c7030dd9cca0d1470176b3f938e55e4ab2f1bd795f66e140e646f855382fb6663cc540be17b1','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(51,'2024-07-26 13:36:38.097187','2024-07-26 13:36:37.965083','1970-01-01 00:00:00.131993','rsa_sha256_pss:0da4c17d075629ab298d548e8b4edb0fd12e2480ba37b6638052ede8f321de82a71d22e2f61d8dabebad3cdc80c86ae6bb974fb1b97349ae84587b411a4be1496d3331a4f7fe8796ac575952a56b350ac146d56810833ea1b9852b1b96c639b1527eeec8117d0b8d1440021206844e0e6735cc9b44e7542f8906e79b83a48d05ff7575a7d1f83a34216000b918dccac6178bbc774c0eafd1ceadc7d49a2a9b78670998c7150306a174057655defac1bc98db9801e85b5a156217b2ffdecc0e2ed49c09627d9acff36f27d68fa0473d1d2a8a012fd88d2489f7426a6e596663777d35820e301917a6bf28d1b81153c07c7a3bb1aecd5d9a9f3bb423d2dc78b678','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(52,'2024-07-26 13:36:40.049746','2024-07-26 13:36:39.955325','1970-01-01 00:00:00.094368','rsa_sha256_pss:1c85fd21276b3db0eb2c0065c51d61c4b50d99f8ec2e057a399d039b1209d658cbec47d2eacb2e634bd82caf9d6f5e0572c4fc161f5cc262aaf8036746bb2527947ca9dbe22dcb3e24d6c83ea75d6a31c81803cfd124204b9ff59a03162288909a9e954527a688f9aaa23c7bf368e96ab72d684d2e0213d99a723db332470174cdf0e1a9a566af76cadfe7b30b6191331588ae60dc10744179b8f30ccead8bea114125f52bc71d298ccca6baf6a5059c4863fdc8d0bd9bad3027a709e5c43c60986213cd8083aa81d15520ea6f0aca909e49928f31f1fe3aa40bb7cd57fbe677e16c40a0321779977f61630ac10d310aac4e570044b028923f3b953ea0a67725','GET /smsgateway/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(53,'2024-07-26 13:36:40.054086','2024-07-26 13:36:39.955046','1970-01-01 00:00:00.098971','rsa_sha256_pss:465b985de01986d07745e13a7ca8d64206280d10bc9380c05672db371ffa93bcbd49eec08b0dc1e9db950a1e148bf6db68212d533054f581464a0dd867f736248fba9c4d911ecc40be70ed96681f9d24db0bedbabdc7ac58429a50bf74e938a045ca9d78a8041452da8040ac69d2a7f270f0e9e3aca97adec04d3ce26ccb35aeb1ca18b9b8e1aef76fef8b3fc6bd0fc32e35d9d90b53bb758047e2a74aecd3f494d8c18650b8124c6ca2c48b1216d724fa3a575046b9cc0de6f98fa40d41998126fbc2c4ef83dd801f26fe681047e43f7b2801c26840871721da7b411e151e63fcd80f9da6329182e92c62fb7bb87c83f28a34db11155e75cffc2375aff1eb73','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(54,'2024-07-26 13:36:40.055284','2024-07-26 13:36:39.958062','1970-01-01 00:00:00.097122','rsa_sha256_pss:730027179a8e9d8ce31b792da7f98cc4b5d2746fe08d892b4a9da3460d6089aab8af7aabe7d9852e1ef7e7dff488f69d1dfd65875fd24ebcd64138d12c2dbf926287cd4fbdb5c414c68d1067ee716d6ccf1e537febcef101a6df25b7779e8de87c911c8bc0736456bb93c0429d276e6fa38e2af6dbb4718835d27c147623917be19a013d1534a012281f9b02ca1804b9b9e8d7142a9193382a940078116a2ad4ffb5260531d1ebacde6fdc7d2867984719eff30e1b167cf8cf49b467a4cad5de544af5c6fff4b7c98503c18a26a6c175969418135cbc5401ec52923a16e12040b0ada142aff346247d9dc6ec701609cff7b76d61d14f65db948fcb2e194b8b6d','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(55,'2024-07-26 13:36:40.172117','2024-07-26 13:36:40.077085','1970-01-01 00:00:00.094978','rsa_sha256_pss:4d94e9339774dc59301ad3c157f27864a4e68c2bd33bd0cc0c248633279202b9b72e9a3c026befc79caac7f48a82be947b1230052af129884adc96a0ad3eeb09c600f4f738a356fd6cd0a85eda7a6026c79f68e21c0ca0cd0bad1dc713a0dd10d06fd39a378de1e7b8af33f92570880eef5f200ead8790c3d94a0af259a7e35587d33dc384745f9076b9bde6c5ae21bd57577feb909ed167aafe4ed1cd83bf75bea4bad66293780e19c59ced589b18b0f3f3676805d89bc90c771e15c19459d56d0be238b56d92cb429f891e7bc42f8e348c925c57074864731c2d7ad2bef1eab1d8a2dd142ff67b2484a44ca9254445945347661acd02b9039425dce172e2d9','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(56,'2024-07-26 13:36:40.183797','2024-07-26 13:36:40.075404','1970-01-01 00:00:00.108339','rsa_sha256_pss:1b4207d1ba7a43550806a92dd467c1dc672fa1bc10b33bf79cc900a1fece5c6642d78bec6b7395220e3a3a0d93c5d6357a9a436b9a3ed62db73fd62c36e9c45c6076a83408e0a4a44a5b76563ab6ad05db828b9a7122ca71c0831a86377d78c2a4f4133c7d2e717bc9ca3138d7c4afeddde8ea0dab0b6c3c9914095d5403ccea3bab6a9391fc173322c85070fa1db0b480ea54e0ccb51ba9ab4a0ef2afd6fa10eb9b0af7c068dc2d9917473bdb143a1f952d06e77a89a62052897ebb984025b669a1475df817d91d27dbe99841fd94dde79d10e9242a0ac7c3b202cb76ef77a135e60e3364c7ebe43f1c9c1ae86287b32e525ae514b45815b946f4c93988e5a8','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(57,'2024-07-26 13:36:40.189266','2024-07-26 13:36:40.070432','1970-01-01 00:00:00.118775','rsa_sha256_pss:b386c80d6d75fbed93cf7737f3374357c8bfe29ad75781c2193ba2c48f67f8f479e0b48d960e948d8e02dc4754a22bcc11f13162ba9ff1dc889bf14065d8fe04e882897e6cdb5226b21826b3b5f682bdf70bfdbb0d3150e04457c5b9dd238929ecbad0c218f9f07afb552f25647ee2f765512b56149acfdaf5cec401027a3904e97cb57305e026f16761c14e90b8aaff9e936b456163aeb7d96a7e09ba16e7940475ca8674f8520c329b5723c5ce0d33c907e3ef6dda255e5bcb9bcb0c699f8dca5144adb11c8b6c14b3926d175d9fa2f9d0a483d68016ec4851a2829d41088dd45b76b64858deda64cec17c202748aea9338290bf95c5e3b4c034b1ce400893','GET /smsgateway/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(58,'2024-07-26 13:36:41.116872','2024-07-26 13:36:41.006493','1970-01-01 00:00:00.110322','rsa_sha256_pss:785121830b7821244ebbb18421d6933b479f28658707f212d144d5f0e154d2406c46d5b725fd9c2e09c80cf5749ce2b7c58f61f1619863ae72a8596bb39e30a1a648870bd0ea035f7ece6c856708f420e61747434904bba135972422aebf30020c536152f8a5bf8a2765336134d2a7109dd91561d9b4168a1e3d77d7e55e614b27014282d7ce46371e014ae45479d2c3aa7fa1f943bb443aeadecd4d3b3a778bb4c34b56e53d4c9afa07b75b6dc81d983d041d15a63d0817f43d6b3a03a797a91302195a5c11fd284a4bae730ce8c1147a7c86eec73a7134e043d524fa7c802bf7f6d8a99dab43e3a0c22526b1c5ec2a5e247dd6e39d5270dee205ec5f434c76','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(59,'2024-07-26 13:36:41.119092','2024-07-26 13:36:41.002072','1970-01-01 00:00:00.116958','rsa_sha256_pss:a6ed296c17989ba9cbbe167821eae598e4a672c3938e121dc9fbf3cf7864b3a550de07c286de6957b08ceebd63ca9df220e9bb26360c82dc72fe6b7c9880d135acabf0cd3d5b7974d0e3a6999c5314733edea64591455f2fcb8b17b40520998ec8cf2da908cde69e2db7918dac962d241b4b3e8793e1055dc9b9fc85c37ad35409f98f3c0f989dd3975b10c9b40659807143263dc1f240beba7eab811162a2e30d0f10b71f94c6f35def5cb93c8ab534a11e93c5c1c2b534b01c70c381df37fbbff90ded5793aade4e75b7b219245857e90c7a90d0ab452250c9ea53ea764cd510df47799ad9210f34e0f619bd76c64cb172ce7a638da176deca2a579da3f7b8','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(60,'2024-07-26 13:36:41.127738','2024-07-26 13:36:41.008400','1970-01-01 00:00:00.119278','rsa_sha256_pss:918ea9a86ef959203cb8d4a42109183fac9c0860dfd9568d5e8a43c7e9841d61e1689c15e70cc9bb1d687b819615298c4410d437a61b8743d7ba59cd533c420ffd0cc9e1dfc2538ca0934917e55671f6d4ed9e72bfeacad22cc5cd0c9f8eda6f2532e4f540e796efee59356aee763067aecc5d001a8c9ec0a228129e1d3bd2c48538c7aa9d668b1e8788037bf2ead80b4d6cd54f096498928cc82ff29b60a707de1fa77ce31eea904960686f17f1fb377c206f7c4a91c1427e60eff0b9bca897de7e038f4d30ef70781b6bc0c1ed72bda22bb045936d88854c4d0bc60bf57da722563606fa1976d6f6213031311123cc85b2ffa6e276c752d6097e415d397d71','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(61,'2024-07-26 13:36:41.128640','2024-07-26 13:36:41.003319','1970-01-01 00:00:00.125202','rsa_sha256_pss:85674ec123344b8cf3affa914dbd1610e34a87ab30c49ea27cc43f95f502fd806a144a014e64d0b48e41fedb138a59e0c1a976f3a6352ed67e07d8900ff1abe10e5dbe611cca502770456b76a854be2197a6dd062293eef52e9d5d3f51584cbc7841abd2480285c90818cb1afbf4b62d647a567cb77c3cdcf02a00a5cc79eae8a14ffdb0f0b4fa2ddb033846eec0840bb73780143ed530b8767d8fe03ebe19f2f6ed436509f36955c8ee543457d54c5cc773b7a7e3729535ec6efffe2ac427c0b5e9c779cd03ad6c57252a8f986364f167fe291e112eac44b738904ac7e04bb03c01716df5411e284160243f60acfa56a2becb7524b8f06842c31b1219c9bc59','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(62,'2024-07-26 13:36:41.135829','2024-07-26 13:36:41.006059','1970-01-01 00:00:00.129682','rsa_sha256_pss:63566d5a84b4241ec17d64ee5bfb62723275353bac8aaa6cd38c8c9124c77108f0379c654be33a487a19aaa5f7affe152a5017a166a72b71ab040c3d1b2b190e184cabf6a291404fe3095d54fae1e6177a087012a5ec169c54f1089ef62c1ab423b515f84e74756f64b1ac22e1f9d803ed96e41c2080b9053ecec9e1911746c3fad9d9444c23419770f1e6aab37ce5ed6e1824437be2269c25a1d9988184b7750141eb125a409cbb5d689a5298c433b4cdde1a5e087cb1c16495194521a16555a6d31ccd10ccb87dfe2b639f0df8a16d234f87137c55a89498016ac26ce3ef57ca236dc172a5892e672eb7e4b670a33a2678a62d6783da4194001e204bc3ed3d','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(63,'2024-07-26 13:36:47.559703','2024-07-26 13:36:47.435745','1970-01-01 00:00:00.123891','rsa_sha256_pss:6f4557bee0b45b52bc43d50a916fca014fcba372f289107f9298707d79c6e208cc7348ca6b1294e63559432ce6fb95c09b7dad30ecec4f0748ac78a89832398b565d203b930d7091c6cd77ca8c83742a5ad191af986070a85815bdd6bbf30c7828e70e42e0a2c41797c8bf1f1874dbba88fa4894ea07d9337a0f5c0980510db4c08f080428b611b60a10a1541233db14644e2804efbd05c1410933ba879be37b4e113fee56860f9d56462b027511b8a425b769e6beb37b57c4572f1151e0d859fe2fd4a2c3d71783097bd0aee2aba7c2e4dd69ef23553118622d3f3f23de165b8b4994baeee583ad47733248a098a2c49040f76e1ad0e48bf6bf1f44ca5a8990','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(64,'2024-07-26 13:36:47.560538','2024-07-26 13:36:47.435588','1970-01-01 00:00:00.124867','rsa_sha256_pss:b41da6e1d5ea0bfeafc0c82d2a132f8e35a6443e536c710e1766828a2faa79798575c3d6ea4a9a0f20927d5de5532a56126195ee4a477f8010c111a4b25ea83d51e50453c8d303a48a218937a6fececb1c50726cd87ca93a0fd41a30ddf4b7c69ad4c32b33d8a0865398a203d6e775c7cbb8be6f56ce916086c49e616286bd4fcedc63f031ad9dfc19a3e8a9b32530e2c32c1e3c44e93b57a9260a9d26e3923a3fedddea1b70f72d9ffe6fd3efe26b614cc2eb92c776c5e0d9d3663c0d8c5ac4786892faf4b1cd37eef1a1220ecfadcbcdc7de1db430e5d3d07e5acf7a5de52898f3737e5f71b6710df8748850817e2798c09cdd3afd0291d40f2147d7e192e0','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(65,'2024-07-26 13:36:47.560664','2024-07-26 13:36:47.443159','1970-01-01 00:00:00.117424','rsa_sha256_pss:00015052f7bdb6a4efc5b70cf42c176d2a81f26f88059cfd6b272345c838ef3cd8471581beb13852d414519caddb744c2011bf32b3860f4fd811a5f81391b2f41693229733c6c4b79bd83522b2e269503f58e4590b0c343b3e88010b056e895db075c1d0318478c01a926cd3bd09fe465809c3f93cb04d1402d2968a0b330c7dcbf97d5ef4afdf74e89e79e2379306a799879e97dc8bf09cc9a98168cba98ac867dc50d79dfc3483b0e6fffd30d5e706374f065fc0ac485d703a2aaa6d1005356fdb5dc8f59749b8b9b25a2d1fd724a70bc7cba5d4888a6a1eed9908e14578a8b909c6600a43e4cbf35de73d250a81e007210f38671890c76e24e916f11d010a','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(66,'2024-07-26 13:36:47.560497','2024-07-26 13:36:47.450311','1970-01-01 00:00:00.110078','rsa_sha256_pss:25cfa60a25be640e629844cd2f85b4f215a5d100b0a850a59db9c10b4a355fd7fb5239d0e25a568fc2dd45ac573260eceb988636cf533b9e9f366f7cd4cf24fbea0d500e7126e977946d848d9eff916e6933b7923f43c26aac49793dbae4c61d918a22f14d06686a0cf5199dfd3dc5ddeeaae8337a8ac000b51312c9ead787f45540d28338b2ef28e02c2a054afbca9d64cd665258f90a9467ee390b0a644402208b8e40bb0fff390b10fb011aee86e1b9ea82def9d63d842d43dc1c5c037a3f7b55061a40faf1c85a77379f55f66e6e2bdcabe333fb3e30c168b3270cd3feaf237bfd15d8ce1d322ea4a2b46ec99721e1f126512565ed45f5ecf98d41f4aa33','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(67,'2024-07-26 13:36:47.566672','2024-07-26 13:36:47.444029','1970-01-01 00:00:00.122583','rsa_sha256_pss:024c0265f11b32aeb7aa9b5652405dfa25853bdcd1f04a9a7dcd4d755b7a165596d5286beaad9f550e8cfe828e58b7ecdc4ab4663760d0e8169cc72bec55b29d309f8ac6f71472ecd6537e7aa0b7db76720a1f3858565c72749c43b21c7fc5cad91861cd617ab6cec251383074a4f34a8df044c494a27ae9e2da496ae42f9250d431697e25e871af41bc31ddcbfcb23904a8902201fec3405903292edd454250db1a0cf5c26c95e93dd12796d2f791841ee59eb5889b1a189c8cd26e23f6ff85d995bd12a1232179c21dac97057572ef0b3542cc3fcb1de45d1519656ee52706b36e6460e86ee03b0ca45f57b2bb9f001e122329eb123eb3e07ce9920ec1e7de','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(68,'2024-07-26 13:36:58.118611','2024-07-26 13:36:57.776222','1970-01-01 00:00:00.342325','rsa_sha256_pss:57ee212e4034705d743eb3c52e7d29ce7ee4b058c3324c79e83d22e6f3cb136dfe2f30d01cb59ca5df6d94f5e665d33ee6febf7b684f8bb55d715e62a4845196c3df66d4acb7f688842b3460ef4bcea22d3453ea7922fddb4fedb05304055df44be41d8a86e9a3d7fb9a5b0c47d557bee02d7d52cf0185bb4a356d14df43baeda7ec4123fd4e6070daa7a14b86bec212819de7384f663495b0910a13dcc89871b800e28c26208097e5fb0675d5b083f5535bbf68ab2f06385ceb045c3ba28e25e8da3e1a8a964b20ab22e889ca4ea90a395e7763655010abceddda526e1182a847e391dd06da613527d9e0ee044ac9b6a971614007c92ed21276fb114d47ae2a','POST /auth',1,NULL,NULL,'','',NULL,'admin','','internal admin','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(69,'2024-07-26 13:36:58.244175','2024-07-26 13:36:58.144945','1970-01-01 00:00:00.099163','rsa_sha256_pss:618eca540be9b38bcb7938fb3dc5930191b08c8c2aa27f744bfd5ae8d6f621dee7a362dc077982f412c48993e7b7b393086723c7be17fb15736e2cbca69c97e536afa21a27f938035288dfe4df58a975b5de86486ff71630900cbeb65848a17ca0c9beea91c31ce044fe457cf80305dd473b299153b40fd59ae6437f762f324e04fed9bc26115804c0f6d4a9c353e0c014299b6153683f975f11a99fb8737c4d3cc883f423fa9f0d627f828d32b6259010a7b7e3072f1237d90c6674accccf48daf00908bc6253864fa5a0974471e6ca8125638cedf9ed65b6305ae4be14ad66f24aee92912f4fa38a9af0587afd818910e61c14044f67d5b569efa151d66a8c','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(70,'2024-07-26 13:36:58.320556','2024-07-26 13:36:58.222149','1970-01-01 00:00:00.098351','rsa_sha256_pss:36347891d2414aa3aad62b0b0eb43a1123bee1c0d326a19c11e69fced1c71d468ea6f7527c3f9185a6ef96aaf7e2eb661457714e356ebfb08898d7c53482f4ee6d7ffb5ed7e4b798691444339482501cc1ff4dd71ef4fb06ce3fe395d97203174c089fc7db0ed76d1c490644e486210248185fcaf4eeaa106fd63bb101852673d3258221c455979d67912da48b974e5b0ebaaecf4a2d955ddc4e8057a20048960b27a3668160aa0f2910fcbe6f05a989ac5197b8f983955bcaf874a8a81c6449419f8062404d996e6549f7bb190cbfa921b7d41e4cf82eb033bbd43ea8de5d564abed751e74b83f0e7e204bf71b69a567ce1a7e47d111ab8e9b557e2b6d696b6','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(71,'2024-07-26 13:37:01.306125','2024-07-26 13:37:00.958873','1970-01-01 00:00:00.347196','rsa_sha256_pss:92a4e08816c99c10bf15054cb9f35914f27b161c52ffb9ec343bf258c5630917a1adc6ca82f1478c3515092de15b03bdee05c063803a22eb8d0a38299b955b4d99cac82b45285be03dc30f2165ad615d999caae9375f29381e7dd38e7c4dc2c87062623817668e248b21909c55dedd63973f3dca521a44d9fd0893f2d9c62fbac726c3bb2879858f6ac09fd97aade5f9d2f17cc441364bf22a4c58e4c6ea3eb32db9ecfa5ce96f2aae9af0044f00195027c55fe129a6010116d158a52dbdc4eeb856ecb419a8397675ee2f12e922d081dbc61b308dd7b5745288bda1fa2f222db35a9cce692045741f8eabca2846ac8b9ab19fde0a351293e768b37b119acec4','POST /resolver/<resolver>',1,NULL,NULL,NULL,NULL,'deflocal','admin','','deflocal','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(72,'2024-07-26 13:37:01.460629','2024-07-26 13:37:01.327904','1970-01-01 00:00:00.132674','rsa_sha256_pss:86518a4bdf838183a04ca4148e02b01711311d8988392dbcf68111c0ba97bb48e58e9d225cf999eb886e111f954909653ac6e958523a6b92c01f5e3687af06a17feeae2917c63817b55e0c50dd966e89f6854f1683ed3eaf36fc8219389b332e8f8478221d564cf9d0df4582e4e5b7cfbd87154238d558fb3bd5ec4372a0af84906eef3a946a0c9cd1a190d8b9d6db249a4f9acf417b2a473c8522719e741ca74b21edbdb69f979d82fdbc8018e945e7b1cc1f0b9d4a50db8dd3239aee0e9142ff6aed1731e22565d053a442a7f786e37afe60005cfa3ffe437746461c74acf5af111a84d8d97c5ca8c9c6bae628b8684e9d85be3e46e067b80a0f4a8d6fc4f2','POST /realm/<realm>',1,NULL,NULL,'','defrealm','','admin','','realm: \'defrealm\', resolvers: \'deflocal\'','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(73,'2024-07-26 13:37:07.949867','2024-07-26 13:37:07.845684','1970-01-01 00:00:00.104127','rsa_sha256_pss:1465c128b1b66d3d05a3f93b4e40e0f7b33ab06de8eb677f3530a344217351e81fa58914522773360ad544e785fbd6232bc42abb67a82edd1186d67ca6502bec968f1191eeaae7fab3fb5b407af205115bdc7ebca0f1cf0a92dfda97e7599f8ca3f0ed1f19d4232a0199932790e5ec5cff1b63bb78f16f203a66654555f7aa356aeca104ee34f8ae4333474561a2af08b6498be579ec51e431804722441a70f16454ad90bcd3fb8096c9b2879da313aa1261c454e4a65312eec1e52d71cbacd4c16b6f6e12f87d21da2496e6a21a6158178fcf54d9318fd21744964b1e74e610a6c9766cb1f42408d9d65c2fd6d886de12b2b916812923414a6598656582ac7c','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(74,'2024-07-26 13:37:37.977705','2024-07-26 13:37:37.844843','1970-01-01 00:00:00.132794','rsa_sha256_pss:44643293898d8dd97468ad9551a28ea335b96a30bf259305cda306c9b3000bdc6c33bcec31fb60d909e6ee13db59dfd2facbf551de84a4b0c53949059117933a76c190782b8c82ee7f401a9f16e39f3f7fb50f2c2647441bf46fe5d1aea2ee074c3b96f3ab804ea92eecfe4c6e3d2ef9021321085b9918dd60815270eac673dbbc9cd5198d3a5d9ef95707a72d29af174ffdd8f66db192aa55ba8a2cbce04f3b9f301c40f5c9d872942cb0532963502d6e8d0d68f72bc629c8d8e246b75101b82bfe5c4f85b95a38e2ac226d2a9d55efa9ddce33b667caa03335ab685be404e3a766f953bb9c92e4c0ebfb7177a36fea84fe1a29bb916015be36991e4e8b6ea3','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(75,'2024-07-26 13:37:43.361597','2024-07-26 13:37:43.250313','1970-01-01 00:00:00.111226','rsa_sha256_pss:272e0e6d90f16b8a82ed563a268677cc193b13d99b8fcff4c23bff4a1c0b50e7eb6c769d14ece77396061f506b701fdc2c2d9feef4d0b7bd8f075113aaa14b3c27f8cf44b557fc62df97d47a59f8f11df334af75ae92f8f4e897c3a448a1e0505fd0df95ad92e081ffc19dee582ac5b1c5aeb0414ddce6137c7a270b60d7e860018476224d981d704047adc38cb6696cba59ee71c76cd4c6af7c79c68e5e2c5a28535bf8653d020348b889d3566d71b795dc80ea77fff0deba4ebbc2d92290ca60e7cfacec7204355c0ea279c77c9029f2b704ed4950a001b66769a4ca46d936e6784a5983d7246e733356517aae85547ff3cd2600180a67ce41dbffd1870201','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(76,'2024-07-26 13:37:43.368634','2024-07-26 13:37:43.250606','1970-01-01 00:00:00.117951','rsa_sha256_pss:a4c1d185ffa96338e100f85a74559b565d412fa450d2bfbe285f5ad3783505d50878cda970bda6420a98c556cd81285fab41624a178b8148719f8be5a69da682e6ef4cfdbbafcb9a204258d8828cbc44e713ee429a4a2072bf7f4527a3fac11764c2258ae804d7d1edc67f205a4e85be18064f5d7c390b66c4ba525d61f1a37d7b3c04bd579ddca2f4b9a4ede4614a11bdcf605aa4978969c1187c24247a7cfd38dba2b025f6607589cbdef77f057aa383768af5c52164e9279e33c512dda3689dba73294ad1607d908b6fd27408d3b7a3b3ab619d1351f0ec2adc9c5367bca90d1582f75e44b0688461bba5663b738accb5441da05b0a2f9f91ea8b91360e7a','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(77,'2024-07-26 13:37:43.376549','2024-07-26 13:37:43.251711','1970-01-01 00:00:00.124778','rsa_sha256_pss:a6c440cb4dc2d515c264c63f2aeb2173a128591f8391cc158a1f78a56bd04ca5bbf301bc92e5720ae6a950aebb7419920c1cdf2465b4e1f20b78501f16d5adc9084259e4f25dc85da750a68faeed24aa72a85134dda31792a8880f27db49d5c6d29bca8f309a4dade91ac033db91aa5478edc438eb49ac0a621a14142a62f860c08d893008de99489c23b505696942bb5135edcc65a0785da0939cae85bd643b028ce8f3c5623a9d83b5574f10f7c6e78e8ad0fc718d2628cf8cb6c04b2b4c90b17831b4c096af977a9a47f06b6fa193709f6e8aa3eda4a43aeb3a44c3ab549583f0d67ce6fe7cc45f419f7dbd3317006d86604c1c2ea965cf96b3f342e7b815','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(78,'2024-07-26 13:37:43.384110','2024-07-26 13:37:43.252683','1970-01-01 00:00:00.131367','rsa_sha256_pss:8a5d4a50a8227319b6f2a8c89ba204fde205ea32f2e5978d88793876c6371b81054261544d49d13641e086ffa8dfdc858be3e6414013b67bf01235d619d5269ffab0ac4c81e500b07c00b5781a786b2eab6125e946f25fe861e76da10273e82425484a5844e3108e1a0665a8967f8c9a18667f506207ca09955cf98c19e506f367378dea8a145cc77deb9e887935bf3b9e0db9852044f22522093e522146ded654b49bf2a3fa0000b66a0f6d810f56ae8055944f7072113c081bb784cf9955f57258690b74645eba2ca68301b5443b1974c81cdca3132d9e6d99dae798be33f6a4578e0975357970581ab4409f4fe513cd14d24046d9ed29ba312bff33e3ab2a','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(79,'2024-07-26 13:37:43.391002','2024-07-26 13:37:43.251676','1970-01-01 00:00:00.139268','rsa_sha256_pss:74b9eaf1516647a53a24a2cb88dacf2a2fec4f23ca81d1d9b9ab27ec6cf03c0f83b85995852ede3fd19450daec465da5804b0e328bbca9a1c5d6c8d3136b21d394ad1194795ad57400a4133f19b1f27643a286b7f7ec7e22eb39c9215e6f5aa85f557136f70e6536068554142e252f36b62853c0b77af6669bbfb3d1446dc5b174557203779b1a2bd026fb556114115f789806fa7d6878e45c900a498e694e20ac5804e2dd156c2e3272eff54fac10518e22bc0c385ac08c2277cf676380bb572820ff84c680b7133ec0e8910c581a707c341bde540ee55af38342ddcb22d1389cd0317458ec5985382056cd3c3640f5ff7aff609e95f76f14b64813c3185c3c','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(80,'2024-07-26 13:37:44.508632','2024-07-26 13:37:44.419562','1970-01-01 00:00:00.089014','rsa_sha256_pss:982992249628240e1f59cd908ea4f5bcd18fe1f1161afad85577987d4c5895f25d9250e9f4bb51895a479dd1388c9598b59dbe0281ac9e74beae165c00aca0d6b23935284ef9fa12e83048ef8a97ea7e8834b9b7d893e94b34d8169b35cdb80dbbcd012258dd66d9e320631361ba8e1e90922a1feec6108a7b62339ba7082528759c4a911b71b60c310d6f0d0cf3e3e39c22350b1ce0c0d430783ca5d44417559b32d585b58061beabb34217b4d745fd2c1864bc5c52695f885e06a625633b565db3703c9dce88ac71a2892fe1df9a792bb4d55110aeb303b911267be8cfec768e3f268a4b0faab12b14b44ef7396cd802e77ad81241b01a34a06aad0844a473','GET /machineresolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(81,'2024-07-26 13:37:45.336971','2024-07-26 13:37:45.233967','1970-01-01 00:00:00.102948','rsa_sha256_pss:2d0210df7b0ce9247471f06c24cbf352322123c10ad48dd192245efff8360967a1981a9958ad92cd5a37e37b09f9ad8056d96b7bb93da30e1851f61a1928aa26e34cbb46992d4d18030b2fc24184274f8f9f57827a2e7c3e36837d28677ac92cb88cfe14ba2edc0ccc563726bde064ff33e8381f9d359682d1a7652756ae894d233a5367da6d185955fc09000633677c2063ef12b4632ec9d4bc54e59d6d7a215306e6bb8db1d67d04347d95b473007f80e8ae59d950db9785454dea23cbb3a041ccaf6b1c5005bffc78d12472421ee68798c3ac0facd7227fe10341e2549fb452141b8388cbeb7865df5ccfa2aa751ce460f6750434f12bd09f2fca6bb7bd12','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(82,'2024-07-26 13:37:45.348727','2024-07-26 13:37:45.221683','1970-01-01 00:00:00.126969','rsa_sha256_pss:3c5257f4aebc23ccfa89a655076c68c93b492a5ad70c906daf49be034742343bf9f9a006ed94ad9efecd4259d6c5900a7f47a78c2b3e9f5c7ec61686886d329fb897b312d85fef4d55a3e7f4935e5ad37947d734dd9def84a86a45783ef4f4fa89604f38c365474e4221fb1968cf4dad58c8d9036ded0efa07fb91e14a162446503d82aabeb85b03a242ed2f68846425fde5605ec06bd15d918e7e84442693a90b610d704aeb7bcaab40fe235fea701f83e28b9842e58e445d9ee430ba863e4afc31fdf7625f289ffc5b6809b0126c969fb2b08726587080a91705a69b21dc51b3f48a6c2de7ba835599a061e9a74791dc7d0497195eddb2d666576384311326','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(83,'2024-07-26 13:37:45.353435','2024-07-26 13:37:45.222329','1970-01-01 00:00:00.131024','rsa_sha256_pss:2c3124e224775468f637a38b9f535b309c70455da46200e0f090afaad7a7970485beb0e9ac9aa14827d663e875cf1da156d249d514a0db89f09a77adc363dd5cf88a152b37c533ab9e2c195109282ea0d559ec0359c04dd78a87d093b2a7d19f7f38f5bfc7d056e4124b0373c6471104576f89cd6aa90f54a3e9a3c5f541b10682a446d6067baa2f75d692f3d26f0abdda6773d8f4b84d131b783e2c437221b9b43ea453958787b91ffc24576e7cd33acc8d57e804f5501e221aa8b2306520b01dbe2a3ef31fb743d3e7db37ce8b65d66d5670c81df1640fdaf1f738c376735a8185b1a16eb11ca5f7e24324f08a6539ec530d9bc5a1f13e78157ecd9f4ada12','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(84,'2024-07-26 13:37:45.365820','2024-07-26 13:37:45.233959','1970-01-01 00:00:00.131798','rsa_sha256_pss:55a13ee188ae67f3cb83dd2d6cc9dc93bba3e521d4e893138e68d62ab3e415d8a8437f94183225efd49320fe30f5acf2a4478d47a29587d5f34940fa5f5f9ac7c5f545b86c0409ef0a05eac65f15bd787cc4425f299769339c361d1142e5d479087d658d5ce0efb3cf1f8d45225c8692712bb66c74b056585846d5a145896d92e32a1d439af6098bdb389cfb852e363803480bed4f7a30439bfc95a8e7a3274c416fcbc0d2f8598902408cdf8a0340e69b3eb5d327db8b5af222b1b6eca1f8b2259d2127c3370cf0b2895d67f52f4daf7b6d5cf2ef6b3c69e0390fd98232f27caad02f05ec2f799f036a6c78139689e84bad0b8a09014bba37b34cd20f86754c','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(85,'2024-07-26 13:37:45.369954','2024-07-26 13:37:45.235763','1970-01-01 00:00:00.134120','rsa_sha256_pss:31f62f75a4fa360ca22c02e2a2b22edd6509837235ac3a2a6846d4ec6b62987ac615c50dac9c140b78b2c8c9f95ef5680ed09efb5269f5f17e181d07edcf88795126a95c7d7f93df2b0fee6879294b2f8d007b820f561ed1b82f6d52b8c4594071611814c9b427283ef9147e3a20d640408060aa6ad6b21350c1f17130057bc52df5c6e40cb30ca6bc4ede5a8931064e512b49f08ea5101f167ff7f08cc8c18c31961b94eb693d31b77b1346f06c7aa13969689ae3816aed73947de4bfb021748c1a862cb02ef672651889c2763c102e0dd10790e9eedbb1b096d77d548b97d3483dc7113adeb2d13b47b7e2ad3f24143d083f7ed6ed4b8ba70e52c9e0b5fe1a','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(86,'2024-07-26 13:37:53.192892','2024-07-26 13:37:53.078545','1970-01-01 00:00:00.114290','rsa_sha256_pss:6e19c975c8d6723e6b8c40bb744901b89057152bf27ccc915f48a55f67f89c445c657c77c2c82c25c6e3036739adbae1dc496e1c0adb9ff5ddd1fc499491178bc9446192079733ae649f740c2b025195821695639e71bb11fca33285c652fefbde723b1905a0615bc4c5dbe3f0dee9c3e42235fe52f6818c2fc58267453b216213f3c1c5452c20e5bff9cac402baa2ebe95a784ba49956faf5e11adfd8aabeb1e61166c83ce19363f59854b20639321f40e02c0a77b9237b0cbf72bb924449479bf74517c3e46b1100ceb4fc68a63ed8de1455734c2ab2313bc5014392c0105f7a406b52dca364e5da0deeb35d2904da0356f22f500e4bb07ce1c3ab7bd9324a','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(87,'2024-07-26 13:37:53.196498','2024-07-26 13:37:53.078121','1970-01-01 00:00:00.118285','rsa_sha256_pss:7148d87afe65630313c4a7ecd7ee3dd17b7e3a27b4fcd62b38a9c62d9dd375d67bc7d7f708467e0625e9ee696b10e84510b65de8df9d48369df61b8211ffd31a409e14ef945465b3c17b604c9e7fc96f4fac89a556aa7d681389d66711b86502bd2414023142bc9a8bc88db87a5d145c228680f7221ed3dd8154f8e313901ffc0112d91b5c1b06d8198b858a95ffe60c4fbe9d9cf3068fe876fdd5f0a8845014c28dd0bfe4f0c582997116ad0b1c1573668bd30f42f3a9166dc2ec652de6a19298ab8a9ffc083fd33517bb8cc43869da49c8c1b6796931ff29d9171728db99757ba1c02d567b4ab2518484825e1b956ea46f3013928877b0ed5ad2d810318e34','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(88,'2024-07-26 13:37:53.204178','2024-07-26 13:37:53.080418','1970-01-01 00:00:00.123701','rsa_sha256_pss:269b2c42ab346e339910686350b07552d7a07830552beb793285a1c2844465f43ac6a0f7156396889a2178cccbe258d9d905b35a6aeb0db769d5df813081c26592c604b304a8ae859d213a8bf45bf75c9baa397c318f1851134b8e08c969d194fc9ae1b76dedb36746b6ba6300dabf84b8a5384426fdcaf74e4dddc18bb629fcff272ab0662a00cb71063032b60e1bf021c47eccf1ab554d886ff0d20207960eaf5d78cbeba300eb47cf1fbbb4403f1a8b13e22a0179c2e8933d0b3f99bc053dd7ae113abf7e0ac2cf96b8777c39b8a5408d33041166ee7949c4a0be43c92cd94f269adad3d6c90819ed96e7c33ace53a93aae3fa7f85feb2b693ab8c91b70d8','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(89,'2024-07-26 13:37:53.205395','2024-07-26 13:37:53.081553','1970-01-01 00:00:00.123769','rsa_sha256_pss:69a53f2442a71ac138fb5ef537a3a669a42255affb83d2f0bb5ccc6de4b83c97af31da4e30485527e2cda5d911021efa43ac100a2e1df4e50a2089c565f9956a535f11079f74e3a2b3c79125d0f95941297bfc14343f1d900f52c12a37f834f95ff549f5b050c8eb375a9c932cc38d3603d0efcfaf84ed77ecf5d134d45da6d6d566884241761e2509d33a678d6bb6204d49232426548f771085162d271fe216e2afc7168a0cbc80dd5e97d121099a569b5448424bfa55cdc2d79aa3be5f8fa32750b6499f677a3ccd25a65bc1dc155ee7ddce6c030b9b5f679bf0420e8bbe2fdd906123d1617f8af928b2681c58ee2e9ab724ebbc02837829d624b6944cbefd','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(90,'2024-07-26 13:37:53.206663','2024-07-26 13:37:53.080217','1970-01-01 00:00:00.126370','rsa_sha256_pss:9af4a0a81e149350d368dc8880cb57a01695e9bcc6574f3ea1973ad11776c553bc4a969cbc19260a8192cfb3a77e562316d1065075567ba98f70078e96829f770d8009dbcc49ca694159df38751b371e0396e0513daeab66974398a6f0614aa65eca1cf4273b8b3a274647c5a1d4ad933fc217fcdbe8c6cf33c3d9e403ca9b6eaaf3909baaf92eeed4029d498b6835bf46c5e8d2be37d64fcc702de383d867af3ad088e9524376a3f9904bd28caa85dc7fc9c2b7d10856293323db83e0476d94bcb7987ea3349ee7bb471c7a3bde78a2feb316bed664a7db8e68aabacd10facdd2257045e5aa8c24d3f7db5f239fae1e3c60e551cf0519fb8bb01d6ab5b47cb0','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(91,'2024-07-26 13:38:07.725807','2024-07-26 13:38:07.599931','1970-01-01 00:00:00.125775','rsa_sha256_pss:92e1a2f07565c8c96dcc26ddaa72c48c991c3a332de91d1899b0b3f3b19e37015465e4f133de0a996387e494f38a1ef1ccdf35a60856f77e77b2e3c9f03a444485c8870f508bbf0b08e37427680b9517d75a80494ae5ea41efce031213a7db68750708c00cf3e05f5f3c3a3afae66f063f13bdf0dcdc3b401422c241739b37e11ec1736b298d14f2d9cc68f07457dce676d8709ee0a708b4fcda2f646fd62609ddd83f3c9db557c457afbd7d3951415a0e2ba6ba366742279ef6460badd662533cc2cbc28d8418583a2cbdca74aaab04c015bb99c0543045fd800002c298187f412a9a6bed6f703be1e71f39ed26827cd2e5f0dc522566212d41d6fba90f807d','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(92,'2024-07-26 13:38:07.728661','2024-07-26 13:38:07.597089','1970-01-01 00:00:00.131516','rsa_sha256_pss:66905618cf8f8da770d0f6a04718f11d579f93b32d6a9cd454c8ed5f32b4f9ef5a74292fc56d09d7d8d35624771d5a74ef6ff8162b3f895c2c5df24a3a35aeafd0cfd2afef338f651754a52970964706d77823779cbf9dac810638b8ad810a75ff95c755599d96fe8a7467692ad207df2f4b16f2e3de37d1fd3b9eb44cf5c3e49f25eb36b4c239072a01ed07b91b4c360b0d03e1d55c8993bd64588e2235a881cfdde4b084be2bfcc258aa63890cb81f16491bcb0698b9dbd1ba34ac047de8f2dc0fc512e69379a7a6346b1f498eb17a5da0fb10837455eba1f4549d5bea8f124d49faaa1769d559bdeaebd07e6d411ba3317ee35453362d1558f941bbbf9967','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(93,'2024-07-26 13:38:07.730093','2024-07-26 13:38:07.597010','1970-01-01 00:00:00.133027','rsa_sha256_pss:b0db5bc8f60b5d0198c12425a7d4f8406d0c3ab16bb781215fcf2f49e445f0e9a5802ad565344edea9a33fea9a97ef3a9f0219aea36127217c372f71b43378e95b9c5c734980e72edb1c83a466ede2120eb0520e472e0c10915478f3bd96508536bec8a83b77345f99a843f152b72a5b1b9ce5bd0f793758795a67da01eb379f65ae60118d98976698816d37c0ddb2c8e16148df15cabfbd52eb94d7ee7fcb9c9ab00f56a9abc0f70ad6c5e3ce21136a85879103f6f76060b619615721621653cd2532a8f7f8d690a798fe93bee7453640897eb497ea8065a0b964ccc745ccbd4cb9153acd2d45ccd61228e8fbb70c8714f47705a0be35c72fd47ea02a7eaeb6','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(94,'2024-07-26 13:38:07.735362','2024-07-26 13:38:07.598542','1970-01-01 00:00:00.136727','rsa_sha256_pss:3b299e0b23370056e446b95374c90fc07dbe50f63d3998d2ad54d70ebcb43fb02aa0a2ad6b6c72ffcfc2f690f6a043c7dc4e6f74851267affdbda0ed3ad191b547e308d182d224cde1f461e0760f3282add01b9dc0787d5829e56bd193fa2c1d46357d9fcf68d61ae784aabd0901880c355f8e875cb321888e55edc478bf5c340eede42780a1bdecae1afce18caa4482c7c5c92aa0f9df77252fabfe30b2d5e65f1f70c3e12ad1e8e0a3ee29485640eb55582da29ae4f7937d8947367bce95783da2f534627287a8f0d3300aa00efae90524bbe680931fe5410def0a9cfa4f3a4fdf7afde9e4a94d17a925ac7a11e35cdf4c2d3c4b5ad3b76885bf10f0ef3380','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(95,'2024-07-26 13:38:07.745067','2024-07-26 13:38:07.599721','1970-01-01 00:00:00.145230','rsa_sha256_pss:0c6b930e209da1c5deaa41bcf8c5e33350efec6420c964c81379367aabde107fa805d154c8471ecfd35e01b7081221f6387a1b9550a4ac6737e6db6f0ddf1d2e54264841036217f3b928d740f8a842835464779aefa1661cb2b3f93d4d2ae6fddf4ced9eb4e68ce4de7e3666bcce55cb49223a0591d911a92050843cc7a086b9bc57b0547db11fd61315c172d5e5f5858e85e98d7dba6ce89cb78786d0b0ac2abfe008f52b5a1913452ed59eb9e6f2e880ebfc2e9ecbac29253a3ff02e8665e0112b0594ae3105d5963eaed5b4db2998908a504099df8cae2605e314070233ac73b860ddbf8ed5655c5fd3e80ebff4c5ce1ae97d2db586929a9aab0d5ab44e11','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(96,'2024-07-26 13:38:07.932388','2024-07-26 13:38:07.831593','1970-01-01 00:00:00.100743','rsa_sha256_pss:a2aa828fdd3099bfc956c17c21376e49c1531e8cc6132c14c4aa3f8f80438fa539b9391c902a2ef3a5632c31019140bf7f3f02f45745bef50e0a972932830c1a77ef1d69f5f470bd76c47068d35201b0613de3ef259ce948ae386ce40f554f1b84703f43dc82a7256886af338291479a69f971dffff865fb6d5f9d46fa6ce7e62edae6a3541030223d9b386e7c52aa4b50ea1fac7b3c7bce7c46d811b5b34b07a4da1776f1cb995fd51176aad80b91968d24f01e29d6b122e956936367e3652bbff822fe2e04b27bb8dab6d79aa2f05dd28c160c8261723c61f0443f94b427421c958684cfd2a821ed84bf02b08712009fddff9b24e4eb2fd5b95bbeb756374c','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(97,'2024-07-26 13:38:08.045767','2024-07-26 13:38:07.954507','1970-01-01 00:00:00.091201','rsa_sha256_pss:acc1786f5ad97a07c6381878e229b157655396c91ace96faa76ca2ef96ea74a55929e5f3dc26406f2df6289d22d01836d476e9209b4e37ce9a8d2d2155f26bc0a15ced95c49630271c071e64714e0dc03f3e3342cd8596ab11224cdd6fbc992b8d01eff510333a078b8fb7d1fe986b1e4211dc3beec5dd7b7deb3b4276b528529897be53d1e2df43786c589d918e22d24590e0eb328707455bd75fe5ea80f8a84cdca6090715e596ed43c09673dabad9ecc0eb1fef89a97300a260f424d1db615f81b2ed9fee1cd05d927840505a86986c4b20a22f1b87b93aed8a55e888d50ca569b5517d1123ab1c018a13c34d5de97cfd27ad826d73bbe551f4f694b36b54','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(98,'2024-07-26 13:38:37.943857','2024-07-26 13:38:37.841899','1970-01-01 00:00:00.101901','rsa_sha256_pss:6c846390dcd1ed420efc38ff657dd44307f57f28bb6d783803f7ec87254cc7907669b67fe4c641829c80f6ee7a7114a7255d0953239dc0bc7c43c826c11f93fc5ee86a86f52604462254478210df6174201b2aa03dd6ff48cb20c2ef163beaae7fdd579328dec5e628842f788ed9354bb914a91fb33ce5f86b59eebab65ea0029c97c4dad7a4c1e35d13d88d8f49fcf5bd1eea4e3570ebc21413cac89e7d5243fe846e7993e8421ab150c061de539633818881144e0e40150dc84af9d2cdeff4a468090ab7542224188207fdee95f173d2b8253fdfe40690defb7a2caf46bad3a5af281c0f582d396b3bee4965478206bfbede2bb4680b853df2ae007af3f31b','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(99,'2024-07-26 13:38:38.054321','2024-07-26 13:38:37.964292','1970-01-01 00:00:00.089968','rsa_sha256_pss:a7a1b555df8f4e60a49cb2c7e61019c7b1366008c82d4b2842cb6a828289b51d93fcd017f49a9b8100bbf1a3df7081334d02302554e75167471de4d3ed5009cb809815f96194307d702eb6b63be03f3053016211ef7957c0a1751a799e735a0350d5a42659e109147c7f7c4400ec3f7f53246fd5f87b15c043a8ffec99625c906557affab2557704076091d5c3fcb4c9aae81e1704f03ec89e1db1564da21693e9247325ecedd1406b3c4d02e26bdfa63d0aff5849a0a534766eb77193f78a3a57b8b99f7c75ac45341fc76cbc5f679aa47f0f7f7d517ded4ca33c4ddc76caedd915578b59eb959574aafc1a4d8c1944d0f4de1cc25cd1ecfb57b72c57ce5c17','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(100,'2024-07-26 13:39:00.813565','2024-07-26 13:39:00.518608','1970-01-01 00:00:00.294903','rsa_sha256_pss:987a8c232c55a612c455dc87ad85b288de5688fc164bed8bec0fe30740206ad975bb4f0b538307188184339e51e253cdc1b386eb6eaa5d68bec165f5f0c195fe057f05fbb6d145abe414a646d00542327d5f3b5b32f45029e31bb56a1e404f0af95924128079538a5e9701ec79e8ef3bfc83a14be1b0a263549a8f37b2d7a2ea2b5c2fd6afb46bf3afbb909e629af672d063f91a425a69d125449a584377c910db70301838524ee9dad71f714e2398d0187780fb2ddfd3ff5834f39db611cbf87881bee01976d7f5c6981cd9acade220df715727675da579dfaaafd510e13b89a5b1f298ceb4926cbc526e4ee2be54d2217e4c0aaf147eb082af8a2cfae1cce3','POST /resolver/<resolver>',2,NULL,NULL,NULL,NULL,'mariadb_resolver','admin','','mariadb_resolver','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(101,'2024-07-26 13:39:00.938466','2024-07-26 13:39:00.838183','1970-01-01 00:00:00.100229','rsa_sha256_pss:6cb2a51aaaa1077911fb094c6b107458a07ce0a2a04eea691d0dc84f2066b8bf602db042eb8ebc7498f7ce5b0f9db02e03baeb85450d87cbeb52885a50ca4db13d79ed1d6562dcb8ca1923b4630be529fc98753dc7cadb9ef0855808b8e07993687bef71365014cce8750ed41ea30b17e2b23e0d232508c881fdbc33d623e0b4bbfc15747b7597282862399e4d733420bf52738fbb4a37ced639a69fd0fccb67d615ed5d633c4e7964a5dc1ebb261fd0c9da939accdf0c1a4633e9db0ee02192c630d47f81fc64b12e0f0bc7caa357cdd6c182bfc7b2946e1dd9760d65d008f89e94f2957a6316c5f8d4dfcb5a1f45595e73d2840aeb1fb3d62cadd59ce4fc95','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(102,'2024-07-26 13:39:03.359123','2024-07-26 13:39:03.252086','1970-01-01 00:00:00.106981','rsa_sha256_pss:08d943ac90119b36473faf91d3ac33594788658b76f494ed2b112c648dd4d7a05609e00ee84a0a1ce26b5a49e8e9e2c21c05a039cd88c7ff5f9f51e27c2cb9f0e2a2f33cb77fc7792dbd785dc7c82a26a56e96116b0258761f5bac913ba6fbb1e75080c64cf73728cc65fccb98685cee2631de9f463e48ab9d70a0350857e648d8d29c8204ace5fe4e6cfea1df6e4fa3cbef6b0d7c8617532cd6e689e94fbde421fec8171855c8d7bf84352ea22f8f92a9b40ec77694590d15e1552379bb965764a04392a22f0128c8ff83ca7eaf436525719eb654ec1c9fcbbda89c6e704be788c0ba8339220c6d3c89f4a6c0acd101696e1b7a20363969f2e16dfabcb26d08','GET /resolver/<resolver>',1,NULL,NULL,NULL,NULL,'mariadb_resolver','admin','','mariadb_resolver','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(103,'2024-07-26 13:39:04.166544','2024-07-26 13:39:04.054795','1970-01-01 00:00:00.111697','rsa_sha256_pss:7e513b134a0ad24f22adb44b90d86378a19717f9935b16ddcc2167f81c3c98466a5f9b171f3b102ea6a1df22e39e212b124b485ed3aa3fa6b10e8b6dde8d3c0085cdee2019cbf7bf3658a73c6d94f1bb7ab33a690929d83af304cb0b1c362d7ed85e83a2a9ae8588b8720052dfbae1e27a037af849cd25d01a5c9e4a53aa0793d329e02d5ce1244016781e98d7e769fabdcf5a393ccbed66fddeb0aa7c0cefb8e044ad52fd01f6920793935b3be96c192904b0fa6e5e94ba14e3d05e77e519d302b003b6627c97b18d288d84a01e06e51da2b6af8b83da12039aea486e81b6ea7b5579dbd1daddcc7be692e09136d8463218659adc6d2aff41c228fbf9595d3f','POST /resolver/test',0,NULL,NULL,NULL,NULL,'mariadb_resolver','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(104,'2024-07-26 13:39:06.065977','2024-07-26 13:39:05.938262','1970-01-01 00:00:00.127657','rsa_sha256_pss:862de36de22bdbe5765072f220890532934170d106c2cf10527b2cef49b48a77cd0bfe55ebbd55d14051bfdc93059acdf462c809f5b513735b3d34c5856f0f05653586594797c630634e7e74499bb3aa397fb29f43e84bfb4f300464711be222fdd008be393c898f935c31e7ff6c35352580e8487db24adec8452d5e3be0e8b2671d775f2fda59eb795e0a88dddb0aa2e5147c425b6ad0f9779dc56e04708389beaa94c5937de047282932d46ed9bf20220d604a7c55c61e8cb74fc38e756dddba49b8a1743f4ba45928ea7e670201f23cfd0aec584d0046982af44e8e5b89dd351a4d6069bb44ebe40cca522c2afcda5b7cc9d923f6140d117d6abdf8870690','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(105,'2024-07-26 13:39:06.067429','2024-07-26 13:39:05.938259','1970-01-01 00:00:00.129111','rsa_sha256_pss:3968938ad8fbedf4254b3c66a5dcedbbef131aeacc25951d7e32ac72993836e32de7d07bf78a08d8cc1998fc32bdbeb9a6bfeef7e27ef4e75fa94b51abbf9820de9c4b092b2490cceccf9725bf479a578db93bb09d25d7b7297c02747687f0ca57eed121a75559ff932100229219469da0d06b346a73c533cea0aa4036f66e44430f1610b985b20a65d39ac876093b92126e035988e30c49d778faf1b9390d8eb682364b5136c1e69f71cdc9f68c4291a975a88fd143daa9c67b84a0c7772eb3035d81d0ca034dafe03ad07d69b348a87c8cf2c7c529dbaf6f17c658b2a0e38fe9a6a7944e3200295681850472535c9007604afa5d57196efe777ffb77fa474f','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(106,'2024-07-26 13:39:06.069421','2024-07-26 13:39:05.940726','1970-01-01 00:00:00.128637','rsa_sha256_pss:a2ae6100b8d28e928c4ee8929b95560629b0b3469bc0920a89cc8bce6896b10edd13ea4f90bde57f27b9564929e7709ac3de9dd5f5adc85559cbad05b50a5a40a14e7b3aebf345bb64256a4fe5d158e79876a433f38d2fd63568404a54636ecdd04f0c861b2008eee04d49930602ee8698d8c26beb0bf322a220933b433df0d044269ad6f975226f0f01d03e9e92f9ea4743def1b294b2db435dcd88d2cf577009ff250d1fbb3527c3f6edfd504ea5fdfcacc881cb433496a60fd05038450544aa0ab901fb76995879f871a8a3b5b178514e60cae81b7eadcd23343ea687a6dab61b97602683953c512eba86bc543a7fde20c463418ad3f0984adef8025d3527','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(107,'2024-07-26 13:39:06.070346','2024-07-26 13:39:05.939217','1970-01-01 00:00:00.131062','rsa_sha256_pss:3693c35a703470b06f62964d41f06cf07dbfc9695ebc982d81d322d7a32db36e50c0a85bd7d15e380ecd78d1650bf84e0968d4fc929d177f9fae6aa7f74d2df423fd4c5a2d7d9648400b2b9e3e186d0a629e4213c899fefe5c23c21fdc443ef860f6eb7cc18074f1b6f72eefde76d8bc276ae46fc8c2a9014238802d0b49d295b3a26d7c8c9569150972ef10d4429334880b643f961bfec1bb2069b5a3354df5a927e0af73cdb99559cb2ff40ea2f0e060710dd65b1f3765bfdae0bb294098eb52d69f8fed0a8ee918957b95ff5ba80cb0109c18ad4cc3328a9773d258fa1f73536c4932d2a75d5a197861270c834bc77650f4f0f856fd75ea268f2af7448ed5','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(108,'2024-07-26 13:39:06.090547','2024-07-26 13:39:05.937280','1970-01-01 00:00:00.153207','rsa_sha256_pss:152b1dc3809acb20c7bf66c8ffc4c043dbe5239a7c0290c202cc475c63eef0869fb1e69137c918bef3b469224d442d492a6d63a0773ff8f0f1e7563554827d887e190048ccc60fb6de54b3c433cd95d82ff2dea8f34574ce930cf76f434fa24c0b93a84011d965fc6c58c58879263bb2b1dc077c632320d95f9633426c2c12453f3111588e06581b1931a4e07aa4ef1b9e9aec3649e81f9bb029841660c45be81ab0c6dadf6b74997a0fbcf36b7477d12bc70867792ec61462d3ad84f8440ab11c956d53793b945602bdb82cd4c48a327061a0cd9352166f7ce94ea1e079d1d4054ed19a1c8c35f206bb7cbccba7ff621794892b5ce1ae08c63a442aba41b200','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(109,'2024-07-26 13:39:07.911698','2024-07-26 13:39:07.833227','1970-01-01 00:00:00.078413','rsa_sha256_pss:5f172b262745ec39385a4b3787d2e74b45590d561d4e752b6106d2525e80f73293ec8e6ea33c2f80986ac9a4b3aed201e8be6f1cb436cc8ac86c9e0f6aea684a6df67954dc66c0348cd53a25d7cc33b8b738304d978f38a6883eb89b742ba71b752ac4d42b6450ce50acd6e4159f4709c84711fd5811ff5e699bf195a2f8075ef70f256492a5e7182586c708422df29a97274bf6bcf957657b8b997dfbaadf29e234be9488c0d8c5865318d7b1fa0b23871c8fc9fe1056d8e5caa9e23809b4da99ecb1013b0f4e2b26a75b7a90f2643f55cb9fea2c35a1c29264df7e72e743b3007c1e97f178cc4aa48c0547ac2baa947f5693b50690c7fd0ab4540b414f4f5d','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(110,'2024-07-26 13:39:08.009319','2024-07-26 13:39:07.929957','1970-01-01 00:00:00.079300','rsa_sha256_pss:97f857ce33e6ce08d68fe73de7dfa251f31244a7ce25e39fc442aa5783faf81007d0bc4e5910f97e66dc8c609d9fe47e12dcd4a81f53ff1fadee90318d682e795709384ada73d97e6f3c196e52e1a3be2c03a9f7c2a36e0dbb223cd382d257a10af7f81e9afc9a25c10fc8b86665ea8b24b803e059f5df4c56b96a20c65e34d73a1f86f3bc4189d142d94ac93e1db2f1d3a1d29d9da7cfa53e99bf5bb53a65b4e8de80ac8602fcd1434aacfc686e5f143bcf05953e765a7af6c67dc6a126431a6c13ca333a823a73c1e94fd1071708b1f4a33d2c3894a23106eb1822cad31750b0a9eba1ba14c05ebb5e15cfcce9cd00130e4298e0f121a1468a6349e9745d0b','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(111,'2024-07-26 13:39:17.707578','2024-07-26 13:39:17.583560','1970-01-01 00:00:00.123961','rsa_sha256_pss:afcb2a5c8d41766989f34a700bb6eeec16d025083b18364afd12d81e03941ce57384dc42488353ebf969321805b68e978e7114cb12b1636de2c01459b3ce7a0cd4cee1f3d031ee67095d920b18fb6729cb714ba8d3a6c1bb0d8c2d7c7612739206ff9aa2c5d59e71dda8be8ad3a405ce58cbe4b00ef256b68717c9ae687d9d1024c89b91639e357e55cb40937d843c3cc07411355669307f579606962d70fd3914fe7e07d6d1810e85de9038c3d796e1bca00a8ce863dd75786e42f92d5b76e186a4146e49a75c7c5ba00fd3d4324d0310d0f77ce9eb65b310a4aaef13b098dffeb5645bfb4f09db7c7411f41c5ebbabe6297d6229efd17b133746156dfbe0e7','POST /realm/<realm>',1,NULL,NULL,'','defrealm','','admin','','realm: \'defrealm\', resolvers: \'deflocal,mariadb_re','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(112,'2024-07-26 13:39:17.821776','2024-07-26 13:39:17.730601','1970-01-01 00:00:00.091123','rsa_sha256_pss:a024b5315e7830737767b6d4cb9caed41f47e4cedb387c18a50fef7c74158bd82e0f90a1fa2f98fdbd45e11a0e9aab9e37addf70a0e5f4dece5d8ad675b4cd1a33fcb8b5545ddfb7e57ea6ee5a450082bcc61e7c6ac94883e41470a133db35a032efcda2a7a0fc477bab002d88e7046639d4170c3db12a2b74134f7eb144e45d450fb16fe4aa78e830d275f08092b80465103fd833f92805821252609c8897e421eaf19e45a230b0b01ed2dd88b115193f3fe1a0cf59382df385431b6a4e8d1be46b2a8dcbe6c039bd3219824bfa380bf169af68af04160f633a9d13be444c4bd5a4dcb57e0c5d7c64280a5fca043f0d1fb0f63d8158940fecad9cd25905d373','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(113,'2024-07-26 13:39:20.081907','2024-07-26 13:39:19.981932','1970-01-01 00:00:00.099921','rsa_sha256_pss:06382dbbace3be1a65287273829f2d1ad3fa4d9b02fe51d3d30094a7b88282ec73cd32804f23b55c103cefa4657e350394448ddb3f87fb988c66dbc5971d33b3802f19bcf9e4e4b982f35ecf3b5b06d648f3995ed1e620cfa98516d7f32889f06e5a7e8e1247e9b30cb69c77094de6dabf419357789153a098a14c49fb4059fc08444697c880309ce73fc28067d29642ab5eff5428e2a0fb190a56621f44e018ebc56b41fb17164440c80852037a07444d5ea5055be5d233054bc794d31194f8532761fc5a1eb3012f17114cbe327a582258855de582e78d3d40e1bf0406150a1ec3556c5f8a97020629b8f627850f86248cbe1ba95f3b5d43989d4c6352a8e8','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(114,'2024-07-26 13:39:20.317577','2024-07-26 13:39:20.107334','1970-01-01 00:00:00.210180','rsa_sha256_pss:7df2d7ded57c23f424340cadba38baba133a9972cfcf8d3ed6d2f1a4225a05f5160e7bc41a2c10e3b2fc59ae2c8fc2a44b6b5b28c16d4048f578d85cb904ec12a8536a459eca181d0dfb3891ff621dc156150063f347249305f56a05c43d95c643ee18110f727cf5d2e1809915c56c0e40b60e731fc386b7346524634de8ee0c8a49cedecf025cd6634fb541f5e599beaca35d025559a2331bf3eec6e9e5316a5437791519ec7c996a7db332bd0db585fee53264b96323c027eb26e0691c2266f21e93e9092ae0f55ad8df32307839009b24db15d21be641900007b14d8083439d08ad3c2bca1e944e2db8328f988948a66d709f14d312429ea1f02cc2a3bf22','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(115,'2024-07-26 13:39:21.457692','2024-07-26 13:39:21.366510','1970-01-01 00:00:00.091104','rsa_sha256_pss:8d7d3e8f39409c746962fdde1357a1356c380187c38fff1fa3a9fb6b13adf46e1ff716af8cc9b2102e030ae0ad5cfe61f4461f683ac75fe4a422d6a333aee242a06450a752418ca521a42bc21e1a50362761e3926e2870d66c03b4032a1d4d6c6eb890c8931c552b9005ce021a19760d6f6f6a36a0daac09078c074169aa4d0f5dfb3096a406b23f0753e5b4740aa900a56f440096e785b852bb28fe60fd97b2995e5105987412cdaf062ca07f7bdd52f0d07d560f1288db1209429dc50d4cb692a63ea8db3b0a054958716fad9bc375778e830ee06b25771fa7faf293f123e8c202d86a315fcea492eed9dc638b6fa82dab952b35e82e6f1f3feaad9b74780e','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(116,'2024-07-26 13:39:24.568626','2024-07-26 13:39:24.475960','1970-01-01 00:00:00.092609','rsa_sha256_pss:7243b5ee1156964cb7e3ebecc1fc24cf67c98850b17a22b2f9b725631dc81d42dc51a148561e1287d1ff13da1b825e046c5440c08debe6857a21a0ddcd895b5eb6be0ec4562ad3092e0fbfee1e4b7fa3c65e753b597494774de293ecf7eff60c42cb1e8ab002e0ecd5d36574724306780ca31af19867206af5dd3d3921fdb9ee46395a42b693e20803189a70bd8b79e9e7580faae76ee93a22e1c74a6b0570430889354442f903c07903517c400be59e566c782fa428c789fe75669c76c686283829393bc0fca5aadffdff45150a4ad47fb09052dd49e1e398fd0e24d68b54475fb486f5e0afc2bde355e2c27e6d1e6e2c855c3ff2714db1047d6acc8d35b093','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(117,'2024-07-26 13:39:37.950797','2024-07-26 13:39:37.837645','1970-01-01 00:00:00.113094','rsa_sha256_pss:158919ad798e7e0c78751642156f22039c1cab46dc916cd63fe55873fba99b233279ab17952aef2e064d2b84d39e97e168f12fa5e4cfdce80b12bd633bb6390badacb7a6428407bdea90255ec0de2a93cfd015a464869c49dcdc8096d227dbccc8ae3fb1ced526569b679ee6891eda827cd62064c03ac066e84e495176d9cb2d4927afaef43e269a7f56ad91456664df25071a8b3e705e40d1deafd1d059aa95a834e52d9d4c4c35d168c8108f11b08410e1e92afdb07d7818f73ffd307020d423799c50769ea60704ebce5dffa9aba1aea0426cdf3df0c11cb94e470edf241ed369e65707d7c3e94d660be037063f888609420c6af7a7630fab18e73353c1e1','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(118,'2024-07-26 13:39:38.075090','2024-07-26 13:39:37.896236','1970-01-01 00:00:00.178561','rsa_sha256_pss:2670f21ce9fbe093943ff78eb3e82438e73ac506ba6480092ac281672aeb99b50583d07a09f479689256d7a301fee30b18afa0a44db332f2d9747b08c5da24f747a4ffa0e0774c7dcd9a5cde354e0a48a4385532a582c6d227b2835fc77f4812c478640e70f16b4534a1a9bf12d193d9fbc306e8944324c7000303b1a98d1e4b49c2399c83dd0010d1d5a61f17d311b4a1435d8492f7e51c83cafed8c32d443ac33d3e59f6a6176d2460550f22a1fedad8a25797c9e2afab59b16d7c851245ec61277a3bd2afb78eaf8b6b7c65256db8c447a9180469554ab753c1a09659dd89cbafccc072910d6ce316396a52d26fd213c35421b9fd29353522ce5b2b8fdc8e','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(119,'2024-07-26 13:39:38.259828','2024-07-26 13:39:38.098261','1970-01-01 00:00:00.161515','rsa_sha256_pss:8fa6fa674cca752b519d44a1080e3cdc158f6e78f9142287447533bc91ba068d273883950158c3730d2b1bb33757e9618b0f391587cfeafb16d97d701969d713679ef46ee315f5392722257dc2a86a2c413a4d4982bfe107c33a7a5599a6908ce313c87776b87a1b2764f844be3d71e393bcbe1a487deadc7e9929e403511292cdf9fab01bebd4f0b68535ce79e40b2f7944b99ca3bcb07c241d9d38cb4456bc0a55f8136853993268355cbd67ee325a6d82e44266bcc667e3e8fc8c804493ff983d6132247f57a99eea2067933e28c2f546c92eba6ff36129b8a5b3f1753b83fa1051fd6e45e988cd70363c9a8341c65b0e83c165fc4a6097c55c9ad0f00871','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(120,'2024-07-26 13:39:38.516321','2024-07-26 13:39:38.428752','1970-01-01 00:00:00.087482','rsa_sha256_pss:455f2ff931b637188b64c07758c8c20e9742c86ea6c2ebdab645e6c100d2ce81ca2238420612200d76689c9d5eedbb956dc8d05450e6830fa6100e7e6d64b5bc03bcaf58955852fa2686d0a3b528265a3ac2ab84c45e0244a01f3e7d68b0e1235a8fc2780e1c1e717127aec01f353a484ef7aac8fba4d1a13664eb39cfb71d21c598d799e0bd4a2ff696c483b97fd2f85a016933c7eea4a5f2095a92e66e777242e241feaa8d42a945f5d4c53ef5de3fa566b5394638c388b5734a3ca953351d60941889798f794741a61eec2eb32539f601a784bbce77601e6e80b55e161d1b3b4c38cc2aa6ad7a6c5e8ac9c74ff14102109a053b98bcb1eaa2a8ff88fafc8e','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(121,'2024-07-26 13:39:38.524569','2024-07-26 13:39:38.431171','1970-01-01 00:00:00.093347','rsa_sha256_pss:3b498118ebc125123cc66fe14274f3b9ec99b8be49cecf5c0d329510587921c7ca24fd6f8765a122690e0c256863b19a464deea47081cb8d3d3a0fb8da2f884ce7a672d946e234954e6558bb7ddc11a1f457be3506afe4b2027eb41d05c61e3443484e0e92ff0ab735f97cb60f9ca19362dd7dc6e2a208df00b435c99fe98bf70249bf2612713ce28ecec9f2ad032e1c4e203c39238f3bae0534983c6f4e5bedbd30d4f12aacc61773f4dc6839ae2a8f419cab8dc7764e623803973ccabdf1403e14d84db4e56662dab1b9e8834db4583c81999bdd7377adc4eea15329d97412a7836c0b14ec602537ad2352cc1d7287b3e86788e529eaaa43dbcf34c5600b93','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(122,'2024-07-26 13:39:38.630673','2024-07-26 13:39:38.537351','1970-01-01 00:00:00.093271','rsa_sha256_pss:3f7c71648bedfa5818c320a0db6cd2a920682811b3cdfb08e5a69494e0b3997b5b5e0e675314d31c80634c548411205bb0d8b37b4e303d502596b142a43e77dc3b95cd13636e113def89918bbe3dc373bd51015f74ab4cff09a607e27418f5c046a13d1148747a9bfe601edf6cb63b709deb393f883be0b977c4b5501888a3b1645aef2c1ab1bf26dc3fb22426b1a03de32258cd8de327b04b7e48f0a1c0e5c8dda04a8b00df4f6467afbeb2f74184649b497e90377ee37cd5c2ab19f5a70b8944f9930ad6c1b4113f849c265e47528ac0638048f423b4a8406552eec881488ed243c3fed0a3b3fe88d4c9252ffa6fbc10dc351d85d42bef9c9f85cf610450a1','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(123,'2024-07-26 13:39:38.631010','2024-07-26 13:39:38.547962','1970-01-01 00:00:00.083000','rsa_sha256_pss:480d22c217767958001625f9f130103c46671877d2ab6a610de97c5589f1b1de77cb78385d9068507fd5ded071acd12249f9266a9914e92f7df38b604d06927d8bae2995f294d85a96263b6989e9a48e2f243dcc85555f263a0af53e16dfa7d535d59fec56b201a70b2a69fca8445ed309c0a77b03bd5b6a605ee1a0d3e0adaa98f662fd5c13dfc9d575baf40b818466431293d439725794bd159abc7e4399902d8d0c11feca611fae4e2a220de19927c86f6449df6a9dd7ae4c5374e138314ac7cfe6fdcddffaa2678fbc618ee760b900cd90981719e8d7e2595a588a42243c549859fba05efd3b038bb5b163327169f8dc49df2504cada3252254369d48cba','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(124,'2024-07-26 13:39:39.562382','2024-07-26 13:39:39.449808','1970-01-01 00:00:00.112507','rsa_sha256_pss:6e76abde1323a26ced0cf5fd12b11a2b5368088b830c81cc0d485225304cc71cc4bd1fe776882c6a3ff7a6b0943fd7aa79097cd6f8ae5f981706e6b818ab30bd4d4873886594ba3be84da223ca03ce8dd8d5f7e06cc7e71a955f8c8d0c055f12c7d90d276b42c4cdea320e73aa2c801d0bffe0525c3ba4eb0149a1c14e9c67cb728afcececf11666b05db70942c803ccca45ce0be5e425770ad5bdf55af33ef4cbdabb6446c897e318ece393571165c96b98b834c8945850fe070a7f201942f281e9f8d0c07ca8b2561c1244dae6ad2558e786b4f336d9c4407c3691b2d2f12e651b74abd7cc7a26bece1ab2bb78bd6833c2c6c226a93001585eca96d75df1a1','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(125,'2024-07-26 13:39:39.565941','2024-07-26 13:39:39.450577','1970-01-01 00:00:00.115286','rsa_sha256_pss:9fbbfa8275934b0d43d5adcf0d7e6e1cf06db295dad9de5cdaa74518e04c8bdc547ae46e1d690067be25a1b6f144d37fedde2e1b64a3eeaeeb5f525acf3b308636c788557bee959df69c40f7fe7473909cbd59fdcb6f611e7063c4411698e2111c770f51c3df64e92cb24143c68a83cfaf0f95f3bdca07941e742c049553e0b6ae9520fac8de5a134a4016c67f654ea94fb5b60687d0d756150c631271e719c5050930538f19134c693c31ec5817d8d721173ecbc2a432f56cb008bfcb9e361444b7605734badf219c56367d916fc1e9d71cfbd5c3257d71296eaa02fc569bfc9d679e2e97df697f4a61cc0a7ef8869d720a09f03df2d66a21025b7b656df5e2','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(126,'2024-07-26 13:39:39.580795','2024-07-26 13:39:39.445611','1970-01-01 00:00:00.135101','rsa_sha256_pss:32ea8bd82f4d9681a8e6a70ef1d254ab8881a54c3b4497f987796592d91f0c38fe2257a077d3f3c00665458f9ed774a07dbe3714bfb0b9f12da7d3a5de4b93071c14581f9a2ee02942fbcf768f23fab99ed749ceedb5d55e29906f9cd7ecce43afdd381b3eb3b4d0809e6ea18ff64ef6597ba58fa90b4c853372141cef821d46e5fced6714005e28630f4c118ee701a13b29d6a465564ac4e69c4879ce89869a5879aaadcb369542bc4fcc27b8f6c448efa84f01900aff07635e1193e697f66dde745e58a7b2021dcf3c6daaf8240e71680a333e1e3b1e53f6be16a40c9e1f84ca6a419bf9893497d3d3c928f3c87a0de04451ab3bb54a63c5cd0d967329547f','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(127,'2024-07-26 13:39:39.584081','2024-07-26 13:39:39.444894','1970-01-01 00:00:00.139111','rsa_sha256_pss:1e2d4856d765753ece17abc38e1d887d02cfc50c7c8ac6f2300344ce640dd90a6da1831e8daf3ec1739562de8ef5c673b44065b028719ab1421ff759e53fd0eed637efd195c1c3f3535d00e409dfc886e31378176fd80108c44e4d602fab432284aaf89e0fe185fb7ae7e1fc006fe7ca4fb4874397bc10556c255c4c79603ea07de5dde0f9bb1d172acbf532474f4eb27c268f5fc1ece0263ea6f25006b6e40793afaf444a238619d11176632496962fd05019d02182de9f9a904405e7d7141e515c34b1adfb96c7eb3a55d94ce7bebd36a397d8ed54090d5a49f026a61b9290f3fc3291dacc011fb564dec232645137fb521a775f51803f92ec9a6197c4cf0a','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(128,'2024-07-26 13:39:39.586588','2024-07-26 13:39:39.446842','1970-01-01 00:00:00.139612','rsa_sha256_pss:729ecdf3c74acfc827e90591856c913fa01093b3d38891f4148dab3b89b536afc2afbfdd796d508449f4944edb51d392d73e772279b738c604ca76d8a0473be971b8b34690f8c24cb3339bb833dab4e47effb083d7d9ee7dae5765f7229ecf41d663ebf0e28130f3ed7501997770f2ccad033451d4c1be68e6836d89beb97a793088ad1081381155039d963155bd2dd7dccc1f47625210618ca955a1a37634bf37457bca2fdf27c5fc76c546f7c993b8022cc44e12b70c9fae9f6492e3440de36d047db6cbde4e69b14ef159d467280ca141aedd45d79e39917e63372a19b925e7e55c64b2deeb2e036589fde246a537599a9303628d560be6c72e15c55ea192','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(129,'2024-07-26 13:39:40.961686','2024-07-26 13:39:40.861067','1970-01-01 00:00:00.100540','rsa_sha256_pss:afcebd397b7eb366be874b89efe8d26ba84467eccac2fdd24639df92bf3b9028449889f6239bf12b3430a12cd7873d05aa820ae80a27475a2c87c8a6c71918ddda57f18fa68b529c0cc49770fad909f62d517cc4283a226982b1445d0297b89f2756cedaa7ac17e3b1d00b2f9e4733244837e2f02c19de39eb5f6b4be7873a5b21adf74de41d22e71b209fc4d704522f09090c3100903cb4bd37d7bf1038ce21a32fec1850ece768a7c07090774a932a9494eede22e18c8a0a8c30960916e332e4f02ddabf88baa80120abc56eac9dda7b491bfe95c19d8d5c45df7ab5cb4aab20c2fbefbd197a14eb9f88e49b40208ee8076a52156fae8f984fb6de8beb2f69','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(130,'2024-07-26 13:39:40.978891','2024-07-26 13:39:40.860832','1970-01-01 00:00:00.117974','rsa_sha256_pss:2b6726f5cc8f846417915045250364370bdaf8473ac3978b3c1b06a674e11aaccfb8b0da9792df6d2fdef0ae8a3106e4f8beaa5b2d7493e5fb2b63ac831c7126440ebfe7d10327397317b9ccec0918b90a00fe4fecd63cd32ab87f51e9488e98ce143fec83a340ab0b7108b7468cb9dc6ef729e7d5ee00cb1f384adb39a13fc3ee7142c9bf942f1c83d25a6bc82326cd0665771f3d5d5a138da302ddd4b28c826e261f0903b3dd001a46d3f239d4ac5734592b617d7d99e2693cd8c2c94f066cddc8215cc7b6ada0b2371bb02f5bdd11a80b71189630545f7b274b8544200f3a64c00985c77bdb741fd04d409d8bd8f7566a77cf2356941871ac0b01b1b23f0b','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(131,'2024-07-26 13:39:40.981918','2024-07-26 13:39:40.862563','1970-01-01 00:00:00.119301','rsa_sha256_pss:1609c60ec523b773750d26f8b3cd83836dbd84005867cbce3a7f8309ea0a3156641c9a2ac975da94536b42bfac3c64ae51d6f69302fdaed79b5755af1d41b332c9f50d537c23571acb2ce871080c058f17107979f781289d825a1d03d9b5dd10c4494d028eabd99e1454c013b300c00abb0fcf1377fb9cc45da9ba469f3b8e698f41142515177941857c46148f4accaf8c80c3fe131564fbe8aedb429c4c8095a025011b35769a12b17ced98478d243a8938d7b609f6b382ae90d57f60cedc4276aa8e2cd8551904e0c736a7e8a0514dd685bd16083af0873a3d7b08ff0a019e9d0de3b3ec3e6955a58bf02d6263ad92f2f3d40a07319e95afa0e7f838860fa0','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(132,'2024-07-26 13:39:40.992249','2024-07-26 13:39:40.879645','1970-01-01 00:00:00.112550','rsa_sha256_pss:024c3c0193b730fea9adb8f8c13688332590d7b4c001121303e29d7808c2459f6ff5c7a091838dc811a6f41b60b172c34cd7faa6f88e5e55a79574b3ccdc9e95ad7e9075977b00882b933989eaed747ea3091da883b83947a6cc2fcb03cfcd097476709745b5e7bb9b231cafcbec0461a56e12cc24830eb54284798841e8c588930ccfe8c50f421e3085ebc080c2025f8ab2ab19004c5f80f1faf2de4b816f99feafe00f60b4cbd8ae0f796a7329da055d54280ad647f99343c67c37797418b24d8aebe544c520e61355e3648da3d6908606fcbcc4fa3ae996cb0c0c43eb493e7c61b6daec8d2f9c3f72e2ebcc307d73ed14f46d49eaf00e2463726507ae5335','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(133,'2024-07-26 13:39:40.995699','2024-07-26 13:39:40.880783','1970-01-01 00:00:00.114815','rsa_sha256_pss:8da4eacbfd3799acf95e73e84e1b3c8d3ec4307ebf2492b17eec399d13e3c4f27636f68e55016d613c1b53d685049b0c4804fdaedbb109a998f4197e8c0ebc87e852d1102114fe2fbfe6f88b580f7eaa2fffbf3e63fc27c48990ac74f1af3c1f631ed5b32ff66ab33d83b7c9b60b5fedeed2ca8d1211b080cecce3f5ae22180536f3b0c79c2df6897e9ed2d390bdcb3938dd0c0d2c5fd572f7bee7af4252b17343261537e40f3d65e3037e29466e515c42f2ddba666e416622f8130e09ac078b81e93c5907811e57245d8f5a12d7067eedd91d4d0c7af7a9351ed32e00b11c0f3f471874e0fac262152b3336d1c0065978407afe2d8f507f535a64a502e44089','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(134,'2024-07-26 13:39:42.284017','2024-07-26 13:39:42.178288','1970-01-01 00:00:00.105670','rsa_sha256_pss:840da2226297a60c2ead2266e1071f478fbeea0b79dd1dbb09505918ba6902c397fe7bedeadfd5fe8ad7b943db85a8f3e3a7b421ed887a5be5587fed64a5d285fa00e404062241540855c443a00cc604b5619c63eb5e662c1bf932bf77d69eaba657d803fd8f76bd0f56d8f256a5a6cee028ef06d740e0bd925d2601591370e336d8c1361c94add565cfff5ce394985682e1844f57d11fb89fb8bb1c1a5d40c7075e9ee7f5e99828e13a3087ca5c0f9ef85a643d836d36f8692ca93ed57077aa3b023b2588a4427035e4144199662c5f95d61e7557cf0058eb8f896188469ce843dd23d6c12a9e556f41f8680787628dab8167c093f9685e57fcf9ca1b1b808e','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(135,'2024-07-26 13:39:42.286392','2024-07-26 13:39:42.173731','1970-01-01 00:00:00.112606','rsa_sha256_pss:8d69deb464106ca346d54ba6d3e8593a3f4fa855e4eda69d3d285ccf97ebb2fbf84f7e1da8f955a1209f29478f67a8118db0e784aaf92a45aa708942edbfaf1663a1902ee6fcaf45703728139b9e36e884260ab737f479e579cb95c5c5e5492d5df032c5ab78838ffae52efc1918ceb09b7aaac92bcd6a9b6fbb23871b8c5d50ebc801cbf56436691caa350beff920e137774c38cdc44450045f31055fb7e2f4a342045b75deef97110429a8df3ae362e3dd259889db961aea00cf5893f8f1626fefcd96d4ba27589f8abf2fda2f73d3535967217b70d55a1e9665c27c3945f1b1d9be224950d298c32c76ed80d2f26cde0830a8b3e93cb0cacdf23b0f55ddd2','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(136,'2024-07-26 13:39:42.288988','2024-07-26 13:39:42.177251','1970-01-01 00:00:00.111639','rsa_sha256_pss:665e62c1bb6859a7ff379fbaa3b70ff1ba041f81f5d932c78d038aa1453591f90215c96d124482d6091a66f7f9e948ccb47d4f1bf5bc38c90ba90f4223b14fe8ad01cfc5e75d9165977b147cd4c24c1e2cd03ba668945276befef61eaff9c07e79e31f4241090943fe5ef5dd2129293a0db8907fca77faea788580825d3bde23749597ef24720ad98839c1ca0fb29ac02d177aa65c192a4c76529d8230bb6307d30fa2e0559256c214b2493d085d89ea4b837a7c62645b3fd5d5dbe85468de24e1ff97fbef5b14034101495d55cb82094558e599f64338f709aa97c9d91d23c30b31a7681499632bc2fc04b9dbe2f48ed59565d16788c0218a86a51b9016e84c','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(137,'2024-07-26 13:39:42.292720','2024-07-26 13:39:42.173943','1970-01-01 00:00:00.118711','rsa_sha256_pss:2f575605a1dcf699fc8af02658e03ffdc95bea9203a4b63513b178e4f872152ab551221da374cef4c44cf26532303799326026e26a0a3021c3e97d2aeed2edfecdcd29bb96532188b0c97622843f2fbd391d0ded5101c67c1fa04c36c992ed528c3d7c6ccdaa2f6b9e61498a0a0db20b89a632876730a0d73f6ad2cb2adb51d3ef56320c38b4ad1b9d3e5ee9c701b821555040c25ad9ce0d7c803c31e538647eba71e8813dd8ee5bbfa73d94c3324036587291f17a1bcf6d3a814928ee72578396d9b41daf773135588788e44aa69b396cc686dbec4ec9ee0eba2e5dae405096f93c88788a7828417457338448cee39eb7716c89c891057ec08e71297cc15cc4','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(138,'2024-07-26 13:39:42.294545','2024-07-26 13:39:42.174801','1970-01-01 00:00:00.119683','rsa_sha256_pss:9da751df9b3a0524f321ef2fb301bd107f1a5ed8c0c56d22cadf621ccf10832d9b404e6f32c8ea9e7e3bcea256e70cf27a8b94d67e241c259ba3e3e7c3b0f14a9e5645afcda94332e655b2bfc96833c536e2c83b141fae422b1b05ea665e966c327c7fe9b18ca37b7cd873b420b5022ec4f5faa794fd0e9fe4311e9a7c5d88fa0ff4827f51846a81e6d9df2035b3370c120813026060b2d5f6fd3d6739a48b594e70169fdc49ef164b0217e8edbb5f048d28c2fb932c106a1dd27821c9e86f683b5b47c7f73fc7c0ea38263601be40525aa2177a3d979da0e530c09d31d4a7d2a7d121c90b2fb79e1c744a1a07594dbd9dfcbb0f84cdb6b4bea35ac07b51256e','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(139,'2024-07-26 13:39:45.820435','2024-07-26 13:39:45.711937','1970-01-01 00:00:00.108428','rsa_sha256_pss:9f9bc281e13de9f5e1b03c3d3a3fbb08470773ed93930f849f6756b32e10ad89d0156e2e5e6087d1cfe13c1547333ae70b26a9e282f4e6966c91ede0c6584ada63b9df76172f2d9b75ceac24d83ab42f7d67a275705c0d7102aae13bd774788cb674e34e31ace933664ed7b425ab31136d95f36904c2836c340b4df4906b58a1323d80e465bc93782f5ee7bc5837845b1b22ea7329f3eea0210313083f8944f63c912395f5ba96eaea348da32a92d3417c9efa4850fea4138294d9a4ad2a995a1be548b28767906d1c7f3572b428bfc4e292a8ccd1937fee848da3fcd735e55b96230a3addb16eb59935b5908486a110af1f1b89784464cf9fb17160dc0cf0cb','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(140,'2024-07-26 13:39:45.826912','2024-07-26 13:39:45.709494','1970-01-01 00:00:00.117356','rsa_sha256_pss:25589e45afa76f43da24bda440b0994d0bedffad7695b7ceb0b9c25c6eeee20866abfaeccbf2b9c5b7174fad01224f532fa765777c0adb600679055b09f77626a2ff4178029c0ff54c1153b90398f4cf746c328613d89842d6376bedae5966fd4dd01a4c069c93ba5e9395f0efbac9db7ae10f71274d862ffe8e9e653b1f299e8044a4ab49d617f471982cc65a2a10fcaf4e49651f961155a7b4f475bb862af8934de3208fb905a35fb95ed1dd63711a930a3365f29ca610d90a51f55c298a49f5aec805ade027ea1143fe38bc5b8f3f115f519bc8b657cf7ffc45f28d5a248eaac99d90f67f0079ff2f7b6c12888b9de1bc7eb51643b173e0836cfec4d55f18','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(141,'2024-07-26 13:39:45.827802','2024-07-26 13:39:45.708351','1970-01-01 00:00:00.119373','rsa_sha256_pss:a201168ac80369574ee86e4ed397498925556d54c7349e9a7369ca36fa7e0fc4e338a40c0f23b9df0b113adb0385c382cee6cc05b920c76bd8c0985db22b06c27384812a700cacec7fc727390f058d15c76655ff8685a28f5d7caab53eb8bc21adf065b71e9ddb517fde46223c65814ef37b72868a2f7906aff0b2f83159c38ee28c5ffa04fb175934770756294384e1db0620fc605aa9ac8c9229bd893b7f48e8d7b5969955e4ab8502bfaae265c966839fa082c7b2a6c3a05af0fe45de5f8fb23eb055323af9b96f2c9a2b00db3eb9e1f9a2b5f5c70d4ed009cae8b4522a4ee008161514bc4ba4baf4f5ba6a002893c7f1e2235c1ded23b420663e4b2002c1','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(142,'2024-07-26 13:39:45.826720','2024-07-26 13:39:45.711730','1970-01-01 00:00:00.114880','rsa_sha256_pss:8890ec6a303fa2e3c7273bb2084240ffe5f9a984e045e30ab8d0279d5052a303022e0eadd3fe47d0388a5d40506cfa1255c136588bd44e8f69dc4d03548f7126ffc73f53602608dc0207e592027add0411b15ad5c7a75368fe2ff3a49e390289d382eb7574bd10e498d53db87adac77531f7a5d94e281a08fa6fa1140c69a2a982821573d57fbbad185461dda6710a19e06c6c3e82a2e013050b7b83cf1daef7da25ee176dd59328e6a556018d1cc707a67fa3b11007856b68e5fa9454992041ff45caadc034774db89513de44b87cb0972a909b86d674e045b60f036c6f3dd6424a78439a71239541a04be39f674bee81b0032b84bb7b403d5991df8a24ebdf','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(143,'2024-07-26 13:39:45.838353','2024-07-26 13:39:45.709853','1970-01-01 00:00:00.128442','rsa_sha256_pss:3d17ef8579a0938c0e84ed0ca24c91a6f9f3b734f55de3ac333166b039e5ed0322f386d744b9e89227687094d5230948229ad6d3ac3fc3013c686f9674628d0ada8d4a69b30391b7ca7869f9701da81ac710ca152201bc05c3fb185d0158e45e663cef27bdb3be23506be313c68f77fee4c5564e74fab9af4ddf0c760ea54080a79bdc8b51162951e649690808353dad421fdac195456103947e965918a51adb21267231b378eeda4215f085495f72f8937511a5893f2f77fa1c4ebe23f1e6eac401a879047c873c80ec6961f77964bbbef319acee1cdbaedeaf8f2571983d15ec4c149b15daeacffa5eb56cca4d8b9c0a5a42c17bae7dac4395bffe2472c2e0','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(144,'2024-07-26 13:39:47.692417','2024-07-26 13:39:47.595997','1970-01-01 00:00:00.096363','rsa_sha256_pss:03746e14d5eadc0b3b1fea9552a58b40f5b0bbe36edb5de814cdb1f21c7322029418f6f707c845a19c70ab5ccdf9d1f4d487c3f8400a90d1d7954295df157018f6cbdc03f86d3e26527c5ec0cc1a89d7bbbba08b920342d6be01b6fa1a5b81dbb8598c56fe0780d611c8c0db89af5d79f1913948da0c34b51fab5fe72cba3eb13558711374480511f17c798b4bd7f56a2c0013cde8f2ae0b28dddbcb15098e838dda3d00d5dc52374d7d2224e44c984b67d3f2abeac1b02df3a603e9635c6a86e11d8990916ec272e75d4a1f58fe1f36357334ff133398227d431e35a1701864578c3490f1e3e460fce4af9be764b551ad19efba38b22e8dcf3f2924a0008155','GET /resolver/<resolver>',1,NULL,NULL,NULL,NULL,'mariadb_resolver','admin','','mariadb_resolver','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(145,'2024-07-26 13:39:55.238693','2024-07-26 13:39:55.040803','1970-01-01 00:00:00.197833','rsa_sha256_pss:49560e8f8cfa95c6eb0995427985f86d4f373c81d3a2cac2e889a9120d212d3396db008051f64a2fa0a672732d9b7a0e373cfd738494bee9b4f56337616d71bff376d682e0f64f0f374e2778307203191bc69f2c810428c3146f59ce364ec81fc014815b5326e690a072c0b0f0f9c9dbf9b3ce1a7c1e6c194cbdac5d40e847cdcc5274a8e30ecd3d4b51656c14c2babc8ab65e46c810a34c6484017c4c26c5cb40d1adebadc7e6d7d51e5a17af5b642875486fd6e539559db1d98f8e5dd8a58278fa605f965578ade84ab15c0b9f53ee6f02520641f2ac812b17f366aab2ac6a311fdffa0ddf214d63d6ba3607f0d5419a913252a3fcc24242ca041062ced3da','POST /resolver/test',0,NULL,NULL,NULL,NULL,'mariadb_resolver','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(146,'2024-07-26 13:39:56.203953','2024-07-26 13:39:55.910279','1970-01-01 00:00:00.293602','rsa_sha256_pss:4794f4d2e2cb946aa6fb70b2a465b3887d2bebb5f86084c0dbead407bec3c1ae41d7cf489c5f63e1e2d0b0e0b9a3da8ab61edc525037e667ff7857da1a4d32553d26758071b32e879a1a2aa745a01313cab47203031ac6c0423815fe6e57dab3256838ba92f25a2aba50f3a8bbaaf08321a44e592cfe65a97efc4805814abc5056640c04dfb18960de15c17e7420b95ebdc8e6e767b1e5e6a220bfd94dc7cb675319d39c72ee43a754e17af52ce384e4d4fa194eb994df9fa0dfc6a8a6175aaae626eee800bef3bf444b8f291db9d8c60f0156465242709ddaf577d33460bea4c0f1c18c936349cc3f848789d0bb1180ed03470b57f56da56742f8e9a7e73ed6','POST /resolver/<resolver>',2,NULL,NULL,NULL,NULL,'mariadb_resolver','admin','','mariadb_resolver','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(147,'2024-07-26 13:39:56.322814','2024-07-26 13:39:56.226626','1970-01-01 00:00:00.096139','rsa_sha256_pss:4e921fe4a69f782b4b70c47d2690cd7fa3be483547b36a31d1516a84725dd42b12f2b1d2eb3a3942df03c3e87acc0789115f27f92cf05cf23a85d673f388d2894793b9ced9db601701650335dbc4b013af75bdf5bd14139dcdbfec45b6e41de0642e2598a3e8b73378dea98d971cfe182cacc2ced234db73b876ee7c919ec16bb256da4b17b7c1439010381c29d828b2417bd929ff5244345c6d62c152aba7548b273746f8ae80be3f4f6b706e7ed47775ff079e18e5a279529ea47716319e4ee7b802b2fe21380f20f6951978e06455a3689b60a8c38706bf2bb936c763731a73eb453c7adaa5ddb74fb7ae4eedd79e9e7ee3ed1b5c04b6fee650282245cfb0','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(148,'2024-07-26 13:39:58.473488','2024-07-26 13:39:58.377609','1970-01-01 00:00:00.095826','rsa_sha256_pss:4f2dfd9343b8c60986fa1d88d16b0d920f99c900d7bf6785950461bc76eea610cb4618c1eb7fe5a4c8e7f3b82cbaa8aba5b0aa43b757a10218a4220d7f822385168a3b5fbf605dfe6c67a8db94d214de82926630ca4b60be9d2c4c1366dd5fc61c61171d751f37418342e6bf4c347825d62d6f4c96833647e29edb5135f64f5ccbdc2d7cd1142e651e55ebe5ed8c80aefd3196af008698d39b0a9b20fb149b56a59df6b8ba2504264426b923e767792de4c36f4b65fe2d4560b9dda7d221fb56e2fc5d57ae4fd8ee2a7da1bd8021bd1a91d3b8925ab0159c812b0ff345c06d6737d57993381b51ffaf7184b0d2f6ab6cf69ce4a9b3ff71c2be145bb424b4c8c4','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(149,'2024-07-26 13:39:58.685008','2024-07-26 13:39:58.499483','1970-01-01 00:00:00.185458','rsa_sha256_pss:ab31e6ab24927ad5b71daceeb0ab34ba569b2aad7b0a83e5fc77343d076b44cb3e172a03d2772fcdb7ec7d9d318e36fd4d4be4b1b45fa9b135affdb621094f122764afe077bc8fa9cfbea1ef255b5fa3cf68946dfc4a498bd5d91717099e40de305f9fadcb5596a4856b6e6c00398291b89f29841a850d7f4742049b704b074dec871c24eff2e117fc4d1145ee81762baebf8c16f1ff1a7b3d00f8e94505c83720772d345ac813f7250c6397ebc6e3b324af3e760fdba7549637431e4a0e15cb428218a8111f30fb74f0c69c06c2064dce0ceb646e3e0457a61e8a4f5ef304ccd2e92b2be0763cd0e03e80b4a83b54a88ffc13ec4a9f9b98f5184c4ee4880f4c','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(150,'2024-07-26 13:40:00.305083','2024-07-26 13:40:00.209792','1970-01-01 00:00:00.095234','rsa_sha256_pss:8cb46514cdafe6d5977fb7deb56e8b11d1e4950c6c6d5bf5b2e86b8fc798f4a5bba3b6fd30452518b23b001da5512ef8c984c05f1da52afa72dff1a9060109af572d2f577e94a96456ba7cbd53ee567967b9c36b9c090aa282fa321c0354cdfedd51d5f85050f25b77b3e0bd51eb7525def3c816f04cab0193952d4ffdedfcdf0dbfdef22e93eb51193a363dad4a27c6368fa9062bb1e86406f5c23b88195eb9c54fa32ae1b66c9a4c1f7b154a53f68cab8079bfb71da5ebcde5fd4fb6ba9f6f1cbbe7965e07ceb08dc4fc11f7e948eb8af38b158ff403823f84317962eca97a46aa8056940a52715a509277f0a8d5ce7b343acc6686f0b2d5cc51b6fd28da32','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(151,'2024-07-26 13:40:02.717073','2024-07-26 13:40:02.616360','1970-01-01 00:00:00.100542','rsa_sha256_pss:571265d90b88d2e50b390f88f485362b634e90dbbee3ed08b2eaff41bbadf970d9df22d6bf5190e3cfe5bc0dfb2a1c373e3662448f89a1a661f7e601f83c2a35d3d927fd21270833b11738a23aae0275044c192ccae7ce590145d83aa59a9382fc165e1ca488c4545b4c1838bd8fee1b4609ca66a40033791eb1114d8197eca93a16c5fbcf6d4363a3f91b68adc9f927683a0568ea36bfeefdd27aea622f1432f605303333624649e045432dbc63f1a4becbc92043aa8d4bee8c9f4b73875569a12573183e3864dc8deadaa39e8567672f5c00a8b3eb49541e33d867438057a93a96ba8f7ab74cfbf2ea93b14ef2b7a1b2f77c1217d7d28cfd8f668d2740b686','POST /user/',0,NULL,NULL,NULL,NULL,'mariadb_resolver','admin','','500 Internal Server Error: The server encountered ','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(152,'2024-07-26 13:40:05.920317','2024-07-26 13:40:05.793335','1970-01-01 00:00:00.126928','rsa_sha256_pss:8eeab863661c7cf5aa62e138212b5b79d5a072f85ad92a96c4856e44e71c7e9acc8f78ae167efd92cdca3e9c9a4322353bb6fa4a8d118bdfa2bad1194ec77e46806311bb4590748bff2ee252f203f0d685eadbe9f3a049eee381b8796621e27ba13112361dab8767b5dd85fafea9e9a75f26c6bc5f3c7be293dd992dfd18e3c6bca1c36313cad4683ad7b2b69c08f6e2ba2364ac0fa4da8d12fc4a1c1b0d72871429dd0865db095e91c77a60ce79b3564d67aabc2fd6f670349a9de1aa2fe0fabf1b69fcf2f27aa356927e311f5d34d96a277e6da4243eabceab14876178c40e12082210e83d5030f35e955432224566428299cc165867173b33b8b4aabb9441','GET /register',1,NULL,NULL,NULL,NULL,NULL,NULL,'','False','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(153,'2024-07-26 13:40:09.258638','2024-07-26 13:40:08.824073','1970-01-01 00:00:00.434507','rsa_sha256_pss:33f4499d83d802e45f7035c976e8fb158fc2e2f3a01665f7bdff06656a00300320eb46657a1f15b76ed0a97739c8620a301b3c004fdd01f789240f668d07e395584118d77fa54e72077289e8f1adf02d2aced02ae360921910fbc65f1de7d5acffb86b50253a646d651e745bdd4b4f34dc95971a0592409f0e3c64be71a432616a06338ca937af7a56a58a6b5e3ffbcf1e7a63dc0b2d710151dac50812cdabb7ae4cd7254c2fcc1a2217de279849200659ad49aa9ffa3f9501cc2aaa4c72ba5be945720344c7e0ad1907813f2615c2c2ad18b8393f7166ea2c18f4a271ce077ab375c4cbba87e02f886e7ba9eb5d60573b8a4c98d78630c175b0ee72886f02ae','POST /auth',1,NULL,NULL,'','',NULL,'admin','','internal admin','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(154,'2024-07-26 13:40:09.380210','2024-07-26 13:40:09.288725','1970-01-01 00:00:00.091431','rsa_sha256_pss:77f5a406dff5e23243f040a8c3396f75f9b661644dae6ebc374bbef53640bc4747e650feb1974b850a0791e8bcf76528423263bfc69e5c46b02186fd075e26b18d5f93e1323658411243462d0f95cb2ffc280df2e53f2cb13e859c2e37e14e1f21bb957c8e3eae3c3e600b1b9dd9b96a08eb1b5007777f66ba2f3c96d3d476c7dfb6ff0a08b20668b8bcb0cdc7fcc2b67f1ef2221793e7e9764757d196e25f43a317e2cffd0c86b6f557e1d92f5e920211ae982af2f0746e92bc31f35666bbcb12a3d8da535979b034121b1fa7501a7bf722f87b5a2f0449f8abf07bdff8e752fabc26b245302f0bf41c56acd252a6c23c01e084aa283a152c891e942c7e4111','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(155,'2024-07-26 13:40:09.480252','2024-07-26 13:40:09.394793','1970-01-01 00:00:00.085402','rsa_sha256_pss:ace47631b20b38128a66e79940c5bab4f8a815c0f9f96e2736daa90bfcc61813a6768e9428f732f10771f755b58545def1cd16f4868312ffcbff78501d412092bf4e8b80b7c479a215ad77473ef9e08c2463b9ccd6719da6321b7392317e78f3e503cbc866231444279c1132462bee0851e6d38335737b94217e66ed1a9191501524fe710d5d2c219368c76ca9f56fdf86de6b5c8b67ffbde355b0cc93cf44e5c63e18f9bade0c78b8abcd9ec528db4196f1eb5eec413a09d2d85488d4f072bf81ce6f2c47b5f2445cac144328d8030bfb9bfc5d31fb24cb693aa2b7b16ad36a58d41672d1c2fc0099ee824b8df1960254b420654b78e59f61df71e4a8202d84','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(156,'2024-07-26 13:40:11.117019','2024-07-26 13:40:11.021202','1970-01-01 00:00:00.095756','rsa_sha256_pss:b16faaafe1df6d3d72c29311ec0a13ac55653e207f9a9c103d27d3e45d6a46c4dc20583d518586bcffd291d49c8133f257d397b9046b44df51731ea5e8d555bf2de2581a1708f72b5e93ee5c2acd1e5b6643e014a4c03eeff09eb45fd7cea34a75980badce441e42ed9e2b00010534949c602a4cfa2e255880914dacf99cbf18a714f6b8b94dd53052dd65932617b3afb9d51ce8c5ecc69b6cf1a5621489739ab487380930e61e43a635e187e5a3e53c74f19a6c56430649fc9734a246b07f67e8ad24437d4e7203d4d1f82116060e90ec8d2a326012010997a9d2a82eafdcfadc7c0c67cf66bf147c90dba05cb50daf19a045589379299bf0121ed773b6061a','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(157,'2024-07-26 13:40:11.251510','2024-07-26 13:40:11.145611','1970-01-01 00:00:00.105845','rsa_sha256_pss:9f4516cd345a9fe4e440ccad3484bc453396a3b7211b6be5611e58a48a68880851fa68ac9a0ab72ca417e0f470fb4142bbf309fae3bdf2ac42b7203446d038532dff8b37c071cf9489501f09f9f5b0fd72594bc5a65e691a3aba49c4743d42e5faebf08388b723948269c1ad8d244969bb5366968484fbc13bf8a0de482e56ddf3a0344e70ddd3b324009fafc8f81b1c5b2a006587caaf2de535d35bb2b57b7e151e27e9f4d60cfefa5cc7f81d6a2a90300ae45d63f7e3ef1be2e5b3b8cfeb67ee12c5a9e372193de0a0c4152c1b6574c4eda88c6c90cc1113591f1c614131335661db5943c01c543b2562bd4d05742ef2c9c0c24d98d9d90bca2d4f5807005f','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(158,'2024-07-26 13:40:12.314157','2024-07-26 13:40:12.233693','1970-01-01 00:00:00.080379','rsa_sha256_pss:2499c775702550f213a98561dcb298e1a1ee70fe3aeb4aa3c2d35e884e4ae25fe69ddba970c3162216dc16b714b287ef79c59d84fa8eac74d156af29606bc5696f609309062a0849824eccd5fd73cf70c78f852bb369b5c84f8944d84271e6e74b02a26056d1b29a6e8d5da322b7ada4dc22443fc5b14868f6bb4b56fb75cda71c10a93ccafdc1b29d8507c7a40e485548fcaa7552ae516d20d12d76628f3156fe4de887fc5b46376432676128c7064598e463d0eb547e46b11f3127c6c5c1afb87fa50b01c45f566c707ed267065187029e878d7b2861768daf563ebd33d3c1722f224931c068f9e7d7b6406a7c2980ca0dc1d300a7fd7aadc44c14afb1d7d5','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(159,'2024-07-26 13:40:22.762056','2024-07-26 13:40:22.589344','1970-01-01 00:00:00.172637','rsa_sha256_pss:357f666cbf392a63e7e14241c3ef9bb413225df5ef2bebaae2bd240680a75aba5ef9dc0c94c9fdeb25b9ad9190233fe8fb1fdc128866a44ed16923982c6f011cfa48dd28d90be46a99c5268982e608fa1e19be5420c8b059ae28de8a99558bb736e53f3f14e07c20447a915893ed85475d7f7d22ea7f9d71e2a8089e4c0c8c86524e0d808cbb5c356eb04b35bd230275cc67ba80563bfbee369f75044835cca0a7db77a1d1b1f2dd6909f1316d5b0a969eaee348f30c6332b7de569fa45569fe4a55c79edc3be03c0551b318c95100455cb3bf257491c4edbe8bca66526d49e8fdd846f717f623356cbc5f29522c4ef2b9cdcdf907c6550035257ee316241059','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(160,'2024-07-26 13:40:22.939735','2024-07-26 13:40:22.782170','1970-01-01 00:00:00.157511','rsa_sha256_pss:a1f313a11121d1ab17d941abb680d6677c913a33a77b9feccb14213cc5e1f135b07fb78e4e1d7eef5dbe70924c2f02626417bf1dc062feac8876637d7676d5388283bd323d867aaf5f74d15f8f312e015fb27b15679b289221216d9215948ac21d4295be5c9320f27be723c85fc945d3dd82f518ecdb5ff630c6fa3e483a8f7ec8200d553bcd8b347092e8ca48d7b9967fb370827778818906ccdd63f1727d336df28d89b1fa992ca35f140968a8067ff375f507596bf3bdb49810a9e19bd3ce020915df62c6ca38ef15a90a2473437c3a2b996c1fc45bcbbd27da3bdc49b89ece79635176e41d0e337141443b5f76839ffa422940561c714d06df6e4a43d503','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(161,'2024-07-26 13:40:23.182926','2024-07-26 13:40:23.044767','1970-01-01 00:00:00.138101','rsa_sha256_pss:5be8e3795a7f9f2a1255faa5a89c61c761ea6cdd4e6c06e8ac8cfc1b3908e305e0df8c1fd8d9cee366b1d91306a3f816369db239ea9bed67afaf7aa9d735f29de99b167b3b33a8dfd2e9df03ed075c7c8c5412ad2fbf49ddeff80177d158f0575c015de7229f66253168da9e845d7bc45b8134aea2e141a078697acf4c35b0f8bc854facff33395b60c9c22ff61784197162403a234a0434539c3601165eac3c7fddadb5ef7edf2045fe2336a1af2c77f2b56528928f006b3cc05b70ac59823dbe4863973e59c078c935e302203882a8cb2122a43e1aea18dcda4e22954c286a4e5d35cd3f4fc91c27ff2ad6a8e63d03997b26152ab698c164ca7f38ad0200a2','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(162,'2024-07-26 13:40:23.188179','2024-07-26 13:40:23.044672','1970-01-01 00:00:00.143435','rsa_sha256_pss:8b67142a4529feeb543aa5e38720da5b96a376e89d7163eae1dade4cb7f5b2cd6154c5c2616e47e078f2fb4e1cea337b0f6899e3d384b4b0fcfe0548001fa42463bdaa7aa9b349fc89ea73041bfbf99e7fdbbe3db8eb9438a612fddc8f399523c7c169d72e027a6179ddbfab89df26280b1a0bac56bbbc1820b84ad157605808223dd6aa73a0d1d6510a8e3fea239ce49b837b7eed79f32c36f231846a7f99abb75037264a23dc2cd3d093eaf8c2c1d3a3750d0dfe3b4c0f3ca9953f265e9d7768cf4804623d8a5277fbaa0884c644e910ab307257394b1c93dde89ea51abd17bfbe03097ec64b1852e5d09a150a883e9985ddda2fccc7a145e3b5ddb8fcca51','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(163,'2024-07-26 13:40:23.193079','2024-07-26 13:40:23.048459','1970-01-01 00:00:00.144532','rsa_sha256_pss:81d3222305d5f3db57ef7acf10279d5b9f8385e13a758681c9532eb5c8805b14a00679f96083b4c72dcc3b3ea2a227c432e1a60336cdf2613c3e335e95add18a6f72f36d341bacb953490814052212ec9074ccaf4695f2cf15885a32870a91861467f6d77555387fbedaf034fc330e9714ae6e668a5390a4c4045a213759eec33c898552f5aaa2a7aefaf28054cb5dc914da4fb123781eedf8ef9a719d56a915d6a7a3cac27bd2e2d577e3c017c051946a4d9a5ce0b0feea9d7b2f795cba0d1fb1d444ab2c1273ff8634857eb0a7539d7159156881d0255abffe0e6ed7a17225cd1094254b67a305dfb382b43893c148e2dc42725898ad435443e83187b893c7','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(164,'2024-07-26 13:40:23.203525','2024-07-26 13:40:23.046079','1970-01-01 00:00:00.157383','rsa_sha256_pss:21df6989a5c7b84475156772fb318d6308a155e260a751ec450d2726adfd753448d3523a0301b89bd8b9dcd315df7652b657b7a05cc1dfd4bd2f7c058702acf74516873f8d7f644485c830c418ae03d5a177346f26ca200692545a0d54fe63487f936061c34c628dc6c8ccc7d550e431030cb10ad2c9b6a3cd2fdc856827690dd72628c9a08d45276ed0d1713b0cb2833d65aa2c42b6370675b5ef2f7afbefea32bfcc5e5b5d65cdbc6860e7cd68cb0fa5820913b51d47a8692bd96a0cb580f238ec6487dcccd12c8ee0008a86a4243aac08ec4c4980000afb4c56c508e2896a194beb1a7de7d1afa035388759a96b9b92edec036efc6355a677801cd20737f6','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(165,'2024-07-26 13:40:23.204741','2024-07-26 13:40:23.047205','1970-01-01 00:00:00.157437','rsa_sha256_pss:405b828b2763d5191f1d7ff87c9a258114a33935b6e6bc3ca200b7f20851b65a112496ea15ccf3db09dcc03deb0466749ea558ebc063600324fe0d2c4f1b1d67b3b52ae7a291fb886dbd39b61a975d82f641d8acb6c3e9fda02931522a0164337a8a52d57a625910ab4014eb2f86befad29fe862277adec9e18df37e34f34b53ddec86a7d3796cbeb7f16ebae294801a79624e1ada473fc12b58380b98b25df3ff517a57cc53cd7442b490bb60013612fb75149be353893139192cc065762883ff323e966251cb75daebb2379131368eed02adc4c97362e06e2c79642da155fa21b53f6289d4f8d379a6b608b3c60e44ad3278ee0208da9811f37faed2bd7b41','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(166,'2024-07-26 13:40:24.470633','2024-07-26 13:40:24.377188','1970-01-01 00:00:00.093388','rsa_sha256_pss:77e2ab05435f1b5ee36e0d3d2a32aad35bc5d8e160ab2fbd0291ac8068ae9180f03589e09373d59857ca91d0cb0ffee17201e473dc61da51c38185042cb7c7cd34a03d64de642462a3ee50c9076330269ddd7b73cd1f91c46f3d7c0e8c385fad4f391b5eeb8e24ff840a7a6973042998b720dba65d0224c878179eb809bce8d936a6f4aea0b36a073df87889f8044969375244e0ea5360764f04f7c37d0568eb6a2a32b0c63dba9e1fea51591a72e379c09f36659b06e94d989976cb0fc2ff28710d0ffc23ec764b910181aa252894d7759253cb3458456973de3b2e038f03f20458901e64b1cc61631aadb1282362379612bbe70702e3d54d70969b6c8cbc06','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(167,'2024-07-26 13:40:24.475462','2024-07-26 13:40:24.382613','1970-01-01 00:00:00.092744','rsa_sha256_pss:6bea6800d653ee45f436a89da523df3a5d844f1ec949ef4dee1e6abd49ce3b87fc45340f28c26760371d391512aefb0080a96d7dbc98b076cd6d5f25c31ad5d424975e7d8a165f718e0b0271aa758f070d0985016c679d6351bbf2cba832113036675e8922252c14d7200f9f64eecb1e6121eb0b3604614cc0238ff6ed19df1314897a6b4caeea8e90d64f54ecd3fe9cf066ea8eb30502507f6a26c5a045fb428f358c74b3a9f01ae2b460d06191bb3654adb8458bb96f858c020cf63721d44630a7910b92f8b72e874c6f9abd3f1d9ad30952c56a9e05e48a7e731c717b5d76f2e8b2940c9318d30939466911692152566576e8471f44ec6b7b11011b5e0c22','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(168,'2024-07-26 13:40:24.585505','2024-07-26 13:40:24.495181','1970-01-01 00:00:00.090272','rsa_sha256_pss:57e00275239e6bed847b389bd19986f509aed515e61d2cda4912cbff7f3e57dba0b01be1855c1cf7b58896b73f229f3d2ad118492fd7a2a7c9b069f063dbd8b174a1d3c168a3238e91cbe72743bd77e493e397f774d67245f0dda0703e22677f5ef66428fc7f922446f172d4e4d9ba4a75c47df9544475e579ecd39c127dc423d1fbc95d05923109205f261d3c9a78e4aadd1564e7b4c622882f391e73ad965269fba4e967f98f6e74475d7e1c96f9ae184ed2c9e133f57f460e64d987516ae9638158a05c1288896096691b89d1db6d77e7698b7900b34fc4a3afda78f6c80705abc9ac75571af1d5829c4cb20ea0ff951cf2390162ac964a9c004e68c323cb','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(169,'2024-07-26 13:40:24.595347','2024-07-26 13:40:24.491093','1970-01-01 00:00:00.104154','rsa_sha256_pss:254e6d0cdc073c1c0b852e5025b1f4ceab6a6e89b2ee76e673e196a720b972273e9866c0ec41ec22387c4a62d82a98ce62eaaaaedfeecd85f97e31fc1bbf0f31c5d07f703a0a2d07beda0f5bb8d58f031714739ed6fa6176ac95a517fa55399f5f9372715ffc6445c44204cb9a43597e390910073fa3de1eabd342796277e9d3cfd0902f82ebffd576c4e4fb3acfaefec8bf9ec64f560a3c73cd6684c166c17f3c0e112e30fa01b918ced255b04a2a561eb600d7a2473c9ac568256a40dd5c34afb31b6444f19cd0abc67ff1ffcbc9e06c7ac47fa3f398a9fd233d58a98eeb512d6015959cb8b4e85323801815bbbc4dae8190d7f4a3e8abb546e2b3487b0c49','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(170,'2024-07-26 13:40:25.016354','2024-07-26 13:40:24.859533','1970-01-01 00:00:00.156768','rsa_sha256_pss:78d68e1e8a04230ccc0d5c036b15d3f17d88e4ba168fc08c7fd3be65461f63b7a448bee1331fc790678ae4fe35486d63310b916bf101704d07ac53e75792d05400a41f51bbd28db53e07e18ae49eebb0212cfe10b382a2e4830af61e2ffd483b962d42c152ce84e94bc189e60c6725c13d0cc3b8a7d85647be5d67aec1b053671bca518fbe2bd738491a645df9e3ea9b6f5b077bb047f7b194cdf2ddb3d39e9b312ecc7776bd92b4ca8b7d5eed0e20d95bf3fd14a1f37874a84552731a42a335c954c01b24817c5593758f342ab8912ef34a0fd801a01ae7ea17fcc10a86227b3f8a840dd98129a1a7ca543284536aa2cdeeee14c1be5ca7754cff006d73c420','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(171,'2024-07-26 13:40:25.189027','2024-07-26 13:40:25.038359','1970-01-01 00:00:00.150614','rsa_sha256_pss:5705eed54636b988fbff0bcae48d0baafb3bb9cef7046fc23e537206fea067226cb9c170c429164d23f9ca56d5e847fc08f63443ac66ee9e8c8c8e6021bb6c666f0262ac7d2d3c20011664efbcae2f41013748423b7167a869a2b2f834608583b37137431527a2c1542a6b7f825b46f275f7de737059e973ce12ca30ed4bbcdc32218f1b27a1b2774577a591e1c7cbff4857963b7ce4d5e5543cb72c10bff0f865240c7fc7ae35f1b2d241269d467d5277712d3357caddbe93b8d36243a1385b59d9cd3335c48872ec718bb15137d115e7444b47ab5dc36eaddd1f6270dbf9cccc57e830848c563f357289adb23d832aead3418f2153da9e5504918da3a55223','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(172,'2024-07-26 13:40:28.319285','2024-07-26 13:40:28.197094','1970-01-01 00:00:00.122134','rsa_sha256_pss:649a1a39adf65753f823272b175ee7315761ff557ca87905243ce29d79b2dbd687e918b4fdc1d36cb72775ab29fee5bf610bd49079caf04920774a01a01d35e4ead99476d4cc22b3c4ea01058be308e04d76ab0d658eeba95c43f6b0e2a44f40459c702ac0ac2e116c0292cd4e5dd2d6df2ef9c7b30ba3acad199b2c4a00884bd821990c59e9f12d8103042f6c283c1dcb57577fd4b8cdb4df26b74ddea376c2d118466de2cf8affbe3d4925b437499c8db4ffc81c7e9787326337317f39b7dd6afaf5bd6b3e9a4367b5648bca108f75abef1904d5ee675b2d2b58079fb3135e84a81289857c883b7b340d1e67e47090ad120269b140ee765385c084fe77f574','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(173,'2024-07-26 13:40:28.322091','2024-07-26 13:40:28.200100','1970-01-01 00:00:00.121918','rsa_sha256_pss:105aa9c18a0a3eefe59cd4dffe6373f1953b137f8b24963952975c215a3a794c429dc829ff645071a47e9351f61f007368b0c6369258bac233c27657aecf3fc8b33a55798846ee66c4badb8a68632d6558a29bbf510ef8a96f524c1bb3cbd7c52a872baeaf2d4942d5d5df6756d34667a8be5053723a9fa58bea0b8270e8da6a84788997203b54bfe03e2ecc0a423d90fd645c31f87a126a04e5f841dc4abb2656938a6de0c74360b358c647314b02c2a5ea1f1bbb660055bc9a24d7c2fe9aa4960d6c929b17b1dd3ac976762f19ede96bfccd51bde158575971cf8edaf5afb988c0eb5d8c0e9855e5cbd3d54700a319365c9faa2fa22136d7e83c9c07752b9f','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(174,'2024-07-26 13:40:28.327910','2024-07-26 13:40:28.198956','1970-01-01 00:00:00.128886','rsa_sha256_pss:803c8777e858ef050b27967f50601ac54e22683275e2685fb527fea3bf0f564e0b94ea14800fd48d5948816815d75d6997731fbc1a9c8bf7ead76342936aee72f8c28a66bf5995f96c33231a569e926fd6707cfedb77693053e243bab412adb758a9e2e82ad6e52cc95f03c96604d7c7af4d58098a63195e3e02ffd1b1ca6453a17dc1230f53277eca15e4c6945aa0057b82211e806256c625e636fe98b80435ef388963aa9eb1f5d947dc2a050b529682d57feed506de0ac6b20e8a5dd00dfb861ba526c7fc0e572605b6d86c14a81e48c5a320bc91aae96fc4cc023ab1f406e8dc0a4f2ff8bb60322bf8e6c3ee43cf3c7061bc84ad4960acb29369efdfe46c','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(175,'2024-07-26 13:40:28.341863','2024-07-26 13:40:28.209801','1970-01-01 00:00:00.131973','rsa_sha256_pss:abf0b7fc1cd71922e79d56bc0c4757148e9297a4ac43b32b8a0cb77d8b8a982d858a8fff5fb16def10ab9ffc99da914036774e29ec60b808d5aa9dea95df88d31b987d46957f231baa7b42973b29726357b1691dd73cf7fb6f3a8c30d293f6250dc9701f32ab5ceb4c9f4d259b8f12c1cd6b63a5fa7a75cfd0e72204380119097a508d06f8e6ff200db44993807585c884d0407bd02661178cb78fd0081b6bf91417bbe1e93fdb5afa26483900396515937ad6fa3bb10dca4e49249d230f111fc6fc6c2d30e9f09d141a976d7c32ef8b70a17f58af7ae24c01d8d2af3cd499df1805c4258faf40da9ba60a9ffeaf0b0f523539285fe389b2b421c71ff1b1d6fc','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(176,'2024-07-26 13:40:28.353983','2024-07-26 13:40:28.198956','1970-01-01 00:00:00.154919','rsa_sha256_pss:7fa89d799cb798a354f5f38c423273e2298fb996d5a576e5a057012539950de20817a8700003ab5348c52a1a8af8e058714c3cce86e00bfe9f39c55263654c6aae46847c499a11b11f666d3e828d2b66e385babac01cb493fa24723854103c1dc8b19772b834b294410c71d938c1eb0c176feeed2c2aa5a55980cb88486982388e3dd0aebbef234c6fc1c0ca6cbfa48b70ee5b650d4441265b0379ed4eaedf8217033e229d2762784e3838050f7bba7f93b5aa4ad9b13732d9adddf4fefd745f447d6d42854aff751471a6f3c0cf8efb7c797a20307140592443ea4f0a154f240100c7a0187dc77c4c2094fcd5ae92b4ce075569962d97cb4be1f5e2c3d06fbf','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(177,'2024-07-26 13:40:30.679790','2024-07-26 13:40:30.566816','1970-01-01 00:00:00.112916','rsa_sha256_pss:7ecb6104661a415544f2914ee985bbb592a74428c9d47e259559268a76424275249b48113496c6ce726dffe45907ad39645dd0ec832a2a2809d392d49edf0fae8a129c7e6c79de7a9b1009b6fc872c016a55d1928b6f7664ef5c3cf8240753a8013b646a9b78a4e8ac3ead7359c834a068be36dc9eeaf8e276eaf96494d8e005d9c562bc5e82670c9155b9e9b87e17b2118eb4aa2455da128127ffb56c96a158c7a32d149e5f2f4a1136086ade2e418868e5370ad7342090418c0f538a5b63287fbfca27db7eb24645c1519ca754261f5f11fe3ce14711278ce4fed4f83f36c343ae9803296eeb02e7e64038c30b596a6c9eb56ac8835d10bc02f9c4256eb9b6','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(178,'2024-07-26 13:40:30.686520','2024-07-26 13:40:30.567706','1970-01-01 00:00:00.118755','rsa_sha256_pss:617c7b8deb32ebb33ef6ca5fa2c42e9ab8e18e3d526ee3eead34441d3b8013367db58aa35db25527b0f9d0991c87463f3f4194c01cf1f9116115b3b38ca845e598ba4bcbb005b6a3678ad880c9240c06e9d59285be4f2f108d0d9f4e0029efe287770ac5eb67a89310ec0ae1b765592d207c0cafac94bcf97c2df82683021a84439d9f4be3c00bbbd8e93bcba81079a43570339aaa469195aa77a00484933870b7edb21bbfb120760f086a130ad290d38d4c9ed7b4fc3b58e7963d3e52b1d700e5e4d3b5e4c96ff0cffb7d40a17e282f423b88b6e5e8b99c440594bd1418a079c69b17eb52fe78e3eda1dfce64c4d8d9ca55eed24923f21a00b6f8468c57b8b1','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(179,'2024-07-26 13:40:30.690263','2024-07-26 13:40:30.583334','1970-01-01 00:00:00.106834','rsa_sha256_pss:10a195674cde829bcc0f742e1d7cfd9c6f64269f5d569c318575d30cce858c349c8cd9203815b85c14e4ab45865039c18f3d29fb3e25b0e0bd63935e00bb06d2db6e4f07dc0aca8fb8fb0ac0e4895802ec1e1c4ff105f5977931beccd42ba9f6bc375b1aafe89200ff8666052aec324a1795bdc8f933569a0fbe4274448a7031f2fe7b0dc6701f6ebb1ac088fc8a7b0e9da37b524e21d4c0b9ea45b5bc836aa019d4286345824340103c026725355b4ea53c519061caee36f2bc3e5e7eb31015b4dc2c081cbd9a18205ca6e1177ad3d8fd45d292b241bf649442123e71ee14199dc9628d46e60e694fad25015f85a1d3aaa74d6be6f3f27cc86216798cdfea40','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(180,'2024-07-26 13:40:30.696949','2024-07-26 13:40:30.566809','1970-01-01 00:00:00.130028','rsa_sha256_pss:452bbe542bae25689efef687027fc0d82be9ad0f947963d3a408682a9dd320fbe68051c6147f0e4e99ccfb989d8b6ad8e9385ca58788b4b3b608f5038149732d37e0f873c8320fc3c8afb5a15c85901884280924d9cb4fbd0ab32f715cdb300e7ecfc03608e584dffb1193004c41d31a22fc767846ee61553d149d2f4ee29f5305f8ab68351e1c2fe430b7ee772099de9fd130dca03c123357e7c8b800f912a60c3a41abf6b6079f90b3a490d7a8be902b0fc9de3dee2fd88a8c92b0a1b02e26523c1eff04f693df70a029ef013c1f441ac356c518cff8df9b24ef2327f8cacadbba2c3b0c1f854d1514a530a78a412dcade98a19200d8b249b2dbbf6f964c9c','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(181,'2024-07-26 13:40:30.702653','2024-07-26 13:40:30.583734','1970-01-01 00:00:00.118858','rsa_sha256_pss:4544b7ae06a184c445d016cc2487e1d7f148591b459ca6abe6cd232484add4fee7f8eb465e5fe20f8611f64f28bf14898623214d06bf4ba22ed9c56f496ba387b085f8cd1b7d4f3d6957f9941f9903fb6e23a47d0269e1155b64b255b024841a21c504b42cce8959bcc6c59fd9ee09db0c965835f5e100d052bdc49f0de5d78fa577ba7c12050180c8dc91a9f76b19ba0e843ea507b9234db8de115a4203746d478247847bac8dea8cd42d793572759251a6d2c71a3207e53b8d0c8cb419fe0c85e8142b00c72ce05f00fcbc6ffde7fd16ffe610201f31e51f0c59d5ec15867e5fb6fd8c37c69f7330930d83a99332f32cf2401ab081f35bfdae1e2ab57f701b','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(182,'2024-07-26 13:40:31.245754','2024-07-26 13:40:31.159597','1970-01-01 00:00:00.086093','rsa_sha256_pss:579d974a9aa819f6c6ea22a885732c016b30d7ffa92cb754db31d9ac729d2af834a9a3662c73b1faad16446e2742c10489f5dc8ebb39a6512953e3d2f48e6187dd7ffadc9ae4eb54705699c4e000561f8b72243be0244cf0e35745cddd7471012863ad8503c6b560076fb2171b82052b757650c882bc8cf8cdac3d14885fd1ec68c2892255669ef70ed3bc64381b8f94d01610468c022efb692c413bc74744dd8479412ec4bf5b955ab7618ef907ce9902bdc464dc91f269206a84190001dddcdab36091037fcb35dea1630ac5ee2edaf8c7a63f0f496406e60f830ad1ec456e740bb9149c62287b579da4e76a4237253df10bc36499959422ec3b42fd612cb3','GET /machineresolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(183,'2024-07-26 13:40:32.174931','2024-07-26 13:40:32.081319','1970-01-01 00:00:00.093557','rsa_sha256_pss:60bccdd98d79ff5b32d366f71b697bae384995e8b4cbff3959d74b367414fc8a6a45da204b02b567518631c2c8de2529f237187e1a136d62a767aa1f41401691c81cf0520973befc5c13e55064c734c137f8682925714238d9f425b3dd4b598198cc6b615522ec7e4bdeb4f19e6f0962b7bb3b862aafb035ecedf7de7d67baf6414ef2bab86ebff9a0f43e271f32ec01a66c620e84ab47e0c791890780e0d8185caa5d5e91ffbc39610c4b977d1cb1dc5e1a03e9813cf5fa1c134f1f941ceb3855289cec75105404aba6f29d4705794cad88a8b95eda0e109e5c2e03e07737ff1c6902d922058ad5bfa62a37331af72dda3f6437102149f502081014d233a97f','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(184,'2024-07-26 13:40:32.174656','2024-07-26 13:40:32.072790','1970-01-01 00:00:00.101808','rsa_sha256_pss:1b77fabe06325c157ee50202876520d4d6f5a986d411f73d2a5c508aa5a330e6050eaf5ded36210136e0e672622a5adf97f23f4b408c922d28518315c1fe77b355873f20adf14b837f4b75332d63112fe3e19e947e5d4700dac9bd544d7aaf512dcdb632d003c0b6503f8ae8f67d514f9585f1d18c5516fe0b49ac56d1350583fe69fe45bf359ff09bf471944e5fad3c415b859fce1e30a06a893de3cd5dcc5d3ce4c84492f3412bfb2935301c11799ff6ff782ff86e81b91c7d46a98e4e3a636e781fd9daba5fb4fb3892236f60f39fc73c1c96e0beffd89d350daa04d0408aec6389e59e239654a2a6a0d38fdf90b6461404ee1f5386160c78685eb62a65c4','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(185,'2024-07-26 13:40:32.175363','2024-07-26 13:40:32.079958','1970-01-01 00:00:00.095348','rsa_sha256_pss:9c6478821f2e8987becbeb6f2a4abe7bde790951436e7488aed3274e32de8f1742e2be09cc3381ca0b4a805d3d4c7e370cf3c2e7d47c6e6e9a38aeb6679877c46562228ba2345f71edbda7016387de769708197bac98a83aa4652e415b6cfd22cec2f88b1f74233cda8ebaa690b420e5cfa9cfba9e251e5cccd7b16817e68052c571308cc1abadb5e8e428a8d666a89c3e6aeaa4adcafa734953bd9279dbb7164761376d36eadb88b12ba325df6630411641542d65b6f32bdf4b8218f13a1da41b72c9e413bb08c8ab13a8764d906fc5f01371301d00b8e0eb3a215bdaa34db6057d85a159771aba554641b6738c4b38a8536c56c30fb7ff0b880501553f69ea','GET /smsgateway/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(186,'2024-07-26 13:40:32.298797','2024-07-26 13:40:32.199909','1970-01-01 00:00:00.098837','rsa_sha256_pss:96ada47835a0155a0ba4b628c938587658aeac4efd4e2c43721215018fe5a7b20547a63bd1efb5db95f73c13c0fd31820f091c006c8124ec8d9a557e155338ef06827d71a5af9d8a4a9a0fb7cdac2fd205f9e4be02c5477c2afc49e57593d2c84c318f01b838a10b4e74d0637aa358a362caec7eae69f83fb0f6949a2e6a7aecfecc2382a3f3acacb94d5b2cbf2d5a8cf5ab072abe9fb03ac7ab6e0fb885cd74ca941306c51e259d4e4069427ebf02cb991ed3ebeea1dddc704925c1b0e19ca00590ddf950b0326a50cb3c3165694257d7b988753043d528924fe96109aafa75d725acd5a5f7f996e201bad83db5c62296d0f16c774dd42e90d016a852a9231c','GET /smsgateway/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(187,'2024-07-26 13:40:32.299184','2024-07-26 13:40:32.197908','1970-01-01 00:00:00.101221','rsa_sha256_pss:add62e5dcbb02aa85dcc92b28524e70980e258f62bd0adbb7128fff4f7825f768cbe1ba7c1cb0b1991e05dd138822c799de507de568d56f89288c1d46d5f7a404715d17b7b0fe45d706331ab35d63127422f78262c768a6e344f09fbaa44917098938f3c4b3bef88ebc0919f474040fff4dbcffec3b80c180f6063b3f2c4dadfa58a648cfe5f904263ee90a32862bb3714ee7e56895fe6ec89f1fbea223065b6f977555711281774654f04247e714acd72e9e32a7d12e5f15249959bf0df1f8f9917133d3f2c6a25ba24bfd6f1abda81fad405ec16a96b2ebfefa3235d7e684368bcec54d553ce08338e2eb2f8b0de7f10433dc47a77553f426d5d90945fce15','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(188,'2024-07-26 13:40:32.306731','2024-07-26 13:40:32.195112','1970-01-01 00:00:00.111561','rsa_sha256_pss:b10ce5c23189ac886d24fa5f3517afeaad1b92cbb4a83ad895fc4e0ed05e3f42bc6a2a81f7b40d2d0e39d972de96d0e4a9b14e5e4e91a237b0c6da872c0f84cc08863ecce7ac18914816ada706fef421cfc20c0b22f68258421ae61c5995122d13fbef328bb40dfa3ad6ad5772e0e2b6164e75ae6cd641ac51754e88f3dc059770e84b441d8f2050df28555108aefbd697d7c8fc5069f1d098c41d088a03f96e48293d233700c7b5b75a5c5c464986946f7950c4047f51f9963dfd120a854f41834aa63bbd3530a3d4c2cb47940e17557235a385df9b045e1492cb6a8d0d27dd52edb890c5763559fb46821c54fa059f4d06c81f135ae50e0882ff1d5c3a169d','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(189,'2024-07-26 13:40:32.899525','2024-07-26 13:40:32.792141','1970-01-01 00:00:00.107324','rsa_sha256_pss:1f365795b2c17f6b9d3f8273bf002fb6557d4a97ef8e740e4850179713d7c67143206b9c7b72797ae1fb088e93650c87bdca9e910eb3abc1e5575a56ec2bce1430c02f18a4b427c9ed2559c254ee0b67c88f556123e896a60534b9e8c1eef105d818a9278ad4c4cbe6c1f89836da7faeff52b2840ea250202e35b550f07eb45ff0241eb06a7300eb6c36050f8602aeeb5ee7750800a6192cdbfd8ff20929ef54b94efdac61c6b79853fbb910fa52535330009be6d5cb4ef438f03f2af11ef0a298812c0896ea0b8a2ecb93182d04c15fae620e7eec5f7362184d7c3b41c7f809f4f60e7210481c4e4e2d32a91272f9fc1f724c3c190d1d229299c68a36d43ebd','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(190,'2024-07-26 13:40:32.908798','2024-07-26 13:40:32.790864','1970-01-01 00:00:00.117863','rsa_sha256_pss:165fb4a7e1a256dd46ba56e47fd2646be54689cfe4abe28c18e1a82c2a33a5c32ded12bf43e9a0403700cbcc0698a853510cfd850dfddfdfce08cbeb35af16e1898864b4335979c5253daa331129287a1045db3ae5fde4c25b2b65c4a5b83adb4922b351794a3a23179168b8a662defe320b062fad561898772b2816bccb19d8c816a02e07eb7a804dc50c21d5f0af51d08ed5e48aa8390ccfdd9f7f3d4af6d673cce5075fd5639131615df9bc12e1b4dd656767122da69ecee67855b44333869e7eb19f6f3710936e0f4784cc428bdbd1418c803497b36d891accf7fea12f017756fab574b6525fec1805cba1ffe235ec3c3d43a8a967ff60676e6d85d3ab5d','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(191,'2024-07-26 13:40:32.909856','2024-07-26 13:40:32.789201','1970-01-01 00:00:00.120563','rsa_sha256_pss:2894eff6a69a491b4a79e35fb0d887453fe7e2de0f02e6a1f80ad99539eb779a21e26436b1b1713f7647b6f251038a0694faaab525994b4927f28ad97ab5c03f34ec6191ef7687a756a6e53c7a788065d90b1a74d24efb63f92ea5466a311639f82d424b9d1db19c4d41ff15f1b1a6c2e49f7e7a463a0634b89af7e735ad6e15de8081267cafcea429ebcc21ed7638db2594714ae387fc9968748bcd3f4a4e2d8100455d2cd35b0102219250a7b710de89a7b80dbdfb80efacadbb9dfbd47fe69c7e728753855b679a2721c5dd4d3ffe305f613cacb4528f8e98ca0e053387b59509e2d85731e120336aa6e43adaca59ab97804a6ceaf068315df05de6a888ae','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(192,'2024-07-26 13:40:32.912850','2024-07-26 13:40:32.789224','1970-01-01 00:00:00.123572','rsa_sha256_pss:877df53e83ea8f7591280a515cdb7796e07872245e5cd089281ab97960d32ab6fe295a643d0eaca7b60a0dbd047c4a6d3518f1ce58a58a0e7933895c8e7f636634aca831b50fc449cc470b22614df169bbfa373d85708004df24b693b233949346030af46f886af0852b4895d538055e3bd3a30c324e09158cf182a0fa76acf4adc11b20d21f49f57c5f4d2357ac199a905a829977e7bdea00f4303fc4c469e924f4b450cd9818d251887105af7c209abc3e621b1d45d9224e7100999e8c60d20ab2424cd2b0d6bbdbb8c1a066c9ee376e3b056f2e7ce293d0c4369fc60c758ac4fa71eacb126ce22b2c01622ff266b11b010bfa682a6d3a72696b9e67bd1107','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(193,'2024-07-26 13:40:32.914563','2024-07-26 13:40:32.790658','1970-01-01 00:00:00.123831','rsa_sha256_pss:5592c17b030c9c9b7220442cac5ca9398375149ced594c34c1cda22859befc040cb837add98560501d96df462b95ec8713bedfa9b6699fd6acee553412f1b97babc646079f1ce1501c73fa9f99621e7bcd7dc5839900906658ee68328e73c82a3b6a4063420e95b24ddc3dadd5c96bdcb9b945a55bccbd9523829eb12fb4079c24f93a597613dfed84e7b81cbe24d16e6f60653528bd963750edc61d8b1991f34c3a4d4d207c86b43f686e73186c2c7f4194f29557424dffe4cce28aeec8d66ebe51ad3b241fef6a7dda6534949d2e4a1e4ec855c17428829e81395d7aed24f224e2cb7487767df3563560fd7424f6c1c32f4445cc75ea5322ee5545b07cf839','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(194,'2024-07-26 13:40:34.463371','2024-07-26 13:40:34.367011','1970-01-01 00:00:00.096142','rsa_sha256_pss:29dfbfb37bd7d875112248cf944cb5686d3f7d13cd9a2e6ba4ac797f3d51832cf0a2ecd2083e294fea619dfe3f7bb42588c84059977961c9db08c2c0376de164fa2a524df5666cfa2a8b5cecbed78b46073cedf64e6139ae8c6ace8722967e0d3218738554de4aaa4d4a026104c48cea981a60ea73c2bbb3ffb1cc8b9a5ef8bf6e1af91bf25f9e6d892b9d348a0f3d7e06bbeb87209f8663b07b823a120a8ae36e0bf222739a9bd577515dbfcaf55fd2dc56da67b57a5b11aa0b596e71fb8fee639a2e4f29eba2971aafd0047634d63f3424c8412eac5407363eb9e982d44ebef788935caa088f0bfa3ae752c15d69705e308d8787fad7bed6282aecba6e8606','GET /resolver/<resolver>',1,NULL,NULL,NULL,NULL,'mariadb_resolver','admin','','mariadb_resolver','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(195,'2024-07-26 13:40:35.901238','2024-07-26 13:40:35.823050','1970-01-01 00:00:00.078127','rsa_sha256_pss:1a212e2d796497bb7d69f79172359bab28f38b22ea42aa5ce9a8142f5b15f2b9aa2e72d69ff8becb9e1ea76e467aa86115efb546717f489dd92b706ccf469103d7e3f7451be4bd2c362aa063d7df16eaf7da21fca5ab3b0331e6d88264e323235f29fa1b4d8b7a41541ec083d84f1e4eab6fbd48657055bafbf2657b8dc7903c22da7830d9054e79aded9237488b755810cb22ad51d1338c330de983312a203f4e4d1633f331e9425414622aaf60e3b4b863b676c2a66250a1a340b345f67b2ed2835d3a7dbfcb12422aeca5a9d0d99839c0600201d12fbca656b90749e60e921c3dddf437bd49e18f2e97471b87c973a85acfe063152187c3f57a4f1663280c','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(196,'2024-07-26 13:40:35.998921','2024-07-26 13:40:35.919189','1970-01-01 00:00:00.079678','rsa_sha256_pss:ab7b285ef63f6bbe540b45ecc44796025c3d1325565e6f54e824b866a2b6620eca9865cc36f4127274776d42ea72d99b8f8bdba17ab9f7f67722e3d87d4f6a1f9b5490013aa3837746019b7186d389f883c1d9ae148b1027dca5aa6cf651940dad172b459095a0a0f6abe08f6de9d414229af356e19e15dce524fe3c1940d204b75d5afa4fc5a371f72b43c09ec3ae3575025a417211a24c7573153ea7d42af048521a70e17cfbdc26376466c01c8f13b96f018b6db01d5e7a42518846bb312cd5d01186c391b512f5aea32df663291ac6f5b13996f182a34c2838a4adf8d835aa8176b0d41840ea7b7d442c9ce7ca0c450fbdc55e0f90366634ad99630898c8','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(197,'2024-07-26 13:40:46.952154','2024-07-26 13:40:46.854150','1970-01-01 00:00:00.097952','rsa_sha256_pss:601e9dfc70a89d64b56a8a48fb72802456c32e033e1a11b3dd608ee1b0d318b2ca265311e55563717039ca41fd14a62b47cd1209a5b0cf8f6a6bc2258106364d7bdc34092bec5e1b209bc3f8561dca9da42f5ba5246929d4fb8d012d7e600f19ddc9084b15219317f2885bb6378eead1bb5fe8e0615f6f32ce4e3f5cb5beb0d2e49c853d12cba4c7e752c8d5b8ef585f7fc707afe6ec46fa09c950cc7d0d2be91fad8aad5f122d4d34688e3a722d8d3012a1a78025acd010ce17b5864c82ef51b38e5a5278b9fa4ce613c98036790cf8ced6b3d0598cb843a2fbff19dbd6855717df6489413bca82d1e385647939bcd15690f4a10fecea72ef08b213652b62b9','POST /resolver/test',0,NULL,NULL,NULL,NULL,'mariadb_resolver','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(198,'2024-07-26 13:40:50.900919','2024-07-26 13:40:50.759984','1970-01-01 00:00:00.140881','rsa_sha256_pss:78fa1b6c69e313b143c10e5885a1acd9ce6fb10275f228d3af7f95c423de13689a1002538bde8809335d7454bd6609046663644ed7992fc703d9fae0a08c109a4b80369da8c1ee360806fcce7445850508903c47ade7c78e4442c6a82e076dd30462096096f62179e8cba4ed653675f4cb76425a6f20f8565cffcd10ba38d68e38f3179290dfd5cd4752fb83e65021da5c7a383762609039f38a5353ce99ed4d45b1e753b1a1b081bf41acf5c284d8e1b06b6abf2a3ff9a34715476e83398858d47da5d241f45e87e51c179da6919948882cdb87ad664d1c96550075a995c90b3644192ed270f9757c5a1f0bc4abc2db4e7f39bb1ff74c1f961938ce75589075','POST /resolver/<resolver>',2,NULL,NULL,NULL,NULL,'mariadb_resolver','admin','','mariadb_resolver','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(199,'2024-07-26 13:40:51.038011','2024-07-26 13:40:50.925063','1970-01-01 00:00:00.112856','rsa_sha256_pss:8c35c15a875ca74640bffc4cdd1a4487309885cda61521983daef4a70ddadb021e9ff692bd51e6c84145f0f1216728cb5ac5226d2bbf9d06d4a1f8332a3a5997622fb9e185473e31776a555e5736ec928745d3f27da805d2bc243141de6c08fa485d8b436eb13fbffb91522d50633433d9abf9738bfa33f705e4d54d87bbcc836f3b3a1c6ae3c13babafb13bdc5369c7235c045cf30147f66e77d66b68677fda057e5a51db3d2874c154070540f0ae30bb2ea41eb498eca46be2fa870d2a53cd46f5b97781187c21e2baa034359e89d1b23ccf22131ec0abe591fd11a0a416f06ec9ccb05753e78f48e8f2a56f24949a6ed22742f9e08d1f525c43a087ad6406','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(200,'2024-07-26 13:40:56.121111','2024-07-26 13:40:55.987417','1970-01-01 00:00:00.133621','rsa_sha256_pss:ab834e0518b8f57426e0d5d0f04063590fe70dec4e50a9d3c31cf282b070db54c57e7c450fc7e12a1048b3ad53c0ef20b10a84feee7ed76f099c98b91f03a16e7577182b4426e3719401de6d7930a086208e56dbde9b2ab52a14726bc9422b7501ba735e9a82625b067f63bca166ce588d8400a0aefaf18d865a8e5e9c678c0c5e1d6c8f5187628eafe478c35151973e28ca90d03b1d4491fb84b821b4d6fa7ab4d95afb66c8c3dee3150e5a42491e88af15dbb6fc74d8f8a8782ec4f44a70ae45733d2747e25fd98d9345ccc2edf3d6d850cee4b8609dc73bcd94c7001d4e471beced06a804910102cf020b43da82ef37ce7d83338bea1b8b8dc75acd559899','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(201,'2024-07-26 13:40:56.121698','2024-07-26 13:40:55.989285','1970-01-01 00:00:00.132357','rsa_sha256_pss:295382b982379b80f13c6b366feb8d251e7e47cd2177ecc3ffb6dcc90681aafacf65270bd2dd1ffde9cdc057852b215e2fdf41aec85517885f1020fb54703d8e378788ee0918bc9b9d3c6daaf3f3b29f9f2f9298cd26f83a35303aff4c51f5f55999f2a724e5f99bed883b70c4c992faead81eb86ce76c0403e6cf31f5aa90acf23290020c89fe0728ccb624b7d879c1bd90c144366c6e23cfb5d7b89c6855667fed5c0eb368490d191d912c876996251f4696ebf445f8511043f66528d94b1718b23567a5171d46f7d07c11ebb2e580d8b790b0c85ea5788c43de87856780c9b7b3e87fde6b27a6e925ab7faa60121907300adb93520f647e46ff2ef9d77159','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(202,'2024-07-26 13:40:56.123697','2024-07-26 13:40:55.990477','1970-01-01 00:00:00.133157','rsa_sha256_pss:6fc48d0f75ae28665d6b613ba0a88ca177ac9613090864f37605eb88ffcfe74eaddc2092838bfc2ee05018cbd1795ae85b78b5212e89ec5bcdd4d5260f60b6868f097609fc6c98b93de3117c08c5bfe1c6be21bfca5509f849bc3a74fbae7c67b5056b177e0e675125ab80271efbc196b263b5083b16b76c767406cd70fe9519eb587b0c24515af5885d9ef88021f3e8aa1197269566eb490852c1d6832139eedc36f2b4fc479df1f6f40c6930dc9474e5a6e414d59a13b8023c737381bb77f497e18fb6a4a4c05d499b2c5996bdc19ec7e8a08b00df922447b89372c7984ce177b332a16658465a7a3e6a58fde2a929e683a5a7920a0b0c03a5c96870f956e3','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(203,'2024-07-26 13:40:56.125192','2024-07-26 13:40:55.988446','1970-01-01 00:00:00.136569','rsa_sha256_pss:abc53336124aa8a34281b4b07a7992f06f1bbbe11c1502b6c94bde2f1ea3d87f63ff98711be7637317158578bedd501a0fad9fb708986e89466e5d47c4ded98b6bf9933977db0b8891bb7c238dc7ab6cacd8b979b1c2b58d611047ca8384a843409c8c0254c381a3060b90cca544f2043bcc40adf994cd1fb6d48683126b92acf57794bed9405c012e4d876db469796f213c6c8d4d7300221174a9cf0b0441080db96fba053560afe28899c6c4b7d24e8c01cf05539ab0f365195f83cff9310eeebd5f057358eb319f7072425503023bd67882695bbddcbab8df68685714cc25e20101deb7f0f7ee7dca5d58e4e240abc8233dd14571c353e940d31222e1e30c','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(204,'2024-07-26 13:40:56.129748','2024-07-26 13:40:55.990993','1970-01-01 00:00:00.138682','rsa_sha256_pss:446855fe2e0dd0a17c144d55ebe5ff80d6b0f576b91c7b728117d06837918e6530ee1de31ffe47b4e2b4b6b2bf69608a4024a9cae2cbe1ed24a9a7fc60c54f4ee82ab647d6b3815b821fd4e549b5350631f99ef4c383aa82435dbe985148b91f581e299e577575cfbac77a5be0b82920f00bbb0725ae2d651ecd926dc9326bfa1a4b323278963a8e7307caa7324a0cde6bffb34c8a950aeb73bf93e5c6f75c7cfd7ad6249f07f12fe47e5d4bdc9ab91c2f68ab65443388f5d82babbbee209bac5139c7b613719ea138fab290591432976af80b2edec135ede8003cc77fe5129ca6cd79e6ed1948e44500555467c6c806f02355ef9ce39aadc2d2428a14280724','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(205,'2024-07-26 13:41:04.522261','2024-07-26 13:41:04.428338','1970-01-01 00:00:00.093874','rsa_sha256_pss:65449620534ce8a0aa2727effd6f144d9285be0109e0a761a686fdb4b6484503f46a9760103f87f7792075812cc1d1baaea4af9040f158f0b5aac0020518da640f4acad78009a27a6fda1e65cf482ca2d5dbb9519cb5cb7b900af1b058220bacf3aecefebedbb6c551779effdd08be07d1a3c5b5ba5977403d82e29ea8a50b6233b282eef8667bda4726b7142a105cc34872a029b018a8b1b4a695d75a4c105d95694a6f83563da0039999c61a4c371d4d2b3e7ed1f55a93bec9c5dec91910064b7c2f81c7fc3fdb4c09fa95b02cee622c9182dc289f9afa9db30cc61b7307fd45489692003fc41096982d886315e4a16503b51c711e018187d61921ed558bef','GET /machine/',1,NULL,NULL,NULL,NULL,NULL,'admin','','hostname: None, ip: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(206,'2024-07-26 13:41:05.199506','2024-07-26 13:41:05.103502','1970-01-01 00:00:00.095948','rsa_sha256_pss:a841a54a415370d0264fbf847a97a44d26597ab8b94e0dde5badb055ae23de9cff3d62cec7db70e62bbea9ac7cad689531dcab0c1ec91127ea57709f426ff8afebcd6590361add019cf7389cf45e2496f52b52960ad08c4c6e69535595ba785cdda8bf5679de4a92f1e2ba43adbb65da91fda51b1cad772048e54ab46ab6497aeb2c2afc3e131806e07243b619bca117db78f393e8bcd4a9d949fcd682d109ad2165db2f88ebd367de868330cbf5bd0efa8b92d19026cb5033eba3759a874a2f9204c9425a8cfc2ea29d8930cc6137ed0d41b157978d5e35a476dcb6df66bf18537226f11cb7d4e46e41432531320886a409ed4ee2cd73d248d75ce682dd4e04','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(207,'2024-07-26 13:41:05.327853','2024-07-26 13:41:05.224087','1970-01-01 00:00:00.103711','rsa_sha256_pss:586dcac19bcbeaf86c82575685995c130bd564656c0a32ad20717ced27f77cbbcaee4cfde02116fbd6578c7bfe5257d10304474bf853a9281428d1cd6c0ee881b893f45d2b049d1ff9480181ea95b5662a6a295c0c809fce858dcb6434caa43054f49855e9a9ae366d7bacff2f73efbe54808212bf6a234742edff5f67a89eb85be287d284706298911affefdf060dc1dd89bac4c703093ba1b28ed45f760456273e9989633f31d9cd4697c81be0cb7b802997f95d56c0175a37da0edfd5fdff588dbfa8e4c8df2705e2c48ef9b9299e87ebe7cba869c4f372d74380822caef78e3fb14bbd496630ed5ec153da283df08b76225e6e3a099b960827c465de0c82','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(208,'2024-07-26 13:41:05.939287','2024-07-26 13:41:05.822165','1970-01-01 00:00:00.117067','rsa_sha256_pss:34ab3cef8b4a078e904dffb052f047757587c2cc84fe9b2bae02bee55b11194aa53e0ad8febaa2bf8501ab439f61710b552a637207dee52dde1be17a077d5aef1399d5caa90c3122ae89ef7989877c3b50bae574c61d5627746a224b0959452308d1216dccb2ddc1e4ec42a9185a0dcce56403fb4610022ed10d6fd829713d79aa87db61bf1f21656a16990b966121132da2d7bca11344102df0c38e55102259b608dd9ba4d6a1192ec8afe10cb1b75d0fc90f676d27a2fc8d4e4d4d55627703428ba122229d298e64b0efeb2efbd4089d37816a0c2a920ff9318cfad390ecc2c34aa820217c597fb2dbd4dd58ff415c569d7b466d2c0e9ed25bc9af2606d544','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(209,'2024-07-26 13:41:06.633848','2024-07-26 13:41:06.550007','1970-01-01 00:00:00.083784','rsa_sha256_pss:91df7b4bddf9c5037d0082ee41b94ef514cfd82460f5facdaf3efab8173e8e38da0df22c782880c8815a5ed3340f3f4dbf0d1486e05a1d35900f5daaf8a8d7e68ca9e70b37f3a8c6a94e032810cd3b7d93363b542dcc31f10d3320dfeb96ed5dfdcbb0bc1136d29fe0de637dd18155859c2308836580453ae79e0bd4d07447f4973bda6cf3fe826629aced56b1afea9d531b8e9b078f929e3531593f225d23d5f5d156d7213ff3dd6763193cdfa85fc03189e9d66f53a4e2ab61459b54e099fb0f75e639240cc0052bf68f039abb60481e4ec5bf3519b1afc7db437f464e82b037cd2580499e873b9c2b3b206a79ba416e6639b94d6ec52ab4b84b6991689931','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(210,'2024-07-26 13:41:36.052733','2024-07-26 13:41:35.942930','1970-01-01 00:00:00.109739','rsa_sha256_pss:9e43bc88bdf6add8ae46ac3ce9cc06a3d42d3351107ef99dc7035da5de2205302d1238efd988a28a421b970989b189a8e57c39a36555982750426b0a070ef92a802a331f7239a49e5b9608b756273a5ff142c829fd519c7bd72cea1251ddf4ab6c97381ecd14a8c44ca858abe6d915451ff684cd424c30ed5ffc43baa6d37344217c719d49af9bc724870252075bd03cb535b39990faacebfd0a61d30de5665c3f51410121c304f9c5c271e780a5b72b55e7fe2d53bd53d014274bdbec6e061d19e9a086b3ff4689d2922b641c04acbd9e86cfd7b347d841feb20f8a6d9a7ced2887d843f62fc7f5d630cac9b09210696eec4162d0fef33e255ca764bdee299b','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(211,'2024-07-26 13:42:06.058989','2024-07-26 13:42:05.944597','1970-01-01 00:00:00.114315','rsa_sha256_pss:4fd0c6d5449189ac2fb094b8251f1d35f85bea7d32f0b68e5a76d35915c4411a744ce3c35c161da5aa44659063bb059e9924ab933044097983dc9df3e342a3e3ca9d4b975a64dd4d1a28e9378ddd8ed09c5652015192b9958b3b1fec3b585b78e0029dd5d220508a31362ac9583bea5726529d9b6d3fed6ddb13e9e800a21aaad75203339d38d7710bd671b977ae190e9c61cb40442e9c6d02a534955f91284ac25dcd50e94219770f13f771a2997f907460319adade95304e1faf82dcb4da7ce61facad43ac7c0604fca08dfb0e5ce56ad6978cd09e00769eeda34f0980689eb764a8298eda8fe1b3724f03af9b56b930010a98fb47d2ddf630965da9d49bd8','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(212,'2024-07-26 13:42:36.197062','2024-07-26 13:42:35.950343','1970-01-01 00:00:00.246647','rsa_sha256_pss:2b4d4961e38f293f413cc07ac48c240fdba25eb6a8bbbcf21de94038c23548c4ebd20e2673a3ed22938a990853af858bbc05000bf9fb4c59d36f84388e0e019c8ada39c2e18024f65fd3b166550d03a5cb3df4af758c47ff07be838d6512beed98a3e11b7623a46d80f2921256e519eef6fb290ac9816250822575a81d5662cf19216c3af468c212b475531b1ef93c05d33317e7355d8509e96e8b68573de2ac62758bd40085b14678d5cd8c4cb0244ce310526164812ba22abbb5fef516027688daaf5615d10a6a0a8119b43efe2897dfb8cebd93eb71e03c4f7a098b58cbdd57e15dca66850d6a221880c876b81fc3fcbf64385eea317c758c38bd365f50c8','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(213,'2024-07-26 13:43:06.066302','2024-07-26 13:43:05.945144','1970-01-01 00:00:00.121100','rsa_sha256_pss:3363aba0cc2811807b889d90b37b0de50b893221c131483a196ae1df3ab19b3f483ca74d21e42923c437bf9b32c62bf361f85f713667e6403d4faab3389c11bcaf6964229d25e50b4c3092dac039fbf890373a6fbb8eec1e5135541e742f0ce971b02cbb4877cb07bd2cd54a764a3bc6660779054307ef725d40db0a8590694883411902aa2e3a1f4b6a26dba9fb1a13cae43f0da8961db6aaae991d7b3c4218a36432ea5f188ab18f0a8af0ac73e8329bc337c557ccfc368dd0760ab56b16372bf2835a3795bc514ff705d6e7b852ff3822fe50b94fd1f74f37b8632ffe5da62030b1f429ba632fb401b38995cf2db94cfb893ef0b61fdabeaed558c3ca2179','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(214,'2024-07-26 13:43:36.055609','2024-07-26 13:43:35.946090','1970-01-01 00:00:00.109460','rsa_sha256_pss:3a85efd5276bfb7c64106903aed2eecf109e2dd31cc5960c43d8a113aaddcc3c10c28b41ca2a4a17b30c1de297b13f25a1219de7f0182fc708172b037ed06bb8bf7eb4bf2d5af7733c5d5fd9a4614105b7a8f781b47c61cafc833d5852d7e7920388e7e0d6d14565f311310a7211ec94f965af1cb4b1ba1d85c6a53c4d15471c580549e427086911f651fed403e94acf6f52ae82bc50d7ea6e71ef804dfacae38a61a7f0e4092ee266795fd6ab9988dc3f795ab6ca3564cf9193c5e65806f71945348aa3a1923a5c97f1634f3e11ef62ff4a178c8af36bcb8b2b3f0972bac05271e648191b05c757bf1ddf77db6bb333e1d49cf9ecd32713f436605c2ff4eccf','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(215,'2024-07-26 13:43:49.293365','2024-07-26 13:43:48.873390','1970-01-01 00:00:00.419914','rsa_sha256_pss:9a80cf3fcd8ccfb526b8ae737f270f6d50cd9f7128baac234ea52be50ec8ec6c44b3a8a98e347649098e7d8d3d756f3157415a8ee3878d27a72753fb6a5524f633b624b62a821329b06d5f81fa72ea38e4f19f233c5f289eec7cdd15b53675a520a1a556bad784778d63ebb310ad41c79bced59197db5f3054e945c82343d45a40b4b78dd69be67617b4dcbdde4dd1f469f08765c60d42275b3e520560e478b531b665c58ba65ce974972eb86ae465111d1467d2f91c7ce427882c3520f36c888ba6a179de842e0dd4e4acc329b3c08f0c4f34d148a90bcd04b9fd0e660a4c62e9d43e0ae2599ec2d971acd942ee7408c90c7c6f10e9a1dce80fb938b612c33f','POST /auth',1,NULL,NULL,'','',NULL,'admin','','internal admin','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(216,'2024-07-26 13:43:49.409432','2024-07-26 13:43:49.325844','1970-01-01 00:00:00.083514','rsa_sha256_pss:64b1690c5f58a3a6aa35cb3c51579a2c8b46f2aafc0347d4b566b5eda83548467e13ab75f4eb206fe447674cfb7f1fb89c76f26bd841b16c60fb6890946e78a0dd79b218806d6b7b5804a5003b648198fe78a834855b9f9e08556869cc06693afb329a0fd6e603b6cf0db1ec979e81a214d103c3f48a8098be58669837fa9ef66b069a5819ad23786e1779ed9925991fdfe66eadf920191e355c38f6c1b98b2b1dbf67dfad9ed4fda5098ce8c40ee93407b0e999ee044f6da874690fa3d48b1811bbdcf1edeca19d72c1e952849ac6bdd589583fa0ac2fc4a6788d7c1e039e214949802fc9a776c5ef90625db755215e1a1c4cb1a2aaea87d8ff886485cb9d89','GET /user/',1,NULL,NULL,NULL,NULL,NULL,'admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(217,'2024-07-26 13:43:58.506362','2024-07-26 13:43:58.388548','1970-01-01 00:00:00.117757','rsa_sha256_pss:791ed9b9e8ced0ac41aa329662499efe29b212ee19c8ce470cbaabc057f477c0f6683afe7786fdbfd3ff792300d77fb8c3e6dc6789b0696e7e3d29af8a5906ccef14affaf12bc27b869e95d9b6aaace652c2452b685d8cfa03e354972cc22f3aa8a91d7008b234c3aeff7e83c9ac607f0bc5100719d4d21c0bd99a3c45ea91f23bce42672de6ca3e22c2733a5323d1bdc2f2680ccb30ea431217815210d488ef41ec67acb5f87da481b3d6afeb2d742c3a8bf0e96dec0ed7428d3994aceb1e35bbc2cc806a139291b259185f4d4a983aa59922cfa2dfaefe9176f31e0a88e6ede502dbad6a2539cc4faf06d0b7507af7f1c1a30f421a107a2f7562b3f0f62018','GET /user/',1,NULL,NULL,NULL,NULL,NULL,'admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(218,'2024-07-26 13:43:58.624436','2024-07-26 13:43:58.532344','1970-01-01 00:00:00.092038','rsa_sha256_pss:06af065c8431b286393f824552268a7119f19f056d5448a2fe7c0441d214135a6591817208a102d636a341a1eb933668c7c4408931beb42658189f5ea587708d55cf99c4def3e0a17d95d00d5a8fa43a5bed9bd89648f5fabbe8df137bffd94d84ee73a681b78370731a9daee8393d90abb3c8f2c28fc68f1444344733612a7233dc590118dbb8b8921ae8afb2d7f821098045ffab5ca9311e56b13d3c48bae39636c6f234df5c62eb34547ff31375a3d983d710170b5f659a03f2a39cf92e915423abe8de49574dada078e06c69b187fb85f09e18f0e7d03fa5230312c217851f26829fa9a2b512d81e2a3cf3b70dbc431cc0c16990fce81ec7dce4336e4351','POST /user/',1,NULL,NULL,'autotester','defrealm','mariadb_resolver','admin','','1: autotester/mariadb_resolver','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(219,'2024-07-26 13:43:59.130079','2024-07-26 13:43:58.645743','1970-01-01 00:00:00.484286','rsa_sha256_pss:1acd7479c08f4fb78c4a5803a1f45dc75058e7946e2ccddf2ba4e7f5813789ddf6d118b5527ad3d5283662fe3948ab88d6ca2433dbe75dbc30f5bb6d86e78e6122d9248293f4d0698fe4f4b85eff6b08bab8a268107a0e1d573c5acd9fe83254ce2abde864146af9adb8d6c45c869e6410d5f489c741618bcc3595158dd5d2a9b7de5848a77560e551d706c8997583e3cfe4f650a2aa5b3c909d90ded7ccc5fab41a1c6773c1a4569fdd773e8f397540b31c6d61eee06505c204eecd716f112a1844a84be213b88ca4aacd4cf54195295dbcf29742eabc3f44d5db2324215aa25a52a5e3f2f9b381c2141ad5f21f082cd857c2ad890338f01f764c96068e7803','POST /token/init',1,'TOTP0000D0CA','totp','autotester','defrealm','mariadb_resolver','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(220,'2024-07-26 13:44:01.150953','2024-07-26 13:44:01.062674','1970-01-01 00:00:00.088227','rsa_sha256_pss:27ad0ad8b5d4c9c9d4b34d10029b809a396f7eab7db7ef5fbdfe141557238b790d3aec1feed5b701a81ff4f7060db64d980e95baf30acf5c360b8e4cef92a757dd7c93449afac997f4d31e639986cb688c662354bf3cacd88bbf3bef7dd78421d2ca485a7e54b6a813796327fe01e68b01e6509ddc86e83ccb62aa043c5b3eb2669660dee77df40cb237a0d9c4d5aad786601b68291a030da7ca258a34bb7cf0654690a6829204925195a0857cae26c4ffac1649d5ec1e2f0b5a9ca60fbe73c7174e015dded7eda8fa0c66ca2cf816fda17e02b545376c18594c9078559c5cf1bceb24e7273b57a7ab73aec545c12b05e6319e7ce6338d5c75704b85e2b8dd78','GET /user/',1,NULL,NULL,NULL,NULL,NULL,'admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(221,'2024-07-26 13:44:01.410017','2024-07-26 13:44:01.175269','1970-01-01 00:00:00.234693','rsa_sha256_pss:0b826b06840b6e572414298c76408936ded6e182ed1320d969d302182e55186be286e34220eb45116bf437859f59cd801241b301a0491170c7b2225126a8c8346161979d9fffce3385ce177b93c2fb7afb39f8735dfd22a2b817f6b0f45cc7c340fe416c8527b4d52f397b044c13c4968aff343eafca15581155c65760f1c35f5c998b9dc8f16453fead6a0017f4c26f146a63488ebfe35947f22b4aa18ca9eec3c54c19229de2e8cbb2307a4d0fef4dac3634f1bf4746dc2948b34323503176d1a0ec975c4d65e9391a335bfd79204fc332dabdbe3dab58a9de9cd113ad09ba1591af15b367eb676c7d6890bf6f2f2c6a2ec4ee12afc04c1153c7303b7a679c','GET /token/',1,NULL,NULL,'autotester','defrealm','mariadb_resolver','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(222,'2024-07-26 13:44:09.248634','2024-07-26 13:44:09.101380','1970-01-01 00:00:00.147197','rsa_sha256_pss:1fe802d4096250b2978dbdc4b869ae30342b76b777a72dfbdeb52d7690cc449983b0ceabab429ae07aee45256878089b912dccbcbab58f77bea2db1b554e5b59ef4924ee64f1b51a7ed11243e01d2aa9987f03a957841d76f5fd4118c4fea3de529c2e3856d532c507897b0fcd295dc70082ab62b794f564938633324d9afd3b4b68559460bd98591dce892171fc87390fb9cb3a478c3f0bebed69a8bc27992aeaa30be483492c434e47a1a1140adca0c0b3bf140dc4c26d0e96b45099178fa2794efae9300dbeb88b009cdb232a89fa7e1b959d85ec341c569728b66e534700dfbed7d3eb480dfc4aa92f194dd7c3ea962a94007bef79b34eae4bddeb9f6837','GET /user/',1,NULL,NULL,NULL,NULL,NULL,'admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(223,'2024-07-26 13:44:09.398941','2024-07-26 13:44:09.283340','1970-01-01 00:00:00.115542','rsa_sha256_pss:8a8b5afb090eeb212a2cf6f8c76010cd89fa4184787cf775f09eb93ab5d28715be14145b862df7c4695057fe8232d38d583311be8577a89aa6f32dac4281f5d725d2a1fc41940b0d67f070cf42a1f87623b981605c27c704b8f60376278ef94aa2ba547f0152feeba4ce53dcee4e447f1b2ad2c6029f370b979db5c57978ae27ffb3e50a5ec80496c8aea401d558d88f5c95f67baa1d1763205653931a58c7597dbe701c254854600ef0056145bafd5654b7ca70c26e64dc6c679f8b7e7b6d37ac70ca9c7e596e2f2906362aa6b5571fa7e236da5a238af022fee074a3f58442962726c685c33564d0be589899b3d912f702f8276b710353635fc5738c9228d0','GET /token/',1,NULL,NULL,'autotester','defrealm','mariadb_resolver','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(224,'2024-07-26 13:44:15.033755','2024-07-26 13:44:14.825033','1970-01-01 00:00:00.208660','rsa_sha256_pss:3c68158e3ecbd53d9f407508ab00071f27d6fe86e5ef00f84749255577ab5a483bd96fa0c0a3ea705c2fd33e6ea3f305ef540f4fb8c00d2bb30283b58b3ddc394e4ccef634b784182e79080070b18e9d7fc6845fe7a63fd34c7d5efdfce44158358133a5341a3ef58ad14e57f71369e37302d2552d253b0724f1ddc063aa779c614f120505e2c86ac2f70631c786ad8f2800e7f37c96c16527cdc83ae9ed1059767febc6c8ee28dc562bce29dc8e0b52b35ae1d8820d32989020c167c6fefe0d95789280700cffa5b29912653542c61f38a56bfd3cafa2a0d14fe2faa7f6e107a7214a40eaa6abe8c7613c4b1858aa603b5c03d933f648cfa5a20c1afb7c544f','GET /user/',1,NULL,NULL,NULL,NULL,NULL,'admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(225,'2024-07-26 13:44:18.023579','2024-07-26 13:44:17.938118','1970-01-01 00:00:00.085404','rsa_sha256_pss:8387636c068df69aed797df50be0fe7e59752947878916ab21328fb337e9fd611dbf1da330491e2750ca62cecd7c5e9443c7bb025db8ef16a94221104edefbcbb15ed7b92aa4f52c3768a5507d063c24ee7cd28dec269ad3c2cf20f8b33f59ee858cbe8d9442637803c76677d7c7e1c390b2f7d7a637efcac19db346781651dcf5d2fab7f570ce65f70c399eea17095f82cbb260a17e30d3b4cb874c38d886e97cb9ab99f3d6598e81365df41f7dc0703f54a84ad0bde4437d2b63c59bb8c9f90907a6c7b1bd6a762957911dcde44512510c307e67fe4bc9b0b6b461bcd26d04316d850a3629797fcbe9afb258a76a1048b0bae1d0336b3ba89198034a07a219','GET /user/',1,NULL,NULL,NULL,NULL,NULL,'admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(226,'2024-07-26 13:44:18.148078','2024-07-26 13:44:18.051393','1970-01-01 00:00:00.096629','rsa_sha256_pss:8ed5af948eb06e81fc4dbe24b6b8c56e7ac070e52768654e72831f03a8ae20cd5c43e24836fc2d7aaf8ca1f1ea2421bab3e661bb95d2fcc8600186571f6f4328f46c2b1da7f495362d9cb3e39cabcba9654e92d2a91c42ba649b04bda7d8ff6949ba291653869fa4dcc9919922c9986b8aa02de299686edcd81d7b02c8a64f3ca635d8826538c8c5b17c48c8a12c72e4320faa1ef6dc770b60add10123de61197adc3340952ad819dad327096759bf1fd710a5af643f558c2adbbb7d5e968bf35732fc06637417fa81d5933cdf43cce38dc261dc3e2ea9bc1816d78b09ca9102399d59d803b814d337c42db27608cf81809f14b5ea88503146fdb5c30f868835','POST /user/',1,NULL,NULL,'faltmann','defrealm','mariadb_resolver','admin','','2: faltmann/mariadb_resolver','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(227,'2024-07-26 13:44:18.544488','2024-07-26 13:44:18.167133','1970-01-01 00:00:00.377304','rsa_sha256_pss:951d12a2f6abf28e899ec3b5d132ab1d3c0ff201245b77926b57a07ab8216a14dfb8c268674e98bcec2c7b95f29f7fee7cbaa17e663068330d49fa5d8f21973f884e54fa8cab41a132ffe7aba25bd24bb456282415ec4ffa94f2c7ab4b2e032b06d5b96d37e718ffb4731e04e26fa97da5e7b6cb7fd3e7097723d030b0e222efcab8e16635df3148932f02aed3f3c57b1863fbc67a010a872ef284bf3516d1bec17dcc1193ad44914a26b33d19caaf005aa5407cafd9e8ba8aacb7415f8d401d2b985130e581b058613fa9f73079dd089245d26f47d8895792b80c95968fbad77c688faad974bbd34fcfc318e8184232b2bae2125d4416afc323f9453990b091','POST /token/init',1,'TOTP0001EFF5','totp','faltmann','defrealm','mariadb_resolver','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(228,'2024-07-26 13:44:20.514088','2024-07-26 13:44:20.426606','1970-01-01 00:00:00.087401','rsa_sha256_pss:ac985f930a28265ad7e5a9eaeb127bbb866dca9c7fe4f951d763baff8f85a9094441013fb46a76028c795a8aa6b9a5ba346cd081465781aca4a733eafc4e78281a0d592d652d1d702f92af9ffb3811258edba47ade94042e9684567e680d6a1d43dc15f80278b570cb7398bf766b54ad655e7b2d73b74f929cbbbc33687a81755b0b1d65d4764e39d3ff11780b4e7542f42d1d670dd47eb4e984041d9df3e6cab9a8ccd6014726966b759009ffc4e94f93f4f2a78c846d6fee1a6b8efcd93939aa229e8482faecbdcece9901990302be6653469c46d7338e57c1b1df5331224f503030c6737648815ea3c7f0fc7e3b2971aaff554bdef4369c3e495632ccb35d','GET /user/',1,NULL,NULL,NULL,NULL,NULL,'admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(229,'2024-07-26 13:44:20.704703','2024-07-26 13:44:20.538810','1970-01-01 00:00:00.165835','rsa_sha256_pss:32ffef0ac546e20b18bddbfc7a7ed4cc644df3569f453af8cfa87fae9a0ea3b7e72edd069df18f041dce7c588a0c380c567e8182a55088ea078573b52f4d504438e2dc477bc6de0f33e5065129b8a1b64e98a1a1cadd191b9301750b99065be1fea51bc7a07836509c6196fe25cac1a827948256e6c1420736116c0b1401f9d439ebe784ab6a4ce2c3f475ee7b8a11a68bffdf314c631b8d3e51e4f88f773ce65143f2baae6686c0d52e33b80bb8a54328a19815c9a2730511f60459c18604ea939828ea13c288f5b141a9f43f0beb3287326adc1d6f6ad1814365deb473593bd41546729a1e6255882571c7aad7667242ba839f4657e3dde5b8ca004dbc4f30','GET /token/',1,NULL,NULL,'faltmann','defrealm','mariadb_resolver','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(230,'2024-07-26 13:44:20.767315','2024-07-26 13:44:20.646437','1970-01-01 00:00:00.120818','rsa_sha256_pss:1acdd01b95d795d9ffe5d67f27845b4b3a9456098a452bb2d4452ca93052bf1828ff7346ed6b1e885c3a83a3b1b1eab395f1370f730dcef56a2fb5389a1ab802220b26cd5276420de6d790706055e75ed0a25936a98b4de9a71dc811d41886047067052bcced6c0a42f73a6bd6cc25b72a023de1531ecac71232c4caf91894a3527afb3076a065007c5d33ff753db4f44347e0be8589aa302af15a7442b002b6fe593f0d4f9d4babd5d0befad6e4d6daab4bc98f90bf4a604482f2ac13ec1b57bde64c9c94071877f2c8e1d34e63cbb4252cc92ab388c2067de6115bee90e677650c8ad84b6e1b0169804ead39ea65645d642a3de689d35689c1556ce882eb7f','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(231,'2024-07-26 13:44:25.101527','2024-07-26 13:44:25.016540','1970-01-01 00:00:00.084932','rsa_sha256_pss:4129aad4210cd345c60919257f69a270665eb20abe946af428c5e326744873e7c5173ac3d1e767b90deadb8bc599e455259d4ef646fc1c63573184bb0d4e2c1f88141cbbbf765744baa29e814ec34a2e29bdf6c6b9839d8a20c5c181c4e3da7227ca17a3cfe67ef7f6313ca9a571d1c851eaba8058e1f1898576f5115407672da477f4b3348ce2bf80cdcb08f62b2c3a7d0f03246663c7fd2b6e308c128daf40cc01bcc11915f515fe587b248ed768c2a8450ca2691a1d91614d106259f34fec5a900e2caae57b1783258d0aed2908d0288c7242b35a1e34bba7f7dd656cffac79906a77cd1766bc136ace0e411bbc355dcd1585ed26da730c7a42f6a463e0f6','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(232,'2024-07-26 13:44:27.628511','2024-07-26 13:44:27.500494','1970-01-01 00:00:00.127945','rsa_sha256_pss:b0d392920892cab152d4a1f57030169d8e31ff39c2fa0752fae73bee91504db93eddd5ae641f9d479db6e2c358a50ca8bd6630425801d4aead5362bf6d4da83f6bfb6a28c856962705c67f82faf5e36954141c993658e69c32b24b020c5e9fe79a4718afcdb321e744480ed962183dc092561a163b3e934a433983f0fb62400a9c8b2c900fed33e1597ec654cd9a198be80bc29da6719ff35ceab7f3cd80f4a7c2270dd36b9910ccdd8ce379f92ea73fbe385e4a59653e9670f9a6b5d22b17d9be0ab46c053dd1e39b18f8f87acf38f5064c37b67f1204134c38fc9c682fd5b70eea60b7a0ce9906ddb008cd650c83d16f734453e5a3177c0fa6752158e8ac87','GET /user/attribute',1,NULL,NULL,'faltmann','defrealm','mariadb_resolver','admin','','None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(233,'2024-07-26 13:44:27.630599','2024-07-26 13:44:27.500335','1970-01-01 00:00:00.130162','rsa_sha256_pss:539827012ee2fd9f1c5cadbcdd625b5d081b03af433cbdadf145d8ac5879ece2c6ffeabeb823fc980d0c2b5b58bd258d1b83e6e593c7b5f822dddee79e5900f7c9669561e725228b52a93aa10f95447f125729637a6d53a121b0eab5b840bb4fbb887b7e65d83928f10cb8c58516a7ed96f18f5818dea5667a46632c57c7239332f3b113a45b0d63ed28ec131c897334f91af73ed6d6e88a8d41fc04e507a3809775bfca49ba7e83ca71ac54b4d74ba785aec730f3cfe250a13cf0f45a8ed5f7b8266eadddd81085370475d6de4dce94a9bff827ce4ad5ba2fc4e26387605f33c83d266368d17c29f5b52438e02896bc27c3df838b3e5be8dec91d1bbe13319f','GET /user/editable_attributes/',1,NULL,NULL,'faltmann','defrealm','mariadb_resolver','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(234,'2024-07-26 13:44:27.632004','2024-07-26 13:44:27.497309','1970-01-01 00:00:00.134604','rsa_sha256_pss:8a17e2810a64f8855b29b82dba7e0ba32a0654d40538f56d11a72287dca9446f8eed1e0f5fa1e9d3537245d21ab2ef1545eb4ec4b51e517f3c437a82eee4d33b136a0b8600ca89b0ae261192200026dd202b12bf9b8366a8417ba72e6c713f98ebe5c45ecfefe49ac305582ba20ad77aaf6a5c5ecd7f6a903fd56e816c97d3105cac777c7127aaaf00347c5a0ccd2b1a5c6e02ffc4b7aa8672135fbaf04e5b42006b7e3cf53d240e53f739b7aa99b560f5f4abef3b60a705396f00afd3ee4a312a2b9c4892d22bab781bc62692acc90b3f718800af770970c0381c550194e1d151ec24785eba975fa48170cb9693083a250258613fe5fb3e5e1c19d61067a27f','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(235,'2024-07-26 13:44:27.650073','2024-07-26 13:44:27.499216','1970-01-01 00:00:00.150781','rsa_sha256_pss:3aac32b9be2d09e982335a6465e6ea2aff99c5423321a47da36957f7ade90cefa7f3427ea63eed3b3051fb2667eecb2f170c5f9429b56d8e65390b7132b28f1ca7d7d6ad23e66d8c2e419551896589598a26b4f8c652c62fe1dfa47275eb8f1c0a2833de983090877ed5ca82d0b8c7892955baf86d0f5ecd4142979a7f3b8b523c2eb1a0b0e9632c76a346a6ce6e7528aedae2e29003d6fbb0b3b14526ce422bfb89eed51acc7072c0071a7d876f367186e57a8fa055aa864a9550146ba724cf127cb992a635f202c983f41fb353099987fb71436fa14e2ed69da286a6010da8505e812489a714ece5b3ce96450fdb67361061d797d4b9e2cff458f3b28236dd','GET /token/',1,NULL,NULL,'faltmann','defrealm','mariadb_resolver','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(236,'2024-07-26 13:44:27.745141','2024-07-26 13:44:27.657230','1970-01-01 00:00:00.087851','rsa_sha256_pss:39c2b9a207088d00e42e602c77566bb02099379496699bda1f3b1630bc9864503374b303001756ed690767db4f8e69d1cdd03cf65f36a7a3ff585d026e9f210ae859d9b6c61bb804c68c67d8de4d74c07ad2353e2b7e86b1a43b3fc5bc324dea06e8d4a1a934c4e72bcb859a21a72bef4fe2e604a175bcf215580e9f3e22e452f7c43730616e414832de031148638f0143debbde42cd6309568b5e7da5261321c7e555023c2377e4860276ec29429f811494a3f8c97aa7463c79020864e76e6b66eab3d20f046337722d75fa2ccd24bf658f0d97993d4a6a4e8519676918660bcada324fb00d013c818706abf65895672407f2af458b909966c2aa7a1539a72c','GET /resolver/<resolver>',1,NULL,NULL,NULL,NULL,'mariadb_resolver','admin','','mariadb_resolver','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(237,'2024-07-26 13:44:29.423283','2024-07-26 13:44:29.269300','1970-01-01 00:00:00.153925','rsa_sha256_pss:5d57e7c27bc7e1511db432804dcca415c7bc9ba6c92d8126d9b8f67bc95f8fe92fe4ff4fc5e46d5c32bf50a63469c0b43c8c7e9c5edb5507f3ededf7f0b9f4edf993258551c35294579984269ca47ad284891722df1a5831781f418be1e0ad46ea1c9781100ae59a4dcf8311ba8c5a87131e5c837c48a81b98e261a9130aad0315ef0446506b2b3d925cb6d62b4a42d47835a0ae99fd9dfbc1beb853f89195d1a6358984d6b0568c86a6b339dfeca558c79ffa2f71c46d5feaecf75def24c7cfe073f1d912e9df71a685bb8226b0e9e92bfba27b1222a3e25112ddcdf8d76568675124dff270cee1174f60c465acabd4d78cd12af6a184a2e05403453fdfbe19','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(238,'2024-07-26 13:44:29.433096','2024-07-26 13:44:29.282763','1970-01-01 00:00:00.150261','rsa_sha256_pss:8b2d6075f6950a3acf6a9f409265e0edb48f5235d9c4b9a6e46f0cab945b2edf1beeaac1a4b2dd6df2290d87be53755addecffac244125d41c96501cf00ea863f6ef5509976d5d754ec756d10a738154a25702ee32452f408071481a3bf3133171bd162a43be4d24e3b46ade4c84ab5f3a8e2be7bc474242418fe520ad3a401ea25058efd1e72c9ed9fda28075600a27b703af8e1e682f249b5844c09aeeb9b089608c3050208e3474a183e0df540c00bb1a4b2181185de6dfb0a314666d059f262030a34a8ce303135b7924a125293128d024acf7bfddac1a2e5c59062db24440043ea794dbe45f4000f597dad01abedc178cc369e71b8da260af04557aa11b','GET /tokengroup/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(239,'2024-07-26 13:44:29.433786','2024-07-26 13:44:29.280827','1970-01-01 00:00:00.152898','rsa_sha256_pss:50cb6d646aa57eb87bb184feb0b2f9e8f47dd7fc0639ad9f34e7885e0115878fdba7a8cd86df9e13ea6c521f41c382dfb9ad0c35f97ca213fdbfca2733e4fdf7e38626ed5f3301d0407f5274a8aa520a22b4f8ef67933155da8dce4f0ba8eb259c1b19b89977b1c8ed1e5694f117283a6a7f7df91657a9a7357469764599a97ef814b90bfdd1e31f4a998539446b777b88146141b431a397a1369a4476c7f11f788e02a504861b2382d16ae64753f337475496efd4fa010b4811f561e20287f358b3bbf7c494556fd55d2e3ce3a79616bc3a49b28b1236ee8048b2193dbf5d8a9fbe4dce8b993a7b551d9d90e59a5e0487172cb847642fd2cd9913b2af62b0ea','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(240,'2024-07-26 13:44:29.446189','2024-07-26 13:44:29.287900','1970-01-01 00:00:00.158175','rsa_sha256_pss:223df71f36b8a0e56d6d249ffbf99495440cfe383630002a10504bff2658ac4ab0f986cb0cce6c7006377f1dcd0ed1f9763eb48b2711d9cf4ab00f81327a587965e56cf1536ddec81b1b089e84d475f4f313d864ec131424a5eaa486271c5b96ce9e1f1030e65ecf9c51767974e0709f90aba31a0ebbe535043065b5a2b5b5e68478dce5d489025134d686e8d01f298ca80a51ffc43a5c51b0af4e7fbe0474cf6df31fdc4b5d5aa085247e897eb77331760a302832dddc21114b8371bb3e21b37dc7b63380680739244a1f60bdea36420c72f4da60ebf6a3646e49433650794636727927a05485d4e1d558c790e4c2e4b3a4911810cb3c598e5eb6c6d4a8a965','GET /application/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(241,'2024-07-26 13:44:29.456217','2024-07-26 13:44:29.271261','1970-01-01 00:00:00.184894','rsa_sha256_pss:06c2d2dbdb65bd437fb95873f432f28d272ba842ae187b410febd8f6a42ddc8c25faa3d487903547a19d7928526f7db701623414bcdf3b87c697723cf11a3dd26cf61dd7caf6833537aaa82dd0b76af15e5101e05d6d3f48af71396bac9437df310ef47c027c7f34161fcb24c687308e9406cb3d94d6b6be61d4c7e12f47ab606dff5f05e9fa0f17231e62977ba9c3f1ea0550a9fd9a3ab96c8df24fdb37486144a13586a4c55191fb153772d60589e9a7e2e7a4e4a47787a76fdcf01a6c747a7078c72da2ce871ceb9f1bd01a2bf0686d87f7197491f45f846e6b969ce9b860f8ab851e1a5bbbc2ac919e832eb5c61dabf63aacb8c1dea1114b3525c45ef8bb','GET /machine/token',1,'TOTP0001EFF5','totp','faltmann','defrealm','mariadb_resolver','admin','','serial: TOTP0001EFF5, hostname: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(242,'2024-07-26 13:44:29.528277','2024-07-26 13:44:29.265732','1970-01-01 00:00:00.262474','rsa_sha256_pss:a6953843e5d64aa1bf77f3dd6c48c98820856e8287e3a90b65b4addaf0a1766348755a17a633129a41f9f0e0758cc6cb28cc853113226ae509f9829875ca40f8d7f8cef96d12d9897c7c4a17a29f5e74003668fdac52410c65e6ac85f807f06c95542b8286822e584e6f4493ad7cd40d6a02040df4ce590eb272251387a528e91bc25d8385665c81e438e3e70e64482c15fb9c5737a5a04fbd190251fdc6701d6879f9ff1249b53a3c3d992f1860813cc82fdeab5330ace3a0f6425583b08b75be5d223f5057e89f77dbeb2cdc97e93989e165884fdb0115603176983f2edbf6f24bd8a24e8eba3087891702dd6dee2112a7b52ae302565930ad1195a69693f0','GET /token/',1,'TOTP0001EFF5','totp','faltmann','defrealm','mariadb_resolver','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(243,'2024-07-26 13:44:35.946970','2024-07-26 13:44:35.828841','1970-01-01 00:00:00.118071','rsa_sha256_pss:5ccea1016d3c0ead00545122c23e5be3d36147a57ba7f9dfa7a5f0ac9c34d660345e2d2144aacf82dc9252dac92206caf0567b5b218ee8975f525654e021cc6d9bd85199f9087548326a102dd3ed2ddf4b99c5355862f6331cb70b4cb215818950c7b2e8d00e34e27791ae8679b6e769057d2a8bb8688cab0197060b7b07111505171a2bba58d01384f2940360701bfad2e2673ccb70b7c12083e4e107b9627b9acf215c69ad6d14b2d364ca959fc7550f8d5d8ed8ece22ea0ad37a89cf40c7f3ca17447f7d3dcb01a5263c6009be8a43ff51c0926922de8071d0e62b341880149d17f5e672b531cc043d32265b253198c49f894c9bf463bff3815ffd7944eb5','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(244,'2024-07-26 13:44:35.968026','2024-07-26 13:44:35.828853','1970-01-01 00:00:00.139120','rsa_sha256_pss:15cbe5982a6c867c4493769a38e2825a3e4069a3117afac58586592623bf4237638aae05f6f7ae679cff50d3b32d906403f22849119d4065f59de90654eedf0ce9afe4887728ef686430eeb15fe1598a29528da168b315b80983d790d37e4aacdad6c85bc73daa58f36f5f1ebcc71f6b7fcc4efdeb0159e7ebaab84c93e57a0172208a037dc9a3a35dd54f1f2d74744edfe343e92ffefd6693fbd0a829684c135bd6fd4664d096da011f7de246593c2cc529e858a63ed46043ee1095ecf7a9509993eb8074c18f577e09acd595df759111bba67a8998594b14aab6e79fe250e19caa834aefc8eeebd1f2eef3caf335c089410a81beb58044794319f05aa83ff4','GET /token/',1,'TOTP0001EFF5','totp','faltmann','defrealm','mariadb_resolver','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(245,'2024-07-26 13:45:05.957257','2024-07-26 13:45:05.829307','1970-01-01 00:00:00.127864','rsa_sha256_pss:6e8a45b31527795311c4abd20b3d31fb792ea5ab1ff57b5339a074b9b8aea4f6e93b90b9bd0800fb268c239acbe3b4b27424cf39e2755ccecc0e7bdfc745fb5bd165bf884999d0223a81ef957460e297c79885bed957aa77237f4f93b05196f5d31324c4c69361dbedadca3cbc34fcfdb2e91391dc61a8e3752e55290abe641a4b2fea2b258bb514e54191ad3f3d612022e89d43b91e338dde0176258fd951bcaaf28e15b6d601f3d5417245e141e87efb20decf72b19c97d3ee43bff660518946419534d392a4ffca77485664fdd7dcfa07420aa084d8b091a01d0016ba1d3ebbe5a415be00f63cc57cc500b70e91a70f420d8567b4309440eb487efcf1c595','GET /token/',1,'TOTP0001EFF5','totp','faltmann','defrealm','mariadb_resolver','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(246,'2024-07-26 13:45:05.957273','2024-07-26 13:45:05.829308','1970-01-01 00:00:00.127866','rsa_sha256_pss:5972b9a01ff16811612bc669770450920efaa86f33e316c9d065737282c9ee05374f98bbdb600210d623ebc02751f08807cca84a42a3aaa0956a1b4d7c607d584f91d29ccc9b226adb5258040292f7f034d243e11000be9475b0b68399c219d700a53ddcea5ce6d7ded8380359194fabdeaf583516919f3ab0de2f2dfbe1220e1afd3c86f520f9389381fa1a72781dd7f05d86695ca212bab0157a7adf1a72ba2ca321d38057671e1beaa7a914beb264d034ceabeb54f876c1fa88fe729bba6c8f01f8d7f9805156f29e0a98057aea9a6ca5dd019fa9fdc106e482c811ad2c387135c50f4b4f4df6771d24b42e96c9ee8b86a7b28c75cea161849ea8479bfba0','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(247,'2024-07-26 13:45:24.314975','2024-07-26 13:45:24.231898','1970-01-01 00:00:00.083023','rsa_sha256_pss:766e96971d634016b6b3f60412ab321420d11c28eb5e56da78509cb284f59662dccd6e6da027f6cc131cea24787a2f08891fc7d81ee55e7bef51bad006a411465895167aa5d3d64f8c610230e736cdbd4893167b00156cde5bf2cb41ab6ed4d66296bf480524dfe8756afc568987f335e459d5291b9caf2c15ef7fec6c5235d0d92b7938e262c00f0ff878018f1fe72d93e0cc337ff951da5f13d9a0fc02c7a551c9d56571dbf484d441c2b8c7b1aa95602f68aa79f94ec276bcc4315dd3128a743c770c12fcdaa4da348eeeace02e08fc607174e170a47359174c394fdd4862ee6ac6f022974707f9a0cf0ef74b8a87b15aa9845aaaa0090fdd9caa07adabce','GET /user/',1,NULL,NULL,NULL,NULL,NULL,'admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(248,'2024-07-26 13:45:24.494507','2024-07-26 13:45:24.341977','1970-01-01 00:00:00.152471','rsa_sha256_pss:56ddf59af65bcc73781fb612d147e1b7bfeb27b1541b343d6f39aee450a475d91fbe9898889e6e2df17c71dc7ad16276f1e5ef5f79ca1242993e25a0160a383c930f11a3f924b3c5f8e43830614411cd6b94a38719ccf5660c55625e70f447d0f39d99c02646c4dc96d4e1aecaaa4e2fb974690e215c4c030f89e31999007f6defc3df67fef32acf721142f223c78fb1d4d99617a2e9d48df052228b63d458e5ce8d0cf785f607b8bbfeaa07ad79e92e49103aef13f2f8c537c3f907334d0d31e851a514e62b47849e32885e4e000f726eef6017f5734272c7452aaeb1a5872cfbd9ca1435cf70f360afb88d05500477b622f9023e7529c3bab317b8af486bdf','GET /token/',1,NULL,NULL,'faltmann','defrealm','mariadb_resolver','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(249,'2024-07-26 13:45:36.069090','2024-07-26 13:45:35.958945','1970-01-01 00:00:00.110088','rsa_sha256_pss:1cd74c9a82a08614723d77254d290066f64d94b45f00123921d00e1da7c6a3232fb42189231c02348e51af7ccb6746413030789ca571c50d5f8ddff96a156a1c7e227809fda3fe52705b598a93e14f9d1853d82e5fec49594c0486190f47171be8a02cc0a63e323e26a85484b98baf0d8ffc7e191298ca12e114e382770d4c4a2d5fa84d1bfe1bc64b4701a653f0b7b327d309e08cee8258f8a84bfe710ee871826b1ea8a4957cf4daacd281b97c4850af3228aaf47282062e912c27e50246e36e37af316684c81404a5d65deaa8bad66adeeea4d689252c1f80e7b56ddd14978e6760629a627c140a511bd9dfda168baacf0dea89d9e84e6b9e7e1ba0aac474','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(250,'2024-07-26 13:45:36.076329','2024-07-26 13:45:35.958944','1970-01-01 00:00:00.117331','rsa_sha256_pss:461a367a69804115a80240b0bd31b247dcebf1838ab2131295fc853c704b34b441db804d12b9dfa265ee3409539db5ff9c6604c7ac93b4ad704076b54fbb583706c477f2d001223fa99dd8e65b0d95adc529a510ca9e6217f046793a568aadd3f2e8cf7fcb40661cd85f02a98e081ff3a0d692a3c5dca2fc23a85ed82dc6a083dc375b2ef6e65c6dcb767e3df39a61bb13ab0f6f05cce49ccaa50ea935d57c03a06c88167f30e66e1c6d72719bd7589c5ebc24d42dd93e61894a1c103462253eb30d801d5851f7856224d7a5de552613a5197933718816b985047c92c8c030d20a033ae24321511271f7ca276126f30d370c467c292dd680fac78701af3d2b26','GET /token/',1,'TOTP0001EFF5','totp','faltmann','defrealm','mariadb_resolver','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(251,'2024-07-26 13:45:38.430224','2024-07-26 13:45:38.293639','1970-01-01 00:00:00.136529','rsa_sha256_pss:8cc3c8cb6d1f751054cb1071531223f965c92458f0fb8d107089c8206276d9432fb595eefc7a032496d3b3ae68bb1db5b9e2e93a08338c80a6245f2ac04e95fba960f492045ee2cb7bb31d2638675b758a4f35a345cefbed5e953622a3e7f7762df4956649410dd73c57b7cf1bdbdec28f0fb19d5382f14a7782ea774681faf93c3998541157ca6e89413e7f54b315066cb2fc6dc3838ee084c2491d384dda98d42b92a5f42bf7aa02ca6578e8c3f7ec6590908bacab2d8a96cac636d18378742c5f57aaa494fa9fa40258ced529b44986ee846c9024012970bead41f452abd0260a32af5834acb66033165112822710887222a89a0d6268cdd129a895f57ae7','GET /user/',1,NULL,NULL,NULL,NULL,NULL,'admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(252,'2024-07-26 13:45:38.551675','2024-07-26 13:45:38.453199','1970-01-01 00:00:00.098410','rsa_sha256_pss:61fba857f7917e5ec22ea041939dc24480dd055181b03c21a4b08c143a14b2525a232cc80e6e2ae52e6ed3d48aa98a96bedd46494c853af8c0bd522f64eb5a432a903e68547b28bcca5875eabd084c2c33f72d31925212cb740a4df865d59639a54411b9a6ca2e94d118f147b5fdf8f5e8c0ea8d1d99a9077273a24100bd76e47ea24ae202c7700a2613af74ed704b0f1ae0bf1e754b039fbf77d5753da48c3ac5b0fdaffda41c21a1e2ffe1194d58acc792789439bc25c8d1defd69f2ed8cc1904269621e062206b7ce08aa57a63910b475217bd46f2e2ba1c663eb75e5685812cf68bf113ac9a30b2a52f861d742bb17b0f4595b8a492156949a78fde4bbe5','GET /token/',1,NULL,NULL,'autotester','defrealm','mariadb_resolver','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(253,'2024-07-26 13:45:52.108669','2024-07-26 13:45:52.024615','1970-01-01 00:00:00.083998','rsa_sha256_pss:94e02c868c283dded05dee95662efbe288324aba28d51511dbd61c8b37200671ecace7ceb1e4724a71221520c42f0384e5ae16b891b1559359ba3e1a39d1460220921b84f64f5fcb3cc829f2385c36a886b29481a0fd48ca44139d108b67fd9c609f3a7e711cd31f567aaa6fd372ad960447f13c5158e847d0982cc70d3fa0a836ca8dc1f261d425fa4b1711d7759f5adb18c1d6c00a9b7026e1993c49396456a416b8ba6e2d91d1efb5e81a0d4ec915e48217c990ca3170a0dcd745eb6d21ae972bef35258899cdd81f6de41bdfcb5028e0642bb587ee48f077169ab39de447f20a5edefd8384e49e2a33704d9c13b32cd4393529b0fd0a5b4401829101f812','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(254,'2024-07-26 13:45:52.223187','2024-07-26 13:45:52.134475','1970-01-01 00:00:00.088640','rsa_sha256_pss:532b7a5dfa8f098440a23aa5519af74c817542692113d1a5db59caf3082e70bfe79d5af3c77cbd577f6b54de9f99fc508f582ef9e107f227fe24154bb2ec397baeff672cba22280dfdc145bd118e967056a66376431e065e3e83c1089fba47025ed9db80fb95724dd5fe14a3137ee46eba3e07404f14b63e587a28de33ab2e48fa7670e0d00f26f7a70c0c44d1f427d9defc661a27cbc5da2395ffb39517f340c3ce6fd999fa91f557598861a75861713fb6aeced1395498b70606ac11ede902c8f31d583b2f14c4c2be20edc362b2e42d5dc4aebd545217e57949174840730d1eca4d525d1b6501cb4318515b21b8311f0a063a044f1d0997c4786fdf042d31','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(255,'2024-07-26 13:45:54.129476','2024-07-26 13:45:54.039399','1970-01-01 00:00:00.090017','rsa_sha256_pss:109b863fcbc72ae8319c3eaec8186bab0321df1d0fd59754de36f1cf9e83227c143534e63b09d98391756bc537c7fbf142bb14dde40ac5ee1fd3d5ac1692121b8bf69b78ae0c3f301389d1a748b894982260f3b17e6266f75d28e22338adeb5e3dfc7a4909b43d419d4afce691532362c131afb5edbc57b86301548a45726f52412fdeb9cbe885674a008a91a7c7da105cea86190e6c5fc74cc371dfe9bf35d5264f663f07800434711211bd7769033c7ec537b5398c48027acbc4837d4435491e765b85f3d189bffec457ad9685991a32237d833f98c918d99fd6593ec461b22e7e12e820307af33e699471cdf4b0498eb793ff32544cfd59f428bf34816ec6','GET /user/',1,NULL,NULL,'','defrealm','','admin','','realm: defrealm','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(256,'2024-07-26 13:45:57.540775','2024-07-26 13:45:57.452247','1970-01-01 00:00:00.088479','rsa_sha256_pss:943646da2b202c8584226147498146d696cda5e7e17345cd937f1dd68699d84956b83a308592fd5c6dd492983d9078e8892416938845faf005dced4c7620c579fc70e434ea7ccb0125d7045c2f4ec46d795fee10540020453f85ccf1f6bc8339d7d200ee5edfbc5632c47b66f2260cd598ceb86a565b9e5caa10899c8b9790e4996ce767fc26d0ae4814006be1a2fcbc8ccda041de074ba3c7a32c21fea75c183bd17a00db754a47553725d7769f484f9651ce9265dd98250dab462849e682227c5ea9f1081f723e37ff737c582539fe439ed4ef25c2f2c1449174aabb2b1eb178f7562210dbaad2662499024a1acdd5f964c87fee3c7a505b235736423a335f','GET /machine/',1,NULL,NULL,NULL,NULL,NULL,'admin','','hostname: None, ip: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(257,'2024-07-26 13:45:59.465917','2024-07-26 13:45:59.332183','1970-01-01 00:00:00.133676','rsa_sha256_pss:b023940e24d10c955c89d515981ddab8460256387b0d797b3ad53365ffff02ba7d6733b23b5a1e238181210d12d9d2372f55d658881863b369989023d0e23ad41f650063264542729ccbf0648c87ca343408ae20a4478050bde4048a763faf468bfb3f8eab680c75375412424eb1bd26664df456139f5e23798b435ec6c0a2b730f125e9ae2a2b83548c8fd601a225e87b65fd82d7aee1fa9ce6f8fcc6850038ad544ac5410f41b000d564304a2027279ea3b7617b9d12ff71a85a347c13b9303fd1b22bfc28f7c9ae3c4076a9f24772b44c2e71d2710a68ccc7f52d85d96e3633a2fa1b7c5ebe859cb63ffeb102f9edf7abdf4fc78f12f7d936244e2114a259','GET /realm/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(258,'2024-07-26 13:45:59.471270','2024-07-26 13:45:59.336106','1970-01-01 00:00:00.135092','rsa_sha256_pss:4fcf700d90c3e75079c66d28a59f2f78d92c70c33f633aed40e1ddc578ac5110666ac3912f2d4e2b8ce42b4016a2fc51fc04745f040ab5e0ebae75403546ec7c7210cc5d4be89c7713f3d2f655003d391a56f1e0cd3fd926403207d9e35510cfbf6c8e19a2768df5eca9bd22e741de696b573643688c7a079fa5ca487f4bfda59ba5185c74fe5261d2d4ee59ad51ee94784d59a738548daf693dfa6db509f137adc7ff4ede6e5c4e7f02d3e2b3bae1bb2deb0d1db2b8607e8b11f213d650167fdbe2ce59c05cdad69a22306968cd7705fc43ed41086e3983828de8918c5d74bf17d060b7eef55bc24911110796bb575ffe551be99c7e2a9725908a2df96e4f8a','GET /resolver/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(259,'2024-07-26 13:45:59.475484','2024-07-26 13:45:59.341963','1970-01-01 00:00:00.133441','rsa_sha256_pss:0c05af33d2ebe24f36d759577121b2e9b37f61aeb1d47c70c38a1a23d027709a93f99a9a9e38401d92bf6b32bf173a833a1ecc2407a8013e4aa02eaca208d99a978679e8aa76ae2380b12be33c7ff159c41a3dd73a2540a218195529aa390dd4ecbe9abcd15fee437b0011ac165774c55efb6d8922e3572797be603a78bf9e4e1a5f37172a09b43dbcd02af8e0faec03313a2524c8551c7076dbc1be193816b46945ff14195c0744c280b5e71f35c3ad7e859eec93c5b6de8a11409d3da2ef268bf8d52320f1046e8a59dd740803f1ae8480ede5f61d706a84cf1b5ad05077700ce48eda8c779981029a08d922597dfc8748ae38f3e2ab1b2c70f3cdcd2726b6','GET /smtpserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(260,'2024-07-26 13:45:59.490417','2024-07-26 13:45:59.363299','1970-01-01 00:00:00.127061','rsa_sha256_pss:9142b8b4cf8b27282379cc67a49886847bfcbc13b5a22aff944bf8286fa9f701bbe6d9899a1495bbeb7029da684c1eb7a8e711f1ca5142aa81346b691e4b79f11e96f12d1cf6011d279ec674f271d0747651a28b738742d9dc2502ada767bd79535ed454a7f202b707d7ab18685aa1c80fb1c37dda9af4f26f65d244437aef5b992f9fb44edff55612d9d40558d3bfac63296ada32eadf4ddf17bddfc2fc07634d2443d21fc9f93cc213297090d29b0f42c5adc1dcce0c6432c1689f817fd5b950ef52d0a7bab0c054ff73d39dd80c89d827690964e45bacf23d7e1eaa71249015037e5ebef893a444533be3bd2fccf2675398cf8887d9f1f358eafa35d2ad1e','GET /system/',1,NULL,NULL,NULL,NULL,NULL,'admin','',NULL,'a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(261,'2024-07-26 13:45:59.493855','2024-07-26 13:45:59.363086','1970-01-01 00:00:00.130706','rsa_sha256_pss:9fd3d7b635594d773d77894b169364ca981849d85058f30d232122aca03d8cc50e9eaa24dbaec2b67d8fd6a917d6651bcbf3d1d113f6e98a6c2e7d63b724aa994efea29a6d16992c181136ff66a6c6739481b4111bc123c78ed2006e85451a065f766ee2869f705708f2bc5991333d316f6327db42152fd73007ff3f01616fac6cd9479db9215f5abf12503a90fca0d54abbb5b956cf17bb7d8d3b40e8df4ff4b3470dcde0d2820baac82c217d21f98f03fa74dff66b68fd0d6fd0dbb5b7ea479bb1ce6529c41458f2ee6c2611b66148a3fae2cf83b7f2640c329fec029930df6917f9ea870fc9c81ec030a5b60745557b329f9af8db05326c58d13cf05c5709','GET /radiusserver/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(262,'2024-07-26 13:46:02.835587','2024-07-26 13:46:02.679988','1970-01-01 00:00:00.155548','rsa_sha256_pss:478f23a2a83b5257186a22972568fc6e32bbdb4cfb127e040d66d00a164ba291143add5be4214522f50bf7a4ae1181288daafdc9c7d208e3b4963f600916b4af6211dd13b7a8d02346ac5f81064491a893f1717a08156787b3b044b97a59cdf601d465e418675720e57c5eb1089c51ca373eba63f36ced398fa685a735afe3bb79fe155ba1be503a5ce0d34db7eb257318e82c9426dba4ca18c788b378d1b0e792ab4a74815f9fb06bb7a33653dc32dfe7c58d212677163baad92d00035dedd22512ab6bc9409ed694a324db5a2e9ddcc613eb889109cad01c3d5a7f54d3d4aad9b833bf3c8ac41f577ebe23c0c77cc1d33d360be3806e24147e9ba4c989515f','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(263,'2024-07-26 13:46:03.007879','2024-07-26 13:46:02.858200','1970-01-01 00:00:00.149595','rsa_sha256_pss:1647fec0b20fecdf159f9727e941eb858d20a3b1732c758b4c7893daf89e18164004a113993aabdeda3b4f6efd15f76c54f1a6a3070f48ab56614f6388e8eeef9957ce6c59f75fb4e29c2662cc5a8a7fa4c5580676748d32fcfc944ecd9c505bd3b77a7924db5f73414e222e4493712e4d60396f22b03f7fcae615e7f705a0c412f89d67cb9cb2434feec6342e19417ecbc9cffad356155bcbd4d393f37a5b939d5c383319e33daf11f7f2b9ac1a2f3c4c7f79ce816d025a6e1258fbbef234a5267b6b703d32811c784be1315d5ed6f608d42d00f5fc840fcd264408ba5b874c9b7f9ff0eb13ee55c87b462466289dc044c7a5b15963ed1e085b38d4f1f79230','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(264,'2024-07-26 13:46:04.933684','2024-07-26 13:46:04.847606','1970-01-01 00:00:00.086003','rsa_sha256_pss:5fd3740c29306c202832e4a3a78c5df0ebcde2840f867ddc4dfb12bc6de76d832cf940aac782e948b0006dc8f2689d0a27300244b4ffeb0a68c44dd8e0a909aacaa81515f5e7daf5e8e24ba7caafe11a7d6feb3f83c55bdd1b1eaa1c6da12d871cd072bd7a89c29e493df65fcb7bd0bc30c3fc4de12aecf81cba43bbc7b863b06e5ddc9ea7ca535b1a05c403e038be5ace2e5f5f978224e9d6916a0d8bd1ad4cbd0ed07ad4c362c1715ebaf62f7f75c481c39c064801a422fe4ee560edca6218f59ccd8ba123f014097e63e72dceaa21a9d1cdbb3e7153f53ffadc09a0f42d4df524545f61f42167b31d97a3c73cd68f39c2648765056b31037db336945ac796','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(265,'2024-07-26 13:46:04.936405','2024-07-26 13:46:04.847498','1970-01-01 00:00:00.088842','rsa_sha256_pss:6025305a551694b54a65eb8a789e5aeb7cb700c3226e7aaf53789908062edb6160e29f903e64cca0afbadab1ebcbdd896eba9189508012ba494c3ad9f364b0912507f6ade81ad1698fa6e129664d7480c3706b643c99289a6fe1aab44313e310d7f9f8f49c7c1a27aa6d8f83d30b582b9c745dc5aa1da84d7625b3ebed01620dd6d6ae2f8258a1560fd39d655e2fc07a189d82324fc70afacbb783f68729a37e0cfac9f70dc300529c1ffddd50d3780e061ebd34939b64d42bfc0f36d8b2ac334cf3ede26a2795301082f45be94dcb1409e6da6a632290025beb5007fe632b4ab7f8578ef709df5f4222aaf38124f7403effbf328ed9e4962589d8be6cf2a393','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(266,'2024-07-26 13:46:05.039912','2024-07-26 13:46:04.953307','1970-01-01 00:00:00.086521','rsa_sha256_pss:33dbf3151bc024d301e2e549aec164e9a733433ea2792d90d92ca848beb50200ef2abd77965b4bd4e1d09c7da25361b76a4c4d8751a88eb669129c617a2de102839946ee729d9b84e651086c83d00d0b850788388daf59361d697c08760e735f662a0ae1e7207656118b4185cfdecc033e3e70ee815c49afb3c1e8bb6125c442618cca65bc9ff60e32d3e927b4831e3df22db2654010a72d2a41062da544b77d4298d68d4bb395f203c299cc19e152c5f56809d51041aebdaafafa86f1ed206b39226161c4e69b78934167d166cc2eb9c08b5ff564d74b2b6425bf0dd0c81db6f532dfd497ec2a4e975d4f7f24c56241434500e17a9f325eacd21b81cc253ee2','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(267,'2024-07-26 13:46:05.088046','2024-07-26 13:46:04.956807','1970-01-01 00:00:00.131184','rsa_sha256_pss:6b584439960bb797ef7cd541aac0939703cb7cf321140b0f6547d9f219411034c3e4137ebda9324d7e5433f0f4be2fe7338e4b8e031a96937e1ab8127fc87b25d644f9cdab3d96c9e41ca6adc8b08407cf2117c398515c81740a84125bf685af3b3cd55024d8386103f1768e44872a50fcdb280415e146293b6bd9ecf7b53ee9a2178b5c000aa8a3f357226b4bece65c263f2fcd285507238121ca0ba6490c384792899bf2a15484850c3e5884edd96cb215076cb29d89f034aef266d4c49b8bb6dbe1d710d4f61137b4a2653ed70e3791aedd2c01428442586890a996b140940bf938a3aac035c96e7e195339f6996dd2e450bfcc5008b28838ad395e2fe902','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(268,'2024-07-26 13:46:05.940626','2024-07-26 13:46:05.835955','1970-01-01 00:00:00.104591','rsa_sha256_pss:6a2ebde8b918be5912eb9ae17f0cc292225934816bbd9b20edc046753e63a043cdca6030e3f02fd050e3ea25e9b8178fd2f6cef4bd0b3878c8c72279ff804f2af54424a575a634fb0529fc0348187c8ca48c081b333e31b72d613d648928dedc1cfbffd5ed01b0e6ec0dfb37153f688fd585a6b2c4b3a178423953cb39190e311e29f73f1b19180bd470ec3753640439a2e11e2953ebdc80001b5e726be06d568ce0dfa1741139e393cb64e3107a286a442cb8ea26181956d4aa992fd2b23f8109fcd1c895e15941da859e914c5522550e94bc31acdb3fa74fcada6397fa0053b7befcd625fa600e3dcdfd822beba5b2c554c50f64a0fcfb2a0a83da90587a80','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(269,'2024-07-26 13:46:05.951237','2024-07-26 13:46:05.835037','1970-01-01 00:00:00.116145','rsa_sha256_pss:9d0aa4a22bd4ee7672be4b7368bc9079d2116a282e4671f20f05d04cfd124ff2bb622131cbe58b21e663addbc7ac5e358b5497d82a0f65c183b3955773861795d0b41ba7d8b6af3ce8f45d5d1c50d5662e43d4f546066c6606573031d0c3697942b49973be7c241756b5342a9e6d095472eb1b1975a64404566235118662ac1f8119aafac6d981f052311b00a1bf37cdbad57d9e13d0bd21172bdc977649528a62ff83dcda4b6895fe107d5c4d9d39e0436532a8740576018be420df4c329fbf2a94c40e8495d3b6196ac1d382fffa8a76e0d114a8d79a11a5dda94fd906e33be09c8b5f93a26894a8b406a01ae1ea5dfb32466e9cb48d4d620c7e3c3d2fd1ed','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(270,'2024-07-26 13:46:06.057652','2024-07-26 13:46:05.962429','1970-01-01 00:00:00.095153','rsa_sha256_pss:5a004d0c78a2f91302a4893acfc10f30396935125c22782f3be6e60774ccfb64600a9248aaa211bd86512fee6b4ba60267110113394f6f7ea971bf77156defd4a1ba2cb52bad7f29831c723844136c77183d858380ea50ba8791f92363e7489b9b89a1288fcfd005865a30a77fa3ab1b775388c3c20ab6becaa1ff62da62dd1abb45b3438d40fc0de3ca230df230396aeabe2ca4e83d427a7c79088f5f8267411467bc8842aac92fbcce39cc8e709833372418badc1e47cf2fd82c4f810773303124fb777e0412bceb21c840b9bb5bd7aebfb905217685f71bb30da841ca86351d8c6c9e8028472c8c410e9f7227e21f58e98bf8e54e48c3215997979df3ad38','GET /client/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(271,'2024-07-26 13:46:06.069049','2024-07-26 13:46:05.971874','1970-01-01 00:00:00.097121','rsa_sha256_pss:29f8fb160516918974ef5365666c11860498818e6f222919d31f499b4847584b1fc9bf3bff6f8e1454e5ab2b336674e0e47c308cf21740a900a636f82da79dbb70e80bc2d13d39636d63eac45fed3e1b3fc494cab4b0b02cd2436355306b4f6462073bc21590aa56e6a8b31582b5231d93e9d6029f811556aebf247a98e7baf9c6c04587b7c0446cb7dd610602ec17c8145b0dfd420c36b3bbe1a284b92098480383ec72f89118046c0b9a5545997851086f8926267e25893782891ecd6295eb901721be239e270d8b04095b4709da8ac0c7869279b5b0409bdffeadcf0b7857a8551131efe680527f1d556554adf9aed9455b6d3e9272d1120a9cf183f114e1','GET /subscriptions/',1,NULL,NULL,NULL,NULL,NULL,'admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(272,'2024-07-26 13:46:06.092545','2024-07-26 13:46:05.894705','1970-01-01 00:00:00.197764','rsa_sha256_pss:9938b8e506b09410e3bf6bdd4c1130892f412e9d0e4e5dd146bed4274c15ae92348d86cbb521377a162c64a20b2d7e672a342555a6a509da4cf2b3a963be0c0e8f345cf12fc7b03d7ce8df12c2b168140018511214235c475cc12f268f3a13ba60b61cf86c705430368b46cd7af3f4762f3fdfcaefdabac1f9da0ae4ef97f6745241e6144e4248484421a5fc927b113c177459e49fef71dd292bc62468544fd785b130ef2ac9a1312d3847d07679e7415da6e5e36320e018dd5a1f882f5acf6f5aa47254b6f07f9532065aff77caab3177f1e3217ea04b072a59fde55eab4ce3bfd8115287f311a48dea671dcca3200e695925d101a5142bd06ad8503179fae0','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(273,'2024-07-26 13:46:06.265777','2024-07-26 13:46:06.109890','1970-01-01 00:00:00.155835','rsa_sha256_pss:3495c8063e3811c9938e5ef82f29032a71fbc0e9d6bdd8c5bda5313c43b4b6fe7c9cbc7c9c2215557a5f4648ae81b9257c7dd8bbe0c3cd8dbe1bb6eac55dfcc9e10ff9e1f2304daf2c558519744ce194c4dea72551567134a4bda28fdf9f244affc4ea70c744e8859a54dec1687f080d9ed5312e5e29ef66d9a87ee3e61584b6be045dfa8c6f94267e817f201ff9679beee338d7b5a2e972d28996dc6eb1115ccb1aef610162b3936622277ae648f151a19ead3d5d1d5a09c91751ee6c8934a774b9166a864d04eb02736e978b7521332895723966ec626b9d0677b622452541af61600fbb2ed1f1ea04a83ab16a9c2421fdc4b24c0b94631b96bf0e4629ed7a','GET /audit/',1,'**',NULL,'**','**','','admin','','','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(274,'2024-07-26 13:46:07.255634','2024-07-26 13:46:07.128867','1970-01-01 00:00:00.126707','rsa_sha256_pss:78baec3064105a42b01a4a6df4488a811a35f961f0a8586ecdf8f318a441aea3e3da921f4fab3181cebc25cd2a686c610902aac58222cfc6ca240d6fc85c4c78955df5218ca72995c9df88f5305b3455f541b520ade0a93aba87129f181f572d6267eea3c1fcb1b58fa9941459e279c0b9ac18a76a4905d4784fce8c7d0b95660727d37d27aa3e271d62c55ad791f2faa4fc28a2cd176ee6e3ed9bb764747bec38362c076f7e876dbaa0a8a69b65ebea39a2d20cb37f10cf516d4580c15d98ab1b9fe5e480338da50487209e9dbf434ec7c0920bb7034e45844a75bb3239211600036b381a02b07b36cb11af2cc488b711317ef03530bfbc9563b22e1ecf2a96','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(275,'2024-07-26 13:46:07.280215','2024-07-26 13:46:07.139773','1970-01-01 00:00:00.140385','rsa_sha256_pss:3d49324189500c8d905ef62ba0400a4843553b0968ab54a94b6812402a388b0fd262925bb02ff04901150da4214bf45b6e8b736eb662a22e01cce3dfcc2aeca2b02e2f3b1feaba011c0d05abf3d02c3ccedebb631ecb030eadb45acbc58badd328a5d9c2fece4fa5b5c050fe3860b26574077d9076ea6b4935e1fd97cdc6de0a89bb8e8fb7bc7e6c37f09975438bbae4304503313f2b5211524359d5e2694ece3aba2cb09e9372869cf3880cc8ecaacc73fb689bb4aedf3d3ae1ac0546b1b038da38aeaf2137c1a8f7d7285bedf63639062573cc700fd4f9fee717775da558e49cc1f855b35c381330a8e1fcc5f75053c178fd5ff08e138e98f20cf282c827e5','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(276,'2024-07-26 13:46:36.172601','2024-07-26 13:46:35.948081','1970-01-01 00:00:00.224414','rsa_sha256_pss:9645d083fd68064f3f4a6d61d69c39c7813461005e64a77b6c8367072500a2be99732485737bc30fc4de59bb857d185e91170c2c78fccdd16e419a2d0587b3a4f92406567437d37d9677564e0f460acfb331904fc5621af32ec305376de6d465b3d35770a49505839103e0d2271687d464a540c3c1ea84cf09c3fb13210d2d77f35a285ffdd839196366498036bca1df66e7672e53cc9772c1d07a7dbbcc20b2ccd6a0c3e5cae06aa5516d3474b5b6df4fc17bf649242a9030cd58547876d31c26422e2235c0c836f872f214795732368c4e105f7042d813d404ffde4b36b561a5d3011d898bd20f03ef30285707e3bf81d2c3e27b369b7994d20d712e655898','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(277,'2024-07-26 13:46:36.229703','2024-07-26 13:46:35.960012','1970-01-01 00:00:00.269633','rsa_sha256_pss:75d6ba3655fd8c344822cd941637cc8d815b88776d7dafe6e7c374d122cf81769f1a56dd9cbfd96ca2d728d6417283b33133998f384d15dc709bafef303e70807757e293b7b10d5e388c87fe974d64cb4f41488ac346287cf9c0147f042e7ef7cc545c114df3b92babed706c27387dfcbaaad072c09f0c361c9d68b41edbefd698bee483bc9674d66fecdd80ddd555f7e9bb0589974e7c0124d8431b897e33c2cc80c7c288ed08768376979356dc943545a9c603f6cc046fa971d3885f785942d6f12842016de6c9bb4f8862588253131cd4ff65778336fc68cd755400fa118da73bc95b61ecfd0c651553de7f08fbf46c54ee73ccd72305624581c9082e70ac','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(278,'2024-07-26 13:47:06.061480','2024-07-26 13:47:05.955260','1970-01-01 00:00:00.106166','rsa_sha256_pss:0cbf2688ccade3033686a8b9d0f27fe68b37ab59f9686b0c4c2406eb0a8cdc1d169b1846f5e5a65747006b8c7779b10465ce54cbf6b41af3c381d7eeb9450ec75570df4d1cec272847a190249929a15efc7040beeb645fa95fb12c347824ac4c6bf9899354e68ea979fc814af92d35a364f2cdcc189180783342ff1eaad02ca517c075d412eeead4ae9425b6194cf471072568bd78174ec3b0b13a08dae7e9e5353f9cca85c846dfb7606a49e880e79853b649170433ca4c537554c9a70f44c689bfcbfdf1189693bed92530c61d12159b1de15d6adca081979df68dde9c378d5e4aec109cfb752477297acf8930da7ae960e23a55da9eb30d22051f2e533f2d','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(279,'2024-07-26 13:48:27.060088','2024-07-26 13:48:26.956595','1970-01-01 00:00:00.103439','rsa_sha256_pss:2f98a34019d1c6b7849cca4d778efa77eea544529a0e40bfd4a8bdacfbfb17bb32f18962a64de17d3337ab1aa8a84ae346abae6939aba19a7e86cb37053ebca837acd6be62a19ba2727a35526ad393fdf8716a71f0b914fb551f61470545f3463e99626a897cbe897878d5169f41c212a1fa18953ba1afd0200396f9f723c6bc686c5b58ff6a2677c0fd35685d917dbe9bbab3c61fa0e4e2c88e741709cc1913b86d2c747499c8991ff19ff9d75f81f96c1c13d3a145f428e2beca6ab3829d13e22289bb9360173059005e5fd119e358d06fe144059b496c46b1b51975da6ffac56de1d51192cb8814fe1b06da743d48190eef374451bdb36c878baf779076db','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(280,'2024-07-26 13:49:27.070037','2024-07-26 13:49:26.943811','1970-01-01 00:00:00.126119','rsa_sha256_pss:3b848f27ae103c0699c388ca64841d018f8aaab67cded55dd17d3c305925f1133199f095a126714cb98310c32dfac759268a2990dc7a73b36b6f42b5b248ad6109030c3596d77a0936c773a3f4868ccb262f9bbb218760e38743fb91f2e553e1e3326a659b8fae36ba86ee594d44542fd9a2a68bb1fbb0cbffd77b8c58b9064757c2b0bff8059aa27cb81d023322669e45c459ae2e58439ca23f04d26e4e1425fc43d18c38d2cfd030e218fa608438d04325781e32c1b39919f1f4170768ca1ed36e4465f5f91b9c0879b9799dde63a810aab9402f70f0b545a334b16ef61cd11c614aa481c294dc9e3b91fc39221760e3602f6d604851a2e25bf53724b3a7be','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(281,'2024-07-26 13:50:27.058717','2024-07-26 13:50:26.946043','1970-01-01 00:00:00.112615','rsa_sha256_pss:6cd92f25a8f8e8fb1e6520920bb96bd19dc90542941da1e3ee728c5114811ac41aa4c69a92ad5beaafb526bf99130d57aeca837ae726b7053c5ce7918ea9be967eb8d44b35a96b7256065fbce08cd5cd16f06af619a6d72e11d38c2f33661f8860cc2e9aaa7cb37068ca2b997c0a1d495b1d13aaadd4ec1f981967972f5d3880b5ba04d33e989ce6d5f5a5bf80704c7f251d584ec4854bb30ccb06fff37a7af5ca6fa179cea8f560b64c8c651f89dd518ef8e373044371459cbcfa1a55bd1842a2dde52e8ef43ce4e13395a5a52fc1a7c0ca161168376f1649307024dd7eb2a2574b96fda819c06a979f2810d463267d6eb59ac192e7f195a3338f40b2ff47db','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(282,'2024-07-26 13:51:27.064711','2024-07-26 13:51:26.958152','1970-01-01 00:00:00.106502','rsa_sha256_pss:714fdb8a6ac419f0aefeac1d43da442a9fe226a21a56cf21e48a1bee2eda019a877d64d62fa0adcdef726f9efa66a43f55335d0ff173ae3f27e6b49706d0159b83d35f558714cce989e3ead367419ccc1df74f5e9db3eaeae8ef3b36b6212b6f038e56e6441e267273b71a988fa760247726be935dec0876e453a913390102eda2e33d53506793727656715fd0e633f68ef3b1f0a2bdf17b95bfa481ec0e717d3fa56fea9f84abea2b9fd7b234aa0604748d226e81d1b394097afb08ca19ef448be7fb92afd47b60f986b15a65eeffde91b6e2b5820fe27dccb89332041ca3bf6d9ca17e2a51c8f7af5defec47cbcf6a113561462f75e471867925d870b09bbd','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL),
(283,'2024-07-26 13:51:45.560613','2024-07-26 13:51:45.447465','1970-01-01 00:00:00.113094','rsa_sha256_pss:4dd69ff47abe2192a79e15ec4bdf12ced88ea5b27b735bbd55ad603e71ac3e02d34f4c4fd270cfae0c749ce4b790969eb75fd2e58f85acc75cdd4d1216e90ba482be86e3f758a14e07c233298abf25ef2adfeee67d160552880bdc9ccc7a1581b44ab5e6232dfe5e0d15ebbdd1c7d6793377e467448ba73ebb939d056a6935d626aa2d64e29567a4324e710b554985eee5873c1e201d7e3f6796419ce86d3ccb8e07df211e641272a39e8d3358c9bcc6f67aae52ead1ed0331669afae38182e3528a2595915822d4b3f0b38ad63adb361189904615b1930ddbf77d4acfdcdbee3b8bb036c36546817d624b47741df38a0a1a231895e0847850fa3343465dbce5','GET /token/',1,'**',NULL,NULL,NULL,'**','admin','','realm: None','a6af45bbb203','192.168.128.1',NULL,NULL,'139728516184960',NULL);
/*!40000 ALTER TABLE `pidea_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `policy`
--

DROP TABLE IF EXISTS `policy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `policy` (
  `id` int(11) NOT NULL,
  `active` tinyint(1) DEFAULT NULL,
  `check_all_resolvers` tinyint(1) DEFAULT NULL,
  `name` varchar(64) NOT NULL,
  `scope` varchar(32) NOT NULL,
  `action` varchar(2000) DEFAULT NULL,
  `realm` varchar(256) DEFAULT NULL,
  `adminrealm` varchar(256) DEFAULT NULL,
  `adminuser` varchar(256) DEFAULT NULL,
  `resolver` varchar(256) DEFAULT NULL,
  `pinode` varchar(256) DEFAULT NULL,
  `user` varchar(256) DEFAULT NULL,
  `client` varchar(256) DEFAULT NULL,
  `time` varchar(64) DEFAULT NULL,
  `priority` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policy`
--

LOCK TABLES `policy` WRITE;
/*!40000 ALTER TABLE `policy` DISABLE KEYS */;
/*!40000 ALTER TABLE `policy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `policycondition`
--

DROP TABLE IF EXISTS `policycondition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `policycondition` (
  `id` int(11) NOT NULL,
  `policy_id` int(11) NOT NULL,
  `section` varchar(255) NOT NULL,
  `Key` varchar(255) NOT NULL,
  `comparator` varchar(255) NOT NULL,
  `Value` varchar(2000) NOT NULL,
  `active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `policy_id` (`policy_id`),
  CONSTRAINT `policycondition_ibfk_1` FOREIGN KEY (`policy_id`) REFERENCES `policy` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policycondition`
--

LOCK TABLES `policycondition` WRITE;
/*!40000 ALTER TABLE `policycondition` DISABLE KEYS */;
/*!40000 ALTER TABLE `policycondition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `privacyideaserver`
--

DROP TABLE IF EXISTS `privacyideaserver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `privacyideaserver` (
  `id` int(11) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `tls` tinyint(1) DEFAULT NULL,
  `description` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `privacyideaserver`
--

LOCK TABLES `privacyideaserver` WRITE;
/*!40000 ALTER TABLE `privacyideaserver` DISABLE KEYS */;
/*!40000 ALTER TABLE `privacyideaserver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `radiusserver`
--

DROP TABLE IF EXISTS `radiusserver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `radiusserver` (
  `id` int(11) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `server` varchar(255) NOT NULL,
  `port` int(11) DEFAULT NULL,
  `secret` varchar(255) DEFAULT NULL,
  `dictionary` varchar(255) DEFAULT NULL,
  `description` varchar(2000) DEFAULT NULL,
  `timeout` int(11) DEFAULT NULL,
  `retries` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `radiusserver`
--

LOCK TABLES `radiusserver` WRITE;
/*!40000 ALTER TABLE `radiusserver` DISABLE KEYS */;
/*!40000 ALTER TABLE `radiusserver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `realm`
--

DROP TABLE IF EXISTS `realm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `realm` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `default` tinyint(1) DEFAULT NULL,
  `option` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `realm`
--

LOCK TABLES `realm` WRITE;
/*!40000 ALTER TABLE `realm` DISABLE KEYS */;
INSERT INTO `realm` VALUES
(1,'defrealm',1,'');
/*!40000 ALTER TABLE `realm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resolver`
--

DROP TABLE IF EXISTS `resolver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resolver` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rtype` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resolver`
--

LOCK TABLES `resolver` WRITE;
/*!40000 ALTER TABLE `resolver` DISABLE KEYS */;
INSERT INTO `resolver` VALUES
(1,'deflocal','passwdresolver'),
(2,'mariadb_resolver','sqlresolver');
/*!40000 ALTER TABLE `resolver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resolverconfig`
--

DROP TABLE IF EXISTS `resolverconfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resolverconfig` (
  `id` int(11) NOT NULL,
  `resolver_id` int(11) DEFAULT NULL,
  `Key` varchar(255) NOT NULL,
  `Value` varchar(2000) DEFAULT NULL,
  `Type` varchar(2000) DEFAULT NULL,
  `Description` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rcix_2` (`resolver_id`,`Key`),
  CONSTRAINT `resolverconfig_ibfk_1` FOREIGN KEY (`resolver_id`) REFERENCES `resolver` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resolverconfig`
--

LOCK TABLES `resolverconfig` WRITE;
/*!40000 ALTER TABLE `resolverconfig` DISABLE KEYS */;
INSERT INTO `resolverconfig` VALUES
(1,1,'filename','/etc/passwd','',''),
(2,2,'Server','mariadb','string',''),
(3,2,'Driver','mysql+pymysql','string',''),
(4,2,'Port','3306','int',''),
(5,2,'Database','ducsxqm001','string',''),
(6,2,'User','admin','string',''),
(7,2,'Password','ec3af8d866e2795aeb737a197c110014:d2f22c2249998099901c70b20e1db865','password',''),
(8,2,'Editable','True','int',''),
(9,2,'Password_Hash_Type','SSHA256','string',''),
(10,2,'Table','users','string',''),
(11,2,'Limit','5000','int',''),
(12,2,'Map','{ \"userid\" : \"userid\", \"username\": \"username\"}','string','');
/*!40000 ALTER TABLE `resolverconfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resolverrealm`
--

DROP TABLE IF EXISTS `resolverrealm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resolverrealm` (
  `id` int(11) NOT NULL,
  `resolver_id` int(11) DEFAULT NULL,
  `realm_id` int(11) DEFAULT NULL,
  `priority` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rrix_2` (`resolver_id`,`realm_id`),
  KEY `realm_id` (`realm_id`),
  CONSTRAINT `resolverrealm_ibfk_1` FOREIGN KEY (`resolver_id`) REFERENCES `resolver` (`id`),
  CONSTRAINT `resolverrealm_ibfk_2` FOREIGN KEY (`realm_id`) REFERENCES `realm` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resolverrealm`
--

LOCK TABLES `resolverrealm` WRITE;
/*!40000 ALTER TABLE `resolverrealm` DISABLE KEYS */;
INSERT INTO `resolverrealm` VALUES
(2,1,1,2),
(3,2,1,1);
/*!40000 ALTER TABLE `resolverrealm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `serviceid`
--

DROP TABLE IF EXISTS `serviceid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `serviceid` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `Description` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `serviceid`
--

LOCK TABLES `serviceid` WRITE;
/*!40000 ALTER TABLE `serviceid` DISABLE KEYS */;
/*!40000 ALTER TABLE `serviceid` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smsgateway`
--

DROP TABLE IF EXISTS `smsgateway`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `smsgateway` (
  `id` int(11) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `description` varchar(1024) DEFAULT NULL,
  `providermodule` varchar(1024) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smsgateway`
--

LOCK TABLES `smsgateway` WRITE;
/*!40000 ALTER TABLE `smsgateway` DISABLE KEYS */;
/*!40000 ALTER TABLE `smsgateway` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smsgatewayoption`
--

DROP TABLE IF EXISTS `smsgatewayoption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `smsgatewayoption` (
  `id` int(11) NOT NULL,
  `Key` varchar(255) NOT NULL,
  `Value` text DEFAULT NULL,
  `Type` varchar(100) DEFAULT NULL,
  `gateway_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sgix_1` (`gateway_id`,`Key`,`Type`),
  KEY `ix_smsgatewayoption_gateway_id` (`gateway_id`),
  CONSTRAINT `smsgatewayoption_ibfk_1` FOREIGN KEY (`gateway_id`) REFERENCES `smsgateway` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smsgatewayoption`
--

LOCK TABLES `smsgatewayoption` WRITE;
/*!40000 ALTER TABLE `smsgatewayoption` DISABLE KEYS */;
/*!40000 ALTER TABLE `smsgatewayoption` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smtpserver`
--

DROP TABLE IF EXISTS `smtpserver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `smtpserver` (
  `id` int(11) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `server` varchar(255) NOT NULL,
  `port` int(11) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `sender` varchar(255) DEFAULT NULL,
  `tls` tinyint(1) DEFAULT NULL,
  `description` varchar(2000) DEFAULT NULL,
  `timeout` int(11) DEFAULT NULL,
  `enqueue_job` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smtpserver`
--

LOCK TABLES `smtpserver` WRITE;
/*!40000 ALTER TABLE `smtpserver` DISABLE KEYS */;
/*!40000 ALTER TABLE `smtpserver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription`
--

DROP TABLE IF EXISTS `subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription` (
  `id` int(11) NOT NULL,
  `application` varchar(80) DEFAULT NULL,
  `for_name` varchar(80) NOT NULL,
  `for_address` varchar(128) DEFAULT NULL,
  `for_email` varchar(128) NOT NULL,
  `for_phone` varchar(50) NOT NULL,
  `for_url` varchar(80) DEFAULT NULL,
  `for_comment` varchar(255) DEFAULT NULL,
  `by_name` varchar(50) NOT NULL,
  `by_email` varchar(128) NOT NULL,
  `by_address` varchar(128) DEFAULT NULL,
  `by_phone` varchar(50) DEFAULT NULL,
  `by_url` varchar(80) DEFAULT NULL,
  `date_from` datetime(6) DEFAULT NULL,
  `date_till` datetime(6) DEFAULT NULL,
  `num_users` int(11) DEFAULT NULL,
  `num_tokens` int(11) DEFAULT NULL,
  `num_clients` int(11) DEFAULT NULL,
  `level` varchar(80) DEFAULT NULL,
  `signature` varchar(640) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_subscription_application` (`application`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription`
--

LOCK TABLES `subscription` WRITE;
/*!40000 ALTER TABLE `subscription` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token`
--

DROP TABLE IF EXISTS `token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `token` (
  `id` int(11) NOT NULL,
  `description` varchar(80) DEFAULT NULL,
  `serial` varchar(40) NOT NULL,
  `tokentype` varchar(30) DEFAULT NULL,
  `user_pin` varchar(512) DEFAULT NULL,
  `user_pin_iv` varchar(32) DEFAULT NULL,
  `so_pin` varchar(512) DEFAULT NULL,
  `so_pin_iv` varchar(32) DEFAULT NULL,
  `pin_seed` varchar(32) DEFAULT NULL,
  `otplen` int(11) DEFAULT NULL,
  `pin_hash` varchar(512) DEFAULT NULL,
  `key_enc` varchar(2800) DEFAULT NULL,
  `key_iv` varchar(32) DEFAULT NULL,
  `maxfail` int(11) DEFAULT NULL,
  `active` tinyint(1) NOT NULL,
  `revoked` tinyint(1) DEFAULT NULL,
  `locked` tinyint(1) DEFAULT NULL,
  `failcount` int(11) DEFAULT NULL,
  `count` int(11) DEFAULT NULL,
  `count_window` int(11) DEFAULT NULL,
  `sync_window` int(11) DEFAULT NULL,
  `rollout_state` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_token_serial` (`serial`),
  KEY `ix_token_tokentype` (`tokentype`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token`
--

LOCK TABLES `token` WRITE;
/*!40000 ALTER TABLE `token` DISABLE KEYS */;
INSERT INTO `token` VALUES
(1,'Description of the token','TOTP0000D0CA','totp','','','','','',6,'','616d155aa45fd15aa58501057044258272134bbac3be6600c20a1b67579afc1c9411266b54e9f4317cd7c0162f1b6cb6','c043bcbd75d5b438988ec8becdfaa916',10,1,0,0,0,0,10,1000,''),
(2,'Description of the token','TOTP0001EFF5','totp','','','','','',6,'','fa47b29c16dbd6459bfadff5afea7d40bc612506c5173c2589558b461a22da0a390502e247bedad9a5dc928256dcd2dc','5f9a4a3d2c5dfa1c8ffb7190f089790a',10,1,0,0,0,0,10,1000,'');
/*!40000 ALTER TABLE `token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tokengroup`
--

DROP TABLE IF EXISTS `tokengroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tokengroup` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `Description` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokengroup`
--

LOCK TABLES `tokengroup` WRITE;
/*!40000 ALTER TABLE `tokengroup` DISABLE KEYS */;
/*!40000 ALTER TABLE `tokengroup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tokeninfo`
--

DROP TABLE IF EXISTS `tokeninfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tokeninfo` (
  `id` int(11) NOT NULL,
  `Key` varchar(255) NOT NULL,
  `Value` text DEFAULT NULL,
  `Type` varchar(100) DEFAULT NULL,
  `Description` varchar(2000) DEFAULT NULL,
  `token_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tiix_2` (`token_id`,`Key`),
  KEY `ix_tokeninfo_token_id` (`token_id`),
  CONSTRAINT `tokeninfo_ibfk_1` FOREIGN KEY (`token_id`) REFERENCES `token` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokeninfo`
--

LOCK TABLES `tokeninfo` WRITE;
/*!40000 ALTER TABLE `tokeninfo` DISABLE KEYS */;
INSERT INTO `tokeninfo` VALUES
(1,'tokenkind','software','','',1),
(2,'hashlib','sha1',NULL,NULL,1),
(3,'timeWindow','180','','',1),
(4,'timeShift','0.0','','',1),
(5,'timeStep','30','','',1),
(6,'tokenkind','hardware','','',2),
(7,'hashlib','sha1',NULL,NULL,2),
(8,'timeWindow','180','','',2),
(9,'timeShift','0.0','','',2),
(10,'timeStep','30','','',2);
/*!40000 ALTER TABLE `tokeninfo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tokenowner`
--

DROP TABLE IF EXISTS `tokenowner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tokenowner` (
  `id` int(11) NOT NULL,
  `token_id` int(11) DEFAULT NULL,
  `resolver` varchar(120) DEFAULT NULL,
  `user_id` varchar(320) DEFAULT NULL,
  `realm_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `token_id` (`token_id`),
  KEY `realm_id` (`realm_id`),
  KEY `ix_tokenowner_resolver` (`resolver`),
  KEY `ix_tokenowner_user_id` (`user_id`),
  CONSTRAINT `tokenowner_ibfk_1` FOREIGN KEY (`token_id`) REFERENCES `token` (`id`),
  CONSTRAINT `tokenowner_ibfk_2` FOREIGN KEY (`realm_id`) REFERENCES `realm` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokenowner`
--

LOCK TABLES `tokenowner` WRITE;
/*!40000 ALTER TABLE `tokenowner` DISABLE KEYS */;
INSERT INTO `tokenowner` VALUES
(1,1,'mariadb_resolver','1',1),
(2,2,'mariadb_resolver','2',1);
/*!40000 ALTER TABLE `tokenowner` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tokenrealm`
--

DROP TABLE IF EXISTS `tokenrealm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tokenrealm` (
  `id` int(11) NOT NULL,
  `token_id` int(11) DEFAULT NULL,
  `realm_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trix_2` (`token_id`,`realm_id`),
  KEY `realm_id` (`realm_id`),
  CONSTRAINT `tokenrealm_ibfk_1` FOREIGN KEY (`token_id`) REFERENCES `token` (`id`),
  CONSTRAINT `tokenrealm_ibfk_2` FOREIGN KEY (`realm_id`) REFERENCES `realm` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokenrealm`
--

LOCK TABLES `tokenrealm` WRITE;
/*!40000 ALTER TABLE `tokenrealm` DISABLE KEYS */;
INSERT INTO `tokenrealm` VALUES
(2,1,1),
(4,2,1);
/*!40000 ALTER TABLE `tokenrealm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tokentokengroup`
--

DROP TABLE IF EXISTS `tokentokengroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tokentokengroup` (
  `id` int(11) NOT NULL,
  `token_id` int(11) DEFAULT NULL,
  `tokengroup_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ttgix_2` (`token_id`,`tokengroup_id`),
  KEY `tokengroup_id` (`tokengroup_id`),
  CONSTRAINT `tokentokengroup_ibfk_1` FOREIGN KEY (`token_id`) REFERENCES `token` (`id`),
  CONSTRAINT `tokentokengroup_ibfk_2` FOREIGN KEY (`tokengroup_id`) REFERENCES `tokengroup` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokentokengroup`
--

LOCK TABLES `tokentokengroup` WRITE;
/*!40000 ALTER TABLE `tokentokengroup` DISABLE KEYS */;
/*!40000 ALTER TABLE `tokentokengroup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usercache`
--

DROP TABLE IF EXISTS `usercache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usercache` (
  `id` int(11) NOT NULL,
  `username` varchar(64) DEFAULT NULL,
  `used_login` varchar(64) DEFAULT NULL,
  `resolver` varchar(120) DEFAULT NULL,
  `user_id` varchar(320) DEFAULT NULL,
  `timestamp` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_usercache_used_login` (`used_login`),
  KEY `ix_usercache_username` (`username`),
  KEY `ix_usercache_timestamp` (`timestamp`),
  KEY `ix_usercache_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usercache`
--

LOCK TABLES `usercache` WRITE;
/*!40000 ALTER TABLE `usercache` DISABLE KEYS */;
/*!40000 ALTER TABLE `usercache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `userid` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  PRIMARY KEY (`userid`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'autotester'),
(2,'faltmann');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2024-07-26 13:52:09
