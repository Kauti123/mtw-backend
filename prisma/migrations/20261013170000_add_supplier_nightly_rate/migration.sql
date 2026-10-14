-- Nightly rates and restrictions for supplier rate plans

CREATE TABLE `supplier_nightly_rate` (
    `id` VARCHAR(191) NOT NULL,
    `property_id` VARCHAR(191) NOT NULL,
    `room_type_id` VARCHAR(191) NOT NULL,
    `rate_plan_id` VARCHAR(191) NOT NULL,
    `stay_date` DATE NOT NULL,
    `price` INTEGER NULL,
    `extra_adult` INTEGER NULL,
    `extra_child` INTEGER NULL,
    `min_stay` INTEGER NULL,
    `max_stay` INTEGER NULL,
    `closed` BOOLEAN NOT NULL DEFAULT false,
    `closed_to_arrival` BOOLEAN NOT NULL DEFAULT false,
    `closed_to_departure` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `supplier_nightly_rate_property_id_stay_date_idx`(`property_id`, `stay_date`),
    UNIQUE INDEX `supplier_nightly_rate_rate_plan_id_room_type_id_stay_date_key`(`rate_plan_id`, `room_type_id`, `stay_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `supplier_nightly_rate` ADD CONSTRAINT `supplier_nightly_rate_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `supplier_property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `supplier_nightly_rate` ADD CONSTRAINT `supplier_nightly_rate_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `supplier_room_type`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `supplier_nightly_rate` ADD CONSTRAINT `supplier_nightly_rate_rate_plan_id_fkey` FOREIGN KEY (`rate_plan_id`) REFERENCES `supplier_rate_plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
