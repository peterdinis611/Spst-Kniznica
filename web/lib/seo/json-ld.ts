import { absoluteUrl, siteConfig } from "@/lib/site";

export type JsonLd = Record<string, unknown>;

export function libraryJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Library",
    "@id": `${absoluteUrl("/")}#library`,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    inLanguage: siteConfig.language,
    address: {
      "@type": "PostalAddress",
      addressCountry: "SK",
      streetAddress: siteConfig.address,
    },
    isAccessibleForFree: true,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/books")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    name: siteConfig.name,
    url: absoluteUrl("/"),
    inLanguage: siteConfig.language,
    publisher: { "@id": `${absoluteUrl("/")}#library` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/books")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path?: string }>,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path
        ? { item: absoluteUrl(item.path) }
        : {}),
    })),
  };
}

export function bookJsonLd(book: {
  id: string;
  title: string;
  author: string;
  description?: string | null;
  isbn?: string | null;
  publishedYear?: number | null;
  language?: string | null;
  coverUrl?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": absoluteUrl(`/books/${book.id}`),
    name: book.title,
    url: absoluteUrl(`/books/${book.id}`),
    description:
      book.description?.trim() ||
      `${book.title} od ${book.author} vo fonde ${siteConfig.name}.`,
    inLanguage: book.language || siteConfig.language,
    author: {
      "@type": "Person",
      name: book.author,
    },
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(book.publishedYear
      ? { datePublished: String(book.publishedYear) }
      : {}),
    ...(book.coverUrl
      ? { image: book.coverUrl }
      : { image: absoluteUrl(`/books/${book.id}/opengraph-image`) }),
    isPartOf: { "@id": `${absoluteUrl("/")}#library` },
  };
}

export function personJsonLd(author: {
  id: string;
  name: string;
  bio?: string;
  nationality?: string;
  birthYear?: number | null;
  sameAs?: string[];
}): JsonLd {
  const sameAs = (author.sameAs ?? []).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": absoluteUrl(`/authors/${author.id}`),
    name: author.name,
    url: absoluteUrl(`/authors/${author.id}`),
    description: author.bio,
    ...(author.nationality && author.nationality !== "—"
      ? { nationality: author.nationality }
      : {}),
    ...(author.birthYear
      ? { birthDate: String(author.birthYear) }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function authorSameAsLinks(author: {
  profileUrl?: string | null;
  wikidataId?: string | null;
  viafId?: string | null;
}): string[] {
  const links: string[] = [];
  if (author.profileUrl?.trim()) links.push(author.profileUrl.trim());
  if (author.wikidataId?.trim()) {
    links.push(`https://www.wikidata.org/wiki/${author.wikidataId.trim()}`);
  }
  if (author.viafId?.trim()) {
    links.push(`https://viaf.org/viaf/${author.viafId.trim()}/`);
  }
  return Array.from(new Set(links));
}

export function collectionJsonLd(category: {
  id: string;
  name: string;
  description?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": absoluteUrl(`/categories/${category.id}`),
    name: category.name,
    description: category.description,
    url: absoluteUrl(`/categories/${category.id}`),
    isPartOf: { "@id": `${absoluteUrl("/")}#library` },
  };
}
