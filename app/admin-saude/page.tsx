"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AdminHome() {
  async function sair() {
    await supabase.auth.signOut();
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Painel da Drogaria</h1>
          <button onClick={sair} className="rounded-xl border px-3 py-2 text-sm">Sair</button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <Link className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm text-white" href="/admin-saude/pacientes">
            Pacientes vinculados
          </Link>
        </div>
      </div>
    </div>
  );
}