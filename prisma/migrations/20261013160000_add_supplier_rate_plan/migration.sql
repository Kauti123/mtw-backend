-- Supplier extranet rate plans

CREATE TABLE `supplier_rate_plan` (
    `id` VARCHAR(191) NOT NULL,
    `property_id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `meal` VARCHAR(32) NOT NULL,
    `policy` VARCHAR(64) NOT NULL,
    `adults_included` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `supplier_rate_plan_property_id_idx`(`property_id`),
    UNIQUE INDEX `supplier_rate_plan_property_id_code_key`(`property_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `supplier_rate_plan_room_type` (
    `rate_plan_id` VARCHAR(191) NOT NULL,
    `room_type_id` VARCHAR(191) NOT NULL,

    INDEX `supplier_rate_plan_room_type_room_type_id_idx`(`room_type_id`),
    PRIMARY KEY (`rate_plan_id`, `room_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `supplier_rate_plan` ADD CONSTRAINT `supplier_rate_plan_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `supplier_property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `supplier_rate_plan_room_type` ADD CONSTRAINT `supplier_rate_plan_room_type_rate_plan_id_fkey` FOREIGN KEY (`rate_plan_id`) REFERENCES `supplier_rate_plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `supplier_rate_plan_room_type` ADD CONSTRAINT `supplier_rate_plan_room_type_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `supplier_room_type`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `supplier_rate_plan` (
    `id`, `property_id`, `code`, `name`, `meal`, `policy`, `adults_included`, `description`, `created_at`, `updated_at`
) VALUES
(
    'saver-ro', 'sbr-goa', 'SAVER-RO', 'Advance Saver · Room only', 'Room only', 'Non-refundable', 2, '',
    '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'
),
(
    'bar-bb', 'sbr-goa', 'BAR-BB', 'Best Available · Breakfast', 'Breakfast', 'Flexible — free until 72 h', 2, '',
    '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'
),
(
    'hb-fam', 'sbr-goa', 'HB-FAM', 'Family Half Board', 'Half board', 'Flexible — free until 72 h', 4, '',
    '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'
);

INSERT INTO `supplier_rate_plan_room_type` (`rate_plan_id`, `room_type_id`) VALUES
('saver-ro', 'dlx-sea'),
('saver-ro', 'sup-gdn'),
('bar-bb', 'dlx-sea'),
('bar-bb', 'ste-fam'),
('bar-bb', 'sup-gdn'),
('hb-fam', 'ste-fam');
