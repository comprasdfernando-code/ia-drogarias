"use client";
// @ts-ignore
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";// @ts-ignore
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ModalFinalizar from "../components/ModalFinalizar";
import { useRouter } from "next/navigation";

// 🔌 Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ⚙️ Constantes
const LOJA = "drogariaredefabiano";
const WHATSAPP = "5511948343725";
const PIX_CHAVE = "CNPJ 62157257000109";

// 🧩 Tipos
type Produto = {
  id: string;
  nome: string;
  categoria?: string;
  preco_venda: number;
  estoque: number;
  imagem?: string;
  disponivel?: boolean;
  loja?: string;
};

type ItemCarrinho = Produto & { quantidade: number };

type Cliente = {
  nome: string;
  telefone: string;
  endereco: string;
  bairro?: string;
  complemento?: string;
};

// 📸 Util: imagem
function imgUrl(src?: string) {
  if (!src || src.trim() === "") return "/produtos/caixa-padrao.png";
  return src.startsWith("http")
    ? src
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public${src}`;
}

export default function HomePage() {
  // Produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const router = useRouter();


  // Paginação visual (Home): mostra 20 e carrega +20 por clique
  const [visiveis, setVisiveis] = useState(20);

  // Carrinho & Modal
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  // Pagamento (vem do modal, mas mantemos aqui se precisar)
  const [pagamento, setPagamento] = useState<"Pix" | "Cartão" | "Dinheiro">("Pix");
  const [tipoCartao, setTipoCartao] = useState<"Débito" | "Crédito">("Débito");
  const [trocoNecessario, setTrocoNecessario] = useState(false);
  const [trocoPara, setTrocoPara] = useState<string>("");

  // Carregar carrinho salvo
  useEffect(() => {
    const salvo = localStorage.getItem("carrinho-home");
    if (salvo) setCarrinho(JSON.parse(salvo));
  }, []);
  useEffect(() => {
    localStorage.setItem("carrinho-home", JSON.stringify(carrinho));
  }, [carrinho]);

  // 🔄 Carregar produtos do Supabase (em lotes p/ evitar timeout)
  useEffect(() => {
    async function carregarProdutos() {
      setCarregando(true);
      let pagina = 0;
      const limite = 100;
      let todos: Produto[] = [];

      while (true) {
        const { data, error } = await supabase
          .from("produtos")
          .select("*")
          .eq("loja", LOJA)
          .eq("disponivel", true)
          .gt("estoque", 0)
          .order("nome", { ascending: true })
          .range(pagina * limite, (pagina + 1) * limite - 1);

        if (error) {
          console.error("❌ Erro ao carregar produtos:", error);
          break;
        }
        if (!data || data.length === 0) break;

        todos = [...todos, ...(data as Produto[])];
        if (data.length < limite) break;
        pagina++;
      }

      setProdutos(todos);
      setCarregando(false);
    }

    carregarProdutos();
  }, []);

  // Filtro por busca (local)
  const produtosFiltrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return produtos;
    return produtos.filter((p) => p.nome?.toLowerCase().includes(t));
  }, [produtos, busca]);

  // Formatador de moeda
  function fmt(n: number) {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Carrinho
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
    setCarrinho((prev) => prev.map((i) => (i.id === id ? { ...i, quantidade: qtd } : i)));
  }
  function removerItem(id: string) {
    setCarrinho((prev) => prev.filter((i) => i.id !== id));
  }

  const total = useMemo(
    () => carrinho.reduce((acc, i) => acc + Number(i.preco_venda || 0) * Number(i.quantidade || 0), 0),
    [carrinho]
  );

  // WhatsApp
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
      "👤 Cliente", // @ts-ignore
     ` Nome: ${cliente.nome}`,// @ts-ignore
      ` Telefone: ${cliente.telefone}`,// @ts-ignore
      ` Endereço: ${cliente.endereco}`,// @ts-ignore
      cliente.bairro ? ` Bairro: ${cliente.bairro}` : "",// @ts-ignore
      cliente.complemento ? ` Complemento: ${cliente.complemento}` : "",
      pedidoId ? `Pedido #${pedidoId}` : "",
    ].filter(Boolean);

    return linhas.join("\n");
  }

  // Finalizar pedido (mesmo fluxo da Rede Fabiano)
  async function finalizarPedido(cliente: Cliente, pagamento: any) {
    try {
      if (carrinho.length === 0) {
        alert("Seu carrinho está vazio.");
        return;
      }
      if (!cliente.nome || !cliente.telefone || !cliente.endereco) {
        alert("Por favor, preencha todos os dados antes de confirmar o pedido.");
        return;
      }

      const clienteFinal = {
        nome: cliente.nome.trim(),
        telefone: cliente.telefone.trim(),
        endereco: cliente.endereco.trim(),
        bairro: cliente.bairro?.trim() || "",
        complemento: cliente.complemento?.trim() || "",
      };

      // Salva pedido
      const payload = {
        itens: carrinho,
        total,
        pagamento,
        status: "pendente",
        loja: LOJA,
        cliente: clienteFinal,
      };

      const { data, error } = await supabase
        .from("pedidos")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        console.error("❌ Erro ao salvar pedido:", error);
        alert("Erro ao salvar pedido.");
        return;
      }

      // (opcional) baixar estoque aqui, item a item
      for (const item of carrinho) {
        const novoEstoque = Math.max(0, Number(item.estoque) - Number(item.quantidade));
        await supabase.from("produtos").update({ estoque: novoEstoque }).eq("id", item.id);
      }

      const texto = montarTextoWhatsApp(data?.id, clienteFinal, pagamento);
      const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
      window.open(url, "_blank");

      setCarrinho([]);
      setCarrinhoAberto(false);
      setModalAberto(false);
      alert("Pedido enviado com sucesso! 🙌");
      
    } catch (err) {
      console.error("⚠️ Erro inesperado:", err);
      alert("Ocorreu um erro ao enviar o pedido.");
    }
  }

  // Carrossel de banners
  const slider = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
  };
  const banners = [
    { src: "/banners/servicos-farmaceuticos.png", alt: "Serviços Farmacêuticos", link: "/servicos" },
    { src: "/banners/cadastro-drogaria.png", alt: "Cadastro Drogaria", link: "/cadastro-drogaria" },
    { src: "/banners/ecommerce.png", alt: "E-commerce", link: "/drogarias/drogariaredefabiano" },
    { src: "/banners/cadastro-farmaceutico.png", alt: "Cadastro Farmacêuticos", link: "/cadastro-farmaceutico" },
    { src: "/banners/herbamed.png", alt: "Produtos Naturais", link: "/produtos" },
    { src: "/banners/fraldas pom pom.png", alt: "Fraldas Pom Pom", link: "/categoria/promocoes" },
  ];

  // Produtos a exibir (20 + ver mais)
  const listaParaExibir = produtosFiltrados.slice(0, visiveis);

  return (
    <main className="w-full mx-auto bg-gray-50 pb-20">
      {/* 🔍 Busca */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex justify-center mt-4 mb-6 px-4"
      >
        <div className="flex w-full max-w-xl bg-white rounded-full shadow-md overflow-hidden border border-gray-200">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produtos..."
            className="flex-grow px-4 py-2 text-gray-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCarrinhoAberto(true)}
            className="bg-blue-700 text-white px-5 py-2 hover:bg-blue-800 transition-all"
            title="Abrir carrinho"
          >
            🛒
          </button>
        </div>
      </form>
{/* ===== CATEGORIAS ===== */}
<section className="bg-white shadow-sm py-3 border-t border-b border-gray-100">
  <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-2 sm:gap-4">
    {[
      { nome: "Genéricos", slug: "genericos", cor: "bg-yellow-100 hover:bg-yellow-200" },
      { nome: "Vitaminas", slug: "vitaminas", cor: "bg-green-100 hover:bg-green-200" },
      { nome: "Beleza", slug: "beleza", cor: "bg-pink-100 hover:bg-pink-200" },
      { nome: "Natural", slug: "natural", cor: "bg-teal-100 hover:bg-teal-200" },
      { nome: "Infantil", slug: "infantil", cor: "bg-blue-100 hover:bg-blue-200" },
      { nome: "Promoções", slug: "promocoes", cor: "bg-purple-100 hover:bg-purple-200" },
    ].map((cat) => (
  <button
    key={cat.slug}
    onClick={() => router.push(`/categoria/${cat.slug}`)}
    className={`${cat.cor} rounded-lg px-6 py-3 text-base sm:text-lg font-semibold text-gray-700 shadow hover:shadow-md cursor-pointer transition-all`}
  >
    {cat.nome}
  </button>
))}
  </div>
</section>
      {/* 🎞️ Carrossel */}
      <div className="max-w-5xl mx-auto px-4">
        <Slider {...slider}>
          {banners.map((banner, index) => (
            <div key={index} className="p-2">
              <a href={banner.link}>
                <img
                  src={banner.src}
                  alt={banner.alt}
                  className="w-full rounded-2xl shadow-lg object-cover transition-transform duration-300 hover:scale-[1.02]"
                />
              </a>
            </div>
          ))}
        </Slider>
      </div>

      {/* 👋 Boas-vindas */}
      <section className="text-center mt-8 mb-6 px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-700">Bem-vindo à IA Drogarias</h2>
        <p className="text-gray-600 text-sm md:text-base">Inteligência a serviço da sua saúde 💙</p>
      </section>


      {/* 🛍️ Produtos em destaque (20 + Ver mais) */}
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Produtos em destaque</h3>

        {carregando ? (
          <p className="text-center text-gray-500 py-10">Carregando produtos...</p>
        ) : listaParaExibir.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Nenhum produto encontrado.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
              {listaParaExibir.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg shadow p-2 sm:p-3 text-center hover:shadow-lg transition flex flex-col justify-between"
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
                  <p className="text-[11px] sm:text-xs text-gray-500">{p.categoria}</p>
                  <p className="text-sm sm:text-base font-bold text-green-600 mt-1">
                    R$ {fmt(Number(p.preco_venda))}
                  </p>
                  <button
                    onClick={() => adicionarAoCarrinho(p)}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded-md text-xs sm:text-sm font-medium transition"
                  >
                    Adicionar
                  </button>
                </div>
              ))}
            </div>

            {/* Botão "Ver mais produtos" */}
            {visiveis < produtosFiltrados.length && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisiveis((v) => v + 20)}
                  className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-full hover:bg-blue-800 transition-all"
                >
                  Ver mais produtos
                </button>
              </div>
            )}
          </>
        )}
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
                  <div className="text-xs text-gray-500">R$ {fmt(Number(i.preco_venda))}</div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => alterarQtd(i.id, i.quantidade - 1)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="min-w-[24px] text-center font-semibold text-sm">
                      {i.quantidade}
                    </span>
                    <button
                      onClick={() => alterarQtd(i.id, i.quantidade + 1)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm font-bold"
                    >
                      +
                    </button>
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
              className="w-full py-3 rounded text-white font-semibold bg-green-600 hover:bg-green-700"
            >
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>

      {/* 🧾 Modal de finalização */}
      {modalAberto && (
        <ModalFinalizar
          loja="Drogaria Rede Fabiano"
          whatsapp={WHATSAPP}
          pixChave={PIX_CHAVE}
          total={total}
          carrinho={carrinho}
          onConfirm={(cliente, pagamento) => {
            finalizarPedido(cliente, pagamento);
          }}
          onClose={() => setModalAberto(false)}
        />
      )}
    </main>
  );
}