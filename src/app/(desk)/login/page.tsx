import { pageMeta } from '@/utils/metadata';
import { requireGuest } from './actions';
import { LoginForm } from './login-form';
import { supabasePublic } from '@/config/supabase';

export const metadata = pageMeta({
	title: 'Prihlásenie',
	description: 'Prihlás sa do školskej knižnice SPŠT a požičaj si knihy na 7, 14 alebo 21 dní.',
	index: false
});

export default async function LoginPage({
	searchParams
}: {
	searchParams: Promise<{ mod?: string }>;
}) {
	await requireGuest();
	const { mod } = await searchParams;
	const register = mod === 'novy';
	return <LoginForm register={register} configured={supabasePublic().configured} />;
}
