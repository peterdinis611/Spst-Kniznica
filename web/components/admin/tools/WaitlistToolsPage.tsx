"use client";

import { ToolShell } from "@/components/admin/tools/ToolShell";
import { WaitlistBoard } from "@/components/catalog/WaitlistBoard";

export function WaitlistToolsPage() {
  const getAccessToken = async () => null;

  return (
    <ToolShell
      title="Čakací zoznam"
      eyebrow="Výpožičky · fronta"
      lead="Prehľad aktívnych položiek, promote prvého čakateľa a odstránenie z fronty."
    >
      <WaitlistBoard
        getAccessToken={getAccessToken}
        entraEnabled={false}
        heading="Fronta čakateľov"
        allowPromote
      />
    </ToolShell>
  );
}
