import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/server/session';

export async function POST() {
	const supabase = await createSupabaseServer();
	await supabase?.auth.signOut();
	redirect('/');
}

export async function GET() {
	redirect('/');
}
