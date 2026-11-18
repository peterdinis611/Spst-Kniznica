import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "react-admin";
import { adminHttpForm } from "@/lib/admin/http";

describe("adminHttpForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts FormData without Content-Type header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ imported: 3 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const form = new FormData();
    form.append("file", new Blob(["a,b"]), "books.csv");

    await expect(
      adminHttpForm<{ imported: number }>("/api/books/import", form),
    ).resolves.toEqual({ imported: 3 });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(form);
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("throws HttpError with detail on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "CSV je poškodený" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      adminHttpForm("/api/books/import", new FormData()),
    ).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof HttpError &&
        err.status === 400 &&
        err.message === "CSV je poškodený",
    );
  });
});
