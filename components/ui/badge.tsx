import * as React from "react";
export function Badge({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <span className={["inline-flex items-center rounded-full border px-3 py-1 text-xs text-gray-600", className].join(" ")}>{children}</span>;
}
