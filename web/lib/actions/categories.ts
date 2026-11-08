"use server";

import { z } from "zod";
import { apiGet, withQuery } from "@/lib/api";
import { mapCategory, type CatalogCategory } from "@/lib/catalog-mappers";
import { actionClient } from "@/lib/safe-action";
import type { CategoryDto, PagedResult } from "@/lib/types";

const searchCategoriesSchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
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

export const getCategoryAction = actionClient
  .inputSchema(getCategorySchema)
  .action(async ({ parsedInput }) => {
    const category = await apiGet<CategoryDto>(
      `/api/categories/${parsedInput.id}`,
    );
    return { category: mapCategory(category) };
  });
