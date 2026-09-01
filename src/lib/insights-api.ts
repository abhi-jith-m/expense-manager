import type { Account, Budget, Category, Goal, RecurringTransaction, Transaction } from '@/types'

export type InsightType =
  | 'spending'
  | 'trend'
  | 'anomaly'
  | 'budget'
  | 'behavior'
  | 'savings'
  | 'recurring'
  | 'recommendation'

export type InsightSeverity = 'info' | 'positive' | 'warning' | 'critical'

export interface FinancialInsight {
  id: string
  type: InsightType
  title: string
  summary: string
  explanation: string
  severity: InsightSeverity
  confidence: number
  impact_score: number
  metrics: Record<string, number | string>
  category: string | null
  related_transaction_ids: string[]
  recommendation: string | null
  source?: 'deterministic' | 'llm'
}

export interface AnalyzeResponse {
  summary: string
  financial_health_summary: string
  insights: FinancialInsight[]
  metrics: Record<string, unknown>
  generated_at: string
  analysis_period: {
    start: string
    end: string
    comparison_start: string
    comparison_end: string
    label: string
  }
  used_fallback: boolean
  llm_available: boolean
}

export interface RelatedTransaction {
  id: string
  merchant: string
  amount: number
  date: string
  category: string | null
}

export interface ChatMetric {
  id: string
  label: string
  value: number
  previous: number | null
  change: number | null
  unit: 'money' | 'percent' | string
}

export interface VioChartSeries {
  type: 'line' | 'bar'
  points: Array<{ label: string; value: number }>
}

export interface VioChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  insights: FinancialInsight[]
  metrics: ChatMetric[]
  related_transactions: RelatedTransaction[]
  chart: VioChartSeries | null
  follow_ups: string[]
  grounding: string | null
  created_at: string
}

export interface ConversationSummary {
  id: string
  title: string
  updated_at: string
  message_count: number
}

export interface ConversationRecord {
  id: string
  title: string
  messages: VioChatMessage[]
  updated_at: string
}

export interface ChatResponse {
  conversation_id: string
  answer: string
  message: VioChatMessage | null
  insights: FinancialInsight[]
  metrics: Record<string, unknown>
  used_fallback: boolean
  empty_data: boolean
}

export interface FinanceSnapshotPayload {
  currency: string
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  budgets: Budget[]
  goals: Goal[]
  recurring: RecurringTransaction[]
}

const baseUrl = (import.meta.env.VITE_INSIGHTS_API_URL ?? '/api').replace(/\/$/, '')

function dataVersion(snapshot: FinanceSnapshotPayload): string {
  const stamps = [
    ...snapshot.transactions,
    ...snapshot.budgets,
    ...snapshot.accounts,
    ...snapshot.goals,
  ].map((item) => item.updatedAt)
  return `${stamps.sort().at(-1) ?? 'empty'}:${snapshot.transactions.length}`
}

export function insightsHeaders(accessToken: string, userId: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  }
}

export async function analyzeInsights(input: {
  accessToken: string
  userId: string
  startDate: string
  endDate: string
  snapshot: FinanceSnapshotPayload
}): Promise<AnalyzeResponse> {
  const response = await fetch(`${baseUrl}/insights/analyze`, {
    method: 'POST',
    headers: insightsHeaders(input.accessToken, input.userId),
    body: JSON.stringify({
      start_date: input.startDate,
      end_date: input.endDate,
      snapshot: input.snapshot,
      data_version: dataVersion(input.snapshot),
      currency: input.snapshot.currency,
    }),
  })
  if (!response.ok) throw new Error(await errorMessage(response))
  return response.json() as Promise<AnalyzeResponse>
}

export async function streamChatInsights(
  input: {
    accessToken: string
    userId: string
    message: string
    conversationId?: string
    startDate: string
    endDate: string
    snapshot: FinanceSnapshotPayload
    page?: string
  },
  onProgress?: (message: string) => void,
): Promise<ChatResponse> {
  const body = {
    message: input.message,
    conversation_id: input.conversationId,
    start_date: input.startDate,
    end_date: input.endDate,
    snapshot: input.snapshot,
    page: input.page,
  }
  try {
    const response = await fetch(`${baseUrl}/insights/chat/stream`, {
      method: 'POST',
      headers: insightsHeaders(input.accessToken, input.userId),
      body: JSON.stringify(body),
    })
    if (!response.ok || !response.body) throw new Error(await errorMessage(response))
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result: ChatResponse | null = null
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() ?? ''
      for (const chunk of chunks) {
        const event = chunk.match(/^event:\s*(\w+)/m)?.[1]
        const dataLine = chunk.split('\n').find((line) => line.startsWith('data:'))
        if (!dataLine) continue
        const data = JSON.parse(dataLine.replace(/^data:\s*/, '')) as ChatResponse & { message?: string }
        if (event === 'progress' && data.message) onProgress?.(String(data.message))
        if (event === 'complete') result = data
      }
    }
    if (result) return result
  } catch {
    /* Fall through to the non-streaming chat endpoint. */
  }
  return chatInsights(input)
}

export async function chatInsights(input: {
  accessToken: string
  userId: string
  message: string
  conversationId?: string
  startDate: string
  endDate: string
  snapshot: FinanceSnapshotPayload
  page?: string
}): Promise<ChatResponse> {
  const response = await fetch(`${baseUrl}/insights/chat`, {
    method: 'POST',
    headers: insightsHeaders(input.accessToken, input.userId),
    body: JSON.stringify({
      message: input.message,
      conversation_id: input.conversationId,
      start_date: input.startDate,
      end_date: input.endDate,
      snapshot: input.snapshot,
      page: input.page,
    }),
  })
  if (!response.ok) throw new Error(await errorMessage(response))
  return response.json() as Promise<ChatResponse>
}

export async function getLatestInsights(accessToken: string, userId: string): Promise<AnalyzeResponse | null> {
  const response = await fetch(`${baseUrl}/insights/latest`, {
    headers: insightsHeaders(accessToken, userId),
  })
  if (!response.ok) return null
  return response.json() as Promise<AnalyzeResponse | null>
}

export async function listVioConversations(accessToken: string, userId: string): Promise<ConversationSummary[]> {
  const response = await fetch(`${baseUrl}/insights/conversations`, {
    headers: insightsHeaders(accessToken, userId),
  })
  if (!response.ok) throw new Error(await errorMessage(response))
  return response.json() as Promise<ConversationSummary[]>
}

export async function getVioConversation(
  accessToken: string,
  userId: string,
  conversationId: string,
): Promise<ConversationRecord> {
  const response = await fetch(`${baseUrl}/insights/conversations/${conversationId}`, {
    headers: insightsHeaders(accessToken, userId),
  })
  if (!response.ok) throw new Error(await errorMessage(response))
  return response.json() as Promise<ConversationRecord>
}

export async function createVioConversation(accessToken: string, userId: string): Promise<ConversationRecord> {
  const response = await fetch(`${baseUrl}/insights/conversations`, {
    method: 'POST',
    headers: insightsHeaders(accessToken, userId),
  })
  if (!response.ok) throw new Error(await errorMessage(response))
  return response.json() as Promise<ConversationRecord>
}

export async function deleteVioConversation(accessToken: string, userId: string, conversationId: string): Promise<void> {
  const response = await fetch(`${baseUrl}/insights/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: insightsHeaders(accessToken, userId),
  })
  if (!response.ok) throw new Error(await errorMessage(response))
}

export async function sendInsightFeedback(input: {
  accessToken: string
  userId: string
  insightId: string
  feedback: 'helpful' | 'not_helpful' | 'not_relevant' | 'already_know'
}): Promise<void> {
  const response = await fetch(`${baseUrl}/insights/${input.insightId}/feedback`, {
    method: 'POST',
    headers: insightsHeaders(input.accessToken, input.userId),
    body: JSON.stringify({ feedback: input.feedback }),
  })
  if (!response.ok) throw new Error(await errorMessage(response))
}

export async function invalidateInsightsCache(accessToken: string, userId: string): Promise<void> {
  await fetch(`${baseUrl}/insights/cache/invalidate`, {
    method: 'POST',
    headers: insightsHeaders(accessToken, userId),
  })
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string }
    return body.detail ?? `Insights request failed (${response.status})`
  } catch {
    return `Insights request failed (${response.status})`
  }
}
