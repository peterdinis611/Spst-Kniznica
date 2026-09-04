import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { noticeHref } from '@/notify/notices';
import { createSupabaseServer } from '@/server/session';

export async function POST(request: Request) {
	const supabase = await createSupabaseServer();
	await supabase?.auth.signOut();
	return NextResponse.redirect(new URL(noticeHref('/', 'logout'), request.url), 303);
}

export async function GET() {
	redirect('/');
}
