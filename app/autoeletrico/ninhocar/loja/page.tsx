"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { brl } from "@/lib/brl";

/** =========================
 *  CONFIG
========================= */
const BASE = "/ninhocar";
const WHATS = "5511948343725";

function buildWhatsAppLink(numberE164: string, msg: string) {
  const clean = numberE164.replace(/\D/g, "");
  const text = encodeURIComponent(msg);
  return `https://wa.me/${clean}?text=${text}`;
}

/** =========================
 *  TYPES
========================= */
type Produto = {
  id: string;
  nome: string | null;
  slug: string | null;
  ean: string | null; // ✅ agora usado
  preco: number | null;
  preco_promocional: number | null;
  em_promocao: boolean | null;
  imagens: string[] | null;
  categoria: string | null;
  ativo: boolean | null;
};

/** =========================
 *  HELPERS
========================= */
function getImagem(p: Produto) {
  const img = p.imagens?.[0];
  return img && img.trim().length > 0 ? img : "/placeholder-produto.png";
}

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

/** =========================
 *  PAGE
========================= */
export default function LojaNinhoCar() {
  const [tab, setTab] = useState<"conveniencia" | "servicos">("conveniencia");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("produtos")
        .select(
          "id,nome,slug,ean,preco,preco_promocional,em_promocao,imagens,categoria,ativo"
        )
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (!mounted) return;

      if (error) {
        console.error("Erro ao carregar produtos:", error.message);
        setProdutos([]);
      } else {
        setProdutos((data || []) as Produto[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  /** =========================
   *  FILTRO CONVENIÊNCIA
  ========================= */
  const conveniencia = useMemo(() => {
    const qq = norm(q);
    const qDigits = onlyDigits(q);

    return produtos
      .filter((p) => {
        // somente conveniência
        const cat = norm(p.categoria || "");
        const isConv =
          cat.includes("conven") || cat.includes("conveni") || cat === "conv";
        if (!isConv) return false;

        // sem busca
        if (!qq && !qDigits) return true;

        // texto
        const blob = norm(`${p.nome || ""} ${p.categoria || ""}`);

        // ean
        const eanDigits = onlyDigits(p.ean || "");

        return (
          (qq && blob.includes(qq)) ||
          (qDigits && eanDigits.includes(qDigits))
        );
      })
      .slice(0, 60);
  }, [produtos, q]);

  const waOrcamento = buildWhatsAppLink(
    WHATS,
    "Olá! Vim pela Loja da Ninho Car. Quero orçamento de Auto Elétrica / Som 🙂"
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* HEADER */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href={`${BASE}`} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-400 text-zinc-950 font-black flex items-center justify-center">
              NC
            </div>
            <div className="leading-tight">
              <div className="font-extrabold tracking-wide">
                NINHO <span className="text-yellow-400">CAR</span>
              </div>
              <div className="text-xs text-zinc-400">Loja & Serviços</div>
            </div>
          </Link>

          <a
            href={waOrcamento}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-yellow-400 px-3 py-2 text-sm font-extrabold text-zinc-950 hover:brightness-110"
          >
            WhatsApp
          </a>
        </div>
      </header>

      {/* MARCA D’ÁGUA */}
      <div
        className="pointer-events-none fixed inset-0 bg-center bg-no-repeat opacity-[0.03]"
        style={{
          backgroundImage: "url('/ninhocar/logo-bg.png')",
          backgroundSize: "560px",
        }}
      />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* TOPO */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Loja <span className="text-yellow-400">Ninho Car</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Conveniência + Auto Elétrica & Som
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTab("conveniencia")}
              className={`rounded-2xl px-4 py-2 text-sm font-extrabold border ${
                tab === "conveniencia"
                  ? "bg-yellow-400 text-zinc-950 border-yellow-300"
                  : "bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              🛒 Conveniência
            </button>

            <button
              onClick={() => setTab("servicos")}
              className={`rounded-2xl px-4 py-2 text-sm font-extrabold border ${
                tab === "servicos"
                  ? "bg-yellow-400 text-zinc-950 border-yellow-300"
                  : "bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              ⚡ Serviços
            </button>
          </div>
        </div>

        {/* CONTEÚDO */}
        {tab === "conveniencia" ? (
          <>
            {/* BUSCA */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nome ou EAN (código de barras)"
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
                />
                <div className="mt-2 text-xs text-zinc-500">
                  Dica: cole ou digite o <b>EAN</b> para achar o produto na hora.
                </div>
              </div>
            </div>

            {/* GRID */}
            <div className="mt-6">
              {loading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-44 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse"
                    />
                  ))}
                </div>
              ) : conveniencia.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-sm text-zinc-300">
                  Nenhum item encontrado.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {conveniencia.map((p) => {
                    const precoFinal =
                      p.em_promocao && p.preco_promocional
                        ? p.preco_promocional
                        : p.preco;

                    const href = p.slug
                      ? `${BASE}/loja/produto/${p.slug}`
                      : `${BASE}/loja`;

                    return (
                      <Link
                        key={p.id}
                        href={href}
                        className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 hover:bg-zinc-900"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                          <Image
                            src={getImagem(p)}
                            alt={p.nome || "Produto"}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>

                        <div className="mt-3">
                          <div className="line-clamp-2 text-sm font-bold">
                            {p.nome}
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <div className="text-sm font-extrabold text-yellow-300">
                              {brl(precoFinal)}
                            </div>
                            {p.em_promocao && p.preco ? (
                              <div className="text-xs text-zinc-400 line-through">
                                {brl(p.preco)}
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-3 rounded-xl bg-yellow-400 px-3 py-2 text-center text-xs font-extrabold text-zinc-950">
                            Ver detalhes
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-8 text-sm text-zinc-300">
            Área de serviços permanece igual à atual.
          </div>
        )}

        <div className="mt-10">
          <Link
            href={`${BASE}`}
            className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
          >
            ← Voltar para Home
          </Link>
        </div>
      </main>
    </div>
  );
}
