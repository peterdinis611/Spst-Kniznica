import type {
  CreateParams,
  DataProvider,
  DeleteManyParams,
  DeleteParams,
  GetListParams,
  GetManyParams,
  GetManyReferenceParams,
  GetOneParams,
  Identifier,
  RaRecord,
  UpdateManyParams,
  UpdateParams,
} from "react-admin";
import type { PagedResult } from "@/lib/shared";
import { adminHttp, adminQuery } from "./http";

const RESOURCE_PATH: Record<string, string> = {
  books: "/api/books",
  authors: "/api/authors",
  categories: "/api/categories",
  bookings: "/api/bookings",
};

function resourcePath(resource: string): string {
  const path = RESOURCE_PATH[resource];
  if (!path) throw new Error(`Neznámy admin resource: ${resource}`);
  return path;
}

function asRecord(item: RaRecord): RaRecord {
  return { ...item, id: String(item.id) };
}

function listQuery(resource: string, params: GetListParams) {
  const { page, perPage } = params.pagination ?? { page: 1, perPage: 25 };
  const { field, order } = params.sort ?? { field: "id", order: "ASC" };
  const filter = params.filter ?? {};

  const query: Record<string, string | number | boolean | undefined> = {
    page,
    pageSize: perPage,
    sortBy: field,
    sortDir: order.toLowerCase(),
    search:
      typeof filter.q === "string"
        ? filter.q
        : typeof filter.search === "string"
          ? filter.search
          : undefined,
  };

  if (resource === "books") {
    if (filter.authorId) query.authorId = String(filter.authorId);
    if (filter.categoryId) query.categoryId = String(filter.categoryId);
    if (filter.availableOnly === true || filter.availableOnly === "true") {
      query.availableOnly = true;
    }
  }

  if (resource === "authors") {
    if (filter.nationality) query.nationality = String(filter.nationality);
    if (filter.isActive !== undefined && filter.isActive !== null && filter.isActive !== "") {
      query.isActive = filter.isActive === true || filter.isActive === "true";
    }
  }

  if (resource === "categories") {
    if (filter.isActive !== undefined && filter.isActive !== null && filter.isActive !== "") {
      query.isActive = filter.isActive === true || filter.isActive === "true";
    }
  }

  if (resource === "bookings") {
    if (filter.bookId) query.bookId = String(filter.bookId);
    if (filter.borrowerEmail) query.borrowerEmail = String(filter.borrowerEmail);
    if (
      filter.status !== undefined &&
      filter.status !== null &&
      filter.status !== ""
    ) {
      query.status = Number(filter.status);
    }
  }

  return query;
}

function stripMeta(data: Record<string, unknown>) {
  const next = { ...data };
  delete next.id;
  delete next.createdAt;
  delete next.updatedAt;
  delete next.author;
  delete next.categoryName;
  delete next.copies;
  delete next.reservedAt;
  delete next.borrowedAt;
  delete next.returnedAt;
  return next;
}

async function getList(resource: string, params: GetListParams) {
  const path = resourcePath(resource);
  const result = await adminHttp<PagedResult<RaRecord>>(
    adminQuery(path, listQuery(resource, params)),
  );
  return {
    data: (result.items ?? []).map(asRecord),
    total: result.totalCount ?? 0,
  };
}

async function getOne(resource: string, params: GetOneParams) {
  const item = await adminHttp<RaRecord>(
    `${resourcePath(resource)}/${params.id}`,
  );
  return { data: asRecord(item) };
}

async function create(resource: string, params: CreateParams) {
  const created = await adminHttp<RaRecord>(
    resourcePath(resource),
    { method: "POST" },
    stripMeta(params.data as Record<string, unknown>),
  );
  return { data: asRecord(created) };
}

async function update(resource: string, params: UpdateParams) {
  const updated = await adminHttp<RaRecord>(
    `${resourcePath(resource)}/${params.id}`,
    { method: "PUT" },
    stripMeta(params.data as Record<string, unknown>),
  );
  return { data: asRecord(updated) };
}

async function deleteOne(resource: string, params: DeleteParams) {
  await adminHttp<void>(`${resourcePath(resource)}/${params.id}`, {
    method: "DELETE",
  });
  return {
    data: (params.previousData as RaRecord) ?? ({ id: params.id } as RaRecord),
  };
}

export const adminDataProvider = {
  getList,
  getOne,
  getMany: async (resource: string, params: GetManyParams) => {
    const results = await Promise.all(
      params.ids.map(async (id) => {
        const item = await adminHttp<RaRecord>(
          `${resourcePath(resource)}/${id}`,
        );
        return asRecord(item);
      }),
    );
    return { data: results };
  },
  getManyReference: async (
    resource: string,
    params: GetManyReferenceParams,
  ) => {
    return getList(resource, {
      ...params,
      filter: {
        ...params.filter,
        [params.target]: params.id,
      },
    });
  },
  create,
  update,
  updateMany: async (resource: string, params: UpdateManyParams) => {
    const ids: Identifier[] = [];
    for (const id of params.ids) {
      await update(resource, {
        id,
        data: params.data,
        previousData: { id },
      });
      ids.push(id);
    }
    return { data: ids };
  },
  delete: deleteOne,
  deleteMany: async (resource: string, params: DeleteManyParams) => {
    for (const id of params.ids) {
      await deleteOne(resource, { id, previousData: { id } });
    }
    return { data: params.ids };
  },
} as DataProvider;
