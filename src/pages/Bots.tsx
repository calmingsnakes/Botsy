import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Modal, SERVICE_LABEL, StatusBadge, useApi, useData, useToast } from "../components/ui";

const CATALOG = Object.entries(SERVICE_LABEL);

export function Bots() {
  const { data: bots, reload } = useData((a) => a.bots());
  const [open, setOpen] = useState(false);
  const api = useApi();
  const toast = useToast();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [svc, setSvc] = useState("SVC-01");
  async function create() {
    // In HTTP mode the API creates the bot with a base Master Document for the chosen service (compendio 02).
    toast(api.mode === "mock" ? "En la demo, abre 'Inducción de nuevos panaderos' para ver un bot en borrador." : "Creando bot…");
    setOpen(false);
    if (api.mode === "mock") nav("/bots/bot_induccion");
  }
  return (
    <>
      <div className="page-head">
        <div><h1>Mis bots</h1><p>Cada bot se rige por su Documento Maestro. Cambia lo que quieras pidiéndoselo con tus palabras; nada se publica sin tu aprobación.</p></div>
        <button className="btn primary" onClick={() => setOpen(true)}>Nuevo bot</button>
      </div>
      <div className="grid c3">
        {bots?.map((b) => (
          <Link key={b.id} to={`/bots/${b.id}`} className="card" style={{ textDecoration: "none" }}>
            <div className="row between"><Badge>{b.service_code} · {SERVICE_LABEL[b.service_code]}</Badge><StatusBadge s={b.status} /></div>
            <h3 style={{ marginTop: 10 }}>{b.name}</h3>
            <p className="small muted">Versión {b.published_version || "—"} · {b.model.includes("sonnet") ? "Calidad premium" : "Rápido y económico"}</p>
            {b.kpi_name && <div style={{ marginTop: 12 }}><div className="row between small"><span>{b.kpi_name}</span><b>{Math.round((b.kpi_current ?? 0) * 100)} % / meta {Math.round((b.kpi_target ?? 0) * 100)} %</b></div><div className="progress"><i style={{ width: `${Math.min(100, ((b.kpi_current ?? 0) / (b.kpi_target || 1)) * 100)}%`, background: (b.kpi_current ?? 0) >= (b.kpi_target ?? 0) ? "var(--green)" : "var(--amber)" }} /></div></div>}
          </Link>
        ))}
      </div>
      {open && (
        <Modal title="Nuevo bot" onClose={() => setOpen(false)}>
          <div className="stack">
            <label className="field">¿Qué debe hacer? <span className="hint">Cada servicio llega pre-configurado con su Documento Maestro y su reporte.</span>
              <select className="select" value={svc} onChange={(e) => setSvc(e.target.value)}>{CATALOG.map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}</select>
            </label>
            <label className="field">Nombre del bot <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Espi — Recepción 24/7" /></label>
            <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={create} disabled={!name}>Crear y configurar</button></div>
          </div>
        </Modal>
      )}
      {bots && bots.length === 0 && <div className="empty"><b>Aún no tienes bots</b>Crea el primero: elige un servicio, sube tus documentos y pruébalo en 10 minutos.</div>}
    </>
  );
}
