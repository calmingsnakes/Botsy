import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, CHANNEL_LABEL, Confidence, Modal, StatusBadge, fmtDate, fmtMXN, useApi, useData, useToast } from "../components/ui";

export function Conversations() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState<{ bot_id?: string; status?: string; confidence?: string; q?: string }>({});
  const { data: bots } = useData((a) => a.bots());
  const { data } = useData((a) => a.conversations({ ...f, limit: 50 }), [JSON.stringify(f)]);
  const botName = (b: string) => bots?.find((x) => x.id === b)?.name ?? b;
  return (
    <>
      <div className="page-head"><div><h1>Conversaciones</h1><p>Todas las conversaciones de todos tus bots y canales. El semáforo te dice si el bot respondió con fuente, sin fuente clara, o no supo.</p></div>
        <button className="btn" onClick={() => alert("Exportación CSV disponible en la versión conectada.")}>Exportar CSV</button></div>
      <div className="card row">
        <input className="input" style={{ maxWidth: 260 }} placeholder="Buscar tema o folio…" value={f.q ?? ""} onChange={(e) => setF({ ...f, q: e.target.value || undefined })} />
        <select className="select" style={{ maxWidth: 220 }} value={f.bot_id ?? ""} onChange={(e) => setF({ ...f, bot_id: e.target.value || undefined })}><option value="">Todos los bots</option>{bots?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <select className="select" style={{ maxWidth: 200 }} value={f.status ?? ""} onChange={(e) => setF({ ...f, status: e.target.value || undefined })}><option value="">Cualquier estado</option><option value="resolved_by_bot">Resuelta por el bot</option><option value="escalated">Escalada</option><option value="resolved_by_human">Resuelta por humano</option><option value="abandoned">Abandonada</option><option value="open">Abierta</option></select>
        <select className="select" style={{ maxWidth: 180 }} value={f.confidence ?? ""} onChange={(e) => setF({ ...f, confidence: e.target.value || undefined })}><option value="">Cualquier confianza</option><option value="green">Con fuente</option><option value="yellow">Sin fuente clara</option><option value="red">No supo</option></select>
        <span className="small muted">{data?.total ?? 0} resultados</span>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <thead><tr><th>Cuándo</th><th>Bot</th><th>Canal</th><th>Tema</th><th>Confianza</th><th>Estado</th><th>Sentimiento</th><th>Turnos</th></tr></thead>
          <tbody>
            {data?.items.map((c) => (
              <tr key={c.id} className="clickable" onClick={() => nav(`/conversaciones/${c.id}`)}>
                <td className="small">{fmtDate(c.started_at)}</td><td className="small">{botName(c.bot_id)}</td><td><Badge tone="gray">{CHANNEL_LABEL[c.channel_type]}</Badge></td><td>{c.topic}</td><td><Confidence level={c.confidence} /></td><td><StatusBadge s={c.status} /></td>
                <td>{c.sentiment === "negative" ? <Badge tone="red">Molesto</Badge> : c.sentiment === "positive" ? <Badge tone="green">Contento</Badge> : <Badge tone="gray">Neutral</Badge>}</td><td>{c.turns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {id && <ConversationModal id={id} botName={botName} onClose={() => nav("/conversaciones")} />}
    </>
  );
}

function ConversationModal({ id, botName, onClose }: { id: string; botName: (b: string) => string; onClose: () => void }) {
  const api = useApi();
  const toast = useToast();
  const { data: c } = useData((a) => a.conversation(id), [id]);
  if (!c) return null;
  return (
    <Modal title={`Conversación ${c.id}`} onClose={onClose}>
      <div className="row small muted" style={{ marginBottom: 10 }}><span>{botName(c.bot_id)}</span>·<span>{CHANNEL_LABEL[c.channel_type]}</span>·<span>{fmtDate(c.started_at)}</span>·<StatusBadge s={c.status} />·<Confidence level={c.confidence} />·<span>Costo {fmtMXN(c.total_cost_usd * 18.5)}</span></div>
      {c.handoff_summary && <div className="card flat" style={{ background: "var(--rosa-soft)", marginBottom: 10 }}><b className="small">Resumen entregado al humano:</b> <span className="small">{c.handoff_summary}</span></div>}
      <div className="chat" style={{ height: 380 }}>
        <div className="msgs">
          {c.messages.map((m) => (
            <div key={m.id} className={`m ${m.role}`}>{m.content}
              {m.role === "assistant" && <span className="meta">{m.sources?.length ? `Fuente: ${m.sources.map((s) => s.title).join(", ")}` : m.confidence === "red" ? "Sin fuente: guardada en preguntas sin respuesta" : ""}{m.hard_rule_triggered ? ` · Regla dura #${m.hard_rule_triggered} aplicada` : ""}{m.latency_ms ? ` · ${(m.latency_ms / 1000).toFixed(1)} s` : ""}</span>}
              {m.role === "human_agent" && <span className="meta">Atendió una persona</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
        <button className="btn sm" onClick={() => toast("Marcada para revisión de calidad")}>Marcar para revisión</button>
        <button className="btn sm" onClick={() => toast("Exportada con sello SHA-256 (ver Auditoría)")}>Exportar JSON</button>
        <Link className="btn sm primary" to={`/bots/${c.bot_id}`} onClick={onClose}>Corregir en el bot</Link>
      </div>
    </Modal>
  );
}
