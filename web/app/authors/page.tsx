export const metadata = {
  title: "Autori",
};

export default function AuthorsPage() {
  return (
    <main className="relative flex flex-1 flex-col bg-paper">
      <div className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 md:px-8">
        <p className="text-xs tracking-[0.2em] text-accent uppercase">Katalóg</p>
        <h1 className="mt-3 font-display text-5xl text-ink">Autori</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Stub pre AuthorService cez Gateway (`/api/authors`).
        </p>
      </div>
    </main>
  );
}
