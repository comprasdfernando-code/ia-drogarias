// app/dfdistribuidora/pdv/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   CONFIG
========================= */
const PROD_TABLE = "df_produtos";
const RPC_SEARCH = "df_search_produtos"; // se não existir, fallback
const WHATS = "5511952068432";
const TAXA_ENTREGA_FIXA = 10;

const HOME_LIMIT = 10;        // ✅ deixa leve
const SEARCH_LIMIT = 80;      // ✅ resultados da busca
const SEARCH_DEBOUNCE = 350;  // ms

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
  destaque_home: boolean | null;
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
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  return imagens?.[0] || "/produtos/caixa-padrao.png";
}

function calcOff(pmc?: number | null, promo?: number | null) {
  const a = Number(pmc || 0);
  const b = Number(promo || 0);
  if (!a || !b || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
}

function precoFinal(p: DFProduto) {
  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);
  const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);
  const final = emPromo ? promo : pmc;
  const off = emPromo ? (p.percentual_off && p.percentual_off > 0 ? p.percentual_off : calcOff(pmc, promo)) : 0;
  return { emPromo, final, pmc, promo, off };
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function waLink(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

/* =========================
   COMPONENTE
========================= */
export default function PDVDF() {
  // ✅ home leve
  const [home, setHome] = useState<DFProduto[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);

  // ✅ busca remota (todo banco)
  const [busca, setBusca] = useState("");
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [resultado, setResultado] = useState<DFProduto[]>([]);

  // carrinho
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // checkout
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [tipoEntrega, setTipoEntrega] = useState<"ENTREGA" | "RETIRADA">("ENTREGA");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");

  const [pagamento, setPagamento] = useState<"PIX" | "CARTAO" | "DINHEIRO" | "COMBINAR">("PIX");
  const taxaEntrega = tipoEntrega === "ENTREGA" ? TAXA_ENTREGA_FIXA : 0;

  const isSearching = !!busca.trim();

  /* =========================
     HOME (10 itens)
  ========================= */
  useEffect(() => {
    async function loadHome() {
      try {
        setLoadingHome(true);

        // ✅ pega poucos e bons: destaque/promo primeiro, depois nome
        const { data, error } = await supabase
          .from(PROD_TABLE)
          .select("id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens")
          .eq("ativo", true)
          .order("destaque_home", { ascending: false })
          .order("em_promocao", { ascending: false })
          .order("nome", { ascending: true })
          .limit(HOME_LIMIT);

        if (error) throw error;
        setHome(((data || []) as DFProduto[]) ?? []);
      } catch (e) {
        console.error("Erro loadHome:", e);
        setHome([]);
      } finally {
        setLoadingHome(false);
      }
    }

    loadHome();
  }, []);

  /* =========================
     BUSCA REMOTA (todo banco)
  ========================= */
  useEffect(() => {
    async function run() {
      const raw = busca.trim();
      if (!raw) {
        setResultado([]);
        return;
      }

      setLoadingBusca(true);

      try {
        const normalized = raw
          .toLowerCase()
          .replace(/(\d+)\s*(mg|ml|mcg|g|ui|iu)/gi, "$1 $2")
          .replace(/\s+/g, " ")
          .trim();

        // 1) tenta RPC (se você criar a função)
        const { data, error } = await supabase.rpc(RPC_SEARCH, { q: normalized, lim: SEARCH_LIMIT });
        if (error) throw error;

        setResultado(((data || []) as DFProduto[]) ?? []);
      } catch (e) {
        // 2) fallback sem RPC (funciona sempre)
        try {
          const digits = onlyDigits(raw);

          let query = supabase
            .from(PROD_TABLE)
            .select("id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens")
            .eq("ativo", true)
            .limit(SEARCH_LIMIT);

          if (digits.length >= 8 && digits.length <= 14) {
            query = query.or(`ean.eq.${digits},nome.ilike.%${raw}%`);
          } else {
            query = query.ilike("nome", `%${raw}%`);
          }

          const { data, error } = await query.order("em_promocao", { ascending: false }).order("nome", { ascending: true });
          if (error) throw error;

          setResultado(((data || []) as DFProduto[]) ?? []);
        } catch (e2) {
          console.error("Erro fallback busca:", e2);
          setResultado([]);
        }
      } finally {
        setLoadingBusca(false);
      }
    }

    const t = setTimeout(run, SEARCH_DEBOUNCE);
    return () => clearTimeout(t);
  }, [busca]);

  /* =========================
     CARRINHO
  ========================= */
  function addProduto(p: DFProduto) {
    const pr = precoFinal(p);
    const preco = Number(pr.final || 0);

    setCarrinho((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qtd: copy[idx].qtd + 1, preco };
        return copy;
      }
      return [
        ...prev,
        { id: p.id, ean: p.ean, nome: p.nome, imagem: firstImg(p.imagens), preco, qtd: 1 },
      ];
    });
  }

  function inc(id: string) {
    setCarrinho((prev) => prev.map((x) => (x.id === id ? { ...x, qtd: x.qtd + 1 } : x)));
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

  const subtotal = useMemo(() => carrinho.reduce((a, b) => a + b.preco * b.qtd, 0), [carrinho]);
  const total = subtotal + taxaEntrega;

  const qtdCarrinho = useMemo(() => carrinho.reduce((acc, it) => acc + it.qtd, 0), [carrinho]);

  /* =========================
     WHATS
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
  }, [carrinho, clienteNome, clienteTelefone, tipoEntrega, endereco, numero, bairro, pagamento, subtotal, total, taxaEntrega]);

  const lista = isSearching ? resultado : home;

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      {/* LOGO */}
      <div className="flex justify-center mb-4">
        <Image src="/df-distribuidora-logo.png" alt="DF Distribuidora" width={120} height={120} />
      </div>

      <h1 className="text-2xl font-extrabold text-center mb-4">PDV — DF Distribuidora</h1>

      {/* BUSCA */}
      <div className="relative">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto ou EAN..."
          className="w-full p-3 border rounded-2xl mb-2 outline-none focus:ring-4 focus:ring-blue-100"
        />
        {busca.trim() ? (
          <button
            onClick={() => setBusca("")}
            className="absolute right-2 top-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-extrabold"
          >
            Limpar
          </button>
        ) : null}
      </div>

      {isSearching ? (
        <div className="text-xs text-gray-500 mb-3">
          {loadingBusca ? "Buscando…" : resultado.length ? `${resultado.length} resultado(s)` : "Nenhum resultado"}
        </div>
      ) : (
        <div className="text-xs text-gray-500 mb-3">
          {loadingHome ? "Carregando vitrine…" : `Vitrine leve: ${home.length} itens`}
        </div>
      )}

      {/* LISTA (10 no home / até SEARCH_LIMIT na busca) */}
      <div className="space-y-3">
        {(loadingHome && !isSearching) ? (
          <div className="bg-white border rounded-2xl p-4 text-gray-600">Carregando…</div>
        ) : (
          lista.map((p) => {
            const pr = precoFinal(p);
            return (
              <div key={p.id} className="bg-white p-3 rounded-2xl border flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-gray-50 border overflow-hidden flex items-center justify-center">
                    <Image src={firstImg(p.imagens)} alt={p.nome} width={48} height={48} className="object-contain" />
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold line-clamp-1">{p.nome}</div>
                    <div className="text-blue-700 font-extrabold">
                      {brl(pr.final)}
                      {pr.emPromo && pr.off > 0 ? (
                        <span className="ml-2 text-[11px] font-extrabold bg-red-600 text-white px-2 py-1 rounded-full">
                          {pr.off}% OFF
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-1">
                      {p.laboratorio || "—"} {p.apresentacao ? `• ${p.apresentacao}` : ""}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => addProduto(p)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-extrabold"
                >
                  +
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* BOTÃO CARRINHO */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-full font-extrabold shadow-lg"
      >
        🛒 Carrinho ({qtdCarrinho})
      </button>

      {/* DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />

          <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white p-4 overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">Carrinho</h2>
              <button onClick={() => setDrawerOpen(false)} className="px-3 py-2 rounded-xl border font-extrabold">
                Continuar comprando
              </button>
            </div>

            <div className="mt-4">
              {carrinho.length === 0 ? (
                <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">Seu carrinho está vazio.</div>
              ) : (
                carrinho.map((i) => (
                  <div key={i.id} className="border rounded-xl p-3 mb-2">
                    <div className="font-bold">{i.nome}</div>
                    <div className="text-sm text-gray-600">{brl(i.preco)}</div>

                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => dec(i.id)} className="px-3 py-1 bg-gray-200 rounded font-extrabold">-</button>
                      <span className="font-extrabold">{i.qtd}</span>
                      <button onClick={() => inc(i.id)} className="px-3 py-1 bg-blue-600 text-white rounded font-extrabold">+</button>

                      <button onClick={() => remove(i.id)} className="ml-auto text-red-600 font-extrabold">
                        Excluir
                      </button>
                    </div>

                    <div className="mt-2 font-extrabold text-blue-900">
                      Total item: {brl(i.preco * i.qtd)}
                    </div>
                  </div>
                ))
              )}
            </div>

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
                className={`px-3 py-2 mr-2 rounded ${tipoEntrega === "ENTREGA" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                Entrega
              </button>
              <button
                onClick={() => setTipoEntrega("RETIRADA")}
                className={`px-3 py-2 rounded ${tipoEntrega === "RETIRADA" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
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
                  <div className="text-sm font-bold">Taxa fixa: {brl(taxaEntrega)}</div>
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
                  className={`px-3 py-2 mr-2 mb-2 rounded ${pagamento === p ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* TOTAL */}
            <div className="mt-4 border-t pt-3">
              <div>Subtotal: {brl(subtotal)}</div>
              <div>Taxa: {brl(taxaEntrega)}</div>
              <div className="font-extrabold text-lg">Total: {brl(total)}</div>
            </div>

            <a
              href={waLink(WHATS, mensagem)}
              target="_blank"
              rel="noreferrer"
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
