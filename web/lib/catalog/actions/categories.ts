"use server";

import { z } from "zod";
import { apiGet, isApiHttpError, withQuery } from "@/lib/api";
import { actionClient } from "@/lib/shared";
import type { CursorPage, PagedResult } from "@/lib/shared";
import { mapCategory, type CatalogCategory } from "../mappers";
import type { CategoryDto } from "../types";

const searchCategoriesSchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

const searchCategoriesCursorSchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  cursor: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  limit: z.number().int().min(1).max(100).default(40),
});

const getCategorySchema = z.object({
  id: z.string().trim().min(1),
});

export type SearchCategoriesResult = {
  items: CatalogCategory[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type SearchCategoriesCursorResult = {
  items: CatalogCategory[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
};

export const searchCategoriesAction = actionClient
  .inputSchema(searchCategoriesSchema)
  .action(async ({ parsedInput }): Promise<SearchCategoriesResult> => {
    const { search, page, pageSize } = parsedInput;

    const result = await apiGet<PagedResult<CategoryDto>>(
      withQuery("/api/categories", {
        page,
        pageSize,
        search: search || undefined,
        sortBy: "name",
        sortDir: "asc",
        isActive: true,
      }),
    );

    return {
      items: (result.items ?? []).map((item, index) => mapCategory(item, index)),
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
    };
  });

export const searchCategoriesCursorAction = actionClient
  .inputSchema(searchCategoriesCursorSchema)
  .action(async ({ parsedInput }): Promise<SearchCategoriesCursorResult> => {
    const { search, cursor, limit } = parsedInput;

    const result = await apiGet<CursorPage<CategoryDto>>(
      withQuery("/api/categories/cursor", {
        limit,
        cursor,
        search: search || undefined,
        sortBy: "name",
        sortDir: "asc",
        isActive: true,
      }),
    );

    return {
      items: (result.items ?? []).map((item, index) => mapCategory(item, index)),
      nextCursor: result.nextCursor ?? null,
      hasMore: Boolean(result.hasMore),
      limit: result.limit ?? limit,
    };
  });

export const getCategoryAction = actionClient
  .inputSchema(getCategorySchema)
  .action(async ({ parsedInput }) => {
    try {
      const category = await apiGet<CategoryDto>(
        `/api/categories/${parsedInput.id}`,
      );
      return { category: mapCategory(category) };
    } catch (error) {
      if (isApiHttpError(error) && error.status === 404) {
        return { category: null };
      }
      throw error;
    }
  });
