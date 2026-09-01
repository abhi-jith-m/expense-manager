import { useEffect, useRef } from 'react'
import { VioMessage } from '@/components/vio/VioMessage'
import { VioTypingIndicator } from '@/components/vio/VioTypingIndicator'
import type { VioChatMessage } from '@/lib/insights-api'

export function VioMessageList({
  messages,
  currency,
  loading,
  stage,
  onFollowUp,
}: {
  messages: VioChatMessage[]
  currency: string
  loading: boolean
  stage?: string
  onFollowUp: (value: string) => void
}) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
      {messages.map((message) => (
        <VioMessage key={message.id} message={message} currency={currency} onFollowUp={onFollowUp} />
      ))}
      {loading ? <VioTypingIndicator stage={stage} /> : null}
      <div ref={endRef} />
    </div>
  )
}
