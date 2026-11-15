import Link from "next/link";

type AuthorAuthorityLinksProps = {
  profileUrl?: string | null;
  wikidataId?: string | null;
  viafId?: string | null;
};

export function AuthorAuthorityLinks({
  profileUrl,
  wikidataId,
  viafId,
}: AuthorAuthorityLinksProps) {
  const links: Array<{ href: string; label: string }> = [];

  if (profileUrl?.trim()) {
    links.push({ href: profileUrl.trim(), label: "Profil" });
  }
  if (wikidataId?.trim()) {
    const id = wikidataId.trim();
    links.push({
      href: `https://www.wikidata.org/wiki/${id.startsWith("Q") ? id : `Q${id}`}`,
      label: "Wikidata",
    });
  }
  if (viafId?.trim()) {
    links.push({
      href: `https://viaf.org/viaf/${viafId.trim()}/`,
      label: "VIAF",
    });
  }

  if (links.length === 0) return null;

  return (
    <nav aria-label="Externé identifikátory autora" className="mt-6">
      <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
        Autority
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex border border-rule px-3 py-1.5 font-mono text-[11px] tracking-wide text-sage transition hover:border-sage hover:text-ink dark:border-white/10"
            >
              {link.label}
              <span className="sr-only"> (nové okno)</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
