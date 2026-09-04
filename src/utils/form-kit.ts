import type { ActionResult } from '@/http/kit';
import * as v from 'valibot';

export type Gateable = {
	validateSync: (cause: 'change' | 'blur' | 'submit' | 'mount') => { hasErrored: boolean };
};

export function bindFormAction<I>(execute: (input: I) => void) {
	return (formData: FormData) => {
		execute(Object.fromEntries(formData) as I);
	};
}

export function fieldIssue(error: unknown): string {
	if (!error) return '';
	if (typeof error === 'string') return error;
	if (Array.isArray(error)) return fieldIssue(error[0]);
	if (typeof error === 'object' && 'message' in error) return String(error.message ?? '');
	return String(error);
}

export function flattenFields(
	schema: v.GenericSchema,
	data: unknown
): Record<string, string | undefined> {
	const result = v.safeParse(schema, data);
	if (result.success) return {};
	const nested = v.flatten(result.issues).nested ?? {};
	const errors: Record<string, string | undefined> = {};
	for (const [key, messages] of Object.entries(nested)) {
		if (messages?.[0]) errors[key] = messages[0];
	}
	return errors;
}

export function schemaValidator(schema: v.GenericSchema) {
	return ({ value }: { value: unknown }) => {
		const fields = flattenFields(schema, value);
		if (!Object.values(fields).some(Boolean)) return undefined;
		return { fields };
	};
}

export function firstSchemaIssue(schema: v.GenericSchema, data: unknown): string | undefined {
	const result = v.safeParse(schema, data);
	if (result.success) return undefined;
	return result.issues[0]?.message;
}

export function toastFromResult(result: ActionResult) {
	if (typeof window === 'undefined') return;
	void import('@/notify/toast').then(({ showStamp, toastServerError }) => {
		if (result.type === 'success') {
			const data = result.data ?? {};
			const text =
				typeof data.stamp === 'string'
					? data.stamp
					: typeof data.message === 'string'
						? data.message
						: 'Hotovo.';
			const sub = typeof data.sub === 'string' ? data.sub : undefined;
			showStamp('success', text, sub);
			return;
		}
		if (result.type === 'failure') {
			const data = result.data as { message?: string };
			toastServerError(data.message);
			return;
		}
		if (result.type === 'error') toastServerError();
	});
}

export function applyToast(opts?: { fill?: string; onResult?: (result: ActionResult) => void }) {
	if (typeof window === 'undefined') return () => undefined;
	return (input: { result: ActionResult }) => {
		opts?.onResult?.(input.result);
		toastFromResult(input.result);
	};
}

export function gateSubmit(form: Gateable, event: SubmitEvent, _message = 'Doplň lístok.') {
	if (form.validateSync('submit').hasErrored) {
		event.preventDefault();
	}
}
