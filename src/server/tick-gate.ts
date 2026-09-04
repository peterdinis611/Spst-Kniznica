export function deskTickAllowed(secret: string | undefined, given: string | undefined) {
	const expected = secret?.trim() ?? '';
	const got = given?.trim() ?? '';
	return expected.length > 0 && got === expected;
}
