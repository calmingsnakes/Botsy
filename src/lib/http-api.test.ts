import { describe, it, expect } from "vitest";
import { HttpApi } from "./http-api";

function stub(routes: Record<string, (init?: RequestInit) => unknown>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const key = `${init?.method ?? "GET"} ${new URL(url).pathname}`;
    const h = routes[key];
    if (!h) return new Response(JSON.stringify({ message: "nope" }), { status: 404 });
    return new Response(JSON.stringify(h(init)), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("HttpApi auth-aware methods", () => {
  it("me() calls /v1/me with the bearer token and maps the first org", async () => {
    const { fetchImpl, calls } = stub({ "GET /v1/me": () => ({ user: { id: "u1", email: "a@b.mx", name: "Ana" }, orgs: [{ id: "o1", name: "Espiga", plan: "inicio", role: "owner" }] }) });
    const api = new HttpApi("https://api.test", () => "tok", fetchImpl);
    const me = await api.me();
    expect(calls[0].init?.headers).toMatchObject({ authorization: "Bearer tok" });
    expect(me.org.id).toBe("o1");
    expect(me.role).toBe("owner");
    expect(me.orgs).toHaveLength(1);
  });
  it("me() with no orgs returns an empty placeholder org", async () => {
    const { fetchImpl } = stub({ "GET /v1/me": () => ({ user: { id: "u1", email: "a@b.mx", name: "Ana" }, orgs: [] }) });
    const me = await new HttpApi("https://api.test", () => "tok", fetchImpl).me();
    expect(me.orgs).toEqual([]);
    expect(me.org.id).toBe("");
  });
  it("createOrg posts the name", async () => {
    const { fetchImpl, calls } = stub({ "POST /v1/orgs": (init) => ({ id: "o9", ...JSON.parse(String(init?.body)), slug: "x", plan: "inicio" }) });
    const org = await new HttpApi("https://api.test", () => "tok", fetchImpl).createOrg("Foco Films");
    expect(org).toMatchObject({ id: "o9", name: "Foco Films", role: "owner" });
    expect(calls[0].init?.method).toBe("POST");
  });
  it("members()/invite()/updateMember()/removeMember() hit the org routes", async () => {
    const seen: string[] = [];
    const { fetchImpl } = stub({
      "GET /v1/me": () => ({ user: { id: "u1", email: "a@b.mx", name: "A" }, orgs: [{ id: "o1", name: "E", plan: "inicio", role: "owner" }] }),
      "GET /v1/orgs/o1/members": () => (seen.push("list"), [{ user_id: "u1", status: "active" }]),
      "POST /v1/orgs/o1/invites": () => (seen.push("invite"), { user_id: "u2", status: "invited" }),
      "PATCH /v1/orgs/o1/members/u2": () => (seen.push("patch"), { ok: true }),
      "DELETE /v1/orgs/o1/members/u2": () => (seen.push("delete"), { ok: true }),
    });
    const api = new HttpApi("https://api.test", () => "tok", fetchImpl);
    await api.me();
    expect((await api.members())[0].status).toBe("active");
    await api.invite("b@b.mx", "editor");
    await api.updateMember("u2", "viewer");
    await api.removeMember("u2");
    expect(seen).toEqual(["list", "invite", "patch", "delete"]);
  });
});
