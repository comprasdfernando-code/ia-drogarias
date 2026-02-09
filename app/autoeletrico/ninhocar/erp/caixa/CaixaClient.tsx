"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ComandasPendentes from "./components/ComandasPendentes";
import AbrirComandaModal from "./components/AbrirComandaModal";
import PagamentosBox from "./components/PagamentosBox";
import CaixaResumo from "./components/CaixaResumo";

export default function CaixaClient() {
  const empresaId = "UUID_DA_EMPRESA";
  const operadorNome = "Caixa";
  const [caixa, setCaixa] = useState<any>(null);
  const [comanda, setComanda] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  async function abrirCaixa() {
    const { data } = await supabase
      .from("ae_caixas")
      .insert({
        empresa_id: empresaId,
        operador_nome: operadorNome,
        saldo_inicial: 0,
      })
      .select()
      .single();

    setCaixa(data);
  }

  useEffect(() => {
    abrirCaixa();
  }, []);

  if (!caixa) return <div className="p-6">Abrindo caixa…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Caixa Aberto</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-slate-800 text-white px-4 py-2 rounded"
        >
          🔍 Abrir Comanda
        </button>
      </div>

      <ComandasPendentes
        empresaId={empresaId}
        onAbrir={(c) => setComanda(c)}
        caixaId={caixa.id}
      />

      {comanda && (
        <>
          <PagamentosBox
            comanda={comanda}
            caixaId={caixa.id}
            onUpdate={setComanda}
          />
          <CaixaResumo comanda={comanda} />
        </>
      )}

      {showModal && (
        <AbrirComandaModal
          empresaId={empresaId}
          caixaId={caixa.id}
          onClose={() => setShowModal(false)}
          onOpen={(c) => setComanda(c)}
        />
      )}
    </div>
  );
}
