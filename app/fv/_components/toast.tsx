"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Toast = { id: string; title: string; desc?: string };

type ToastCtx = {
  push: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function push(t: Omit<Toast, "id">) {
    const id = crypto?.randomUUID?.() ?? String(Date.now());
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 2200);
  }

  return (
    <ToastContext.Provider value={{ push }}>
      {children}

      <div className="fixed z-[120] right-4 top-4 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-white border shadow-xl rounded-2xl p-3 w-[280px] animate-[fadeIn_.15s_ease-out]"
          >
            <div className="font-extrabold text-gray-900 text-sm">{t.title}</div>
            {t.desc && <div className="text-xs text-gray-600 mt-0.5">{t.desc}</div>}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
