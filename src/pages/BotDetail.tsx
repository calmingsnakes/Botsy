import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useParams } from "react-router-dom";
import type { Bot, ChangeRequest, Channel, KnowledgeSource, MasterDocument } from "../lib/types";
import { Badge, CHANNEL_LABEL, Modal, SERVICE_LABEL, StatusBadge, ago, fmtDate, useApi, useData, useToast } from "../components/ui";

export function BotDetail() {
  const { id = "" } = useParams();
  const { data: bot, reload } = useData((a) => a.bot(id), [id]);
  if (!bot) return <p className="muted">Cargando…</p>;
  const base = `/bots/${bot.id}`;
  const tabs = [["", "Documento Maestro"], ["/conocimiento", "Base de conocimiento"], ["/simulador", "Simulador"], ["/canales", "Canales"], ["/cambios", "Solicitudes de cambio"], ["/config", "Configuración"]];
  return (
    <>
      <div className="page-head">
        <div>
          <div className="row"><Link to="/bots" className="small muted">← Mis bots</Link><Badge>{bot.service_code} · {SERVICE_LABEL[bot.service_code]}</Badge><StatusBadge s={bot.status} /></div>
          <h1 style={{ marginTop: 6 }}>{bot.name}</h1>
          <p>Versión publicada: <b>{bot.published_version || "ninguna todavía"}</b> · Modelo: {bot.model}</p>
        </div>
      </div>
      <ChangeBox bot={bot} onPublished={reload} />
      <div className="tabs">
        {tabs.map(([p, l]) => <NavLink key={p} to={`${base}${p}`} end={p === ""} className={({ isActive }) => (isActive ? "active" : "")}>{l}</NavLink>)}
      </div>
      <Routes>
        <Route index element={<DmEditor bot={bot} onPublished={reload} />} />
        <Route path="conocimiento" element={<Knowledge bot={bot} />} />
        <Route path="simulador" element={<Simulator bot={bot} />} />
        <Route path="canales" element={<Channels bot={bot} />} />
        <Route path="cambios" element={<ChangeRequests bot={bot} onPublished={reload} />} />
        <Route path="config" element={<Config bot={bot} onSaved={reload} />} />
      </Routes>
    </>
  );
}

// ---------------------------------------------------------------- Agente de Cambios (UX strategy 2)
function ChangeBox({ bot, onPublished }: { bot: Bot; onPublished: () => void }) {
  const api = useApi();
  const toast = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [cr, setCr] = useState<ChangeRequest | null>(null);
  const chips = ["Cambió un precio", "Cambió un horario", "Ya no ofrecemos…", "Nueva regla"];
  async function propose() {
    setBusy(true);
    try { setCr(await api.proposeChange(bot.id, text)); } catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  }
  return (
    <div className="card" style={{ borderColor: "var(--rosa)", background: "linear-gradient(180deg,#fff, var(--rosa-soft) 300%)" }}>
      <div className="row between"><h3>¿Qué cambió? Cuéntame y te propongo los cambios.</h3><span className="small muted">Nada se publica sin tu aprobación</span></div>
      <div className="row" style={{ marginTop: 8 }}>
        <input className="input" style={{ flex: 1 }} value={text} onChange={(e) => setText(e.target.value)} placeholder='Ej. "Ya cambió la política de devoluciones: ahora son 30 días, no 15"' onKeyDown={(e) => { if (e.key === "Enter" && text && !busy) { e.preventDefault(); propose(); } }} />
        <button className="btn accent" onClick={propose} disabled={!text || busy}>{busy ? "Analizando…" : "Proponer cambios"}</button>
      </div>
      <div className="row" style={{ marginTop: 8 }}>{chips.map((c) => <button key={c} className="btn sm" onClick={() => setText(c + " ")}>{c}</button>)}</div>
      {cr && <ProposalModal bot={bot} cr={cr} onClose={() => setCr(null)} onDone={() => { setCr(null); setText(""); onPublished(); }} />}
    </div>
  );
}

function ProposalModal({ bot, cr, onClose, onDone }: { bot: Bot; cr: ChangeRequest; onClose: () => void; onDone: () => void }) {
  const api = useApi();
  const toast = useToast();
  const [accepted, setAccepted] = useState<number[]>(cr.proposal.map((_, i) => i));
  const [busy, setBusy] = useState(false);
  const toggle = (i: number) => setAccepted((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i]));
  async function decide(list: number[]) {
    setBusy(true);
    try {
      const r = await api.decideChange(bot.id, cr.id, list);
      toast(list.length ? `Publicado como versión ${r.version}. Los clientes verán el cambio en la próxima conversación.` : "Propuesta rechazada. No se cambió nada.");
      onDone();
    } catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  }
  return (
    <Modal title="Propuesta de cambios" onClose={onClose}>
      <p className="small muted" style={{ marginBottom: 12 }}>Tu instrucción: <i>“{cr.instruction}”</i>. Revisa cada cambio; marca los que apruebas.</p>
      <div className="stack">
        {cr.proposal.map((p, i) => (
          <div key={i} className={`diff ${accepted.includes(i) ? "accepted" : "rejected"}`}>
            <div className="head"><span><input type="checkbox" checked={accepted.includes(i)} onChange={() => toggle(i)} id={`p${i}`} /> <label htmlFor={`p${i}`}>{p.target.startsWith("dm.") ? "Documento Maestro · " + p.target.slice(3).replace("hard_rules", "reglas duras").replace("scope.out", "no atiende").replace("escalation.hours", "horario") : "Base de conocimiento · " + p.target.slice(7).split("#")[0]}</label></span></div>
            <div className="body"><div className="before">{p.before || "(nuevo)"}</div><div className="after">{p.after}</div></div>
            <div className="reason">{p.reason}</div>
          </div>
        ))}
      </div>
      <div className="card flat" style={{ marginTop: 14, background: "#f6f5fb" }}>
        <b className="small">Impacto:</b> <span className="small">afecta a <b>{bot.name}</b> y a sus canales activos. Se crea la versión {bot.published_version + 1}; puedes regresar a la {bot.published_version} en un clic desde el historial.</span>
      </div>
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
        <button className="btn" onClick={() => decide([])} disabled={busy}>Rechazar todo</button>
        <button className="btn primary" onClick={() => decide(accepted)} disabled={busy || accepted.length === 0}>{busy ? "Publicando…" : `Publicar ${accepted.length} cambio${accepted.length === 1 ? "" : "s"}`}</button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- Documento Maestro
function DmEditor({ bot, onPublished }: { bot: Bot; onPublished: () => void }) {
  const api = useApi();
  const toast = useToast();
  const { data, reload } = useData((a) => a.masterDocument(bot.id), [bot.id, bot.published_version]);
  const [draft, setDraft] = useState<MasterDocument | null>(null);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (data) { setDraft(structuredClone(data.draft)); setDirty(false); } }, [data]);
  if (!draft) return <p className="muted">Cargando…</p>;
  const set = (fn: (d: MasterDocument) => void) => { const d = structuredClone(draft); fn(d); setDraft(d); setDirty(true); };
  const listEdit = (items: string[], onChange: (v: string[]) => void, locked = false) => (
    <ol>{items.map((it, i) => <li key={i} className="rule"><input value={it} onChange={(e) => { const v = [...items]; v[i] = e.target.value; onChange(v); }} /> <button className="btn sm" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Quitar">×</button></li>)}
      <li style={{ listStyle: "none" }}><button className="btn sm" onClick={() => onChange([...items, ""])}>+ Agregar</button></li>
      {locked && null}
    </ol>
  );
  async function save() { await api.saveMasterDocument(bot.id, draft!); setDirty(false); toast("Borrador guardado. Aún no está publicado."); }
  async function publish() { const v = await api.publish(bot.id, "Edición manual del Documento Maestro"); toast(`Publicada la versión ${v}.`); reload(); onPublished(); }
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 320px" }}>
      <div className="dm-doc">
        <h4>Identidad</h4>
        <div className="row"><input value={draft.identity.name} onChange={(e) => set((d) => (d.identity.name = e.target.value))} aria-label="Nombre" /><input value={draft.identity.persona} onChange={(e) => set((d) => (d.identity.persona = e.target.value))} aria-label="Rol" /></div>
        <h4>Objetivo</h4>
        <textarea value={draft.objective} onChange={(e) => set((d) => (d.objective = e.target.value))} rows={2} />
        <h4>Alcance · sí atiende</h4>{listEdit(draft.scope.in, (v) => set((d) => (d.scope.in = v)))}
        <h4>Alcance · no atiende</h4>{listEdit(draft.scope.out, (v) => set((d) => (d.scope.out = v)))}
        <h4>Tono</h4>
        <div className="row"><select className="select" style={{ width: 120 }} value={draft.tone.register} onChange={(e) => set((d) => (d.tone.register = e.target.value as any))}><option value="tú">tú</option><option value="usted">usted</option></select><input value={draft.tone.style} onChange={(e) => set((d) => (d.tone.style = e.target.value))} /><label className="small"><input type="checkbox" checked={draft.tone.emojis} onChange={(e) => set((d) => (d.tone.emojis = e.target.checked))} /> emojis</label></div>
        <h4>Reglas duras (nunca se violan)</h4>{listEdit(draft.hard_rules, (v) => set((d) => (d.hard_rules = v)))}
        <h4>Escalamiento</h4>
        <div className="small muted">Pasa a humano cuando:</div>{listEdit(draft.escalation.triggers, (v) => set((d) => (d.escalation.triggers = v)))}
        <div className="row"><input value={draft.escalation.summary_to} onChange={(e) => set((d) => (d.escalation.summary_to = e.target.value))} aria-label="Correo de escalamiento" /><input value={draft.escalation.hours} onChange={(e) => set((d) => (d.escalation.hours = e.target.value))} aria-label="Horario humano" /></div>
        <h4>Datos</h4>
        <div className="small muted">Puede pedir:</div>{listEdit(draft.data_policy.may_collect, (v) => set((d) => (d.data_policy.may_collect = v)))}
        <div className="small muted">Jamás pide:</div>{listEdit(draft.data_policy.never_collect, (v) => set((d) => (d.data_policy.never_collect = v)))}
        <input value={draft.data_policy.privacy_notice_url} onChange={(e) => set((d) => (d.data_policy.privacy_notice_url = e.target.value))} aria-label="Aviso de privacidad" />
        <h4>KPI</h4>
        <div className="row"><input value={draft.kpi.name} onChange={(e) => set((d) => (d.kpi.name = e.target.value))} /><input type="number" step="0.05" style={{ width: 90 }} value={draft.kpi.target} onChange={(e) => set((d) => (d.kpi.target = Number(e.target.value)))} /></div>
        <h4>Reglas de la plataforma <span className="lock">🔒</span></h4>
        <p className="locked">Siempre se identifica como IA · siempre ofrece humano · nunca toma decisiones con efecto legal · nunca pide datos sensibles ni de tarjeta · solo responde con tus fuentes. No se pueden quitar (ver Datos y privacidad).</p>
      </div>
      <div className="stack">
        <div className="card">
          <h3>Publicar</h3>
          <p className="small muted">Borrador {dirty ? "con cambios sin guardar" : "guardado"}. Publicar crea la versión {bot.published_version + 1}.</p>
          <div className="row" style={{ marginTop: 10 }}><button className="btn" onClick={save} disabled={!dirty}>Guardar borrador</button><button className="btn primary" onClick={publish}>Publicar</button></div>
        </div>
        <div className="card">
          <h3>Versiones</h3>
          <div className="stack small">
            {data?.versions.map((v) => <div key={v.version} className="row between"><span><b>v{v.version}</b> · {v.reason}</span><span className="muted">{ago(v.published_at)}</span></div>)}
            {data?.versions.length === 0 && <span className="muted">Sin versiones publicadas.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Base de conocimiento (UX strategy 1)
function Knowledge({ bot }: { bot: Bot }) {
  const api = useApi();
  const toast = useToast();
  const { data: sources, reload, setData } = useData((a) => a.sources(bot.id), [bot.id]);
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = setInterval(() => { if (sources?.some((s) => s.status === "processing" || s.status === "uploaded")) reload(); }, 1500); return () => clearInterval(t); }, [sources, reload]);
  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const text = f.type.startsWith("text") || f.name.endsWith(".md") || f.name.endsWith(".txt") || f.name.endsWith(".csv") ? await f.text() : `(contenido de ${f.name})`;
      const s = await api.addSource(bot.id, { kind: f.name.split(".").pop() ?? "file", title: f.name, text });
      setData((d) => [...(d ?? []), s]);
      toast(`Leyendo ${f.name}…`);
    }
  }
  const icon = (k: string) => ({ pdf: "PDF", docx: "DOC", xlsx: "XLS", url: "URL", txt: "TXT", md: "MD", csv: "CSV" } as Record<string, string>)[k] ?? k.toUpperCase().slice(0, 3);
  return (
    <div className="stack">
      <div className={`drop ${over ? "over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); handleFiles(e.dataTransfer.files); }} onClick={() => fileRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}>
        <b>Arrastra aquí tus documentos</b>
        <span className="muted small">PDF, Word, Excel, texto, o pega una liga. El bot te dirá qué aprendió de cada uno.</span>
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>
      <div className="card">
        {sources?.map((s) => <SourceRow key={s.id} s={s} onDelete={async () => { await api.deleteSource(bot.id, s.id); reload(); toast("Fuente eliminada. Puedes recuperarla 30 días desde Auditoría."); }} />)}
        {sources && sources.length === 0 && <div className="empty"><b>El bot todavía no sabe nada de tu negocio</b>Sube tu menú, tus políticas o tu manual y mira qué preguntas puede contestar.</div>}
      </div>
    </div>
  );
}
function SourceRow({ s, onDelete }: { s: KnowledgeSource; onDelete: () => void }) {
  const step = s.status === "uploaded" ? 0 : s.status === "processing" ? 1 : 2;
  return (
    <div className="source">
      <div className="icon">{({ pdf: "PDF", docx: "DOC", xlsx: "XLS", url: "URL" } as Record<string, string>)[s.kind] ?? s.kind.toUpperCase().slice(0, 3)}</div>
      <div>
        <div className="row"><b>{s.title}</b><StatusBadge s={s.status} /><span className="small muted">{fmtDate(s.created_at)}</span></div>
        {s.status === "ready" && <><div className="small" style={{ marginTop: 4 }}>Aprendí <b>{s.chunk_count}</b> cosas. Ahora puedo contestar, por ejemplo:</div><ul>{s.sample_questions.map((q) => <li key={q}>{q}</li>)}</ul></>}
        {s.status === "failed" && <div className="small" style={{ color: "var(--red)", marginTop: 4 }}>{s.error}</div>}
        {step < 2 && s.status !== "failed" && <div className="steps"><b>Leyendo</b> → <span className={step >= 1 ? "" : "muted"} style={step >= 1 ? { color: "var(--ink)", fontWeight: 600 } : {}}>Entendiendo</span> → <span>Listo</span></div>}
      </div>
      <button className="btn sm danger" onClick={onDelete}>Quitar</button>
    </div>
  );
}

// ---------------------------------------------------------------- Simulador (UX strategy 3: "Lo dije porque…")
function Simulator({ bot }: { bot: Bot }) {
  const api = useApi();
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([{ role: "assistant", content: `Hola, soy el asistente virtual de tu negocio. Soy una inteligencia artificial. Escribe "humano" en cualquier momento para pasar con una persona.` }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.scrollTo({ top: 1e6 }); }, [msgs]);
  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text || busy) return;
    const history = [...msgs, { role: "user" as const, content: text }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setText(""); setBusy(true);
    try {
      const stream = await api.simulate(bot.id, history);
      const reader = stream.getReader();
      let acc = "";
      while (true) { const { value, done } = await reader.read(); if (done) break; acc += value; setMsgs([...history, { role: "assistant", content: acc }]); }
    } finally { setBusy(false); }
  }
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 300px" }}>
      <div className="chat">
        <div className="msgs" ref={box}>
          {msgs.map((m, i) => {
            const [body, why] = m.content.split(" ⟶ ");
            return <div key={i} className={`m ${m.role}`}>{body}{why && <span className="meta">Lo dije porque: {why.replace(/^\[|\]$/g, "")}</span>}</div>;
          })}
          {busy && <div className="typing">escribiendo…</div>}
        </div>
        <form onSubmit={send}><input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe como si fueras tu cliente…" /><button className="btn primary" disabled={busy || !text}>Enviar</button></form>
      </div>
      <div className="card">
        <h3>Prueba estas</h3>
        <div className="stack">{["¿Hacen entregas a domicilio?", "Quiero un pastel para el sábado", "¿Cuánto cuesta la concha?", "¿La concha tiene nuez?", "Quiero hablar con un humano"].map((q) => <button key={q} className="btn sm" style={{ justifyContent: "flex-start", textAlign: "left" }} onClick={() => setText(q)}>{q}</button>)}</div>
        <p className="small muted" style={{ marginTop: 12 }}>El simulador usa la versión publicada ({bot.published_version || "—"}). Cada respuesta muestra <b>por qué</b> la dio: fuente o regla aplicada.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Canales
function Channels({ bot }: { bot: Bot }) {
  const api = useApi();
  const toast = useToast();
  const { data: channels, reload } = useData((a) => a.channels(bot.id), [bot.id]);
  const all: Channel["type"][] = ["web", "whatsapp", "email", "voice", "sms"];
  const help: Record<string, string> = { web: "Pega este código en tu sitio. El widget muestra el aviso de IA en el primer mensaje.", whatsapp: "Conecta tu número de WhatsApp Business. Las respuestas dentro de 24 h no tienen costo de Meta.", email: "Reenvía tu correo de soporte a la dirección que te damos; el bot responde y escala con resumen.", voice: "Un número telefónico atendido por tu bot. Anuncia IA y grabación al inicio (obligatorio).", sms: "Recordatorios y confirmaciones con consentimiento previo." };
  async function toggle(ch: Channel) {
    if (!ch.enabled && !ch.ai_disclosure_confirmed) { toast("Antes de activar, confirma el aviso de IA y el aviso de privacidad del canal.", "err"); return; }
    await api.updateChannel(bot.id, ch.id, { enabled: !ch.enabled }); reload(); toast(ch.enabled ? "Canal desactivado" : "Canal activado");
  }
  return (
    <div className="grid c2">
      {all.map((t) => {
        const ch = channels?.find((c) => c.type === t);
        return (
          <div key={t} className="card">
            <div className="row between"><h3>{CHANNEL_LABEL[t]}</h3>{ch ? <Badge tone={ch.enabled ? "green" : "gray"}>{ch.enabled ? "Activo" : "Inactivo"}</Badge> : <Badge tone="gray">No configurado</Badge>}</div>
            <p className="small muted" style={{ margin: "6px 0 10px" }}>{help[t]}</p>
            {ch && (
              <div className="stack small">
                <label><input type="checkbox" checked={ch.ai_disclosure_confirmed} onChange={async (e) => { await api.updateChannel(bot.id, ch.id, { ai_disclosure_confirmed: e.target.checked }); reload(); }} /> El primer mensaje dice que es IA y ofrece humano (no editable)</label>
                <label className="field">Aviso de privacidad del canal <input className="input" defaultValue={ch.privacy_notice_url ?? ""} onBlur={async (e) => { await api.updateChannel(bot.id, ch.id, { privacy_notice_url: e.target.value }); }} placeholder="https://tusitio.mx/privacidad" /></label>
                {t === "web" && <pre className="mono" style={{ background: "#f6f5fb", padding: 10, borderRadius: 8, overflow: "auto" }}>{`<script src="https://cdn.${"brand"}.mx/widget.js" data-bot="${bot.id}" data-key="bk_live_…"></script>`}</pre>}
                {t === "whatsapp" && <div>Número: <b>{String(ch.config.phone_number ?? "pendiente")}</b></div>}
                <div className="row"><button className="btn sm" onClick={() => toggle(ch)}>{ch.enabled ? "Desactivar" : "Activar"}</button></div>
              </div>
            )}
            {!ch && <button className="btn sm" onClick={() => toast("En la demo los canales ya están configurados en el bot de Recepción.")}>Configurar</button>}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- Solicitudes de cambio
function ChangeRequests({ bot, onPublished }: { bot: Bot; onPublished: () => void }) {
  const { data: crs } = useData((a) => a.changeRequests(bot.id), [bot.id, bot.published_version]);
  return (
    <div className="stack">
      {crs?.map((cr) => (
        <div key={cr.id} className="card">
          <div className="row between"><div><b>“{cr.instruction}”</b><div className="small muted">{cr.requested_by} · {fmtDate(cr.created_at)}{cr.resulting_version ? ` · publicado como v${cr.resulting_version}` : ""}</div></div><StatusBadge s={cr.status} /></div>
          <div className="stack" style={{ marginTop: 10 }}>
            {cr.proposal.map((p, i) => <div key={i} className={`diff ${p.accepted ? "accepted" : cr.status === "pending" ? "" : "rejected"}`}><div className="head">{p.target}</div><div className="body"><div className="before">{p.before || "(nuevo)"}</div><div className="after">{p.after}</div></div></div>)}
          </div>
        </div>
      ))}
      {crs && crs.length === 0 && <div className="empty"><b>Sin solicitudes todavía</b>Escribe arriba qué cambió en tu negocio y verás aquí cada propuesta con su decisión.</div>}
    </div>
  );
}

// ---------------------------------------------------------------- Configuración
function Config({ bot, onSaved }: { bot: Bot; onSaved: () => void }) {
  const api = useApi();
  const toast = useToast();
  const [form, setForm] = useState({ name: bot.name, model: bot.model, monthly_conversation_budget: 0, kpi_name: bot.kpi_name ?? "", kpi_target: bot.kpi_target ?? 0.6, status: bot.status });
  async function save() { await api.updateBot(bot.id, { name: form.name, model: form.model, kpi_name: form.kpi_name, kpi_target: form.kpi_target, status: form.status }); toast("Configuración guardada"); onSaved(); }
  return (
    <div className="grid c2">
      <div className="card stack">
        <label className="field">Nombre <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="field">Calidad de respuestas <span className="hint">Premium entiende matices y redacta correos largos; Rápido es ideal para preguntas frecuentes.</span>
          <select className="select" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}><option value="claude-haiku-4-5">Rápido y económico (Claude Haiku 4.5)</option><option value="claude-sonnet-5">Premium (Claude Sonnet 5)</option><option value="gemini-2.5-flash">Alternativo (Gemini Flash)</option></select>
        </label>
        <label className="field">Estado <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}><option value="active">Activo</option><option value="paused">Pausado</option><option value="draft">Borrador</option><option value="archived">Archivado</option></select></label>
        <div className="row"><button className="btn primary" onClick={save}>Guardar</button></div>
      </div>
      <div className="card stack">
        <h3>KPI del servicio</h3>
        <p className="small muted">El KPI que acordamos contigo. Aparece en tu reporte semanal y en Rayos X.</p>
        <label className="field">Nombre <input className="input" value={form.kpi_name} onChange={(e) => setForm({ ...form, kpi_name: e.target.value })} /></label>
        <label className="field">Meta (0–1) <input className="input" type="number" step="0.05" min={0} max={1} value={form.kpi_target} onChange={(e) => setForm({ ...form, kpi_target: Number(e.target.value) })} /></label>
        <h3>Presupuesto</h3>
        <p className="small muted">Por defecto el bot hereda el presupuesto de la organización. Al 80 % te avisamos; al 100 % pausa salvo que permitas excedentes (en Consumo).</p>
      </div>
    </div>
  );
}
