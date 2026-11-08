"use server";

import { z } from "zod";
import { apiGet, withQuery } from "@/lib/api";
import { mapAuthor, type CatalogAuthor } from "@/lib/catalog-mappers";
import { actionClient } from "@/lib/safe-action";
import type { AuthorDto, PagedResult } from "@/lib/types";

const searchAuthorsSchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  letter: z
    .string()
    .trim()
    .max(1)
    .optional()
    .transform((value) => (value ? value.toUpperCase() : undefined)),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export type SearchAuthorsResult = {
  items: CatalogAuthor[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export const searchAuthorsAction = actionClient
  .inputSchema(searchAuthorsSchema)
  .action(async ({ parsedInput }): Promise<SearchAuthorsResult> => {
    const { search, letter, page, pageSize } = parsedInput;

    const result = await apiGet<PagedResult<AuthorDto>>(
      withQuery("/api/authors", {
        page,
        pageSize,
        search: search || undefined,
        sortBy: "name",
        sortDir: "asc",
      }),
    );

    let items = (result.items ?? []).map(mapAuthor);
    if (letter) {
      items = items.filter(
        (author) => author.name.charAt(0).toUpperCase() === letter,
      );
    }

    return {
      items,
      page: result.page,
      pageSize: result.pageSize,
      totalCount: letter ? items.length : result.totalCount,
    };
  });
