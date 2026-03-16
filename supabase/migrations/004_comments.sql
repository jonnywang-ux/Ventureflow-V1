-- ============================================================
-- COMMENT ACTIVITY TRIGGER
-- Logs "commented on" into activity_log when a comment is created.
-- Uses SECURITY DEFINER to bypass the service_role-only INSERT policy
-- on activity_log. Entity name is resolved dynamically from the target table.
-- ============================================================

CREATE OR REPLACE FUNCTION log_comment_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_entity_name TEXT;
BEGIN
  -- Resolve entity name from the appropriate table
  CASE NEW.entity_type
    WHEN 'contact' THEN
      SELECT name INTO v_entity_name FROM contacts WHERE id = NEW.entity_id;
    WHEN 'idea' THEN
      SELECT title INTO v_entity_name FROM ideas WHERE id = NEW.entity_id;
    WHEN 'action' THEN
      SELECT title INTO v_entity_name FROM actions WHERE id = NEW.entity_id;
    WHEN 'note' THEN
      SELECT title INTO v_entity_name FROM notes WHERE id = NEW.entity_id;
    ELSE
      v_entity_name := NULL;
  END CASE;

  INSERT INTO activity_log (
    team_id,
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name
  ) VALUES (
    NEW.team_id,
    NEW.added_by,
    'commented on',
    NEW.entity_type,
    NEW.entity_id,
    v_entity_name
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_comment_activity
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION log_comment_activity();
