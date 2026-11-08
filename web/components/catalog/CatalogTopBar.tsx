import { CatalogSearch } from "./CatalogSearch";

type CatalogTopBarProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  defaultQuery?: string;
  defaultCategory?: string;
  searchAction?: string;
  placeholder?: string;
  showSearch?: boolean;
};

export function CatalogTopBar({
  eyebrow = "Katalóg",
  title,
  lead,
  defaultQuery,
  defaultCategory,
  searchAction,
  placeholder,
  showSearch = true,
}: CatalogTopBarProps) {
  return (
    <div className="border-b border-rule pb-6 sm:pb-8">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.2rem,7vw,4rem)] leading-[1.02] tracking-tight text-ink">
        {title}
      </h1>
      {lead ? (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          {lead}
        </p>
      ) : null}
      {showSearch ? (
        <div className="mt-6 max-w-3xl sm:mt-8">
          <CatalogSearch
            action={searchAction}
            defaultQuery={defaultQuery}
            defaultCategory={defaultCategory}
            placeholder={placeholder}
          />
        </div>
      ) : null}
    </div>
  );
}
