-- Fix infinite recursion in team_members RLS policy
-- The original policy references team_members within a team_members policy,
-- causing PostgreSQL to recurse infinitely.
-- Solution: use a SECURITY DEFINER function to bypass RLS when looking up the caller's team_id.

CREATE OR REPLACE FUNCTION public.get_auth_team_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT team_id FROM team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Replace the self-referential policy with one that calls the helper function
DROP POLICY IF EXISTS "team_access" ON team_members;

CREATE POLICY "team_access" ON team_members
  FOR ALL USING (team_id = public.get_auth_team_id());
