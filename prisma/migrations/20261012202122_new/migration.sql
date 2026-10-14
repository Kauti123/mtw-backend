-- AlterTable
ALTER TABLE `corporate_employee` ALTER COLUMN `updated_at` DROP DEFAULT;

-- CreateTable
CREATE TABLE `outbox_event` (
    `id` VARCHAR(191) NOT NULL,
    `aggregate_type` VARCHAR(64) NOT NULL,
    `aggregate_id` VARCHAR(64) NOT NULL,
    `event_type` VARCHAR(128) NOT NULL,
    `payload` JSON NOT NULL,
    `headers` JSON NULL,
    `status` ENUM('PENDING', 'PUBLISHED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `published_at` DATETIME(3) NULL,

    INDEX `outbox_event_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_idempotency` (
    `id` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(64) NOT NULL,
    `key` VARCHAR(128) NOT NULL,
    `corporate_id` VARCHAR(64) NULL,
    `request_hash` VARCHAR(128) NOT NULL,
    `response_json` JSON NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'IN_PROGRESS',
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `platform_idempotency_expires_at_idx`(`expires_at`),
    UNIQUE INDEX `platform_idempotency_scope_key_key`(`scope`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_sso_identity` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(32) NOT NULL,
    `issuer` VARCHAR(512) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `raw_claims` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `auth_sso_identity_user_id_idx`(`user_id`),
    UNIQUE INDEX `auth_sso_identity_issuer_subject_key`(`issuer`, `subject`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_api_client` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(64) NOT NULL,
    `client_secret_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `portal` ENUM('ADMIN', 'CORPORATE', 'EMPLOYEE', 'SUPPLIER', 'PARTNER_API') NOT NULL DEFAULT 'PARTNER_API',
    `rate_limit_plan` VARCHAR(32) NOT NULL DEFAULT 'standard',
    `corporate_id` VARCHAR(64) NULL,
    `scopes` JSON NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `auth_api_client_client_id_key`(`client_id`),
    INDEX `auth_api_client_corporate_id_idx`(`corporate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_supplier` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `default_priority` INTEGER NOT NULL DEFAULT 100,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `supplier_supplier_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_credential` (
    `id` VARCHAR(191) NOT NULL,
    `supplier_id` VARCHAR(191) NOT NULL,
    `mode` ENUM('SANDBOX', 'PRODUCTION') NOT NULL DEFAULT 'SANDBOX',
    `ciphertext` TEXT NOT NULL,
    `iv` VARCHAR(64) NOT NULL,
    `auth_tag` VARCHAR(64) NOT NULL,
    `kek_version` VARCHAR(16) NOT NULL DEFAULT 'v1',
    `rotated_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `supplier_credential_supplier_id_mode_key`(`supplier_id`, `mode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_vertical_config` (
    `id` VARCHAR(191) NOT NULL,
    `supplier_id` VARCHAR(191) NOT NULL,
    `vertical` ENUM('HOTEL', 'FLIGHT', 'BUS', 'CAB', 'TRAIN') NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `priority` INTEGER NOT NULL DEFAULT 100,
    `base_url` VARCHAR(512) NOT NULL,
    `timeout_ms` INTEGER NOT NULL DEFAULT 8000,
    `rate_limit_per_sec` INTEGER NOT NULL DEFAULT 20,
    `markup_group` VARCHAR(64) NULL,
    `capabilities` JSON NULL,

    UNIQUE INDEX `supplier_vertical_config_supplier_id_vertical_key`(`supplier_id`, `vertical`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_rule` (
    `id` VARCHAR(191) NOT NULL,
    `supplier_id` VARCHAR(191) NOT NULL,
    `vertical` ENUM('HOTEL', 'FLIGHT', 'BUS', 'CAB', 'TRAIN') NULL,
    `corporate_id` VARCHAR(64) NULL,
    `market_country` VARCHAR(2) NULL,
    `destination_pattern` VARCHAR(128) NULL,
    `priority_override` INTEGER NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `window_start` DATETIME(3) NULL,
    `window_end` DATETIME(3) NULL,

    INDEX `supplier_rule_supplier_id_vertical_corporate_id_idx`(`supplier_id`, `vertical`, `corporate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_health` (
    `id` VARCHAR(191) NOT NULL,
    `supplier_id` VARCHAR(191) NOT NULL,
    `vertical` ENUM('HOTEL', 'FLIGHT', 'BUS', 'CAB', 'TRAIN') NOT NULL,
    `status` ENUM('HEALTHY', 'DEGRADED', 'DOWN') NOT NULL DEFAULT 'HEALTHY',
    `circuit_state` ENUM('CLOSED', 'OPEN', 'HALF_OPEN') NOT NULL DEFAULT 'CLOSED',
    `last_checked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `details` JSON NULL,

    UNIQUE INDEX `supplier_health_supplier_id_vertical_key`(`supplier_id`, `vertical`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_booking` (
    `id` VARCHAR(191) NOT NULL,
    `booking_ref` VARCHAR(64) NOT NULL,
    `corporate_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `vertical` ENUM('HOTEL', 'FLIGHT', 'BUS', 'CAB', 'TRAIN') NOT NULL,
    `status` ENUM('INITIATED', 'HELD', 'CONFIRMED', 'TICKETED', 'CANCELLED', 'MODIFIED', 'FAILED') NOT NULL DEFAULT 'INITIATED',
    `supplier_code` VARCHAR(64) NULL,
    `supplier_booking_ref` VARCHAR(128) NULL,
    `offer_snapshot` JSON NOT NULL,
    `price_breakdown` JSON NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `travellers` JSON NOT NULL,
    `idempotency_key` VARCHAR(128) NOT NULL,
    `held_until` DATETIME(3) NULL,
    `confirmed_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `correlation_id` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `booking_booking_booking_ref_key`(`booking_ref`),
    INDEX `booking_booking_corporate_id_status_idx`(`corporate_id`, `status`),
    INDEX `booking_booking_user_id_idx`(`user_id`),
    UNIQUE INDEX `booking_booking_corporate_id_idempotency_key_key`(`corporate_id`, `idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_state_transition` (
    `id` VARCHAR(191) NOT NULL,
    `booking_id` VARCHAR(191) NOT NULL,
    `from_status` ENUM('INITIATED', 'HELD', 'CONFIRMED', 'TICKETED', 'CANCELLED', 'MODIFIED', 'FAILED') NOT NULL,
    `to_status` ENUM('INITIATED', 'HELD', 'CONFIRMED', 'TICKETED', 'CANCELLED', 'MODIFIED', 'FAILED') NOT NULL,
    `reason` VARCHAR(255) NULL,
    `actor_id` VARCHAR(64) NULL,
    `meta` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `booking_state_transition_booking_id_created_at_idx`(`booking_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_saga_step` (
    `id` VARCHAR(191) NOT NULL,
    `booking_id` VARCHAR(191) NOT NULL,
    `step` VARCHAR(64) NOT NULL,
    `status` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'COMPENSATED') NOT NULL DEFAULT 'PENDING',
    `attempt` INTEGER NOT NULL DEFAULT 0,
    `last_error` TEXT NULL,
    `compensation_of` VARCHAR(64) NULL,
    `idempotency_key` VARCHAR(128) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `booking_saga_step_booking_id_status_idx`(`booking_id`, `status`),
    UNIQUE INDEX `booking_saga_step_booking_id_step_idempotency_key_key`(`booking_id`, `step`, `idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_country` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(2) NOT NULL,
    `name` VARCHAR(128) NOT NULL,

    UNIQUE INDEX `master_country_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_city` (
    `id` VARCHAR(191) NOT NULL,
    `country_id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(16) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `timezone` VARCHAR(64) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,

    UNIQUE INDEX `master_city_country_id_code_key`(`country_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_hotel_mapping` (
    `id` VARCHAR(191) NOT NULL,
    `mtw_hotel_id` VARCHAR(64) NOT NULL,
    `supplier_code` VARCHAR(64) NOT NULL,
    `supplier_hotel_id` VARCHAR(128) NOT NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 1,
    `review_status` VARCHAR(32) NOT NULL DEFAULT 'AUTO',

    INDEX `master_hotel_mapping_mtw_hotel_id_idx`(`mtw_hotel_id`),
    UNIQUE INDEX `master_hotel_mapping_supplier_code_supplier_hotel_id_key`(`supplier_code`, `supplier_hotel_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_payment` (
    `id` VARCHAR(191) NOT NULL,
    `booking_id` VARCHAR(191) NULL,
    `corporate_id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(32) NOT NULL,
    `provider_ref` VARCHAR(128) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `idempotency_key` VARCHAR(128) NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_payment_idempotency_key_key`(`idempotency_key`),
    INDEX `payment_payment_corporate_id_created_at_idx`(`corporate_id`, `created_at`),
    INDEX `payment_payment_booking_id_idx`(`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_refund` (
    `id` VARCHAR(191) NOT NULL,
    `payment_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `provider_ref` VARCHAR(128) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_refund_payment_id_idx`(`payment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trip_trip` (
    `id` VARCHAR(191) NOT NULL,
    `corporate_id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(256) NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `trip_trip_corporate_id_owner_id_idx`(`corporate_id`, `owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cost_saving` (
    `id` VARCHAR(191) NOT NULL,
    `corporate_id` VARCHAR(191) NOT NULL,
    `booking_id` VARCHAR(191) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `reason` VARCHAR(128) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cost_saving_corporate_id_idx`(`corporate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_page` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(128) NOT NULL,
    `title` VARCHAR(256) NOT NULL,
    `body` JSON NOT NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_page_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_banner` (
    `id` VARCHAR(191) NOT NULL,
    `portal` VARCHAR(32) NOT NULL,
    `title` VARCHAR(256) NOT NULL,
    `payload` JSON NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `starts_at` DATETIME(3) NULL,
    `ends_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cms_banner_portal_active_idx`(`portal`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_outbox` (
    `id` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(32) NOT NULL,
    `to_address` VARCHAR(256) NOT NULL,
    `template` VARCHAR(128) NOT NULL,
    `payload` JSON NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `provider_ref` VARCHAR(128) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sent_at` DATETIME(3) NULL,

    INDEX `notification_outbox_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `auth_refresh_token` ADD CONSTRAINT `auth_refresh_token_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `auth_user_account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_sso_identity` ADD CONSTRAINT `auth_sso_identity_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `auth_user_account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_credential` ADD CONSTRAINT `supplier_credential_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_supplier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_vertical_config` ADD CONSTRAINT `supplier_vertical_config_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_supplier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_rule` ADD CONSTRAINT `supplier_rule_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_supplier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_health` ADD CONSTRAINT `supplier_health_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_supplier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_state_transition` ADD CONSTRAINT `booking_state_transition_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking_booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_saga_step` ADD CONSTRAINT `booking_saga_step_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking_booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `master_city` ADD CONSTRAINT `master_city_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `master_country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
