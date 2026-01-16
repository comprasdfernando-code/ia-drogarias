"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { brl } from "@/lib/brl";

const BASE = "/autoeletrico/ninhocar";
const WHATS = "5511948343725";

function buildWhatsAppLink(numberE164: string, msg: string) {
  const clean = numberE164.replace(/\D/g, "");
  const text = encodeURIComponent(msg);
  return `https://wa.me/${clean}?text=${text}`;
}

type Produto = {
  id: string;
  nome: string | null;
  slug: string | null;
  preco: number | null;
  preco_promocional: number | null;
  em_promocao: boolean | null;
  imagens: string[] | null;
  categoria: string | null; // ajuste se seu campo for outro
  ativo: boolean | null;
};

function getImagem(p: Produto) {
  const img = p.imagens?.[0];
  return img && img.trim().length > 0 ? img : "/placeholder-produto.png";
}

function norm(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export default function LojaNinhoCar() {
  const [tab, setTab] = useState<"conveniencia" | "servicos">("conveniencia");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      // ✅ Busca produtos ativos. Vamos filtrar conveniência no client
      // (Se preferir filtrar no Supabase, me fala como é seu campo categoria)
      const { data, error } = await supabase
        .from("produtos")
        .select(
          "id,nome,slug,preco,preco_promocional,em_promocao,imagens,categoria,ativo"
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

  const conveniencia = useMemo(() => {
    const qq = norm(q);
    return produtos
      .filter((p) => {
        // ✅ define "Conveniência" (aceita variações)
        const cat = norm(p.categoria || "");
        const isConv =
          cat.includes("conven") || cat.includes("conveni") || cat === "conv";
        if (!isConv) return false;

        if (!qq) return true;
        const blob = norm(`${p.nome || ""} ${p.categoria || ""}`);
        return blob.includes(qq);
      })
      .slice(0, 60);
  }, [produtos, q]);

  const waOrcamento = buildWhatsAppLink(
    WHATS,
    "Olá! Vim pela Loja da Ninho Car. Quero orçamento de Auto Elétrica / Som 🙂"
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header simples */}
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

          <div className="flex items-center gap-2">
            <Link
              href={`${BASE}/financeiro`}
              className="hidden sm:inline-flex rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
            >
              Financeiro
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
        </div>
      </header>

      {/* Marca d’água */}
      <div
        className="pointer-events-none fixed inset-0 bg-center bg-no-repeat opacity-[0.03]"
        style={{ backgroundImage: "url('/ninhocar/logo-bg.png')", backgroundSize: "560px" }}
      />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Loja <span className="text-yellow-400">Ninho Car</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Conveniência + acessórios rápidos, e área de serviços de Auto Elétrica / Som.
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

        {/* Conteúdo */}
        {tab === "conveniencia" ? (
          <>
            {/* Busca */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar na conveniência (café, bebidas, carregadores, lâmpadas...)"
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
                />
                <div className="mt-2 text-xs text-zinc-500">
                  Dica: marque os produtos de conveniência com categoria contendo “Conveniência”.
                </div>
              </div>

              <a
                href={buildWhatsAppLink(
                  WHATS,
                  "Olá! Quero comprar itens da conveniência da Ninho Car 🙂"
                )}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-extrabold text-zinc-950 hover:brightness-110"
              >
                Comprar pelo WhatsApp
              </a>
            </div>

            {/* Grid produtos */}
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
                  Não achei itens de conveniência ainda.
                  <div className="mt-2 text-xs text-zinc-500">
                    Cadastre produtos em <b>produtos</b> e marque <b>categoria</b> como “Conveniência”.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {conveniencia.map((p) => {
                    const preço =
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
                            {p.nome || "Produto"}
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <div className="text-sm font-extrabold text-yellow-300">
                              {brl(preço)}
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
          <>
            {/* Área Serviços */}
            <section className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-5">
                <h2 className="text-xl font-extrabold">
                  ⚡ Serviços de Auto Elétrica & Som
                </h2>
                <p className="mt-1 text-sm text-zinc-300">
                  Atendimento rápido, diagnóstico e instalação com qualidade. Peça orçamento no WhatsApp.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ServiceCard
                    title="Auto Elétrica"
                    desc="Bateria, alternador, motor de partida, iluminação, chicote e scanner."
                    badge="Diagnóstico rápido"
                  />
                  <ServiceCard
                    title="Som Automotivo"
                    desc="Instalação de player, módulos, alto-falantes, subwoofer e ajustes."
                    badge="Som forte e limpo"
                  />
                  <ServiceCard
                    title="Acessórios"
                    desc="Lâmpadas, palhetas, carregadores, suportes, tomadas e itens de carro."
                    badge="Pronta entrega"
                  />
                  <ServiceCard
                    title="Conveniência"
                    desc="Café e itens rápidos enquanto o carro é atendido."
                    badge="Parou, resolveu"
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={waOrcamento}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-extrabold text-zinc-950 hover:brightness-110"
                  >
                    Pedir orçamento no WhatsApp
                  </a>
                  <Link
                    href={`${BASE}/loja`}
                    onClick={() => setTab("conveniencia")}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
                  >
                    Ver itens da Conveniência
                  </Link>
                </div>
              </div>

              {/* Card lateral “Como funciona” */}
              <aside className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-5">
                <h3 className="text-base font-extrabold">Como funciona</h3>
                <ol className="mt-3 space-y-2 text-sm text-zinc-300">
                  <li className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                    1) Você chama no WhatsApp e manda o problema.
                  </li>
                  <li className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                    2) Fazemos diagnóstico e passamos orçamento.
                  </li>
                  <li className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                    3) Serviço feito e você resolve sua vida na conveniência.
                  </li>
                </ol>

                <div className="mt-5 rounded-2xl bg-yellow-400/10 p-4 text-xs text-yellow-200">
                  Se quiser, eu adiciono <b>agendamento</b> e <b>fila de serviços</b> (tipo senha) 🙂
                </div>
              </aside>
            </section>
          </>
        )}

        {/* Voltar */}
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

function ServiceCard({
  title,
  desc,
  badge,
}: {
  title: string;
  desc: string;
  badge: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-extrabold">{title}</h4>
        <span className="rounded-full bg-yellow-400/15 px-2 py-1 text-[11px] font-bold text-yellow-300">
          {badge}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-300">{desc}</p>
    </div>
  );
}
