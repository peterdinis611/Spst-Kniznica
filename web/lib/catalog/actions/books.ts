"use server";

import { z } from "zod";
import { apiGet, isApiHttpError, withQuery } from "@/lib/api";
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

const optionalLanguage = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalYear = z
  .number()
  .int()
  .min(1000)
  .max(2100)
  .optional();

const idListSchema = z
  .array(z.string().trim().min(1))
  .max(40)
  .optional()
  .transform((value) => (value?.length ? value : undefined));

const searchBooksSchema = z.object({
  search: optionalId,
  categoryId: optionalId,
  categoryIds: idListSchema,
  authorId: optionalId,
  authorIds: idListSchema,
  shelfLocation: optionalId,
  availableOnly: z.boolean().optional(),
  language: optionalLanguage,
  year: optionalYear,
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

const searchBooksCursorSchema = z.object({
  search: optionalId,
  categoryId: optionalId,
  categoryIds: idListSchema,
  authorId: optionalId,
  authorIds: idListSchema,
  shelfLocation: optionalId,
  availableOnly: z.boolean().optional(),
  language: optionalLanguage,
  year: optionalYear,
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
      categoryIds,
      authorId,
      authorIds,
      shelfLocation,
      availableOnly,
      language,
      year,
      page,
      pageSize,
    } = parsedInput;

    const result = await apiGet<PagedResult<BookListItem>>(
      withQuery("/api/books", {
        page,
        pageSize,
        search: search || undefined,
        categoryId: categoryIds?.length ? undefined : categoryId,
        categoryIds: categoryIds?.length ? categoryIds : undefined,
        authorId: authorIds?.length ? undefined : authorId,
        authorIds: authorIds?.length ? authorIds : undefined,
        shelfLocation,
        availableOnly: availableOnly ? true : undefined,
        language,
        publishedYear: year,
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
      categoryIds,
      authorId,
      authorIds,
      shelfLocation,
      availableOnly,
      language,
      year,
      cursor,
      limit,
    } = parsedInput;

    const result = await apiGet<CursorPage<BookListItem>>(
      withQuery("/api/books/cursor", {
        limit,
        cursor,
        search: search || undefined,
        categoryId: categoryIds?.length ? undefined : categoryId,
        categoryIds: categoryIds?.length ? categoryIds : undefined,
        authorId: authorIds?.length ? undefined : authorId,
        authorIds: authorIds?.length ? authorIds : undefined,
        shelfLocation,
        availableOnly: availableOnly ? true : undefined,
        language,
        publishedYear: year,
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
  book: CatalogBook | null;
};

export const getBookAction = actionClient
  .inputSchema(getBookSchema)
  .action(async ({ parsedInput }): Promise<GetBookResult> => {
    try {
      const book = await apiGet<BookDetail>(`/api/books/${parsedInput.id}`);
      return { book: mapBookDetail(book) };
    } catch (error) {
      if (isApiHttpError(error) && error.status === 404) {
        return { book: null };
      }
      throw error;
    }
  });
