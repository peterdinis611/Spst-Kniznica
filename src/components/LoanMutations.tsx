'use client';

import { useAction } from 'next-safe-action/hooks';
import { cancelWait, clearHistory, renewLoanAction, returnLoan } from '@/app/(desk)/loans/actions';
import { mutationToasts } from '@/notify/toast';

export function LoanReturn({ loanId, canRenew }: { loanId: string; canRenew: boolean }) {
	const ret = useAction(returnLoan, mutationToasts('Vrátenie sa nepodarilo.'));
	const renew = useAction(renewLoanAction, mutationToasts('Predĺženie sa nepodarilo.'));

	return (
		<div className="relative z-[1] mt-3 flex flex-wrap gap-2">
			<button
				type="button"
				disabled={ret.isExecuting}
				onClick={() => ret.execute({ loanId })}
				className="rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground"
			>
				Nahlásiť vrátenie
			</button>
			{canRenew ? (
				<button
					type="button"
					disabled={renew.isExecuting}
					onClick={() => renew.execute({ loanId })}
					className="rounded-full px-3 py-1.5 text-sm ring-1 ring-border"
				>
					Predĺžiť
				</button>
			) : null}
		</div>
	);
}

export function WaitCancel({ reservationId }: { reservationId: string }) {
	const action = useAction(cancelWait, mutationToasts('Rezerváciu sa nepodarilo stiahnuť.'));
	return (
		<button
			type="button"
			disabled={action.isExecuting}
			onClick={() => action.execute({ reservationId })}
			className="text-sm underline"
		>
			Stiahnuť
		</button>
	);
}

export function HistoryClear() {
	const action = useAction(clearHistory, mutationToasts('Históriu sa nepodarilo vyčistiť.'));
	return (
		<button
			type="button"
			disabled={action.isExecuting}
			onClick={() => action.execute({})}
			className="text-sm underline"
		>
			Vyčistiť
		</button>
	);
}
