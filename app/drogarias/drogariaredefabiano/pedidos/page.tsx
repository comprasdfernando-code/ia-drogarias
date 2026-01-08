"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOJA_SLUG = "drogariaredefabiano";

// Ajuste os status que você quer trabalhar
const STATUS_OPCOES = ["NOVO", "SEPARANDO", "PRONTO", "ENTREGUE", "CANCELADO", "FINALIZADA"] as const;

function brl(n: number) {
  return (Number(n || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pickData(v: any): string {
  // prioridade: created_at -> data_venda -> finalizada_em
  return v?.created_at || v?.data_venda || v?.finalizada_em || v?.updated_at || new Date().toISOString();
}

function fmtData(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function txt(v: any) {
  return String(v ?? "").toLowerCase();
}

export default function PedidosFabianoPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [itens, setItens] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState<string>("TODOS");
  const [fOrigem, setFOrigem] = useState<string>("TODAS");

  const [selecionado, setSelecionado] = useState<any | null>(null);

  async function carregar() {
    try {
      setLoading(true);
      setErro(null);

      // Importante: não usar order("created_at") se sua tabela não tem essa coluna.
      // Agora que vamos adicionar via SQL, ok. Mesmo assim, deixei resiliente:
      // buscamos e ordenamos no front usando pickData().

      const { data, error } = await supabase
        .from("vendas")
        .select("*")
        .eq("loja_slug", LOJA_SLUG)
        .limit(500);

      if (error) throw error;

      const arr = (data || []).slice().sort((a: any, b: any) => {
        const da = new Date(pickData(a)).getTime();
        const db = new Date(pickData(b)).getTime();
        return db - da;
      });

      setItens(arr);
    } catch (e: any) {
      console.error(e);
      setErro(e?.message || "Erro ao carregar pedidos.");
      alert(e?.message || "Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return itens.filter((v) => {
      const origem = String(v?.origem || "").toUpperCase(); // "SITE" ou "PDV"
      const status = String(v?.status || "").toUpperCase();

      if (fOrigem !== "TODAS" && origem !== fOrigem) return false;
      if (fStatus !== "TODOS" && status !== fStatus) return false;

      if (!qq) return true;

      const clienteNome = v?.cliente?.nome ?? v?.nome ?? "";
      const clienteTel = v?.cliente?.telefone ?? v?.telefone ?? "";
      const clienteEnd = v?.cliente?.endereco ?? v?.endereco ?? "";

      const itensTxt =
        Array.isArray(v?.itens)
          ? v.itens.map((i: any) => `${i?.nome ?? ""} ${i?.ean ?? ""}`).join(" ")
          : Array.isArray(v?.produtos)
            ? v.produtos.map((i: any) => `${i?.nome ?? ""} ${i?.ean ?? ""}`).join(" ")
            : "";

      const hay = [
        origem,
        status,
        String(v?.id ?? ""),
        String(v?.total ?? ""),
        clienteNome,
        clienteTel,
        clienteEnd,
        itensTxt,
      ]
        .map((s) => txt(s))
        .join(" ");

      return hay.includes(qq);
    });
  }, [itens, q, fStatus, fOrigem]);

  const total = useMemo(() => filtrados.reduce((s, v) => s + Number(v?.total || 0), 0), [filtrados]);

  async function atualizarStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from("vendas")
        .update({ status })
        .eq("id", id)
        .eq("loja_slug", LOJA_SLUG);

      if (error) throw error;

      // atualiza no front sem precisar recarregar tudo
      setItens((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status } : x))
      );
      setSelecionado((prev: any) => (prev?.id === id ? { ...prev, status } : prev));
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao atualizar status.");
    }
  }

  function getItensVenda(v: any) {
    // compatível com seus dois formatos antigos: v.itens ou v.produtos
    if (Array.isArray(v?.itens)) return v.itens;
    if (Array.isArray(v?.produtos)) return v.produtos;
    return [];
  }

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">📦 Pedidos (SITE + PDV) — Rede Fabiano</h1>
        <button
          onClick={carregar}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Atualizar
        </button>
      </div>

      {erro && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
          {erro}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <select
          value={fOrigem}
          onChange={(e) => setFOrigem(e.target.value)}
          className="sm:col-span-2 border rounded-lg px-3 py-2"
        >
          <option value="TODAS">Todas</option>
          <option value="SITE">SITE</option>
          <option value="PDV">PDV</option>
        </select>

        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="sm:col-span-3 border rounded-lg px-3 py-2"
        >
          <option value="TODOS">Todos status</option>
          {STATUS_OPCOES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por produto / cliente / telefone / EAN / ID..."
          className="sm:col-span-5 border rounded-lg px-3 py-2"
        />

        <div className="sm:col-span-2 border rounded-lg px-3 py-2 bg-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total:</span>
          <span className="font-bold text-emerald-700">{brl(total)}</span>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        {loading ? "Carregando..." : `Encontrados: ${filtrados.length}`}
      </div>

      <div className="mt-3 overflow-x-auto bg-white border rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-blue-900">
            <tr>
              <th className="p-2 border-b text-left">Data</th>
              <th className="p-2 border-b text-center">Origem</th>
              <th className="p-2 border-b text-center">Status</th>
              <th className="p-2 border-b text-left">Cliente</th>
              <th className="p-2 border-b text-right">Total</th>
              <th className="p-2 border-b text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}

            {filtrados.map((v) => {
              const origem = String(v?.origem || "").toUpperCase();
              const status = String(v?.status || "").toUpperCase();
              const dt = pickData(v);
              const cliente = v?.cliente?.nome || v?.nome || (origem === "PDV" ? "Balcão" : "—");
              const tel = v?.cliente?.telefone || v?.telefone || "";

              return (
                <tr key={v.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 text-left whitespace-nowrap">{fmtData(dt)}</td>

                  <td className="p-2 text-center">
                    {origem === "SITE" ? (
                      <span className="text-xs bg-blue-700 text-white px-2 py-0.5 rounded">🌐 SITE</span>
                    ) : (
                      <span className="text-xs bg-emerald-700 text-white px-2 py-0.5 rounded">🏪 PDV</span>
                    )}
                  </td>

                  <td className="p-2 text-center">
                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded">
                      {status || "—"}
                    </span>
                  </td>

                  <td className="p-2 text-left">
                    <div className="font-medium text-gray-800">{cliente}</div>
                    {tel && <div className="text-xs text-gray-500">{tel}</div>}
                  </td>

                  <td className="p-2 text-right font-bold text-emerald-700">{brl(Number(v?.total || 0))}</td>

                  <td className="p-2 text-center">
                    <button
                      onClick={() => setSelecionado(v)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {selecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-3">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-bold text-blue-800">Pedido</div>
                <div className="text-xs text-gray-500">
                  ID: {String(selecionado.id).slice(0, 10)} • {fmtData(pickData(selecionado))}
                </div>
              </div>
              <button
                onClick={() => setSelecionado(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                Origem: {String(selecionado?.origem || "—").toUpperCase()}
              </span>
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                Status: {String(selecionado?.status || "—").toUpperCase()}
              </span>
            </div>

            {/* Cliente */}
            <div className="mt-4 border rounded-lg p-3 bg-gray-50">
              <div className="font-semibold text-gray-800 mb-1">Cliente</div>
              <div className="text-sm text-gray-700">
                {selecionado?.cliente?.nome || selecionado?.nome || "—"}
              </div>
              {selecionado?.cliente?.telefone && (
                <div className="text-sm text-gray-600">📞 {selecionado.cliente.telefone}</div>
              )}
              {selecionado?.cliente?.endereco && (
                <div className="text-sm text-gray-600">📍 {selecionado.cliente.endereco}</div>
              )}
            </div>

            {/* Itens */}
            <div className="mt-4">
              <div className="font-semibold text-gray-800 mb-2">Itens</div>
              <div className="border rounded-lg overflow-hidden">
                {(getItensVenda(selecionado) || []).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between gap-3 px-3 py-2 border-b last:border-b-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{p?.nome}</div>
                      {p?.ean && <div className="text-xs text-gray-500">{p.ean}</div>}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-nowrap">
                      {Number(p?.qtd || 0)}x • {brl(Number(p?.preco_unit || p?.preco_venda || 0))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-right font-bold text-emerald-700">
                Total: {brl(Number(selecionado?.total || 0))}
              </div>
            </div>

            {/* Ações */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUS_OPCOES.map((s) => (
                <button
                  key={s}
                  onClick={() => atualizarStatus(selecionado.id, s)}
                  className="border rounded-lg py-2 text-sm hover:bg-gray-50"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <button
                onClick={() => setSelecionado(null)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
