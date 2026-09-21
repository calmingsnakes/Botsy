import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../../lib/session";
import { useData } from "../../components/ui";
import { CreateOrg } from "./CreateOrg";

/** Gate: anon → /login; authed without org → CreateOrg; otherwise render children. */
export function RequireSession({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const loc = useLocation();
  if (status === "loading") return <div className="content"><p className="muted">Cargando…</p></div>;
  if (status === "anon") return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return <OrgGate>{children}</OrgGate>;
}

function OrgGate({ children }: { children: React.ReactNode }) {
  const { data: me, error, reload } = useData((a) => a.me());
  if (error) return <div className="content"><p className="small" style={{ color: "var(--red)" }}>No pudimos cargar tu cuenta: {error}</p></div>;
  if (!me) return <div className="content"><p className="muted">Cargando…</p></div>;
  if (me.orgs.length === 0) return <CreateOrg onCreated={reload} />;
  return <>{children}</>;
}
