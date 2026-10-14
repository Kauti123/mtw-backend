-- Add address on admin users + ensure Super Admin can be stored.

ALTER TABLE `auth_admin_user`
    ADD COLUMN `address` VARCHAR(512) NULL AFTER `phone`;
