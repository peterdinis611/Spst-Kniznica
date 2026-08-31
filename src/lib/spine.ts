export function spineLines(callNumber: string) {
	return callNumber
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 4);
}
