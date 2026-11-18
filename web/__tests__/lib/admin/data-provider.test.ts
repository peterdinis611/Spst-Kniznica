import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/http", () => ({
  adminHttp: vi.fn(),
  adminQuery: vi.fn((path: string, query: Record<string, unknown>) => ({
    path,
    query,
  })),
}));

import { adminHttp, adminQuery } from "@/lib/admin/http";
import { adminDataProvider } from "@/lib/admin/data-provider";

const mockedHttp = vi.mocked(adminHttp);
const mockedQuery = vi.mocked(adminQuery);

describe("adminDataProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps audit-logs list filters into query", async () => {
    mockedHttp.mockResolvedValue({
      items: [{ id: "1", action: "book.export" }],
      totalCount: 1,
    });

    const result = await adminDataProvider.getList("audit-logs", {
      pagination: { page: 2, perPage: 10 },
      sort: { field: "occurredAt", order: "DESC" },
      filter: {
        action: "book.export",
        entityType: "Book",
        actorEmail: "admin@spst.sk",
        sourceService: "BookService",
      },
    });

    expect(mockedQuery).toHaveBeenCalledWith(
      "/api/admin/audit-logs",
      expect.objectContaining({
        page: 2,
        pageSize: 10,
        sortBy: "occurredAt",
        sortDir: "desc",
        action: "book.export",
        entityType: "Book",
        actorEmail: "admin@spst.sk",
        sourceService: "BookService",
      }),
    );
    expect(result.total).toBe(1);
    expect(result.data[0].id).toBe("1");
  });

  it("maps books filters including availableOnly", async () => {
    mockedHttp.mockResolvedValue({ items: [], totalCount: 0 });

    await adminDataProvider.getList("books", {
      pagination: { page: 1, perPage: 25 },
      sort: { field: "title", order: "ASC" },
      filter: {
        q: "motor",
        authorId: "a1",
        categoryId: "c1",
        availableOnly: true,
      },
    });

    expect(mockedQuery).toHaveBeenCalledWith(
      "/api/books",
      expect.objectContaining({
        search: "motor",
        authorId: "a1",
        categoryId: "c1",
        availableOnly: true,
      }),
    );
  });

  it("rejects unknown resources", async () => {
    await expect(
      adminDataProvider.getList("widgets", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      }),
    ).rejects.toThrow(/Neznámy admin resource/);
  });

  it("blocks create/update/delete on audit-logs", async () => {
    await expect(
      adminDataProvider.create("audit-logs", { data: { action: "x" } }),
    ).rejects.toThrow(/Audit logy sú len na čítanie/);

    await expect(
      adminDataProvider.update("audit-logs", {
        id: "1",
        data: { action: "x" },
        previousData: { id: "1" },
      }),
    ).rejects.toThrow(/Audit logy sú len na čítanie/);

    await expect(
      adminDataProvider.delete("audit-logs", {
        id: "1",
        previousData: { id: "1" },
      }),
    ).rejects.toThrow(/Audit logy sú len na čítanie/);

    expect(mockedHttp).not.toHaveBeenCalled();
  });
});
