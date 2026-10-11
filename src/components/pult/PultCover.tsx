'use client';

import { useState } from 'react';
import { useUploadThing } from '@/uploads/react';

export function PultCover({
	coverUrl = '',
	coverKey = '',
	ready
}: {
	coverUrl?: string;
	coverKey?: string;
	ready: boolean;
}) {
	const [url, setUrl] = useState(coverUrl);
	const [key, setKey] = useState(coverKey);
	const [note, setNote] = useState('');
	const { startUpload, isUploading } = useUploadThing('bookCover', {
		onClientUploadComplete: (files) => {
			const file = files[0] as { ufsUrl?: string; url?: string; key: string } | undefined;
			if (!file) return;
			setUrl(file.ufsUrl ?? file.url ?? '');
			setKey(file.key);
			setNote('Obálka je nahratá.');
		},
		onUploadError: (err) => {
			setNote(err.message || 'Obálka sa nenahrala.');
		}
	});

	return (
		<div className="pult-cover">
			<input type="hidden" name="coverUrl" value={url} />
			<input type="hidden" name="coverKey" value={key} />
			{url ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={url} alt="" className="pult-cover-thumb" />
			) : (
				<p className="pult-count">Bez obálky</p>
			)}
			{ready ? (
				<label className="pult-field">
					<span>{isUploading ? 'Nahrávam…' : 'Obálka'}</span>
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp"
						disabled={isUploading}
						onChange={(event) => {
							const file = event.target.files?.[0];
							if (file) void startUpload([file]);
						}}
					/>
				</label>
			) : (
				<p className="pult-count">UploadThing token v .env chýba — zväzok uložíš bez snímky.</p>
			)}
			{note ? <p className="pult-count">{note}</p> : null}
			{url || key ? (
				<button
					type="button"
					className="pult-ghost"
					onClick={() => {
						setUrl('');
						setKey('');
						setNote('Obálka stiahnutá z lístka.');
					}}
				>
					Odstrániť obálku
				</button>
			) : null}
		</div>
	);
}
