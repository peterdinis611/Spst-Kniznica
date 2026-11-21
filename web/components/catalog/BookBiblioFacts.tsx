import { copyStatusLabel } from "@/lib/catalog/mappers";
import type { CatalogBook } from "@/lib/catalog/mappers";

type BookBiblioFactsProps = {
  book: CatalogBook;
};

function Fact({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-ink sm:text-[15px]">
        {value}
      </dd>
    </div>
  );
}

export function BookBiblioFacts({ book }: BookBiblioFactsProps) {
  const summary = book.copySummary;
  const hasSummary =
    summary &&
    summary.available +
      summary.borrowed +
      summary.reserved +
      summary.lost +
      summary.maintenance >
      0;

  return (
    <div className="mt-8 space-y-8">
      <dl className="grid max-w-2xl grid-cols-2 gap-x-3 gap-y-4 border-y border-rule py-5 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-5 sm:py-6 dark:border-white/10">
        <Fact label="Rok" value={book.year} />
        <Fact label="Vydavateľ" value={book.publisher} />
        <Fact label="Jazyk" value={book.language} />
        <Fact label="ISBN" value={book.isbn} />
        <Fact label="Formát" value={book.formatLabel} />
        <Fact label="Strany" value={book.pageCount} />
        <Fact label="Polička" value={book.shelfLocation} />
        <div>
          <dt className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Exempláre
          </dt>
          <dd className="mt-1 font-display text-2xl tabular-nums text-ink">
            <span className="text-sage">{book.availableCopies}</span>
            <span className="text-muted-foreground"> / {book.totalCopies}</span>
          </dd>
        </div>
      </dl>

      {hasSummary ? (
        <div aria-labelledby="copy-summary-heading">
          <h2
            id="copy-summary-heading"
            className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase"
          >
            Stav exemplárov
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["available", "Dostupné"],
                ["borrowed", "Požičané"],
                ["reserved", "Rezervované"],
                ["lost", "Stratené"],
                ["maintenance", "Údržba"],
              ] as const
            ).map(([key, label]) => {
              const count = summary[key];
              if (!count) return null;
              return (
                <li
                  key={key}
                  className="border border-rule px-3 py-1.5 font-mono text-[11px] tracking-wide text-ink dark:border-white/10"
                >
                  {label}
                  <span className="ml-2 tabular-nums text-sage">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {book.copies && book.copies.length > 0 ? (
        <div aria-labelledby="copies-list-heading">
          <h2
            id="copies-list-heading"
            className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase"
          >
            Inventár · {book.copies.length}
          </h2>
          <ul className="mt-3 divide-y divide-rule border border-rule dark:divide-white/10 dark:border-white/10">
            {book.copies.map((copy) => {
              const statusNum =
                typeof copy.status === "number"
                  ? copy.status
                  : Number.parseInt(String(copy.status), 10);
              const statusLabel =
                Number.isFinite(statusNum)
                  ? copyStatusLabel(statusNum)
                  : String(copy.status);
              return (
                <li
                  key={copy.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5 text-sm"
                >
                  <span className="font-mono text-xs tracking-wide text-ink">
                    {copy.inventoryNumber}
                  </span>
                  <span className="text-muted-foreground">
                    {statusLabel}
                    {copy.shelfLocation ? ` · ${copy.shelfLocation}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
