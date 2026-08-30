import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';
import * as v from 'valibot';

export type Gateable = {
	validateSync: (cause: 'change' | 'blur' | 'submit' | 'mount') => { hasErrored: boolean };
};

type ActionPayload = {
	stamp?: string;
	sub?: string;
	message?: string;
	ok?: boolean;
	errors?: Record<string, string | undefined>;
};

export function fieldIssue(error: unknown): string {
	if (!error) return '';
	if (typeof error === 'string') return error;
	if (Array.isArray(error)) return fieldIssue(error[0]);
	if (typeof error === 'object' && 'message' in error) return String(error.message ?? '');
	return String(error);
}

export function flattenFields(schema: v.GenericSchema, data: unknown): Record<string, string | undefined> {
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
	if (result.type === 'redirect') return;
	if (result.type === 'success') {
		const data = (result.data ?? {}) as ActionPayload;
		if (data.stamp) {
			toast.success(data.stamp, data.sub ? { description: data.sub } : undefined);
			return;
		}
		if (data.message) {
			toast.success(data.message);
			return;
		}
		toast.success('Hotovo.');
		return;
	}
	if (result.type === 'failure') {
		const data = (result.data ?? {}) as ActionPayload;
		const fromFields = data.errors
			? Object.values(data.errors).find((item) => Boolean(item))
			: undefined;
		toast.error(data.message ?? fromFields ?? 'Lístok neprešiel.');
		return;
	}
	if (result.type === 'error') {
		toast.error('Niečo sa pokazilo.');
	}
}

export function applyToast(opts?: {
	resetOn?: (result: ActionResult) => boolean;
	after?: (result: ActionResult) => void;
}): SubmitFunction {
	return () =>
		async ({ result, update }) => {
			await update({
				reset: opts?.resetOn ? opts.resetOn(result) : true
			});
			toastFromResult(result);
			opts?.after?.(result);
		};
}

export function gateSubmit(form: Gateable, event: SubmitEvent, message = 'Doplň lístok.') {
	if (form.validateSync('submit').hasErrored) {
		event.preventDefault();
		toast.error(message);
	}
}
