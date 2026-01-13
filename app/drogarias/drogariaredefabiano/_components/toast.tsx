"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type Toast = { id: string; title: string; desc?: string };

type ToastCtx = {
  push: (t: { title: string; desc?: string }) => void;
};

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function push(t: { title: string; desc?: string }) {
    const id = String(Date.now()) + Math.random().toString(16).slice(2);
    const toast: Toast = { id, title: t.title, desc: t.desc };
    setToasts((prev) => [...prev, toast]);

    // some sozinho
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 2200);
  }

  const value = useMemo(() => ({ push }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* UI */}
      <div className="fixed z-[999] right-4 bottom-4 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="bg-white border shadow-lg rounded-2xl px-4 py-3 w-[320px]">
            <div className="font-extrabold text-gray-900">{t.title}</div>
            {t.desc ? <div className="text-sm text-gray-600 mt-1">{t.desc}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
