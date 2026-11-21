import { describe, expect, it } from "vitest";
import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildOverviewMarkdown,
} from "@/lib/seo/llms-txt";

describe("llms.txt builders", () => {
  it("buildLlmsTxt follows H1 + blockquote + H2 file lists", () => {
    const text = buildLlmsTxt();
    expect(text.startsWith("# SPST Knižnica\n")).toBe(true);
    expect(text).toContain("\n> ");
    expect(text).toContain("## Prehľad");
    expect(text).toContain("## SEO a crawl");
    expect(text).toContain("## Optional");
    expect(text).toContain("/overview.md");
    expect(text).toContain("/llms-full.txt");
    expect(text).toContain("/sitemap.xml");
    expect(text).toContain("/robots.txt");
    expect(text).toContain("/books");
  });

  it("buildOverviewMarkdown links back to llms.txt and sitemap", () => {
    const md = buildOverviewMarkdown();
    expect(md.startsWith("# SPST Knižnica\n")).toBe(true);
    expect(md).toContain("/llms.txt");
    expect(md).toContain("/sitemap.xml");
    expect(md).toContain("/robots.txt");
    expect(md).toContain("/books");
  });

  it("buildLlmsFullTxt includes FAQ and loan rules", () => {
    const full = buildLlmsFullTxt();
    expect(full).toContain("## FAQ");
    expect(full).toContain("## Pravidlá výpožičiek");
    expect(full).toContain("Potrebujem účet");
  });
});
