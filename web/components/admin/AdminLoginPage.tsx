"use client";

import { useEffect } from "react";

/** react-admin login → site Entra / Dev login, then back to /admin. */
export function AdminLoginPage() {
  useEffect(() => {
    window.location.assign("/login?next=/admin");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea] text-sm text-[#5a656f]">
      Presmerovávam na prihlásenie…
    </div>
  );
}
