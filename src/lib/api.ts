import type * as T from "./types";

/** The contract both MockApi (demo) and HttpApi (Worker) implement. Pages depend only on this. */
export interface Api {
  readonly mode: "mock" | "http";
  me(): Promise<{ user: { id: string; name: string; email: string }; org: T.Org; role: T.OrgRole }>;
  bots(): Promise<T.Bot[]>;
  bot(id: string): Promise<T.Bot>;
  updateBot(id: string, patch: Partial<T.Bot>): Promise<void>;
  masterDocument(botId: string): Promise<{ draft: T.MasterDocument; versions: T.DmVersion[] }>;
  saveMasterDocument(botId: string, draft: T.MasterDocument): Promise<void>;
  publish(botId: string, reason?: string): Promise<number>;
  sources(botId: string): Promise<T.KnowledgeSource[]>;
  addSource(botId: string, s: { kind: string; title: string; text: string }): Promise<T.KnowledgeSource>;
  deleteSource(botId: string, id: string): Promise<void>;
  channels(botId: string): Promise<T.Channel[]>;
  updateChannel(botId: string, id: string, patch: Partial<T.Channel>): Promise<void>;
  proposeChange(botId: string, instruction: string): Promise<T.ChangeRequest>;
  decideChange(botId: string, id: string, accepted: number[]): Promise<{ status: T.ChangeRequest["status"]; version?: number }>;
  changeRequests(botId?: string): Promise<T.ChangeRequest[]>;
  conversations(f: { bot_id?: string; status?: string; confidence?: string; q?: string; limit?: number; offset?: number }): Promise<{ items: T.Conversation[]; total: number }>;
  conversation(id: string): Promise<T.Conversation & { messages: T.Message[] }>;
  simulate(botId: string, history: { role: "user" | "assistant"; content: string }[]): Promise<ReadableStream<string>>;
  usage(days?: number): Promise<T.UsageSummary>;
  xray(botId?: string): Promise<T.XRay>;
  resolveUnanswered(id: string, answer: string): Promise<void>;
  alerts(): Promise<T.Alert[]>;
  ackAlert(id: string): Promise<void>;
  changelog(): Promise<T.ChangelogEntry[]>;
  members(): Promise<T.Member[]>;
  invite(email: string, role: T.OrgRole): Promise<void>;
  updateMember(userId: string, role: T.OrgRole): Promise<void>;
  removeMember(userId: string): Promise<void>;
  audit(limit?: number): Promise<T.AuditEntry[]>;
  invoices(): Promise<T.Invoice[]>;
  checkout(plan: T.PlanTier): Promise<{ url: string }>;
  portal(): Promise<{ url: string }>;
  dataRequests(): Promise<T.DataRequest[]>;
  createDataRequest(r: { type: T.DataRequest["type"]; requester_ref: string }): Promise<T.DataRequest>;
  retention(): Promise<T.RetentionPolicy>;
  saveRetention(p: T.RetentionPolicy): Promise<void>;
  apiKeys(): Promise<T.ApiKey[]>;
  createApiKey(k: { name: string; bot_id?: string; allowed_origins: string[] }): Promise<{ key: string } & T.ApiKey>;
  revokeApiKey(id: string): Promise<void>;
  exportAll(): Promise<Blob>;
}
