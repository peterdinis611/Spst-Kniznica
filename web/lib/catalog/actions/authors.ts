"use server";

import { z } from "zod";
import { apiGet, withQuery } from "@/lib/api";
import { actionClient } from "@/lib/shared";
import type { PagedResult } from "@/lib/shared";
import { mapAuthor, type CatalogAuthor } from "../mappers";
import type { AuthorDto } from "../types";

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

const getAuthorSchema = z.object({
  id: z.string().trim().min(1),
});

export type SearchAuthorsResult = {
  items: CatalogAuthor[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type GetAuthorResult = {
  author: CatalogAuthor;
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

export const getAuthorAction = actionClient
  .inputSchema(getAuthorSchema)
  .action(async ({ parsedInput }): Promise<GetAuthorResult> => {
    const author = await apiGet<AuthorDto>(`/api/authors/${parsedInput.id}`);
    return { author: mapAuthor(author) };
  });
