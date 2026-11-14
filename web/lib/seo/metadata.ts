import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
  type = "website",
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const mergedKeywords = Array.from(
    new Set([...siteConfig.keywords, ...keywords]),
  );

  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    ...(noIndex
      ? { robots: { index: false, follow: false, nocache: true } }
      : {}),
  };
}

export function buildBookMetadata(input: {
  title: string;
  description: string;
  path: string;
  authors?: string[];
  isbn?: string | null;
  releaseDate?: string | null;
  keywords?: string[];
}): Metadata {
  const base = buildPageMetadata({
    title: input.title,
    description: input.description,
    path: input.path,
    keywords: input.keywords,
  });

  return {
    ...base,
    openGraph: {
      type: "book",
      locale: siteConfig.locale,
      url: absoluteUrl(input.path),
      siteName: siteConfig.name,
      title: input.title,
      description: input.description,
      ...(input.authors?.length ? { authors: input.authors } : {}),
      ...(input.isbn ? { isbn: input.isbn } : {}),
      ...(input.releaseDate ? { releaseDate: input.releaseDate } : {}),
    },
  };
}
