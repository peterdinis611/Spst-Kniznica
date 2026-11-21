import { test, expect } from "@playwright/test";

test.describe("SEO / AI discovery smoke", () => {
  test("sitemap.xml is XML with absolute URLs", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toMatch(/https?:\/\/.+\/books/);
  });

  test("robots.txt points to sitemap and allows llms.txt", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/Sitemap:\s*https?:\/\//i);
    expect(body).toContain("llms.txt");
    expect(body).toContain("Disallow: /admin");
  });

  test("llms.txt is markdown with H1", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] ?? "").toMatch(/text\/markdown/);
    const body = await res.text();
    expect(body.startsWith("# SPST Knižnica")).toBe(true);
    expect(body).toContain("## Prehľad");
    expect(body).toContain("/llms-full.txt");
  });

  test("llms-full.txt includes FAQ", async ({ request }) => {
    const res = await request.get("/llms-full.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] ?? "").toMatch(/text\/markdown/);
    const body = await res.text();
    expect(body).toContain("## FAQ");
    expect(body).toContain("Potrebujem účet");
  });

  test("overview.md is markdown", async ({ request }) => {
    const res = await request.get("/overview.md");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] ?? "").toMatch(/text\/markdown/);
    const body = await res.text();
    expect(body.startsWith("# SPST Knižnica")).toBe(true);
  });
});
