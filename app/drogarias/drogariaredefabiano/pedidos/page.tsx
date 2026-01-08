"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOJA_SLUG = "drogariaredefabiano";
const SENHA_ADMIN = "102030";

function brl(n: number) {
  return (Number(n || 0)).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type VendaRow = any;

export default function PedidosDrogariaRedeFabianoPage() {
  // 🔐 login simples
  const [aut, setAut] = useState(false);
  const [senha, setSenha] = useState("");

  // filtros/listagem
  const [tab, setTab] = useState<"PENDENTE" | "FINALIZADA" | "TODOS">("PENDENTE");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<VendaRow[]>([]);
  const [sel, setSel] = useState<VendaRow | null>(null);

  function entrar() {
    if (senha === SENHA_ADMIN) {
      setAut(true);
      setSenha("");
    } else {
      alert("Senha incorreta!");
    }
  }

  async function carregar() {
    setLoading(true);
    try {
      let qb = supabase
        .from("vendas")
        .select("*")
        .eq("loja_slug", LOJA_SLUG)
        .order("created_at", { ascending: false })
        .limit(500);

      if (tab !== "TODOS") qb = qb.eq("status", tab);

      const { data, error } = await qb;
      if (error) throw error;

      setRows(data || []);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (aut) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aut, tab]);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;

    return rows.filter((r) => {
      const itens = JSON.stringify(r.itens || []).toLowerCase();
      const cliente = JSON.stringify(r.cliente || {}).toLowerCase();
      const id = String(r.id || "").toLowerCase();
      return itens.includes(t) || cliente.includes(t) || id.includes(t);
    });
  }, [rows, q]);

  // 🧾 Comanda / separação
  function imprimirComanda(v: any) {
    const win = window.open("", "_blank");
    if (!win) return;

    const data = new Date(v.created_at || new Date().toISOString()).toLocaleDateString("pt-BR");
    const hora = new Date(v.created_at || new Date().toISOString()).toLocaleTimeString("pt-BR");

    win.document.write(`
      <html>
        <head>
          <title>Comanda - Drogaria Rede Fabiano</title>
          <style>
            body { font-family: "Courier New", monospace; width: 58mm; margin: 0 auto; padding: 6px; font-size: 12px; }
            .t { text-align:center; font-weight:700; }
            .l { border-top: 1px dashed #777; margin: 6px 0; }
            .row { display:flex; justify-content:space-between; gap:8px; }
            .muted { color:#555; font-size:11px; }
            .total { text-align:right; font-weight:700; margin-top:6px; }
          </style>
        </head>
        <body>
          <div class="t">💊 Drogaria Rede Fabiano</div>
          <div class="t muted">COMANDA / SEPARAÇÃO</div>
          <div class="l"></div>
          <div class="muted">
            <div>Data: ${data} ${hora}</div>
            <div>Origem: ${v.origem}</div>
            <div>Status: ${v.status}</div>
            <div>ID: ${String(v.id).slice(0, 8)}</div>
            ${v.cliente?.nome ? `<div>Cliente: ${v.cliente.nome}</div>` : ""}
            ${v.cliente?.telefone ? `<div>Tel: ${v.cliente.telefone}</div>` : ""}
            ${v.cliente?.endereco ? `<div>End: ${v.cliente.endereco}</div>` : ""}
          </div>
          <div class="l"></div>

          ${(v.itens || [])
            .map(
              (p: any) => `
                <div class="row">
                  <span>${p.qtd}x ${String(p.nome).slice(0, 22)}</span>
                  <span></span>
                </div>
                <div class="muted">${p.ean || ""}</div>
              `
            )
            .join("")}

          <div class="l"></div>
          <div class="total">Total: ${brl(Number(v.total || 0))}</div>
          <div class="l"></div>
          <div class="t muted">IA Drogarias • Saúde com Inteligência</div>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
  }

  // 📉 baixa estoque na fv_loja_produtos
  async function baixarEstoque(itens: any[]) {
    for (const item of itens || []) {
      const produto_id = item.produto_id;
      const qtd = Number(item.qtd || 0);

      if (!produto_id || qtd <= 0) continue;

      const { data: lp, error: e1 } = await supabase
        .from("fv_loja_produtos")
        .select("estoque")
        .eq("loja_slug", LOJA_SLUG)
        .eq("produto_id", produto_id)
        .maybeSingle();

      if (e1) {
        console.warn("Erro buscar estoque:", e1);
        continue;
      }
      if (!lp) {
        console.warn("Produto não existe em fv_loja_produtos:", produto_id);
        continue;
      }

      const novo = Math.max(0, Number(lp.estoque || 0) - qtd);

      const { error: e2 } = await supabase
        .from("fv_loja_produtos")
        .update({ estoque: novo })
        .eq("loja_slug", LOJA_SLUG)
        .eq("produto_id", produto_id);

      if (e2) console.warn("Erro baixar estoque:", e2);
    }
  }

  // ✅ Dar baixa (SITE pendente -> FINALIZADA + baixa estoque)
  async function darBaixa(v: any) {
    try {
      if (v.status === "FINALIZADA") return;

      // só baixa estoque se tiver itens com produto_id
      const itens = v.itens || [];
      const temProdutoId = itens.some((x: any) => !!x.produto_id);
      if (!temProdutoId) {
        alert("Esse pedido não tem produto_id nos itens. Não dá pra baixar estoque.");
        return;
      }

      await baixarEstoque(itens);

      const { error } = await supabase
        .from("vendas")
        .update({
          status: "FINALIZADA",
          finalizada_em: new Date().toISOString(),
        })
        .eq("id", v.id);

      if (error) throw error;

      alert("✅ Pedido baixado e finalizado!");
      setSel(null);
      await carregar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao dar baixa.");
    }
  }

  if (!aut) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white border rounded-2xl shadow p-6 w-full max-w-sm">
          <h1 className="text-xl font-extrabold text-blue-700 mb-3">
            Pedidos — Drogaria Rede Fabiano
          </h1>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            className="w-full border rounded-xl px-3 py-2"
          />
          <button
            onClick={entrar}
            className="mt-3 w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-2 font-bold"
          >
            Entrar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-2xl font-extrabold text-blue-950">
            📦 Pedidos (SITE + PDV) — Drogaria Rede Fabiano
          </h1>
          <button
            onClick={carregar}
            className="px-4 py-2 rounded-xl bg-blue-700 text-white font-extrabold"
          >
            Atualizar
          </button>
        </div>

        <div className="mt-4 bg-white border rounded-2xl p-4 flex gap-2 flex-wrap items-center">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value as any)}
            className="border rounded-xl px-3 py-2"
          >
            <option value="PENDENTE">Pendentes</option>
            <option value="FINALIZADA">Finalizadas</option>
            <option value="TODOS">Todas</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por produto / cliente / id..."
            className="flex-1 border rounded-xl px-3 py-2 min-w-[240px]"
          />

          <div className="text-sm text-gray-600">
            Total: <b>{filtrados.length}</b>
          </div>
        </div>

        <div className="mt-4 bg-white border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-gray-600">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="p-6 text-gray-600">Nada encontrado.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left">
                  <th className="p-3">Data</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3">
                      {r.origem === "SITE" ? (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                          🌐 SITE
                        </span>
                      ) : (
                        <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">
                          🏪 PDV
                        </span>
                      )}
                    </td>
                    <td className="p-3">{r.status}</td>
                    <td className="p-3">
                      {r.cliente?.nome ? r.cliente.nome : "—"}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {brl(Number(r.total || 0))}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSel(r)}
                        className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal detalhes */}
        {sel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-extrabold text-blue-950">
                    Detalhes do Pedido
                  </div>
                  <div className="text-xs text-gray-500">
                    {sel.origem} • {sel.status} • {String(sel.id).slice(0, 8)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(sel.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>
                <button
                  onClick={() => setSel(null)}
                  className="text-gray-500 text-xl"
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>

              {/* Cliente */}
              {sel.cliente && (
                <div className="mt-3 bg-gray-50 border rounded-xl p-3 text-sm">
                  <div className="font-bold text-gray-800 mb-1">Cliente</div>
                  <div>Nome: {sel.cliente?.nome || "—"}</div>
                  <div>Telefone: {sel.cliente?.telefone || "—"}</div>
                  <div>Endereço: {sel.cliente?.endereco || "—"}</div>
                </div>
              )}

              {/* Itens */}
              <div className="mt-3 border-t pt-3">
                {(sel.itens || []).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>
                      {p.qtd}x {p.nome}
                      <span className="text-xs text-gray-400">
                        {p.ean ? ` • ${p.ean}` : ""}
                      </span>
                    </span>
                    <span>
                      {brl(Number(p.preco_unit || p.preco_venda || 0) * Number(p.qtd || 0))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-right font-extrabold text-emerald-700">
                Total: {brl(Number(sel.total || 0))}
              </div>

              {/* Ações */}
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => imprimirComanda(sel)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-extrabold"
                >
                  🧾 Reimprimir Comanda
                </button>

                {sel.origem === "SITE" && sel.status !== "FINALIZADA" && (
                  <button
                    onClick={() => darBaixa(sel)}
                    className="w-full bg-blue-800 hover:bg-blue-900 text-white py-2 rounded-xl font-extrabold"
                  >
                    ✅ Dar baixa (baixar estoque e finalizar)
                  </button>
                )}

                <button
                  onClick={() => setSel(null)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-xl font-bold"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                * PDV já nasce FINALIZADA. SITE nasce PENDENTE e você dá baixa aqui.
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
