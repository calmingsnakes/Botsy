import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Api } from "../lib/api";
import { getApi } from "../lib";

// ---------- API context ----------
const ApiCtx = createContext<Api | null>(null);
export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [api, setApi] = useState<Api | null>(null);
  useEffect(() => { getApi().then(setApi); }, []);
  if (!api) return <div className="content"><p className="muted">Cargando…</p></div>;
  return <ApiCtx.Provider value={api}>{children}</ApiCtx.Provider>;
}
export function useApi(): Api { const a = useContext(ApiCtx); if (!a) throw new Error("ApiProvider missing"); return a; }

// ---------- data hook ----------
export function useData<X>(loader: (api: Api) => Promise<X>, deps: unknown[] = []) {
  const api = useApi();
  const [data, setData] = useState<X | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { let on = true; setError(null); loader(api).then((d) => on && setData(d)).catch((e) => on && setError(e.message)); return () => { on = false; }; }, [api, tick, ...deps]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, reload, setData };
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
export function Stat({ label, value, delta, up }: { label: string; value: React.ReactNode; delta?: string; up?: boolean | null }) {
  return <div className="card stat"><span className="label">{label}</span><span className="value">{value}</span>{delta && <span className={`delta ${up === true ? "up" : up === false ? "down" : ""}`}>{delta}</span>}</div>;
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
