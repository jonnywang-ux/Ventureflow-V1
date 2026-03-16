-- Add file_path column to import_history
ALTER TABLE import_history ADD COLUMN file_path TEXT;

-- Drop existing import_type CHECK constraint
ALTER TABLE import_history DROP CONSTRAINT IF EXISTS import_history_import_type_check;

-- Add updated CHECK constraint that includes pdf and md
ALTER TABLE import_history ADD CONSTRAINT import_history_import_type_check
  CHECK (import_type IN ('docx', 'xlsx', 'image', 'pdf', 'md'));
