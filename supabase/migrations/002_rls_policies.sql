-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- Team isolation: users only access data from their own team
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE thesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's team_id
CREATE OR REPLACE FUNCTION get_user_team_id()
RETURNS UUID AS $$
  SELECT team_id FROM team_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- TEAMS
-- ============================================================

CREATE POLICY "team_members_can_view_team" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- TEAM MEMBERS
-- ============================================================

CREATE POLICY "team_access" ON team_members
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- CONTACTS
-- ============================================================

CREATE POLICY "team_access" ON contacts
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- IDEAS
-- ============================================================

CREATE POLICY "team_access" ON ideas
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- IDEA VOTES
-- ============================================================

-- Users can view all votes for ideas in their team
CREATE POLICY "team_can_view_votes" ON idea_votes
  FOR SELECT USING (
    idea_id IN (
      SELECT id FROM ideas WHERE team_id = get_user_team_id()
    )
  );

-- Users can only insert/update/delete their own votes
CREATE POLICY "user_can_manage_own_votes" ON idea_votes
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- ACTIONS
-- ============================================================

CREATE POLICY "team_access" ON actions
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- NOTES
-- ============================================================

CREATE POLICY "team_access" ON notes
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- COMMENTS
-- ============================================================

CREATE POLICY "team_access" ON comments
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- ACTIVITY LOG
-- ============================================================

-- Read-only for team members; only triggers write to this table
CREATE POLICY "team_can_view_activity" ON activity_log
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- Only the service role can insert (via triggers)
CREATE POLICY "service_role_insert_activity" ON activity_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- THESIS
-- ============================================================

CREATE POLICY "team_access" ON thesis
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- IMPORT HISTORY
-- ============================================================

CREATE POLICY "team_access" ON import_history
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );
