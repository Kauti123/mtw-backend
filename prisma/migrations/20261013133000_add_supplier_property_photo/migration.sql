-- Property photos uploaded from the supplier extranet

CREATE TABLE `supplier_property_photo` (
    `id` VARCHAR(191) NOT NULL,
    `property_id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(64) NOT NULL,
    `caption` VARCHAR(255) NOT NULL DEFAULT '',
    `cover` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `bytes` MEDIUMBLOB NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `supplier_property_photo_property_id_sort_order_idx`(`property_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `supplier_property_photo`
    ADD CONSTRAINT `supplier_property_photo_property_id_fkey`
    FOREIGN KEY (`property_id`) REFERENCES `supplier_property`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
