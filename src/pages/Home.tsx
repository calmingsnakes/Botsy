import { Link } from "react-router-dom";
import { Badge, Stat, StatusBadge, ago, fmtMXN, fmtN, useData } from "../components/ui";

export function Home() {
  const { data: usage } = useData((a) => a.usage(30));
  const { data: bots } = useData((a) => a.bots());
  const { data: alerts } = useData((a) => a.alerts());
  const { data: xray } = useData((a) => a.xray());
  const { data: convs } = useData((a) => a.conversations({ limit: 6 }));
  const last7 = usage?.series.slice(-7) ?? [];
  const prev7 = usage?.series.slice(-14, -7) ?? [];
  const sum = (s: { conversations: number }[]) => s.reduce((a, r) => a + r.conversations, 0);
  const delta = prev7.length ? Math.round(((sum(last7) - sum(prev7)) / sum(prev7)) * 100) : 0;
  const ratio = usage ? usage.period.used / usage.period.included : 0;
  const active = bots?.filter((b) => b.status === "active") ?? [];
  const resolution = active.length ? active.reduce((a, b) => a + (b.kpi_current ?? 0), 0) / active.length : 0;
  return (
    <>
      <div className="page-head">
        <div><h1>Buenos días</h1><p>Así van tus bots esta semana. Todo lo que ves aquí también te llega en el reporte de los lunes.</p></div>
        <Link className="btn primary" to="/bots">Ver mis bots</Link>
      </div>
      <div className="grid c4">
        <Stat label="Conversaciones · 7 días" value={fmtN(sum(last7))} delta={`${delta >= 0 ? "+" : ""}${delta} % vs. semana pasada`} up={delta >= 0} />
        <Stat label="Resueltas sin humano" value={`${Math.round(resolution * 100)} %`} delta="Meta 60 % · vas arriba" up />
        <Stat label="Preguntas sin respuesta" value={xray?.unanswered.length ?? "—"} delta={`${xray?.unanswered.reduce((a, u) => a + u.occurrences, 0) ?? 0} clientes las hicieron`} up={false} />
        <Stat label="Gasto este mes" value={usage ? fmtMXN(usage.totals.cost_mxn) : "—"} delta="Incluido en tu plan Crecimiento" up={null} />
      </div>
      <div className="grid c2">
        <div className="card">
          <div className="row between"><h3>Conversaciones del mes</h3><span className="small muted">{usage ? `${fmtN(usage.period.used)} de ${fmtN(usage.period.included)}` : ""}</span></div>
          <div className={`progress ${ratio >= 1 ? "danger" : ratio >= 0.8 ? "warn" : ""}`} style={{ margin: "10px 0" }}><i style={{ width: `${Math.min(100, ratio * 100)}%` }} /></div>
          <p className="small muted">{ratio >= 0.8 ? `Llevas ${Math.round(ratio * 100)} %. Al 100 % el bot pausa, salvo que permitas excedentes (MXN ${usage?.period.overage_price_mxn} por conversación). ` : "Vas bien. "}<Link to="/consumo">Ver consumo</Link></p>
          <div className="bars" style={{ marginTop: 14 }} aria-label="Conversaciones por día, últimos 30 días">
            {usage?.series.map((d) => <i key={d.day} style={{ height: `${(d.conversations / 160) * 100}%` }} title={`${d.day}: ${d.conversations}`} />)}
          </div>
        </div>
        <div className="card">
          <h3>Lo que tus clientes te están diciendo</h3>
          <div className="stack">
            {xray?.insights.slice(0, 3).map((t, i) => <p key={i} className="small" style={{ borderLeft: "3px solid var(--rosa)", paddingLeft: 10 }}>{t}</p>)}
          </div>
          <Link to="/rayos-x" className="btn sm" style={{ marginTop: 12 }}>Abrir Rayos X</Link>
        </div>
      </div>
      <div className="grid c2">
        <div className="card">
          <div className="row between"><h3>Necesitan tu atención</h3><Link to="/alertas" className="small">Todas</Link></div>
          <div className="stack">
            {alerts?.filter((a) => !a.acknowledged_at).slice(0, 4).map((a) => (
              <div key={a.id} className="row between" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
                <div><Badge tone={a.severity === "critical" ? "red" : a.severity === "warning" ? "amber" : ""}>{a.severity === "critical" ? "Urgente" : a.severity === "warning" ? "Atención" : "Info"}</Badge> <b className="small">{a.title}</b><div className="small muted">{a.body}</div></div>
                <span className="small muted">{ago(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="row between"><h3>Últimas conversaciones</h3><Link to="/conversaciones" className="small">Todas</Link></div>
          <table className="tbl"><tbody>
            {convs?.items.map((c) => (
              <tr key={c.id}>
                <td><Link to={`/conversaciones/${c.id}`}>{c.topic}</Link><div className="small muted">{bots?.find((b) => b.id === c.bot_id)?.name}</div></td>
                <td><StatusBadge s={c.status} /></td>
                <td className="small muted">{ago(c.started_at)}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>
    </>
  );
}
