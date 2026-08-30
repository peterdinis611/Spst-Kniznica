import type { createForm as CreateForm } from '@tanstack/svelte-form';
import { createForm as createFormImpl } from '../../node_modules/@tanstack/svelte-form/dist/createForm.svelte.js';

export const createForm: typeof CreateForm = createFormImpl;
