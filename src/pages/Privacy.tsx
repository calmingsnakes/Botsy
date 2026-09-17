import { useEffect, useState } from "react";
import type { DataRequest, RetentionPolicy } from "../lib/types";
import { StatusBadge, fmtDay, useApi, useData, useToast } from "../components/ui";

const TYPES: Record<DataRequest["type"], string> = { access: "Acceso", rectification: "Rectificación", cancellation: "Cancelación (borrado)", opposition: "Oposición" };

export function Privacy() {
  const api = useApi();
  const toast = useToast();
  const { data: policy } = useData((a) => a.retention());
  const { data: reqs, reload } = useData((a) => a.dataRequests());
  const [p, setP] = useState<RetentionPolicy | null>(null);
  const [nr, setNr] = useState<{ type: DataRequest["type"]; requester_ref: string }>({ type: "access", requester_ref: "" });
  useEffect(() => { if (policy) setP(policy); }, [policy]);
  return (
    <>
      <div className="page-head"><div><h1>Datos y privacidad</h1><p>Retención, redacción de datos personales, solicitudes ARCO y exportación. Diseñado para la LFPDPPP 2025.</p></div>
        <button className="btn" onClick={async () => { const b = await api.exportAll(); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "exportacion-completa.json"; a.click(); toast("Exportación descargada (bots, documentos, conversaciones, auditoría)."); }}>Exportar todos mis datos</button></div>
      <div className="grid c2">
        <div className="card stack">
          <h3>Retención y protección</h3>
          {p && <>
            <label className="field">Conservar conversaciones durante <select className="select" value={p.transcript_days} onChange={(e) => setP({ ...p, transcript_days: Number(e.target.value) })}><option value={30}>30 días</option><option value={90}>90 días</option><option value={365}>1 año</option><option value={730}>2 años</option><option value={1825}>5 años</option></select></label>
            <label className="small"><input type="checkbox" checked={p.redact_pii_before_llm} onChange={(e) => setP({ ...p, redact_pii_before_llm: e.target.checked })} /> Ocultar teléfonos, correos, RFC y CURP antes de enviar el texto al modelo de IA</label>
            <label className="small"><input type="checkbox" checked={p.store_sensitive} onChange={(e) => setP({ ...p, store_sensitive: e.target.checked })} /> Permitir guardar datos sensibles (requiere base legal; cifrado por columna)</label>
            <label className="small"><input type="checkbox" checked={p.voice_recordings} onChange={(e) => setP({ ...p, voice_recordings: e.target.checked })} /> Guardar grabaciones de voz (se anuncia al inicio de cada llamada)</label>
            <div className="row"><button className="btn primary" onClick={async () => { await api.saveRetention(p); toast("Política guardada y registrada en auditoría"); }}>Guardar</button></div>
          </>}
          <hr style={{ border: 0, borderTop: "1px solid var(--line)" }} />
          <h3>Lo que no se puede cambiar</h3>
          <ul className="small muted" style={{ paddingLeft: 18, margin: 0 }}>
            <li>Tus datos están aislados de otros clientes a nivel base de datos (RLS) y cifrados en reposo y en tránsito.</li>
            <li>Ningún proveedor de IA entrena con tus datos; retención máxima 30 días en el proveedor.</li>
            <li>El bot siempre se identifica como IA, ofrece humano y nunca toma decisiones con efecto legal.</li>
            <li>Subencargados: Supabase, Cloudflare, Anthropic/OpenAI/Google, Meta, Twilio, Stripe. <a href="#">Lista completa</a>.</li>
          </ul>
        </div>
        <div className="card stack">
          <h3>Solicitudes ARCO</h3>
          <p className="small muted">Cuando un cliente tuyo pide acceder, corregir, borrar u oponerse al uso de sus datos, regístralo aquí. Tienes 20 días hábiles; te avisamos antes del plazo.</p>
          <div className="row"><select className="select" style={{ maxWidth: 200 }} value={nr.type} onChange={(e) => setNr({ ...nr, type: e.target.value as DataRequest["type"] })}>{(Object.keys(TYPES) as DataRequest["type"][]).map((t) => <option key={t} value={t}>{TYPES[t]}</option>)}</select><input className="input" placeholder="Teléfono, correo o folio del titular" value={nr.requester_ref} onChange={(e) => setNr({ ...nr, requester_ref: e.target.value })} /><button className="btn primary" disabled={!nr.requester_ref} onClick={async () => { await api.createDataRequest(nr); setNr({ ...nr, requester_ref: "" }); reload(); toast("Solicitud registrada; buscamos todas las conversaciones del titular."); }}>Registrar</button></div>
          <table className="tbl"><thead><tr><th>Tipo</th><th>Titular</th><th>Estado</th><th>Vence</th></tr></thead><tbody>{reqs?.map((r) => <tr key={r.id}><td>{TYPES[r.type]}</td><td className="small">{r.requester_ref}</td><td><StatusBadge s={r.status} /></td><td className="small">{fmtDay(r.due_at)}</td></tr>)}</tbody></table>
          <h3>Aviso de privacidad para tus canales</h3>
          <p className="small muted">Generamos el aviso simplificado que debe mostrar cada canal, con tus datos y los nuestros como encargado. <button className="btn sm" onClick={() => toast("Aviso generado y copiado (demo).")}>Generar y copiar</button></p>
        </div>
      </div>
    </>
  );
}
