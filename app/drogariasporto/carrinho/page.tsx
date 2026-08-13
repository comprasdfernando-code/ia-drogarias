"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { PORTO_CART_KEY, PortoCartItem, brl, precoPorto, salvarCarrinho } from "../_lib/porto";

export default function PortoCarrinhoPage() {
  const [cart, setCart] = useState<PortoCartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PORTO_CART_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => salvarCarrinho(cart), [cart]);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + precoPorto(i) * i.qtd, 0), [cart]);

  function mudar(id: string, delta: number) {
    setCart(old => old.map(i => i.produto_id === id ? { ...i, qtd: Math.min(Math.max(i.qtd + delta, 0), Number(i.estoque || 0)) } : i).filter(i => i.qtd > 0));
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3"><Link href="/drogariasporto/produtos" className="rounded-xl border p-2"><ArrowLeft/></Link><div><p className="text-xs font-black text-red-600">DROGARIAS PORTO • LOJA 2</p><h1 className="text-2xl font-black">Carrinho</h1></div></div>
          <ShoppingBag className="text-red-600" />
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="space-y-3">
            {cart.length === 0 ? <div className="rounded-2xl bg-white p-12 text-center shadow-sm"><h2 className="text-xl font-black">Seu carrinho está vazio</h2><Link href="/drogariasporto/produtos" className="mt-4 inline-block rounded-xl bg-blue-700 px-5 py-3 font-black text-white">Ver produtos</Link></div> : cart.map(i => (
              <article key={i.produto_id} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="min-w-0"><h2 className="font-black">{i.nome}</h2><p className="text-xs text-slate-500">{i.apresentacao || i.laboratorio || ""} • EAN {i.ean}</p><p className="mt-1 font-black text-blue-800">{brl(precoPorto(i))}</p></div>
                <div className="flex items-center gap-2"><div className="flex items-center rounded-xl border"><button onClick={() => mudar(i.produto_id, -1)} className="p-2"><Minus size={16}/></button><b className="min-w-8 text-center">{i.qtd}</b><button onClick={() => mudar(i.produto_id, 1)} className="p-2"><Plus size={16}/></button></div><button onClick={() => setCart(old => old.filter(x => x.produto_id !== i.produto_id))} className="rounded-xl p-2 text-red-600"><Trash2 size={18}/></button></div>
              </article>
            ))}
          </section>

          <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-5">
            <h2 className="text-xl font-black">Resumo</h2>
            <div className="mt-4 flex justify-between"><span>Subtotal</span><b>{brl(subtotal)}</b></div>
            <p className="mt-2 text-xs text-slate-500">A taxa de entrega será calculada no checkout. Retirada não tem taxa.</p>
            <Link href={cart.length ? "/drogariasporto/checkout" : "#"} className={`mt-5 block rounded-2xl py-4 text-center font-black text-white ${cart.length ? "bg-red-600" : "pointer-events-none bg-slate-300"}`}>CONTINUAR</Link>
            {cart.length > 0 && <button onClick={() => setCart([])} className="mt-3 w-full text-sm font-bold text-slate-500">Limpar carrinho</button>}
          </aside>
        </div>
      </div>
    </main>
  );
}
