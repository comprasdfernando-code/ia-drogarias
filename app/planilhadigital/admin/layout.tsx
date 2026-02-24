"use client";

import { LojaProvider } from "../temp/_components/LojaProvider";
import LojaSelectTop from "../temp/_components/LojaSelectTop";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <LojaProvider>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl p-2 md:p-6">
          {/* Seletor de loja também no Admin */}
          <LojaSelectTop />
          {children}
        </div>
      </div>
    </LojaProvider>
  );
}