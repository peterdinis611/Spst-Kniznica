import { NotFoundPanel } from "@/components/routing/NotFoundPanel";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-14 sm:px-6 md:px-8 md:py-20">
      <NotFoundPanel />
    </main>
  );
}
