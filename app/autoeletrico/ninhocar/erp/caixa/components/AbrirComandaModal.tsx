"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AbrirComandaModal({
  empresaId,
  caixaId,
  onClose,
  onOpen,
}: any) {
  const [numero, setNumero] = useState("");

  async function abrir() {
    const { data } = await supabase
      .from("ae_comandas")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("numero", numero)
      .in("status", ["rascunho", "aberta"])
      .single();

    if (data) {
      if (data.status === "rascunho") {
        await supabase
          .from("ae_comandas")
          .update({ status: "aberta", caixa_id: caixaId })
          .eq("id", data.id);
      }
      onOpen(data);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-80 space-y-3">
        <h2 className="font-bold">Abrir Comanda</h2>
        <input
          className="border p-2 w-full"
          placeholder="Número da comanda"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={abrir} className="bg-slate-800 text-white px-4 py-2 rounded">
            Abrir
          </button>
        </div>
      </div>
    </div>
  );
}
