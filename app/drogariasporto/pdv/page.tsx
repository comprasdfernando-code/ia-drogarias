"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Minus,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  Search,
  Trash2,
  Truck,
  Store,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { PORTO_LOJA_SLUG, brl } from "../_lib/porto";
import { ComprovantePorto, imprimirComprovantePorto } from "../_lib/impressao";

type Produto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  apresentacao: string | null;
  estoque: number;
  preco_venda: number;
};

type TipoDesconto = "PERCENTUAL" | "VALOR";
type Item = Produto & {
  qtd: number;
  descontoTipo: TipoDesconto;
  desconto: number;
};
type Forma = "Dinheiro" | "Pix" | "Débito" | "Crédito";
type Pagamento = { forma: Forma; valor: string };
type Conta = { id: string; nome: string; tipo: string };
type TipoAtendimento = "BALCAO" | "ENTREGA";

function numero(v: string) {
  if (!v?.trim()) return 0;
  const s = v.trim().includes(",") ? v.replace(/\./g, "").replace(",", ".") : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function precoLiquidoItem(i: Item) {
  const desconto =
    i.descontoTipo === "PERCENTUAL"
      ? i.preco_venda * (Math.min(100, Math.max(0, i.desconto)) / 100)
      : Math.min(i.preco_venda, Math.max(0, i.desconto));

  return Math.max(0, i.preco_venda - desconto);
}

function descontoUnitarioItem(i: Item) {
  return Math.max(0, i.preco_venda - precoLiquidoItem(i));
}

export default function PortoPDV() {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Produto[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([{ forma: "Dinheiro", valor: "" }]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento>("BALCAO");

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numeroEndereco, setNumeroEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState("0");
  const [observacoes, setObservacoes] = useState("");
  const [ultimoComprovante, setUltimoComprovante] = useState<ComprovantePorto | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const subtotalBruto = useMemo(() => itens.reduce((s, i) => s + i.preco_venda * i.qtd, 0), [itens]);
  const descontoTotal = useMemo(
    () => itens.reduce((s, i) => s + descontoUnitarioItem(i) * i.qtd, 0),
    [itens]
  );
  const subtotal = Math.max(0, subtotalBruto - descontoTotal);
  const taxa = tipoAtendimento === "ENTREGA" ? Math.max(0, numero(taxaEntrega)) : 0;
  const total = subtotal + taxa;
  const totalPagamentos = useMemo(
    () => pagamentos.reduce((s, p) => s + numero(p.valor), 0),
    [pagamentos]
  );
  const faltante = Math.max(0, total - totalPagamentos);

  useEffect(() => {
    inputRef.current?.focus();
    carregarContas();
  }, []);

  async function carregarContas() {
    const { data } = await supabase
      .from("porto_contas_financeiras")
      .select("id,nome,tipo")
      .eq("loja_slug", PORTO_LOJA_SLUG)
      .eq("ativo", true);
    setContas((data || []) as Conta[]);
  }

  async function pesquisar() {
    const termo = busca.trim();
    if (!termo) return;

    setLoading(true);
    try {
      // 1) Primeiro procuramos SOMENTE os produtos que correspondem ao termo/EAN
      // no catálogo master do FV. Isso evita carregar/truncar milhares de vínculos
      // da Porto antes da pesquisa.
      const digits = termo.replace(/\D/g, "");
      let produtoQuery = supabase
        .from("fv_produtos")
        .select("id,ean,nome,laboratorio,apresentacao")
        .limit(50);

      if (digits.length >= 8) {
        produtoQuery = produtoQuery.eq("ean", digits);
      } else {
        produtoQuery = produtoQuery.ilike("nome", `%${termo}%`);
      }

      const { data: catalogo, error: produtoError } = await produtoQuery;
      if (produtoError) throw produtoError;

      const produtosEncontrados = catalogo || [];
      if (!produtosEncontrados.length) {
        setResultados([]);
        return;
      }

      // 2) Para os poucos produtos encontrados, verificamos se estão liberados
      // especificamente para o PDV da Drogarias Porto Loja 2.
      // IMPORTANTE: não usamos mais .limit(1000) na tabela da loja.
      // O limite anterior podia deixar produtos ativos de fora quando o catálogo crescia.
      const ids = produtosEncontrados.map((p: any) => String(p.id));

      const { data: loja, error: lojaError } = await supabase
        .from("fv_farmacia_produtos")
        .select("produto_id,estoque,preco_venda,ativo_pdv")
        .eq("farmacia_slug", PORTO_LOJA_SLUG)
        .eq("ativo_pdv", true)
        .gt("estoque", 0)
        .gt("preco_venda", 0)
        .in("produto_id", ids);

      if (lojaError) throw lojaError;

      const lojaMap = new Map((loja || []).map((r: any) => [String(r.produto_id), r]));

      const out: Produto[] = produtosEncontrados
        .filter((p: any) => lojaMap.has(String(p.id)))
        .map((p: any) => {
          const l: any = lojaMap.get(String(p.id));
          return {
            id: String(p.id),
            ean: String(p.ean || ""),
            nome: String(p.nome || ""),
            laboratorio: p.laboratorio ?? null,
            apresentacao: p.apresentacao ?? null,
            estoque: Number(l?.estoque || 0),
            preco_venda: Number(l?.preco_venda || 0),
          };
        });

      setResultados(out);
      if (out.length === 1) add(out[0]);
    } catch (e: any) {
      console.error("Erro ao buscar produto no PDV Porto:", e);
      alert(e?.message || "Erro ao buscar produto");
    } finally {
      setLoading(false);
    }
  }

  function add(p: Produto) {
    setItens((old) => {
      const f = old.find((i) => i.id === p.id);
      if (f) return old.map((i) => (i.id === p.id ? { ...i, qtd: Math.min(i.qtd + 1, p.estoque) } : i));
      return [...old, { ...p, qtd: 1, descontoTipo: "PERCENTUAL", desconto: 0 }];
    });
  }

  function qtd(id: string, d: number) {
    setItens((old) =>
      old
        .map((i) => (i.id === id ? { ...i, qtd: Math.min(Math.max(i.qtd + d, 0), i.estoque) } : i))
        .filter((i) => i.qtd > 0)
    );
  }

  function alterarDesconto(id: string, tipo: TipoDesconto, valor: number) {
    setItens((old) =>
      old.map((i) => {
        if (i.id !== id) return i;

        const limite = tipo === "PERCENTUAL" ? 100 : i.preco_venda;
        return {
          ...i,
          descontoTipo: tipo,
          desconto: Math.min(limite, Math.max(0, Number(valor) || 0)),
        };
      })
    );
  }

  function contaPorForma(forma: Forma) {
    if (forma === "Dinheiro") return contas.find((c) => c.tipo === "CAIXA") || null;
    if (forma === "Pix") return contas.find((c) => c.tipo === "BANCO" || c.tipo === "PIX") || null;
    return contas.find((c) => c.tipo === "CARTAO_RECEBER") || null;
  }

  function addPagamento() {
    setPagamentos((p) => [...p, { forma: "Pix", valor: "" }]);
  }

  function setPagamento(idx: number, patch: Partial<Pagamento>) {
    setPagamentos((old) => old.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function removerPagamento(idx: number) {
    setPagamentos((old) => old.filter((_, i) => i !== idx));
  }

  function limparEntrega() {
    setClienteNome("");
    setClienteTelefone("");
    setEndereco("");
    setNumeroEndereco("");
    setBairro("");
    setComplemento("");
    setReferencia("");
    setTaxaEntrega("0");
    setObservacoes("");
  }

  async function finalizar() {
    if (!itens.length) return alert("Adicione produtos à venda.");

    if (tipoAtendimento === "ENTREGA") {
      if (!clienteNome.trim()) return alert("Informe o nome do cliente para entrega.");
      if (!clienteTelefone.trim()) return alert("Informe o telefone/WhatsApp do cliente.");
      if (!endereco.trim() || !numeroEndereco.trim() || !bairro.trim()) {
        return alert("Para entrega, informe endereço, número e bairro.");
      }
    }

    const validos = pagamentos.map((p) => ({ ...p, numero: numero(p.valor) })).filter((p) => p.numero > 0);
    if (!validos.length) return alert("Informe o pagamento.");
    if (Math.abs(validos.reduce((s, p) => s + p.numero, 0) - total) > 0.009) {
      return alert(`Os pagamentos precisam somar exatamente ${brl(total)}.`);
    }

    setSalvando(true);
    try {
      const { data: cx, error: cxErr } = await supabase
        .from("porto_caixa_sessoes")
        .select("id")
        .eq("loja_slug", PORTO_LOJA_SLUG)
        .eq("status", "aberto")
        .order("aberto_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cxErr) throw cxErr;
      if (!cx) throw new Error("Abra o caixa antes de finalizar vendas.");

      const cliente =
        tipoAtendimento === "ENTREGA"
          ? { nome: clienteNome.trim(), telefone: clienteTelefone.trim() }
          : null;

      const enderecoEntrega =
        tipoAtendimento === "ENTREGA"
          ? {
              endereco: endereco.trim(),
              numero: numeroEndereco.trim(),
              bairro: bairro.trim(),
              complemento: complemento.trim() || null,
              referencia: referencia.trim() || null,
            }
          : null;

      const { data: v, error } = await supabase
        .from("porto_vendas")
        .insert({
          loja_slug: PORTO_LOJA_SLUG,
          caixa_sessao_id: cx.id,
          origem: "PDV",
          status: "FINALIZADA",
          cliente,
          tipo_entrega: tipoAtendimento,
          endereco_entrega: enderecoEntrega,
          taxa_entrega: taxa,
          observacoes: observacoes.trim() || null,
          total,
          finalizada_em: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;

      const rows = itens.map((i) => {
        const precoLiquido = precoLiquidoItem(i);
        const descontoUnitario = descontoUnitarioItem(i);

        return {
          venda_id: v.id,
          loja_slug: PORTO_LOJA_SLUG,
          produto_id: i.id,
          ean: i.ean,
          nome: i.nome,
          qtd: i.qtd,
          preco_original: i.preco_venda,
          preco_unit: precoLiquido,
          desconto_tipo: i.desconto > 0 ? i.descontoTipo : null,
          desconto_percentual: i.descontoTipo === "PERCENTUAL" ? i.desconto : 0,
          desconto_unitario: descontoUnitario,
          desconto_total: descontoUnitario * i.qtd,
          total: precoLiquido * i.qtd,
        };
      });
      const { error: ei } = await supabase.from("porto_venda_itens").insert(rows);
      if (ei) throw ei;

      for (const p of validos) {
        const conta = contaPorForma(p.forma);
        const { error: ep } = await supabase.from("porto_venda_pagamentos").insert({
          venda_id: v.id,
          caixa_sessao_id: cx.id,
          loja_slug: PORTO_LOJA_SLUG,
          forma: p.forma,
          valor: p.numero,
          conta_financeira_id: conta?.id || null,
        });
        if (ep) throw ep;

        if (conta) {
          const { error: mf } = await supabase.from("porto_movimentacoes_financeiras").insert({
            loja_slug: PORTO_LOJA_SLUG,
            conta_financeira_id: conta.id,
            tipo: "ENTRADA",
            categoria: `VENDA_${p.forma.toUpperCase()}`,
            descricao: `Venda PDV ${v.id.slice(0, 8)}${tipoAtendimento === "ENTREGA" ? " - ENTREGA" : ""}`,
            valor: p.numero,
            origem_tipo: "VENDA",
            origem_id: v.id,
          });
          if (mf) throw mf;
        }
      }

      for (const i of itens) {
        const novo = Math.max(0, i.estoque - i.qtd);
        const { error: est } = await supabase
          .from("fv_farmacia_produtos")
          .update({ estoque: novo })
          .eq("farmacia_slug", PORTO_LOJA_SLUG)
          .eq("produto_id", i.id);
        if (est) throw est;
      }

      const comprovante: ComprovantePorto = {
        numero: v.id.slice(0, 8).toUpperCase(),
        data: new Date(),
        origem: "PDV",
        tipo: tipoAtendimento,
        clienteNome: tipoAtendimento === "ENTREGA" ? clienteNome.trim() : undefined,
        clienteTelefone: tipoAtendimento === "ENTREGA" ? clienteTelefone.trim() : undefined,
        enderecoEntrega: enderecoEntrega
          ? {
              endereco: enderecoEntrega.endereco,
              numero: enderecoEntrega.numero,
              bairro: enderecoEntrega.bairro,
              complemento: enderecoEntrega.complemento || undefined,
              referencia: enderecoEntrega.referencia || undefined,
            }
          : null,
        itens: itens.map((i) => ({
          nome: i.nome,
          qtd: i.qtd,
          precoOriginal: i.preco_venda,
          precoUnit: precoLiquidoItem(i),
          descontoUnitario: descontoUnitarioItem(i),
          descontoTotal: descontoUnitarioItem(i) * i.qtd,
          total: precoLiquidoItem(i) * i.qtd,
        })),
        subtotalBruto,
        descontoTotal,
        subtotal,
        taxaEntrega: taxa,
        total,
        pagamentos: validos.map((p) => ({ forma: p.forma, valor: p.numero })),
        observacoes: observacoes.trim() || undefined,
      };

      setUltimoComprovante(comprovante);
      imprimirComprovantePorto(comprovante);

      alert(
        `${tipoAtendimento === "ENTREGA" ? "Venda para entrega" : "Venda"} finalizada: ${brl(total)}.\n` +
          `Pagamento(s) enviado(s) automaticamente ao caixa.\n` +
          `A impressão do comprovante foi aberta.`
      );

      setItens([]);
      setResultados([]);
      setPagamentos([{ forma: "Dinheiro", valor: "" }]);
      setTipoAtendimento("BALCAO");
      limparEntrega();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao finalizar venda");
    } finally {
      setSalvando(false);
      inputRef.current?.focus();
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-4 flex items-center justify-between rounded-2xl bg-blue-900 p-4 text-white">
          <div>
            <p className="text-xs font-bold text-blue-200">DROGARIAS PORTO • LOJA 2</p>
            <h1 className="text-2xl font-black">PDV</h1>
          </div>
          <div className="flex gap-2">
            {ultimoComprovante && (
              <button
                onClick={() => imprimirComprovantePorto(ultimoComprovante)}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 font-bold"
              >
                <Printer size={18} /> Reimprimir
              </button>
            )}
            <Link href="/drogariasporto" className="rounded-xl bg-white/10 p-2">
              <ArrowLeft />
            </Link>
            <Link href="/drogariasporto/caixa" className="rounded-xl bg-white px-4 py-2 font-bold text-blue-900">
              Caixa
            </Link>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[1fr_480px]">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-xl border-2 border-blue-200 px-4 focus-within:border-blue-600">
                <Search />
                <input
                  ref={inputRef}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && pesquisar()}
                  placeholder="Bipar EAN ou digitar produto"
                  className="w-full px-3 py-4 text-lg outline-none"
                />
              </div>
              <button onClick={pesquisar} className="rounded-xl bg-blue-700 px-6 font-black text-white">
                Buscar
              </button>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {loading ? (
                <p>Buscando...</p>
              ) : (
                resultados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => add(p)}
                    className="rounded-xl border p-3 text-left hover:border-blue-500"
                  >
                    <div className="font-black">{p.nome}</div>
                    <div className="text-xs text-slate-500">
                      {p.laboratorio} • {p.apresentacao}
                    </div>
                    <div className="mt-1 flex justify-between">
                      <b className="text-blue-700">{brl(p.preco_venda)}</b>
                      <span className="text-xs">Estoque {p.estoque}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="p-3">Produto</th>
                    <th>Qtd</th>
                    <th>Preço</th>
                    <th>Desconto</th>
                    <th>Unit. final</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((i) => (
                    <tr key={i.id} className="border-t">
                      <td className="p-3">
                        <b>{i.nome}</b>
                        <small className="block text-slate-500">EAN {i.ean}</small>
                      </td>
                      <td>
                        <div className="inline-flex items-center rounded-lg border">
                          <button onClick={() => qtd(i.id, -1)} className="p-2"><Minus size={14} /></button>
                          <b className="px-2">{i.qtd}</b>
                          <button onClick={() => qtd(i.id, 1)} className="p-2"><Plus size={14} /></button>
                        </div>
                      </td>
                      <td>{brl(i.preco_venda)}</td>
                      <td>
                        <div className="flex min-w-[170px] items-center gap-1">
                          <select
                            value={i.descontoTipo}
                            onChange={(e) =>
                              alterarDesconto(i.id, e.target.value as TipoDesconto, i.desconto)
                            }
                            className="rounded-lg border bg-white px-2 py-2 text-xs font-bold"
                            title="Tipo de desconto"
                          >
                            <option value="PERCENTUAL">%</option>
                            <option value="VALOR">R$</option>
                          </select>
                          <input
                            value={i.desconto ? String(i.desconto).replace(".", ",") : ""}
                            onChange={(e) =>
                              alterarDesconto(i.id, i.descontoTipo, numero(e.target.value))
                            }
                            inputMode="decimal"
                            placeholder="0"
                            className="w-20 rounded-lg border px-2 py-2 text-right font-bold outline-none focus:border-blue-600"
                          />
                          {i.desconto > 0 && (
                            <button
                              onClick={() => alterarDesconto(i.id, i.descontoTipo, 0)}
                              className="rounded-lg border px-2 py-2 text-xs font-bold text-red-600"
                              title="Remover desconto"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        {descontoUnitarioItem(i) > 0 && (
                          <small className="mt-1 block font-bold text-green-700">
                            - {brl(descontoUnitarioItem(i))}/un.
                          </small>
                        )}
                      </td>
                      <td className="font-bold text-blue-800">{brl(precoLiquidoItem(i))}</td>
                      <td className="font-bold">{brl(precoLiquidoItem(i) * i.qtd)}</td>
                      <td>
                        <button onClick={() => setItens((x) => x.filter((y) => y.id !== i.id))} className="p-2 text-red-600">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!itens.length && <div className="p-10 text-center text-slate-400">Venda vazia</div>}
            </div>
          </section>

          <aside className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">TOTAL DA VENDA</p>
            <div className="mt-1 text-5xl font-black text-blue-900">{brl(total)}</div>

            <div className="mt-5">
              <h2 className="font-black">Tipo de atendimento</h2>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTipoAtendimento("BALCAO")}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 font-black ${
                    tipoAtendimento === "BALCAO" ? "border-blue-700 bg-blue-50 text-blue-800" : "border-slate-200"
                  }`}
                >
                  <Store size={18} /> Balcão
                </button>
                <button
                  onClick={() => setTipoAtendimento("ENTREGA")}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 font-black ${
                    tipoAtendimento === "ENTREGA" ? "border-green-600 bg-green-50 text-green-800" : "border-slate-200"
                  }`}
                >
                  <Truck size={18} /> Entrega
                </button>
              </div>
            </div>

            {tipoAtendimento === "ENTREGA" && (
              <div className="mt-4 rounded-2xl border-2 border-green-100 bg-green-50/40 p-4">
                <div className="mb-3 flex items-center gap-2 font-black text-green-900">
                  <Truck size={18} /> Dados da entrega
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do cliente *" className="rounded-xl border p-3 sm:col-span-2" />
                  <input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} placeholder="Telefone / WhatsApp *" className="rounded-xl border p-3 sm:col-span-2" />
                  <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço *" className="rounded-xl border p-3" />
                  <input value={numeroEndereco} onChange={(e) => setNumeroEndereco(e.target.value)} placeholder="Número *" className="rounded-xl border p-3" />
                  <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro *" className="rounded-xl border p-3 sm:col-span-2" />
                  <input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Complemento" className="rounded-xl border p-3 sm:col-span-2" />
                  <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Referência" className="rounded-xl border p-3 sm:col-span-2" />
                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-xs font-bold text-slate-600">Taxa de entrega</span>
                    <input value={taxaEntrega} onChange={(e) => setTaxaEntrega(e.target.value)} placeholder="0,00" inputMode="decimal" className="w-full rounded-xl border p-3" />
                  </label>
                  <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações da entrega" className="min-h-20 rounded-xl border p-3 sm:col-span-2" />
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <h2 className="font-black">Pagamentos</h2>
              <button onClick={addPagamento} className="rounded-lg border px-3 py-2 text-sm font-bold">+ Pagamento misto</button>
            </div>

            <div className="mt-3 space-y-3">
              {pagamentos.map((p, idx) => (
                <div key={idx} className="rounded-xl border p-3">
                  <div className="grid grid-cols-[1fr_130px_auto] gap-2">
                    <select
                      value={p.forma}
                      onChange={(e) => setPagamento(idx, { forma: e.target.value as Forma })}
                      className="rounded-lg border p-2 font-bold"
                    >
                      <option>Dinheiro</option>
                      <option>Pix</option>
                      <option>Débito</option>
                      <option>Crédito</option>
                    </select>
                    <input
                      value={p.valor}
                      onChange={(e) => setPagamento(idx, { valor: e.target.value })}
                      className="rounded-lg border p-2 text-right font-bold"
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                    {pagamentos.length > 1 && (
                      <button onClick={() => removerPagamento(idx)} className="rounded-lg p-2 text-red-600"><Trash2 size={18} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex justify-between"><span>Subtotal bruto</span><b>{brl(subtotalBruto)}</b></div>
              {descontoTotal > 0 && (
                <div className="mt-1 flex justify-between text-green-700">
                  <span>Descontos nos itens</span><b>- {brl(descontoTotal)}</b>
                </div>
              )}
              <div className="mt-1 flex justify-between"><span>Subtotal</span><b>{brl(subtotal)}</b></div>
              {tipoAtendimento === "ENTREGA" && <div className="mt-1 flex justify-between"><span>Taxa entrega</span><b>{brl(taxa)}</b></div>}
              <div className="mt-1 flex justify-between"><span>Informado</span><b>{brl(totalPagamentos)}</b></div>
              <div className="mt-1 flex justify-between"><span>Falta</span><b className={faltante > 0 ? "text-red-600" : "text-green-700"}>{brl(faltante)}</b></div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-500">
              <div><Banknote className="mx-auto" />Dinheiro</div>
              <div><QrCode className="mx-auto" />Pix</div>
              <div><CreditCard className="mx-auto" />Débito</div>
              <div><CreditCard className="mx-auto" />Crédito</div>
            </div>

            <button
              disabled={salvando || !itens.length || Math.abs(totalPagamentos - total) > 0.009}
              onClick={finalizar}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-5 text-xl font-black text-white disabled:opacity-40"
            >
              <ReceiptText /> {salvando ? "Finalizando..." : tipoAtendimento === "ENTREGA" ? "FINALIZAR ENTREGA" : "FINALIZAR VENDA"}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">
              Ao finalizar, a venda vai para o caixa e o comprovante abre para impressão automaticamente.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}