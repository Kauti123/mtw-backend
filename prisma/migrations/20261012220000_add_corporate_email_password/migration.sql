-- Add email and password columns to corporate_company for create/login credentials.
ALTER TABLE `corporate_company`
  ADD COLUMN `email` VARCHAR(255) NULL AFTER `legal_name`,
  ADD COLUMN `password` VARCHAR(255) NULL AFTER `email`;

CREATE INDEX `corporate_company_email_idx` ON `corporate_company`(`email`);
