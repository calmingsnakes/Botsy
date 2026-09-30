import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Api } from "../lib/api";
import { getApi } from "../lib";
import { useSession } from "../lib/session";

// ---------- API context ----------
const ApiCtx = createContext<Api | null>(null);
export function ApiProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [api, setApi] = useState<Api | null>(null);
  useEffect(() => { if (status !== "loading") getApi().then(setApi); }, [status]);
  if (!api) return <div className="content"><p className="muted">Cargando…</p></div>;
  return <ApiCtx.Provider value={api}>{children}</ApiCtx.Provider>;
}
export function useApi(): Api { const a = useContext(ApiCtx); if (!a) throw new Error("ApiProvider missing"); return a; }

// ---------- data hook ----------
export function useData<X>(loader: (api: Api) => Promise<X>, deps: unknown[] = []) {
  const api = useApi();
  const [data, setData] = useState<X | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let on = true;
    setError(null); setLoading(true);
    loader(api).then((d) => on && setData(d)).catch((e) => on && setError(e.message)).finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [api, tick, ...deps]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload, setData };
}

// ---------- toasts ----------
type Toast = { id: number; text: string; kind: "ok" | "err" };
const ToastCtx = createContext<(text: string, kind?: Toast["kind"]) => void>(() => {});
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setItems((t) => [...t, { id, text, kind }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return <ToastCtx.Provider value={push}>{children}<div className="toast-wrap" aria-live="polite">{items.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}</div></ToastCtx.Provider>;
}
export const useToast = () => useContext(ToastCtx);

// ---------- primitives ----------
export function Badge({ children, tone = "" }: { children: React.ReactNode; tone?: "" | "green" | "amber" | "red" | "rosa" | "gray" }) { return <span className={`badge ${tone}`}>{children}</span>; }
export function Skeleton({ w = "100%", h = 14 }: { w?: number | string; h?: number }) {
  return <span className="sk" style={{ width: w, height: h, display: "block" }} aria-hidden />;
}
export function ErrorNote({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div className="err-note" role="alert">
      <span>No se pudo cargar: {error}</span>
      <button className="btn sm" onClick={retry}>Reintentar</button>
    </div>
  );
}
export function Stat({ label, value, delta, up, spark, to }: { label: string; value: React.ReactNode; delta?: string; up?: boolean | null; spark?: number[]; to?: string }) {
  const body = (
    <div className="card stat">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      {delta && <span className={`delta ${up === true ? "up" : up === false ? "down" : ""}`}>{delta}</span>}
      {spark && spark.length > 1 && <Sparkline values={spark} />}
    </div>
  );
  return to ? <Link to={to} className="stat-link">{body}</Link> : body;
}
export function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`).join(" ");
  return (
    <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} />
    </svg>
  );
}
const fmtDayShort = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
/** Daily bar chart: auto-scaled, hover tooltip, dashed gridlines, today highlighted. */
export function BarChart({ data, ariaLabel, height = 140 }: { data: { day: string; value: number }[]; ariaLabel?: string; height?: number }) {
  const [hov, setHov] = useState<number | null>(null);
  if (!data.length) return <Empty title="Sin datos todavía" />;
  const max = Math.max(...data.map((d) => d.value), 1);
  const nice = Math.max(50, Math.ceil((max * 1.08) / 50) * 50);
  const n = data.length;
  return (
    <div className="chart" role="img" aria-label={ariaLabel}>
      <div className="frame" style={{ height }}>
        <div className="grid" aria-hidden>
          {[0.5, 1].map((f) => <span key={f} className="gline" style={{ bottom: `${f * 100}%` }}><em>{fmtN(Math.round(nice * f))}</em></span>)}
        </div>
        <div className="plot" onMouseLeave={() => setHov(null)}>
          {data.map((d, i) => (
            <div key={d.day}
              className={`col ${i === n - 1 ? "today" : ""} ${hov === i ? "hov" : ""}`}
              style={{ height: `${(d.value / nice) * 100}%` }}
              onMouseEnter={() => setHov(i)} />
          ))}
          {hov !== null && (
            <div className="tip" style={{ left: `${Math.min(88, Math.max(12, ((hov + 0.5) / n) * 100))}%` }}>
              {fmtDayShort(data[hov].day)} · <b>{fmtN(data[hov].value)}</b>
            </div>
          )}
        </div>
      </div>
      <div className="xaxis" aria-hidden>
        <span>{fmtDayShort(data[0].day)}</span>
        <span>{fmtDayShort(data[Math.floor(n / 2)].day)}</span>
        <span>hoy</span>
      </div>
    </div>
  );
}
export function Empty({ title, children }: { title: string; children?: React.ReactNode }) { return <div className="empty"><b>{title}</b>{children}</div>; }
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return <div className="modal-bg" onClick={onClose}><div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}><div className="row between" style={{ marginBottom: 14 }}><h2>{title}</h2><button className="btn sm" onClick={onClose}>Cerrar</button></div>{children}</div></div>;
}
export function Confidence({ level }: { level?: "green" | "yellow" | "red" }) {
  const map = { green: ["green", "Con fuente"], yellow: ["amber", "Sin fuente clara"], red: ["red", "No supo"] } as const;
  if (!level) return <Badge tone="gray">—</Badge>;
  const [tone, label] = map[level];
  return <Badge tone={tone}><i className={`dot ${tone}`} />{label}</Badge>;
}
export function StatusBadge({ s }: { s: string }) {
  const map: Record<string, [string, "" | "green" | "amber" | "red" | "rosa" | "gray"]> = {
    resolved_by_bot: ["Resuelta por el bot", "green"], escalated: ["Escalada a humano", "rosa"], resolved_by_human: ["Resuelta por humano", ""], abandoned: ["Abandonada", "gray"], open: ["Abierta", "amber"],
    active: ["Activo", "green"], draft: ["Borrador", "amber"], paused: ["Pausado", "gray"], archived: ["Archivado", "gray"],
    ready: ["Listo", "green"], processing: ["Entendiendo…", "amber"], uploaded: ["Leyendo…", "amber"], failed: ["No pude leerlo", "red"],
    pending: ["Pendiente", "amber"], approved: ["Aprobado", "green"], rejected: ["Rechazado", "gray"], partially_approved: ["Parcial", ""],
    paid: ["Pagada", "green"], open_invoice: ["Pendiente", "amber"], received: ["Recibida", "amber"], in_progress: ["En proceso", ""], completed: ["Completada", "green"], denied: ["Negada", "gray"],
  };
  const [label, tone] = map[s] ?? [s, "gray"];
  return <Badge tone={tone}>{label}</Badge>;
}
export const fmtMXN = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: n < 10 ? 2 : 0 }).format(n);
export const fmtN = (n: number) => new Intl.NumberFormat("es-MX").format(n);
export const fmtDate = (s: string) => new Date(s).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
export const fmtDay = (s: string) => new Date(s).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
export const ago = (s: string) => { const m = Math.round((Date.now() - new Date(s).getTime()) / 60000); if (m < 60) return `hace ${m} min`; const h = Math.round(m / 60); if (h < 48) return `hace ${h} h`; return `hace ${Math.round(h / 24)} días`; };
export const CHANNEL_LABEL: Record<string, string> = { web: "Web", whatsapp: "WhatsApp", email: "Correo", voice: "Teléfono", sms: "SMS" };
export const SERVICE_LABEL: Record<string, string> = { "SVC-01": "Recepcionista 24/7", "SVC-02": "Pedidos y devoluciones", "SVC-03": "Soporte por correo", "SVC-04": "Onboarding de producto", "SVC-05": "Calificador de leads", "SVC-06": "Cotizador", "SVC-07": "Postventa", "SVC-08": "Recordatorios", "SVC-09": "Agenda por voz", "SVC-10": "FAQ interno", "SVC-11": "TI nivel 0", "SVC-12": "Entrenador: atención", "SVC-13": "Entrenador: ventas", "SVC-14": "Inducción", "SVC-15": "Brigadas y emergencias", "SVC-16": "Simulacro guiado", "SVC-17": "Actualizador de protocolos", "SVC-18": "Rayos X", "SVC-19": "Marca blanca", "SVC-20": "Corporativo" };
