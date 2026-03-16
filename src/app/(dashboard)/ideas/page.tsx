import Link from 'next/link'
import { createServerClient, getTeamId } from '@/lib/supabase/server'
import { RegionChip } from '@/components/ui/RegionChip'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddIdeaModal } from '@/components/modals/AddIdeaModal'
import { VoteBar } from '@/components/ideas/VoteBar'
import type { Idea } from '@/types'

interface IdeaWithVotes extends Idea {
  vote_count: number
  upvotes: number
  downvotes: number
  user_vote: 1 | -1 | null
}

export default async function IdeasPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const teamId = await getTeamId(user.id)

  if (!teamId) return null

  const ideasResult = await supabase
    .from('ideas')
    .select('id, title, description, region, status, tags, added_by, created_at')
    .eq('team_id', teamId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(100)

  const ideas = (ideasResult.data ?? []) as Idea[]

  const ideaIds = ideas.map((i) => i.id)
  const votesResult = ideaIds.length > 0
    ? await supabase.from('idea_votes').select('idea_id, vote, user_id').in('idea_id', ideaIds)
    : { data: [] }

  const votes = votesResult.data ?? []

  const ideasWithVotes: IdeaWithVotes[] = ideas.map((idea) => {
    const ideaVotes = votes.filter((v) => v.idea_id === idea.id)
    const upvotes = ideaVotes.filter((v) => v.vote === 1).length
    const downvotes = ideaVotes.filter((v) => v.vote === -1).length
    const myVote = ideaVotes.find((v) => v.user_id === user.id)
    return {
      ...idea,
      vote_count: upvotes - downvotes,
      upvotes,
      downvotes,
      user_vote: myVote ? (myVote.vote as 1 | -1) : null,
    }
  })

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Instrument Serif, serif',
              fontWeight: 400,
              fontSize: '28px',
              color: 'var(--ink)',
            }}
          >
            Ideas <em style={{ fontStyle: 'italic', color: 'var(--ink3)' }}>Pipeline</em>
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '4px', letterSpacing: '0.3px' }}>
            AI business concepts — voted and ranked by the team
          </p>
        </div>
        <AddIdeaModal />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {['All', 'China', 'USA', 'Global', 'Top Voted'].map((label) => (
          <span
            key={label}
            style={{
              fontFamily: 'Geist Mono, monospace',
              fontSize: '11px',
              padding: '5px 12px',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              background: label === 'All' ? 'var(--ink)' : 'var(--surface)',
              color: label === 'All' ? 'var(--bg)' : 'var(--ink3)',
              cursor: 'pointer',
              letterSpacing: '0.3px',
            }}
          >
            {label}
          </span>
        ))}
        <span style={{ fontSize: '11px', color: 'var(--ink4)', marginLeft: 'auto' }}>
          {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Ideas grid */}
      {ideasWithVotes.length === 0 ? (
        <EmptyState message="No ideas yet. Log your first AI business concept." />
      ) : (
        <div
          data-testid="idea-list"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {ideasWithVotes.map((idea, idx) => (
            <Link
              key={idea.id}
              href={`/ideas/${idea.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
            <div
              data-testid="idea-card"
              className="card"
              style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'var(--idea)',
                  borderRadius: 'var(--radius) var(--radius) 0 0',
                }}
              />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <span
                  style={{
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: '28px',
                    color: 'var(--ink4)',
                    lineHeight: 1,
                    flexShrink: 0,
                    fontStyle: 'italic',
                  }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--ink)',
                    lineHeight: 1.3,
                    flex: 1,
                  }}
                >
                  {idea.title}
                </h3>
              </div>

              {idea.description && (
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--ink2)',
                    lineHeight: 1.65,
                    marginBottom: '12px',
                  }}
                >
                  {idea.description.slice(0, 200)}
                  {idea.description.length > 200 ? '…' : ''}
                </p>
              )}

              {/* Meta: region + tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px', alignItems: 'center' }}>
                <RegionChip region={idea.region} />
                {idea.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink3)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Vote bar */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px dashed var(--border)',
                }}
              >
                <span style={{ fontSize: '10px', color: 'var(--ink3)', marginRight: '4px', letterSpacing: '0.3px' }}>
                  VOTES
                </span>
                <VoteBar
                  ideaId={idea.id}
                  upvotes={idea.upvotes}
                  downvotes={idea.downvotes}
                  userVote={idea.user_vote}
                />
                <span
                  data-testid="vote-count"
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: '18px',
                    color: idea.vote_count > 0 ? 'var(--idea)' : idea.vote_count < 0 ? 'var(--china)' : 'var(--ink4)',
                  }}
                >
                  {idea.vote_count > 0 ? '+' : ''}{idea.vote_count}
                </span>
              </div>
            </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
