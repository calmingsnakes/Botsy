import { Stat, fmtMXN, fmtN, useApi, useData, useToast } from "../components/ui";

export function Usage() {
  const api = useApi();
  const toast = useToast();
  const { data: u } = useData((a) => a.usage(30));
  const { data: me } = useData((a) => a.me());
  if (!u) return <p className="muted">Cargando…</p>;
  const ratio = u.period.used / u.period.included;
  const max = Math.max(...u.series.map((d) => d.conversations));
  return (
    <>
      <div className="page-head"><div><h1>Consumo</h1><p>Tu consumo en pesos y en conversaciones. Nunca en tokens: eso es problema nuestro.</p></div></div>
      <div className="grid c4">
        <Stat label="Conversaciones del periodo" value={`${fmtN(u.period.used)}`} delta={`de ${fmtN(u.period.included)} incluidas · plan ${u.period.plan}`} up={null} />
        <Stat label="Restantes" value={fmtN(Math.max(0, u.period.included - u.period.used))} delta={`Periodo termina ${u.period.end}`} up={null} />
        <Stat label="Costo del mes (30 días)" value={fmtMXN(u.totals.cost_mxn)} delta="Incluido en tu suscripción" up={null} />
        <Stat label="Excedente" value={fmtMXN(u.period.overage_price_mxn)} delta={me?.org.overage_allowed ? "por conversación · permitido" : "por conversación · no permitido"} up={null} />
      </div>
      <div className="card">
        <div className="row between"><h3>Presupuesto del periodo</h3><span className="small">{Math.round(ratio * 100)} %</span></div>
        <div className={`progress ${ratio >= 1 ? "danger" : ratio >= 0.8 ? "warn" : ""}`} style={{ margin: "10px 0" }}><i style={{ width: `${Math.min(100, ratio * 100)}%` }} /></div>
        <div className="row between">
          <p className="small muted">Al 100 %: {me?.org.overage_allowed ? `seguimos atendiendo y cobramos ${fmtMXN(u.period.overage_price_mxn)} por conversación adicional.` : "el bot pausa y muestra tu mensaje de 'te atiende una persona'. Cambia esto aquí:"}</p>
          <div className="row"><button className="btn sm" onClick={() => toast(me?.org.overage_allowed ? "Excedentes desactivados" : "Excedentes activados: nunca se pausará tu bot")}>{me?.org.overage_allowed ? "No permitir excedentes" : "Permitir excedentes"}</button><button className="btn sm primary" onClick={() => toast("Te contactamos hoy para subir de plan (demo)")}>Subir de plan</button></div>
        </div>
      </div>
      <div className="grid c2">
        <div className="card">
          <h3>Conversaciones por día</h3>
          <div className="bars" aria-label="Conversaciones por día">{u.series.map((d) => <i key={d.day} style={{ height: `${(d.conversations / max) * 100}%` }} title={`${d.day}: ${d.conversations} conversaciones · ${fmtMXN(d.cost_mxn)}`} />)}</div>
          <div className="row between small muted" style={{ marginTop: 6 }}><span>{u.series[0].day}</span><span>{u.series[u.series.length - 1].day}</span></div>
        </div>
        <div className="card">
          <h3>Desglose</h3>
          <table className="tbl"><tbody>
            <tr><td>Conversaciones (30 días)</td><td style={{ textAlign: "right" }}>{fmtN(u.totals.conversations)}</td></tr>
            <tr><td>Costo promedio por conversación</td><td style={{ textAlign: "right" }}>{fmtMXN(u.totals.cost_mxn / Math.max(1, u.totals.conversations))}</td></tr>
            <tr><td>Usuarios adicionales</td><td style={{ textAlign: "right" }}>{u.period.extra_seats} × {fmtMXN(149)}</td></tr>
            <tr><td>Canales con costo de terceros (WhatsApp plantillas, voz)</td><td style={{ textAlign: "right" }}>{fmtMXN(0)}</td></tr>
          </tbody></table>
          <p className="small muted" style={{ marginTop: 10 }}>Alertas automáticas al 80 % y 100 %. Los precios de proveedores se revisan mensualmente; cualquier cambio en excedentes se avisa con 30 días.</p>
        </div>
      </div>
    </>
  );
}
