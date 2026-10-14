-- Markup rules used by pricing-service Create Markup Rule UI.

CREATE TABLE `pricing_markup_rule` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `product_type` VARCHAR(16) NOT NULL,
    `markup_type` VARCHAR(32) NOT NULL,
    `markup_value` DECIMAL(12, 4) NOT NULL,
    `applicable_to` VARCHAR(64) NOT NULL,
    `priority` INT NOT NULL DEFAULT 1,
    `valid_from` DATETIME(3) NULL,
    `valid_to` DATETIME(3) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `conditions` JSON NULL,
    `remarks` TEXT NULL,
    `corporate_id` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pricing_markup_rule_product_type_status_idx`(`product_type`, `status`),
    INDEX `pricing_markup_rule_applicable_to_idx`(`applicable_to`),
    INDEX `pricing_markup_rule_priority_idx`(`priority`),
    INDEX `pricing_markup_rule_corporate_id_idx`(`corporate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
