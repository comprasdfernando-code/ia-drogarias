// app/fv/painel/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

/* =========================
   CONFIG
========================= */
const SENHA_PAINEL = "102030";
const LS_KEY = "fv_painel_ok";
const PEDIDOS_TABLE = "fv_pedidos";

// (opcional) botão de WhatsApp no detalhe
const WHATS = "5511948343725";

/* =========================
   TYPES
========================= */
type Pedido = {
  id: string;
  created_at?: string;
  cliente_nome?: string | null;
  cliente_whatsapp?: string | null;

  tipo_entrega?: string | null;
  pagamento?: string | null;

  taxa_entrega?: number | null;
  subtotal?: number | null;
  total?: number | null;

  status?: string | null;
  itens?: any; // json
};

/* =========================
   HELPERS
========================= */
function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function waLink(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

function normalizeStatus(s?: string | null) {
  const v = (s || "NOVO").toUpperCase();
  if (v === "NOVO") return "NOVO";
  if (v === "EM_SEPARACAO" || v === "SEPARANDO") return "EM SEPARAÇÃO";
  if (v === "CONFIRMADO") return "CONFIRMADO";
  if (v === "ENTREGUE") return "ENTREGUE";
  if (v === "CANCELADO") return "CANCELADO";
  return v;
}

function parseItens(raw: any): Array<any> {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const j = JSON.parse(raw);
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }
  return [];
}

function fmtData(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function buildResumo(p: Pedido) {
  const itens = parseItens(p.itens);

  let msg = `🧾 *Pedido FV* (${p.id})\n\n`;
  msg += `🕒 ${fmtData(p.created_at)}\n`;
  msg += `👤 Cliente: ${p.cliente_nome || "—"}\n`;
  msg += `📞 Whats: ${p.cliente_whatsapp || "—"}\n`;
  msg += `🚚 Entrega: ${p.tipo_entrega || "—"}\n`;
  msg += `💳 Pagamento: ${p.pagamento || "—"}\n`;
  msg += `🏷️ Status: ${normalizeStatus(p.status)}\n\n`;

  msg += `🛒 *Itens:*\n`;
  for (const it of itens) {
    const qtd = Number(it?.qtd ?? 0);
    const nome = it?.nome || "—";
    const ean = it?.ean || "";
    // ✅ CORRIGIDO (sem misturar ?? com ||)
    const sub = Number(it?.subtotal ?? (Number(it?.preco ?? 0) * qtd));
    msg += `• ${nome}${ean ? ` (${ean})` : ""} — ${qtd}x — ${brl(sub)}\n`;
  }

  msg += `\nSubtotal: ${brl(p.subtotal || 0)}\n`;
  msg += `Taxa: ${brl(p.taxa_entrega || 0)}\n`;
  msg += `Total: ${brl(p.total || 0)}\n`;

  return msg;
}

/* =========================
   PAGE
========================= */
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

  return <Painel onSair={sair} />;
}

function Painel({ onSair }: { onSair: () => void }) {
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("TODOS");

  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Pedido | null>(null);

  async function load() {
    setLoading(true);
    try {
      // ✅ select("*") evita quebrar se colunas mudarem
      const { data, error } = await supabase
        .from(PEDIDOS_TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setPedidos((data || []) as Pedido[]);
    } catch (e) {
      console.error("Erro carregando pedidos:", e);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return pedidos.filter((p) => {
      const st = (p.status || "NOVO").toUpperCase();
      if (status !== "TODOS" && st !== status) return false;

      if (!qq) return true;
      const nome = (p.cliente_nome || "").toLowerCase();
      const wpp = (p.cliente_whatsapp || "").toLowerCase();
      const id = (p.id || "").toLowerCase();
      return nome.includes(qq) || wpp.includes(qq) || id.includes(qq);
    });
  }, [pedidos, q, status]);

  const contagem = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pedidos) {
      const st = (p.status || "NOVO").toUpperCase();
      map.set(st, (map.get(st) || 0) + 1);
    }
    return map;
  }, [pedidos]);

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <header className="sticky top-0 z-40 bg-blue-700 shadow">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="text-white font-extrabold whitespace-nowrap">IA Drogarias • Painel FV</div>

          <div className="flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por cliente, Whats ou ID..."
              className="w-full rounded-full bg-white/95 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-white/20"
            />
          </div>

          <button onClick={load} className="text-white font-extrabold bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full">
            Atualizar
          </button>

          <button onClick={onSair} className="text-white font-extrabold bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full">
            Sair
          </button>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-3 flex flex-wrap gap-2">
          {[
            ["TODOS", "Todos"],
            ["NOVO", `NOVO (${contagem.get("NOVO") || 0})`],
            ["CONFIRMADO", `CONFIRMADO (${contagem.get("CONFIRMADO") || 0})`],
            ["ENTREGUE", `ENTREGUE (${contagem.get("ENTREGUE") || 0})`],
            ["CANCELADO", `CANCELADO (${contagem.get("CANCELADO") || 0})`],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setStatus(k)}
              className={`px-3 py-2 rounded-full text-xs font-extrabold ${
                status === k ? "bg-green-400 text-blue-950" : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-white border rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-extrabold text-gray-900">
              Pedidos <span className="text-gray-500">({filtrados.length})</span>
            </div>
            <div className="text-xs text-gray-500">Mostrando até 500</div>
          </div>

          {loading ? (
            <div className="mt-4 text-gray-600">Carregando…</div>
          ) : filtrados.length === 0 ? (
            <div className="mt-4 text-gray-600">Nenhum pedido encontrado.</div>
          ) : (
            <div className="mt-4 space-y-2">
              {filtrados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSel(p);
                    setOpen(true);
                  }}
                  className="w-full text-left border rounded-2xl p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-extrabold text-gray-900 line-clamp-1">
                        {p.cliente_nome || "Sem nome"} <span className="text-gray-400 font-bold">•</span>{" "}
                        <span className="text-gray-600 font-bold">{p.cliente_whatsapp || "—"}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: <span className="font-mono">{p.id}</span> • {fmtData(p.created_at)}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-green-700">{brl(p.total || 0)}</div>
                      <div className="text-xs font-extrabold text-blue-900">{normalizeStatus(p.status)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {open && sel ? (
        <Detalhe
          p={sel}
          onClose={() => {
            setOpen(false);
            setSel(null);
          }}
        />
      ) : null}
    </main>
  );
}

function Detalhe({ p, onClose }: { p: Pedido; onClose: () => void }) {
  const itens = parseItens(p.itens);
  const resumo = useMemo(() => buildResumo(p), [p]);

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-extrabold">Pedido • {p.id}</div>
          <button onClick={onClose} className="px-3 py-2 rounded-xl border font-extrabold bg-white hover:bg-gray-50">
            Fechar
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <div className="bg-gray-50 border rounded-2xl p-4">
            <div className="text-xs text-gray-500">Criado em</div>
            <div className="font-extrabold">{fmtData(p.created_at)}</div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-gray-500">Cliente</div>
                <div className="font-extrabold">{p.cliente_nome || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Whats</div>
                <div className="font-extrabold">{p.cliente_whatsapp || "—"}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Entrega</div>
                <div className="font-extrabold">{p.tipo_entrega || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Pagamento</div>
                <div className="font-extrabold">{p.pagamento || "—"}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Status</div>
                <div className="font-extrabold text-blue-900">{normalizeStatus(p.status)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="font-extrabold text-green-700">{brl(p.total || 0)}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white border rounded-2xl p-4">
            <div className="font-extrabold">Itens</div>

            {itens.length === 0 ? (
              <div className="mt-2 text-sm text-gray-600">Sem itens no JSON.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {itens.map((it: any, idx: number) => {
                  const qtd = Number(it?.qtd ?? 0);
                  const sub = Number(it?.subtotal ?? (Number(it?.preco ?? 0) * qtd));
                  return (
                    <div key={idx} className="border rounded-xl p-3">
                      <div className="font-extrabold text-sm">{it?.nome || "—"}</div>
                      <div className="text-xs text-gray-500">EAN: {it?.ean || "—"}</div>
                      <div className="mt-1 text-sm font-extrabold text-blue-900">
                        {qtd}x • {brl(sub)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-extrabold">{brl(p.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Taxa</span>
                <span className="font-extrabold">{brl(p.taxa_entrega || 0)}</span>
              </div>
              <div className="flex justify-between mt-2 text-base">
                <span className="font-extrabold">Total</span>
                <span className="font-extrabold text-green-700">{brl(p.total || 0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(resumo);
                  alert("Resumo copiado ✅");
                } catch {
                  alert("Não consegui copiar.");
                }
              }}
              className="w-full rounded-xl border py-3 font-extrabold hover:bg-gray-50"
            >
              Copiar resumo
            </button>

            <button
              onClick={() => {
                const msg = resumo;
                window.open(waLink(WHATS, msg), "_blank", "noopener,noreferrer");
              }}
              className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white py-3 font-extrabold"
            >
              Enviar no WhatsApp (opcional)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
