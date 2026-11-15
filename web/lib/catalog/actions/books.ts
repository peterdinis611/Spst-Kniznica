"use server";

import { z } from "zod";
import { apiGet, withQuery } from "@/lib/api";
import { actionClient } from "@/lib/shared";
import type { CursorPage, PagedResult } from "@/lib/shared";
import {
  mapBookDetail,
  mapBookListItem,
  type CatalogBook,
} from "../mappers";
import type { BookDetail, BookListItem } from "../types";

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const searchBooksSchema = z.object({
  search: optionalId,
  categoryId: optionalId,
  authorId: optionalId,
  shelfLocation: optionalId,
  availableOnly: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

const searchBooksCursorSchema = z.object({
  search: optionalId,
  categoryId: optionalId,
  authorId: optionalId,
  shelfLocation: optionalId,
  availableOnly: z.boolean().optional(),
  cursor: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  limit: z.number().int().min(1).max(100).default(40),
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

export type SearchBooksCursorResult = {
  items: CatalogBook[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
};

export const searchBooksAction = actionClient
  .inputSchema(searchBooksSchema)
  .action(async ({ parsedInput }): Promise<SearchBooksResult> => {
    const {
      search,
      categoryId,
      authorId,
      shelfLocation,
      availableOnly,
      page,
      pageSize,
    } = parsedInput;

    const result = await apiGet<PagedResult<BookListItem>>(
      withQuery("/api/books", {
        page,
        pageSize,
        search: search || undefined,
        categoryId,
        authorId,
        shelfLocation,
        availableOnly: availableOnly ? true : undefined,
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

export const searchBooksCursorAction = actionClient
  .inputSchema(searchBooksCursorSchema)
  .action(async ({ parsedInput }): Promise<SearchBooksCursorResult> => {
    const {
      search,
      categoryId,
      authorId,
      shelfLocation,
      availableOnly,
      cursor,
      limit,
    } = parsedInput;

    const result = await apiGet<CursorPage<BookListItem>>(
      withQuery("/api/books/cursor", {
        limit,
        cursor,
        search: search || undefined,
        categoryId,
        authorId,
        shelfLocation,
        availableOnly: availableOnly ? true : undefined,
        sortBy: "title",
        sortDir: "asc",
      }),
    );

    return {
      items: (result.items ?? []).map(mapBookListItem),
      nextCursor: result.nextCursor ?? null,
      hasMore: Boolean(result.hasMore),
      limit: result.limit ?? limit,
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
