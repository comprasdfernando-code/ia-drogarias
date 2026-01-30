"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ProductCard from "./components/ProductCard";
import CartSidebar from "./components/CartSidebar";
import type { SorveteProduto } from "../../types/sorveteria";

/* =========================
   CONFIG
========================= */
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511952068432";
const LOJA_NOME = "Sorveteria Oggi (IA Drogarias)";

// fallback local
const FALLBACK: SorveteProduto[] = [
  { id: "fb-1", nome: "Picolé Sensa", linha: "Linha Sensa", categoria: "Picolé", sabor: "Clássico", preco: 5.99, ativo: true },
  { id: "fb-2", nome: "Top Sundae", linha: "Linha Top Sundae", categoria: "Sundae", sabor: "Chocolate", preco: 5.99, ativo: true },
  { id: "fb-3", nome: "Giratto", linha: "Linha Giratto", categoria: "Cone", sabor: "Crocante", preco: 7.99, ativo: true },
  { id: "fb-4", nome: "Açaí com Guaraná", linha: "Linha Açaí", categoria: "Açaí 1,5L", preco: 30.99, ativo: true },
];

type CartItem = SorveteProduto & { qty: number };

function moneyBR(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function SorveteriaPage() {
  const [openCart, setOpenCart] = useState(false);

  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<SorveteProduto[]>([]);
  const [q, setQ] = useState("");
  const [linha, setLinha] = useState("Todas");
  const [categoria, setCategoria] = useState("Todas");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [sending, setSending] = useState(false);

  /* =========================
     LOAD PRODUTOS
  ========================= */
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
        console.warn("Erro ao buscar produtos, usando FALLBACK:", error);
        setProdutos(FALLBACK);
      } else {
        const list = (data ?? []) as SorveteProduto[];
        setProdutos(list.length > 0 ? list : FALLBACK);
      }

      setLoading(false);
    })();
  }, []);

  /* =========================
     FILTROS
  ========================= */
  const linhas = useMemo(
    () => ["Todas", ...Array.from(new Set(produtos.map((p) => p.linha).filter(Boolean)))],
    [produtos]
  );

  const categorias = useMemo(
    () => ["Todas", ...Array.from(new Set(produtos.map((p) => p.categoria).filter(Boolean)))],
    [produtos]
  );

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return produtos.filter((p) => {
      const okQ =
        !qq ||
        (p.nome || "").toLowerCase().includes(qq) ||
        (p.sabor || "").toLowerCase().includes(qq) ||
        (p.linha || "").toLowerCase().includes(qq);

      const okL = linha === "Todas" || p.linha === linha;
      const okC = categoria === "Todas" || p.categoria === categoria;

      return okQ && okL && okC;
    });
  }, [produtos, q, linha, categoria]);

  /* =========================
     CARRINHO
  ========================= */
  function addToCart(p: SorveteProduto) {
    setCart((prev) => {
      const i = prev.findIndex((x) => x.id === p.id);
      if (i >= 0) {
        const cp = [...prev];
        cp[i] = { ...cp[i], qty: cp[i].qty + 1 };
        return cp;
      }
      return [...prev, { ...p, qty: 1 }];
    });
    setOpenCart(true);
  }

  function changeQty(id: string, qty: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i))
        .filter((i) => i.qty > 0)
    );
  }

  const total = useMemo(() => cart.reduce((acc, i) => acc + (Number(i.preco) || 0) * (i.qty || 0), 0), [cart]);
  const totalItens = useMemo(() => cart.reduce((acc, i) => acc + (i.qty || 0), 0), [cart]);

  /* =========================
     PEDIDO -> SUPABASE
  ========================= */
  async function criarPedidoNoSupabase(dados: any) {
    // 1) cria pedido
    const { data: pedido, error: e1 } = await supabase
  .from("sorveteria_pedidos")
  .insert([
    {
      status: "novo",
      loja_nome: LOJA_NOME,
      cliente_nome: dados?.nome ?? null,
      endereco: dados?.endereco ?? null,
      bairro: dados?.bairro ?? null,
      referencia: dados?.referencia ?? null,
      pagamento: dados?.pagamento ?? null,
      obs: dados?.obs ?? "",
      total: total, // ✅ ADD AQUI
    },
  ])
  .select("id")
  .single();


    if (e1) throw e1;

    // 2) cria itens
    const itensPayload = cart.map((i) => ({
      pedido_id: pedido.id,
      produto_id: i.id,
      nome: i.nome,
      sabor: i.sabor ?? null,
      linha: i.linha,
      categoria: i.categoria,
      preco: i.preco,
      qty: i.qty,
    }));

    const { error: e2 } = await supabase.from("sorveteria_pedido_itens").insert(itensPayload);
    if (e2) throw e2;

    // 3) tenta puxar código amigável pelo view
    const { data: pv, error: e3 } = await supabase
      .from("sorveteria_pedidos_view")
      .select("id,codigo,total,status,created_at")
      .eq("id", pedido.id)
      .single();

    if (e3 || !pv) {
      return { id: pedido.id, codigo: `PED-${String(pedido.id).slice(0, 8)}` };
    }

    return pv;
  }

  /* =========================
     WHATSAPP
  ========================= */
  async function sendWhatsApp(dados: any) {
    if (cart.length === 0) return;
    if (sending) return;

    setSending(true);

    try {
      const pedido = await criarPedidoNoSupabase(dados);

      const itens = cart
        .map((i) => {
          const preco = Number(i.preco) || 0;
          return `• ${i.nome}${i.sabor ? ` (${i.sabor})` : ""} — R$ ${preco
            .toFixed(2)
            .replace(".", ",")} x ${i.qty}`;
        })
        .join("%0A");

      const msg = `
Olá, quero fazer um pedido na ${LOJA_NOME}!

*Pedido:* ${pedido?.codigo ?? ""}

${itens}

*Total:* ${moneyBR(total)}

--- *DADOS DO CLIENTE* ---
*Nome:* ${dados?.nome ?? ""}
*Endereço:* ${dados?.endereco ?? ""}
*Bairro:* ${dados?.bairro ?? ""}
*Referência:* ${dados?.referencia ?? ""}
*Pagamento:* ${dados?.pagamento ?? ""}
*Obs:* ${dados?.obs ?? ""}
      `
        .trim()
        .replace(/\n/g, "%0A");

      const url = `https://wa.me/${WHATSAPP}?text=${msg}`;
      window.open(url, "_blank");

      // ✅ só limpa se deu certo
      setCart([]);
      setOpenCart(false);
    } catch (err: any) {
      console.error("Falha ao salvar pedido:", err);
      alert("Não consegui salvar o pedido no sistema. Verifique a conexão e tente novamente.");
    } finally {
      setSending(false);
    }
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gradient-to-b from-fuchsia-50 to-white relative">
      {/* 🛒 SIDEBAR DO CARRINHO */}
      <CartSidebar
        open={openCart}
        cart={cart}
        changeQty={changeQty}
        total={total}
        onClose={() => setOpenCart(false)}
        onSend={sendWhatsApp}
      />

      {/* Conteúdo principal */}
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-fuchsia-800">Sorveteria Oggi</h1>
            <p className="text-neutral-600">Catálogo oficial – faça seu pedido pelo WhatsApp</p>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar sabor, linha…"
              className="w-full sm:w-64 px-3 py-2 border rounded-lg"
            />
            <select value={linha} onChange={(e) => setLinha(e.target.value)} className="px-3 py-2 border rounded-lg">
              {linhas.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista */}
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

      {/* BOTÃO FIXO DE ABRIR O CARRINHO */}
      <button
        onClick={() => setOpenCart(true)}
        className="fixed bottom-4 right-4 bg-fuchsia-600 text-white px-5 py-3 rounded-full shadow-xl z-30 font-semibold hover:bg-fuchsia-700 disabled:opacity-60"
        disabled={sending}
        title={sending ? "Enviando pedido..." : "Abrir carrinho"}
      >
        {sending ? "Enviando..." : `Carrinho (${totalItens})`}
      </button>
    </main>
  );
}
