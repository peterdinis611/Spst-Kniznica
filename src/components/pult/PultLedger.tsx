import type { ReactNode } from 'react';
import { isPultStack, isPultStamp, type PultCell } from '@/desk/pult-ledger';

export type LedgerColumn<T> = {
	id: string;
	header: string;
	cell: (row: T) => PultCell | ReactNode;
};

function CellValue({ value }: { value: PultCell | ReactNode }) {
	if (isPultStack(value)) {
		return (
			<>
				<strong>{value.title}</strong>
				{value.hint ? <em>{value.hint}</em> : null}
			</>
		);
	}
	if (isPultStamp(value)) {
		return <span className={`pult-role${value.desk ? ' is-desk' : ''}`}>{value.stamp}</span>;
	}
	return <>{value}</>;
}

export function PultLedger<T>({
	rows,
	columns,
	empty,
	actions
}: {
	rows: T[];
	columns: LedgerColumn<T>[];
	empty: string;
	actions?: (row: T) => ReactNode;
}) {
	const cols = columns.length + (actions ? 1 : 0);

	if (rows.length === 0) {
		return <p className="pult-empty">{empty}</p>;
	}

	return (
		<div className="pult-drawer">
			<div className="pult-ledger is-plain" style={{ ['--pult-cols' as string]: String(cols) }}>
				<div className="pult-ledger-head" role="row">
					{columns.map((col) => (
						<div key={col.id} role="columnheader">
							<span className="pult-sort is-mute">{col.header}</span>
						</div>
					))}
					{actions ? (
						<div role="columnheader">
							<span className="pult-sort is-mute"> </span>
						</div>
					) : null}
				</div>
				<div className="pult-ledger-space">
					{rows.map((row, index) => {
						const key =
							row && typeof row === 'object' && 'id' in row && row.id != null
								? String(row.id)
								: String(index);
						return (
							<div key={key} className="pult-ledger-row" role="row">
								{columns.map((col) => (
									<div key={col.id} className="pult-ledger-cell" role="cell">
										<CellValue value={col.cell(row)} />
									</div>
								))}
								{actions ? (
									<div className="pult-ledger-cell" role="cell">
										<div className="pult-actions">{actions(row)}</div>
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
