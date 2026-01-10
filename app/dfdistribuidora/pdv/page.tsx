"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   CONFIGURAÇÕES GERAIS
========================= */
const PROD_TABLE = "df_produtos";
const RPC_SEARCH = "df_search_produtos"; // opcional (fallback funciona)
const WHATS = "5511952068432";
const TAXA_ENTREGA_FIXA = 10;

/* =========================
   TIPOS
========================= */
type DFProduto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  pmc: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  ativo: boolean | null;
  imagens: string[] | null;
};

type CartItem = {
  id: string;
  ean: string;
  nome: string;
  imagem: string | null;
  preco: number;
  qtd: number;
};

/* =========================
   HELPERS
========================= */
function brl(v: number | null | undefined) {
  if (!v) return "R$ 0,00";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  return imagens?.[0] || "/produtos/caixa-padrao.png";
}

function precoFinal(p: DFProduto) {
  if (p.em_promocao && p.preco_promocional && p.preco_promocional > 0) {
    return p.preco_promocional;
  }
  return p.pmc || 0;
}

/* =========================
   COMPONENTE
========================= */
export default function PDVDF() {
  const [produtos, setProdutos] = useState<DFProduto[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* checkout */
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [tipoEntrega, setTipoEntrega] = useState<"ENTREGA" | "RETIRADA">("ENTREGA");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");

  const [pagamento, setPagamento] =
    useState<"PIX" | "CARTAO" | "DINHEIRO" | "COMBINAR">("PIX");

  const taxaEntrega = tipoEntrega === "ENTREGA" ? TAXA_ENTREGA_FIXA : 0;

  /* =========================
     LOAD PRODUTOS
  ========================= */
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from(PROD_TABLE)
        .select("*")
        .eq("ativo", true)
        .limit(2000);

      setProdutos((data || []) as DFProduto[]);
      setLoading(false);
    }
    load();
  }, []);

  /* =========================
     CARRINHO
  ========================= */
  function addProduto(p: DFProduto) {
    const preco = precoFinal(p);

    setCarrinho((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].qtd += 1;
        return copy;
      }
      return [
        ...prev,
        {
          id: p.id,
          ean: p.ean,
          nome: p.nome,
          imagem: firstImg(p.imagens),
          preco,
          qtd: 1,
        },
      ];
    });
  }

  function inc(id: string) {
    setCarrinho((prev) =>
      prev.map((x) => (x.id === id ? { ...x, qtd: x.qtd + 1 } : x))
    );
  }

  function dec(id: string) {
    setCarrinho((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qtd: x.qtd - 1 } : x))
        .filter((x) => x.qtd > 0)
    );
  }

  function remove(id: string) {
    setCarrinho((prev) => prev.filter((x) => x.id !== id));
  }

  const subtotal = useMemo(
    () => carrinho.reduce((a, b) => a + b.preco * b.qtd, 0),
    [carrinho]
  );

  const total = subtotal + taxaEntrega;

  /* =========================
     WHATSAPP
  ========================= */
  const mensagem = useMemo(() => {
    let msg = `🧾 *Pedido DF Distribuidora*\n\n`;
    msg += `👤 Cliente: ${clienteNome}\n`;
    msg += `📞 WhatsApp: ${clienteTelefone}\n\n`;

    msg += tipoEntrega === "ENTREGA"
      ? `🚚 *Entrega*\n${endereco}, ${numero} - ${bairro}\nTaxa: ${brl(taxaEntrega)}\n\n`
      : `🏪 *Retirada na loja*\n\n`;

    msg += `💳 Pagamento: ${pagamento}\n\n🛒 *Itens:*\n`;
    carrinho.forEach((i) => {
      msg += `• ${i.nome} (${i.ean}) — ${i.qtd}x — ${brl(i.preco * i.qtd)}\n`;
    });

    msg += `\nSubtotal: ${brl(subtotal)}\n`;
    msg += `Total: ${brl(total)}\n\n`;
    msg += `Pode confirmar disponibilidade e prazo?`;

    return msg;
  }, [
    carrinho,
    clienteNome,
    clienteTelefone,
    tipoEntrega,
    endereco,
    numero,
    bairro,
    pagamento,
    subtotal,
    total,
    taxaEntrega,
  ]);

  /* =========================
     UI
  ========================= */
  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      {/* LOGO */}
      <div className="flex justify-center mb-4">
        <Image
          src="/df-distribuidora-logo.png"
          alt="DF Distribuidora"
          width={120}
          height={120}
        />
      </div>

      <h1 className="text-2xl font-extrabold text-center mb-4">
        PDV — DF Distribuidora
      </h1>

      {/* BUSCA */}
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produto ou EAN..."
        className="w-full p-3 border rounded-2xl mb-4"
      />

      {/* LISTA */}
      <div className="space-y-3">
        {loading && <div>Carregando...</div>}
        {produtos
          .filter((p) =>
            p.nome.toLowerCase().includes(busca.toLowerCase())
          )
          .slice(0, 200)
          .map((p) => (
            <div
              key={p.id}
              className="bg-white p-3 rounded-2xl border flex justify-between items-center"
            >
              <div>
                <div className="font-bold">{p.nome}</div>
                <div className="text-blue-700 font-extrabold">
                  {brl(precoFinal(p))}
                </div>
              </div>

              <button
                onClick={() => addProduto(p)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-extrabold"
              >
                +
              </button>
            </div>
          ))}
      </div>

      {/* BOTÃO CARRINHO */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-full font-extrabold shadow-lg"
      >
        🛒 Carrinho ({carrinho.length})
      </button>

      {/* DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white p-4 overflow-auto">
            <h2 className="text-xl font-extrabold mb-4">Carrinho</h2>

            {carrinho.map((i) => (
              <div key={i.id} className="border rounded-xl p-3 mb-2">
                <div className="font-bold">{i.nome}</div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => dec(i.id)}>-</button>
                  <span>{i.qtd}</span>
                  <button onClick={() => inc(i.id)}>+</button>
                  <button
                    onClick={() => remove(i.id)}
                    className="ml-auto text-red-600"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}

            {/* DADOS */}
            <div className="mt-4 space-y-2">
              <input
                placeholder="Nome do cliente"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full border p-2 rounded"
              />
              <input
                placeholder="WhatsApp"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>

            {/* ENTREGA */}
            <div className="mt-4">
              <div className="font-bold mb-2">Entrega</div>
              <button
                onClick={() => setTipoEntrega("ENTREGA")}
                className={`px-3 py-2 mr-2 rounded ${
                  tipoEntrega === "ENTREGA" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                Entrega
              </button>
              <button
                onClick={() => setTipoEntrega("RETIRADA")}
                className={`px-3 py-2 rounded ${
                  tipoEntrega === "RETIRADA" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                Retirada
              </button>

              {tipoEntrega === "ENTREGA" && (
                <div className="mt-3 space-y-2">
                  <input
                    placeholder="Endereço"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                  <input
                    placeholder="Número"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                  <input
                    placeholder="Bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                  <div className="text-sm font-bold">
                    Taxa fixa: {brl(taxaEntrega)}
                  </div>
                </div>
              )}
            </div>

            {/* PAGAMENTO */}
            <div className="mt-4">
              <div className="font-bold mb-2">Pagamento</div>
              {["PIX", "CARTAO", "DINHEIRO", "COMBINAR"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPagamento(p as any)}
                  className={`px-3 py-2 mr-2 mb-2 rounded ${
                    pagamento === p ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* TOTAL */}
            <div className="mt-4 border-t pt-3">
              <div>Subtotal: {brl(subtotal)}</div>
              <div className="font-extrabold text-lg">
                Total: {brl(total)}
              </div>
            </div>

            <a
              href={`https://wa.me/${WHATS}?text=${encodeURIComponent(mensagem)}`}
              target="_blank"
              className="block mt-4 bg-green-600 text-white text-center py-3 rounded-xl font-extrabold"
            >
              Finalizar no WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
