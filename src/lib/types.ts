// Mirrors apps/api types (Botsy-docs) — keep in sync.
export type OrgRole = "owner" | "admin" | "editor" | "viewer";
export type PlanTier = "inicio" | "crecimiento" | "equipo" | "corporativo";
export type BotStatus = "draft" | "active" | "paused" | "archived";
export type ChannelType = "web" | "whatsapp" | "email" | "voice" | "sms";
export type Confidence = "green" | "yellow" | "red";
export type ConversationStatus = "open" | "resolved_by_bot" | "escalated" | "resolved_by_human" | "abandoned";

export interface MasterDocument {
  identity: { name: string; company: string; persona: string; locale: string };
  objective: string;
  scope: { in: string[]; out: string[] };
  tone: { register: "tú" | "usted"; style: string; max_sentences: number; emojis: boolean };
  hard_rules: string[];
  escalation: { triggers: string[]; summary_to: string; hours: string };
  data_policy: { may_collect: string[]; never_collect: string[]; privacy_notice_url: string };
  sources: { title: string; priority: number }[];
  kpi: { name: string; target: number };
}

export interface Org { id: string; name: string; plan: PlanTier; monthly_conversation_budget: number; overage_allowed: boolean; rfc?: string; billing_email?: string }
export interface Member { user_id: string; display_name: string; email: string; role: OrgRole; mfa: boolean; last_login?: string }
export interface Bot { id: string; org_id: string; name: string; service_code: string; status: BotStatus; model: string; provider: string; language: string; published_version: number; kpi_name?: string; kpi_target?: number; kpi_current?: number; created_at: string }
export interface DmVersion { version: number; reason?: string; published_at: string; published_by?: string }
export interface KnowledgeSource { id: string; bot_id: string; kind: string; title: string; status: "uploaded" | "processing" | "ready" | "failed"; error?: string; chunk_count: number; sample_questions: string[]; priority: number; created_at: string }
export interface Channel { id: string; bot_id: string; type: ChannelType; enabled: boolean; ai_disclosure_confirmed: boolean; privacy_notice_url?: string; config: Record<string, unknown> }
export interface Conversation { id: string; bot_id: string; channel_type: ChannelType; status: ConversationStatus; confidence?: Confidence; topic?: string; sentiment?: "positive" | "neutral" | "negative"; resolved_by_bot?: boolean; turns: number; total_cost_usd: number; started_at: string; ended_at?: string; escalated_at?: string; handoff_summary?: string; end_user_ref?: string }
export interface Message { id: number; role: "user" | "assistant" | "system" | "human_agent"; content: string; sources?: { source_id: string; title: string }[]; confidence?: Confidence; hard_rule_triggered?: number; tokens_in?: number; tokens_out?: number; model?: string; cost_usd?: number; latency_ms?: number; created_at: string }
export interface ProposedChange { target: string; before: string; after: string; reason: string; accepted?: boolean }
export interface ChangeRequest { id: string; bot_id: string; instruction: string; proposal: ProposedChange[]; status: "pending" | "approved" | "rejected" | "partially_approved"; created_at: string; decided_at?: string; resulting_version?: number; requested_by?: string }
export interface UsageDay { day: string; conversations: number; tokens_in: number; tokens_out: number; cost_mxn: number }
export interface UsageSummary { series: UsageDay[]; totals: { conversations: number; cost_mxn: number; tokens_in: number; tokens_out: number }; period: { used: number; included: number; overage_price_mxn: number; start: string; end: string; plan: PlanTier; extra_seats: number } }
export interface XRay { topics: { topic: string; conversations: number; resolution_rate: number; negative_rate: number }[]; unanswered: { id: string; bot_id: string; question: string; occurrences: number; suggested_answer?: string; created_at: string }[]; insights: string[] }
export interface Alert { id: string; bot_id?: string; severity: "info" | "warning" | "critical"; kind: string; title: string; body?: string; created_at: string; acknowledged_at?: string }
export interface AuditEntry { id: number; actor: string; actor_type: string; action: string; object_type?: string; object_id?: string; details?: Record<string, unknown>; ip?: string; created_at: string }
export interface Invoice { id: string; amount_mxn: number; status: string; period_start: string; period_end: string; pdf_url?: string; cfdi_uuid?: string }
export interface DataRequest { id: string; type: "access" | "rectification" | "cancellation" | "opposition"; requester_ref: string; status: "received" | "in_progress" | "completed" | "denied"; due_at: string; created_at: string }
export interface RetentionPolicy { transcript_days: number; redact_pii_before_llm: boolean; store_sensitive: boolean; voice_recordings: boolean }
export interface ApiKey { id: string; bot_id?: string; name: string; key_prefix: string; scopes: string[]; allowed_origins: string[]; last_used_at?: string; created_at: string }
export interface ChangelogEntry { id: string; bot_id: string; bot_name: string; version: number; reason: string; actor: string; at: string; changes: number }
