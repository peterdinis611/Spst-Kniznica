import { pageMeta } from '@/utils/metadata';
import { RecoveryForm } from './recovery-form';
import { supabasePublic } from '@/config/supabase';

export const metadata = pageMeta({
	title: 'Obnova hesla',
	description: 'Obnov prístup k čitateľskému preukazu SPŠT.',
	index: false
});

export default function RecoveryPage() {
	return <RecoveryForm configured={supabasePublic().configured} />;
}
