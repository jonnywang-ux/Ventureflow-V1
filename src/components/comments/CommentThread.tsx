'use client'
import { useOptimistic, useRef, useState, useTransition } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { createComment, deleteComment } from '@/app/(dashboard)/[entity]/[id]/actions'
import type { Comment, EntityType, TeamMember } from '@/types'

interface CommentThreadProps {
  entityType: EntityType
  entityId: string
  initialComments: Comment[]
  currentUserId: string
  teamMembers: TeamMember[]
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function memberForUser(
  userId: string,
  teamMembers: TeamMember[],
): { initials: string; color: string } {
  const found = teamMembers.find((m) => m.user_id === userId)
  return found
    ? { initials: found.initials, color: found.color }
    : { initials: '??', color: '#b8b3ab' }
}

export function CommentThread({
  entityType,
  entityId,
  initialComments,
  currentUserId,
  teamMembers,
}: CommentThreadProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    initialComments,
    (state: Comment[], action: { type: 'add'; comment: Comment } | { type: 'delete'; id: string }) => {
      if (action.type === 'add') return [...state, action.comment]
      if (action.type === 'delete') return state.filter((c) => c.id !== action.id)
      return state
    },
  )

  function handleSubmit(formData: FormData) {
    const content = (formData.get('content') as string | null)?.trim()
    if (!content) return

    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      team_id: '',
      added_by: currentUserId,
      entity_type: entityType,
      entity_id: entityId,
      content,
      created_at: new Date().toISOString(),
    }

    setError(null)
    formRef.current?.reset()

    startTransition(async () => {
      addOptimisticComment({ type: 'add', comment: tempComment })
      const result = await createComment(formData)
      if (!result.success) {
        setError(typeof result.error === 'string' ? result.error : 'Failed to post comment')
      }
    })
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      addOptimisticComment({ type: 'delete', id: commentId })
      const result = await deleteComment(commentId)
      if (!result.success) {
        setError(typeof result.error === 'string' ? result.error : 'Failed to delete comment')
      }
    })
  }

  return (
    <div style={{ marginTop: '32px' }}>
      {/* Section header */}
      <div
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '11px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'var(--ink3)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        Discussion
        {optimisticComments.length > 0 && (
          <span
            style={{
              fontSize: '10px',
              padding: '1px 7px',
              borderRadius: '10px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--ink3)',
            }}
          >
            {optimisticComments.length}
          </span>
        )}
        <span style={{ flex: 1, height: '1px', background: 'var(--border)', display: 'block' }} />
      </div>

      {/* Comment list */}
      {optimisticComments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {optimisticComments.map((comment) => {
            const member = memberForUser(comment.added_by, teamMembers)
            const isOwn = comment.added_by === currentUserId

            return (
              <div
                key={comment.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  opacity: comment.id.startsWith('temp-') ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                <Avatar initials={member.initials} color={member.color} size={28} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '10px 12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 700,
                            fontSize: '11px',
                            color: member.color,
                            letterSpacing: '0.5px',
                          }}
                        >
                          {member.initials}
                        </span>
                        <span
                          style={{
                            fontFamily: 'Geist Mono, monospace',
                            fontSize: '10px',
                            color: 'var(--ink4)',
                          }}
                        >
                          {relativeTime(comment.created_at)}
                        </span>
                      </div>

                      {isOwn && !comment.id.startsWith('temp-') && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={isPending}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0 2px',
                            color: 'var(--ink4)',
                            fontSize: '14px',
                            lineHeight: 1,
                            opacity: isPending ? 0.5 : 1,
                          }}
                          aria-label="Delete comment"
                        >
                          x
                        </button>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--ink2)',
                        lineHeight: 1.65,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add comment form */}
      <form ref={formRef} action={handleSubmit}>
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityId" value={entityId} />

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          <textarea
            name="content"
            placeholder="Add a comment..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'Geist Mono, monospace',
              fontWeight: 300,
              fontSize: '12px',
              color: 'var(--ink)',
              background: 'transparent',
              lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg)',
            }}
          >
            {error ? (
              <span style={{ fontSize: '11px', color: 'var(--china)' }}>{error}</span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--ink4)' }}>
                {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
              </span>
            )}

            <button
              type="submit"
              disabled={isPending}
              style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.5px',
                padding: '6px 16px',
                borderRadius: '20px',
                border: 'none',
                background: isPending ? 'var(--ink4)' : 'var(--ink)',
                color: 'var(--bg)',
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {isPending ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
