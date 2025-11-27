"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ProductCard from "./components/ProductCard";
import type { SorveteProduto } from "../../types/sorveteria";
import CartSidebar from "./components/CartSidebar";


// ⚙️ CONFIG
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511952068432"; // ex.: 55 + DDD + número
const LOJA_NOME = "Sorveteria Oggi (IA Drogarias)";

// fallback local (aparece se a tabela estiver vazia)
const FALLBACK: SorveteProduto[] = [
  { id: "fb-1", nome: "Picolé Sensa", linha: "Linha Sensa", categoria: "Picolé", sabor: "Clássico", preco: 5.99, ativo: true },
  { id: "fb-2", nome: "Top Sundae", linha: "Linha Top Sundae", categoria: "Sundae", sabor: "Chocolate", preco: 5.99, ativo: true },
  { id: "fb-3", nome: "Giratto", linha: "Linha Giratto", categoria: "Cone", sabor: "Crocante", preco: 7.99, ativo: true },
  { id: "fb-4", nome: "Açaí com Guaraná", linha: "Linha Açaí", categoria: "Açaí 1,5L", preco: 30.99, ativo: true },
];

const [openCart, setOpenCart] = useState(false);


type CartItem = SorveteProduto & { qty: number };

export default function SorveteriaPage() {
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<SorveteProduto[]>([]);
  const [q, setQ] = useState("");
  const [linha, setLinha] = useState("Todas");
  const [categoria, setCategoria] = useState("Todas");
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sorveteria_produtos")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true })
        .order("nome", { ascending: true });

      if (error) {
        console.warn(error.message);
        setProdutos(FALLBACK);
      } else {
        setProdutos((data?.length ?? 0) > 0 ? (data as SorveteProduto[]) : FALLBACK);
      }
      setLoading(false);
    })();
  }, []);

  const linhas = useMemo(() => ["Todas", ...Array.from(new Set(produtos.map(p => p.linha)))], [produtos]);
  const categorias = useMemo(() => ["Todas", ...Array.from(new Set(produtos.map(p => p.categoria)))], [produtos]);

  const filtrados = useMemo(() => {
    return produtos.filter(p => {
      const okQ =
        !q ||
        p.nome.toLowerCase().includes(q.toLowerCase()) ||
        (p.sabor ?? "").toLowerCase().includes(q.toLowerCase()) ||
        p.linha.toLowerCase().includes(q.toLowerCase());
      const okL = linha === "Todas" || p.linha === linha;
      const okC = categoria === "Todas" || p.categoria === categoria;
      return okQ && okL && okC;
    });
  }, [produtos, q, linha, categoria]);

  function addToCart(p: SorveteProduto) {
    setCart(prev => {
      const i = prev.findIndex(x => x.id === p.id);
      if (i >= 0) {
        const cp = [...prev];
        cp[i] = { ...cp[i], qty: cp[i].qty + 1 };
        return cp;
      }
      return [...prev, { ...p, qty: 1 }];
    });
     <CartSidebar
  cart={cart}
  changeQty={changeQty}
  total={total}
  open={openCart}
  onClose={() => setOpenCart(false)}
  onSend={sendWhatsApp}
/>
  }

  
 


  function changeQty(id: string, qty: number) {
    setCart(prev =>
      prev
        .map(i => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))
        .filter(i => i.qty > 0)
    );
  }

  const total = useMemo(
    () => cart.reduce((acc, i) => acc + i.preco * i.qty, 0),
    [cart]
  );

  function sendWhatsApp() {
  if (cart.length === 0) return;

  const linhas = cart
    .map(
      (i) =>
        `• ${i.nome}${i.sabor ? ` (${i.sabor})`: ""} — R$ ${i.preco
          .toFixed(2)
          .replace(".", ",")} x ${i.qty}`
    )
    .join("%0A");

  const msg = `Olá, quero fazer um pedido na ${LOJA_NOME}:%0A%0A${linhas}%0A%0A*Total:* R$ ${total
    .toFixed(2)
    .replace(".", ",")}%0A%0AEndereço para entrega:%0ABairro:%0AForma de pagamento:`;

  const url = `https://wa.me/${WHATSAPP}?text=${msg}`;
  window.open(url, "_blank");
}

  return (
    <main className="min-h-screen bg-gradient-to-b from-fuchsia-50 to-white">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-10">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-fuchsia-800">
              Sorveteria Oggi
            </h1>
            <p className="text-neutral-600">
              Catálogo oficial – faça seu pedido pelo WhatsApp
            </p>
          </div>

          {/* Busca e filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar sabor, linha…"
              className="w-full sm:w-64 px-3 py-2 border rounded-lg"
            />
            <select
              value={linha}
              onChange={(e) => setLinha(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              {linhas.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Grade */}
        {loading ? (
          <div className="grid place-items-center h-64 text-neutral-500">Carregando…</div>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtrados.map((p) => (
              <ProductCard key={p.id} item={p} onAdd={addToCart} />
            ))}
          </div>
        )}
      </div>

      {/* Carrinho fixo */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="font-semibold">Carrinho</div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-3">
              {cart.length === 0 ? (
                <span className="text-sm text-neutral-500">vazio</span>
              ) : (
                cart.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center gap-2 border rounded-lg px-2 py-1 bg-white"
                  >
                    <span className="text-sm">{i.nome}</span>
                    <input
                      type="number"
                      min={1}
                      className="w-14 px-2 py-1 border rounded"
                      value={i.qty}
                      onChange={(e) => changeQty(i.id, parseInt(e.target.value || "1", 10))}
                    />
                    <span className="text-sm font-semibold">
                      R$ {(i.preco * i.qty).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-lg font-extrabold">
            Total: R$ {total.toFixed(2).replace(".", ",")}
          </div>
          <button
            onClick={sendWhatsApp}
            disabled={cart.length === 0}
            className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50"
          >
            Pedir no WhatsApp
          </button>

          {/* Botão flutuante do carrinho */}
<button
  onClick={() => setOpenCart(true)}
  className="
    fixed bottom-5 right-5 z-50
    bg-fuchsia-600 text-white rounded-full shadow-xl
    w-16 h-16 flex items-center justify-center text-xl
    hover:bg-fuchsia-700
  "
>
  🛒
</button>

        </div>
      </div>
    </main>
  );
}