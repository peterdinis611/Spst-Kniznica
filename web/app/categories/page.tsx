import Link from "next/link";

export const metadata = {
  title: "Kategórie",
};

export default function CategoriesPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10 md:px-10">
      <Link
        href="/"
        className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase transition hover:text-ink"
      >
        ← Domov
      </Link>
      <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight">Kategórie</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Stub pre CategoryService cez Gateway (`/api/categories`).
      </p>
    </main>
  );
}
