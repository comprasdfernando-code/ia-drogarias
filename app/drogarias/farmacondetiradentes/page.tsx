"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  Search, Menu, MapPin, UserRound, ShoppingBasket, Heart,
  Truck, ShieldCheck, Headphones, ChevronRight, Tag, PackageSearch,
  Pill, Baby, Sparkles, HeartPulse, SlidersHorizontal, X,
} from "lucide-react";

const LOJA_SLUG = "farmacondetiradentes";
const LARANJA = "#F36B00";
const AZUL = "#082E9E";
const WHATSAPP_LOJA = "5511964213202";
const ITENS_POR_PAGINA = 30;
const LOTE_ESTOQUE = 500;
const LOTE_CATALOGO = 150;
const CATEGORIAS = ["Todos", "Medicamentos", "Dermocosméticos", "Mamãe e Bebê", "Saúde e Bem-estar", "Higiene", "Beleza"];

type Produto = {
  id: string;
  ean: string;
  nome: string;
  categoria: string | null;
  imagens: unknown;
  preco: number;
  estoque: number;
  promocao: boolean;
  precoPromocional: number | null;
};

type LinhaLoja = {
  produto_id: string;
  ean: string | null;
  estoque: number | null;
  preco_venda: number | null;
  preco_promocional: number | null;
  em_promocao: boolean | null;
};

type LinhaCatalogo = {
  id: string;
  ean: string;
  nome: string;
  categoria: string | null;
  imagens: unknown;
};

function primeiraImagem(valor: unknown): string | null {
  if (typeof valor === "string") {
    try { return primeiraImagem(JSON.parse(valor)); } catch { return /^https?:\/\//.test(valor) ? valor : null; }
  }
  if (Array.isArray(valor)) return valor.map(primeiraImagem).find(Boolean) ?? null;
  if (valor && typeof valor === "object") {
    const o = valor as Record<string, unknown>;
    return primeiraImagem(o.url ?? o.src ?? o.imagem ?? o.image);
  }
  return null;
}

const moeda = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FarmaCondeTiradentesHome() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [menuAberto, setMenuAberto] = useState(false);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [entrega, setEntrega] = useState<"retirada" | "entrega">("retirada");
  const [endereco, setEndereco] = useState("");
  const [pagamento, setPagamento] = useState("Pix");
  const [erroCheckout, setErroCheckout] = useState("");

  const itensCarrinho = useMemo(() => produtos.filter(p => (carrinho[p.id] ?? 0) > 0).map(p => {
    const precoUnitario = p.promocao && p.precoPromocional != null && p.precoPromocional > 0 && p.precoPromocional < p.preco ? p.precoPromocional : p.preco;
    return { ...p, quantidade: Math.min(carrinho[p.id], p.estoque), precoUnitario };
  }), [produtos, carrinho]);
  const quantidadeCarrinho = itensCarrinho.reduce((s, p) => s + p.quantidade, 0);
  const subtotal = itensCarrinho.reduce((s, p) => s + p.quantidade * p.precoUnitario, 0);
  function adicionar(p: Produto) {
    setCarrinho(prev => ({ ...prev, [p.id]: Math.min((prev[p.id] ?? 0) + 1, p.estoque) }));
    setCarrinhoAberto(true);
  }
  function ajustar(id: string, quantidade: number) {
    setCarrinho(prev => { const next = { ...prev }; if (quantidade <= 0) delete next[id]; else next[id] = quantidade; return next; });
  }
  function finalizarWhatsApp() {
    setErroCheckout("");
    if (!itensCarrinho.length) return setErroCheckout("Adicione produtos ao carrinho.");
    if (!cliente.trim()) return setErroCheckout("Informe seu nome.");
    if (!telefone.replace(/\D/g, "") || telefone.replace(/\D/g, "").length < 10) return setErroCheckout("Informe um telefone válido com DDD.");
    if (entrega === "entrega" && !endereco.trim()) return setErroCheckout("Informe o endereço completo para entrega.");
    const linhas = [
      "*PEDIDO — FARMA CONDE TIRADENTES*", "",
      ...itensCarrinho.flatMap((p, i) => [ `${i + 1}. ${p.nome}`, `EAN: ${p.ean}`, `${p.quantidade} x ${moeda(p.precoUnitario)} = ${moeda(p.quantidade * p.precoUnitario)}`, "" ]),
      `*Subtotal: ${moeda(subtotal)}*`,
      "*Frete: a confirmar com a loja*", "*Total final: a confirmar com a loja*", "",
      `Cliente: ${cliente.trim()}`, `Telefone: ${telefone.trim()}`,
      `Recebimento: ${entrega === "entrega" ? "Entrega" : "Retirada na loja"}`,
      ...(entrega === "entrega" ? [`Endereço: ${endereco.trim()}`] : []),
      `Pagamento pretendido: ${pagamento}`, "",
      "Pedido sujeito à confirmação de preço, estoque e disponibilidade pela loja."
    ];
    const url = `https://wa.me/${WHATSAPP_LOJA}?text=${encodeURIComponent(linhas.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setErro("");
      // Consulta todos os produtos liberados em lotes, evitando o limite padrão de 1.000 linhas do Supabase.
      // Os filtros de busca e categoria passam a alcançar o catálogo inteiro, não apenas os primeiros 60.
      const estoque: LinhaLoja[] = [];
      for (let inicio = 0; ; inicio += LOTE_ESTOQUE) {
        const { data, error: erroEstoque } = await supabase
          .from("fv_farmacia_produtos")
          .select("produto_id,ean,estoque,preco_venda,preco_promocional,em_promocao")
          .eq("farmacia_slug", LOJA_SLUG)
          .eq("ativo", true)
          .eq("ativo_site", true)
          .gt("estoque", 0)
          .gt("preco_venda", 0)
          .order("produto_id", { ascending: true })
          .range(inicio, inicio + LOTE_ESTOQUE - 1);
        if (!ativo) return;
        if (erroEstoque) {
          setErro("Não foi possível carregar o estoque. Confira as permissões de leitura no Supabase.");
          setCarregando(false);
          return;
        }
        const lote = (data ?? []) as LinhaLoja[];
        estoque.push(...lote);
        if (lote.length < LOTE_ESTOQUE) break;
      }
      if (!estoque.length) { setProdutos([]); setCarregando(false); return; }

      const ids = [...new Set(estoque.map(l => l.produto_id).filter(Boolean))];
      const catalogoCompleto: LinhaCatalogo[] = [];
      for (let inicio = 0; inicio < ids.length; inicio += LOTE_CATALOGO) {
        const { data, error: erroCatalogo } = await supabase
          .from("fv_produtos")
          .select("id,ean,nome,categoria,imagens")
          .in("id", ids.slice(inicio, inicio + LOTE_CATALOGO));
        if (!ativo) return;
        if (erroCatalogo) {
          setErro("Não foi possível consultar o catálogo de produtos.");
          setCarregando(false);
          return;
        }
        catalogoCompleto.push(...((data ?? []) as LinhaCatalogo[]));
      }
      const porId = new Map(catalogoCompleto.map(p => [p.id, p]));
      setProdutos(estoque.flatMap(l => {
        const p = porId.get(l.produto_id);
        if (!p) return [];
        return [{
          id: p.id, ean: p.ean, nome: p.nome, categoria: p.categoria,
          imagens: p.imagens, preco: Number(l.preco_venda ?? 0),
          estoque: Number(l.estoque ?? 0), promocao: Boolean(l.em_promocao),
          precoPromocional: l.preco_promocional == null ? null : Number(l.preco_promocional),
        }];
      }));
      setCarregando(false);
    }
    void carregar();
    return () => { ativo = false; };
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return produtos.filter((p) => {
      const correspondeBusca = !termo || p.nome.toLocaleLowerCase("pt-BR").includes(termo) || p.ean.includes(termo);
      const correspondeCategoria = categoria === "Todos" || (p.categoria ?? "").toLocaleLowerCase("pt-BR").includes(categoria.toLocaleLowerCase("pt-BR"));
      return correspondeBusca && correspondeCategoria;
    });
  }, [busca, categoria, produtos]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const produtosDaPagina = filtrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);
  function irParaPagina(novaPagina: number) {
    setPagina(Math.max(1, Math.min(totalPaginas, novaPagina)));
    document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <div className="bg-[#082E9E] px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm">
        <span className="inline-flex items-center gap-2"><Truck size={16} /> Farma Conde Tiradentes — saúde e cuidado perto de você</span>
      </div>
      <header className="bg-[#F36B00] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 lg:flex-nowrap lg:gap-6">
          <Link href="/drogarias/farmacondetiradentes" className="flex shrink-0 flex-col leading-none" aria-label="Farma Conde Tiradentes - início">
            <span className="rounded-md border-2 border-white px-2 py-1 text-xl font-black tracking-tight sm:text-2xl">FARMA<span className="text-[#082E9E]">+</span>CONDE</span>
            <span className="mt-1 text-center text-[9px] font-bold uppercase tracking-[0.19em]">Tiradentes</span>
          </Link>
          <label className="order-3 flex w-full flex-1 items-center gap-3 rounded-full bg-white px-5 py-3 text-slate-700 shadow-sm lg:order-none lg:min-w-[300px]" aria-label="Pesquisar produtos">
            <Search size={21} className="shrink-0 text-[#F36B00]" />
            <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="O que você busca? Ex.: vitamina, fralda, EAN" className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-500" />
            {busca && <button type="button" onClick={() => { setBusca(""); setPagina(1); }} aria-label="Limpar busca"><X size={18}/></button>}
          </label>
          <div className="ml-auto flex items-center gap-4 text-sm font-semibold lg:ml-0">
            <span className="hidden items-center gap-2 md:flex"><MapPin size={21}/> Informe seu CEP</span>
            <span className="hidden items-center gap-2 sm:flex"><UserRound size={22}/> Minha conta</span>
            <Heart size={23} aria-label="Favoritos em breve" />
            <button type="button" onClick={() => setCarrinhoAberto(true)} className="relative" aria-label="Abrir carrinho"><ShoppingBasket size={26}/><span className="absolute -right-2 -top-2 rounded-full bg-[#082E9E] px-1.5 text-[10px]">{quantidadeCarrinho}</span></button>
          </div>
        </div>
      </header>
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <button type="button" onClick={() => setMenuAberto(!menuAberto)} className="flex shrink-0 items-center gap-2 font-semibold text-[#082E9E]" aria-expanded={menuAberto}>
            <Menu size={24}/> <span className="hidden sm:inline">Todas as categorias</span>
          </button>
          <div className="flex flex-1 gap-6 overflow-x-auto whitespace-nowrap text-sm font-semibold text-[#082E9E]">
            {CATEGORIAS.slice(1).map((c) => <button type="button" key={c} onClick={() => { setCategoria(c); setPagina(1); }} className={`pb-1 hover:text-[#F36B00] ${categoria === c ? "border-b-2 border-[#F36B00] text-[#F36B00]" : ""}`}>{c}</button>)}
          </div>
        </div>
        {menuAberto && <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 border-t px-4 py-3 sm:grid-cols-4">{CATEGORIAS.map((c) => <button key={c} type="button" onClick={() => {setCategoria(c); setPagina(1); setMenuAberto(false);}} className="rounded-lg p-2 text-left text-sm hover:bg-orange-50">{c}</button>)}</div>}
      </nav>

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:pt-9">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#F36B00] via-[#ff841f] to-[#ffb45e] px-6 py-9 text-white shadow-md sm:px-12 sm:py-14">
          <div className="relative z-10 max-w-xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wide"><Sparkles size={15}/> Bem-vindo à Farma Conde Tiradentes</span>
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">Cuidar de você<br/><span className="text-[#082E9E]">é a nossa prioridade.</span></h1>
            <p className="mt-4 max-w-md text-sm font-medium sm:text-base">Medicamentos, cuidados diários, beleza e bem-estar em um só lugar.</p>
            <a href="#produtos" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#082E9E] px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-950">Ver produtos <ChevronRight size={18}/></a>
          </div>
          <div className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full border-[40px] border-white/20 sm:h-96 sm:w-96" />
          <div className="pointer-events-none absolute right-20 top-10 hidden h-28 w-28 rotate-12 rounded-3xl bg-white/15 sm:block" />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-6 sm:grid-cols-3">
        {[{icon:Truck,t:"Comodidade",d:"Consulte os produtos sem sair de casa"},{icon:ShieldCheck,t:"Cuidado e confiança",d:"Atendimento de uma farmácia de verdade"},{icon:Headphones,t:"Atendimento",d:"Suporte da equipe da loja"}].map(({icon:Icon,t,d}) => <div key={t} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"><div className="rounded-xl bg-orange-50 p-3 text-[#F36B00]"><Icon size={23}/></div><div><h3 className="font-bold text-[#082E9E]">{t}</h3><p className="text-xs text-slate-500">{d}</p></div></div>)}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6">
        <h2 className="mb-4 text-xl font-black text-[#082E9E] sm:text-2xl">Encontre o que você precisa</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[{t:"Medicamentos",i:Pill},{t:"Mamãe e Bebê",i:Baby},{t:"Beleza",i:Sparkles},{t:"Saúde e Bem-estar",i:HeartPulse}].map(({t,i:Icon}) => <button key={t} type="button" onClick={() => { setCategoria(t); setPagina(1); }} className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-4 text-left font-bold text-[#082E9E] transition hover:border-[#F36B00] hover:shadow-md"><Icon className="shrink-0 text-[#F36B00]" size={25}/><span className="text-sm">{t}</span></button>)}
        </div>
      </section>

      <section id="produtos" className="mx-auto max-w-7xl px-4 pb-16 pt-4">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#F36B00]"><Tag size={14}/> Vitrine da loja</span><h2 className="text-2xl font-black text-[#082E9E]">Produtos da Farma Conde</h2></div>
          <button type="button" onClick={() => {setCategoria("Todos");setBusca("");setPagina(1);}} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#082E9E]"><SlidersHorizontal size={17}/> Limpar filtros</button>
        </div>
        {carregando ? <p className="rounded-2xl bg-white p-10 text-center text-slate-600">Carregando catálogo completo, aguarde...</p> : erro ? <p role="alert" className="rounded-2xl bg-white p-10 text-center text-red-700">{erro}</p> : filtrados.length === 0 ? <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><PackageSearch size={42} className="text-[#F36B00]"/><h3 className="text-lg font-bold text-[#082E9E]">Nenhum produto disponível nesta seleção</h3><p className="max-w-lg text-sm text-slate-500">A vitrine exibe apenas produtos com estoque, preço e liberação para venda no site. Se a loja ainda está em preparação, os produtos permanecerão ocultos.</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{produtosDaPagina.map((p) => {
          const imagem = primeiraImagem(p.imagens);
          const promo = p.promocao && p.precoPromocional != null && p.precoPromocional > 0 && p.precoPromocional < p.preco;
          return <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:shadow-md">
            <div className="relative flex aspect-square items-center justify-center rounded-xl bg-slate-50 p-4">{imagem ? <img src={imagem} alt={p.nome} loading="lazy" className="h-full w-full object-contain"/> : <Pill size={48} className="text-slate-300"/>}{promo && <span className="absolute left-2 top-2 rounded-full bg-[#F36B00] px-2 py-1 text-[10px] font-bold text-white">OFERTA</span>}</div>
            <p className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold">{p.nome}</p><p className="mt-1 text-[11px] text-slate-400">EAN: {p.ean}</p>
            <div className="mt-auto pt-3">{promo && <p className="text-xs text-slate-400 line-through">{moeda(p.preco)}</p>}<p className="text-xl font-black text-[#082E9E]">{moeda(promo ? p.precoPromocional! : p.preco)}</p><p className="mt-1 text-xs text-emerald-700">Em estoque</p><div className="mt-3 flex items-center justify-between gap-2 rounded-full border border-orange-200 bg-orange-50 p-1">
              <button type="button" onClick={() => ajustar(p.id, Math.max(0, (carrinho[p.id] ?? 0) - 1))} disabled={!carrinho[p.id]} aria-label={`Diminuir quantidade de ${p.nome}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-[#F36B00] shadow-sm disabled:opacity-40">−</button>
              <span className="min-w-6 text-center text-sm font-black text-[#082E9E]" aria-live="polite">{carrinho[p.id] ?? 0}</span>
              <button type="button" onClick={() => ajustar(p.id, Math.min(p.estoque, (carrinho[p.id] ?? 0) + 1))} disabled={(carrinho[p.id] ?? 0) >= p.estoque} aria-label={`Aumentar quantidade de ${p.nome}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F36B00] text-xl font-bold text-white disabled:opacity-40">+</button>
            </div>
            {(carrinho[p.id] ?? 0) > 0 && <button type="button" onClick={() => setCarrinhoAberto(true)} className="mt-2 w-full rounded-full bg-[#082E9E] py-2 text-xs font-bold text-white">Ver cesta</button>}</div>
          </article>;
        })}</div>}
        {!carregando && !erro && filtrados.length > 0 && (
          <div className="mt-8 flex flex-col items-center gap-4" aria-label="Paginação de produtos">
            <p className="text-center text-sm text-slate-600">
              Mostrando {(paginaAtual - 1) * ITENS_POR_PAGINA + 1}–{Math.min(paginaAtual * ITENS_POR_PAGINA, filtrados.length)} de {filtrados.length.toLocaleString("pt-BR")} produtos
            </p>
            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" disabled={paginaAtual === 1} onClick={() => irParaPagina(paginaAtual - 1)} className="rounded-full border bg-white px-4 py-2 text-sm font-bold text-[#082E9E] disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const inicio = Math.max(1, Math.min(totalPaginas - 4, paginaAtual - 2));
                  const numero = inicio + i;
                  return <button type="button" key={numero} onClick={() => irParaPagina(numero)} aria-current={paginaAtual === numero ? "page" : undefined} className={`h-10 min-w-10 rounded-full border px-3 text-sm font-bold ${paginaAtual === numero ? "border-[#F36B00] bg-[#F36B00] text-white" : "bg-white text-[#082E9E]"}`}>{numero}</button>;
                })}
                <button type="button" disabled={paginaAtual === totalPaginas} onClick={() => irParaPagina(paginaAtual + 1)} className="rounded-full border bg-white px-4 py-2 text-sm font-bold text-[#082E9E] disabled:cursor-not-allowed disabled:opacity-40">Próxima</button>
              </div>
            )}
          </div>
        )}
      </section>
      {carrinhoAberto && <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
        <button type="button" className="absolute inset-0 cursor-default" aria-label="Fechar carrinho" onClick={() => setCarrinhoAberto(false)} />
        <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-[#F36B00] px-5 py-4 text-white"><h2 className="text-lg font-black">Meu carrinho ({quantidadeCarrinho})</h2><button type="button" onClick={() => setCarrinhoAberto(false)} aria-label="Fechar"><X /></button></div>
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {itensCarrinho.length === 0 ? <p className="text-center text-slate-500">Seu carrinho está vazio.</p> : <>
              <div className="space-y-3">{itensCarrinho.map(p => <div key={p.id} className="rounded-xl border p-3"><p className="text-sm font-semibold">{p.nome}</p><p className="text-xs text-slate-500">EAN {p.ean}</p><div className="mt-2 flex items-center justify-between"><span className="font-bold text-[#082E9E]">{moeda(p.precoUnitario * p.quantidade)}</span><div className="flex items-center gap-3"><button type="button" onClick={() => ajustar(p.id, p.quantidade - 1)} className="rounded border px-3 py-1" aria-label={`Diminuir ${p.nome}`}>−</button><span>{p.quantidade}</span><button type="button" disabled={p.quantidade >= p.estoque} onClick={() => ajustar(p.id, p.quantidade + 1)} className="rounded border px-3 py-1 disabled:opacity-40" aria-label={`Aumentar ${p.nome}`}>+</button></div></div></div>)}</div>
              <div className="border-t pt-4"><div className="flex justify-between text-lg font-black"><span>Subtotal</span><span>{moeda(subtotal)}</span></div><p className="mt-1 text-xs text-slate-500">Frete e valor final serão confirmados pela loja no WhatsApp.</p></div>
              <div className="space-y-3 border-t pt-4"><h3 className="font-bold text-[#082E9E]">Dados para finalizar</h3>
                <label className="block text-sm font-medium">Nome completo<input value={cliente} onChange={e => setCliente(e.target.value)} className="mt-1 w-full rounded-lg border p-3" placeholder="Seu nome" /></label>
                <label className="block text-sm font-medium">WhatsApp com DDD<input value={telefone} onChange={e => setTelefone(e.target.value)} className="mt-1 w-full rounded-lg border p-3" placeholder="(11) 99999-9999" inputMode="tel" /></label>
                <label className="block text-sm font-medium">Recebimento<select value={entrega} onChange={e => setEntrega(e.target.value as "entrega" | "retirada")} className="mt-1 w-full rounded-lg border p-3"><option value="retirada">Retirar na loja</option><option value="entrega">Receber por entrega</option></select></label>
                {entrega === "entrega" && <label className="block text-sm font-medium">Endereço completo<input value={endereco} onChange={e => setEndereco(e.target.value)} className="mt-1 w-full rounded-lg border p-3" placeholder="Rua, número, bairro, CEP e complemento" /></label>}
                <label className="block text-sm font-medium">Forma de pagamento pretendida<select value={pagamento} onChange={e => setPagamento(e.target.value)} className="mt-1 w-full rounded-lg border p-3"><option>Pix</option><option>Cartão</option><option>Dinheiro</option></select></label>
              </div>
              {erroCheckout && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erroCheckout}</p>}
            </>}
          </div>
          <div className="border-t bg-white p-5"><button type="button" disabled={!itensCarrinho.length} onClick={finalizarWhatsApp} className="w-full rounded-full bg-[#F36B00] px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50">Enviar pedido para o WhatsApp da loja</button><p className="mt-2 text-center text-xs text-slate-500">O pedido será enviado para (11) 96421-3202. A venda só é confirmada pela equipe.</p></div>
        </aside>
      </div>}
      <footer className="border-t-4 border-[#F36B00] bg-[#082E9E] px-4 py-8 text-center text-sm text-white"><p className="font-black">FARMA + CONDE | TIRADENTES</p><p className="mt-2 text-blue-100">Sua saúde merece atenção especial.</p><p className="mt-3 text-xs text-blue-200">Página em implantação • preços e disponibilidade sujeitos à confirmação da loja</p></footer>
    </main>
  );
}
