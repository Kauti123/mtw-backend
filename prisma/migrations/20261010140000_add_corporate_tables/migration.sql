-- Corporate account tables used by corporate-service and masterdata-service.

CREATE TABLE `corporate_company` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `legal_name` VARCHAR(255) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `default_currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    `settings` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `corporate_company_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `corporate_department` (
    `id` VARCHAR(191) NOT NULL,
    `corporate_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `code` VARCHAR(64) NOT NULL,

    UNIQUE INDEX `corporate_department_corporate_id_code_key`(`corporate_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `corporate_cost_center` (
    `id` VARCHAR(191) NOT NULL,
    `corporate_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `budget_json` JSON NULL,

    UNIQUE INDEX `corporate_cost_center_corporate_id_code_key`(`corporate_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `corporate_employee` (
    `id` VARCHAR(191) NOT NULL,
    `corporate_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(64) NULL,
    `employee_code` VARCHAR(64) NOT NULL,
    `email` VARCHAR(320) NOT NULL,
    `department_id` VARCHAR(191) NULL,
    `cost_center_id` VARCHAR(191) NULL,
    `grade` VARCHAR(32) NULL,
    `manager_employee_id` VARCHAR(64) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',

    INDEX `corporate_employee_corporate_id_email_idx`(`corporate_id`, `email`),
    UNIQUE INDEX `corporate_employee_corporate_id_employee_code_key`(`corporate_id`, `employee_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `corporate_department`
    ADD CONSTRAINT `corporate_department_corporate_id_fkey`
    FOREIGN KEY (`corporate_id`) REFERENCES `corporate_company`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `corporate_cost_center`
    ADD CONSTRAINT `corporate_cost_center_corporate_id_fkey`
    FOREIGN KEY (`corporate_id`) REFERENCES `corporate_company`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `corporate_employee`
    ADD CONSTRAINT `corporate_employee_corporate_id_fkey`
    FOREIGN KEY (`corporate_id`) REFERENCES `corporate_company`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `corporate_employee`
    ADD CONSTRAINT `corporate_employee_department_id_fkey`
    FOREIGN KEY (`department_id`) REFERENCES `corporate_department`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `corporate_employee`
    ADD CONSTRAINT `corporate_employee_cost_center_id_fkey`
    FOREIGN KEY (`cost_center_id`) REFERENCES `corporate_cost_center`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
