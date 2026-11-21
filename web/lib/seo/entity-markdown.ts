import type {
  CatalogAuthor,
  CatalogBook,
  CatalogCategory,
} from "@/lib/catalog/mappers";
import { absoluteUrl, siteConfig } from "@/lib/site";

function mdEscape(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

export function buildBookMarkdown(book: CatalogBook): string {
  const html = absoluteUrl(`/books/${book.id}`);
  const lines = [
    `# ${mdEscape(book.title)}`,
    "",
    `> ${mdEscape(book.subtitle || `${book.title} · ${siteConfig.name}`)}`,
    "",
    `- **Autor:** ${mdEscape(book.author)}`,
    book.categoryName
      ? `- **Kategória:** ${mdEscape(book.categoryName)}`
      : null,
    book.year ? `- **Rok:** ${book.year}` : null,
    book.publisher ? `- **Vydavateľ:** ${mdEscape(book.publisher)}` : null,
    book.isbn ? `- **ISBN:** ${book.isbn}` : null,
    book.language ? `- **Jazyk:** ${mdEscape(book.language)}` : null,
    `- **Dostupnosť:** ${book.availableCopies} / ${book.totalCopies} exemplárov`,
    book.shelfLocation
      ? `- **Umiestnenie:** ${mdEscape(book.shelfLocation)}`
      : null,
    "",
    "## Popis",
    "",
    mdEscape(
      book.description?.trim() ||
        "Bez podrobného popisu vo fonde SPST Knižnice.",
    ),
    "",
    "## Odkazy",
    "",
    `- [HTML stránka](${html})`,
    `- [Katalóg kníh](${absoluteUrl("/books")})`,
    `- [llms.txt](${absoluteUrl("/llms.txt")})`,
    "",
  ];

  return lines.filter((line) => line !== null).join("\n");
}

export function buildAuthorMarkdown(
  author: CatalogAuthor,
  bookTitles: string[] = [],
): string {
  const html = absoluteUrl(`/authors/${author.id}`);
  const bio =
    author.bio && author.bio !== "Bez biografie."
      ? author.bio
      : "Bez biografie vo fonde SPST Knižnice.";

  const bookList =
    bookTitles.length > 0
      ? [
          "",
          "## Tituly vo fonde",
          "",
          ...bookTitles.slice(0, 20).map((title) => `- ${mdEscape(title)}`),
          bookTitles.length > 20
            ? `- … a ďalších ${bookTitles.length - 20}`
            : null,
        ]
      : [];

  return [
    `# ${mdEscape(author.name)}`,
    "",
    `> Autor vo fonde ${siteConfig.name}.`,
    "",
    author.nationality && author.nationality !== "—"
      ? `- **Národnosť:** ${mdEscape(author.nationality)}`
      : null,
    author.birthYear ? `- **Narodený:** ${author.birthYear}` : null,
    typeof author.bookCount === "number"
      ? `- **Počet titulov:** ${author.bookCount}`
      : null,
    "",
    "## Biografia",
    "",
    mdEscape(bio),
    ...bookList.filter((line) => line !== null),
    "",
    "## Odkazy",
    "",
    `- [HTML stránka](${html})`,
    `- [Autori](${absoluteUrl("/authors")})`,
    `- [llms.txt](${absoluteUrl("/llms.txt")})`,
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function buildCategoryMarkdown(
  category: CatalogCategory,
  bookTitles: string[] = [],
): string {
  const html = absoluteUrl(`/categories/${category.id}`);
  const description =
    category.description && category.description !== "Bez popisu."
      ? category.description
      : "Tematická rada vo fonde SPST Knižnice.";

  const bookList =
    bookTitles.length > 0
      ? [
          "",
          "## Ukázkové tituly",
          "",
          ...bookTitles.slice(0, 15).map((title) => `- ${mdEscape(title)}`),
        ]
      : [];

  return [
    `# ${mdEscape(category.name)}`,
    "",
    `> Kategória v katalógu ${siteConfig.name}.`,
    "",
    typeof category.bookCount === "number"
      ? `- **Počet titulov:** ${category.bookCount}`
      : null,
    "",
    "## Popis",
    "",
    mdEscape(description),
    ...bookList,
    "",
    "## Odkazy",
    "",
    `- [HTML stránka](${html})`,
    `- [Kategórie](${absoluteUrl("/categories")})`,
    `- [llms.txt](${absoluteUrl("/llms.txt")})`,
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
}
