-- Expand import_type to support pdf and md, add file_path column

ALTER TABLE import_history
  ADD COLUMN IF NOT EXISTS file_path TEXT;

ALTER TABLE import_history
  DROP CONSTRAINT IF EXISTS import_history_import_type_check;

ALTER TABLE import_history
  ADD CONSTRAINT import_history_import_type_check
    CHECK (import_type IN ('docx', 'xlsx', 'image', 'pdf', 'md'));
