"use server";

import { z } from "zod";
import { apiGet, withQuery } from "@/lib/api";
import {
  mapBookDetail,
  mapBookListItem,
  type CatalogBook,
} from "@/lib/catalog-mappers";
import { actionClient } from "@/lib/safe-action";
import type { BookDetail, BookListItem, PagedResult } from "@/lib/types";

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const searchBooksSchema = z.object({
  search: optionalId,
  categoryId: optionalId,
  authorId: optionalId,
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

const getBookSchema = z.object({
  id: z.string().trim().min(1),
});

export type SearchBooksResult = {
  items: CatalogBook[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export const searchBooksAction = actionClient
  .inputSchema(searchBooksSchema)
  .action(async ({ parsedInput }): Promise<SearchBooksResult> => {
    const { search, categoryId, authorId, page, pageSize } = parsedInput;

    const result = await apiGet<PagedResult<BookListItem>>(
      withQuery("/api/books", {
        page,
        pageSize,
        search: search || undefined,
        categoryId,
        authorId,
        sortBy: "title",
        sortDir: "asc",
      }),
    );

    return {
      items: (result.items ?? []).map(mapBookListItem),
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
    };
  });

export type GetBookResult = {
  book: CatalogBook;
};

export const getBookAction = actionClient
  .inputSchema(getBookSchema)
  .action(async ({ parsedInput }): Promise<GetBookResult> => {
    const book = await apiGet<BookDetail>(`/api/books/${parsedInput.id}`);
    return { book: mapBookDetail(book) };
  });
