"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { brl } from "@/lib/brl";

const BASE = "/autoeletrico/ninhocar";

type Comanda = {
  id: string;
  status: string;
  cliente_nome: string | null;
  cliente_whatsapp: string | null;
  subtotal: number;
  desconto: number;
  total: number;
  observacao: string | null;
  created_at: string;
  closed_at: string | null;
};

type Item = {
  id: string;
  comanda_id: string;
  produto_id: string | null;
  nome: string;
  ean: string | null;
  preco: number;
  quantidade: number;
  subtotal: number;
};

export default function CaixaNinhoCar() {
  const [loading, setLoading] = useState(true);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [finalizando, setFinalizando] = useState(false);

  const [metodo, setMetodo] = useState<"PIX" | "DINHEIRO" | "CARTAO" | "OUTROS">("PIX");
  const [valorPago, setValorPago] = useState<string>("0");
  const [troco, setTroco] = useState<string>("0");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ninhocar_comandas")
      .select("id,status,cliente_nome,cliente_whatsapp,subtotal,desconto,total,observacao,created_at,closed_at")
      .eq("status", "ABERTA")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      setComandas([]);
    } else {
      setComandas((data || []) as Comanda[]);
    }
    setLoading(false);
  }

  async function openComanda(id: string) {
    setOpenId(id);
    const { data, error } = await supabase
      .from("ninhocar_comanda_itens")
      .select("id,comanda_id,produto_id,nome,ean,preco,quantidade,subtotal")
      .eq("comanda_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error.message);
      setItens([]);
    } else {
      setItens((data || []) as Item[]);
    }

    const cmd = comandas.find((c) => c.id === id);
    if (cmd) {
      setValorPago(String(cmd.total || 0));
      setTroco("0");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const current = useMemo(() => comandas.find((c) => c.id === openId) || null, [comandas, openId]);

  async function finalizar() {
    if (!current) return;

    const v = Number((valorPago || "0").replace(",", "."));
    const t = Number((troco || "0").replace(",", "."));
    if (!v || v <= 0) {
      alert("Informe o valor pago.");
      return;
    }

    setFinalizando(true);
    try {
      const { error } = await supabase.rpc("ninhocar_finalizar_comanda", {
        p_comanda_id: current.id,
        p_metodo: metodo,
        p_valor: v,
        p_troco: t,
      });

      if (error) throw new Error(error.message);

      alert("✅ Venda finalizada e estoque baixado!");
      setOpenId(null);
      setItens([]);
      await load();
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao finalizar: ${e?.message || "erro"}`);
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href={`${BASE}/loja`} className="font-extrabold">
            ← Voltar pra Loja
          </Link>

          <div className="text-sm text-zinc-300">
            Caixa • <span className="text-yellow-300 font-extrabold">Ninho Car</span>
          </div>

          <button
            onClick={load}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
          >
            Atualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-1 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="text-lg font-extrabold">Comandas Abertas</div>
          <div className="mt-2 text-xs text-zinc-400">Clique para abrir e finalizar.</div>

          <div className="mt-4 grid gap-2">
            {loading ? (
              <div className="text-sm text-zinc-400">Carregando...</div>
            ) : comandas.length === 0 ? (
              <div className="text-sm text-zinc-400">Nenhuma comanda aberta.</div>
            ) : (
              comandas.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openComanda(c.id)}
                  className={`rounded-2xl border px-3 py-3 text-left ${
                    openId === c.id
                      ? "border-yellow-400 bg-yellow-400/10"
                      : "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-extrabold">#{c.id.slice(0, 6)}</div>
                    <div className="text-yellow-300 font-extrabold">{brl(c.total)}</div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {c.cliente_nome ? `Cliente: ${c.cliente_nome}` : "Cliente: —"} •{" "}
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-4">
          {!current ? (
            <div className="text-sm text-zinc-400">Abra uma comanda à esquerda.</div>
          ) : (
            <>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-extrabold">Comanda #{current.id.slice(0, 6)}</div>
                  <div className="text-xs text-zinc-400">
                    {current.cliente_nome ? `Cliente: ${current.cliente_nome}` : "Cliente: —"}{" "}
                    {current.observacao ? `• Obs: ${current.observacao}` : ""}
                  </div>
                </div>
                <div className="text-yellow-300 font-extrabold">{brl(current.total)}</div>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                <div className="text-sm font-extrabold">Itens</div>
                <div className="mt-2 grid gap-2">
                  {itens.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3"
                    >
                      <div>
                        <div className="text-sm font-bold">{i.nome}</div>
                        <div className="text-xs text-zinc-400">
                          {i.ean ? `EAN: ${i.ean}` : "Sem EAN"} • {i.quantidade} x {brl(i.preco)}
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-yellow-300">{brl(i.subtotal)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                  <div className="text-sm font-extrabold">Pagamento</div>

                  <label className="mt-2 block text-xs text-zinc-400">Método</label>
                  <select
                    value={metodo}
                    onChange={(e) => setMetodo(e.target.value as any)}
                    className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm"
                  >
                    <option value="PIX">PIX</option>
                    <option value="DINHEIRO">DINHEIRO</option>
                    <option value="CARTAO">CARTÃO</option>
                    <option value="OUTROS">OUTROS</option>
                  </select>

                  <label className="mt-2 block text-xs text-zinc-400">Valor pago</label>
                  <input
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm"
                    placeholder="0"
                  />

                  <label className="mt-2 block text-xs text-zinc-400">Troco (se houver)</label>
                  <input
                    value={troco}
                    onChange={(e) => setTroco(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm"
                    placeholder="0"
                  />
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                  <div className="text-sm font-extrabold">Fechamento</div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-zinc-300">Total</span>
                    <span className="font-extrabold text-yellow-300">{brl(current.total)}</span>
                  </div>

                  <button
                    onClick={finalizar}
                    disabled={finalizando}
                    className="mt-4 w-full rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-extrabold text-zinc-950 hover:brightness-110 disabled:opacity-60"
                  >
                    {finalizando ? "Finalizando..." : "Finalizar venda"}
                  </button>

                  <button
                    onClick={() => {
                      setOpenId(null);
                      setItens([]);
                    }}
                    className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm font-bold hover:bg-zinc-900"
                  >
                    Fechar comanda
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
