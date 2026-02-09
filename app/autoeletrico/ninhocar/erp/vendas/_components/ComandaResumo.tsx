"use client";

import { supabase } from "@/lib/supabaseClient";

export default function ComandaResumo({
  comanda,
  onUpdate,
}: {
  comanda: any;
  onUpdate: (c: any) => void;
}) {
  async function salvarDesconto(v: number) {
    const { data } = await supabase
      .from("ae_comandas")
      .update({ desconto: v })
      .eq("id", comanda.id)
      .select()
      .single();

    if (data) onUpdate(data);
  }

  return (
    <div className="bg-slate-900 text-white p-4 rounded flex justify-between items-center">
      <div>
        <div>Subtotal: R$ {comanda.subtotal.toFixed(2)}</div>
        <div>Total: R$ {comanda.total.toFixed(2)}</div>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Desconto"
          className="p-2 text-black w-32"
          onBlur={(e) => salvarDesconto(Number(e.target.value || 0))}
        />

        <div className="px-4 py-2 bg-yellow-500 text-black rounded">
          Enviar pro Caixa
        </div>
      </div>
    </div>
  );
}
