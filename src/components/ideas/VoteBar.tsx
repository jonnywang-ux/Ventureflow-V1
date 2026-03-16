'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { voteOnIdea } from '@/app/(dashboard)/ideas/actions'

interface Props {
  ideaId: string
  upvotes: number
  downvotes: number
  userVote: 1 | -1 | null
}

export function VoteBar({ ideaId, upvotes, downvotes, userVote }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleVote(vote: 1 | -1) {
    startTransition(async () => {
      await voteOnIdea(ideaId, vote)
      router.refresh()
    })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        data-testid="upvote-btn"
        onClick={() => handleVote(1)}
        disabled={isPending}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: userVote === 1 ? 'var(--idea)' : 'transparent',
          color: userVote === 1 ? 'var(--bg)' : 'var(--ink3)',
          fontSize: '11px',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          cursor: isPending ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        <span style={{ fontSize: '13px', lineHeight: 1 }}>+</span>
        {upvotes}
      </button>

      <button
        data-testid="downvote-btn"
        onClick={() => handleVote(-1)}
        disabled={isPending}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: userVote === -1 ? 'var(--china)' : 'transparent',
          color: userVote === -1 ? 'var(--bg)' : 'var(--ink3)',
          fontSize: '11px',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          cursor: isPending ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        <span style={{ fontSize: '13px', lineHeight: 1 }}>−</span>
        {downvotes}
      </button>
    </div>
  )
}
