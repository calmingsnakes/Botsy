import { Link } from "react-router-dom";
import { fmtDate, useData, useToast } from "../components/ui";

export function Changelog() {
  const toast = useToast();
  const { data } = useData((a) => a.changelog());
  return (
    <>
      <div className="page-head"><div><h1>Historial de cambios</h1><p>Cada versión publicada de cada bot: quién, cuándo, por qué. Puedes regresar a cualquier versión anterior en un clic.</p></div></div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <thead><tr><th>Cuándo</th><th>Bot</th><th>Versión</th><th>Motivo</th><th>Cambios</th><th>Por</th><th></th></tr></thead>
          <tbody>{data?.map((e) => (
            <tr key={e.id}><td className="small">{fmtDate(e.at)}</td><td><Link to={`/bots/${e.bot_id}`}>{e.bot_name}</Link></td><td><b>v{e.version}</b></td><td>{e.reason}</td><td>{e.changes}</td><td className="small">{e.actor}</td><td><button className="btn sm" onClick={() => toast(`Se publicaría de nuevo la v${e.version} como una versión nueva (demo).`)}>Regresar a esta versión</button></td></tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
