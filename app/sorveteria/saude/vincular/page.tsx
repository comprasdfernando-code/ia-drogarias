"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function VincularPage() {
  const sp = useSearchParams();
  const [drogariaId, setDrogariaId] = useState(sp.get("drogaria_id") || "");
  const [nivel, setNivel] = useState<"relatorios"|"continuo">("relatorios");
  const [info, setInfo] = useState<{ nome?: string } | null>(null);

  useEffect(() => {
    (async () => {
      if (!drogariaId) return setInfo(null);
      const { data } = await supabase
        .from("saude_drogarias")
        .select("nome")
        .eq("id", drogariaId)
        .maybeSingle();
      setInfo(data || null);
    })();
  }, [drogariaId]);

  async function solicitar() {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) return;

    const { error } = await supabase.from("saude_vinculos").upsert({
      user_id: uid,
      drogaria_id: drogariaId,
      nivel_acesso: nivel,
      status: "pendente",
    }, { onConflict: "user_id,drogaria_id" });

    if (error) return alert(error.message);
    alert("Solicitação enviada! Aguarde aprovação da drogaria.");
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vincular com drogaria</h1>
        <Link className="rounded-xl border px-3 py-2 text-sm" href="/saude">Voltar</Link>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
        <div>
          <label className="text-sm text-slate-700">ID da Drogaria</label>
          <input className="mt-1 w-full rounded-xl border p-3" value={drogariaId} onChange={(e)=>setDrogariaId(e.target.value)} />
          <div className="mt-1 text-xs text-slate-500">
            {info?.nome ? `Encontrada: ${info.nome}` : "Cole o ID ou abra via QR Code."}
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-700">Tipo de compartilhamento</label>
          <select className="mt-1 w-full rounded-xl border p-3" value={nivel} onChange={(e)=>setNivel(e.target.value as any)}>
            <option value="relatorios">Somente relatórios (quando eu enviar)</option>
            <option value="continuo">Acompanhamento contínuo (painel da drogaria)</option>
          </select>
        </div>

        <button onClick={solicitar} disabled={!drogariaId}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white disabled:opacity-60">
          Solicitar vínculo
        </button>
      </div>
    </div>
  );
}