import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { fetchSitemapCatalog } from "@/lib/seo/sitemap-data";

export const revalidate = 3600;

function entry(
  path: string,
  opts: {
    lastModified?: Date | string | null;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  } = {},
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified: opts.lastModified
      ? new Date(opts.lastModified)
      : new Date(),
    changeFrequency: opts.changeFrequency ?? "weekly",
    priority: opts.priority ?? 0.5,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    entry("/", { lastModified: now, changeFrequency: "weekly", priority: 1 }),
    entry("/books", {
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    }),
    entry("/authors", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    }),
    entry("/categories", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    }),
  ];

  try {
    const { books, authors, categories } = await fetchSitemapCatalog();

    return [
      ...staticEntries,
      ...books.map((book) =>
        entry(`/books/${book.id}`, {
          lastModified: book.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        }),
      ),
      ...authors.map((author) =>
        entry(`/authors/${author.id}`, {
          lastModified: author.updatedAt,
          changeFrequency: "monthly",
          priority: 0.7,
        }),
      ),
      ...categories.map((category) =>
        entry(`/categories/${category.id}`, {
          lastModified: category.updatedAt,
          changeFrequency: "monthly",
          priority: 0.7,
        }),
      ),
    ];
  } catch {
    return staticEntries;
  }
}
