"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import HeaderPremium from "../_components/HeaderPremium";

type Produto = {
  id: string;
  created_at: string;
  nome: string;
  marca: string | null;
  ean: string | null;
  codigo_interno: string | null;
  preco: number;
  preco_promocional: number | null;
  promo_ativa: boolean;
  quantidade: number;
  ativo: boolean;
  foto_url: string | null;
};

function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminProdutos() {
  const [q, setQ] = useState("");
  const [itens, setItens] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("mk_produtos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    setItens((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return itens;
    return itens.filter((p) => {
      const nome = (p.nome || "").toLowerCase();
      const marca = (p.marca || "").toLowerCase();
      const ean = (p.ean || "").toLowerCase();
      const cod = (p.codigo_interno || "").toLowerCase();
      return nome.includes(s) || marca.includes(s) || ean.includes(s) || cod.includes(s);
    });
  }, [q, itens]);

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from("mk_produtos").update({ ativo: !ativo }).eq("id", id);
    load();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderPremium />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Admin • Produtos</h1>
            <p className="text-white/70">Cadastrar/editar produtos, estoque, preço, promo e foto.</p>
          </div>

          <Link
            href="/loja/glow10/admin/produtos/novo"
            className="rounded-2xl bg-white px-4 py-3 font-semibold text-black"
          >
            + Novo produto
          </Link>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, marca, EAN ou código interno…"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-white/30"
          />
          <button
            onClick={load}
            className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 hover:bg-white/15"
          >
            Atualizar
          </button>
        </div>

        <div className="mt-3 text-sm text-white/60">{loading ? "Carregando…" : `${filtrados.length} produto(s)`}</div>

        <div className="mt-6 space-y-3">
          {filtrados.map((p) => (
            <div key={p.id} className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-white/60">
                    {p.ean ? `EAN: ${p.ean}` : `Cód. interno: ${p.codigo_interno || "—"}`}
                  </div>
                  <div className="mt-1 text-lg font-semibold line-clamp-1">{p.nome}</div>
                  <div className="text-white/70 text-sm">{p.marca || "—"}</div>
                  <div className="mt-2 text-sm text-white/70">
                    Estoque: <span className="text-white">{p.quantidade}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-white/60">Preço</div>
                  <div className="text-xl font-bold">{brl(p.preco)}</div>
                  {p.promo_ativa && p.preco_promocional ? (
                    <div className="text-sm text-white/70">
                      Promo: <span className="font-semibold">{brl(p.preco_promocional)}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-white/50">Promo: —</div>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Link
                      href={`/loja/glow10/admin/produtos/${p.id}`}
                      className="rounded-2xl bg-white px-4 py-2 font-semibold text-black"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => toggleAtivo(p.id, p.ativo)}
                      className="rounded-2xl bg-white/10 px-4 py-2 ring-1 ring-white/10 hover:bg-white/15"
                    >
                      {p.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!loading && filtrados.length === 0 && <div className="text-white/70">Nenhum produto.</div>}
        </div>
      </div>
    </div>
  );
}
