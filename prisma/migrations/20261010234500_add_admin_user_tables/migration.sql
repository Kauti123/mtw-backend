-- Admin portal users and refresh tokens for Misba Supervision auth.

CREATE TABLE `auth_admin_user` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(320) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(128) NOT NULL,
    `last_name` VARCHAR(128) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(32) NULL,
    `role_code` VARCHAR(64) NOT NULL DEFAULT 'ADMIN',
    `role_name` VARCHAR(128) NOT NULL DEFAULT 'Admin',
    `status` ENUM('ACTIVE', 'INVITED', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `mfa_enabled` BOOLEAN NOT NULL DEFAULT false,
    `mfa_secret` VARCHAR(255) NULL,
    `last_login_at` DATETIME(3) NULL,
    `failed_login_attempts` INT NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `password_changed_at` DATETIME(3) NULL,
    `must_change_password` BOOLEAN NOT NULL DEFAULT false,
    `is_email_verified` BOOLEAN NOT NULL DEFAULT true,
    `created_by` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `auth_admin_user_email_key`(`email`),
    INDEX `auth_admin_user_status_idx`(`status`),
    INDEX `auth_admin_user_role_code_idx`(`role_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `auth_admin_refresh_token` (
    `id` VARCHAR(191) NOT NULL,
    `admin_id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(128) NOT NULL,
    `family_id` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `user_agent` VARCHAR(512) NULL,
    `ip` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `auth_admin_refresh_token_admin_id_idx`(`admin_id`),
    INDEX `auth_admin_refresh_token_family_id_idx`(`family_id`),
    INDEX `auth_admin_refresh_token_token_hash_idx`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `auth_admin_refresh_token`
    ADD CONSTRAINT `auth_admin_refresh_token_admin_id_fkey`
    FOREIGN KEY (`admin_id`) REFERENCES `auth_admin_user`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Also create core auth_user_account tables used by general portal auth (if missing).
CREATE TABLE IF NOT EXISTS `auth_user_account` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(320) NOT NULL,
    `password_hash` VARCHAR(255) NULL,
    `mfa_enabled` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'INVITED', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'INVITED',
    `last_login_at` DATETIME(3) NULL,
    `corporate_id` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `auth_user_account_email_key`(`email`),
    INDEX `auth_user_account_corporate_id_idx`(`corporate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auth_refresh_token` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(128) NOT NULL,
    `family_id` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `user_agent` VARCHAR(512) NULL,
    `ip` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `auth_refresh_token_user_id_idx`(`user_id`),
    INDEX `auth_refresh_token_family_id_idx`(`family_id`),
    INDEX `auth_refresh_token_token_hash_idx`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
