import React from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { ApiProvider, ToastProvider, useApi, useData } from "./components/ui";
import { BRAND } from "./brand";
import { Home } from "./pages/Home";
import { Bots } from "./pages/Bots";
import { BotDetail } from "./pages/BotDetail";
import { Conversations } from "./pages/Conversations";
import { Analytics } from "./pages/Analytics";
import { Changelog } from "./pages/Changelog";
import { Team } from "./pages/Team";
import { Usage } from "./pages/Usage";
import { Billing } from "./pages/Billing";
import { Alerts } from "./pages/Alerts";
import { Audit } from "./pages/Audit";
import { Privacy } from "./pages/Privacy";
import { Account } from "./pages/Account";
import { Integrations } from "./pages/Integrations";

const NAV: { group: string; items: { to: string; label: string; badge?: string }[] }[] = [
  { group: "Operación", items: [{ to: "/", label: "Inicio" }, { to: "/bots", label: "Mis bots" }, { to: "/conversaciones", label: "Conversaciones" }, { to: "/alertas", label: "Alertas", badge: "alerts" }] },
  { group: "Inteligencia", items: [{ to: "/rayos-x", label: "Rayos X y KPI" }, { to: "/consumo", label: "Consumo" }, { to: "/cambios", label: "Historial de cambios" }] },
  { group: "Organización", items: [{ to: "/equipo", label: "Equipo y roles" }, { to: "/integraciones", label: "Integraciones y API" }, { to: "/facturacion", label: "Facturación" }, { to: "/privacidad", label: "Datos y privacidad" }, { to: "/auditoria", label: "Auditoría" }, { to: "/cuenta", label: "Cuenta" }] },
];

function Sidebar() {
  const { data: alerts } = useData((api) => api.alerts());
  const pending = alerts?.filter((a) => !a.acknowledged_at).length ?? 0;
  return (
    <nav className="sidebar" aria-label="Navegación principal">
      <div className="brand"><span className="mark" aria-hidden />{BRAND}</div>
      {NAV.map((g) => (
        <React.Fragment key={g.group}>
          <div className="group">{g.group}</div>
          {g.items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
              <span>{it.label}</span>
              {it.badge === "alerts" && pending > 0 && <span className="pill">{pending}</span>}
            </NavLink>
          ))}
        </React.Fragment>
      ))}
      <div className="foot">Soporte: escribe <span className="kbd">humano</span> en el chat de ayuda · Estatus: todo operando</div>
    </nav>
  );
}

function Topbar() {
  const api = useApi();
  const { data: me } = useData((a) => a.me());
  const loc = useLocation();
  const title = NAV.flatMap((g) => g.items).find((i) => (i.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(i.to)))?.label ?? "Panel";
  return (
    <header className="topbar">
      <div className="crumbs">{me?.org.name} / <b>{title}</b></div>
      <div className="who">
        {api.mode === "mock" && <span className="badge rosa">Modo demo · datos de ejemplo</span>}
        <span>{me?.user.name}</span>
        <span className="avatar" aria-hidden>{me?.user.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}</span>
      </div>
    </header>
  );
}

export function App() {
  return (
    <ToastProvider>
      <ApiProvider>
        <div className="shell">
          <Sidebar />
          <div className="main">
            <Topbar />
            <main className="content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/bots" element={<Bots />} />
                <Route path="/bots/:id/*" element={<BotDetail />} />
                <Route path="/conversaciones" element={<Conversations />} />
                <Route path="/conversaciones/:id" element={<Conversations />} />
                <Route path="/rayos-x" element={<Analytics />} />
                <Route path="/consumo" element={<Usage />} />
                <Route path="/cambios" element={<Changelog />} />
                <Route path="/equipo" element={<Team />} />
                <Route path="/integraciones" element={<Integrations />} />
                <Route path="/facturacion" element={<Billing />} />
                <Route path="/privacidad" element={<Privacy />} />
                <Route path="/auditoria" element={<Audit />} />
                <Route path="/cuenta" element={<Account />} />
                <Route path="/alertas" element={<Alerts />} />
                <Route path="*" element={<p>Esta página no existe. <NavLink to="/">Volver al inicio</NavLink></p>} />
              </Routes>
            </main>
          </div>
        </div>
      </ApiProvider>
    </ToastProvider>
  );
}
