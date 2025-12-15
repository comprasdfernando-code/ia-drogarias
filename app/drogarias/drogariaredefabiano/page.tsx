"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import ModalFinalizar from "../../../components/ModalFinalizar";

// 🔌 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ⚙️ Constantes
const LOJA = "drogariaredefabiano";
const WHATSAPP = "5511948343725";
const PIX_CHAVE = "62157257000109";

// 🧩 Tipos
type Produto = {
  id: string;
  nome: string;
  preco_venda: number;
  estoque: number;
  imagem?: string;
  categoria?: string;
  slug?: string;
};

type ItemCarrinho = Produto & { quantidade: number };

type Cliente = {
  nome: string;
  telefone: string;
  endereco: string;
  bairro?: string;
  complemento?: string;
};

// 📸 Imagem
function imgUrl(src?: string) {
  if (!src) return "/produtos/caixa-padrao.png";
  return src.startsWith("http")
    ? src
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public${src}`;
}

// 💾 Registrar venda SITE
async function gravarVendaSite(venda: any) {
  await supabase.from("vendas").insert([
    {
      cliente_nome: venda.cliente.nome || "Cliente Site",
      total: venda.total,
      produtos: venda.produtos,
      origem: "SITE",
      data_venda: new Date().toISOString(),
      atendente_nome: "Venda Online",
    },
  ]);
}

export default function DrogariaRedeFabianoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  // 🔄 Produtos
  useEffect(() => {
    async function carregarProdutos() {
      const { data } = await supabase
        .from("produtos")
        .select("id,nome,preco_venda,estoque,imagem,categoria,slug")
        .eq("loja", LOJA)
        .eq("disponivel", true)
        .gt("estoque", 0)
        .order("nome");

      setProdutos(data || []);
      setCarregando(false);
    }
    carregarProdutos();
  }, []);

  // 💾 Carrinho local
  useEffect(() => {
    const salvo = localStorage.getItem("carrinho-rede-fabiano");
    if (salvo) setCarrinho(JSON.parse(salvo));
  }, []);

  useEffect(() => {
    localStorage.setItem("carrinho-rede-fabiano", JSON.stringify(carrinho));
  }, [carrinho]);

  // 🛒 Ações
  function adicionarAoCarrinho(produto: Produto) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === produto.id);
      if (existe) {
        return prev.map((i) =>
          i.id === produto.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
    setCarrinhoAberto(true);
  }

  function alterarQtd(id: string, qtd: number) {
    if (qtd <= 0)
      setCarrinho((prev) => prev.filter((i) => i.id !== id));
    else
      setCarrinho((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantidade: qtd } : i))
      );
  }

  // 🧮 Total
  const total = useMemo(
    () =>
      carrinho.reduce(
        (acc, i) => acc + i.preco_venda * i.quantidade,
        0
      ),
    [carrinho]
  );

  const produtosFiltrados = useMemo(
    () =>
      produtos.filter((p) =>
        p.nome.toLowerCase().includes(busca.toLowerCase())
      ),
    [produtos, busca]
  );

  function fmt(n: number) {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  // 🧾 Finalizar
  async function finalizarPedido(cliente: Cliente, pagamento: any) {
    const { data } = await supabase
      .from("pedidos")
      .insert({
        loja: LOJA,
        cliente,
        itens: carrinho,
        total,
        pagamento,
        status: "pendente",
      })
      .select("id")
      .single();

    await gravarVendaSite({
      cliente,
      total,
      produtos: carrinho.map((i) => ({
        nome: i.nome,
        qtd: i.quantidade,
        preco_venda: i.preco_venda,
      })),
    });

    const texto = `
🛒 Pedido Drogaria Rede Fabiano

${carrinho
  .map(
    (i) =>
      `• ${i.nome} (${i.quantidade}x) - R$ ${fmt(
        i.preco_venda * i.quantidade
      )}`
  )
  .join("\n")}

Total: R$ ${fmt(total)}
Pagamento: ${pagamento}

Cliente:
${cliente.nome}
${cliente.telefone}
${cliente.endereco}

Pedido #${data?.id}
`;

    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`,
      "_blank"
    );

    setCarrinho([]);
    setModalAberto(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-20">
      {/* Topo */}
      <div className="bg-blue-700 text-white p-4 flex gap-3">
        <input
          placeholder="Buscar produtos..."
          className="flex-1 px-3 py-2 rounded text-gray-700"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button onClick={() => setCarrinhoAberto(true)}>🛒 {carrinho.length}</button>
      </div>

      {/* Produtos */}
      <div className="max-w-6xl mx-auto p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {carregando
          ? "Carregando..."
          : produtosFiltrados.map((p) => (
              <div key={p.id} className="bg-white p-3 rounded shadow">
                <Image
                  src={imgUrl(p.imagem)}
                  alt={p.nome}
                  width={150}
                  height={150}
                  className="mx-auto h-32 object-contain"
                />
                <h2 className="text-sm font-semibold mt-2">{p.nome}</h2>
                <p className="text-green-600 font-bold">
                  R$ {fmt(p.preco_venda)}
                </p>
                <button
                  onClick={() => adicionarAoCarrinho(p)}
                  className="w-full mt-2 bg-blue-600 text-white py-1 rounded"
                >
                  Adicionar
                </button>
              </div>
            ))}
      </div>

      {/* Carrinho lateral */}
      {carrinhoAberto && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white p-4">
            <h2 className="font-bold mb-3">Carrinho</h2>

            {carrinho.map((i) => (
              <div key={i.id} className="border-b pb-2 mb-2">
                <div className="text-sm">{i.nome}</div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => alterarQtd(i.id, i.quantidade - 1)}>
                    −
                  </button>
                  <span>{i.quantidade}</span>
                  <button onClick={() => alterarQtd(i.id, i.quantidade + 1)}>
                    +
                  </button>
                </div>
              </div>
            ))}

            <div className="font-bold mt-3">Total: R$ {fmt(total)}</div>

            <button
              onClick={() => setModalAberto(true)}
              className="w-full bg-green-600 text-white py-2 mt-3 rounded"
            >
              Finalizar Pedido
            </button>

            <button
              onClick={() => setCarrinhoAberto(false)}
              className="w-full mt-2 text-sm text-gray-500"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {modalAberto && (
        <ModalFinalizar
          loja="Drogaria Rede Fabiano"
          whatsapp={WHATSAPP}
          pixChave={PIX_CHAVE}
          total={total}
          carrinho={carrinho}
          onConfirm={finalizarPedido}
          onClose={() => setModalAberto(false)}
        />
      )}
    </main>
  );
}
