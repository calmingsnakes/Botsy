import type { Api } from "./api";
import { MockApi } from "./mock-api";
import { HttpApi } from "./http-api";

export type { Api };

/**
 * Select the API implementation: HttpApi when VITE_API_URL is set and its /health responds; otherwise MockApi.
 * `fetchImpl` is injectable for tests.
 */
export async function selectApi(opts: { apiUrl?: string; fetchImpl?: typeof fetch; token?: () => string | null } = {}): Promise<Api> {
  const url = opts.apiUrl ?? (import.meta as any).env?.VITE_API_URL;
  if (!url) return new MockApi();
  const f = opts.fetchImpl ?? fetch;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await f(`${url}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) return new HttpApi(url, opts.token ?? (() => localStorage.getItem("sb_token")));
  } catch { /* fall through */ }
  return new MockApi();
}

let instance: Promise<Api> | undefined;
export function getApi(): Promise<Api> { return (instance ??= selectApi()); }
