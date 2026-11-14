import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adminHttpDownload,
  parseContentDispositionFileName,
} from "@/lib/admin/http";

describe("parseContentDispositionFileName", () => {
  it("uses fallback when header missing", () => {
    expect(parseContentDispositionFileName(null, "fallback.csv")).toBe(
      "fallback.csv",
    );
  });

  it("parses quoted filename", () => {
    expect(
      parseContentDispositionFileName(
        'attachment; filename="books-export.csv"',
        "x.csv",
      ),
    ).toBe("books-export.csv");
  });

  it("parses RFC5987 filename*", () => {
    expect(
      parseContentDispositionFileName(
        "attachment; filename*=UTF-8''knihy%20export.csv",
        "x.csv",
      ),
    ).toBe("knihy export.csv");
  });
});

describe("adminHttpDownload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns blob and filename from Content-Disposition", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("a,b\n1,2\n", {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="books.csv"',
          },
        }),
      ),
    );

    const result = await adminHttpDownload("/api/books/export", "fallback.csv");
    expect(result.fileName).toBe("books.csv");
    expect(await result.blob.text()).toContain("a,b");
  });

  it("throws HttpError with API detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Forbidden export" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      adminHttpDownload("/api/books/export", "x.csv"),
    ).rejects.toThrow("Forbidden export");
  });
});
