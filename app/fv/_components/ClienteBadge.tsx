"use client";

import Link from "next/link";
import { useCustomer } from "./useCustomer";

export default function ClienteBadge() {
  const { user, signOut } = useCustomer();

  // 🔒 Se não estiver logado, não mostra nada
  if (!user) return null;

  // 👤 Nome do cliente (fallback seguro)
  const nome =
    user?.user_metadata?.nome ||
    user?.email?.split("@")[0] ||
    "Cliente";

  return (
    <div className="flex items-center gap-2">

      {/* 👋 SAUDAÇÃO */}
      <span className="text-sm font-bold text-white">
        Olá, {nome}
      </span>

      {/* 👤 BOTÃO CONTA */}
      <Link
        href="/fv/conta"
        className="text-xs text-white/80 hover:text-white underline"
      >
        Conta
      </Link>

      {/* 🚪 BOTÃO SAIR */}
      <button
        onClick={signOut}
        className="text-xs text-white/80 hover:text-white underline"
      >
        Sair
      </button>

    </div>
  );
}