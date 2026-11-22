import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyDiscoveryPath,
  getDiscoverySnapshot,
  recordDiscoveryHit,
  resetDiscoveryMonitorForTests,
} from "@/lib/seo/discovery-monitor";

describe("discovery-monitor", () => {
  afterEach(() => {
    resetDiscoveryMonitorForTests();
    vi.restoreAllMocks();
  });

  it("classifies public discovery paths", () => {
    expect(classifyDiscoveryPath("/llms.txt")).toBe("llms.txt");
    expect(classifyDiscoveryPath("/llms-full.txt")).toBe("llms-full.txt");
    expect(classifyDiscoveryPath("/overview.md")).toBe("overview.md");
    expect(classifyDiscoveryPath("/sitemap.xml")).toBe("sitemap.xml");
    expect(classifyDiscoveryPath("/robots.txt")).toBe("robots.txt");
    expect(classifyDiscoveryPath("/books/abc.md")).toBe("book.md");
    expect(classifyDiscoveryPath("/_md/authors/x")).toBe("author.md");
    expect(classifyDiscoveryPath("/books")).toBeNull();
  });

  it("records hits and exposes snapshot", () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);

    recordDiscoveryHit({
      kind: "llms.txt",
      path: "/llms.txt",
      userAgent: "GPTBot/1.0",
    });
    recordDiscoveryHit({
      kind: "sitemap.xml",
      path: "/sitemap.xml",
    });

    const snap = getDiscoverySnapshot();
    expect(snap.totals["llms.txt"]).toBe(1);
    expect(snap.totals["sitemap.xml"]).toBe(1);
    expect(snap.totalHits).toBe(2);
    expect(snap.recent[0]?.kind).toBe("sitemap.xml");
    expect(log).toHaveBeenCalled();
    expect(String(log.mock.calls[0]?.[0])).toContain("seo-discovery");
  });
});
