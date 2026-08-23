import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	await locals.supabase?.auth.signOut();
	redirect(302, '/');
};

export const GET: RequestHandler = async () => {
	redirect(302, '/');
};
