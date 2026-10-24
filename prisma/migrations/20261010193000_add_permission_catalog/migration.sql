-- Permission catalog (modules + permissions) and role grant matrix columns.

CREATE TABLE `user_permission_module` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `tone` VARCHAR(64) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_permission_module_code_key`(`code`),
    INDEX `user_permission_module_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_permission` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `module_id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(250) NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_permission_code_key`(`code`),
    INDEX `user_permission_module_id_idx`(`module_id`),
    INDEX `user_permission_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_permission`
    ADD CONSTRAINT `user_permission_module_id_fkey`
    FOREIGN KEY (`module_id`) REFERENCES `user_permission_module`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Rebuild role permission grants to match the UI matrix (view/create/edit/delete per permission).
DROP TABLE IF EXISTS `user_role_permission`;

CREATE TABLE `user_role_permission` (
    `id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `permission_id` VARCHAR(191) NOT NULL,
    `can_view` BOOLEAN NOT NULL DEFAULT false,
    `can_create` BOOLEAN NOT NULL DEFAULT false,
    `can_edit` BOOLEAN NOT NULL DEFAULT false,
    `can_delete` BOOLEAN NOT NULL DEFAULT false,

    INDEX `user_role_permission_role_id_idx`(`role_id`),
    INDEX `user_role_permission_permission_id_idx`(`permission_id`),
    UNIQUE INDEX `user_role_permission_role_id_permission_id_key`(`role_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_role_permission`
    ADD CONSTRAINT `user_role_permission_role_id_fkey`
    FOREIGN KEY (`role_id`) REFERENCES `user_role`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_role_permission`
    ADD CONSTRAINT `user_role_permission_permission_id_fkey`
    FOREIGN KEY (`permission_id`) REFERENCES `user_permission`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed permission modules and matrix rows from Access Control UI.
INSERT INTO `user_permission_module` (`id`, `code`, `name`, `sort_order`, `tone`, `status`, `created_at`, `updated_at`) VALUES
('pmod_dashboard', 'dashboard', 'Dashboard', 10, 'rose', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('pmod_bookings', 'bookings', 'Bookings', 20, 'emerald', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('pmod_flight', 'flight', 'Flight', 30, 'sky', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('pmod_hotel', 'hotel', 'Hotel', 40, 'orange', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('pmod_corporate', 'corporate', 'Corporate', 50, 'pink', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('pmod_suppliers', 'suppliers', 'Suppliers', 60, 'violet', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('pmod_finance', 'finance', 'Finance', 70, 'amber', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('pmod_reports', 'reports', 'Reports', 80, 'teal', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('pmod_users', 'users', 'Users & Roles', 90, 'rose', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('pmod_settings', 'settings', 'Settings', 100, 'slate', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

INSERT INTO `user_permission` (`id`, `code`, `name`, `module_id`, `description`, `sort_order`, `status`, `created_at`, `updated_at`) VALUES
('perm_dashboard_view', 'dashboard.view', 'View Dashboard', 'pmod_dashboard', NULL, 10, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_dashboard_reports', 'dashboard.reports', 'View Reports', 'pmod_dashboard', NULL, 20, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('perm_bookings_view', 'bookings.view', 'View Bookings', 'pmod_bookings', NULL, 10, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_bookings_create', 'bookings.create', 'Create Bookings', 'pmod_bookings', NULL, 20, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_bookings_edit', 'bookings.edit', 'Edit Bookings', 'pmod_bookings', NULL, 30, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_bookings_cancel', 'bookings.cancel', 'Cancel Bookings', 'pmod_bookings', NULL, 40, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('perm_flight_view', 'flight.view', 'View Flights', 'pmod_flight', NULL, 10, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_flight_create', 'flight.create', 'Create Flight Booking', 'pmod_flight', NULL, 20, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_flight_edit', 'flight.edit', 'Edit Flight Booking', 'pmod_flight', NULL, 30, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_flight_cancel', 'flight.cancel', 'Cancel Flight Booking', 'pmod_flight', NULL, 40, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('perm_hotel_view', 'hotel.view', 'View Hotels', 'pmod_hotel', NULL, 10, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_hotel_create', 'hotel.create', 'Create Hotel Booking', 'pmod_hotel', NULL, 20, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_hotel_edit', 'hotel.edit', 'Edit Hotel Booking', 'pmod_hotel', NULL, 30, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_hotel_cancel', 'hotel.cancel', 'Cancel Hotel Booking', 'pmod_hotel', NULL, 40, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('perm_corporate_view', 'corporate.view', 'View Corporates', 'pmod_corporate', NULL, 10, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_corporate_create', 'corporate.create', 'Create Corporate', 'pmod_corporate', NULL, 20, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_corporate_edit', 'corporate.edit', 'Edit Corporate', 'pmod_corporate', NULL, 30, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_corporate_delete', 'corporate.delete', 'Delete Corporate', 'pmod_corporate', NULL, 40, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('perm_suppliers_view', 'suppliers.view', 'View Suppliers', 'pmod_suppliers', NULL, 10, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_suppliers_create', 'suppliers.create', 'Create Supplier', 'pmod_suppliers', NULL, 20, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_suppliers_edit', 'suppliers.edit', 'Edit Supplier', 'pmod_suppliers', NULL, 30, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_suppliers_delete', 'suppliers.delete', 'Delete Supplier', 'pmod_suppliers', NULL, 40, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('perm_finance_view', 'finance.view', 'View Finance', 'pmod_finance', NULL, 10, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_finance_create', 'finance.create', 'Create Entry', 'pmod_finance', NULL, 20, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_finance_edit', 'finance.edit', 'Edit Entry', 'pmod_finance', NULL, 30, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_finance_delete', 'finance.delete', 'Delete Entry', 'pmod_finance', NULL, 40, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('perm_reports_view', 'reports.view', 'View Reports', 'pmod_reports', NULL, 10, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_reports_create', 'reports.create', 'Create Report', 'pmod_reports', NULL, 20, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_reports_edit', 'reports.edit', 'Edit Report', 'pmod_reports', NULL, 30, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_reports_delete', 'reports.delete', 'Delete Report', 'pmod_reports', NULL, 40, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('perm_users_view', 'users.view', 'View Users', 'pmod_users', NULL, 10, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_users_create', 'users.create', 'Create User', 'pmod_users', NULL, 20, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_users_edit', 'users.edit', 'Edit User', 'pmod_users', NULL, 30, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_users_delete', 'users.delete', 'Delete User', 'pmod_users', NULL, 40, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('perm_settings_view', 'settings.view', 'View Settings', 'pmod_settings', NULL, 10, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_settings_create', 'settings.create', 'Create Setting', 'pmod_settings', NULL, 20, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_settings_edit', 'settings.edit', 'Edit Setting', 'pmod_settings', NULL, 30, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('perm_settings_delete', 'settings.delete', 'Delete Setting', 'pmod_settings', NULL, 40, 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
