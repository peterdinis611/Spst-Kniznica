import { FlatCover } from "@/components/landing/FlatCover";
import { resolveBookCoverUrl } from "@/lib/catalog/covers";
import { cn } from "@/lib/utils";

type BookDetailCoverProps = {
  title: string;
  author: string;
  accent: string;
  secondary: string;
  coverUrl?: string | null;
  isbn?: string | null;
  className?: string;
};

export function BookDetailCover({
  title,
  author,
  accent,
  secondary,
  coverUrl,
  isbn,
  className,
}: BookDetailCoverProps) {
  const resolved = resolveBookCoverUrl({ coverUrl, isbn });

  if (resolved) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Open Library / CDN covers
      <img
        src={resolved}
        alt={`Obálka: ${title}`}
        className={cn(
          "aspect-[2/3] w-full object-cover shadow-[0_32px_64px_-44px_rgba(14,26,36,0.45)]",
          className,
        )}
        loading="lazy"
      />
    );
  }

  return (
    <FlatCover
      title={title}
      author={author}
      accent={accent}
      secondary={secondary}
      className={className}
    />
  );
}
