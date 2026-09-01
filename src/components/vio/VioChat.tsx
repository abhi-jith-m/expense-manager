import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { VioHeader } from '@/components/vio/VioHeader'
import { VioHistory } from '@/components/vio/VioHistory'
import { VioInput } from '@/components/vio/VioInput'
import { VioMessageList } from '@/components/vio/VioMessageList'
import { VioSuggestions } from '@/components/vio/VioSuggestions'
import { nextVioStage } from '@/components/vio/VioTypingIndicator'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useVio } from '@/contexts/vio-context'
import { useFinanceSnapshot } from '@/hooks/use-insights'
import { defaultMonthRange, toISODate } from '@/lib/dates'
import {
  createVioConversation,
  deleteVioConversation,
  getVioConversation,
  listVioConversations,
  streamChatInsights,
  type ConversationSummary,
  type VioChatMessage,
} from '@/lib/insights-api'
import { vioPageId, vioSuggestions } from '@/lib/vio-context'

export function VioChat() {
  const { open, closeVio, pendingPrompt, clearPendingPrompt } = useVio()
  const { session, user } = useAuth()
  const snapshot = useFinanceSnapshot()
  const location = useLocation()
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<VioChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [history, setHistory] = useState<ConversationSummary[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [stage, setStage] = useState('Analyzing your spending...')
  const [lastFailed, setLastFailed] = useState<string | null>(null)
  const range = useMemo(() => defaultMonthRange(), [])
  const suggestions = vioSuggestions(location.pathname)
  const emptyData = (snapshot?.transactions.length ?? 0) === 0
  const loadingRef = useRef(false)
  loadingRef.current = loading

  useEffect(() => {
    if (!session || !user) return
    void listVioConversations(session.accessToken, user.id).then(setHistory).catch(() => undefined)
  }, [conversationId, messages.length, session, user])

  useEffect(() => {
    if (!loading) return
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setStage(nextVioStage(index))
    }, 1400)
    return () => window.clearInterval(timer)
  }, [loading])

  const send = useCallback(
    async (text: string) => {
      if (!session || !user || !snapshot || !text.trim() || loadingRef.current) return
      const content = text.trim()
      setDraft('')
      setError(false)
      setLastFailed(content)
      const userMessage: VioChatMessage = {
        id: `local-${Date.now()}`,
        role: 'user',
        content,
        insights: [],
        metrics: [],
        related_transactions: [],
        chart: null,
        follow_ups: [],
        grounding: null,
        created_at: new Date().toISOString(),
      }
      setMessages((current) => [...current, userMessage])
      setLoading(true)
      setStage('Analyzing your spending...')
      try {
        const result = await streamChatInsights(
          {
            accessToken: session.accessToken,
            userId: user.id,
            message: content,
            conversationId: conversationId ?? undefined,
            startDate: toISODate(range.from),
            endDate: toISODate(range.to),
            snapshot,
            page: vioPageId(location.pathname),
          },
          (progress) => setStage(progress),
        )
        setConversationId(result.conversation_id)
        if (result.message) setMessages((current) => [...current, result.message!])
        setLastFailed(null)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    },
    [conversationId, location.pathname, range.from, range.to, session, snapshot, user],
  )

  const pendingRef = useRef<string | null>(null)
  useEffect(() => {
    if (!pendingPrompt) {
      pendingRef.current = null
      return
    }
    if (!open || !snapshot) return
    if (pendingRef.current === pendingPrompt) return
    pendingRef.current = pendingPrompt
    clearPendingPrompt()
    void send(pendingPrompt)
  }, [clearPendingPrompt, open, pendingPrompt, send, snapshot])

  async function startNew() {
    if (session && user) {
      const created = await createVioConversation(session.accessToken, user.id)
      setConversationId(created.id)
    } else {
      setConversationId(null)
    }
    setMessages([])
    setHistoryOpen(false)
    setError(false)
    pendingRef.current = null
  }

  async function openConversation(id: string) {
    if (!session || !user) return
    const record = await getVioConversation(session.accessToken, user.id, id)
    setConversationId(record.id)
    setMessages(record.messages)
    setHistoryOpen(false)
  }

  async function removeConversation(id: string) {
    if (!session || !user) return
    await deleteVioConversation(session.accessToken, user.id, id)
    setHistory((current) => current.filter((item) => item.id !== id))
    if (conversationId === id) {
      setConversationId(null)
      setMessages([])
    }
  }

  return (
    <>
      <VioHeader
        historyOpen={historyOpen}
        onToggleHistory={() => setHistoryOpen((value) => !value)}
        onNew={() => void startNew()}
        onClose={closeVio}
      />
      {historyOpen ? (
        <VioHistory
          items={history}
          activeId={conversationId}
          onSelect={(id) => void openConversation(id)}
          onDelete={(id) => void removeConversation(id)}
        />
      ) : null}

      {messages.length === 0 && !loading ? (
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-6">
          <div className="space-y-3">
            <span className="flex size-10 items-center justify-center rounded-[12px] bg-primary/12 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div className="space-y-2">
              <p className="text-base font-medium">Hey, I'm Vio.</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                I can help you understand your spending, spot unusual patterns, and make sense of your finances.
              </p>
              <p className="text-sm">What would you like to know?</p>
            </div>
          </div>
          {emptyData ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                I don't have enough data to answer that yet. Add a few transactions or import your history, and I'll start
                finding patterns for you.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { closeVio(); navigate('/expenses') }}>
                  Add Expense
                </Button>
                <Button size="sm" variant="outline" onClick={() => { closeVio(); navigate('/import-export') }}>
                  Import Transactions
                </Button>
              </div>
            </div>
          ) : (
            <VioSuggestions suggestions={suggestions.slice(0, 4)} onSelect={(value) => void send(value)} />
          )}
        </div>
      ) : (
        <VioMessageList
          messages={messages}
          currency={user?.currency ?? snapshot?.currency ?? 'USD'}
          loading={loading}
          stage={stage}
          onFollowUp={(value) => void send(value)}
        />
      )}

      {error ? (
        <div className="px-4 pb-2">
          <p className="text-sm text-muted-foreground">I couldn't analyze your finances right now. Please try again in a moment.</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => lastFailed && void send(lastFailed)}>
            Try again
          </Button>
        </div>
      ) : null}

      <VioInput value={draft} onChange={setDraft} disabled={loading} onSend={() => void send(draft)} />
    </>
  )
}
