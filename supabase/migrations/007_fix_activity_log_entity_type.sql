-- Fix activity_log trigger: map plural table names to singular entity_type values
-- The check constraint requires: 'contact', 'idea', 'action', 'note'
-- But TG_TABLE_NAME returns: 'contacts', 'ideas', 'actions', 'notes'

CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_entity_name TEXT;
  v_action TEXT;
  v_entity_type TEXT;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
  END IF;

  -- Map plural table name to singular entity_type
  CASE TG_TABLE_NAME
    WHEN 'contacts' THEN v_entity_type := 'contact';
    WHEN 'ideas'    THEN v_entity_type := 'idea';
    WHEN 'actions'  THEN v_entity_type := 'action';
    WHEN 'notes'    THEN v_entity_type := 'note';
    ELSE                 v_entity_type := TG_TABLE_NAME;
  END CASE;

  -- Determine entity name based on table
  CASE TG_TABLE_NAME
    WHEN 'contacts' THEN v_entity_name := COALESCE(NEW.name, OLD.name);
    WHEN 'ideas'    THEN v_entity_name := COALESCE(NEW.title, OLD.title);
    WHEN 'actions'  THEN v_entity_name := COALESCE(NEW.title, OLD.title);
    WHEN 'notes'    THEN v_entity_name := COALESCE(NEW.title, OLD.title);
    ELSE                 v_entity_name := NULL;
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
    v_entity_type,
    COALESCE(NEW.id, OLD.id),
    v_entity_name
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
