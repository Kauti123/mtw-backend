-- Commercial Management tables: supplier commission, service fees,
-- convenience fees, discount rules, GST rules.

CREATE TABLE `pricing_supplier_commission` (
    `id` VARCHAR(191) NOT NULL,
    `supplier_name` VARCHAR(128) NOT NULL,
    `product_type` VARCHAR(16) NOT NULL,
    `commission_type` VARCHAR(32) NOT NULL,
    `value` DECIMAL(12, 4) NOT NULL,
    `valid_from` DATETIME(3) NULL,
    `valid_to` DATETIME(3) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pricing_supplier_commission_supplier_name_idx`(`supplier_name`),
    INDEX `pricing_supplier_commission_product_type_status_idx`(`product_type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pricing_service_fee` (
    `id` VARCHAR(191) NOT NULL,
    `fee_name` VARCHAR(128) NOT NULL,
    `product_type` VARCHAR(32) NOT NULL,
    `fee_type` VARCHAR(32) NOT NULL,
    `value` DECIMAL(12, 4) NOT NULL,
    `applicable_to` VARCHAR(64) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pricing_service_fee_product_type_status_idx`(`product_type`, `status`),
    INDEX `pricing_service_fee_applicable_to_idx`(`applicable_to`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pricing_convenience_fee` (
    `id` VARCHAR(191) NOT NULL,
    `fee_name` VARCHAR(128) NOT NULL,
    `product_type` VARCHAR(32) NOT NULL,
    `channel` VARCHAR(32) NOT NULL,
    `value` DECIMAL(12, 4) NOT NULL,
    `applicable_to` VARCHAR(64) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pricing_convenience_fee_product_type_status_idx`(`product_type`, `status`),
    INDEX `pricing_convenience_fee_channel_idx`(`channel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pricing_discount_rule` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `product_type` VARCHAR(32) NOT NULL,
    `discount_type` VARCHAR(32) NOT NULL,
    `value` DECIMAL(12, 4) NOT NULL,
    `min_booking_value` DECIMAL(12, 4) NOT NULL DEFAULT 0,
    `valid_from` DATETIME(3) NULL,
    `valid_to` DATETIME(3) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pricing_discount_rule_product_type_status_idx`(`product_type`, `status`),
    INDEX `pricing_discount_rule_discount_type_idx`(`discount_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pricing_gst_rule` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `product_type` VARCHAR(32) NOT NULL,
    `gst_type` VARCHAR(16) NOT NULL,
    `gst_percentage` DECIMAL(8, 4) NOT NULL,
    `applicable_for` VARCHAR(32) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pricing_gst_rule_product_type_status_idx`(`product_type`, `status`),
    INDEX `pricing_gst_rule_gst_type_idx`(`gst_type`),
    INDEX `pricing_gst_rule_applicable_for_idx`(`applicable_for`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
