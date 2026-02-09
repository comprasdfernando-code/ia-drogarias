"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Reaproveita componentes do carrinho local (vendas)
import ProdutoSearch from "../vendas/_components/ProdutoSearch";
import ItensTable, { CartItem } from "../vendas/_components/ItensTable";

const EMPRESA_SLUG = "ninhocar";

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CaixaClient() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [caixa, setCaixa] = useState<any>(null);
  const [erro, setErro] = useState<string>("");

  // PDV
  const [operador, setOperador] = useState<string>("Caixa");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteWhats, setClienteWhats] = useState("");
  const [obs, setObs] = useState("");

  const [desconto, setDesconto] = useState<number>(0);
  const [acrescimo, setAcrescimo] = useState<number>(0);
  const [itens, setItens] = useState<CartItem[]>([]);

  const [finalizando, setFinalizando] = useState(false);
  const [msg, setMsg] = useState("");

  const subtotal = useMemo(
    () => itens.reduce((acc, it) => acc + (Number(it.preco) || 0) * (Number(it.quantidade) || 0), 0),
    [itens]
  );

  const total = useMemo(() => {
    const t = subtotal - (Number(desconto) || 0) + (Number(acrescimo) || 0);
    return t < 0 ? 0 : t;
  }, [subtotal, desconto, acrescimo]);

  function resetPDV() {
    setClienteNome("");
    setClienteWhats("");
    setObs("");
    setDesconto(0);
    setAcrescimo(0);
    setItens([]);
    setMsg("");
  }

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
    const { data, error } = await supabase
      .from("ae_caixas")
      .insert({
        empresa_id,
        operador_nome: operador || "Caixa",
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
    // abre o caixa uma vez; se trocar operador, você pode fechar/abrir depois
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  async function finalizarPDV(forma: string) {
    setMsg("");

    if (!empresaId || !caixa?.id) return;
    if (itens.length === 0) {
      setMsg("Adicione pelo menos 1 item.");
      return;
    }

    setFinalizando(true);
    try {
      // 1) cria comanda + itens (rascunho)
      const { data, error } = await supabase.rpc("ae_create_comanda_from_cart", {
        p_empresa_id: empresaId,
        p_atendente: operador,
        p_desconto: Number(desconto) || 0,
        p_acrescimo: Number(acrescimo) || 0,
        p_cliente_nome: clienteNome || null,
        p_cliente_whatsapp: clienteWhats || null,
        p_observacao: obs || null,
        p_itens: itens,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      const comandaId = row?.comanda_id;
      const numero = row?.comanda_numero;

      if (!comandaId) throw new Error("RPC não retornou comanda_id");

      // 2) marca comanda como aberta + vincula ao caixa
      const { error: eOpen } = await supabase
        .from("ae_comandas")
        .update({ status: "aberta", caixa_id: caixa.id })
        .eq("id", comandaId);

      if (eOpen) throw eOpen;

      // 3) registra pagamento
      const { error: ePay } = await supabase.from("ae_pagamentos").insert({
        empresa_id: empresaId,
        comanda_id: comandaId,
        caixa_id: caixa.id,
        forma,
        valor: Number(total || 0),
        status: "confirmado",
      });

      if (ePay) throw ePay;

      // 4) fecha comanda (trigger baixa estoque)
      const { error: eClose } = await supabase
        .from("ae_comandas")
        .update({ status: "fechada" })
        .eq("id", comandaId);

      if (eClose) throw eClose;

      setMsg(`✅ Venda finalizada! Comanda #${numero} (${forma.toUpperCase()}) · ${brl(total)}`);
      resetPDV();
    } catch (e: any) {
      console.error(e);
      setMsg(`Erro: ${e?.message || "Falha ao finalizar"}`);
    } finally {
      setFinalizando(false);
    }
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="max-w-xl bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="font-semibold mb-2">Erro no Caixa</div>
          <div className="text-sm text-slate-300">{erro}</div>
        </div>
      </div>
    );
  }

  if (!empresaId) return <div className="p-6 text-slate-200">Carregando empresa…</div>;
  if (!caixa) return <div className="p-6 text-slate-200">Abrindo caixa…</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-bold">Caixa · PDV</div>
          <div className="text-xs text-slate-400">
            Sessão: {String(caixa.id).slice(0, 8)}
          </div>
        </div>

        <button
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
          onClick={resetPDV}
        >
          Limpar PDV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="text-sm font-semibold">Operador</div>
          <input
            className="w-full border border-slate-700 bg-slate-950/60 rounded px-3 py-2 outline-none text-slate-100 placeholder:text-slate-500"
            placeholder="Operador"
            value={operador}
            onChange={(e) => setOperador(e.target.value)}
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="text-sm font-semibold">Cliente (opcional)</div>
          <input
            className="w-full border border-slate-700 bg-slate-950/60 rounded px-3 py-2 outline-none text-slate-100 placeholder:text-slate-500"
            placeholder="Nome"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
          />
          <input
            className="w-full border border-slate-700 bg-slate-950/60 rounded px-3 py-2 outline-none text-slate-100 placeholder:text-slate-500"
            placeholder="WhatsApp"
            value={clienteWhats}
            onChange={(e) => setClienteWhats(e.target.value)}
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="text-sm font-semibold">Observação</div>
          <textarea
            className="w-full min-h-[92px] border border-slate-700 bg-slate-950/60 rounded px-3 py-2 outline-none text-slate-100 placeholder:text-slate-500"
            placeholder="Ex: carro Gol, lâmpada H4..."
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </div>
      </div>

      <ProdutoSearch
        empresaId={empresaId}
        onAdd={(item) => {
          setItens((prev) => {
            const idx = prev.findIndex((x) => x.produto_id === item.produto_id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], quantidade: copy[idx].quantidade + 1 };
              return copy;
            }
            return [...prev, item];
          });
        }}
      />

      <ItensTable itens={itens} setItens={setItens} />

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-300">
            Subtotal: <b className="text-slate-100">{brl(subtotal)}</b>
          </div>

          <div className="flex gap-2 items-end">
            <div>
              <div className="text-xs text-slate-400">Desconto</div>
              <input
                type="number"
                className="w-24 border border-slate-700 bg-slate-950/60 rounded px-2 py-2 outline-none text-slate-100"
                value={desconto}
                onChange={(e) => setDesconto(Number(e.target.value) || 0)}
              />
            </div>

            <div>
              <div className="text-xs text-slate-400">Acréscimo</div>
              <input
                type="number"
                className="w-24 border border-slate-700 bg-slate-950/60 rounded px-2 py-2 outline-none text-slate-100"
                value={acrescimo}
                onChange={(e) => setAcrescimo(Number(e.target.value) || 0)}
              />
            </div>

            <div className="ml-2">
              <div className="text-xs text-slate-400">Total</div>
              <div className="text-xl font-bold">{brl(total)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {["dinheiro", "pix", "debito", "credito"].map((f) => (
            <button
              key={f}
              onClick={() => finalizarPDV(f)}
              disabled={finalizando || itens.length === 0}
              className="rounded-lg px-3 py-3 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              {finalizando ? "Finalizando…" : f.toUpperCase()}
            </button>
          ))}
        </div>

        {msg && (
          <div className="text-sm bg-slate-950/40 border border-slate-800 rounded-lg p-2">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
