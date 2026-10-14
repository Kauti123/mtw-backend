-- Supplier extranet rooms (Add Rooms + rooms list)

CREATE TABLE `supplier_room` (
    `id` VARCHAR(191) NOT NULL,
    `property_id` VARCHAR(191) NOT NULL,
    `room_type_id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(32) NOT NULL,
    `floor` VARCHAR(16) NOT NULL DEFAULT '',
    `status` VARCHAR(32) NOT NULL DEFAULT 'Available',
    `notes` VARCHAR(500) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `supplier_room_property_id_status_idx`(`property_id`, `status`),
    INDEX `supplier_room_room_type_id_idx`(`room_type_id`),
    UNIQUE INDEX `supplier_room_property_id_number_key`(`property_id`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `supplier_room` ADD CONSTRAINT `supplier_room_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `supplier_property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `supplier_room` ADD CONSTRAINT `supplier_room_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `supplier_room_type`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `supplier_room` (
    `id`, `property_id`, `room_type_id`, `number`, `floor`, `status`, `notes`, `created_at`, `updated_at`
) VALUES
('goa-101', 'sbr-goa', 'dlx-sea', '101', '1', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-102', 'sbr-goa', 'dlx-sea', '102', '1', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-103', 'sbr-goa', 'dlx-sea', '103', '1', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-104', 'sbr-goa', 'dlx-sea', '104', '1', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-105', 'sbr-goa', 'dlx-sea', '105', '1', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-106', 'sbr-goa', 'dlx-sea', '106', '1', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-107', 'sbr-goa', 'dlx-sea', '107', '1', 'Out of order', 'Bathroom renovation until 20 Oct', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-108', 'sbr-goa', 'dlx-sea', '108', '1', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-109', 'sbr-goa', 'dlx-sea', '109', '1', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-110', 'sbr-goa', 'dlx-sea', '110', '1', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-111', 'sbr-goa', 'dlx-sea', '111', '1', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-112', 'sbr-goa', 'dlx-sea', '112', '1', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-201', 'sbr-goa', 'ste-fam', '201', '2', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-202', 'sbr-goa', 'ste-fam', '202', '2', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-203', 'sbr-goa', 'ste-fam', '203', '2', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-204', 'sbr-goa', 'ste-fam', '204', '2', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-301', 'sbr-goa', 'sup-gdn', '301', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-302', 'sbr-goa', 'sup-gdn', '302', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-303', 'sbr-goa', 'sup-gdn', '303', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-304', 'sbr-goa', 'sup-gdn', '304', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-305', 'sbr-goa', 'sup-gdn', '305', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-306', 'sbr-goa', 'sup-gdn', '306', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-307', 'sbr-goa', 'sup-gdn', '307', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-308', 'sbr-goa', 'sup-gdn', '308', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-309', 'sbr-goa', 'sup-gdn', '309', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-310', 'sbr-goa', 'sup-gdn', '310', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-311', 'sbr-goa', 'sup-gdn', '311', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-312', 'sbr-goa', 'sup-gdn', '312', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-313', 'sbr-goa', 'sup-gdn', '313', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-314', 'sbr-goa', 'sup-gdn', '314', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-315', 'sbr-goa', 'sup-gdn', '315', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'),
('goa-316', 'sbr-goa', 'sup-gdn', '316', '3', 'Available', '', '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000');

UPDATE `supplier_room_type` rt
SET `room_count` = (SELECT COUNT(*) FROM `supplier_room` r WHERE r.`room_type_id` = rt.`id`),
    `available_count` = (SELECT COUNT(*) FROM `supplier_room` r WHERE r.`room_type_id` = rt.`id` AND r.`status` = 'Available');

UPDATE `supplier_property` sp
SET `room_count` = (SELECT COUNT(*) FROM `supplier_room` r WHERE r.`property_id` = sp.`id`),
    `sellable_count` = (SELECT COUNT(*) FROM `supplier_room` r WHERE r.`property_id` = sp.`id` AND r.`status` = 'Available');