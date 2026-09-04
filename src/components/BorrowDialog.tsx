'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { X } from 'lucide-react';
import { LOAN_DAY_OPTIONS } from '@/desk/borrow-fields';
import './borrow-dialog.css';

export type BorrowDraft = {
	firstName: string;
	lastName: string;
	className: string;
	days: number;
};

function SubmitStamp() {
	const { pending } = useFormStatus();
	return (
		<button type="submit" className="borrow-stamp" disabled={pending}>
			{pending ? 'Píšem lístok…' : 'Požičať'}
		</button>
	);
}

export function BorrowDialog({
	bookId,
	title,
	callNumber,
	borrower,
	action
}: {
	bookId: string;
	title: string;
	callNumber: string;
	borrower: BorrowDraft;
	action: (formData: FormData) => void | Promise<void>;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const firstField = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const el = dialog.current;
		if (!el) return;
		if (open) {
			if (!el.open) el.showModal();
			const id = requestAnimationFrame(() => firstField.current?.focus());
			const overflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				cancelAnimationFrame(id);
				document.body.style.overflow = overflow;
			};
		}
		if (el.open) el.close();
		return undefined;
	}, [open]);

	return (
		<>
			<button type="button" className="borrow-open" onClick={() => setOpen(true)}>
				Požičať zväzok
			</button>
			<dialog
				ref={dialog}
				className="borrow-dialog"
				aria-labelledby="borrow-slip-title"
				onClose={() => setOpen(false)}
				onClick={(event) => {
					if (event.target === event.currentTarget) setOpen(false);
				}}
			>
				<div className="borrow-sheet">
					<header className="borrow-head">
						<p className="borrow-kicker">Výpožičný lístok</p>
						<button type="button" className="borrow-close" onClick={() => setOpen(false)} aria-label="Zavrieť">
							<X className="size-4" />
						</button>
					</header>
					<p className="borrow-call">{callNumber}</p>
					<h2 id="borrow-slip-title" className="borrow-title">
						{title}
					</h2>
					<form action={action} className="borrow-form">
						<input type="hidden" name="bookId" value={bookId} />
						<label>
							Meno
							<input ref={firstField} name="firstName" required defaultValue={borrower.firstName} autoComplete="given-name" />
						</label>
						<label>
							Priezvisko
							<input name="lastName" required defaultValue={borrower.lastName} autoComplete="family-name" />
						</label>
						<label>
							Trieda
							<input name="className" defaultValue={borrower.className} placeholder="II.A" autoComplete="off" />
						</label>
						<label>
							Dni
							<select name="days" defaultValue={String(borrower.days)}>
								{LOAN_DAY_OPTIONS.map((days) => (
									<option key={days} value={days}>
										{days} dní
									</option>
								))}
							</select>
						</label>
						<SubmitStamp />
					</form>
					<span className="borrow-mark" aria-hidden="true">
						SPŠT
					</span>
				</div>
			</dialog>
		</>
	);
}
