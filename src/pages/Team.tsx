import { useState } from "react";
import type { OrgRole } from "../lib/types";
import { Badge, ago, useApi, useData, useToast } from "../components/ui";

const ROLES: Record<OrgRole, string> = { owner: "Propietario: todo, incluida facturación y borrado", admin: "Administrador: bots, equipo, canales", editor: "Editor: Documento Maestro y base de conocimiento", viewer: "Lector: solo ve conversaciones y reportes" };

export function Team() {
  const api = useApi();
  const toast = useToast();
  const { data: members, reload } = useData((a) => a.members());
  const { data: me } = useData((a) => a.me());
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("editor");
  const included = 3;
  return (
    <>
      <div className="page-head"><div><h1>Equipo y roles</h1><p>Tu plan incluye {included} usuarios; los adicionales cuestan MXN 149 al mes. Propietarios y administradores deben tener verificación en dos pasos.</p></div></div>
      <div className="grid split-2">
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead><tr><th>Persona</th><th>Rol</th><th>2 pasos</th><th>Último acceso</th><th></th></tr></thead>
            <tbody>{members?.map((m) => (
              <tr key={m.user_id}><td><b>{m.display_name}</b><div className="small muted">{m.email}</div></td>
                <td><select className="select" value={m.role} disabled={m.role === "owner"} onChange={async (e) => { await api.updateMember(m.user_id, e.target.value as OrgRole); reload(); toast("Rol actualizado"); }}>{(Object.keys(ROLES) as OrgRole[]).map((r) => <option key={r} value={r}>{r}</option>)}</select></td>
                <td>{m.mfa ? <Badge tone="green">Activa</Badge> : (m.role === "owner" || m.role === "admin") ? <Badge tone="red">Obligatoria · pendiente</Badge> : <Badge tone="gray">No</Badge>}</td>
                <td className="small muted">{m.last_login ? ago(m.last_login) : "nunca"}</td>
                <td>{m.role !== "owner" && <button className="btn sm danger" onClick={async () => { await api.removeMember(m.user_id); reload(); toast("Acceso retirado"); }}>Quitar</button>}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="stack">
          <div className="card stack">
            <h3>Invitar</h3>
            <input className="input" placeholder="correo@empresa.mx" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select className="select" value={role} onChange={(e) => setRole(e.target.value as OrgRole)}>{(Object.keys(ROLES) as OrgRole[]).filter((r) => r !== "owner").map((r) => <option key={r} value={r}>{r}</option>)}</select>
            <p className="small muted">{ROLES[role]}</p>
            {(members?.length ?? 0) >= included && <p className="small" style={{ color: "var(--amber)" }}>Este usuario se cobrará como adicional (MXN 149/mes).</p>}
            <button className="btn primary" disabled={!email.includes("@")} onClick={async () => { await api.invite(email, role); setEmail(""); reload(); toast("Invitación enviada"); }}>Enviar invitación</button>
          </div>
          <div className="card"><h3>Roles</h3><ul className="small muted" style={{ paddingLeft: 18, margin: 0 }}>{Object.values(ROLES).map((r) => <li key={r}>{r}</li>)}</ul></div>
          {me && <div className="card small"><b>Tu acceso:</b> {me.role} · {me.user.email}</div>}
        </div>
      </div>
    </>
  );
}
