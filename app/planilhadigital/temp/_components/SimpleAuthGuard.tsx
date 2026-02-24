"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const LS_KEY = "iadrogarias_simple_auth";

export default function SimpleAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const ok = localStorage.getItem(LS_KEY) === "1";
    if (!ok) router.replace(`/login?next=${encodeURIComponent(pathname || "/planilhadigital/temp")}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}