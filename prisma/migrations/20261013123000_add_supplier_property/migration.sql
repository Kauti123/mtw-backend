-- Supplier extranet properties (Add Property + properties list)

CREATE TABLE `supplier_property` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `type` VARCHAR(32) NOT NULL DEFAULT 'Hotel',
    `stars` INTEGER NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'Draft',
    `currency` VARCHAR(8) NOT NULL DEFAULT 'INR',
    `check_in` VARCHAR(8) NOT NULL DEFAULT '14:00',
    `check_out` VARCHAR(8) NOT NULL DEFAULT '12:00',
    `city` VARCHAR(128) NOT NULL DEFAULT '',
    `region` VARCHAR(64) NOT NULL DEFAULT '',
    `country` VARCHAR(8) NOT NULL DEFAULT 'IN',
    `address` VARCHAR(255) NOT NULL DEFAULT '',
    `postal_code` VARCHAR(16) NOT NULL DEFAULT '',
    `latitude` VARCHAR(32) NOT NULL DEFAULT '',
    `longitude` VARCHAR(32) NOT NULL DEFAULT '',
    `email` VARCHAR(160) NOT NULL DEFAULT '',
    `phone` VARCHAR(32) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `amenities` JSON NULL,
    `photo_count` INTEGER NOT NULL DEFAULT 0,
    `room_type_count` INTEGER NOT NULL DEFAULT 0,
    `room_count` INTEGER NOT NULL DEFAULT 0,
    `sellable_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `supplier_property_code_key`(`code`),
    INDEX `supplier_property_status_idx`(`status`),
    INDEX `supplier_property_type_idx`(`type`),
    INDEX `supplier_property_city_idx`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `supplier_property` (
    `id`, `code`, `name`, `type`, `stars`, `status`, `currency`, `check_in`, `check_out`,
    `city`, `region`, `country`, `address`, `postal_code`, `latitude`, `longitude`,
    `email`, `phone`, `description`, `amenities`, `photo_count`, `room_type_count`, `room_count`, `sellable_count`,
    `created_at`, `updated_at`
) VALUES
(
    'sbr-uda', 'SBR-UDA', 'Sea Breeze Lake Palace Udaipur', 'Hotel', 5, 'Draft', 'INR', '14:00', '11:00',
    'Udaipur', 'RJ', 'IN', 'Lake Pichola Road', '313001', '24.5760', '73.6830',
    'udaipur@seabreeze-demo.test', '+912942760000',
    'Lake-facing palace hotel. Room types and photos are still being prepared for review.',
    JSON_ARRAY('Wi-Fi', 'Pool', 'Restaurant', 'Spa'),
    0, 0, 0, 0,
    '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'
),
(
    'sbr-goa', 'SBR-GOA', 'Sea Breeze Resort Goa', 'Resort', 4, 'Active', 'INR', '14:00', '11:00',
    'Calangute', 'GA', 'IN', 'Calangute–Baga Road, Bardez', '403516', '15.5439', '73.7553',
    'reservations@seabreeze-demo.test', '+918322276000',
    'Beachfront resort on Calangute beach, 10 minutes from Baga. Sea-facing deluxe rooms, two pools and an all-day restaurant.',
    JSON_ARRAY('Wi-Fi', 'Pool', 'Restaurant', 'Bar', 'Breakfast', 'Parking', 'Spa', 'Airport shuttle', '24-hour front desk', 'Beach access'),
    4, 3, 32, 31,
    '2026-10-10 06:20:00.000', '2026-10-10 06:20:00.000'
);
