// app/fv/painel/pedidos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const SENHA_PAINEL = "102030";
const LS_KEY = "fv_painel_ok";

const PEDIDOS_TABLE = "fv_pedidos";
const PAGE_LIMIT = 300;

type Pedido = {
  id: string;
  created_at?: string | null;

  cliente_nome?: string | null;
  cliente_whatsapp?: string | null;

  tipo_entrega?: string | null; // ENTREGA | RETIRADA
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;

  pagamento?: string | null; // PIX | CARTAO | DINHEIRO | COMBINAR
  taxa_entrega?: number | null;
  subtotal?: number | null;
  total?: number | null;

  status?: string | null; // NOVO | EM_ATENDIMENTO | CONFIRMADO | CANCELADO
  canal?: string | null; // SITE | WHATS | etc

  itens?: any; // jsonb
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function normalizeStatus(s?: string | null) {
  const x = (s || "").toUpperCase().trim();
  return x || "NOVO";
}

function buildResumo(p: Pedido) {
  const itens = Array.isArray(p.itens) ? p.itens : [];
  let msg = `🧾 *Pedido FV*\n`;
  msg += `🆔 ${p.id}\n`;
  msg += `📅 ${fmtDate(p.created_at)}\n\n`;

  msg += `👤 ${p.cliente_nome || "—"}\n`;
  msg += `📞 ${p.cliente_whatsapp || "—"}\n\n`;

  if ((p.tipo_entrega || "").toUpperCase() === "ENTREGA") {
    msg += `🚚 *Entrega*\n${p.endereco || "—"}, ${p.numero || "—"} - ${p.bairro || "—"}\n`;
    msg += `Taxa: ${brl(p.taxa_entrega || 0)}\n\n`;
  } else {
    msg += `🏪 *Retirada*\n\n`;
  }

  msg += `💳 Pagamento: ${p.pagamento || "—"}\n`;
  msg += `📌 Status: ${normalizeStatus(p.status)}\n\n`;

  msg += `🛒 *Itens:*\n`;
  for (const it of itens) {
    const qtd = Number(it?.qtd || 0);
    const nome = it?.nome || "—";
    const ean = it?.ean || "";
    const sub = Number(it?.subtotal ?? (Number(it?.preco || 0) * qtd) || 0);
    msg += `• ${nome}${ean ? ` (${ean})` : ""} — ${qtd}x — ${brl(sub)}\n`;
  }

  msg += `\nSubtotal: ${brl(p.subtotal || 0)}\n`;
  msg += `Total: ${brl(p.total || 0)}\n`;

  return msg;
}

export default function PainelPedidosFVPage() {
  const [ok, setOk] = useState(false);
  const [senha, setSenha] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "1";
    if (saved) setOk(true);
  }, []);

  function entrar() {
    if (senha === SENHA_PAINEL) {
      localStorage.setItem(LS_KEY, "1");
      setOk(true);
    } else {
      alert("Senha incorreta.");
    }
  }

  function sair() {
    localStorage.removeItem(LS_KEY);
    setOk(false);
    setSenha("");
  }

  if (!ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border rounded-3xl shadow-sm p-6">
          <div className="text-xl font-extrabold text-gray-900">Painel • Pedidos FV</div>
          <div className="text-sm text-gray-600 mt-1">Digite a senha para entrar.</div>

          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? entrar() : null)}
            type="password"
            placeholder="Senha"
            className="mt-4 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <button onClick={entrar} className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl py-3 font-extrabold">
            Entrar
          </button>

          <div className="mt-3 text-[11px] text-gray-500">Fica salvo neste navegador (localStorage).</div>
        </div>
      </div>
    );
  }

  return <PainelPedidosFV onSair={sair} />;
}

function PainelPedidosFV({ onSair }: { onSair: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tab, setTab] = useState<"NOVO" | "EM_ATENDIMENTO" | "CONFIRMADO" | "CANCELADO" | "TODOS">("NOVO");
  const [q, setQ] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const [sel, setSel] = useState<Pedido | null>(null);
  const [editStatus, setEditStatus] = useState<string>("NOVO");
  const [obs, setObs] = useState<string>(""); // se quiser criar coluna "obs" depois, já fica pronto

  async function carregar() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(PEDIDOS_TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_LIMIT);

      if (error) throw error;
      setPedidos(((data || []) as Pedido[]) ?? []);
    } catch (e) {
      console.error(e);
      alert("Não consegui carregar os pedidos.");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // refresh a cada 25s (leve)
  useEffect(() => {
    const t = setInterval(() => carregar(), 25000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return pedidos.filter((p) => {
      const st = normalizeStatus(p.status);

      if (tab !== "TODOS" && st !== tab) return false;

      if (!qq) return true;

      const alvo =
        `${p.id} ${p.cliente_nome || ""} ${p.cliente_whatsapp || ""} ${p.pagamento || ""} ${p.tipo_entrega || ""} ${p.bairro || ""}`.toLowerCase();

      return alvo.includes(qq);
    });
  }, [pedidos, tab, q]);

  const counts = useMemo(() => {
    const c = { NOVO: 0, EM_ATENDIMENTO: 0, CONFIRMADO: 0, CANCELADO: 0, TODOS: pedidos.length };
    for (const p of pedidos) {
      const st = normalizeStatus(p.status) as any;
      if (st in c) c[st] += 1;
    }
    return c;
  }, [pedidos]);

  function abrir(p: Pedido) {
    setSel(p);
    setEditStatus(normalizeStatus(p.status));
    setObs("");
  }

  async function salvarStatus() {
    if (!sel) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from(PEDIDOS_TABLE)
        .update({ status: editStatus })
        .eq("id", sel.id);

      if (error) throw error;

      // atualiza local
      setPedidos((prev) => prev.map((x) => (x.id === sel.id ? { ...x, status: editStatus } : x)));
      setSel((prev) => (prev ? { ...prev, status: editStatus } : prev));
    } catch (e) {
      console.error(e);
      alert("Não consegui salvar o status.");
    } finally {
      setSaving(false);
    }
  }

  async function excluirPedido() {
    if (!sel) return;
    const ok = confirm("Tem certeza que deseja excluir este pedido?");
    if (!ok) return;

    setSaving(true);
    try {
      const { error } = await supabase.from(PEDIDOS_TABLE).delete().eq("id", sel.id);
      if (error) throw error;

      setPedidos((prev) => prev.filter((x) => x.id !== sel.id));
      setSel(null);
    } catch (e) {
      console.error(e);
      alert("Não consegui excluir.");
    } finally {
      setSaving(false);
    }
  }

  function copy(text: string) {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* TOPBAR */}
      <header className="sticky top-0 z-40 bg-blue-700 shadow">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="text-white font-extrabold whitespace-nowrap">IA Drogarias • Painel FV</div>

          <div className="flex-1" />

          <button onClick={carregar} className="text-white font-extrabold bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full">
            {loading ? "Atualizando..." : "Atualizar"}
          </button>

          <button onClick={onSair} className="text-white font-extrabold bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full">
            Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[420px_1fr] gap-6">
        {/* LISTA */}
        <section className="bg-white border rounded-3xl shadow-sm p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-extrabold text-gray-900">Pedidos</div>
            <div className="text-xs text-gray-500">Limite: {PAGE_LIMIT}</div>
          </div>

          {/* Tabs */}
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["NOVO", counts.NOVO],
                ["EM_ATENDIMENTO", counts.EM_ATENDIMENTO],
                ["CONFIRMADO", counts.CONFIRMADO],
                ["CANCELADO", counts.CANCELADO],
                ["TODOS", counts.TODOS],
              ] as const
            ).map(([k, n]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-2 rounded-xl font-extrabold text-sm ${
                  tab === k ? "bg-blue-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                }`}
              >
                {k.replace("_", " ")} <span className={`${tab === k ? "text-white/80" : "text-gray-500"}`}>({n})</span>
              </button>
            ))}
          </div>

          {/* Busca */}
          <div className="mt-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, Whats, ID..."
              className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* Lista */}
          <div className="mt-4 space-y-2 max-h-[65vh] overflow-auto pr-1">
            {loading ? (
              <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">Carregando…</div>
            ) : filtrados.length === 0 ? (
              <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">Nenhum pedido.</div>
            ) : (
              filtrados.map((p) => {
                const st = normalizeStatus(p.status);
                return (
                  <button
                    key={p.id}
                    onClick={() => abrir(p)}
                    className={`w-full text-left border rounded-2xl p-3 hover:bg-gray-50 transition ${
                      sel?.id === p.id ? "border-blue-300 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-extrabold text-gray-900 truncate">
                          {p.cliente_nome || "Sem nome"} <span className="text-gray-400 font-bold">•</span>{" "}
                          <span className="text-gray-600">{p.cliente_whatsapp || "—"}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {fmtDate(p.created_at)} • {p.tipo_entrega || "—"} • {p.pagamento || "—"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-green-700">{brl(p.total || 0)}</div>
                        <div className="text-[11px] font-extrabold text-blue-900 bg-blue-100 px-2 py-1 rounded-full inline-block">
                          {st}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-gray-500 break-all">
                      ID: <span className="font-mono">{p.id}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* DETALHE */}
        <section className="bg-white border rounded-3xl shadow-sm p-5">
          {!sel ? (
            <div className="text-gray-600 bg-gray-50 border rounded-2xl p-6">
              Selecione um pedido na lista para ver os detalhes.
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-extrabold text-gray-900">{sel.cliente_nome || "Sem nome"}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Whats: <b>{sel.cliente_whatsapp || "—"}</b>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Criado: {fmtDate(sel.created_at)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ID: <span className="font-mono">{sel.id}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => copy(buildResumo(sel))}
                    className="px-4 py-2 rounded-xl border font-extrabold hover:bg-gray-50"
                  >
                    Copiar resumo
                  </button>

                  {/* opcional: abrir Whats do cliente */}
                  <a
                    href={`https://wa.me/55${onlyDigits(sel.cliente_whatsapp || "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-center"
                  >
                    Abrir Whats
                  </a>
                </div>
              </div>

              <div className="mt-5 grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 border rounded-2xl p-4">
                  <div className="text-xs text-gray-500 font-bold">ENTREGA</div>
                  <div className="mt-1 font-extrabold">{sel.tipo_entrega || "—"}</div>
                  {(sel.tipo_entrega || "").toUpperCase() === "ENTREGA" ? (
                    <div className="mt-2 text-sm text-gray-700">
                      {sel.endereco || "—"}, {sel.numero || "—"} <br />
                      {sel.bairro || "—"} <br />
                      <span className="font-extrabold">Taxa:</span> {brl(sel.taxa_entrega || 0)}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-gray-700">Retirada na loja.</div>
                  )}
                </div>

                <div className="bg-gray-50 border rounded-2xl p-4">
                  <div className="text-xs text-gray-500 font-bold">PAGAMENTO</div>
                  <div className="mt-1 font-extrabold">{sel.pagamento || "—"}</div>
                  <div className="mt-2 text-sm text-gray-700">
                    <div>Subtotal: <b>{brl(sel.subtotal || 0)}</b></div>
                    <div>Total: <b className="text-green-700">{brl(sel.total || 0)}</b></div>
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-4">
                  <div className="text-xs text-gray-500 font-bold">STATUS</div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["NOVO", "EM_ATENDIMENTO", "CONFIRMADO", "CANCELADO"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setEditStatus(s)}
                        className={`px-3 py-2 rounded-xl font-extrabold ${
                          editStatus === s ? "bg-blue-700 text-white" : "bg-gray-100 hover:bg-gray-200"
                        }`}
                        disabled={saving}
                      >
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={salvarStatus}
                      disabled={saving}
                      className="px-4 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold"
                    >
                      {saving ? "Salvando..." : "Salvar status"}
                    </button>

                    <button
                      onClick={excluirPedido}
                      disabled={saving}
                      className="px-4 py-3 rounded-2xl border font-extrabold text-red-600 hover:bg-red-50"
                    >
                      Excluir
                    </button>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Atual: <b>{normalizeStatus(sel.status)}</b>
                  </div>
                </div>
              </div>

              {/* ITENS */}
              <div className="mt-6">
                <div className="text-lg font-extrabold text-gray-900">Itens</div>

                <div className="mt-3 space-y-2">
                  {Array.isArray(sel.itens) && sel.itens.length ? (
                    sel.itens.map((it: any, idx: number) => {
                      const qtd = Number(it?.qtd || 0);
                      const nome = it?.nome || "—";
                      const ean = it?.ean || "";
                      const preco = Number(it?.preco || 0);
                      const sub = Number(it?.subtotal ?? preco * qtd);
                      return (
                        <div key={idx} className="border rounded-2xl p-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-extrabold text-gray-900">{nome}</div>
                            <div className="text-xs text-gray-500">EAN: {ean || "—"}</div>
                            <div className="text-xs text-gray-500">Preço: {brl(preco)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-extrabold">Qtd: {qtd}</div>
                            <div className="text-sm font-extrabold text-blue-900">{brl(sub)}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">Sem itens (json vazio).</div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
