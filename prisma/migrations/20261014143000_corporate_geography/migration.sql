-- Master states + optional city→state link + per-corporate geography mapping

CREATE TABLE IF NOT EXISTS `master_state` (
  `id` VARCHAR(191) NOT NULL,
  `country_id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(16) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `master_state_country_id_code_key`(`country_id`, `code`),
  INDEX `master_state_country_id_name_idx`(`country_id`, `name`),
  CONSTRAINT `master_state_country_id_fkey`
    FOREIGN KEY (`country_id`) REFERENCES `master_country`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add nullable state_id on master_city when missing
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'master_city'
    AND COLUMN_NAME = 'state_id'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `master_city` ADD COLUMN `state_id` VARCHAR(191) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'master_city'
    AND INDEX_NAME = 'master_city_state_id_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `master_city_state_id_idx` ON `master_city`(`state_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'master_city'
    AND CONSTRAINT_NAME = 'master_city_state_id_fkey'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE `master_city` ADD CONSTRAINT `master_city_state_id_fkey` FOREIGN KEY (`state_id`) REFERENCES `master_state`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `corporate_geography` (
  `id` VARCHAR(191) NOT NULL,
  `corporate_id` VARCHAR(191) NOT NULL,
  `country_id` VARCHAR(191) NOT NULL,
  `state_id` VARCHAR(191) NULL,
  `city_id` VARCHAR(191) NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `corporate_geography_corporate_id_country_id_key`(`corporate_id`, `country_id`),
  INDEX `corporate_geography_corporate_id_status_idx`(`corporate_id`, `status`),
  INDEX `corporate_geography_state_id_idx`(`state_id`),
  INDEX `corporate_geography_city_id_idx`(`city_id`),
  CONSTRAINT `corporate_geography_corporate_id_fkey`
    FOREIGN KEY (`corporate_id`) REFERENCES `corporate_company`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `corporate_geography_country_id_fkey`
    FOREIGN KEY (`country_id`) REFERENCES `master_country`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `corporate_geography_state_id_fkey`
    FOREIGN KEY (`state_id`) REFERENCES `master_state`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `corporate_geography_city_id_fkey`
    FOREIGN KEY (`city_id`) REFERENCES `master_city`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `master_country` (`id`, `code`, `name`) VALUES
  ('country_in', 'IN', 'India'),
  ('country_ae', 'AE', 'United Arab Emirates'),
  ('country_us', 'US', 'United States'),
  ('country_gb', 'GB', 'United Kingdom'),
  ('country_sg', 'SG', 'Singapore'),
  ('country_au', 'AU', 'Australia'),
  ('country_de', 'DE', 'Germany'),
  ('country_fr', 'FR', 'France'),
  ('country_jp', 'JP', 'Japan'),
  ('country_sa', 'SA', 'Saudi Arabia')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `master_state` (`id`, `country_id`, `code`, `name`) VALUES
  ('state_in_mh', 'country_in', 'MH', 'Maharashtra'),
  ('state_in_dl', 'country_in', 'DL', 'Delhi'),
  ('state_in_ka', 'country_in', 'KA', 'Karnataka'),
  ('state_in_tn', 'country_in', 'TN', 'Tamil Nadu'),
  ('state_in_tg', 'country_in', 'TG', 'Telangana'),
  ('state_in_gj', 'country_in', 'GJ', 'Gujarat'),
  ('state_in_rj', 'country_in', 'RJ', 'Rajasthan'),
  ('state_in_up', 'country_in', 'UP', 'Uttar Pradesh'),
  ('state_in_wb', 'country_in', 'WB', 'West Bengal'),
  ('state_in_kl', 'country_in', 'KL', 'Kerala'),
  ('state_in_pb', 'country_in', 'PB', 'Punjab'),
  ('state_in_hr', 'country_in', 'HR', 'Haryana'),
  ('state_in_mp', 'country_in', 'MP', 'Madhya Pradesh'),
  ('state_in_br', 'country_in', 'BR', 'Bihar'),
  ('state_in_or', 'country_in', 'OR', 'Odisha'),
  ('state_in_as', 'country_in', 'AS', 'Assam'),
  ('state_in_ga', 'country_in', 'GA', 'Goa'),
  ('state_in_ch', 'country_in', 'CH', 'Chandigarh'),
  ('state_in_jk', 'country_in', 'JK', 'Jammu and Kashmir')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
