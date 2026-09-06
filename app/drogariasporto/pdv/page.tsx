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
import {
  ComprovantePorto,
  imprimirComprovantePorto,
} from "../_lib/impressao";

type Produto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  apresentacao: string | null;

  // Drogarias Porto
  estoque: number;
  preco_venda: number;

  // Consulta FV
  preco_consulta: number;
  pode_vender: boolean;
};

type TipoDesconto = "PERCENTUAL" | "VALOR";

type Item = Produto & {
  qtd: number;
  descontoTipo: TipoDesconto;
  desconto: number;
};

type Forma = "Dinheiro" | "Pix" | "Débito" | "Crédito";

type Pagamento = {
  forma: Forma;
  valor: string;
};

type Conta = {
  id: string;
  nome: string;
  tipo: string;
};

type TipoAtendimento = "BALCAO" | "ENTREGA";

function numero(v: string) {
  if (!v?.trim()) return 0;

  const s = v.trim().includes(",")
    ? v.replace(/\./g, "").replace(",", ".")
    : v;

  const n = Number(s);

  return Number.isFinite(n) ? n : 0;
}

function precoLiquidoItem(i: Item) {
  const desconto =
    i.descontoTipo === "PERCENTUAL"
      ? i.preco_venda *
        (Math.min(100, Math.max(0, i.desconto)) / 100)
      : Math.min(
          i.preco_venda,
          Math.max(0, i.desconto)
        );

  return Math.max(
    0,
    i.preco_venda - desconto
  );
}

function descontoUnitarioItem(i: Item) {
  return Math.max(
    0,
    i.preco_venda - precoLiquidoItem(i)
  );
}

export default function PortoPDV() {
  const [busca, setBusca] = useState("");

  const [resultados, setResultados] =
    useState<Produto[]>([]);

  const [itens, setItens] =
    useState<Item[]>([]);

  const [pagamentos, setPagamentos] =
    useState<Pagamento[]>([
      {
        forma: "Dinheiro",
        valor: "",
      },
    ]);

  const [contas, setContas] =
    useState<Conta[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [
    tipoAtendimento,
    setTipoAtendimento,
  ] =
    useState<TipoAtendimento>(
      "BALCAO"
    );

  const [
    clienteNome,
    setClienteNome,
  ] = useState("");

  const [
    clienteTelefone,
    setClienteTelefone,
  ] = useState("");

  const [
    endereco,
    setEndereco,
  ] = useState("");

  const [
    numeroEndereco,
    setNumeroEndereco,
  ] = useState("");

  const [
    bairro,
    setBairro,
  ] = useState("");

  const [
    complemento,
    setComplemento,
  ] = useState("");

  const [
    referencia,
    setReferencia,
  ] = useState("");

  const [
    taxaEntrega,
    setTaxaEntrega,
  ] = useState("0");

  const [
    observacoes,
    setObservacoes,
  ] = useState("");

  const [
    ultimoComprovante,
    setUltimoComprovante,
  ] =
    useState<ComprovantePorto | null>(
      null
    );

  const inputRef =
    useRef<HTMLInputElement>(null);

  const subtotalBruto =
    useMemo(
      () =>
        itens.reduce(
          (s, i) =>
            s +
            i.preco_venda *
              i.qtd,
          0
        ),
      [itens]
    );

  const descontoTotal =
    useMemo(
      () =>
        itens.reduce(
          (s, i) =>
            s +
            descontoUnitarioItem(i) *
              i.qtd,
          0
        ),
      [itens]
    );

  const subtotal =
    Math.max(
      0,
      subtotalBruto -
        descontoTotal
    );

  const taxa =
    tipoAtendimento === "ENTREGA"
      ? Math.max(
          0,
          numero(taxaEntrega)
        )
      : 0;

  const total =
    subtotal + taxa;

  const totalPagamentos =
    useMemo(
      () =>
        pagamentos.reduce(
          (s, p) =>
            s +
            numero(p.valor),
          0
        ),
      [pagamentos]
    );

  const faltante =
    Math.max(
      0,
      total -
        totalPagamentos
    );

  useEffect(() => {
    inputRef.current?.focus();
    carregarContas();
  }, []);

  async function carregarContas() {
    const { data } =
      await supabase
        .from(
          "porto_contas_financeiras"
        )
        .select(
          "id,nome,tipo"
        )
        .eq(
          "loja_slug",
          PORTO_LOJA_SLUG
        )
        .eq(
          "ativo",
          true
        );

    setContas(
      (data || []) as Conta[]
    );
  }

  /*
   * =========================================================
   * PESQUISA
   * =========================================================
   *
   * CONSULTA:
   * pesquisa TODO o catálogo fv_produtos.
   *
   * VENDA:
   * cruza com fv_farmacia_produtos.
   *
   * COM ESTOQUE PORTO:
   * aparece primeiro e pode adicionar.
   *
   * SEM ESTOQUE:
   * aparece depois para consulta.
   */
  async function pesquisar() {
    const termo =
      busca.trim();

    if (!termo) {
      setResultados([]);
      return;
    }

    setLoading(true);

    try {
      const digits =
        termo.replace(
          /\D/g,
          ""
        );

      /*
       * 1 - Pesquisa catálogo FV
       */
      let produtoQuery =
        supabase
          .from(
            "fv_produtos"
          )
          .select(`
            id,
            ean,
            nome,
            laboratorio,
            apresentacao,
            pmc
          `)
          .limit(100);

      /*
       * Código de barras
       */
      if (
        digits.length >= 8
      ) {
        produtoQuery =
          produtoQuery.or(
            `ean.eq.${digits},nome.ilike.%${termo}%`
          );
      } else {
        /*
         * Pesquisa pelo nome
         */
        produtoQuery =
          produtoQuery.ilike(
            "nome",
            `%${termo}%`
          );
      }

      const {
        data: catalogo,
        error: produtoError,
      } =
        await produtoQuery;

      if (produtoError) {
        throw produtoError;
      }

      const produtosEncontrados =
        catalogo || [];

      if (
        !produtosEncontrados.length
      ) {
        setResultados([]);
        return;
      }

      /*
       * 2 - Procura os mesmos produtos
       * na Drogarias Porto
       */
      const ids =
        produtosEncontrados.map(
          (p: any) =>
            String(p.id)
        );

      const {
        data: produtosPorto,
        error: lojaError,
      } =
        await supabase
          .from(
            "fv_farmacia_produtos"
          )
          .select(`
            produto_id,
            estoque,
            preco_venda,
            ativo,
            ativo_pdv
          `)
          .eq(
            "farmacia_slug",
            PORTO_LOJA_SLUG
          )
          .in(
            "produto_id",
            ids
          );

      if (lojaError) {
        throw lojaError;
      }

      /*
       * Mapa:
       *
       * produto_id -> dados Porto
       */
      const portoMap =
        new Map(
          (
            produtosPorto ||
            []
          ).map(
            (r: any) => [
              String(
                r.produto_id
              ),
              r,
            ]
          )
        );

      /*
       * 3 - Junta FV + Porto
       */
      const lista: Produto[] =
        produtosEncontrados.map(
          (p: any) => {
            const porto: any =
              portoMap.get(
                String(p.id)
              );

            const estoque =
              Number(
                porto?.estoque ||
                  0
              );

            const precoPortoCadastrado =
  Number(
    porto?.preco_venda ||
      0
  );

const precoPMC =
  Number(
    p?.pmc ||
      0
  );

/*
 * Se existe preço próprio da Porto, usa ele.
 * Se não existir, usa o PMC do FV.
 */
const precoPorto =
  precoPortoCadastrado > 0
    ? precoPortoCadastrado
    : precoPMC;

/*
 * Preço usado para consulta
 */
const precoConsulta =
  precoPMC > 0
    ? precoPMC
    : precoPorto;

            /*
             * REGRA DE VENDA
             *
             * Para vender:
             *
             * - precisa existir vínculo Porto
             * - estoque > 0
             * - preço Porto > 0
             *
             * ativo_pdv NÃO interfere
             * na consulta.
             */
            const podeVender =
              !!porto &&
              estoque > 0 &&
              precoPorto > 0;

            return {
              id:
                String(p.id),

              ean:
                String(
                  p.ean ||
                    ""
                ),

              nome:
                String(
                  p.nome ||
                    ""
                ),

              laboratorio:
                p.laboratorio ??
                null,

              apresentacao:
                p.apresentacao ??
                null,

              estoque,

              preco_venda:
                precoPorto,

              preco_consulta:
                precoConsulta,

              pode_vender:
                podeVender,
            };
          }
        );

      /*
       * =====================================================
       * ORDENAÇÃO
       * =====================================================
       *
       * 1º COM estoque Porto
       * 2º SEM estoque
       */
      lista.sort(
        (a, b) => {
          if (
            a.pode_vender !==
            b.pode_vender
          ) {
            return a.pode_vender
              ? -1
              : 1;
          }

          /*
           * Se for EAN:
           * EAN exato primeiro
           */
          const aEAN =
            digits.length >= 8 &&
            a.ean.replace(
              /\D/g,
              ""
            ) === digits;

          const bEAN =
            digits.length >= 8 &&
            b.ean.replace(
              /\D/g,
              ""
            ) === digits;

          if (
            aEAN !== bEAN
          ) {
            return aEAN
              ? -1
              : 1;
          }

          /*
           * Depois ordena
           * alfabeticamente
           */
          return a.nome.localeCompare(
            b.nome,
            "pt-BR"
          );
        }
      );

      setResultados(
        lista
      );

      /*
       * =====================================================
       * LEITOR DE CÓDIGO DE BARRAS
       * =====================================================
       *
       * Se bipar EAN exato
       * e tiver estoque:
       *
       * adiciona automaticamente.
       */
      if (
        digits.length >= 8
      ) {
        const exato =
          lista.find(
            (p) =>
              p.ean.replace(
                /\D/g,
                ""
              ) ===
                digits &&
              p.pode_vender
          );

        if (exato) {
          add(exato);

          setBusca("");

          setResultados([]);
        }
      }
    } catch (
      e: any
    ) {
      console.error(
        "Erro ao buscar produto no PDV Porto:",
        e
      );

      alert(
        e?.message ||
          "Erro ao buscar produto"
      );
    } finally {
      setLoading(
        false
      );

      setTimeout(
        () =>
          inputRef.current?.focus(),
        50
      );
    }
  }

  /*
   * =========================================================
   * ADICIONAR AO CARRINHO
   * =========================================================
   */
  function add(
    p: Produto
  ) {
    /*
     * Produto sem estoque
     * continua aparecendo,
     * mas NÃO entra na venda.
     */
    if (
      !p.pode_vender ||
      p.estoque <= 0 ||
      p.preco_venda <= 0
    ) {
      return;
    }

    setItens(
      (old) => {
        const f =
          old.find(
            (i) =>
              i.id ===
              p.id
          );

        if (f) {
          return old.map(
            (i) =>
              i.id === p.id
                ? {
                    ...i,

                    qtd:
                      Math.min(
                        i.qtd +
                          1,
                        p.estoque
                      ),
                  }
                : i
          );
        }

        return [
          ...old,

          {
            ...p,

            qtd: 1,

            descontoTipo:
              "PERCENTUAL",

            desconto: 0,
          },
        ];
      }
    );
  }

  function qtd(
    id: string,
    d: number
  ) {
    setItens(
      (old) =>
        old
          .map(
            (i) =>
              i.id === id
                ? {
                    ...i,

                    qtd:
                      Math.min(
                        Math.max(
                          i.qtd +
                            d,
                          0
                        ),

                        i.estoque
                      ),
                  }
                : i
          )
          .filter(
            (i) =>
              i.qtd > 0
          )
    );
  }

  function alterarDesconto(
    id: string,
    tipo: TipoDesconto,
    valor: number
  ) {
    setItens(
      (old) =>
        old.map(
          (i) => {
            if (
              i.id !== id
            )
              return i;

            const limite =
              tipo ===
              "PERCENTUAL"
                ? 100
                : i.preco_venda;

            return {
              ...i,

              descontoTipo:
                tipo,

              desconto:
                Math.min(
                  limite,

                  Math.max(
                    0,
                    Number(
                      valor
                    ) || 0
                  )
                ),
            };
          }
        )
    );
  }

  function contaPorForma(
    forma: Forma
  ) {
    if (
      forma ===
      "Dinheiro"
    )
      return (
        contas.find(
          (c) =>
            c.tipo ===
            "CAIXA"
        ) || null
      );

    if (
      forma === "Pix"
    )
      return (
        contas.find(
          (c) =>
            c.tipo ===
              "BANCO" ||
            c.tipo ===
              "PIX"
        ) || null
      );

    return (
      contas.find(
        (c) =>
          c.tipo ===
          "CARTAO_RECEBER"
      ) || null
    );
  }

  function addPagamento() {
    setPagamentos(
      (p) => [
        ...p,

        {
          forma: "Pix",
          valor: "",
        },
      ]
    );
  }

  function setPagamento(
    idx: number,
    patch: Partial<Pagamento>
  ) {
    setPagamentos(
      (old) =>
        old.map(
          (p, i) =>
            i === idx
              ? {
                  ...p,
                  ...patch,
                }
              : p
        )
    );
  }

  function removerPagamento(
    idx: number
  ) {
    setPagamentos(
      (old) =>
        old.filter(
          (_, i) =>
            i !== idx
        )
    );
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

  /*
   * =========================================================
   * FINALIZAÇÃO
   * =========================================================
   *
   * Mantida a estrutura do seu PDV atual.
   */
  async function finalizar() {
    if (!itens.length)
      return alert(
        "Adicione produtos à venda."
      );

    if (
      tipoAtendimento ===
      "ENTREGA"
    ) {
      if (
        !clienteNome.trim()
      )
        return alert(
          "Informe o nome do cliente para entrega."
        );

      if (
        !clienteTelefone.trim()
      )
        return alert(
          "Informe o telefone/WhatsApp do cliente."
        );

      if (
        !endereco.trim() ||
        !numeroEndereco.trim() ||
        !bairro.trim()
      ) {
        return alert(
          "Para entrega, informe endereço, número e bairro."
        );
      }
    }

    const validos =
      pagamentos
        .map(
          (p) => ({
            ...p,

            numero:
              numero(
                p.valor
              ),
          })
        )
        .filter(
          (p) =>
            p.numero > 0
        );

    if (!validos.length)
      return alert(
        "Informe o pagamento."
      );

    if (
      Math.abs(
        validos.reduce(
          (s, p) =>
            s +
            p.numero,
          0
        ) - total
      ) > 0.009
    ) {
      return alert(
        `Os pagamentos precisam somar exatamente ${brl(
          total
        )}.`
      );
    }

    setSalvando(
      true
    );

    try {
      /*
       * CAIXA ABERTO
       */
      const {
        data: cx,
        error: cxErr,
      } =
        await supabase
          .from(
            "porto_caixa_sessoes"
          )
          .select(
            "id"
          )
          .eq(
            "loja_slug",
            PORTO_LOJA_SLUG
          )
          .eq(
            "status",
            "aberto"
          )
          .order(
            "aberto_em",
            {
              ascending:
                false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (cxErr)
        throw cxErr;

      if (!cx)
        throw new Error(
          "Abra o caixa antes de finalizar vendas."
        );

      const cliente =
        tipoAtendimento ===
        "ENTREGA"
          ? {
              nome:
                clienteNome.trim(),

              telefone:
                clienteTelefone.trim(),
            }
          : null;

      const enderecoEntrega =
        tipoAtendimento ===
        "ENTREGA"
          ? {
              endereco:
                endereco.trim(),

              numero:
                numeroEndereco.trim(),

              bairro:
                bairro.trim(),

              complemento:
                complemento.trim() ||
                null,

              referencia:
                referencia.trim() ||
                null,
            }
          : null;

      /*
       * VENDA
       */
      const {
        data: v,
        error,
      } =
        await supabase
          .from(
            "porto_vendas"
          )
          .insert({
            loja_slug:
              PORTO_LOJA_SLUG,

            caixa_sessao_id:
              cx.id,

            origem:
              "PDV",

            status:
              "FINALIZADA",

            cliente,

            tipo_entrega:
              tipoAtendimento,

            endereco_entrega:
              enderecoEntrega,

            taxa_entrega:
              taxa,

            observacoes:
              observacoes.trim() ||
              null,

            total,

            finalizada_em:
              new Date().toISOString(),
          })
          .select(
            "id"
          )
          .single();

      if (error)
        throw error;

      /*
       * ITENS
       */
      const rows =
        itens.map(
          (i) => {
            const precoLiquido =
              precoLiquidoItem(
                i
              );

            const descontoUnitario =
              descontoUnitarioItem(
                i
              );

            return {
              venda_id:
                v.id,

              loja_slug:
                PORTO_LOJA_SLUG,

              produto_id:
                i.id,

              ean:
                i.ean,

              nome:
                i.nome,

              qtd:
                i.qtd,

              preco_original:
                i.preco_venda,

              preco_unit:
                precoLiquido,

              desconto_tipo:
                i.desconto >
                0
                  ? i.descontoTipo
                  : null,

              desconto_percentual:
                i.descontoTipo ===
                "PERCENTUAL"
                  ? i.desconto
                  : 0,

              desconto_unitario:
                descontoUnitario,

              desconto_total:
                descontoUnitario *
                i.qtd,

              total:
                precoLiquido *
                i.qtd,
            };
          }
        );

      const {
        error: ei,
      } =
        await supabase
          .from(
            "porto_venda_itens"
          )
          .insert(
            rows
          );

      if (ei)
        throw ei;

      /*
       * PAGAMENTOS
       */
      for (
        const p of validos
      ) {
        const conta =
          contaPorForma(
            p.forma
          );

        const {
          error: ep,
        } =
          await supabase
            .from(
              "porto_venda_pagamentos"
            )
            .insert({
              venda_id:
                v.id,

              caixa_sessao_id:
                cx.id,

              loja_slug:
                PORTO_LOJA_SLUG,

              forma:
                p.forma,

              valor:
                p.numero,

              conta_financeira_id:
                conta?.id ||
                null,
            });

        if (ep)
          throw ep;

        /*
         * FINANCEIRO
         */
        if (conta) {
          const {
            error: mf,
          } =
            await supabase
              .from(
                "porto_movimentacoes_financeiras"
              )
              .insert({
                loja_slug:
                  PORTO_LOJA_SLUG,

                conta_financeira_id:
                  conta.id,

                tipo:
                  "ENTRADA",

                categoria:
                  `VENDA_${p.forma.toUpperCase()}`,

                descricao:
                  `Venda PDV ${v.id.slice(
                    0,
                    8
                  )}${
                    tipoAtendimento ===
                    "ENTREGA"
                      ? " - ENTREGA"
                      : ""
                  }`,

                valor:
                  p.numero,

                origem_tipo:
                  "VENDA",

                origem_id:
                  v.id,
              });

          if (mf)
            throw mf;
        }
      }

      /*
       * BAIXA DE ESTOQUE
       */
      for (
        const i of itens
      ) {
        const novo =
          Math.max(
            0,
            i.estoque -
              i.qtd
          );

        const {
          error: est,
        } =
          await supabase
            .from(
              "fv_farmacia_produtos"
            )
            .update({
              estoque:
                novo,
            })
            .eq(
              "farmacia_slug",
              PORTO_LOJA_SLUG
            )
            .eq(
              "produto_id",
              i.id
            );

        if (est)
          throw est;
      }

      /*
       * COMPROVANTE
       */
      const comprovante: ComprovantePorto =
        {
          numero:
            v.id
              .slice(
                0,
                8
              )
              .toUpperCase(),

          data:
            new Date(),

          origem:
            "PDV",

          tipo:
            tipoAtendimento,

          clienteNome:
            tipoAtendimento ===
            "ENTREGA"
              ? clienteNome.trim()
              : undefined,

          clienteTelefone:
            tipoAtendimento ===
            "ENTREGA"
              ? clienteTelefone.trim()
              : undefined,

          enderecoEntrega:
            enderecoEntrega
              ? {
                  endereco:
                    enderecoEntrega.endereco,

                  numero:
                    enderecoEntrega.numero,

                  bairro:
                    enderecoEntrega.bairro,

                  complemento:
                    enderecoEntrega.complemento ||
                    undefined,

                  referencia:
                    enderecoEntrega.referencia ||
                    undefined,
                }
              : null,

          itens:
            itens.map(
              (i) => ({
                nome:
                  i.nome,

                qtd:
                  i.qtd,

                precoOriginal:
                  i.preco_venda,

                precoUnit:
                  precoLiquidoItem(
                    i
                  ),

                descontoUnitario:
                  descontoUnitarioItem(
                    i
                  ),

                descontoTotal:
                  descontoUnitarioItem(
                    i
                  ) *
                  i.qtd,

                total:
                  precoLiquidoItem(
                    i
                  ) *
                  i.qtd,
              })
            ),

          subtotalBruto,

          descontoTotal,

          subtotal,

          taxaEntrega:
            taxa,

          total,

          pagamentos:
            validos.map(
              (p) => ({
                forma:
                  p.forma,

                valor:
                  p.numero,
              })
            ),

          observacoes:
            observacoes.trim() ||
            undefined,
        };

      setUltimoComprovante(
        comprovante
      );

      imprimirComprovantePorto(
        comprovante
      );

      alert(
        `${
          tipoAtendimento ===
          "ENTREGA"
            ? "Venda para entrega"
            : "Venda"
        } finalizada: ${brl(
          total
        )}.\n` +
          `Pagamento(s) enviado(s) automaticamente ao caixa.\n` +
          `A impressão do comprovante foi aberta.`
      );

      /*
       * LIMPA VENDA
       */
      setItens([]);

      setResultados([]);

      setBusca("");

      setPagamentos([
        {
          forma:
            "Dinheiro",

          valor:
            "",
        },
      ]);

      setTipoAtendimento(
        "BALCAO"
      );

      limparEntrega();
    } catch (
      e: any
    ) {
      console.error(
        e
      );

      alert(
        e?.message ||
          "Erro ao finalizar venda"
      );
    } finally {
      setSalvando(
        false
      );

      inputRef.current?.focus();
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-2 pb-24 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1500px]">

        {/* CABEÇALHO */}

        <header className="mb-3 flex items-center justify-between rounded-2xl bg-blue-900 p-3 text-white md:mb-4 md:p-4">

          <div>
            <p className="text-[10px] font-bold text-blue-200 md:text-xs">
              DROGARIAS PORTO • LOJA 2
            </p>

            <h1 className="text-xl font-black md:text-2xl">
              PDV
            </h1>
          </div>

          <div className="flex gap-2">

            {ultimoComprovante && (
              <button
                onClick={() =>
                  imprimirComprovantePorto(
                    ultimoComprovante
                  )
                }
                className="hidden items-center gap-2 rounded-xl bg-white/10 px-3 py-2 font-bold sm:flex"
              >
                <Printer
                  size={18}
                />

                Reimprimir
              </button>
            )}

            <Link
              href="/drogariasporto"
              className="rounded-xl bg-white/10 p-2"
            >
              <ArrowLeft />
            </Link>

            <Link
              href="/drogariasporto/caixa"
              className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-blue-900 md:px-4"
            >
              Caixa
            </Link>

          </div>

        </header>


        <div className="grid gap-4 xl:grid-cols-[1fr_480px]">

          {/* LADO ESQUERDO */}

          <section className="rounded-2xl bg-white p-3 shadow-sm md:p-4">

            {/* BUSCA */}

            <div className="flex gap-2">

              <div className="flex flex-1 items-center rounded-xl border-2 border-blue-300 px-3 focus-within:border-blue-600 md:px-4">

                <Search />

                <input
                  ref={
                    inputRef
                  }
                  value={
                    busca
                  }
                  onChange={(
                    e
                  ) =>
                    setBusca(
                      e.target.value
                    )
                  }
                  onKeyDown={(
                    e
                  ) =>
                    e.key ===
                      "Enter" &&
                    pesquisar()
                  }
                  placeholder="Nome ou código de barras"
                  className="w-full px-3 py-3 text-base font-semibold outline-none md:py-4 md:text-lg"
                />

              </div>

              <button
                onClick={
                  pesquisar
                }
                disabled={
                  loading
                }
                className="rounded-xl bg-blue-700 px-4 font-black text-white disabled:opacity-50 md:px-6"
              >
                {loading
                  ? "..."
                  : "Buscar"}
              </button>

            </div>

            <p className="mt-2 text-xs text-slate-500">
              Consulta todos os produtos do FV. Produtos com estoque na Porto aparecem primeiro.
            </p>


            {/* RESULTADOS */}

            <div className="mt-3 grid gap-2 md:grid-cols-2">

              {loading ? (

                <p className="p-4">
                  Buscando...
                </p>

              ) : (

                resultados.map(
                  (p) => (

                    <div
                      key={
                        p.id
                      }
                      className={`rounded-2xl border-2 p-3 ${
                        p.pode_vender
                          ? "border-green-200 bg-green-50/40"
                          : "border-slate-200 bg-white"
                      }`}
                    >

                      <div className="flex items-start gap-3">

                        <div className="min-w-0 flex-1">

                          {/* STATUS */}

                          <div className="mb-2">

                            {p.pode_vender ? (

                              <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-black text-green-800">
                                EM ESTOQUE
                              </span>

                            ) : (

                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">
                                CONSULTA
                              </span>

                            )}

                          </div>


                          {/* NOME */}

                          <div className="text-base font-black leading-tight text-slate-900">
                            {p.nome}
                          </div>


                          {/* LAB / APRESENTAÇÃO */}

                          <div className="mt-1 text-xs text-slate-500">

                            {[
                              p.laboratorio,
                              p.apresentacao,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " • "
                              )}

                          </div>


                          {/* EAN */}

                          {p.ean && (

                            <div className="mt-1 text-[11px] text-slate-400">
                              EAN{" "}
                              {p.ean}
                            </div>

                          )}


                          {/* PREÇO E ESTOQUE */}

                          <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">

                            <div>

                              <div className="text-[10px] font-bold uppercase text-slate-400">

                                {p.pode_vender
                                  ? "Preço Porto"
                                  : "Preço consulta FV"}

                              </div>

                              <div className="text-xl font-black text-blue-800">

                                {brl(
                                  p.pode_vender
                                    ? p.preco_venda
                                    : p.preco_consulta
                                )}

                              </div>

                            </div>


                            <div>

                              <div className="text-[10px] font-bold uppercase text-slate-400">
                                Estoque Porto
                              </div>

                              <div
                                className={
                                  p.estoque >
                                  0
                                    ? "font-black text-green-700"
                                    : "font-black text-slate-500"
                                }
                              >

                                {p.estoque >
                                0
                                  ? p.estoque
                                  : "Sem estoque"}

                              </div>

                            </div>

                          </div>

                        </div>


                        {/* ADICIONAR */}

                        <div className="flex shrink-0 self-stretch items-end">

                          <button
                            type="button"
                            disabled={
                              !p.pode_vender
                            }
                            onClick={() =>
                              add(
                                p
                              )
                            }
                            className={`min-h-12 rounded-xl px-3 text-sm font-black ${
                              p.pode_vender
                                ? "bg-green-600 text-white hover:bg-green-700 active:scale-95"
                                : "cursor-not-allowed bg-slate-100 text-slate-400"
                            }`}
                          >

                            {p.pode_vender
                              ? "+ Adicionar"
                              : "Indisponível"}

                          </button>

                        </div>

                      </div>

                    </div>

                  )
                )

              )}

            </div>


            {/* CARRINHO */}

            <div className="mt-5 overflow-x-auto rounded-xl border">

              <table className="min-w-[850px] w-full text-sm">

                <thead className="bg-slate-50 text-left">

                  <tr>
                    <th className="p-3">
                      Produto
                    </th>

                    <th>
                      Qtd
                    </th>

                    <th>
                      Preço
                    </th>

                    <th>
                      Desconto
                    </th>

                    <th>
                      Unit. final
                    </th>

                    <th>
                      Total
                    </th>

                    <th></th>
                  </tr>

                </thead>

                <tbody>

                  {itens.map(
                    (i) => (

                      <tr
                        key={
                          i.id
                        }
                        className="border-t"
                      >

                        <td className="p-3">

                          <b>
                            {i.nome}
                          </b>

                          <small className="block text-slate-500">
                            EAN{" "}
                            {i.ean}
                          </small>

                        </td>


                        <td>

                          <div className="inline-flex items-center rounded-lg border">

                            <button
                              onClick={() =>
                                qtd(
                                  i.id,
                                  -1
                                )
                              }
                              className="p-2"
                            >
                              <Minus
                                size={
                                  14
                                }
                              />
                            </button>

                            <b className="px-2">
                              {i.qtd}
                            </b>

                            <button
                              onClick={() =>
                                qtd(
                                  i.id,
                                  1
                                )
                              }
                              className="p-2"
                            >
                              <Plus
                                size={
                                  14
                                }
                              />
                            </button>

                          </div>

                        </td>


                        <td>
                          {brl(
                            i.preco_venda
                          )}
                        </td>


                        <td>

                          <div className="flex min-w-[170px] items-center gap-1">

                            <select
                              value={
                                i.descontoTipo
                              }
                              onChange={(
                                e
                              ) =>
                                alterarDesconto(
                                  i.id,
                                  e.target
                                    .value as TipoDesconto,
                                  i.desconto
                                )
                              }
                              className="rounded-lg border bg-white px-2 py-2 text-xs font-bold"
                            >
                              <option value="PERCENTUAL">
                                %
                              </option>

                              <option value="VALOR">
                                R$
                              </option>
                            </select>


                            <input
                              value={
                                i.desconto
                                  ? String(
                                      i.desconto
                                    ).replace(
                                      ".",
                                      ","
                                    )
                                  : ""
                              }
                              onChange={(
                                e
                              ) =>
                                alterarDesconto(
                                  i.id,
                                  i.descontoTipo,
                                  numero(
                                    e.target
                                      .value
                                  )
                                )
                              }
                              inputMode="decimal"
                              placeholder="0"
                              className="w-20 rounded-lg border px-2 py-2 text-right font-bold outline-none focus:border-blue-600"
                            />


                            {i.desconto >
                              0 && (

                              <button
                                onClick={() =>
                                  alterarDesconto(
                                    i.id,
                                    i.descontoTipo,
                                    0
                                  )
                                }
                                className="rounded-lg border px-2 py-2 text-xs font-bold text-red-600"
                              >
                                ×
                              </button>

                            )}

                          </div>


                          {descontoUnitarioItem(
                            i
                          ) > 0 && (

                            <small className="mt-1 block font-bold text-green-700">

                              -{" "}
                              {brl(
                                descontoUnitarioItem(
                                  i
                                )
                              )}
                              /un.

                            </small>

                          )}

                        </td>


                        <td className="font-bold text-blue-800">

                          {brl(
                            precoLiquidoItem(
                              i
                            )
                          )}

                        </td>


                        <td className="font-bold">

                          {brl(
                            precoLiquidoItem(
                              i
                            ) *
                              i.qtd
                          )}

                        </td>


                        <td>

                          <button
                            onClick={() =>
                              setItens(
                                (
                                  x
                                ) =>
                                  x.filter(
                                    (
                                      y
                                    ) =>
                                      y.id !==
                                      i.id
                                  )
                              )
                            }
                            className="p-2 text-red-600"
                          >
                            <Trash2
                              size={
                                18
                              }
                            />
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>


              {!itens.length && (

                <div className="p-8 text-center text-slate-400">
                  Venda vazia
                </div>

              )}

            </div>

          </section>


          {/* FINALIZAÇÃO */}

          <aside className="rounded-2xl bg-white p-4 shadow-sm md:p-5">

            <p className="text-sm font-bold text-slate-500">
              TOTAL DA VENDA
            </p>

            <div className="mt-1 text-4xl font-black text-blue-900 md:text-5xl">
              {brl(
                total
              )}
            </div>


            {/* ATENDIMENTO */}

            <div className="mt-5">

              <h2 className="font-black">
                Tipo de atendimento
              </h2>

              <div className="mt-2 grid grid-cols-2 gap-2">

                <button
                  onClick={() =>
                    setTipoAtendimento(
                      "BALCAO"
                    )
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 font-black ${
                    tipoAtendimento ===
                    "BALCAO"
                      ? "border-blue-700 bg-blue-50 text-blue-800"
                      : "border-slate-200"
                  }`}
                >
                  <Store
                    size={
                      18
                    }
                  />

                  Balcão
                </button>


                <button
                  onClick={() =>
                    setTipoAtendimento(
                      "ENTREGA"
                    )
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 font-black ${
                    tipoAtendimento ===
                    "ENTREGA"
                      ? "border-green-600 bg-green-50 text-green-800"
                      : "border-slate-200"
                  }`}
                >
                  <Truck
                    size={
                      18
                    }
                  />

                  Entrega
                </button>

              </div>

            </div>


            {/* ENTREGA */}

            {tipoAtendimento ===
              "ENTREGA" && (

              <div className="mt-4 rounded-2xl border-2 border-green-100 bg-green-50/40 p-4">

                <div className="mb-3 flex items-center gap-2 font-black text-green-900">

                  <Truck
                    size={
                      18
                    }
                  />

                  Dados da entrega

                </div>


                <div className="grid gap-2 sm:grid-cols-2">

                  <input
                    value={
                      clienteNome
                    }
                    onChange={(
                      e
                    ) =>
                      setClienteNome(
                        e.target
                          .value
                      )
                    }
                    placeholder="Nome do cliente *"
                    className="rounded-xl border p-3 sm:col-span-2"
                  />


                  <input
                    value={
                      clienteTelefone
                    }
                    onChange={(
                      e
                    ) =>
                      setClienteTelefone(
                        e.target
                          .value
                      )
                    }
                    placeholder="Telefone / WhatsApp *"
                    className="rounded-xl border p-3 sm:col-span-2"
                  />


                  <input
                    value={
                      endereco
                    }
                    onChange={(
                      e
                    ) =>
                      setEndereco(
                        e.target
                          .value
                      )
                    }
                    placeholder="Endereço *"
                    className="rounded-xl border p-3"
                  />


                  <input
                    value={
                      numeroEndereco
                    }
                    onChange={(
                      e
                    ) =>
                      setNumeroEndereco(
                        e.target
                          .value
                      )
                    }
                    placeholder="Número *"
                    className="rounded-xl border p-3"
                  />


                  <input
                    value={
                      bairro
                    }
                    onChange={(
                      e
                    ) =>
                      setBairro(
                        e.target
                          .value
                      )
                    }
                    placeholder="Bairro *"
                    className="rounded-xl border p-3 sm:col-span-2"
                  />


                  <input
                    value={
                      complemento
                    }
                    onChange={(
                      e
                    ) =>
                      setComplemento(
                        e.target
                          .value
                      )
                    }
                    placeholder="Complemento"
                    className="rounded-xl border p-3 sm:col-span-2"
                  />


                  <input
                    value={
                      referencia
                    }
                    onChange={(
                      e
                    ) =>
                      setReferencia(
                        e.target
                          .value
                      )
                    }
                    placeholder="Referência"
                    className="rounded-xl border p-3 sm:col-span-2"
                  />


                  <label className="sm:col-span-2">

                    <span className="mb-1 block text-xs font-bold text-slate-600">
                      Taxa de entrega
                    </span>

                    <input
                      value={
                        taxaEntrega
                      }
                      onChange={(
                        e
                      ) =>
                        setTaxaEntrega(
                          e.target
                            .value
                        )
                      }
                      placeholder="0,00"
                      inputMode="decimal"
                      className="w-full rounded-xl border p-3"
                    />

                  </label>


                  <textarea
                    value={
                      observacoes
                    }
                    onChange={(
                      e
                    ) =>
                      setObservacoes(
                        e.target
                          .value
                      )
                    }
                    placeholder="Observações da entrega"
                    className="min-h-20 rounded-xl border p-3 sm:col-span-2"
                  />

                </div>

              </div>

            )}


            {/* PAGAMENTOS */}

            <div className="mt-5 flex items-center justify-between">

              <h2 className="font-black">
                Pagamentos
              </h2>

              <button
                onClick={
                  addPagamento
                }
                className="rounded-lg border px-3 py-2 text-sm font-bold"
              >
                + Pagamento misto
              </button>

            </div>


            <div className="mt-3 space-y-3">

              {pagamentos.map(
                (
                  p,
                  idx
                ) => (

                  <div
                    key={
                      idx
                    }
                    className="rounded-xl border p-3"
                  >

                    <div className="grid grid-cols-[1fr_120px_auto] gap-2">

                      <select
                        value={
                          p.forma
                        }
                        onChange={(
                          e
                        ) =>
                          setPagamento(
                            idx,
                            {
                              forma:
                                e
                                  .target
                                  .value as Forma,
                            }
                          )
                        }
                        className="rounded-lg border p-2 font-bold"
                      >

                        <option>
                          Dinheiro
                        </option>

                        <option>
                          Pix
                        </option>

                        <option>
                          Débito
                        </option>

                        <option>
                          Crédito
                        </option>

                      </select>


                      <input
                        value={
                          p.valor
                        }
                        onChange={(
                          e
                        ) =>
                          setPagamento(
                            idx,
                            {
                              valor:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="rounded-lg border p-2 text-right font-bold"
                        placeholder="0,00"
                        inputMode="decimal"
                      />


                      {pagamentos.length >
                        1 && (

                        <button
                          onClick={() =>
                            removerPagamento(
                              idx
                            )
                          }
                          className="rounded-lg p-2 text-red-600"
                        >
                          <Trash2
                            size={
                              18
                            }
                          />
                        </button>

                      )}

                    </div>

                  </div>

                )
              )}

            </div>


            {/* RESUMO */}

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">

              <div className="flex justify-between">

                <span>
                  Subtotal bruto
                </span>

                <b>
                  {brl(
                    subtotalBruto
                  )}
                </b>

              </div>


              {descontoTotal >
                0 && (

                <div className="mt-1 flex justify-between text-green-700">

                  <span>
                    Descontos nos itens
                  </span>

                  <b>
                    -{" "}
                    {brl(
                      descontoTotal
                    )}
                  </b>

                </div>

              )}


              <div className="mt-1 flex justify-between">

                <span>
                  Subtotal
                </span>

                <b>
                  {brl(
                    subtotal
                  )}
                </b>

              </div>


              {tipoAtendimento ===
                "ENTREGA" && (

                <div className="mt-1 flex justify-between">

                  <span>
                    Taxa entrega
                  </span>

                  <b>
                    {brl(
                      taxa
                    )}
                  </b>

                </div>

              )}


              <div className="mt-1 flex justify-between">

                <span>
                  Informado
                </span>

                <b>
                  {brl(
                    totalPagamentos
                  )}
                </b>

              </div>


              <div className="mt-1 flex justify-between">

                <span>
                  Falta
                </span>

                <b
                  className={
                    faltante >
                    0
                      ? "text-red-600"
                      : "text-green-700"
                  }
                >
                  {brl(
                    faltante
                  )}
                </b>

              </div>

            </div>


            {/* ÍCONES */}

            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-500">

              <div>
                <Banknote className="mx-auto" />
                Dinheiro
              </div>

              <div>
                <QrCode className="mx-auto" />
                Pix
              </div>

              <div>
                <CreditCard className="mx-auto" />
                Débito
              </div>

              <div>
                <CreditCard className="mx-auto" />
                Crédito
              </div>

            </div>


            {/* FINALIZAR */}

            <button
              disabled={
                salvando ||
                !itens.length ||
                Math.abs(
                  totalPagamentos -
                    total
                ) >
                  0.009
              }
              onClick={
                finalizar
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-5 text-xl font-black text-white disabled:opacity-40"
            >

              <ReceiptText />

              {salvando
                ? "Finalizando..."
                : tipoAtendimento ===
                  "ENTREGA"
                ? "FINALIZAR ENTREGA"
                : "FINALIZAR VENDA"}

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