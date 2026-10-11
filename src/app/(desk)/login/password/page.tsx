import { redirect } from 'next/navigation';
import { pageMeta } from '@/utils/metadata';
import { supabasePublic } from '@/config/supabase';
import { getSessionReader } from '@/server/session';
import { PasswordForm } from './password-form';

export const metadata = pageMeta({
	title: 'Nové heslo',
	description: 'Nastav nové heslo k čitateľskému preukazu.',
	index: false
});

export default async function PasswordPage() {
	const user = await getSessionReader();
	if (!user) redirect('/login/recovery');

	return <PasswordForm configured={supabasePublic().configured} name={user.name} />;
}
