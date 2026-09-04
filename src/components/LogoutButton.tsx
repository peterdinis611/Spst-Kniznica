'use client';

import { LogOut } from 'lucide-react';

export function LogoutButton() {
	return (
		<button
			type="button"
			className="text-muted-foreground flex h-auto items-center gap-2 rounded-full px-3 py-1.5 font-normal"
			onClick={() => {
				const form = document.getElementById('logout-form');
				if (form instanceof HTMLFormElement) form.requestSubmit();
			}}
		>
			<LogOut className="size-4" />
			Odhlásiť
		</button>
	);
}
