"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

function brl(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Venda = any;

type Item = {
  id?: string;
  nome: string;
  quantidade: number;
  preco: number;
  subtotal?: number;
};

export default function CaixaGigante() {
  const [tab, setTab] = useState<"pendentes" | "pagas">("pendentes");

  const [caixa, setCaixa] = useState<any>(null);
  const [valorAbertura, setValorAbertura] = useState("");
  const [carregando, setCarregando] = useState(true);

  const [preVendasPDV, setPreVendasPDV] = useState<Venda[]>([]);
  const [pedidosSite, setPedidosSite] = useState<Venda[]>([]);
  const [pagas, setPagas] = useState<Venda[]>([]);

  // modal itens
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVenda, setModalVenda] = useState<Venda | null>(null);
  const [modalItens, setModalItens] = useState<Item[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  async function carregarCaixaAberto() {
    const { data, error } = await supabase
      .from("gigante_caixa")
      .select("*")
      .eq("status", "aberto")
      .single();

    if (error) {
      setCaixa(null);
    } else {
      setCaixa(data || null);
    }
  }

  async function carregarPendencias() {
    // Pré-vendas PDV pendentes (status pre_venda)
    const { data: pdv } = await supabase
      .from("gigante_vendas")
      .select("*")
      .eq("origem", "PDV")
      .eq("status", "pre_venda")
      .order("data", { ascending: false });

    setPreVendasPDV(pdv || []);

    // Pedidos do site pendentes (status != entregue)
    const { data: site } = await supabase
      .from("gigante_vendas")
      .select("*")
      .eq("origem", "SITE")
      .neq("status", "entregue")
      .order("data", { ascending: false });

    setPedidosSite(site || []);
  }

  async function carregarPagas() {
    // Tenta usar status_caixa se existir. Se não existir, usa status='pago'
    const { data, error } = await supabase
      .from("gigante_vendas")
      .select("*")
      .eq("status_caixa", "pago")
      .order("data", { ascending: false });

    if (!error) {
      setPagas(data || []);
      return;
    }

    const { data: alt } = await supabase
      .from("gigante_vendas")
      .select("*")
      .eq("status", "pago")
      .order("data", { ascending: false });

    setPagas(alt || []);
  }

  async function carregarTudo() {
    setCarregando(true);
    await carregarCaixaAberto();
    await carregarPendencias();
    await carregarPagas();
    setCarregando(false);
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  async function abrirCaixa() {
    if (!valorAbertura) {
      alert("Digite o valor de abertura");
      return;
    }

    const { error } = await supabase.from("gigante_caixa").insert({
      valor_abertura: parseFloat(valorAbertura),
      status: "aberto",
      operador: "Operador 1",
      data_abertura: new Date().toISOString(),
    });

    if (error) {
      console.error(error);
      alert("Erro ao abrir caixa (RLS/colunas).");
      return;
    }

    setValorAbertura("");
    await carregarTudo();
  }

  async function fecharCaixa() {
    if (!caixa) return;
    if (!confirm("Deseja realmente fechar o caixa?")) return;

    // pega vendas pagas desde abertura
    const inicio = caixa.data_abertura;

    const { data: vend, error } = await supabase
      .from("gigante_vendas")
      .select("*")
      .gte("data", inicio)
      .order("data", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar vendas para fechar o caixa.");
      return;
    }

    const vendasPeriodo = vend || [];

    const totalGeral = vendasPeriodo.reduce((s: number, v: any) => s + Number(v.total || 0), 0);

    const { error: upd } = await supabase
      .from("gigante_caixa")
      .update({
        data_fechamento: new Date().toISOString(),
        total_vendido: totalGeral,
        valor_fechamento: totalGeral,
        status: "fechado",
      })
      .eq("id", caixa.id);

    if (upd) {
      console.error(upd);
      alert("Erro ao fechar caixa.");
      return;
    }

    alert("Caixa fechado!");
    setCaixa(null);
    await carregarTudo();
  }

  function tituloVenda(v: any) {
    const comanda = (v?.comanda_numero || "").toString().trim();
    if (comanda) return `Comanda ${comanda}`;
    return `#${String(v.id).slice(0, 6).toUpperCase()}`;
  }

  async function verItens(v: any) {
    setModalOpen(true);
    setModalVenda(v);
    setModalItens([]);
    setModalLoading(true);

    const { data, error } = await supabase
      .from("gigante_venda_itens")
      .select("nome,quantidade,preco,subtotal")
      .eq("venda_id", v.id)
      .order("criado_em", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar itens.");
      setModalLoading(false);
      return;
    }

    setModalItens((data as any) || []);
    setModalLoading(false);
  }

  async function excluirComanda(v: any) {
    if (!confirm(`Excluir ${tituloVenda(v)}? Isso apaga itens também.`)) return;

    // apaga itens primeiro
    const { error: ed } = await supabase.from("gigante_venda_itens").delete().eq("venda_id", v.id);
    if (ed) {
      console.error(ed);
      alert("Erro ao excluir itens (RLS?).");
      return;
    }

    const { error: ev } = await supabase.from("gigante_vendas").delete().eq("id", v.id);
    if (ev) {
      console.error(ev);
      alert("Erro ao excluir comanda (RLS?).");
      return;
    }

    alert("Comanda excluída ✅");
    await carregarTudo();
  }

  async function darBaixa(v: any) {
    if (!confirm(`Dar baixa em ${tituloVenda(v)}?`)) return;

    // tenta marcar status_caixa='pago' (se existir), senão status='pago'
    const tenta1 = await supabase
      .from("gigante_vendas")
      .update({ status_caixa: "pago", pago_em: new Date().toISOString() })
      .eq("id", v.id);

    if (tenta1.error) {
      const tenta2 = await supabase
        .from("gigante_vendas")
        .update({ status: "pago", pago_em: new Date().toISOString() })
        .eq("id", v.id);

      if (tenta2.error) {
        console.error(tenta1.error, tenta2.error);
        alert("Erro ao dar baixa (RLS/colunas).");
        return;
      }
    }

    alert("Baixa feita ✅");
    await carregarTudo();
  }

  const totalPendencias = useMemo(() => {
    return (
      preVendasPDV.reduce((s, v) => s + Number(v.total || 0), 0) +
      pedidosSite.reduce((s, v) => s + Number(v.total || 0), 0)
    );
  }, [preVendasPDV, pedidosSite]);

  if (carregando) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">💵 Caixa — Gigante dos Assados</h1>
          <p className="text-sm text-gray-600">Baixa de PDV (pré-venda) + SITE (pedidos).</p>
        </div>

        <div className="flex gap-2">
          <button onClick={carregarTudo} className="px-3 py-2 rounded border bg-white hover:bg-gray-50">
            🔄 Atualizar
          </button>

          <Link href="/gigante/pdv" className="px-3 py-2 rounded bg-gray-900 text-white hover:bg-black">
            🧾 Ir PDV
          </Link>
        </div>
      </div>

      {/* Abertura */}
      <div className="mt-4 bg-white border rounded-2xl p-4 shadow-sm">
        <h2 className="text-xl font-bold mb-2">Abertura de Caixa</h2>

        {!caixa ? (
          <>
            <input
              type="number"
              placeholder="Valor de abertura (troco)"
              className="border p-3 rounded-xl w-full"
              value={valorAbertura}
              onChange={(e) => setValorAbertura(e.target.value)}
            />

            <button
              onClick={abrirCaixa}
              className="bg-green-600 text-white w-full mt-3 p-3 rounded-xl font-bold hover:bg-green-700"
            >
              🧾 Abrir Caixa
            </button>

            <div className="text-xs text-gray-500 mt-2">
              * Mesmo sem caixa aberto, você ainda pode dar baixa nas pendências (testes).
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-gray-700">
                Caixa aberto às{" "}
                <b>{new Date(caixa.data_abertura).toLocaleString("pt-BR")}</b> • Troco:{" "}
                <b>R$ {Number(caixa.valor_abertura || 0).toFixed(2)}</b>
              </div>

              <button
                onClick={fecharCaixa}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
              >
                🔒 Fechar Caixa
              </button>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setTab("pendentes")}
          className={`px-4 py-2 rounded-xl font-bold ${
            tab === "pendentes" ? "bg-black text-white" : "bg-white border"
          }`}
        >
          ⏳ Pendentes
        </button>

        <button
          onClick={() => setTab("pagas")}
          className={`px-4 py-2 rounded-xl font-bold ${
            tab === "pagas" ? "bg-black text-white" : "bg-white border"
          }`}
        >
          ✅ Pagas (caixa)
        </button>
      </div>

      {tab === "pendentes" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pré-vendas PDV */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">📌 Pré-vendas (PDV)</h3>
              <div className="text-xs text-gray-500">{preVendasPDV.length}</div>
            </div>

            {preVendasPDV.length === 0 ? (
              <div className="text-sm text-gray-500 mt-3">Nenhuma pré-venda pendente.</div>
            ) : (
              <div className="mt-3 space-y-3">
                {preVendasPDV.map((v) => (
                  <div key={v.id} className="border rounded-2xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold">{tituloVenda(v)}</div>
                      <div className="font-extrabold text-red-600">R$ {brl(Number(v.total || 0))}</div>
                    </div>

                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(v.data).toLocaleString("pt-BR")} • PRE_VENDA
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => verItens(v)}
                        className="py-2 rounded-xl border hover:bg-gray-50 font-bold"
                      >
                        📋 Ver itens
                      </button>

                      <button
                        onClick={() => darBaixa(v)}
                        className="py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-bold"
                      >
                        💰 Dar baixa
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Link
                        href={`/gigante/pdv?id=${v.id}`}
                        className="py-2 rounded-xl bg-gray-900 text-white hover:bg-black font-bold text-center"
                      >
                        ✍️ Abrir no PDV
                      </Link>

                      <button
                        onClick={() => excluirComanda(v)}
                        className="py-2 rounded-xl border border-red-500 text-red-600 hover:bg-red-50 font-bold"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pedidos SITE */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">🛒 Pedidos (SITE)</h3>
              <div className="text-xs text-gray-500">{pedidosSite.length}</div>
            </div>

            {pedidosSite.length === 0 ? (
              <div className="text-sm text-gray-500 mt-3">Nenhum pedido pendente.</div>
            ) : (
              <div className="mt-3 space-y-3">
                {pedidosSite.map((v) => (
                  <div key={v.id} className="border rounded-2xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold">#{String(v.id).slice(0, 6).toUpperCase()}</div>
                      <div className="font-extrabold text-red-600">R$ {brl(Number(v.total || 0))}</div>
                    </div>

                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(v.data).toLocaleString("pt-BR")} • Status: {v.status} • {v.tipo_entrega}
                    </div>

                    {(v.tipo_entrega === "entrega" || v.cliente_nome || v.cliente_telefone) && (
                      <div className="mt-2 text-xs bg-gray-50 border rounded-xl p-2">
                        <div className="font-bold">📍 {v.tipo_entrega === "entrega" ? "Entrega" : "Retirada"}</div>
                        <div>{v.cliente_nome}</div>
                        <div>{v.cliente_telefone}</div>
                        {v.tipo_entrega === "entrega" && <div>{v.cliente_endereco}</div>}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => verItens(v)}
                        className="py-2 rounded-xl border hover:bg-gray-50 font-bold"
                      >
                        📋 Ver itens
                      </button>

                      <button
                        onClick={() => darBaixa(v)}
                        className="py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-bold"
                      >
                        💰 Dar baixa
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Link
                        href={`/gigante/cupom/${v.id}`}
                        target="_blank"
                        className="py-2 rounded-xl bg-gray-900 text-white hover:bg-black font-bold text-center"
                      >
                        🧾 Ver cupom
                      </Link>

                      <button
                        onClick={() => excluirComanda(v)}
                        className="py-2 rounded-xl border border-red-500 text-red-600 hover:bg-red-50 font-bold"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 text-sm text-gray-600">
            Total pendências: <b className="text-black">R$ {brl(totalPendencias)}</b>
          </div>
        </div>
      )}

      {tab === "pagas" && (
        <div className="mt-4 bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold">✅ Pagas (caixa)</h3>
            <div className="text-xs text-gray-500">{pagas.length}</div>
          </div>

          {pagas.length === 0 ? (
            <div className="text-sm text-gray-500 mt-3">Nenhuma baixa registrada ainda.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {pagas.map((v) => (
                <div key={v.id} className="border rounded-xl p-2 flex items-center justify-between">
                  <div className="text-sm">
                    <b>{tituloVenda(v)}</b>{" "}
                    <span className="text-gray-500">• {new Date(v.data).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="font-extrabold text-green-700">R$ {brl(Number(v.total || 0))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de itens */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-lg rounded-2xl p-4 shadow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-extrabold text-lg">📋 Itens — {modalVenda ? tituloVenda(modalVenda) : ""}</div>
                <div className="text-xs text-gray-600">
                  {modalVenda?.origem ? `Origem: ${modalVenda.origem}` : ""}{" "}
                  {modalVenda?.tipo_entrega ? `• ${modalVenda.tipo_entrega}` : ""}
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-600 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 border-t pt-3">
              {modalLoading ? (
                <div className="text-sm text-gray-600">Carregando itens...</div>
              ) : modalItens.length === 0 ? (
                <div className="text-sm text-gray-600">Sem itens.</div>
              ) : (
                <div className="space-y-2">
                  {modalItens.map((it, idx) => {
                    const sub = Number(it.subtotal ?? Number(it.preco) * Number(it.quantidade));
                    return (
                      <div key={idx} className="flex items-center justify-between text-sm border rounded-xl p-2">
                        <div className="min-w-0">
                          <div className="font-bold truncate">{it.quantidade}x {it.nome}</div>
                          <div className="text-xs text-gray-600">
                            R$ {brl(Number(it.preco))} • Sub: R$ {brl(sub)}
                          </div>
                        </div>
                        <div className="font-extrabold">R$ {brl(sub)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 border-t pt-3 flex items-center justify-between">
              <div className="text-sm">
                Total: <b className="text-lg">R$ {brl(Number(modalVenda?.total || 0))}</b>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => modalVenda && excluirComanda(modalVenda)}
                  className="px-4 py-2 rounded-xl border border-red-500 text-red-600 hover:bg-red-50 font-bold"
                >
                  🗑️ Excluir
                </button>

                <button
                  onClick={() => modalVenda && darBaixa(modalVenda)}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-bold"
                >
                  💰 Dar baixa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
