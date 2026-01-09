"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOJA_SLUG = "drogariaredefabiano";
const SENHA_ADMIN = "102030";

type FVProduto = {
  id: string;
  ean: string;
  nome: string;
  categoria: string | null;
  laboratorio: string | null;
  pmc: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  imagens: string[] | null;
  ativo: boolean | null;
};

type LojaProduto = {
  produto_id: string;
  farmacia_slug: string;
  estoque: number | null;
  preco_venda: number | null;
  ativo: boolean | null;
};

type ProdutoBusca = {
  id: string;
  ean: string;
  nome: string;
  categoria: string | null;
  imagem: string;
  estoque: number;
  preco_venda: number;
};

type ItemVenda = ProdutoBusca & {
  qtd: number;
  desconto: number; // %
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function brl(n: number) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function precoGlobalFinal(p: FVProduto) {
  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);
  const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);
  const final = emPromo ? promo : pmc;
  return Number(final || 0);
}

/** Blindagem: garante array mesmo se vier string/json/objeto */
function asArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  if (value && typeof value === "object") {
    const vals = Object.values(value);
    return Array.isArray(vals) ? (vals as T[]) : [];
  }

  return [];
}

export default function PDVPageFabiano() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ProdutoBusca[]>([]);
  const [venda, setVenda] = useState<ItemVenda[]>([]);
  const [total, setTotal] = useState(0);
  const [showPagamento, setShowPagamento] = useState(false);

  const [senha, setSenha] = useState("");
  const [mostrarVendas, setMostrarVendas] = useState(false);
  const [vendas, setVendas] = useState<any[]>([]);
  const [vendaSelecionada, setVendaSelecionada] = useState<any | null>(null);
  const [filtroData, setFiltroData] = useState("");

  const [pagamento, setPagamento] = useState<any>({
    tipo: "Balcão",
    forma: "",
    dinheiro: "",
    troco: "0.00",
    nome: "",
    telefone: "",
    endereco: "",
  });

  // ==========================
  // CÁLCULOS
  // ==========================
  function calcularTotal(lista: ItemVenda[]) {
    const soma = lista.reduce((acc, p) => {
      const unit =
        Number(p.preco_venda || 0) -
        Number(p.preco_venda || 0) * (Number(p.desconto || 0) / 100);
      return acc + Number(p.qtd || 0) * unit;
    }, 0);
    setTotal(Number(soma || 0));
  }

  function limparVenda() {
    setVenda([]);
    setTotal(0);
    setResultados([]);
    setBusca("");
    setPagamento((prev: any) => ({
      ...prev,
      forma: "",
      dinheiro: "",
      troco: "0.00",
      nome: "",
      telefone: "",
      endereco: "",
    }));
    inputRef.current?.focus();
  }

  // ==========================
  // BUSCA GLOBAL + ESTOQUE LOJA
  // ==========================
  async function buscarProduto(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;

    const termo = busca.trim();
    if (!termo) return;

    const digits = onlyDigits(termo);
    const termoSemEspaco = termo.replace(/\s/g, "");

    try {
      let q1 = supabase
        .from("fv_produtos")
        .select(
          "id,ean,nome,categoria,laboratorio,pmc,em_promocao,preco_promocional,percentual_off,imagens,ativo"
        )
        .eq("ativo", true)
        .limit(30);

      if (digits.length >= 8 && digits.length <= 14 && digits === termoSemEspaco) {
        q1 = q1.eq("ean", digits);
      } else if (digits.length >= 8 && digits.length <= 14) {
        q1 = q1.or(`ean.eq.${digits},nome.ilike.%${termo}%`);
      } else {
        q1 = q1.ilike("nome", `%${termo}%`);
      }

      const { data: cat, error: eCat } = await q1;
      if (eCat) throw eCat;

      const catArr = (cat ?? []) as FVProduto[];

      if (catArr.length === 0) {
        alert("Produto não encontrado no catálogo global.");
        setResultados([]);
        setBusca("");
        return;
      }

      const ids = catArr.map((p) => p.id);

      // ✅ sua tabela real (pela sua view): fv_farmacia_produtos
      const { data: loja, error: eLoja } = await supabase
        .from("fv_farmacia_produtos")
        .select("produto_id,farmacia_slug,estoque,preco_venda,ativo")
        .eq("farmacia_slug", LOJA_SLUG)
        .in("produto_id", ids);

      if (eLoja) throw eLoja;

      const mapLoja = new Map<string, LojaProduto>();
      (loja ?? []).forEach((r: any) => {
        mapLoja.set(String(r.produto_id), {
          produto_id: String(r.produto_id),
          farmacia_slug: String(r.farmacia_slug),
          estoque: r.estoque,
          preco_venda: r.preco_venda,
          ativo: r.ativo,
        });
      });

      // ✅ aqui é o ponto que estava dando erro no seu VSCode
      const out: ProdutoBusca[] = catArr
        .map((p) => {
          const lp = mapLoja.get(String(p.id));

          // se não tem registro da loja, consideramos sem estoque (indisponível)
          const ativoLoja = lp?.ativo !== null && lp?.ativo !== undefined ? !!lp.ativo : true;
          const estoque = Number(lp?.estoque || 0);
          const estoqueFinal = ativoLoja ? estoque : 0;

          const precoLoja = lp?.preco_venda != null ? Number(lp.preco_venda) : null;
          const precoGlobal = precoGlobalFinal(p);
          const precoFinal = precoLoja && precoLoja > 0 ? precoLoja : precoGlobal;

          return {
            id: String(p.id),
            ean: String(p.ean || ""),
            nome: String(p.nome || ""),
            categoria: p.categoria ?? null,
            imagem: firstImg(p.imagens),
            estoque: Number(estoqueFinal || 0),
            preco_venda: Number(precoFinal || 0),
          };
        })
        .sort((a, b) => b.estoque - a.estoque);

      setResultados(out);
      setBusca("");
      inputRef.current?.focus();
    } catch (err: any) {
      console.error("Erro buscarProduto:", err);
      alert(err?.message || "Erro ao buscar produto.");
    }
  }

  // ==========================
  // VENDA
  // ==========================
  function adicionarProduto(produto: ProdutoBusca) {
    if (!produto || produto.estoque <= 0) {
      alert("Sem estoque para este item.");
      return;
    }

    setVenda((prev) => {
      const existe = prev.find((p) => p.id === produto.id);
      let nova: ItemVenda[];

      if (existe) {
        if (existe.qtd + 1 > produto.estoque) {
          alert("Quantidade maior que o estoque disponível.");
          return prev;
        }
        nova = prev.map((p) => (p.id === produto.id ? { ...p, qtd: p.qtd + 1 } : p));
      } else {
        nova = [...prev, { ...produto, qtd: 1, desconto: 0 }];
      }

      calcularTotal(nova);
      return nova;
    });

    setResultados([]);
    inputRef.current?.focus();
  }

  function alterarQtd(id: string, delta: number) {
    setVenda((prev) => {
      const nova = prev.map((p) => {
        if (p.id !== id) return p;
        const qtd = Math.max(1, p.qtd + delta);
        if (qtd > p.estoque) return p;
        return { ...p, qtd };
      });
      calcularTotal(nova);
      return nova;
    });
  }

  function alterarDesconto(id: string, valor: number) {
    const v = Math.min(100, Math.max(0, Number(valor || 0)));
    setVenda((prev) => {
      const nova = prev.map((p) => (p.id === id ? { ...p, desconto: v } : p));
      calcularTotal(nova);
      return nova;
    });
  }

  function calcularTroco(valor: string) {
    const recebido = Number(valor || 0);
    const troco = recebido - total;
    setPagamento((prev: any) => ({
      ...prev,
      dinheiro: valor,
      troco: troco > 0 ? troco.toFixed(2) : "0.00",
    }));
  }

  // ==========================
  // BAIXA ESTOQUE (fv_farmacia_produtos)
  // ==========================
  async function baixarEstoque(vendaAtual: ItemVenda[]) {
    for (const item of vendaAtual) {
      const { data: lp, error: e1 } = await supabase
        .from("fv_farmacia_produtos")
        .select("produto_id, estoque")
        .eq("farmacia_slug", LOJA_SLUG)
        .eq("produto_id", item.id)
        .maybeSingle();

      if (e1) {
        console.warn("Erro buscar estoque:", e1);
        continue;
      }
      if (!lp) {
        console.warn("Produto não existe em fv_farmacia_produtos:", item.nome);
        continue;
      }

      const atual = Number(lp.estoque || 0);
      const novo = Math.max(0, atual - Number(item.qtd || 0));

      const { error: e2 } = await supabase
        .from("fv_farmacia_produtos")
        .update({ estoque: novo })
        .eq("farmacia_slug", LOJA_SLUG)
        .eq("produto_id", item.id);

      if (e2) console.warn("Erro baixar estoque:", e2);
    }
  }

  // ==========================
  // COMANDA (blindada)
  // ==========================
  function imprimirComanda(v: any) {
    const win = window.open("", "_blank");
    if (!win) return;

    const dtRaw = v?.created_at || v?.finalizada_em || new Date().toISOString();
    const data = new Date(dtRaw).toLocaleDateString("pt-BR");
    const hora = new Date(dtRaw).toLocaleTimeString("pt-BR");

    const itens = asArray<any>(v?.itens);

    win.document.write(`
      <html>
        <head>
          <title>Comanda - Drogaria Rede Fabiano</title>
          <style>
            body { font-family: "Courier New", monospace; width: 58mm; margin: 0 auto; padding: 6px; font-size: 12px; }
            .t { text-align:center; font-weight:700; }
            .l { border-top: 1px dashed #777; margin: 6px 0; }
            .row { display:flex; justify-content:space-between; gap:8px; }
            .muted { color:#555; font-size:11px; }
            .total { text-align:right; font-weight:700; margin-top:6px; }
          </style>
        </head>
        <body>
          <div class="t">💊 Drogaria Rede Fabiano</div>
          <div class="t muted">COMANDA / SEPARAÇÃO</div>
          <div class="l"></div>
          <div class="muted">
            <div>Data: ${data} ${hora}</div>
            <div>Origem: ${v?.origem || "PDV"}</div>
            <div>ID: ${String(v?.id || "").slice(0, 8)}</div>
            ${v?.cliente?.nome ? `<div>Cliente: ${v.cliente.nome}</div>` : ""}
            ${v?.cliente?.telefone ? `<div>Tel: ${v.cliente.telefone}</div>` : ""}
            ${v?.cliente?.endereco ? `<div>End: ${v.cliente.endereco}</div>` : ""}
          </div>
          <div class="l"></div>

          ${
            itens.length === 0
              ? `<div class="muted">Sem itens.</div>`
              : itens
                  .map(
                    (p: any) => `
                      <div class="row">
                        <span>${Number(p.qtd || 0)}x ${String(p.nome || "").slice(0, 22)}</span>
                        <span></span>
                      </div>
                      <div class="muted">${p.ean || ""}</div>
                    `
                  )
                  .join("")
          }

          <div class="l"></div>
          <div class="total">Total: ${brl(Number(v?.total || 0))}</div>
          <div class="l"></div>
          <div class="t muted">IA Drogarias • Saúde com Inteligência</div>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
  }

  // ==========================
  // FINALIZAR
  // ==========================
  async function finalizarVenda() {
    if (venda.length === 0) return;

    try {
      if (!pagamento.forma) {
        alert("Selecione a forma de pagamento.");
        return;
      }

      if (pagamento.forma === "Dinheiro") {
        const recebido = Number(pagamento.dinheiro || 0);
        if (recebido < total) {
          alert("Valor recebido menor que o total.");
          return;
        }
      }

      const itens = venda.map((p) => ({
        produto_id: p.id,
        ean: p.ean,
        nome: p.nome,
        qtd: Number(p.qtd || 1),
        preco_unit: Number(p.preco_venda || 0),
        desconto: Number(p.desconto || 0),
      }));

      const cliente =
        pagamento.tipo === "Entrega"
          ? {
              nome: pagamento.nome || "",
              telefone: pagamento.telefone || "",
              endereco: pagamento.endereco || "",
            }
          : null;

      const payload = {
        loja_slug: LOJA_SLUG,
        origem: "PDV",
        status: "FINALIZADA",
        cliente,
        pagamento: {
          tipo: pagamento.tipo,
          forma: pagamento.forma,
          dinheiro: pagamento.forma === "Dinheiro" ? Number(pagamento.dinheiro || 0) : null,
          troco: pagamento.forma === "Dinheiro" ? Number(pagamento.troco || 0) : null,
        },
        itens,
        total: Number(total || 0),
        finalizada_em: new Date().toISOString(),
      };

      const { data: saved, error } = await supabase
        .from("vendas")
        .insert([payload])
        .select("*")
        .single();

      if (error) throw error;

      await baixarEstoque(venda);
      imprimirComanda(saved);

      alert("✅ Venda finalizada e gravada!");
      setShowPagamento(false);
      limparVenda();
    } catch (err: any) {
      console.error("Erro finalizarVenda:", err);
      alert(err?.message || "Falha ao finalizar venda.");
    }
  }

  // ==========================
  // CONSULTA (admin)
  // ==========================
  async function carregarVendas(termo: string = "") {
  const termoLimpo = termo.trim();

  const query = supabase
    .from("fv_produtos_loja_view")
    .select(`
      produto_id,
      ean,
      nome,
      categoria,
      imagens,
      estoque,
      preco_venda,
      disponivel_farmacia
    `)
    .eq("farmacia_slug", LOJA_SLUG)
    .eq("disponivel_farmacia", true)
    .order("nome", { ascending: true })
    .limit(30);

  // só aplica o ilike se tiver termo
  if (termoLimpo) {
    query.ilike("nome", `%${termoLimpo}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    alert("Erro ao carregar vendas!");
    return;
  }

  setVendas(data || []);
}


  async function buscarPorData() {
    if (!filtroData) {
      alert("Selecione uma data.");
      return;
    }
    const { data, error } = await supabase
      .from("vendas")
      .select("*")
      .eq("loja_slug", LOJA_SLUG)
      .gte("created_at", `${filtroData}T00:00:00`)
      .lte("created_at", `${filtroData}T23:59:59`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao buscar por data!");
      return;
    }
    setVendas(data || []);
  }

  async function verificarSenha() {
    if (senha === SENHA_ADMIN) {
      setMostrarVendas(true);
      setSenha("");
      await carregarVendas();
    } else {
      alert("Senha incorreta!");
    }
  }

  // atalhos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "F2":
          e.preventDefault();
          inputRef.current?.focus();
          break;
        case "F3":
          e.preventDefault();
          limparVenda();
          break;
        case "F7":
          e.preventDefault();
          if (venda.length > 0) setShowPagamento(true);
          break;
        case "Escape":
          e.preventDefault();
          setShowPagamento(false);
          setResultados([]);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venda, total]);

  const totalItens = venda.reduce((acc, p) => acc + p.qtd, 0);

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">
          💻 PDV — Drogaria Rede Fabiano
        </h1>

        <div className="hidden sm:block bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-gray-700">
          <p className="font-semibold text-blue-700 mb-1">⌨️ Atalhos:</p>
          <p>F2 Buscar • F3 Limpar • F7 Finalizar • Esc Fechar</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder="Digite nome ou EAN e pressione Enter..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={buscarProduto}
        className="w-full border p-3 rounded-md mb-4 text-lg focus:outline-blue-600"
      />

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {resultados.map((p) => (
            <div key={p.id} className="border rounded-xl bg-white shadow-md p-4 flex flex-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imagem} alt={p.nome} className="w-full h-32 object-contain mb-3 rounded-md bg-gray-50" />
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{p.nome}</h3>
              <div className="text-xs text-gray-500 mb-2">
                {p.ean} • {p.categoria || "—"}
              </div>
              <span className={`text-xs mb-2 ${p.estoque > 0 ? "text-emerald-700" : "text-red-600"}`}>
                Estoque: {p.estoque}
              </span>
              <div className="text-blue-700 font-bold">{brl(p.preco_venda || 0)}</div>
              <button
                onClick={() => adicionarProduto(p)}
                disabled={p.estoque <= 0}
                className={`mt-auto py-2 rounded-md font-medium transition ${
                  p.estoque > 0 ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                ➕ Adicionar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabela venda */}
      <div className="overflow-x-auto mt-6">
        <table className="w-full border-collapse border text-sm shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-400 text-white">
            <tr>
              <th className="p-2 text-left">Produto</th>
              <th className="p-2">Qtde</th>
              <th className="p-2">% Desc</th>
              <th className="p-2">Unit</th>
              <th className="p-2">Total</th>
              <th className="p-2">🗑️</th>
            </tr>
          </thead>
          <tbody>
            {venda.map((p, idx) => {
              const unit =
                Number(p.preco_venda || 0) -
                Number(p.preco_venda || 0) * (Number(p.desconto || 0) / 100);
              const tot = Number(p.qtd || 0) * unit;

              return (
                <tr key={p.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-blue-50"} text-center`}>
                  <td className="p-2 text-left">
                    <div className="font-semibold text-gray-800">{p.nome}</div>
                    <div className="text-xs text-gray-500">{p.ean}</div>
                  </td>
                  <td className="p-2">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => alterarQtd(p.id, -1)} className="bg-gray-200 hover:bg-gray-300 px-2 rounded">
                        ➖
                      </button>
                      <span className="w-6">{p.qtd}</span>
                      <button onClick={() => alterarQtd(p.id, 1)} className="bg-gray-200 hover:bg-gray-300 px-2 rounded">
                        ➕
                      </button>
                    </div>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={p.desconto}
                      onChange={(e) => alterarDesconto(p.id, Number(e.target.value))}
                      className="w-16 border rounded text-center"
                    />
                  </td>
                  <td className="p-2 text-blue-800 font-semibold">{brl(unit)}</td>
                  <td className="p-2 font-bold text-emerald-700">{brl(tot)}</td>
                  <td className="p-2">
                    <button onClick={() => setVenda((prev) => prev.filter((x) => x.id !== p.id))} className="text-red-600">
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}

            {venda.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-gray-500 text-center">
                  Sem itens na venda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {venda.length > 0 && (
        <div className="flex justify-between items-center mt-4 border-t pt-4">
          <div className="text-gray-600 text-sm">Itens: {totalItens}</div>
          <div className="text-2xl font-bold text-blue-700">Total: {brl(total)}</div>
        </div>
      )}

      {venda.length > 0 && (
        <div className="mt-4 flex gap-2">
          <button onClick={limparVenda} className="px-4 py-2 rounded bg-red-600 text-white">
            Limpar
          </button>
          <button onClick={() => setShowPagamento(true)} className="px-4 py-2 rounded bg-green-600 text-white">
            Finalizar
          </button>
        </div>
      )}

      {/* Modal pagamento */}
      {showPagamento && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
          <div className="bg-white w-[95%] sm:w-[420px] rounded-xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold text-blue-700 text-center mb-5">🧾 Finalizar Venda</h2>

            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">Tipo:</label>
              <div className="flex gap-2">
                {["Balcão", "Entrega", "Externo"].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setPagamento((prev: any) => ({ ...prev, tipo }))}
                    className={`flex-1 py-2 rounded-md border ${
                      pagamento.tipo === tipo ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100"
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {pagamento.tipo === "Entrega" && (
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Nome"
                  value={pagamento.nome || ""}
                  onChange={(e) => setPagamento((prev: any) => ({ ...prev, nome: e.target.value }))}
                  className="w-full border rounded p-2"
                />
                <input
                  type="text"
                  placeholder="Telefone"
                  value={pagamento.telefone || ""}
                  onChange={(e) => setPagamento((prev: any) => ({ ...prev, telefone: e.target.value }))}
                  className="w-full border rounded p-2"
                />
                <input
                  type="text"
                  placeholder="Endereço"
                  value={pagamento.endereco || ""}
                  onChange={(e) => setPagamento((prev: any) => ({ ...prev, endereco: e.target.value }))}
                  className="w-full border rounded p-2"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">Pagamento:</label>
              <div className="grid grid-cols-2 gap-2">
                {["Pix", "Cartão", "Dinheiro"].map((forma) => (
                  <button
                    key={forma}
                    onClick={() => setPagamento((prev: any) => ({ ...prev, forma }))}
                    className={`py-2 rounded-md border ${
                      pagamento.forma === forma ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-100"
                    }`}
                  >
                    {forma}
                  </button>
                ))}
              </div>
            </div>

            {pagamento.forma === "Dinheiro" && (
              <div className="mb-4">
                <label className="block text-sm mb-1 text-gray-600">Valor recebido</label>
                <input
                  type="number"
                  value={pagamento.dinheiro}
                  onChange={(e) => calcularTroco(e.target.value)}
                  className="w-full border rounded p-2 text-right"
                />
                <p className="text-sm mt-2 text-gray-700">
                  Troco: <span className="font-bold text-emerald-600">R$ {pagamento.troco}</span>
                </p>
              </div>
            )}

            <div className="border-t mt-4 pt-3 text-center">
              <p className="text-gray-600">Total</p>
              <p className="text-3xl font-bold text-blue-700">{brl(total)}</p>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <button onClick={finalizarVenda} className="bg-blue-800 text-white py-2 rounded-md font-semibold">
                ✅ Confirmar e Imprimir Comanda
              </button>
              <button onClick={() => setShowPagamento(false)} className="bg-gray-400 text-white py-2 rounded-md">
                ↩️ Voltar
              </button>
            </div>

            <button onClick={() => setShowPagamento(false)} className="absolute top-2 right-3 text-xl text-gray-400" aria-label="Fechar">
              ×
            </button>
          </div>
        </div>
      )}

      {/* CONSULTAR VENDAS/PEDIDOS */}
      <div className="mt-10 bg-white rounded-lg shadow p-4">
        <h2 className="text-blue-700 font-semibold text-lg mb-3">📋 Consultar Vendas/Pedidos</h2>

        {!mostrarVendas ? (
          <div className="flex items-center gap-3">
            <input
              type="password"
              placeholder="Senha..."
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button onClick={verificarSenha} className="bg-blue-600 text-white px-4 py-2 rounded">
              Entrar
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">📆 Lista</h3>
              <button onClick={() => setMostrarVendas(false)} className="text-red-600 underline text-sm">
                Sair
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} className="border rounded px-3 py-2" />
              <button onClick={buscarPorData} className="bg-blue-600 text-white px-4 py-2 rounded">
                Buscar
              </button>
              <button
                onClick={() => {
                  setFiltroData("");
                  carregarVendas();
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Limpar
              </button>
            </div>

            {vendas.length === 0 ? (
              <p className="text-gray-500 text-sm">Nada por aqui ainda.</p>
            ) : (
              <table className="w-full text-sm border">
                <thead className="bg-blue-100 text-blue-700 font-semibold">
                  <tr>
                    <th className="p-2 border">Data</th>
                    <th className="p-2 border">Origem</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border text-right">Total</th>
                    <th className="p-2 border text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.map((v) => (
                    <tr key={v.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 border text-center">{new Date(v.created_at).toLocaleString("pt-BR")}</td>
                      <td className="p-2 border text-center">
                        {v.origem === "SITE" ? (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">🌐 SITE</span>
                        ) : (
                          <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">🏪 PDV</span>
                        )}
                      </td>
                      <td className="p-2 border text-center">{v.status}</td>
                      <td className="p-2 border text-right text-emerald-700 font-semibold">{brl(Number(v.total || 0))}</td>
                      <td className="p-2 border text-center">
                        <button onClick={() => setVendaSelecionada(v)} className="text-xs bg-blue-500 text-white px-3 py-1 rounded">
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal detalhes (blindado) */}
      {vendaSelecionada && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[9999]">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-blue-700 mb-3">Detalhes</h3>

            <p className="text-sm text-gray-600 mb-2">
              Data: {new Date(vendaSelecionada.created_at).toLocaleString("pt-BR")}
            </p>

            <p className="text-sm text-gray-600 mb-4">
              Origem: <b>{vendaSelecionada.origem}</b> • Status: <b>{vendaSelecionada.status}</b>
            </p>

            <ul className="border-t border-gray-200 pt-3">
              {asArray<any>(vendaSelecionada.itens).map((p: any, i: number) => (
                <li key={i} className="flex justify-between text-sm py-1">
                  <span>
                    {p.nome} × {p.qtd}
                  </span>
                  <span>{brl(Number(p.preco_unit || 0) * Number(p.qtd || 0))}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 text-right font-bold text-emerald-700">
              Total: {brl(Number(vendaSelecionada.total || 0))}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button onClick={() => imprimirComanda(vendaSelecionada)} className="bg-emerald-600 text-white px-4 py-2 rounded">
                🧾 Reimprimir Comanda
              </button>

              <button onClick={() => setVendaSelecionada(null)} className="bg-red-600 text-white px-4 py-2 rounded">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
