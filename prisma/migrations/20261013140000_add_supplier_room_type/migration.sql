-- Supplier extranet room types (Add Room Type + room type list)

CREATE TABLE `supplier_room_type` (
    `id` VARCHAR(191) NOT NULL,
    `property_id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `bed` VARCHAR(32) NOT NULL,
    `size_sqm` INTEGER NULL,
    `smoking` VARCHAR(32) NOT NULL DEFAULT 'Non-smoking',
    `max_adults` INTEGER NOT NULL,
    `max_children` INTEGER NOT NULL DEFAULT 0,
    `max_guests` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `amenities` JSON NULL,
    `room_count` INTEGER NOT NULL DEFAULT 0,
    `available_count` INTEGER NOT NULL DEFAULT 0,
    `photo_url` VARCHAR(500) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `supplier_room_type_property_id_idx`(`property_id`),
    UNIQUE INDEX `supplier_room_type_property_id_code_key`(`property_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `supplier_room_type`
    ADD CONSTRAINT `supplier_room_type_property_id_fkey`
    FOREIGN KEY (`property_id`) REFERENCES `supplier_property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `supplier_room_type` (
    `id`, `property_id`, `code`, `name`, `bed`, `size_sqm`, `smoking`,
    `max_adults`, `max_children`, `max_guests`, `description`, `amenities`,
    `room_count`, `available_count`, `photo_url`, `created_at`, `updated_at`
) VALUES
(
    'dlx-sea', 'sbr-goa', 'DLX-SEA', 'Deluxe Sea View', 'King', 34, 'Non-smoking',
    2, 1, 3, '',
    JSON_ARRAY('Air conditioning', 'Wi-Fi', 'TV', 'Minibar', 'Safe', 'Balcony', 'Sea view'),
    12, 11, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80',
    '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'
),
(
    'ste-fam', 'sbr-goa', 'STE-FAM', 'Family Suite', 'King', 58, 'Non-smoking',
    4, 2, 5, '',
    JSON_ARRAY('Air conditioning', 'Wi-Fi', 'TV', 'Minibar', 'Safe', 'Bathtub', 'Balcony', 'Sea view', 'Kitchenette'),
    4, 4, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'
),
(
    'sup-gdn', 'sbr-goa', 'SUP-GDN', 'Superior Garden', 'Twin', 28, 'Non-smoking',
    2, 1, 3, '',
    JSON_ARRAY('Air conditioning', 'Wi-Fi', 'TV', 'Kettle', 'Work desk'),
    16, 16, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80',
    '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'
);

UPDATE `supplier_property` sp
SET `room_type_count` = (
    SELECT COUNT(*) FROM `supplier_room_type` rt WHERE rt.`property_id` = sp.`id`
);
