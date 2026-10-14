-- Corporate code master table used by Create Corporate Code UI.

CREATE TABLE `corporate_code` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `corporate_type` VARCHAR(64) NOT NULL,
    `default_country` VARCHAR(64) NOT NULL,
    `default_currency` VARCHAR(3) NOT NULL,
    `pricing_model` VARCHAR(64) NOT NULL,
    `gst_applicable` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `primary_contact` VARCHAR(128) NULL,
    `email` VARCHAR(320) NULL,
    `phone` VARCHAR(32) NULL,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `corporate_code_code_key`(`code`),
    INDEX `corporate_code_status_idx`(`status`),
    INDEX `corporate_code_corporate_type_idx`(`corporate_type`),
    INDEX `corporate_code_default_country_idx`(`default_country`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
