import { Link } from "react-router-dom";
import { Badge, ago, useApi, useData, useToast } from "../components/ui";

export function Alerts() {
  const api = useApi();
  const toast = useToast();
  const { data: alerts, reload } = useData((a) => a.alerts());
  const { data: bots } = useData((a) => a.bots());
  const link = (kind: string, botId?: string) => kind.startsWith("budget") ? "/consumo" : kind === "angry_customer" ? "/conversaciones?status=escalated" : kind === "unanswered_spike" ? "/rayos-x" : kind === "source_failed" && botId ? `/bots/${botId}/conocimiento` : "/";
  return (
    <>
      <div className="page-head"><div><h1>Alertas y notificaciones</h1><p>Solo te avisamos de lo que requiere una decisión tuya. Elige cómo recibirlas abajo.</p></div></div>
      <div className="grid split-2">
        <div className="stack">
          {alerts?.map((a) => (
            <div key={a.id} className="card row between" style={a.acknowledged_at ? { opacity: 0.6 } : {}}>
              <div>
                <div className="row"><Badge tone={a.severity === "critical" ? "red" : a.severity === "warning" ? "amber" : ""}>{a.severity === "critical" ? "Urgente" : a.severity === "warning" ? "Atención" : "Info"}</Badge><b>{a.title}</b><span className="small muted">{ago(a.created_at)}{a.bot_id ? ` · ${bots?.find((b) => b.id === a.bot_id)?.name}` : ""}</span></div>
                <p className="small muted" style={{ marginTop: 4 }}>{a.body}</p>
              </div>
              <div className="row"><Link className="btn sm primary" to={link(a.kind, a.bot_id)}>Resolver</Link>{!a.acknowledged_at && <button className="btn sm" onClick={async () => { await api.ackAlert(a.id); reload(); }}>Visto</button>}</div>
            </div>
          ))}
        </div>
        <div className="card stack">
          <h3>Cómo te avisamos</h3>
          {[["Correo", true], ["WhatsApp", false], ["Reporte semanal (lunes 8 am)", true], ["Cliente molesto escalado", true], ["Presupuesto al 80 % y 100 %", true], ["Tema nuevo sin respuesta", true], ["Pago rechazado", true]].map(([l, v]) => <label key={String(l)} className="small row between"><span>{l}</span><input type="checkbox" defaultChecked={Boolean(v)} onChange={() => toast("Preferencia guardada")} /></label>)}
          <p className="small muted">Escalamientos urgentes llegan también al correo configurado en cada bot.</p>
        </div>
      </div>
    </>
  );
}
