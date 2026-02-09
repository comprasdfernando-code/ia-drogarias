"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProdutoSearch({
  comandaId,
  empresaId,
}: {
  comandaId: string;
  empresaId: string;
}) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);

  async function buscar() {
    const { data } = await supabase
  .from("ae_produtos")
  .select("*")
  .eq("empresa_id", empresaId)
  .or(
    `nome.ilike.%${busca}%,ean.eq.${busca},sku.eq.${busca}`
  )
  .limit(10);


    setResultados(data || []);
  }

  async function addItem(prod: any) {
    await supabase.from("ae_comanda_itens").insert({
      empresa_id: empresaId,
      comanda_id: comandaId,
      produto_id: prod.id,
      tipo: prod.tipo,
      nome: prod.nome,
      ean: prod.ean,
      preco: prod.preco,
      quantidade: 1,
    });

    setBusca("");
    setResultados([]);
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          placeholder="Buscar produto ou serviço"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button onClick={buscar} className="px-4 bg-slate-800 text-white rounded">
          Buscar
        </button>
      </div>

      {resultados.length > 0 && (
        <div className="mt-2 border rounded">
          {resultados.map((p) => (
            <div
              key={p.id}
              className="p-2 hover:bg-slate-100 cursor-pointer flex justify-between"
              onClick={() => addItem(p)}
            >
              <span>{p.nome}</span>
              <span>R$ {p.preco.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
