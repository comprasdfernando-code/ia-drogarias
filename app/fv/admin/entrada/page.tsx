"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type FVProdutoMini = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  pmc: number | null;
  ativo: boolean | null;
  imagens: string[] | null;
  estoque: number | null;
};

type EntradaItem = {
  ean: string;
  descricao: string;
  quantidade: number;
  custo_unitario?: number | null;

  // preenchidos quando bater no cadastro:
  produto_id?: string | null;
  cadastrado?: boolean;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}
function num(v: any) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function AdminEntradaPage() {
  const [origem, setOrigem] = useState<"manual" | "xml">("manual");
  const [fornecedor, setFornecedor] = useState("");
  const [observacao, setObservacao] = useState("");

  const [itens, setItens] = useState<EntradaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // modal cadastro
  const [modalOpen, setModalOpen] = useState(false);
  const [itemParaCadastrar, setItemParaCadastrar] = useState<EntradaItem | null>(null);

  // form cadastro
  const [cadNome, setCadNome] = useState("");
  const [cadLab, setCadLab] = useState("");
  const [cadCat, setCadCat] = useState("");
  const [cadApres, setCadApres] = useState("");
  const [cadPmc, setCadPmc] = useState<number>(0);
  const [cadAtivo, setCadAtivo] = useState(true);

  const faltandoCadastro = useMemo(
    () => itens.filter((i) => !i.produto_id),
    [itens]
  );

  async function upsertResolveProdutosPorEAN(eans: string[]) {
    const clean = Array.from(new Set(eans.map(onlyDigits).filter(Boolean)));
    if (!clean.length) return;

    const { data, error } = await supabase
      .from("fv_produtos")
      .select("id,ean,nome,laboratorio,categoria,apresentacao,pmc,ativo,imagens,estoque")
      .in("ean", clean);

    if (error) throw error;

    const map = new Map<string, FVProdutoMini>();
    (data || []).forEach((p: any) => map.set(String(p.ean), p as FVProdutoMini));

    setItens((prev) =>
      prev.map((it) => {
        const p = map.get(onlyDigits(it.ean));
        if (!p) return { ...it, produto_id: null, cadastrado: false };
        return { ...it, produto_id: p.id, cadastrado: true, descricao: it.descricao || p.nome };
      })
    );
  }

  // ----------- ENTRADA MANUAL -----------
  function addManualLinha() {
    setItens((prev) => [
      ...prev,
      { ean: "", descricao: "", quantidade: 1, custo_unitario: null, produto_id: null, cadastrado: false },
    ]);
  }

  async function resolveLinha(idx: number) {
    const ean = onlyDigits(itens[idx]?.ean || "");
    if (!ean) return;

    await upsertResolveProdutosPorEAN([ean]);

    // se ainda não existir -> abre modal
    const after = itens[idx];
    const stillMissing =
      !after?.produto_id &&
      !(
        // pode estar desatualizado pelo setState; checamos direto do banco:
        false
      );

    // melhor: checar no banco e abrir modal se não achar
    const { data } = await supabase.from("fv_produtos").select("id,ean,nome").eq("ean", ean).maybeSingle();
    if (!data) {
      abrirModalCadastro({
        ean,
        descricao: itens[idx]?.descricao || "",
        quantidade: itens[idx]?.quantidade || 1,
        custo_unitario: itens[idx]?.custo_unitario ?? null,
      });
    }
  }

  // ----------- XML -----------
  async function onXmlFile(file: File) {
    setErro(null);
    setOrigem("xml");
    setLoading(true);
    try {
      const text = await file.text();
      const parsed = parseNfeXmlItems(text);

      if (!parsed.items.length) {
        throw new Error("Não encontrei itens no XML. Se quiser, me mande um XML exemplo que eu ajusto o parser.");
      }

      setItens(parsed.items);

      // resolve no banco por EAN
      await upsertResolveProdutosPorEAN(parsed.items.map((i) => i.ean));

      // tenta puxar fornecedor/chave
      if (parsed.fornecedor) setFornecedor(parsed.fornecedor);
      if (parsed.chave) setObservacao((prev) => (prev ? prev + "\n" : "") + `Chave: ${parsed.chave}`);
    } catch (e: any) {
      console.error(e);
      setErro(e?.message || "Erro ao ler XML");
    } finally {
      setLoading(false);
    }
  }

  // ----------- MODAL CADASTRO -----------
  function abrirModalCadastro(item: EntradaItem) {
    setItemParaCadastrar(item);
    setCadNome(item.descricao || "");
    setCadLab("");
    setCadCat("");
    setCadApres("");
    setCadPmc(0);
    setCadAtivo(true);
    setModalOpen(true);
  }

  async function salvarCadastroProduto() {
    if (!itemParaCadastrar) return;

    const ean = onlyDigits(itemParaCadastrar.ean);
    if (!ean) return;

    setLoading(true);
    setErro(null);
    try {
      const payload: any = {
        ean,
        nome: cadNome?.trim() || itemParaCadastrar.descricao?.trim() || "Produto",
        laboratorio: cadLab?.trim() || null,
        categoria: cadCat?.trim() || null,
        apresentacao: cadApres?.trim() || null,
        pmc: cadPmc > 0 ? cadPmc : null,
        em_promocao: false,
        preco_promocional: null,
        percentual_off: 0,
        destaque_home: false,
        ativo: !!cadAtivo,
        imagens: null,
      };

      // upsert por ean (pra não quebrar se alguém cadastrou antes)
      const { data, error } = await supabase
        .from("fv_produtos")
        .upsert(payload, { onConflict: "ean" })
        .select("id,ean,nome")
        .single();

      if (error) throw error;

      // atualiza o item na lista com produto_id
      setItens((prev) =>
        prev.map((it) =>
          onlyDigits(it.ean) === ean ? { ...it, produto_id: data.id, cadastrado: true, descricao: it.descricao || data.nome } : it
        )
      );

      setModalOpen(false);
      setItemParaCadastrar(null);
    } catch (e: any) {
      console.error(e);
      setErro(e?.message || "Erro ao cadastrar produto");
    } finally {
      setLoading(false);
    }
  }

  // ----------- CONFIRMAR ENTRADA -----------
  async function confirmarEntrada() {
    setErro(null);

    const invalid = itens.find((i) => !onlyDigits(i.ean) || !i.quantidade || i.quantidade <= 0);
    if (invalid) {
      setErro("Tem item sem EAN ou com quantidade inválida.");
      return;
    }
    if (faltandoCadastro.length) {
      setErro("Ainda existe item sem cadastro. Cadastre os faltantes antes de confirmar.");
      return;
    }

    setLoading(true);
    try {
      // 1) criar entrada
      const { data: ent, error: entErr } = await supabase
        .from("fv_entradas")
        .insert({
          origem,
          fornecedor: fornecedor?.trim() || null,
          observacao: observacao?.trim() || null,
        })
        .select("id")
        .single();

      if (entErr) throw entErr;

      // 2) inserir itens (trigger soma no estoque)
      const itensPayload = itens.map((i) => ({
        entrada_id: ent.id,
        produto_id: i.produto_id,
        ean: onlyDigits(i.ean),
        descricao: i.descricao || null,
        quantidade: Number(i.quantidade),
        custo_unitario: i.custo_unitario != null ? Number(i.custo_unitario) : null,
      }));

      const { error: itErr } = await supabase.from("fv_entrada_itens").insert(itensPayload);
      if (itErr) throw itErr;

      // 3) limpar tela
      setItens([]);
      setFornecedor("");
      setObservacao("");
      setOrigem("manual");
      alert("Entrada confirmada ✅ Estoque atualizado.");
    } catch (e: any) {
      console.error(e);
      setErro(e?.message || "Erro ao confirmar entrada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="bg-white border rounded-3xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-blue-950">Entrada de Produtos (FV)</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manual ou XML • Se não existir cadastro, abre modal e cadastra na hora • EAN sempre.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmarEntrada}
                disabled={loading || itens.length === 0}
                className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold disabled:opacity-50"
              >
                {loading ? "Processando…" : "Confirmar entrada"}
              </button>
              <button
                onClick={() => setItens([])}
                className="px-4 py-2.5 rounded-xl bg-white border hover:bg-gray-50 font-extrabold"
              >
                Limpar itens
              </button>
            </div>
          </div>

          {erro ? (
            <div className="mt-4 text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl">
              {erro}
            </div>
          ) : null}

          <div className="mt-5 grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Fornecedor</label>
              <input
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
                placeholder="Ex: Distribuidora X"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700">Origem</label>
              <select
                value={origem}
                onChange={(e) => setOrigem(e.target.value as any)}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="manual">Manual</option>
                <option value="xml">XML</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-gray-700">Observação</label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
                rows={2}
                placeholder="Opcional…"
              />
            </div>
          </div>

          {/* XML upload */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <label className="px-4 py-2.5 rounded-xl bg-white border hover:bg-gray-50 font-extrabold cursor-pointer">
              Importar XML
              <input
                type="file"
                accept=".xml,text/xml,application/xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onXmlFile(f);
                }}
              />
            </label>

            <button
              onClick={addManualLinha}
              className="px-4 py-2.5 rounded-xl bg-white border hover:bg-gray-50 font-extrabold"
            >
              + Linha manual
            </button>

            <div className="text-sm text-gray-600">
              Itens: <b>{itens.length}</b> • Faltando cadastro:{" "}
              <b className={faltandoCadastro.length ? "text-red-700" : ""}>{faltandoCadastro.length}</b>
            </div>
          </div>
        </div>

        {/* Tabela itens */}
        <div className="mt-6 bg-white border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-blue-950">Itens da entrada</h2>
              <p className="text-sm text-gray-600">EAN • descrição • quantidade • custo • status cadastro</p>
            </div>

            {faltandoCadastro.length ? (
              <button
                onClick={() => abrirModalCadastro(faltandoCadastro[0])}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold"
              >
                Cadastrar faltantes
              </button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50 border-t border-b">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-extrabold text-gray-700">EAN</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-gray-700">Descrição</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-gray-700">Qtd</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-gray-700">Custo unit.</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-gray-700">Cadastro</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-gray-700">Ações</th>
                </tr>
              </thead>

              <tbody>
                {itens.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-gray-600">
                      Nenhum item ainda. Adicione manualmente ou importe um XML.
                    </td>
                  </tr>
                ) : (
                  itens.map((it, idx) => (
                    <tr key={`${it.ean}-${idx}`} className="border-t">
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                        <input
                          value={it.ean}
                          onChange={(e) => {
                            const v = e.target.value;
                            setItens((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, ean: v, produto_id: null, cadastrado: false } : x))
                            );
                          }}
                          className="w-44 bg-white border rounded-xl px-3 py-2"
                          placeholder="EAN…"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          value={it.descricao}
                          onChange={(e) => {
                            const v = e.target.value;
                            setItens((prev) => prev.map((x, i) => (i === idx ? { ...x, descricao: v } : x)));
                          }}
                          className="w-[520px] max-w-full bg-white border rounded-xl px-3 py-2"
                          placeholder="Descrição…"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={it.quantidade}
                          onChange={(e) => {
                            const v = num(e.target.value);
                            setItens((prev) => prev.map((x, i) => (i === idx ? { ...x, quantidade: v } : x)));
                          }}
                          className="w-28 bg-white border rounded-xl px-3 py-2"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={it.custo_unitario ?? ""}
                          onChange={(e) => {
                            const v = e.target.value === "" ? null : num(e.target.value);
                            setItens((prev) => prev.map((x, i) => (i === idx ? { ...x, custo_unitario: v } : x)));
                          }}
                          className="w-28 bg-white border rounded-xl px-3 py-2"
                          placeholder="Opcional"
                        />
                      </td>

                      <td className="px-4 py-3">
                        {it.produto_id ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-600 text-white text-xs font-extrabold">
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-600 text-white text-xs font-extrabold">
                            Faltando
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => resolveLinha(idx)}
                            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-xs font-extrabold"
                          >
                            Resolver
                          </button>

                          {!it.produto_id ? (
                            <button
                              onClick={() => abrirModalCadastro(it)}
                              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold"
                            >
                              Cadastrar
                            </button>
                          ) : null}

                          <button
                            onClick={() => setItens((prev) => prev.filter((_, i) => i !== idx))}
                            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-xs font-extrabold"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal cadastro */}
      {modalOpen && itemParaCadastrar ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-lg overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-extrabold text-blue-950">
                Cadastrar produto (EAN: <span className="font-mono">{onlyDigits(itemParaCadastrar.ean)}</span>)
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold"
              >
                Fechar
              </button>
            </div>

            <div className="p-4 grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-700">Nome</label>
                <input
                  value={cadNome}
                  onChange={(e) => setCadNome(e.target.value)}
                  className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Laboratório</label>
                <input
                  value={cadLab}
                  onChange={(e) => setCadLab(e.target.value)}
                  className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Categoria</label>
                <input
                  value={cadCat}
                  onChange={(e) => setCadCat(e.target.value)}
                  className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
                  placeholder="Opcional"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-700">Apresentação</label>
                <input
                  value={cadApres}
                  onChange={(e) => setCadApres(e.target.value)}
                  className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">PMC (preço de tabela)</label>
                <input
                  type="number"
                  value={cadPmc || 0}
                  onChange={(e) => setCadPmc(num(e.target.value))}
                  className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
                  placeholder="Opcional"
                />
              </div>

              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={cadAtivo}
                  onChange={(e) => setCadAtivo(e.target.checked)}
                />
                <span className="text-sm font-bold text-gray-700">Produto ativo</span>
              </div>

              <div className="md:col-span-2 mt-2 flex gap-2">
                <button
                  onClick={salvarCadastroProduto}
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold disabled:opacity-50"
                >
                  {loading ? "Salvando…" : "Cadastrar produto"}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-3 rounded-2xl bg-white border hover:bg-gray-50 font-extrabold"
                >
                  Cancelar
                </button>
              </div>

              <div className="md:col-span-2 text-[11px] text-gray-500">
                Depois de cadastrar, o item volta como “OK” e você consegue confirmar a entrada.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

/**
 * Parser simples pra NFe/NFC-e. NFe costuma ter:
 * <det> <prod> <cEAN>...</cEAN> <xProd>...</xProd> <qCom>...</qCom> <vUnCom>...</vUnCom> </prod> </det>
 */
function parseNfeXmlItems(xmlText: string): { items: EntradaItem[]; fornecedor?: string; chave?: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  // chave: às vezes vem no atributo Id do <infNFe Id="NFe...">
  const infNFe = doc.getElementsByTagName("infNFe")?.[0];
  const chaveAttr = infNFe?.getAttribute("Id") || "";
  const chave = chaveAttr ? chaveAttr.replace(/^NFe/, "") : undefined;

  // fornecedor (emit): <emit><xNome>
  const emit = doc.getElementsByTagName("emit")?.[0];
  const fornecedor = emit?.getElementsByTagName("xNome")?.[0]?.textContent || undefined;

  const det = Array.from(doc.getElementsByTagName("det"));
  const items: EntradaItem[] = det
    .map((d) => {
      const prod = d.getElementsByTagName("prod")?.[0];
      if (!prod) return null;

      const ean =
        prod.getElementsByTagName("cEAN")?.[0]?.textContent ||
        prod.getElementsByTagName("cEANTrib")?.[0]?.textContent ||
        "";

      const xProd = prod.getElementsByTagName("xProd")?.[0]?.textContent || "";
      const qCom = prod.getElementsByTagName("qCom")?.[0]?.textContent || "0";
      const vUnCom = prod.getElementsByTagName("vUnCom")?.[0]?.textContent || "";

      const cleanEAN = onlyDigits(ean);
      if (!cleanEAN) return null;

      return {
        ean: cleanEAN,
        descricao: (xProd || "").trim(),
        quantidade: num(qCom),
        custo_unitario: vUnCom ? num(vUnCom) : null,
        produto_id: null,
        cadastrado: false,
      } as EntradaItem;
    })
    .filter(Boolean) as EntradaItem[];

  return { items, fornecedor, chave };
}
