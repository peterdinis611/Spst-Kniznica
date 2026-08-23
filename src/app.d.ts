import type { SupabaseClient } from '@supabase/supabase-js';
import type { SignedReader } from '$lib/types';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			supabase?: SupabaseClient;
			user?: SignedReader;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
