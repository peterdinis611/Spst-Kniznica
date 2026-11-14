"use client";

import dynamic from "next/dynamic";

const ReactAdminApp = dynamic(() => import("./ReactAdminApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#f3efe6] text-sm text-[#5a655c]">
      Načítavam admin…
    </div>
  ),
});

export function ReactAdminMount() {
  return (
    <div className="min-h-screen [&_.RaLayout-root]:min-h-screen">
      <ReactAdminApp />
    </div>
  );
}
