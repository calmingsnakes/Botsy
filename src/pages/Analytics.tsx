import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Modal, Stat, fmtN, useApi, useData, useToast } from "../components/ui";

export function Analytics() {
  const api = useApi();
  const toast = useToast();
  const [botId, setBotId] = useState<string | undefined>();
  const { data: bots } = useData((a) => a.bots());
  const { data: x, reload } = useData((a) => a.xray(botId), [botId]);
  const [answering, setAnswering] = useState<{ id: string; q: string } | null>(null);
  const [answer, setAnswer] = useState("");
  const max = Math.max(1, ...(x?.topics.map((t) => t.conversations) ?? [1]));
  const kpiBots = bots?.filter((b) => b.kpi_name && b.status === "active") ?? [];
  return (
    <>
      <div className="page-head"><div><h1>Rayos X y KPI</h1><p>Qué preguntan tus clientes, qué se resuelve solo, dónde se frustran y qué no sabe contestar el bot. Esto es lo que revisamos contigo cada mes.</p></div>
        <div className="row"><select className="select" value={botId ?? ""} onChange={(e) => setBotId(e.target.value || undefined)}><option value="">Todos los bots</option>{bots?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><button className="btn" onClick={() => toast("El informe PDF de este mes se envió a tu correo (demo).")}>Descargar informe del mes</button></div></div>
      <div className="grid c3">
        {kpiBots.map((b) => <Stat key={b.id} label={`KPI · ${b.name}`} value={`${Math.round((b.kpi_current ?? 0) * 100)} %`} delta={`${b.kpi_name} · meta ${Math.round((b.kpi_target ?? 0) * 100)} %`} up={(b.kpi_current ?? 0) >= (b.kpi_target ?? 0)} />)}
        <Stat label="Sin respuesta (30 días)" value={fmtN(x?.unanswered.reduce((a, u) => a + u.occurrences, 0) ?? 0)} delta={`${x?.unanswered.length ?? 0} temas distintos`} up={false} />
      </div>
      <div className="grid c2">
        <div className="card">
          <h3>De qué hablan tus clientes (30 días)</h3>
          {x?.topics.map((t) => (
            <div key={t.topic} className="hbar">
              <span>{t.topic}</span>
              <div className="track" title={`Resolución ${Math.round(t.resolution_rate * 100)} % · negativas ${Math.round(t.negative_rate * 100)} %`}><i style={{ width: `${(t.conversations / max) * 100}%` }} className={t.negative_rate > 0.2 ? "neg" : ""} /></div>
              <span className="muted">{fmtN(t.conversations)}</span>
            </div>
          ))}
          <p className="small muted" style={{ marginTop: 8 }}>Rojo = más del 20 % de clientes molestos en ese tema.</p>
        </div>
        <div className="card">
          <h3>Hallazgos y recomendaciones</h3>
          <div className="stack">{x?.insights.map((t, i) => <p key={i} className="small" style={{ borderLeft: "3px solid var(--rosa)", paddingLeft: 10 }}>{t}</p>)}{x && x.insights.length === 0 && <p className="small muted">Los hallazgos se generan cada lunes con el reporte semanal.</p>}</div>
        </div>
      </div>
      <div className="card">
        <div className="row between"><h3>Preguntas que el bot no supo contestar</h3><span className="small muted">Contesta una y se agrega a la base de conocimiento; el bot la usa desde la siguiente conversación.</span></div>
        <table className="tbl">
          <thead><tr><th>Pregunta</th><th>Veces</th><th>Bot</th><th>Sugerencia</th><th></th></tr></thead>
          <tbody>{x?.unanswered.map((u) => (
            <tr key={u.id}><td><b>{u.question}</b></td><td>{u.occurrences}</td><td className="small">{bots?.find((b) => b.id === u.bot_id)?.name}</td><td className="small muted">{u.suggested_answer ?? "—"}</td><td><button className="btn sm primary" onClick={() => { setAnswering({ id: u.id, q: u.question }); setAnswer(""); }}>Contestar</button></td></tr>
          ))}</tbody>
        </table>
        {x && x.unanswered.length === 0 && <div className="empty"><b>Todo contestado</b>No hay preguntas pendientes. <Link to="/conversaciones">Ver conversaciones</Link></div>}
      </div>
      {answering && (
        <Modal title="Contestar y enseñar al bot" onClose={() => setAnswering(null)}>
          <p className="small muted" style={{ marginBottom: 10 }}>Pregunta: <b>{answering.q}</b></p>
          <textarea className="textarea" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Escribe la respuesta como se la dirías a un cliente…" />
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}><button className="btn" onClick={() => setAnswering(null)}>Cancelar</button><button className="btn primary" disabled={!answer} onClick={async () => { await api.resolveUnanswered(answering.id, answer); setAnswering(null); reload(); toast("Listo. El bot ya puede contestar esto."); }}>Guardar en la base de conocimiento</button></div>
        </Modal>
      )}
      <div className="row small muted"><Badge tone="gray">Muestreo de calidad</Badge> Cada semana revisamos una muestra de 20+ conversaciones por bot con una rúbrica de 5 puntos; la calificación aparece en tu informe mensual.</div>
    </>
  );
}
