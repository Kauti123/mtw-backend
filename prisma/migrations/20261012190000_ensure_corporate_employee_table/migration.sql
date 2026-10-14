-- Ensure corporate_employee remains the dedicated employee storage table.
-- corporate_id links each employee to the corporate company they belong to.
-- Earlier migrations create/extend this table; this no-op keeps history ordered.
SELECT 1;
