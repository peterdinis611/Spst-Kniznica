import { Search } from "lucide-react";
import { MOCK_CATEGORIES } from "@/lib/catalog-mock";

type CatalogSearchProps = {
  action?: string;
  defaultQuery?: string;
  defaultCategory?: string;
  placeholder?: string;
};

export function CatalogSearch({
  action = "/books",
  defaultQuery = "",
  defaultCategory = "",
  placeholder = "Nájdi knihu, autora alebo vydanie…",
}: CatalogSearchProps) {
  return (
    <form
      action={action}
      className="flex w-full flex-col gap-2 rounded-[1.6rem] border border-rule/80 bg-paper p-2 shadow-[0_10px_30px_rgba(26,23,20,0.05)] sm:flex-row sm:items-center"
    >
      <label className="sr-only" htmlFor="catalog-category">
        Kategória
      </label>
      <select
        id="catalog-category"
        name="category"
        defaultValue={defaultCategory}
        className="rounded-[1.2rem] bg-transparent px-4 py-3 text-sm text-ink outline-none"
      >
        <option value="">Všetky kategórie</option>
        {MOCK_CATEGORIES.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <div className="hidden h-8 w-px bg-rule/80 sm:block" />

      <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
        <Search className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.8} aria-hidden />
        <input
          name="q"
          defaultValue={defaultQuery}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-muted/70"
        />
      </div>

      <button
        type="submit"
        className="rounded-[1.2rem] bg-ink px-5 py-3 text-sm text-paper transition hover:bg-accent"
      >
        Hľadať
      </button>
    </form>
  );
}
