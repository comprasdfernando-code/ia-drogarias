"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Caixa = {
  id: string;
  data_abertura: string;
  data_fechamento?: string | null;
  valor_abertura: number;
  status: "aberto" | "fechado" | string;
  operador?: string | null;
};

type Venda = {
  id: string;
  data: string;
  total: number;
  subtotal?: number | null;
  frete?: number | null;
  origem?: string | null;
  status?: string | null;
  tipo_entrega?: string | null;
  metodo_pagamento?: string | null;
  cliente_nome?: string | null;
  cliente_telefone?: string | null;
  cliente_endereco?: string | null;
};

function money(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMoney(v: string) {
  const n = Number(String(v || "").replace(".", "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export default function CaixaGigante() {
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [valorAbertura, setValorAbertura] = useState("");
  const [carregando, setCarregando] = useState(true);

  const [pendentesPDV, setPendentesPDV] = useState<Venda[]>([]);
  const [pendentesSITE, setPendentesSITE] = useState<Venda[]>([]);
  const [vendasPagas, setVendasPagas] = useState<Venda[]>([]);

  const [aba, setAba] = useState<"pendentes" | "pagas">("pendentes");

  // modal baixa
  const [modalVenda, setModalVenda] = useState<Venda | null>(null);
  const [mp, setMp] = useState<"PIX" | "DINHEIRO" | "DÉBITO" | "CRÉDITO">("PIX");
  const [frete, setFrete] = useState<string>("0");
  const [processing, setProcessing] = useState(false);

  async function carregarCaixa() {
    setCarregando(true);

    const { data } = await supabase
      .from("gigante_caixa")
      .select("*")
      .eq("status", "aberto")
      .single();

    setCaixa((data as any) || null);
    setCarregando(false);

    if (data?.data_abertura) {
      await carregarMovimento(data.data_abertura);
    } else {
      // se não tem caixa aberto, ainda assim carrega pendentes (útil)
      await carregarPendentes();
    }
  }

  async function carregarPendentes() {
    // ✅ PDV pendente = pre_venda
    const pdv = await supabase
      .from("gigante_vendas")
      .select("id,data,total,subtotal,frete,origem,status,tipo_entrega,metodo_pagamento,cliente_nome,cliente_telefone,cliente_endereco")
      .eq("origem", "PDV")
      .eq("status", "pre_venda")
      .order("data", { ascending: false })
      .limit(200);

    if (!pdv.error) setPendentesPDV((pdv.data as any) || []);
    else console.error(pdv.error);

    // ✅ SITE pendente = tudo que não está pago (você pode refinar depois)
    const site = await supabase
      .from("gigante_vendas")
      .select("id,data,total,subtotal,frete,origem,status,tipo_entrega,metodo_pagamento,cliente_nome,cliente_telefone,cliente_endereco")
      .eq("origem", "SITE")
      .neq("status", "pago")
      .order("data", { ascending: false })
      .limit(200);

    if (!site.error) setPendentesSITE((site.data as any) || []);
    else console.error(site.error);
  }

  // Carrega vendas pagas no período do caixa
  async function carregarMovimento(inicio: string) {
    await carregarPendentes();

    const pagas = await supabase
      .from("gigante_vendas")
      .select("id,data,total,subtotal,frete,origem,status,tipo_entrega,metodo_pagamento")
      .gte("data", inicio)
      .eq("status", "pago")
      .order("data", { ascending: true })
      .limit(500);

    if (!pagas.error) setVendasPagas((pagas.data as any) || []);
    else console.error(pagas.error);
  }

  useEffect(() => {
    carregarCaixa();
  }, []);

  // Abrir caixa
  async function abrirCaixa() {
    if (!valorAbertura) {
      alert("Digite o valor de abertura");
      return;
    }

    const { error } = await supabase.from("gigante_caixa").insert({
      valor_abertura: parseMoney(valorAbertura),
      status: "aberto",
      operador: "Operador 1",
    });

    if (error) {
      console.error(error);
      alert("Erro ao abrir caixa.");
      return;
    }

    setValorAbertura("");
    carregarCaixa();
  }

  // Fechar caixa
  async function fecharCaixa() {
    if (!caixa) return;
    if (!confirm("Deseja realmente fechar o caixa?")) return;

    const totalGeral = vendasPagas.reduce((s, v) => s + Number(v.total || 0), 0);

    // Totais por método (olha metodo_pagamento textual)
    const totalPIX = vendasPagas
      .filter((v) => String(v.metodo_pagamento || "").toUpperCase().includes("PIX"))
      .reduce((s, v) => s + Number(v.total || 0), 0);

    const totalDIN = vendasPagas
      .filter((v) => String(v.metodo_pagamento || "").toUpperCase().includes("DINHEIRO"))
      .reduce((s, v) => s + Number(v.total || 0), 0);

    const totalDEB = vendasPagas
      .filter((v) => String(v.metodo_pagamento || "").toUpperCase().includes("DÉBITO") || String(v.metodo_pagamento || "").toUpperCase().includes("DEBITO"))
      .reduce((s, v) => s + Number(v.total || 0), 0);

    const totalCRE = vendasPagas
      .filter((v) => String(v.metodo_pagamento || "").toUpperCase().includes("CRÉDITO") || String(v.metodo_pagamento || "").toUpperCase().includes("CREDITO"))
      .reduce((s, v) => s + Number(v.total || 0), 0);

    await supabase
      .from("gigante_caixa")
      .update({
        data_fechamento: new Date().toISOString(),
        total_pix: totalPIX,
        total_dinheiro: totalDIN,
        total_debito: totalDEB,
        total_credito: totalCRE,
        total_vendido: totalGeral,
        valor_fechamento: totalGeral,
        status: "fechado",
      })
      .eq("id", caixa.id);

    setCaixa(null);
    setVendasPagas([]);
    alert("Caixa fechado!");
  }

  function abrirBaixa(v: Venda) {
    setModalVenda(v);

    // sugere método salvo
    const s = String(v.metodo_pagamento || "").toUpperCase();
    if (s.includes("DIN")) setMp("DINHEIRO");
    else if (s.includes("DEB")) setMp("DÉBITO");
    else if (s.includes("CRE")) setMp("CRÉDITO");
    else setMp("PIX");

    setFrete(String(v.frete ?? 0));
  }

  async function confirmarBaixa() {
    if (!modalVenda) return;

    try {
      setProcessing(true);

      // calcula subtotal base: se existir subtotal usa, senão usa total atual
      const subtotal = Number(modalVenda.subtotal ?? modalVenda.total ?? 0);
      const freteNum = modalVenda.tipo_entrega === "entrega" ? parseMoney(frete) : 0;
      const totalFinal = subtotal + freteNum;

      const { error } = await supabase
        .from("gigante_vendas")
        .update({
          subtotal,
          frete: freteNum,
          total: totalFinal,
          metodo_pagamento: mp,
          status: "pago",
          data: new Date().toISOString(),
        })
        .eq("id", modalVenda.id);

      if (error) throw error;

      alert("Baixa realizada ✅");
      setModalVenda(null);

      // Atualiza listas
      if (caixa?.data_abertura) await carregarMovimento(caixa.data_abertura);
      else await carregarPendentes();

      // imprime cupom final
      window.open(`/gigante/cupom/${modalVenda.id}`, "_blank");
    } catch (e) {
      console.error(e);
      alert("Erro ao dar baixa (RLS/colunas). Veja o console.");
    } finally {
      setProcessing(false);
    }
  }

  const totalPago = useMemo(
    () => vendasPagas.reduce((s, v) => s + Number(v.total || 0), 0),
    [vendasPagas]
  );

  if (carregando) return <p className="p-6">Carregando...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h1 className="text-3xl font-extrabold">💵 Caixa — Gigante dos Assados</h1>
            <p className="text-sm text-gray-600">
              Baixa de PDV (pré-venda) + SITE (pedidos).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => (caixa?.data_abertura ? carregarMovimento(caixa.data_abertura) : carregarPendentes())}
              className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
            >
              🔄 Atualizar
            </button>

            <Link
              href="/gigante/pdv"
              className="px-3 py-2 rounded bg-gray-900 text-white hover:bg-black"
            >
              🧾 Ir PDV
            </Link>
          </div>
        </div>

        {/* Caixa fechado */}
        {!caixa && (
          <div className="bg-white shadow p-5 rounded-2xl">
            <h2 className="text-xl font-semibold mb-2">Abertura de Caixa</h2>

            <input
              type="number"
              placeholder="Valor de abertura (troco)"
              className="border p-3 rounded-xl w-full"
              value={valorAbertura}
              onChange={(e) => setValorAbertura(e.target.value)}
            />

            <button
              onClick={abrirCaixa}
              className="bg-green-600 text-white w-full mt-3 p-3 rounded-xl font-bold"
            >
              🧾 Abrir Caixa
            </button>

            <div className="text-xs text-gray-500 mt-2">
              * Mesmo sem caixa aberto, você ainda pode dar baixa nas pendências (testes).
            </div>
          </div>
        )}

        {/* Caixa aberto */}
        {caixa && (
          <div className="bg-white shadow p-5 rounded-2xl mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold">
                  Caixa aberto às {new Date(caixa.data_abertura).toLocaleTimeString("pt-BR")}
                </h2>
                <p className="text-sm text-gray-600">
                  Abertura: <b>R$ {money(Number(caixa.valor_abertura || 0))}</b>
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-600">Total pago no caixa</div>
                <div className="text-3xl font-extrabold text-green-700">R$ {money(totalPago)}</div>
              </div>
            </div>

            <button
              onClick={fecharCaixa}
              className="bg-red-600 text-white w-full mt-4 p-3 rounded-xl font-bold"
            >
              🔒 Fechar Caixa
            </button>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setAba("pendentes")}
            className={`px-3 py-2 rounded-xl font-bold ${aba === "pendentes" ? "bg-black text-white" : "bg-white border"}`}
          >
            ⏳ Pendentes
          </button>
          <button
            onClick={() => setAba("pagas")}
            className={`px-3 py-2 rounded-xl font-bold ${aba === "pagas" ? "bg-black text-white" : "bg-white border"}`}
          >
            ✅ Pagas (caixa)
          </button>
        </div>

        {aba === "pendentes" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* PDV */}
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold">🧾 Pré-vendas (PDV)</h3>
                <span className="text-sm text-gray-600">{pendentesPDV.length}</span>
              </div>

              <div className="mt-3 space-y-2">
                {pendentesPDV.length === 0 && (
                  <div className="text-sm text-gray-500">Nenhuma pré-venda pendente.</div>
                )}

                {pendentesPDV.map((v) => (
                  <div key={v.id} className="border rounded-xl p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="font-bold">#{v.id.slice(0, 6).toUpperCase()}</div>
                      <div className="font-extrabold text-red-600">R$ {money(Number(v.total || 0))}</div>
                    </div>

                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(v.data).toLocaleString("pt-BR")} • {String(v.metodo_pagamento || "—")}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/gigante/pdv?id=${v.id}`}
                        className="px-3 py-2 rounded border bg-white hover:bg-gray-100 text-sm"
                      >
                        ✏️ Abrir no PDV
                      </Link>

                      <button
                        onClick={() => abrirBaixa(v)}
                        className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm font-bold"
                      >
                        💰 Dar baixa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SITE */}
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold">📲 Pedidos (SITE)</h3>
                <span className="text-sm text-gray-600">{pendentesSITE.length}</span>
              </div>

              <div className="mt-3 space-y-2">
                {pendentesSITE.length === 0 && (
                  <div className="text-sm text-gray-500">Nenhum pedido pendente.</div>
                )}

                {pendentesSITE.map((v) => (
                  <div key={v.id} className="border rounded-xl p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="font-bold">#{v.id.slice(0, 6).toUpperCase()}</div>
                      <div className="font-extrabold text-red-600">R$ {money(Number(v.total || 0))}</div>
                    </div>

                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(v.data).toLocaleString("pt-BR")} • Status: {String(v.status || "—")} • {String(v.tipo_entrega || "—")}
                    </div>

                    {String(v.tipo_entrega || "") === "entrega" && (
                      <div className="text-xs text-gray-700 mt-2 bg-white border rounded p-2">
                        <div className="font-semibold">📍 Entrega</div>
                        <div>{v.cliente_nome}</div>
                        <div>{v.cliente_telefone}</div>
                        <div className="text-gray-600">{v.cliente_endereco}</div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/gigante/cupom/${v.id}`}
                        target="_blank"
                        className="px-3 py-2 rounded border bg-white hover:bg-gray-100 text-sm"
                      >
                        🧾 Ver cupom
                      </Link>

                      <button
                        onClick={() => abrirBaixa(v)}
                        className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm font-bold"
                      >
                        💰 Dar baixa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {aba === "pagas" && (
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">✅ Vendas pagas no período do caixa</h3>
              <span className="text-sm text-gray-600">{vendasPagas.length}</span>
            </div>

            <div className="mt-3 space-y-2">
              {vendasPagas.length === 0 && (
                <div className="text-sm text-gray-500">Nenhuma venda paga ainda.</div>
              )}

              {vendasPagas.map((v) => (
                <div key={v.id} className="border rounded-xl p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="font-bold">
                      #{v.id.slice(0, 6).toUpperCase()} • {String(v.origem || "-")}
                    </div>
                    <div className="font-extrabold text-green-700">R$ {money(Number(v.total || 0))}</div>
                  </div>

                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(v.data).toLocaleString("pt-BR")} • {String(v.metodo_pagamento || "-")}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/gigante/cupom/${v.id}`}
                      target="_blank"
                      className="px-3 py-2 rounded bg-gray-900 text-white hover:bg-black text-sm"
                    >
                      🖨️ Imprimir
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL BAIXA */}
        {modalVenda && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-2xl shadow p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-extrabold">💰 Dar baixa</div>
                  <div className="text-sm text-gray-600">
                    Pedido #{modalVenda.id.slice(0, 6).toUpperCase()} • {String(modalVenda.origem || "-")}
                  </div>
                </div>
                <button
                  onClick={() => setModalVenda(null)}
                  className="px-3 py-1 rounded border"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-sm font-bold">Pagamento</label>
                  <select
                    value={mp}
                    onChange={(e) => setMp(e.target.value as any)}
                    className="w-full border p-3 rounded-xl mt-1"
                  >
                    <option value="PIX">PIX</option>
                    <option value="DINHEIRO">DINHEIRO</option>
                    <option value="DÉBITO">DÉBITO</option>
                    <option value="CRÉDITO">CRÉDITO</option>
                  </select>
                </div>

                {String(modalVenda.tipo_entrega || "") === "entrega" && (
                  <div>
                    <label className="text-sm font-bold">Frete</label>
                    <input
                      value={frete}
                      onChange={(e) => setFrete(e.target.value)}
                      placeholder="ex: 8,50"
                      className="w-full border p-3 rounded-xl mt-1"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Entrega: você pode ajustar o frete antes de fechar.
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 border rounded-xl p-3 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal (base)</span>
                    <b>R$ {money(Number(modalVenda.subtotal ?? modalVenda.total ?? 0))}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <b>
                      R$ {money(String(modalVenda.tipo_entrega || "") === "entrega" ? parseMoney(frete) : 0)}
                    </b>
                  </div>
                  <div className="flex justify-between text-base mt-1">
                    <span>Total</span>
                    <b>
                      R$ {money(
                        Number(modalVenda.subtotal ?? modalVenda.total ?? 0) +
                          (String(modalVenda.tipo_entrega || "") === "entrega" ? parseMoney(frete) : 0)
                      )}
                    </b>
                  </div>
                </div>

                <button
                  onClick={confirmarBaixa}
                  disabled={processing}
                  className={`w-full py-3 rounded-xl font-extrabold text-white ${
                    processing ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {processing ? "Processando..." : "✅ Confirmar baixa e imprimir"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
