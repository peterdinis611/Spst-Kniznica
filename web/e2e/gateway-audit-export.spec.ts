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

test.describe("gateway audit export (optional)", () => {
  test("audit-logs export without token is unauthorized", async ({
    request,
  }) => {
    await probeOrSkip(request);

    const res = await request.get(
      `${gatewayURL}/api/admin/audit-logs/export?format=csv&take=10`,
      { timeout: 5_000 },
    );
    expect([401, 403]).toContain(res.status());
  });
});
