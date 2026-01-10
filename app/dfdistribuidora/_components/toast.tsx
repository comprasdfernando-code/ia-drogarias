// app/dfdistribuidora/_components/toast.tsx
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ToastItem = {
  id: string;
  title: string;
  desc?: string;
  durationMs?: number;
};

type ToastCtx = {
  push: (t: Omit<ToastItem, "id">) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = uid();
      const durationMs = t.durationMs ?? 2400;

      setItems((prev) => [{ id, ...t, durationMs }, ...prev].slice(0, 4));

      window.setTimeout(() => remove(id), durationMs);
    },
    [remove]
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}

      <div className="fixed z-[80] top-3 right-3 space-y-2 w-[92vw] max-w-sm">
        {items.map((t) => (
          <div
            key={t.id}
            className="bg-white border shadow-lg rounded-2xl px-4 py-3 overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-gray-900">{t.title}</div>
                {t.desc ? <div className="text-xs text-gray-600 mt-0.5">{t.desc}</div> : null}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="text-xs font-extrabold px-2 py-1 rounded-xl border bg-white hover:bg-gray-50"
                title="Fechar"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // não quebrar a página se esquecer de envolver no provider
    return { push: (_t: any) => {} } as ToastCtx;
  }
  return ctx;
}
