import { useState } from "react";
import { Badge, fmtDate, useData } from "../components/ui";

export function Audit() {
  const { data } = useData((a) => a.audit(200));
  const [q, setQ] = useState("");
  const rows = data?.filter((e) => !q || JSON.stringify(e).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="page-head"><div><h1>Auditoría</h1><p>Registro inmutable de todo lo que pasa en tu cuenta: quién hizo qué, cuándo y desde dónde. Incluye nuestros accesos de soporte, siempre con motivo y notificación.</p></div>
        <input className="input" style={{ maxWidth: 260 }} placeholder="Filtrar…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <thead><tr><th>Cuándo</th><th>Quién</th><th>Acción</th><th>Objeto</th><th>Detalle</th><th>IP</th></tr></thead>
          <tbody>{rows?.map((e) => (
            <tr key={e.id}><td className="small">{fmtDate(e.created_at)}</td><td>{e.actor} {e.actor_type === "platform_admin" && <Badge tone="rosa">soporte</Badge>}{e.actor_type === "system" && <Badge tone="gray">sistema</Badge>}</td><td className="mono">{e.action}</td><td className="small">{e.object_type} {e.object_id}</td><td className="small muted">{e.details ? Object.entries(e.details).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ") : ""}</td><td className="mono small">{e.ip ?? "—"}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
