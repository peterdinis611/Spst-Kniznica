import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/lib/seo/serialize-json-ld";

describe("serializeJsonLd", () => {
  it("escapes script-breakout characters", () => {
    const payload = {
      name: "</script><script>alert(1)</script>",
      note: "a & b > c",
    };

    const html = serializeJsonLd(payload);

    expect(html).not.toContain("</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("\\u003c");
    expect(html).toContain("\\u003e");
    expect(html).toContain("\\u0026");
    expect(JSON.parse(html)).toEqual(payload);
  });

  it("escapes U+2028 / U+2029 line separators", () => {
    const payload = { t: "line\u2028break\u2029" };
    const html = serializeJsonLd(payload);
    expect(html).toContain("\\u2028");
    expect(html).toContain("\\u2029");
    expect(JSON.parse(html)).toEqual(payload);
  });
});
