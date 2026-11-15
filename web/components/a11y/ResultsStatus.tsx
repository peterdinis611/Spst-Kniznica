type ResultsStatusProps = {
  count: number;
  labelSingular: string;
  labelPlural: string;
  pending?: boolean;
  query?: string;
};

export function ResultsStatus({
  count,
  labelSingular,
  labelPlural,
  pending = false,
  query,
}: ResultsStatusProps) {
  const noun = count === 1 ? labelSingular : labelPlural;
  const queryPart = query?.trim() ? ` pre „${query.trim()}“` : "";
  const text = pending
    ? `Načítavam výsledky${queryPart}…`
    : `${count} ${noun}${queryPart}`;

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true" role="status">
      {text}
    </div>
  );
}
