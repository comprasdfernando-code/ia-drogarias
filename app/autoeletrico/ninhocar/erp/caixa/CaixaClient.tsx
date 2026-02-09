"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import ComandasPendentes from "./_components/ComandasPendentes";
import AbrirComandaModal from "./_components/AbrirComandaModal";
import ItensComanda from "./_components/ItensComanda";
import PagamentosBox from "./_components/PagamentosBox";
import CaixaResumo from "./_components/CaixaResumo";

const EMPRESA_SLUG = "ninhocar";

export default function CaixaClient() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [caixa, setCaixa] = useState<any>(null);
  const [comanda, setComanda] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [erro, setErro] = useState<string>("");

  async function loadEmpresa() {
    setErro("");

    const { data, error } = await supabase
      .from("ae_empresas")
      .select("id")
      .eq("slug", EMPRESA_SLUG)
      .single();

    if (error || !data?.id) {
      setErro("Empresa não cadastrada (ae_empresas). Crie o slug 'ninhocar'.");
      return;
    }

    setEmpresaId(data.id);
  }

  async function abrirCaixa(empresa_id: string) {
    setErro("");

    // abre uma sessão de caixa
    const { data, error } = await supabase
      .from("ae_caixas")
      .insert({
        empresa_id,
        operador_nome: "Caixa",
        saldo_inicial: 0,
        status: "aberto",
      })
      .select()
      .single();

    if (error || !data) {
      setErro(error?.message || "Falha ao abrir caixa.");
      return;
    }

    setCaixa(data);
  }

  useEffect(() => {
    loadEmpresa();
  }, []);

  useEffect(() => {
    if (empresaId) abrirCaixa(empresaId);
  }, [empresaId]);

  // Tela de erro
  if (erro) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="max-w-xl bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="font-semibold mb-2">Erro no Caixa</div>
          <div className="text-sm text-slate-300">{erro}</div>
          <div className="text-xs text-slate-400 mt-2">
            Dica: cadastre a empresa em <b>ae_empresas</b> com slug <b>ninhocar</b>.
          </div>
        </div>
      </div>
    );
  }

  if (!empresaId) return <div className="p-6 text-slate-200">Carregando empresa…</div>;
  if (!caixa) return <div className="p-6 text-slate-200">Abrindo caixa…</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-4">
      {/* Topo */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <div className="text-xl font-bold">Caixa</div>
          <div className="text-xs text-slate-400">
            Sessão: {String(caixa.id).slice(0, 8)}
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
        >
          🔍 Abrir Comanda (nº)
        </button>
      </div>

      {/* Lista de comandas pendentes */}
      <ComandasPendentes
        empresaId={empresaId}
        caixaId={caixa.id}
        onAbrir={(c: any) => setComanda(c)}
      />

      {/* Comanda aberta no caixa */}
      {comanda && (
        <div className="space-y-4">
          <ItensComanda comandaId={comanda.id} />

          <PagamentosBox
            comanda={comanda}
            caixaId={caixa.id}
            onUpdate={(c: any) => setComanda(c)}
          />

          <CaixaResumo comanda={comanda} />
        </div>
      )}

      {/* Modal abrir por número */}
      {showModal && (
        <AbrirComandaModal
          empresaId={empresaId}
          caixaId={caixa.id}
          onClose={() => setShowModal(false)}
          onOpen={(c: any) => setComanda(c)}
        />
      )}
    </div>
  );
}
