export function PultDelete({
	action,
	fields,
	ask
}: {
	action: (formData: FormData) => void | Promise<void>;
	fields: Record<string, string>;
	ask: string;
}) {
	return (
		<form action={action} className="pult-delete">
			{Object.entries(fields).map(([name, value]) => (
				<input key={name} type="hidden" name={name} value={value} />
			))}
			<button type="submit" className="pult-ghost" title={ask} aria-label={ask}>
				Zmazať
			</button>
		</form>
	);
}
