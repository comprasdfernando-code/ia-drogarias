"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProdutoSearch from "./components/ProdutoSearch";
import ItensTable from "./components/ItensTable";
import ComandaResumo from "./components/ComandaResumo";

export default function VendasClient() {
  const empresaId = "UUID_DA_EMPRESA"; // depois puxamos do contexto
  const [comanda, setComanda] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  async function criarComanda() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ae_comandas")
      .insert({
        empresa_id: empresaId,
        status: "rascunho",
      })
      .select()
      .single();

    setLoading(false);
    if (!error) setComanda(data);
  }

  useEffect(() => {
    criarComanda();
  }, []);

  if (!comanda) {
    return <div className="p-6">Criando comanda…</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">
          Venda · Comanda #{comanda.numero}
        </h1>

        <button
          className="bg-slate-700 text-white px-4 py-2 rounded"
          onClick={criarComanda}
        >
          Nova Venda
        </button>
      </div>

      <ProdutoSearch comandaId={comanda.id} empresaId={empresaId} />
      <ItensTable comandaId={comanda.id} />
      <ComandaResumo comanda={comanda} onUpdate={setComanda} />
    </div>
  );
}
