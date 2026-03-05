"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import MedicaoForm from "./_components/MedicaoForm";

export default function SaudeHome() {
  const [nome, setNome] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (!uid) return;

      const { data: p } = await supabase
        .from("saude_profiles")
        .select("nome")
        .eq("user_id", uid)
        .maybeSingle();

      setNome(p?.nome || "");
    })();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Olá{nome ? `, ${nome}` : ""} 👋</h1>
            <p className="text-sm text-slate-600">Registre e acompanhe suas medições.</p>
          </div>
          <button onClick={sair} className="rounded-xl border px-3 py-2 text-sm">Sair</button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm text-white" href="/saude/registrar">
            Registrar
          </Link>
          <Link className="rounded-xl border px-4 py-3 text-center text-sm" href="/saude/historico">
            Histórico
          </Link>
        </div>

        <div className="mt-2">
          <Link className="block rounded-xl border px-4 py-3 text-center text-sm" href="/saude/vincular">
            Vincular com drogaria (opcional)
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <MedicaoForm />
      </div>
    </div>
  );
}