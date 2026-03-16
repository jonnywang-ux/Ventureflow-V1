-- ============================================================
-- ACTIVITY LOG TRIGGERS
-- Auto-populate activity_log on insert/update/delete
-- Uses SECURITY DEFINER to bypass RLS (service-role writes only)
-- ============================================================

CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_entity_name TEXT;
  v_action TEXT;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
  END IF;

  -- Determine entity name based on table
  CASE TG_TABLE_NAME
    WHEN 'contacts' THEN
      v_entity_name := COALESCE(NEW.name, OLD.name);
    WHEN 'ideas' THEN
      v_entity_name := COALESCE(NEW.title, OLD.title);
    WHEN 'actions' THEN
      v_entity_name := COALESCE(NEW.title, OLD.title);
    WHEN 'notes' THEN
      v_entity_name := COALESCE(NEW.title, OLD.title);
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
    COALESCE(NEW.team_id, OLD.team_id),
    COALESCE(NEW.added_by, OLD.added_by),
    v_action,
    TG_TABLE_NAME::TEXT,
    COALESCE(NEW.id, OLD.id),
    v_entity_name
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to each entity table

CREATE TRIGGER log_contact_activity
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_idea_activity
  AFTER INSERT OR UPDATE OR DELETE ON ideas
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_action_activity
  AFTER INSERT OR UPDATE OR DELETE ON actions
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_note_activity
  AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW EXECUTE FUNCTION log_activity();
