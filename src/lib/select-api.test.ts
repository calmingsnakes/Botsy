import { describe, it, expect } from "vitest";
import { selectApi } from "./index";

describe("selectApi", () => {
  it("returns mock when no url is configured", async () => {
    expect((await selectApi({ apiUrl: "" })).mode).toBe("mock");
  });
  it("returns http when health check succeeds", async () => {
    const fetchImpl = (async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;
    expect((await selectApi({ apiUrl: "https://api.example", fetchImpl, token: () => null })).mode).toBe("http");
  });
  it("falls back to mock when health check fails", async () => {
    const fetchImpl = (async () => { throw new Error("down"); }) as unknown as typeof fetch;
    expect((await selectApi({ apiUrl: "https://api.example", fetchImpl })).mode).toBe("mock");
  });
});
