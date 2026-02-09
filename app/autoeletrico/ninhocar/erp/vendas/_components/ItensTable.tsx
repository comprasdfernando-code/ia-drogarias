"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ItensTable({ comandaId }: { comandaId: string }) {
  const [itens, setItens] = useState<any[]>([]);

  async function carregar() {
    const { data } = await supabase
      .from("ae_comanda_itens")
      .select("*")
      .eq("comanda_id", comandaId)
      .order("created_at");

    setItens(data || []);
  }

  async function alterarQtd(id: string, qtd: number) {
    await supabase
      .from("ae_comanda_itens")
      .update({ quantidade: qtd })
      .eq("id", id);
    carregar();
  }

  async function remover(id: string) {
    await supabase.from("ae_comanda_itens").delete().eq("id", id);
    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="bg-white rounded shadow">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Item</th>
            <th>Qtd</th>
            <th>Preço</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.id} className="border-b">
              <td className="p-2">{i.nome}</td>
              <td>
                <input
                  type="number"
                  className="w-16 border p-1"
                  value={i.quantidade}
                  min={1}
                  onChange={(e) =>
                    alterarQtd(i.id, Number(e.target.value))
                  }
                />
              </td>
              <td>R$ {i.preco.toFixed(2)}</td>
              <td>R$ {i.subtotal.toFixed(2)}</td>
              <td>
                <button
                  onClick={() => remover(i.id)}
                  className="text-red-600"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
