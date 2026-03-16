export type Region = 'china' | 'usa' | 'global'
export type EntityType = 'contact' | 'idea' | 'action' | 'note'
export type ActionStatus = 'open' | 'in_progress' | 'closed'
export type IdeaStatus = 'active' | 'archived'
export type ImportType = 'docx' | 'xlsx' | 'image'

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  initials: string
  color: string
  created_at: string
}

export interface Contact {
  id: string
  team_id: string
  added_by: string
  name: string
  role: string | null
  organization: string | null
  region: Region | null
  tags: string[]
  warmth: number
  email: string | null
  phone: string | null
  linkedin: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Idea {
  id: string
  team_id: string
  added_by: string
  title: string
  description: string | null
  region: Region | null
  status: IdeaStatus
  lead_contact_id: string | null
  tags: string[]
  created_at: string
  updated_at: string
  vote_count?: number
  user_vote?: number | null
}

export interface IdeaVote {
  id: string
  idea_id: string
  user_id: string
  vote: number
  created_at: string
}

export interface Action {
  id: string
  team_id: string
  added_by: string
  title: string
  description: string | null
  status: ActionStatus
  due_date: string | null
  assigned_to: string | null
  contact_id: string | null
  idea_id: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  team_id: string
  added_by: string
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  team_id: string
  added_by: string
  entity_type: EntityType
  entity_id: string
  content: string
  created_at: string
}

export interface ActivityLogEntry {
  id: string
  team_id: string
  user_id: string
  action: string
  entity_type: EntityType
  entity_id: string
  entity_name: string | null
  created_at: string
}

export interface Thesis {
  id: string
  team_id: string
  content: string
  generated_at: string
  created_by: string
}

export interface ImportHistory {
  id: string
  team_id: string
  imported_by: string
  file_name: string
  import_type: ImportType
  status: 'pending' | 'success' | 'error'
  result_entity_id: string | null
  error_message: string | null
  created_at: string
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string | Record<string, string[]>
}

export interface SearchResult {
  id: string
  entity_type: EntityType
  title: string
  subtitle: string | null
}

export const TEAM_MEMBERS: { initials: string; color: string }[] = [
  { initials: 'KT', color: '#c94040' },
  { initials: 'DZ', color: '#2a5ca8' },
  { initials: 'JW', color: '#2a7a4a' },
]
