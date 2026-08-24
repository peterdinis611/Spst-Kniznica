import type { createTable as CreateTable } from '@tanstack/svelte-table';
import { createTable as createTableImpl } from '../../node_modules/@tanstack/svelte-table/dist/createTable.svelte.js';

export const createTable: typeof CreateTable = createTableImpl;
