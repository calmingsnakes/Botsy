import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

let token: string | null = null;
/** Read by HttpApi on every request; updated by onAuthStateChange. */
export function currentToken(): string | null { return token; }

type Status = "loading" | "anon" | "authed";
interface Session { status: Status; email?: string; signOut(): Promise<void> }
const Ctx = createContext<Session>({ status: "anon", signOut: async () => {} });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Demo mode: no Supabase → behave as signed in so the mock dashboard keeps working.
  const [s, setS] = useState<Omit<Session, "signOut">>(supabase ? { status: "loading" } : { status: "authed" });
  useEffect(() => {
    if (!supabase) return;
    let settledByEvent = false;
    const apply = (session: { access_token: string; user: { email?: string } } | null) => {
      token = session?.access_token ?? null;
      setS(session ? { status: "authed", email: session.user.email } : { status: "anon" });
      // Drop the ?code=… left by the PKCE exchange so a reload doesn't retry it.
      if (session && new URLSearchParams(window.location.search).has("code")) window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    };
    supabase.auth.getSession().then(({ data }) => { if (settledByEvent) return; apply(data.session); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { settledByEvent = true; apply(session); });
    return () => sub.subscription.unsubscribe();
  }, []);
  const signOut = async () => { await supabase?.auth.signOut(); token = null; };
  return <Ctx.Provider value={{ ...s, signOut }}>{children}</Ctx.Provider>;
}
export function useSession() { return useContext(Ctx); }
