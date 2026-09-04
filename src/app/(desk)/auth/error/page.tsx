import { pageMeta } from '@/utils/metadata';
import { AuthPass } from '@/components/AuthPass';

export const metadata = pageMeta({
	title: 'Odkaz zlyhal',
	description: 'Potvrdenie účtu sa nepodarilo.',
	index: false
});

export default function AuthErrorPage() {
	return (
		<AuthPass
			kicker="Účet"
			title="Odkaz už neplatí."
			lede="Skús sa prihlásiť, alebo si nechaj poslať nový odkaz na obnovu hesla."
		>
			<p className="pass-help">
				<a href="/login">Späť na prihlásenie</a>
			</p>
		</AuthPass>
	);
}
