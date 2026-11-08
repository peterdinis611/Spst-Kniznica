import { Bell } from "lucide-react";
import { CatalogSearch } from "./CatalogSearch";

type CatalogTopBarProps = {
  title: string;
  defaultQuery?: string;
  defaultCategory?: string;
  searchAction?: string;
  placeholder?: string;
};

export function CatalogTopBar({
  title,
  defaultQuery,
  defaultCategory,
  searchAction,
  placeholder,
}: CatalogTopBarProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-4xl text-ink md:text-5xl">{title}</h1>
        <div className="mt-5 max-w-3xl">
          <CatalogSearch
            action={searchAction}
            defaultQuery={defaultQuery}
            defaultCategory={defaultCategory}
            placeholder={placeholder}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 self-end lg:self-start">
        <div className="flex items-center gap-3 rounded-full border border-rule/80 bg-paper px-3 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 font-display text-sm text-accent-deep">
            SK
          </span>
          <div className="pr-1">
            <p className="text-sm font-medium text-ink">Študent SPST</p>
            <p className="text-xs text-muted">Mock účet</p>
          </div>
        </div>
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-rule/80 bg-paper text-ink"
          aria-label="Notifikácie"
        >
          <Bell className="h-4 w-4" strokeWidth={1.8} />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#d9776c]" />
        </button>
      </div>
    </div>
  );
}
