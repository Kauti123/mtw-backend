-- User role tables used by user-service role CRUD.

CREATE TABLE `user_profile` (
    `id` VARCHAR(191) NOT NULL,
    `auth_user_id` VARCHAR(64) NOT NULL,
    `corporate_id` VARCHAR(64) NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(32) NULL,
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'UTC',
    `locale` VARCHAR(16) NOT NULL DEFAULT 'en-IN',
    `status` ENUM('ACTIVE', 'INVITED', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_profile_auth_user_id_key`(`auth_user_id`),
    INDEX `user_profile_corporate_id_idx`(`corporate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_role` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `description` VARCHAR(250) NULL,
    `role_type` ENUM('INTERNAL', 'EXTERNAL', 'PARTNER') NOT NULL,
    `data_scope` ENUM('GLOBAL', 'CORPORATE', 'BRANCH', 'SELF') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `maker_checker_required` BOOLEAN NOT NULL DEFAULT false,
    `corporate_id` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_role_code_key`(`code`),
    INDEX `user_role_status_idx`(`status`),
    INDEX `user_role_role_type_idx`(`role_type`),
    INDEX `user_role_data_scope_idx`(`data_scope`),
    INDEX `user_role_corporate_id_idx`(`corporate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_role_permission` (
    `id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `subject` VARCHAR(64) NOT NULL,
    `conditions` JSON NULL,

    INDEX `user_role_permission_role_id_idx`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_role_assignment` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `corporate_id` VARCHAR(64) NULL,
    `scope` JSON NULL,

    INDEX `user_role_assignment_user_id_idx`(`user_id`),
    INDEX `user_role_assignment_role_id_idx`(`role_id`),
    UNIQUE INDEX `user_role_assignment_user_id_role_id_corporate_id_key`(`user_id`, `role_id`, `corporate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_role_permission`
    ADD CONSTRAINT `user_role_permission_role_id_fkey`
    FOREIGN KEY (`role_id`) REFERENCES `user_role`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_role_assignment`
    ADD CONSTRAINT `user_role_assignment_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `user_profile`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_role_assignment`
    ADD CONSTRAINT `user_role_assignment_role_id_fkey`
    FOREIGN KEY (`role_id`) REFERENCES `user_role`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
