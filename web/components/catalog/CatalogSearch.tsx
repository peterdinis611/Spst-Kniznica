import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  placeholder = "Názov, autor alebo téma…",
}: CatalogSearchProps) {
  return (
    <form
      action={action}
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Label
          htmlFor="catalog-q"
          className="text-[11px] tracking-[0.18em] uppercase"
        >
          Hľadanie
        </Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.7}
            aria-hidden
          />
          <Input
            id="catalog-q"
            name="q"
            defaultValue={defaultQuery}
            placeholder={placeholder}
            className="h-11 rounded-none border-ink bg-paper pl-9"
          />
        </div>
      </div>

      <div className="w-full space-y-2 sm:w-44">
        <Label
          htmlFor="catalog-category"
          className="text-[11px] tracking-[0.18em] uppercase"
        >
          Kategória
        </Label>
        <select
          id="catalog-category"
          name="category"
          defaultValue={defaultCategory}
          className="border-ink bg-paper h-11 w-full rounded-none border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="">Všetky</option>
          {MOCK_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-none bg-ink text-paper hover:bg-accent hover:text-ink sm:w-auto sm:px-6"
      >
        Filtrovať
      </Button>
    </form>
  );
}
