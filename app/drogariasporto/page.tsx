"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag, Store, Truck, UserRound, Plus, Minus, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Produto = {
  produto_id: string;
  farmacia_slug: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  imagens: string[] | null;
  pmc: number | null;
  estoque: number | null;
  preco_venda: number | null;
  disponivel_farmacia: boolean | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
};

type CartItem = Produto & { qtd: number };

const LOJA_SLUG = "drogariasporto-loja2";
const VIEW_LOJA = "fv_farmacia_produtos_view";
const CART_KEY = "PORTO_LOJA2_CART_V1";

const categorias = ["Loja toda", "Medicamentos", "Higiene e Beleza", "Mamãe e Bebê", "Vitaminas", "Cuidados Pessoais", "Dermocosméticos"];

function brl(v: number | null | undefined) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function img(imagens?: string[] | null) {
  return imagens?.[0] || "/produtos/caixa-padrao.png";
}

function valorProduto(p: Produto) {
  const loja = Number(p.preco_venda || 0);
  if (loja > 0) return loja;
  if (p.em_promocao && Number(p.preco_promocional || 0) > 0) return Number(p.preco_promocional || 0);
  return Number(p.pmc || 0);
}

export default function DrogariasPortoHome() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Loja toda");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      const { data, error } = await supabase
        .from(VIEW_LOJA)
        .select("produto_id,farmacia_slug,ean,nome,laboratorio,categoria,apresentacao,imagens,pmc,estoque,preco_venda,disponivel_farmacia,em_promocao,preco_promocional,percentual_off")
        .eq("farmacia_slug", LOJA_SLUG)
        .eq("disponivel_farmacia", true)
        .gt("estoque", 0)
        .order("em_promocao", { ascending: false })
        .order("nome", { ascending: true })
        .limit(180);

      if (error) console.error("Porto load:", error);
      setProdutos((data || []) as Produto[]);
      setLoading(false);
    }
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const bateCategoria = categoria === "Loja toda" || (p.categoria || "").toLowerCase().includes(categoria.toLowerCase());
      const bateBusca = !q || [p.nome, p.ean, p.laboratorio, p.apresentacao].filter(Boolean).some((x) => String(x).toLowerCase().includes(q));
      return bateCategoria && bateBusca;
    });
  }, [produtos, busca, categoria]);

  const destaques = filtrados.slice(0, 10);
  const total = cart.reduce((s, i) => s + valorProduto(i) * i.qtd, 0);
  const qtd = cart.reduce((s, i) => s + i.qtd, 0);

  function add(p: Produto) {
    setCart((old) => {
      const found = old.find((x) => x.produto_id === p.produto_id);
      if (found) return old.map((x) => x.produto_id === p.produto_id ? { ...x, qtd: Math.min(x.qtd + 1, Number(p.estoque || 0)) } : x);
      return [...old, { ...p, qtd: 1 }];
    });
  }

  function change(id: string, delta: number) {
    setCart((old) => old.map((x) => x.produto_id === id ? { ...x, qtd: x.qtd + delta } : x).filter((x) => x.qtd > 0));
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1450px] items-center gap-4 px-4 py-3">
          <div className="min-w-fit">
            <div className="text-xl font-black tracking-tight text-blue-800">DROGARIAS <span className="text-red-600">PORTO</span></div>
            <div className="text-[11px] font-bold text-slate-500">LOJA 2</div>
          </div>
          <div className="hidden flex-1 items-center rounded-xl border bg-slate-50 px-4 md:flex">
            <Search size={20} className="text-red-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busque nesta loja por produto, EAN ou laboratório" className="w-full bg-transparent px-3 py-3 outline-none" />
          </div>
          <Link href="/drogariasporto/pdv" className="hidden rounded-xl border px-3 py-2 text-sm font-bold md:block">PDV</Link>
          <Link href="/drogariasporto/caixa" className="hidden rounded-xl border px-3 py-2 text-sm font-bold md:block">Caixa</Link>
          <button className="rounded-xl p-2"><UserRound /></button>
          <Link href="/drogariasporto/carrinho" className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <ShoppingBag className="text-red-500" />
            <span className="hidden sm:block"><b>{brl(total)}</b><small className="block text-slate-500">{qtd} itens</small></span>
          </Link>
        </div>
        <div className="mx-auto max-w-[1450px] px-4 pb-3 md:hidden">
          <div className="flex items-center rounded-xl border bg-slate-50 px-4"><Search size={19} className="text-red-500" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto ou EAN" className="w-full bg-transparent px-3 py-3 outline-none" /></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1450px] gap-6 px-4 py-8 lg:grid-cols-[310px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-full bg-blue-800 text-white"><Store /></div><div><h1 className="font-black">Drogarias Porto - Loja 2</h1><p className="text-sm text-slate-500">Sua farmácia do bairro</p></div></div>
            <div className="mt-5 rounded-xl border p-4 text-sm"><div className="flex items-center gap-2 font-bold"><Truck size={18} /> Entrega ou retirada</div><p className="mt-1 text-slate-500">Consulte disponibilidade no fechamento do pedido.</p></div>
            <nav className="mt-6 space-y-1">
              {categorias.map((c) => <button key={c} onClick={() => setCategoria(c)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left ${categoria === c ? "bg-red-50 font-bold text-red-600" : "hover:bg-slate-50"}`}><span>{c}</span><ChevronRight size={16} /></button>)}
            </nav>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-100">Drogarias Porto • Loja 2</p>
            <h2 className="mt-1 text-2xl font-black md:text-3xl">Preço bom, compra rápida e entrega perto de você.</h2>
            <p className="mt-2 max-w-2xl text-blue-100">Catálogo integrado ao estoque da loja e preparado para o FV Marketplace.</p>
          </div>

          <div className="mt-8 flex items-end justify-between"><div><p className="text-sm font-bold text-red-600">DESTAQUES</p><h2 className="text-2xl font-black">Ofertas da Porto</h2></div><Link href="/drogariasporto/produtos" className="font-bold text-red-600 hover:underline">Ver todas</Link></div>

          {loading ? <div className="py-16 text-center text-slate-500">Carregando produtos...</div> : filtrados.length === 0 ? <div className="mt-6 rounded-2xl border p-10 text-center"><p className="font-bold">Nenhum produto disponível ainda.</p><p className="mt-1 text-sm text-slate-500">Depois de executar o SQL da Porto e vincular produtos à Loja 2, eles aparecerão aqui automaticamente.</p></div> : (
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {destaques.map((p) => {
                const cartItem = cart.find((x) => x.produto_id === p.produto_id);
                return <article key={p.produto_id} className="group rounded-2xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50"><Image src={img(p.imagens)} alt={p.nome} fill className="object-contain p-4" unoptimized />{Number(p.percentual_off || 0) > 0 && <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-1 text-xs font-black text-white">-{Math.round(Number(p.percentual_off))}%</span>}</div>
                  <div className="mt-3 min-h-[105px]"><p className="text-lg font-black text-green-700">{brl(valorProduto(p))}</p><h3 className="line-clamp-2 font-bold leading-tight">{p.nome}</h3><p className="mt-1 line-clamp-1 text-xs text-slate-500">{p.apresentacao || p.laboratorio || "Produto farmacêutico"}</p><p className="mt-1 text-[10px] text-slate-400">EAN {p.ean}</p></div>
                  {!cartItem ? <button onClick={() => add(p)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 font-black text-white hover:bg-red-700"><Plus size={18}/> Adicionar</button> : <div className="mt-3 flex items-center justify-between rounded-xl border p-1"><button onClick={() => change(p.produto_id,-1)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100"><Minus size={17}/></button><b>{cartItem.qtd}</b><button onClick={() => change(p.produto_id,1)} className="grid h-9 w-9 place-items-center rounded-lg bg-red-600 text-white"><Plus size={17}/></button></div>}
                </article>;
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
