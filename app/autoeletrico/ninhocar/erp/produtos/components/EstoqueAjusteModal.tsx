"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EstoqueAjusteModal({ produto, onClose, onSave }: any) {
  const [qtd, setQtd] = useState(0);

  async function ajustar() {
    await supabase.from("ae_estoque_movs").insert({
      empresa_id: produto.empresa_id,
      produto_id: produto.id,
      origem: "ajuste",
      tipo: qtd >= 0 ? "entrada" : "saida",
      quantidade: Math.abs(qtd),
      custo_unit: produto.custo,
    });

    await supabase
      .from("ae_produtos")
      .update({
        estoque_atual: produto.estoque_atual + qtd,
      })
      .eq("id", produto.id);

    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-80 space-y-3">
        <h2 className="font-bold">Ajustar Estoque</h2>

        <div>Atual: {produto.estoque_atual}</div>

        <input
          type="number"
          className="border p-2 w-full"
          placeholder="+ entrada | - saída"
          value={qtd}
          onChange={(e) => setQtd(Number(e.target.value))}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancelar</button>
          <button
            onClick={ajustar}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
