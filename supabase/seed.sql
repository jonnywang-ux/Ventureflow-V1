-- ============================================================
-- SEED DATA — local development only
-- Run AFTER creating auth users in Supabase dashboard:
--   KT user, DZ user, JW user
-- Then update the UUIDs below to match your actual auth user IDs.
-- ============================================================

-- Replace these with your actual Supabase auth user IDs
DO $$
DECLARE
  v_team_id UUID;
  v_kt_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- replace
  v_dz_user_id UUID := '00000000-0000-0000-0000-000000000002'; -- replace
  v_jw_user_id UUID := '00000000-0000-0000-0000-000000000003'; -- replace
  v_contact_1 UUID;
  v_contact_2 UUID;
  v_idea_1 UUID;
  v_idea_2 UUID;
BEGIN

  -- Create team
  INSERT INTO teams (name) VALUES ('Gunung Capital') RETURNING id INTO v_team_id;

  -- Create team members
  INSERT INTO team_members (team_id, user_id, initials, color) VALUES
    (v_team_id, v_kt_user_id, 'KT', '#c94040'),
    (v_team_id, v_dz_user_id, 'DZ', '#2a5ca8'),
    (v_team_id, v_jw_user_id, 'JW', '#2a7a4a');

  -- Contacts
  INSERT INTO contacts (team_id, added_by, name, role, organization, region, tags, warmth, email)
  VALUES
    (v_team_id, v_kt_user_id, 'Li Wei', 'Partner', 'Sequoia China', 'china', ARRAY['VC', 'AI', 'Series A'], 4, 'liwei@sequoiacap.com')
    RETURNING id INTO v_contact_1;

  INSERT INTO contacts (team_id, added_by, name, role, organization, region, tags, warmth, email)
  VALUES
    (v_team_id, v_dz_user_id, 'Sarah Chen', 'CEO', 'AgroBot', 'usa', ARRAY['founder', 'robotics', 'agri-tech'], 3, 'sarah@agrobot.ai')
    RETURNING id INTO v_contact_2;

  INSERT INTO contacts (team_id, added_by, name, role, organization, region, tags, warmth)
  VALUES
    (v_team_id, v_jw_user_id, 'Zhang Min', 'Director', 'CITIC Capital', 'china', ARRAY['LP', 'state-backed', 'infra'], 2),
    (v_team_id, v_kt_user_id, 'Marcus Lee', 'Founder', 'NeuralTrade', 'usa', ARRAY['founder', 'fintech', 'AI'], 5),
    (v_team_id, v_dz_user_id, 'Wang Fang', 'CTO', 'DeepManufacture', 'china', ARRAY['founder', 'hardware', 'robotics'], 3);

  -- Ideas
  INSERT INTO ideas (team_id, added_by, title, description, region, tags, lead_contact_id)
  VALUES
    (v_team_id, v_kt_user_id, 'AI-driven precision agriculture in SE Asia', 'Robot-guided crop monitoring reducing labor cost by 60%. Potential Series A lead.', 'global', ARRAY['agri-tech', 'robotics', 'Series A'], v_contact_2)
    RETURNING id INTO v_idea_1;

  INSERT INTO ideas (team_id, added_by, title, description, region, tags)
  VALUES
    (v_team_id, v_dz_user_id, 'China EV supply chain intelligence platform', 'Real-time visibility into Tier 2/3 suppliers for OEMs. Huge moat if first mover.', 'china', ARRAY['logistics', 'EV', 'SaaS'])
    RETURNING id INTO v_idea_2;

  INSERT INTO ideas (team_id, added_by, title, description, region, tags)
  VALUES
    (v_team_id, v_jw_user_id, 'Cross-border AI compliance tooling', 'Automated PIPL + GDPR compliance for companies operating in both markets.', 'global', ARRAY['compliance', 'AI', 'B2B SaaS']);

  -- Votes
  INSERT INTO idea_votes (idea_id, user_id, vote) VALUES
    (v_idea_1, v_kt_user_id, 1),
    (v_idea_1, v_dz_user_id, 1),
    (v_idea_2, v_kt_user_id, 1),
    (v_idea_2, v_jw_user_id, -1);

  -- Actions
  INSERT INTO actions (team_id, added_by, title, description, status, assigned_to, contact_id)
  VALUES
    (v_team_id, v_kt_user_id, 'Schedule intro call with Li Wei', 'Warm intro via David at Matrix. CC DZ.', 'open', v_kt_user_id, v_contact_1),
    (v_team_id, v_dz_user_id, 'Request AgroBot pitch deck', 'Follow up from Shanghai AI Summit meeting.', 'in_progress', v_dz_user_id, v_contact_2),
    (v_team_id, v_jw_user_id, 'Research PIPL enforcement cases Q1 2026', 'Build context before next board meeting.', 'open', v_jw_user_id, NULL),
    (v_team_id, v_kt_user_id, 'Review NeuralTrade financials', '2025 ARR reportedly $4M. Verify growth rate.', 'open', v_kt_user_id, NULL);

  -- Notes
  INSERT INTO notes (team_id, added_by, title, content, tags)
  VALUES
    (v_team_id, v_kt_user_id, 'Shanghai AI Summit 2026 — Field Notes',
     'Key themes: (1) Foundation model commoditization accelerating. (2) Edge inference driving new hardware demand. (3) Regulatory clarity on AI-generated content expected H2 2026. Met 12 founders, 3 worth following up.',
     ARRAY['conference', 'Shanghai', 'AI']),
    (v_team_id, v_dz_user_id, 'China EV Supply Chain — Thesis Draft',
     'The smart money is moving from OEMs to Tier 2/3 suppliers. Visibility into these networks is near zero today. First mover with strong data moat could command 10x revenue multiple.',
     ARRAY['thesis', 'EV', 'china']),
    (v_team_id, v_jw_user_id, 'Competitive Map — Agri-Tech Robotics',
     'Key players: Agtonomy (US, $40M Series B), FarmWise (US, acquired by CNH), DJI Agriculture (China, dominant drones). Whitespace: multi-crop harvesting robots for Southeast Asia smallholders.',
     ARRAY['research', 'agri-tech', 'competitive']);

END $$;
