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
  showCategorySelect?: boolean;
  categories?: Array<{ id: string; name: string }>;
  hiddenFields?: Record<string, string>;
  onQueryChange?: (query: string) => void;
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
  showCategorySelect = true,
  categories,
  hiddenFields,
  onQueryChange,
}: CatalogTopBarProps) {
  return (
    <div className="pb-2">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.2rem,7vw,3.75rem)] leading-[1.02] tracking-tight text-ink">
        {title}
      </h1>
      {lead ? (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          {lead}
        </p>
      ) : null}
      {showSearch ? (
        <div className="mt-6 max-w-2xl sm:mt-7">
          <CatalogSearch
            action={searchAction}
            defaultQuery={defaultQuery}
            defaultCategory={defaultCategory}
            placeholder={placeholder}
            showCategory={showCategorySelect}
            categories={categories}
            hiddenFields={hiddenFields}
            onQueryChange={onQueryChange}
          />
        </div>
      ) : null}
    </div>
  );
}
