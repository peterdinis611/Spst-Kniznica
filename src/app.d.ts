import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppAbility } from '$lib/ability';
import type { SignedReader } from '$lib/types';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			supabase?: SupabaseClient;
			user?: SignedReader;
			ability: AppAbility;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
