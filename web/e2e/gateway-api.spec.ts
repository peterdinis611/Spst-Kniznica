import { test, expect, type APIRequestContext } from "@playwright/test";

const gatewayURL =
  process.env.PLAYWRIGHT_GATEWAY_URL ?? "http://localhost:5200";
const requireGateway = process.env.PLAYWRIGHT_REQUIRE_GATEWAY === "1";

async function probeOrSkip(request: APIRequestContext) {
  try {
    const live = await request.get(`${gatewayURL}/health`, { timeout: 3_000 });
    if (!live.ok()) {
      test.skip(!requireGateway, `Gateway unhealthy at ${gatewayURL}`);
      throw new Error(`Gateway unhealthy at ${gatewayURL}`);
    }
  } catch (err) {
    test.skip(!requireGateway, `Gateway not reachable at ${gatewayURL}`);
    throw err;
  }
}

test.describe("gateway catalog API (optional)", () => {
  test("GET /api/books returns a page payload", async ({ request }) => {
    await probeOrSkip(request);

    const res = await request.get(`${gatewayURL}/api/books?page=1&pageSize=5`, {
      timeout: 10_000,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(Array.isArray(body.items)).toBe(true);
    expect(body).toHaveProperty("totalCount");
  });

  test("GET /api/authors and /api/categories respond", async ({ request }) => {
    await probeOrSkip(request);

    const authors = await request.get(
      `${gatewayURL}/api/authors?page=1&pageSize=5`,
      { timeout: 10_000 },
    );
    const categories = await request.get(
      `${gatewayURL}/api/categories?page=1&pageSize=5`,
      { timeout: 10_000 },
    );

    expect(authors.status()).toBe(200);
    expect(categories.status()).toBe(200);
    expect(Array.isArray((await authors.json()).items)).toBe(true);
    expect(Array.isArray((await categories.json()).items)).toBe(true);
  });

  test("GET /api/auth/config is anonymous", async ({ request }) => {
    await probeOrSkip(request);

    const res = await request.get(`${gatewayURL}/api/auth/config`, {
      timeout: 5_000,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("enabled");
  });

  test("staff export without token is unauthorized", async ({ request }) => {
    await probeOrSkip(request);

    const res = await request.get(
      `${gatewayURL}/api/books/export?format=csv&take=10`,
      { timeout: 5_000 },
    );
    expect([401, 403]).toContain(res.status());
  });
});
