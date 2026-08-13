"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, Search, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  PORTO_CART_KEY,
  PORTO_LOJA_SLUG,
  PORTO_VIEW_LOJA,
  PortoCartItem,
  PortoProduto,
  brl,
  precoPorto,
  salvarCarrinho,
} from "../_lib/porto";

function imagem(imagens?: string[] | null) {
  return imagens?.[0] || "/produtos/caixa-padrao.png";
}

export default function PortoProdutosPage() {
  const [produtos, setProdutos] = useState<PortoProduto[]>([]);
  const [cart, setCart] = useState<PortoCartItem[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PORTO_CART_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => salvarCarrinho(cart), [cart]);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      const { data, error } = await supabase
        .from(PORTO_VIEW_LOJA)
        .select("produto_id,farmacia_slug,ean,nome,laboratorio,categoria,apresentacao,imagens,pmc,estoque,preco_venda,disponivel_farmacia,em_promocao,preco_promocional,percentual_off")
        .eq("farmacia_slug", PORTO_LOJA_SLUG)
        .eq("disponivel_farmacia", true)
        .gt("estoque", 0)
        .order("nome", { ascending: true })
        .limit(500);

      if (error) console.error(error);
      setProdutos((data || []) as PortoProduto[]);
      setLoading(false);
    }
    carregar();
  }, []);

  const categorias = useMemo(() => ["Todos", ...Array.from(new Set(produtos.map(p => p.categoria || "Outros"))).sort()], [produtos]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return produtos.filter(p => {
      const catOk = categoria === "Todos" || (p.categoria || "Outros") === categoria;
      const buscaOk = !q || [p.nome, p.ean, p.laboratorio, p.apresentacao, p.categoria]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
      return catOk && buscaOk;
    });
  }, [produtos, busca, categoria]);

  const total = cart.reduce((s, i) => s + precoPorto(i) * i.qtd, 0);
  const qtdTotal = cart.reduce((s, i) => s + i.qtd, 0);

  function adicionar(p: PortoProduto) {
    setCart(old => {
      const existe = old.find(i => i.produto_id === p.produto_id);
      if (existe) return old.map(i => i.produto_id === p.produto_id ? { ...i, qtd: Math.min(i.qtd + 1, Number(p.estoque || 0)) } : i);
      return [...old, { ...p, qtd: 1 }];
    });
  }

  function alterar(id: string, delta: number) {
    setCart(old => old.map(i => i.produto_id === id ? { ...i, qtd: Math.min(Math.max(i.qtd + delta, 0), Number(i.estoque || 0)) } : i).filter(i => i.qtd > 0));
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1450px] items-center gap-3 px-4 py-3">
          <Link href="/drogariasporto" className="grid h-10 w-10 place-items-center rounded-xl border"><ArrowLeft size={19} /></Link>
          <Link href="/drogariasporto" className="hidden sm:block">
            <div className="font-black text-blue-800">DROGARIAS <span className="text-red-600">PORTO</span></div>
            <div className="text-[10px] font-bold text-slate-500">LOJA 2</div>
          </Link>
          <div className="flex flex-1 items-center rounded-xl border bg-slate-50 px-3">
            <Search size={19} className="text-red-500" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, EAN, laboratório ou apresentação..." className="w-full bg-transparent px-3 py-3 outline-none" />
          </div>
          <Link href="/drogariasporto/carrinho" className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
            <ShoppingBag className="text-red-600" size={20} />
            <div className="hidden sm:block"><b>{brl(total)}</b><small className="block text-slate-500">{qtdTotal} itens</small></div>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1450px] px-4 py-6">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-xs font-black uppercase text-red-600">Drogarias Porto • Loja 2</p><h1 className="text-3xl font-black">Produtos</h1></div>
          <span className="text-sm font-bold text-slate-500">{loading ? "Carregando..." : `${filtrados.length} produtos`}</span>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {categorias.map(c => <button key={c} onClick={() => setCategoria(c)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold ${categoria === c ? "border-red-600 bg-red-600 text-white" : "bg-white"}`}>{c}</button>)}
        </div>

        {loading ? <div className="py-20 text-center text-slate-500">Carregando produtos...</div> : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map(p => {
              const item = cart.find(i => i.produto_id === p.produto_id);
              const preco = precoPorto(p);
              return (
                <article key={p.produto_id} className="grid grid-cols-[100px_1fr] gap-3 rounded-2xl border bg-white p-3 shadow-sm">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50"><Image src={imagem(p.imagens)} alt={p.nome} fill className="object-contain p-3" unoptimized /></div>
                  <div className="min-w-0">
                    <div className="flex justify-between gap-2"><div><p className="text-[10px] font-black uppercase text-blue-700">{p.categoria || "Produto"}</p><h2 className="line-clamp-2 font-black">{p.nome}</h2></div><span className="h-fit rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">Estoque {Number(p.estoque || 0)}</span></div>
                    <div className="mt-2 text-xs text-slate-500"><p>{p.laboratorio || "—"} • {p.apresentacao || "—"}</p><p>EAN {p.ean}</p></div>
                    <div className="mt-3 flex items-end justify-between gap-3"><div>{Number(p.pmc || 0) > preco && <div className="text-xs text-slate-400 line-through">{brl(p.pmc)}</div>}<div className="text-xl font-black text-blue-800">{brl(preco)}</div></div>
                    {!item ? <button onClick={() => adicionar(p)} className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-black text-white"><Plus size={17}/>Adicionar</button> : <div className="flex items-center rounded-xl border p-1"><button onClick={() => alterar(p.produto_id, -1)} className="p-2"><Minus size={16}/></button><b className="min-w-8 text-center">{item.qtd}</b><button onClick={() => alterar(p.produto_id, 1)} className="rounded-lg bg-blue-700 p-2 text-white"><Plus size={16}/></button></div>}</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {qtdTotal > 0 && <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2"><Link href="/drogariasporto/carrinho" className="flex items-center justify-between rounded-2xl bg-red-600 px-5 py-4 font-black text-white shadow-xl"><span>Ver carrinho • {qtdTotal} itens</span><span>{brl(total)}</span></Link></div>}
    </main>
  );
}
