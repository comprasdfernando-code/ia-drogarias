"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import ModalFinalizar from "../../../components/ModalFinalizar";
import { useSearchParams } from "next/navigation";
import Link from "next/link"

// 🔌 Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ⚙️ Constantes
const LOJA = "drogariaredefabiano";
const WHATSAPP = "5511948343725"; // Drogaria Rede Fabiano
const PIX_CHAVE = "CNPJ 62157257000109";

// 🧩 Tipagens
type Produto = {
  id: string;
  nome: string;
  categoria?: string;
  preco_venda: number;
  estoque: number;
  imagem?: string;
  disponivel?: boolean;
  loja?: string;
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

// 📸 Função auxiliar para imagem
function imgUrl(src?: string) {
  if (!src || src.trim() === "") return "/produtos/caixa-padrao.png";
  return src.startsWith("http")
    ? src
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public${src}`;
}

export default function DrogariaRedeFabianoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  // 🛒 Carrinho
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  // 🧠 Carregar carrinho salvo
useEffect(() => {
  const salvo = localStorage.getItem("carrinho-rede-fabiano");
  if (salvo) setCarrinho(JSON.parse(salvo));
}, []);

// 💾 Salvar carrinho sempre que mudar
useEffect(() => {
  localStorage.setItem("carrinho-rede-fabiano", JSON.stringify(carrinho));
}, [carrinho]);

  // 💳 Pagamento
  const [pagamento, setPagamento] = useState<"Pix" | "Cartão" | "Dinheiro">("Pix");
  const [tipoCartao, setTipoCartao] = useState<"Débito" | "Crédito">("Débito");
  const [trocoNecessario, setTrocoNecessario] = useState(false);
  const [trocoPara, setTrocoPara] = useState<string>("");

  // 👤 Cadastro
  const [cliente, setCliente] = useState<Cliente>({
    nome: "",
    telefone: "",
    endereco: "",
    bairro: "",
    complemento: "",
  });

  // 🔄 Carregar produtos
  useEffect(() => {
    async function carregarProdutos() {
      setCarregando(true);
      let pagina = 0;
      const limite = 100;
      let todos: Produto[] = [];

      try {
        while (true) {
          // 🔹 Nova consulta principal (preferencial)
          const { data, error } = await supabase
  .from("estoque_farmacia")
  .select(`
    id,
    quantidade,
    preco_local,
    produtos (
      id,
      nome,
      slug,
      imagem,
      categoria,
      preco_venda
    )
  `)
            .eq("farmacia_id", 1) // ID da Drogaria Rede Fabiano
            .gt("quantidade", 0)
            .order("produtos(nome)", { ascending: true })
            .range(pagina * limite, (pagina + 1) * limite - 1);

          // 🔹 Fallback de segurança
          if (error) {
            console.warn("⚠️ Erro ao buscar estoque_farmacia, revertendo para tabela produtos:", error);
            const fallback = await supabase
              .from("produtos")
              .select("*")
              .eq("loja", LOJA)
              .eq("disponivel", true)
              .gt("estoque", 0)
              .order("nome", { ascending: true })
              .range(pagina * limite, (pagina + 1) * limite - 1);

            if (!fallback.error && fallback.data?.length) {
              todos = [...todos, ...fallback.data];
            }
            break;
          }

          if (!data || data.length === 0) break;

          // 🔹 Formatar estrutura
          const formatados = data.map((item: any) => ({
            ...item.produtos,
            preco_venda: item.preco_local ?? item.produtos?.preco_venda ?? 0,
            estoque: item.quantidade,
          }));

          todos = [...todos, ...formatados];

          if (data.length < limite) break;
          pagina++;
        }

        console.log("✅ Total de produtos carregados:", todos.length);
        setProdutos(todos);
      } catch (err) {
        console.error("❌ Erro inesperado ao carregar produtos:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarProdutos();
  }, []);


  // 🛒 Carrinho
  function adicionarAoCarrinho(produto: Produto) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === produto.id);
      if (existe) {
        return prev.map((i) =>
          i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
    setCarrinhoAberto(true);
  }

  function alterarQtd(id: string, qtd: number) {
    if (qtd <= 0) return removerItem(id);
    setCarrinho((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantidade: qtd } : i))
    );
  }

  function removerItem(id: string) {
    setCarrinho((prev) => prev.filter((i) => i.id !== id));
  }

  // 🧮 Filtros e total
  const produtosFiltrados = useMemo(
  () =>
    produtos.filter((p) =>
      p.nome?.toLowerCase().includes(busca.toLowerCase())
    ),
  [produtos, busca]
);

  const total = useMemo(
    () =>
      carrinho.reduce(
        (acc, i) => acc + Number(i.preco_venda || 0) * Number(i.quantidade || 0),
        0
      ),
    [carrinho]
  );

  function fmt(n: number) {
    return n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // 🧾 WhatsApp
  function montarTextoWhatsApp(pedidoId?: number, cliente?:Cliente, pagamento?: any ): string {
    const linhas: string[] = [
      "🛒 Novo Pedido - Drogaria Rede Fabiano",
      "",
      ...carrinho.map(
        (i) =>
          `• ${i.nome} — ${i.quantidade}x R$ ${fmt(Number(i.preco_venda))} = R$ ${fmt(
            Number(i.preco_venda) * i.quantidade
          )}`
      ),
      ` *Total:* R$ ${fmt(total)}`,
      ` *Pagamento:* ${pagamento}` +
        (pagamento === "Cartão" ? ` (${tipoCartao})` : "") +
        (pagamento === "Dinheiro" && trocoNecessario && trocoPara
          ? ` — Troco para R$ ${fmt(Number(trocoPara))}`
          : "") +
        (pagamento === "Pix" ? ` — Chave: ${PIX_CHAVE}` : ""),
      "",
      "👤 Cliente",
     ` Nome: ${cliente.nome}`,
      ` Telefone: ${cliente.telefone}`,
      ` Endereço: ${cliente.endereco}`,
      cliente.bairro ? ` Bairro: ${cliente.bairro}` : "",
      cliente.complemento ? ` Complemento: ${cliente.complemento}` : "",
      pedidoId ? `Pedido #${pedidoId}` : "",
    ].filter(Boolean);

    return linhas.join("\n");
  }

  // 💾 Finalizar pedido
  async function finalizarPedido(cliente: Cliente, pagamento: any) {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    if (!cliente.nome || !cliente.telefone || !cliente.endereco) {
      alert("Preencha os dados de entrega.");
      return;
    }

    const payload = {
      itens: carrinho,
      total: total,
      pagamento,
      status: "pendente",
      loja: LOJA,
      cliente,
    };

    const { data, error } = await supabase
      .from("pedidos")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido.");
      return;
    }

    const texto = montarTextoWhatsApp(data?.id, cliente, pagamento);
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");

    setCarrinho([]);
    setCarrinhoAberto(false);
    alert("Pedido enviado com sucesso! 🙌");
  } //

  //  Render
  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      {/*  Faixa superior */}
      <Link
  href="/drogarias/drogariaredefabiano/pdv"
  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-md"
>
  💻 Acessar PDV
</Link>
      <section className="w-full bg-blue-700 text-white">
        {/* 🩵 Banner principal */}
        
<section className="relative w-full">
  <img
    src="/banners/banner-rede-fabiano-faixa.jpg"
    alt="Drogaria Rede Fabiano"
    className="w-full h-36 sm:h-48 md:h-56 object-cover shadow-md"
  />
  
</section>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/*  Busca */}
            <div className="flex items-center bg-white rounded-lg px-3 py-2 w-full">
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="flex-1 text-gray-700 outline-none text-sm"
              />
              <span className="text-blue-700 font-bold">🔍</span>
            </div>

            {/*  Carrinho + menu */}
            <div className="flex items-center gap-3">
              <div
                className="relative cursor-pointer"
                onClick={() => setCarrinhoAberto(true)}
              >
                <span className="text-white text-2xl">🛒</span>
                {carrinho.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {carrinho.length}
                  </span>
                )}
              </div>

              <button
                aria-label="Abrir menu"
                className="text-white text-2xl leading-none px-2"
                onClick={() => setMenuAberto(true)}
              >
                ⋮
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 📦 Lista de produtos */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {carregando ? (
          <p className="text-center text-gray-500">Carregando produtos...</p>
        ) : produtosFiltrados.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum produto encontrado.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
            {produtosFiltrados.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg shadow p-2 sm:p-3 text-center hover:shadow-lg transition flex flex-col justify-between"
              >
                <Link
      href={`/drogarias/drogariaredefabiano/produtos/${encodeURIComponent(p.slug ?? p.id)}`}
      className="flex flex-col flex-1"
      prefetch={false}
    >
                <Image
                  src={imgUrl(p.imagem)}
                  alt={p.nome || "Produto"}
                  width={150}
                  height={150}
                  className="mx-auto rounded shadow-sm object-contain h-24 sm:h-32"
                />
                <h2 className="font-medium text-blue-800 mt-2 text-[12px] sm:text-sm line-clamp-2">
                  {p.nome}
                </h2>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  {p.categoria}
                </p>
                <p className="text-sm sm:text-base font-bold text-green-600 mt-1">
                  R$ {fmt(Number(p.preco_venda))}
                </p>
                </Link>
                <button
                  onClick={() => adicionarAoCarrinho(p)}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded-md text-xs sm:text-sm font-medium transition"
                >
                  Adicionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🛒 Carrinho fixo no rodapé */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-semibold">
                {carrinho.length} item{carrinho.length > 1 ? "s" : ""} no carrinho
              </div>
              <div className="text-gray-600">
                Total: <b>R$ {fmt(total)}</b>
              </div>
            </div>

            <button
              onClick={() =>finalizarPedido}
              className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
            >
              Finalizar pedido
            </button>
          </div>
        </div>
      )}
      {/* 🧩 Produtos */}
<div className="max-w-6xl mx-auto px-4 py-8">
  {/* aqui vem os produtos etc... */}
</div>

{/* 🛒 Carrinho lateral */}
<div
  className={`fixed top-0 right-0 h-full w-[90%] sm:w-[420px] bg-white shadow-2xl border-l transform ${
    carrinhoAberto ? "translate-x-0" : "translate-x-full"
  } transition-transform duration-500 z-[60] flex flex-col`}
>
  <div className="p-4 border-b flex justify-between items-center bg-blue-700 text-white">
    <h3 className="font-semibold text-lg">Seu Carrinho</h3>
    <button onClick={() => setCarrinhoAberto(false)}>✖</button>
  </div>

  <div className="p-4 flex-1 overflow-auto">
    {carrinho.length === 0 ? (
      <p className="text-gray-500">Seu carrinho está vazio.</p>
    ) : (
      carrinho.map((i) => (
        <div key={i.id} className="flex items-start gap-3 border-b pb-3">
  <div className="flex-1">
    <div className="font-medium text-sm">{i.nome}</div>
    <div className="text-xs text-gray-500">
      R$ {fmt(Number(i.preco_venda))}
    </div>

    <div className="flex items-center gap-2 mt-2">
      {/* Botão de diminuir */}
      <button
        onClick={() => alterarQtd(i.id, i.quantidade - 1)}
        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm font-bold"
      >
        −
      </button>

      {/* Quantidade atual */}
      <span className="min-w-[24px] text-center font-semibold text-sm">
        {i.quantidade}
      </span>

      {/* Botão de aumentar */}
      <button
        onClick={() => alterarQtd(i.id, i.quantidade + 1)}
        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm font-bold"
      >
        +
      </button>

      {/* Botão remover */}
      <button
        onClick={() => removerItem(i.id)}
        className="text-red-600 text-xs ml-2 hover:underline"
      >
        Remover
      </button>
    </div>
  </div>

  <div className="text-sm font-semibold">
    R$ {fmt(Number(i.preco_venda) * i.quantidade)}
  </div>
</div>
      ))
    )}
  </div>

  {carrinho.length > 0 && (
    <div className="p-4 border-t">
      <div className="flex justify-between font-semibold mb-3">
        <span>Total</span>
        <span>R$ {fmt(total)}</span>
      </div>
      <button
  onClick={() => setModalAberto(true)}
  disabled={!carrinho.length}
  className={`w-full py-3 rounded text-white font-semibold ${
    !carrinho.length
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700"
  }`}
>
  Finalizar Pedido
</button>
    </div>
  )}
</div>

{/* 📋 Menu lateral */}
<div
  className={`fixed top-0 right-0 h-full w-64 bg-blue-700 text-white shadow-2xl transform ${
    menuAberto ? "translate-x-0" : "translate-x-full"
  } transition-transform duration-500 z-50`}
>
  <div className="p-6 flex flex-col gap-4">
    <div className="text-right text-2xl cursor-pointer" onClick={() => setMenuAberto(false)}>
      ✖
    </div>
    <h2 className="text-lg font-semibold mb-4 border-b border-blue-400 pb-2">Menu</h2>
    <button className="text-left hover:text-blue-200">🏠 Início</button>
    <button className="text-left hover:text-blue-200">💊 Meus Pedidos</button>
    <button className="text-left hover:text-blue-200">👤 Meu Perfil</button>
    <button className="text-left hover:text-blue-200">📦 Entregas</button>
    <button className="text-left hover:text-blue-200">📞 Contato</button>
  </div>
</div>
{modalAberto && (
  <ModalFinalizar
    loja="Drogaria Rede Fabiano"
    whatsapp="5511948343725"
    pixChave=" 62157257000109"
    total={total}
    carrinho={carrinho}
    onConfirm={(cliente, pagamento) => {
      finalizarPedido(cliente, pagamento);
      setModalAberto(false);
    }}
    onClose={() => setModalAberto(false)}
  />
)}

</main>
);
}