"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Banknote,
  BarChart3,
  Box,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  DollarSign,
  FileText,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import { BrowserMultiFormatReader } from "@zxing/browser";

import { supabase } from "@/lib/supabaseClient";
import {
  PORTO_LOJA_SLUG,
  brl,
} from "../_lib/porto";

/* =========================================================
   TIPOS
========================================================= */

type Aba =
  | "RESUMO"
  | "VENDAS"
  | "CAIXA"
  | "ESTOQUE";

type TipoRelatorioEstoque =
  | null
  | "BUSCA"
  | "BAIXO"
  | "ZERADO"
  | "COM_ESTOQUE"
  | "GERAL";

type Venda = {
  id: string;
  caixa_sessao_id: string | null;
  total: number;
  created_at: string;

  tipo_atendimento?: string | null;
  modalidade?: string | null;
  entrega_retirada?: string | null;

  observacoes?: string | null;
};

type Pagamento = {
  id: string;
  venda_id: string;
  caixa_sessao_id: string | null;
  forma: string;
  valor: number;
  created_at: string;
};

type ItemVenda = {
  id: string;
  venda_id: string;

  produto_id: string | null;

  ean: string | null;
  nome: string;

  quantidade: number;

  preco_unitario: number;
  desconto: number | null;

  total: number;

  created_at?: string;
};

type Sessao = {
  id: string;

  operador: string | null;

  status: string;

  valor_abertura: number;

  valor_fechamento?: number | null;
  valor_contado: number | null;
  diferenca: number | null;

  resumo_pagamentos: any;

  aberto_em: string;
  fechado_em: string | null;
};

type MovimentoCaixa = {
  id: string;

  caixa_sessao_id: string;

  tipo:
    | "SANGRIA"
    | "SUPRIMENTO"
    | "DESPESA"
    | "BOLETO";

  descricao: string;

  valor: number;

  created_at: string;
};

type ProdutoEstoque = {
  produto_id: string;

  ean: string;

  nome: string;

  laboratorio: string | null;
  apresentacao: string | null;

  estoque: number;

  preco_custo: number | null;
  preco_venda: number | null;

  ativo: boolean;
  ativo_site: boolean;
  ativo_pdv: boolean;
};

type ItemVendaDetalhado =
  ItemVenda & {
    custo_unitario: number | null;
  };

/* =========================================================
   HELPERS
========================================================= */

function n(v: any) {
  const x = Number(v || 0);

  return Number.isFinite(x)
    ? x
    : 0;
}

function onlyDigits(v: string) {
  return (v || "").replace(
    /\D/g,
    ""
  );
}

function dataInputHoje() {
  const agora =
    new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      agora.getDate()
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function dataBR(data: string) {
  if (!data) {
    return "—";
  }

  const [
    ano,
    mes,
    dia,
  ] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}

function intervaloData(
  data: string
) {
  const [
    ano,
    mes,
    dia,
  ] = data
    .split("-")
    .map(Number);

  /*
   * Criamos em horário local.
   * Ao converter para ISO, o JS aplica corretamente
   * o fuso do navegador.
   */
  const inicio =
    new Date(
      ano,
      mes - 1,
      dia,
      0,
      0,
      0,
      0
    );

  const fim =
    new Date(
      ano,
      mes - 1,
      dia,
      23,
      59,
      59,
      999
    );

  return {
    inicio:
      inicio.toISOString(),

    fim:
      fim.toISOString(),
  };
}

function mudarData(
  data: string,
  dias: number
) {
  const [
    ano,
    mes,
    dia,
  ] = data
    .split("-")
    .map(Number);

  const d =
    new Date(
      ano,
      mes - 1,
      dia,
      12,
      0,
      0
    );

  d.setDate(
    d.getDate() +
      dias
  );

  const novoAno =
    d.getFullYear();

  const novoMes =
    String(
      d.getMonth() + 1
    ).padStart(2, "0");

  const novoDia =
    String(
      d.getDate()
    ).padStart(2, "0");

  return `${novoAno}-${novoMes}-${novoDia}`;
}

function hora(v: string) {
  try {
    return new Date(
      v
    ).toLocaleTimeString(
      "pt-BR",
      {
        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    );
  } catch {
    return "--:--";
  }
}

function dataHora(v: string) {
  try {
    return new Date(
      v
    ).toLocaleString(
      "pt-BR",
      {
        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    );
  } catch {
    return "—";
  }
}

function margem(
  custo: number,
  venda: number
) {
  if (venda <= 0) {
    return 0;
  }

  return (
    ((venda - custo) /
      venda) *
    100
  );
}

function nomeForma(
  forma: string
) {
  const f =
    String(
      forma || ""
    ).toLowerCase();

  if (
    f.includes(
      "dinheiro"
    )
  ) {
    return "Dinheiro";
  }

  if (
    f.includes(
      "pix"
    )
  ) {
    return "Pix";
  }

  if (
    f.includes(
      "deb"
    )
  ) {
    return "Débito";
  }

  if (
    f.includes(
      "cred"
    )
  ) {
    return "Crédito";
  }

  return forma || "Outro";
}

/* =========================================================
   PÁGINA
========================================================= */

export default function PortoRelatoriosPage() {
  const [
    aba,
    setAba,
  ] =
    useState<Aba>(
      "RESUMO"
    );

  const [
    dataSelecionada,
    setDataSelecionada,
  ] =
    useState(
      dataInputHoje()
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    atualizando,
    setAtualizando,
  ] =
    useState(false);

  const [
    ultimaAtualizacao,
    setUltimaAtualizacao,
  ] =
    useState<Date | null>(
      null
    );

  const [
    vendas,
    setVendas,
  ] =
    useState<Venda[]>([]);

  const [
    pagamentos,
    setPagamentos,
  ] =
    useState<Pagamento[]>(
      []
    );

  const [
    itens,
    setItens,
  ] =
    useState<
      ItemVendaDetalhado[]
    >([]);

  /*
   * Agora pode existir mais de um caixa no mesmo dia.
   * Guardamos todas as sessões da data.
   */
  const [
    sessoes,
    setSessoes,
  ] =
    useState<Sessao[]>([]);

  const [
    movimentos,
    setMovimentos,
  ] =
    useState<
      MovimentoCaixa[]
    >([]);

  /*
   * O estoque NÃO será carregado automaticamente
   * ao abrir o painel.
   */
  const [
    estoque,
    setEstoque,
  ] =
    useState<
      ProdutoEstoque[]
    >([]);

  const [
    estoqueCarregado,
    setEstoqueCarregado,
  ] =
    useState(false);

  const [
    loadingEstoque,
    setLoadingEstoque,
  ] =
    useState(false);

  const [
    buscaEstoque,
    setBuscaEstoque,
  ] =
    useState("");

  const [
    tipoRelatorioEstoque,
    setTipoRelatorioEstoque,
  ] =
    useState<TipoRelatorioEstoque>(
      null
    );

  const [
    vendaAberta,
    setVendaAberta,
  ] =
    useState<
      string | null
    >(null);

  /* =======================================================
     CÂMERA
  ======================================================= */

  const [
    cameraAberta,
    setCameraAberta,
  ] =
    useState(false);

  const [
    cameraErro,
    setCameraErro,
  ] =
    useState("");

  const [
    cameraLendo,
    setCameraLendo,
  ] =
    useState(false);

  const videoRef =
    useRef<HTMLVideoElement>(
      null
    );

  const scannerControlsRef =
    useRef<any>(null);

  const codigoLidoRef =
    useRef(false);

  /* =======================================================
     CARREGAR RELATÓRIO DA DATA
  ======================================================= */

  const carregarRelatorio =
    useCallback(
      async (
        dataRelatorio: string,
        silencioso = false
      ) => {
        try {
          if (
            silencioso
          ) {
            setAtualizando(
              true
            );
          } else {
            setLoading(true);
          }

          const {
            inicio,
            fim,
          } =
            intervaloData(
              dataRelatorio
            );

          /* ===============================================
             VENDAS DA DATA
          =============================================== */

          const {
            data:
              vendasData,
            error:
              vendasError,
          } =
            await supabase
              .from(
                "porto_vendas"
              )
              .select("*")
              .eq(
                "loja_slug",
                PORTO_LOJA_SLUG
              )
              .gte(
                "created_at",
                inicio
              )
              .lte(
                "created_at",
                fim
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );

          if (
            vendasError
          ) {
            throw vendasError;
          }

          const vendasDia =
            (vendasData ||
              []) as Venda[];

          setVendas(
            vendasDia
          );

          const vendaIds =
            vendasDia.map(
              (v) => v.id
            );

          /* ===============================================
             PAGAMENTOS E ITENS DA DATA
          =============================================== */

          let pagamentosDia:
            Pagamento[] =
              [];

          let itensDia:
            ItemVenda[] =
              [];

          if (
            vendaIds.length >
            0
          ) {
            /*
             * Fazemos em blocos para evitar problemas
             * se houver muitas vendas no dia.
             */
            const chunkSize =
              300;

            for (
              let i = 0;
              i <
              vendaIds.length;
              i +=
                chunkSize
            ) {
              const ids =
                vendaIds.slice(
                  i,
                  i +
                    chunkSize
                );

              const [
                pagamentosRes,
                itensRes,
              ] =
                await Promise.all(
                  [
                    supabase
                      .from(
                        "porto_venda_pagamentos"
                      )
                      .select(
                        "id,venda_id,caixa_sessao_id,forma,valor,created_at"
                      )
                      .in(
                        "venda_id",
                        ids
                      ),

                    supabase
                      .from(
                        "porto_venda_itens"
                      )
                      .select(
                        "*"
                      )
                      .in(
                        "venda_id",
                        ids
                      ),
                  ]
                );

              if (
                pagamentosRes.error
              ) {
                throw pagamentosRes.error;
              }

              if (
                itensRes.error
              ) {
                throw itensRes.error;
              }

              pagamentosDia.push(
                ...(
                  (pagamentosRes.data ||
                    []) as Pagamento[]
                )
              );

              itensDia.push(
                ...(
                  (itensRes.data ||
                    []) as ItemVenda[]
                )
              );
            }
          }

          pagamentosDia.sort(
            (a, b) =>
              new Date(
                b.created_at
              ).getTime() -
              new Date(
                a.created_at
              ).getTime()
          );

          setPagamentos(
            pagamentosDia
          );

          /* ===============================================
             CAIXAS DA DATA
             
             Não filtramos mais somente "aberto".
             Assim podemos consultar caixa fechado de
             qualquer dia anterior.
          =============================================== */

          const {
            data:
              sessoesData,
            error:
              sessoesError,
          } =
            await supabase
              .from(
                "porto_caixa_sessoes"
              )
              .select("*")
              .eq(
                "loja_slug",
                PORTO_LOJA_SLUG
              )
              .gte(
                "aberto_em",
                inicio
              )
              .lte(
                "aberto_em",
                fim
              )
              .order(
                "aberto_em",
                {
                  ascending:
                    true,
                }
              );

          if (
            sessoesError
          ) {
            throw sessoesError;
          }

          const sessoesDia =
            (sessoesData ||
              []) as Sessao[];

          setSessoes(
            sessoesDia
          );

          /* ===============================================
             MOVIMENTAÇÕES DOS CAIXAS DA DATA
          =============================================== */

          const sessaoIds =
            sessoesDia.map(
              (s) => s.id
            );

          let movimentosDia:
            MovimentoCaixa[] =
              [];

          if (
            sessaoIds.length >
            0
          ) {
            const {
              data:
                movData,
              error:
                movError,
            } =
              await supabase
                .from(
                  "porto_caixa_movimentacoes"
                )
                .select(
                  "id,caixa_sessao_id,tipo,descricao,valor,created_at"
                )
                .in(
                  "caixa_sessao_id",
                  sessaoIds
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                );

            if (
              movError
            ) {
              throw movError;
            }

            movimentosDia =
              (movData ||
                []) as MovimentoCaixa[];
          }

          setMovimentos(
            movimentosDia
          );

          /* ===============================================
             CUSTOS DOS ITENS VENDIDOS

             Para o relatório financeiro do dia não
             precisamos carregar todo o estoque.

             Buscamos somente os produtos que realmente
             apareceram nas vendas daquela data.
          =============================================== */

          const produtoIds =
            Array.from(
              new Set(
                itensDia
                  .map(
                    (i) =>
                      i.produto_id
                  )
                  .filter(
                    Boolean
                  )
                  .map(
                    String
                  )
              )
            );

          const eans =
            Array.from(
              new Set(
                itensDia
                  .map(
                    (i) =>
                      i.ean
                  )
                  .filter(
                    Boolean
                  )
                  .map(
                    String
                  )
              )
            );

          const custoPorId =
            new Map<
              string,
              number | null
            >();

          const custoPorEan =
            new Map<
              string,
              number | null
            >();

          if (
            produtoIds.length >
            0
          ) {
            const chunkSize =
              300;

            for (
              let i = 0;
              i <
              produtoIds.length;
              i +=
                chunkSize
            ) {
              const ids =
                produtoIds.slice(
                  i,
                  i +
                    chunkSize
                );

              const {
                data:
                  custos,
                error:
                  custoError,
              } =
                await supabase
                  .from(
                    "fv_farmacia_produtos"
                  )
                  .select(
                    "produto_id,ean,preco_custo"
                  )
                  .eq(
                    "farmacia_slug",
                    PORTO_LOJA_SLUG
                  )
                  .in(
                    "produto_id",
                    ids
                  );

              if (
                custoError
              ) {
                throw custoError;
              }

              (
                custos ||
                []
              ).forEach(
                (r: any) => {
                  custoPorId.set(
                    String(
                      r.produto_id
                    ),
                    r.preco_custo ===
                      null
                      ? null
                      : n(
                          r.preco_custo
                        )
                  );

                  if (
                    r.ean
                  ) {
                    custoPorEan.set(
                      String(
                        r.ean
                      ),
                      r.preco_custo ===
                        null
                        ? null
                        : n(
                            r.preco_custo
                          )
                    );
                  }
                }
              );
            }
          }

          /*
           * Se algum item antigo não tiver produto_id,
           * ainda tentamos localizar o custo pelo EAN.
           */
          if (
            eans.length >
            0
          ) {
            const eansFaltantes =
              eans.filter(
                (ean) =>
                  !custoPorEan.has(
                    ean
                  )
              );

            const chunkSize =
              300;

            for (
              let i = 0;
              i <
              eansFaltantes.length;
              i +=
                chunkSize
            ) {
              const lista =
                eansFaltantes.slice(
                  i,
                  i +
                    chunkSize
                );

              if (
                lista.length ===
                0
              ) {
                continue;
              }

              const {
                data:
                  custos,
                error:
                  custoError,
              } =
                await supabase
                  .from(
                    "fv_farmacia_produtos"
                  )
                  .select(
                    "produto_id,ean,preco_custo"
                  )
                  .eq(
                    "farmacia_slug",
                    PORTO_LOJA_SLUG
                  )
                  .in(
                    "ean",
                    lista
                  );

              if (
                custoError
              ) {
                throw custoError;
              }

              (
                custos ||
                []
              ).forEach(
                (r: any) => {
                  if (
                    r.produto_id
                  ) {
                    custoPorId.set(
                      String(
                        r.produto_id
                      ),
                      r.preco_custo ===
                        null
                        ? null
                        : n(
                            r.preco_custo
                          )
                    );
                  }

                  if (
                    r.ean
                  ) {
                    custoPorEan.set(
                      String(
                        r.ean
                      ),
                      r.preco_custo ===
                        null
                        ? null
                        : n(
                            r.preco_custo
                          )
                    );
                  }
                }
              );
            }
          }

          const itensComCusto: ItemVendaDetalhado[] =
            itensDia.map(
              (item) => {
                let custo:
                  number | null =
                    null;

                if (
                  item.produto_id &&
                  custoPorId.has(
                    String(
                      item.produto_id
                    )
                  )
                ) {
                  custo =
                    custoPorId.get(
                      String(
                        item.produto_id
                      )
                    ) ??
                    null;
                } else if (
                  item.ean &&
                  custoPorEan.has(
                    String(
                      item.ean
                    )
                  )
                ) {
                  custo =
                    custoPorEan.get(
                      String(
                        item.ean
                      )
                    ) ??
                    null;
                }

                return {
                  ...item,
                  custo_unitario:
                    custo,
                };
              }
            );

          setItens(
            itensComCusto
          );

          setUltimaAtualizacao(
            new Date()
          );
        } catch (e: any) {
          console.error(
            "Relatório Porto:",
            e
          );

          if (
            !silencioso
          ) {
            alert(
              e?.message ||
                "Erro ao carregar relatório."
            );
          }
        } finally {
          setLoading(
            false
          );

          setAtualizando(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     QUANDO MUDA A DATA
  ======================================================= */

  useEffect(() => {
    carregarRelatorio(
      dataSelecionada
    );
  }, [
    dataSelecionada,
    carregarRelatorio,
  ]);

  /*
   * Atualização automática apenas quando estamos
   * consultando a data de hoje.
   */
  useEffect(() => {
    if (
      dataSelecionada !==
      dataInputHoje()
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          carregarRelatorio(
            dataSelecionada,
            true
          );
        },
        30000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    dataSelecionada,
    carregarRelatorio,
  ]);

  /* =======================================================
     RESUMO DA DATA
  ======================================================= */

  const resumo =
    useMemo(() => {
      const totalVendido =
        vendas.reduce(
          (s, v) =>
            s +
            n(v.total),
          0
        );

      const qtdVendas =
        vendas.length;

      const ticketMedio =
        qtdVendas > 0
          ? totalVendido /
            qtdVendas
          : 0;

      const formas = {
        Dinheiro: 0,
        Pix: 0,
        Débito: 0,
        Crédito: 0,
        Outros: 0,
      };

      pagamentos.forEach(
        (p) => {
          const forma =
            nomeForma(
              p.forma
            );

          if (
            forma ===
            "Dinheiro"
          ) {
            formas.Dinheiro +=
              n(p.valor);
          } else if (
            forma ===
            "Pix"
          ) {
            formas.Pix +=
              n(p.valor);
          } else if (
            forma ===
            "Débito"
          ) {
            formas.Débito +=
              n(p.valor);
          } else if (
            forma ===
            "Crédito"
          ) {
            formas.Crédito +=
              n(p.valor);
          } else {
            formas.Outros +=
              n(p.valor);
          }
        }
      );

      let custoVendido =
        0;

      let vendaComCusto =
        0;

      let itensSemCusto =
        0;

      itens.forEach(
        (i) => {
          const qtd =
            n(
              i.quantidade
            );

          const totalItem =
            n(i.total) > 0
              ? n(i.total)
              : n(
                  i.preco_unitario
                ) *
                  qtd -
                n(
                  i.desconto
                );

          if (
            i.custo_unitario !==
              null &&
            n(
              i.custo_unitario
            ) > 0
          ) {
            custoVendido +=
              n(
                i.custo_unitario
              ) *
              qtd;

            vendaComCusto +=
              totalItem;
          } else {
            itensSemCusto++;
          }
        }
      );

      const lucroBruto =
        vendaComCusto -
        custoVendido;

      const margemBruta =
        vendaComCusto > 0
          ? margem(
              custoVendido,
              vendaComCusto
            )
          : 0;

      return {
        totalVendido,
        qtdVendas,
        ticketMedio,
        formas,
        custoVendido,
        vendaComCusto,
        lucroBruto,
        margemBruta,
        itensSemCusto,
      };
    }, [
      vendas,
      pagamentos,
      itens,
    ]);

  /* =======================================================
     MAIS VENDIDOS NA DATA
  ======================================================= */

  const maisVendidos =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            nome: string;
            quantidade: number;
            total: number;
          }
        >();

      itens.forEach(
        (i) => {
          const chave =
            i.produto_id ||
            i.ean ||
            i.nome;

          const atual =
            map.get(
              String(chave)
            ) || {
              nome:
                i.nome ||
                "Produto",

              quantidade: 0,

              total: 0,
            };

          atual.quantidade +=
            n(
              i.quantidade
            );

          atual.total +=
            n(i.total);

          map.set(
            String(chave),
            atual
          );
        }
      );

      return Array.from(
        map.values()
      )
        .sort(
          (a, b) =>
            b.quantidade -
            a.quantidade
        )
        .slice(0, 20);
    }, [itens]);

  /* =======================================================
     RESUMO DO CAIXA DA DATA
  ======================================================= */

  const resumoCaixa =
    useMemo(() => {
      const p = {
        Dinheiro: 0,
        Pix: 0,
        Débito: 0,
        Crédito: 0,
        Outros: 0,
      };

      pagamentos.forEach(
        (x) => {
          const forma =
            nomeForma(
              x.forma
            );

          if (
            forma ===
            "Dinheiro"
          ) {
            p.Dinheiro +=
              n(x.valor);
          } else if (
            forma ===
            "Pix"
          ) {
            p.Pix +=
              n(x.valor);
          } else if (
            forma ===
            "Débito"
          ) {
            p.Débito +=
              n(x.valor);
          } else if (
            forma ===
            "Crédito"
          ) {
            p.Crédito +=
              n(x.valor);
          } else {
            p.Outros +=
              n(x.valor);
          }
        }
      );

      const m = {
        SANGRIA: 0,
        SUPRIMENTO: 0,
        DESPESA: 0,
        BOLETO: 0,
      };

      movimentos.forEach(
        (x) => {
          m[x.tipo] +=
            n(x.valor);
        }
      );

      const fundoInicial =
        sessoes.reduce(
          (s, cx) =>
            s +
            n(
              cx.valor_abertura
            ),
          0
        );

      const dinheiroEsperado =
        fundoInicial +
        p.Dinheiro +
        m.SUPRIMENTO -
        m.SANGRIA -
        m.DESPESA -
        m.BOLETO;

      const totalRecebido =
        p.Dinheiro +
        p.Pix +
        p.Débito +
        p.Crédito +
        p.Outros;

      const valorContado =
        sessoes.reduce(
          (s, cx) =>
            s +
            n(
              cx.valor_contado
            ),
          0
        );

      const diferenca =
        sessoes.reduce(
          (s, cx) =>
            s +
            n(
              cx.diferenca
            ),
          0
        );

      const todosFechados =
        sessoes.length >
          0 &&
        sessoes.every(
          (cx) =>
            cx.status ===
            "fechado"
        );

      const algumAberto =
        sessoes.some(
          (cx) =>
            cx.status ===
            "aberto"
        );

      return {
        p,
        m,

        fundoInicial,
        dinheiroEsperado,
        totalRecebido,
        valorContado,
        diferenca,

        todosFechados,
        algumAberto,
      };
    }, [
      sessoes,
      pagamentos,
      movimentos,
    ]);

  /* =======================================================
     VENDA SELECIONADA
  ======================================================= */

  const vendaSelecionada =
    useMemo(() => {
      if (
        !vendaAberta
      ) {
        return null;
      }

      return (
        vendas.find(
          (v) =>
            v.id ===
            vendaAberta
        ) || null
      );
    }, [
      vendaAberta,
      vendas,
    ]);

  const itensVendaSelecionada =
    useMemo(() => {
      if (
        !vendaAberta
      ) {
        return [];
      }

      return itens.filter(
        (i) =>
          i.venda_id ===
          vendaAberta
      );
    }, [
      vendaAberta,
      itens,
    ]);

  const pagamentosVendaSelecionada =
    useMemo(() => {
      if (
        !vendaAberta
      ) {
        return [];
      }

      return pagamentos.filter(
        (p) =>
          p.venda_id ===
          vendaAberta
      );
    }, [
      vendaAberta,
      pagamentos,
    ]);

  /* =======================================================
     CARREGAR ESTOQUE SOMENTE QUANDO SOLICITADO
  ======================================================= */

  const carregarEstoque =
    useCallback(
      async () => {
        try {
          setLoadingEstoque(
            true
          );

          const {
            data:
              relacoes,
            error:
              relError,
          } =
            await supabase
              .from(
                "fv_farmacia_produtos"
              )
              .select(
                "produto_id,ean,estoque,preco_custo,preco_venda,ativo,ativo_site,ativo_pdv"
              )
              .eq(
                "farmacia_slug",
                PORTO_LOJA_SLUG
              );

          if (
            relError
          ) {
            throw relError;
          }

          const rel =
            relacoes || [];

          const produtoIds =
            rel
              .map(
                (r: any) =>
                  r.produto_id
              )
              .filter(
                Boolean
              )
              .map(
                String
              );

          const masterMap =
            new Map<
              string,
              any
            >();

          const chunkSize =
            500;

          for (
            let i = 0;
            i <
            produtoIds.length;
            i += chunkSize
          ) {
            const ids =
              produtoIds.slice(
                i,
                i +
                  chunkSize
              );

            const {
              data:
                master,
              error:
                masterError,
            } =
              await supabase
                .from(
                  "fv_produtos"
                )
                .select(
                  "id,ean,nome,laboratorio,apresentacao,pmc"
                )
                .in(
                  "id",
                  ids
                );

            if (
              masterError
            ) {
              throw masterError;
            }

            (
              master ||
              []
            ).forEach(
              (p: any) => {
                masterMap.set(
                  String(
                    p.id
                  ),
                  p
                );
              }
            );
          }

          const resultado: ProdutoEstoque[] =
            rel.map(
              (r: any) => {
                const p =
                  masterMap.get(
                    String(
                      r.produto_id
                    )
                  );

                const precoPorto =
                  n(
                    r.preco_venda
                  );

                const pmc =
                  n(
                    p?.pmc
                  );

                return {
                  produto_id:
                    String(
                      r.produto_id
                    ),

                  ean:
                    String(
                      r.ean ||
                        p?.ean ||
                        ""
                    ),

                  nome:
                    String(
                      p?.nome ||
                        "Produto"
                    ),

                  laboratorio:
                    p?.laboratorio ??
                    null,

                  apresentacao:
                    p?.apresentacao ??
                    null,

                  estoque:
                    n(
                      r.estoque
                    ),

                  preco_custo:
                    r.preco_custo ===
                    null
                      ? null
                      : n(
                          r.preco_custo
                        ),

                  preco_venda:
                    precoPorto >
                    0
                      ? precoPorto
                      : pmc >
                        0
                      ? pmc
                      : null,

                  ativo:
                    !!r.ativo,

                  ativo_site:
                    !!r.ativo_site,

                  ativo_pdv:
                    !!r.ativo_pdv,
                };
              }
            );

          resultado.sort(
            (a, b) =>
              a.nome.localeCompare(
                b.nome,
                "pt-BR"
              )
          );

          setEstoque(
            resultado
          );

          setEstoqueCarregado(
            true
          );

          return resultado;
        } catch (e: any) {
          console.error(
            "Estoque:",
            e
          );

          alert(
            e?.message ||
              "Erro ao carregar estoque."
          );

          return [];
        } finally {
          setLoadingEstoque(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     BUSCAR PRODUTO
  ======================================================= */

  async function pesquisarEstoque() {
    const busca =
      buscaEstoque.trim();

    if (!busca) {
      return alert(
        "Digite o nome ou EAN do produto."
      );
    }

    let lista =
      estoque;

    if (
      !estoqueCarregado
    ) {
      lista =
        await carregarEstoque();
    }

    if (
      lista.length ===
      0
    ) {
      return;
    }

    setTipoRelatorioEstoque(
      "BUSCA"
    );
  }

  /* =======================================================
     GERAR RELATÓRIO DE ESTOQUE
  ======================================================= */

  async function gerarRelatorioEstoque(
    tipo:
      | "BAIXO"
      | "ZERADO"
      | "COM_ESTOQUE"
      | "GERAL"
  ) {
    if (
      !estoqueCarregado
    ) {
      const lista =
        await carregarEstoque();

      if (
        lista.length ===
        0
      ) {
        return;
      }
    }

    setTipoRelatorioEstoque(
      tipo
    );
  }

  /* =======================================================
     RESULTADO ESTOQUE
  ======================================================= */

  const estoqueResultado =
    useMemo(() => {
      if (
        !tipoRelatorioEstoque
      ) {
        return [];
      }

      if (
        tipoRelatorioEstoque ===
        "BUSCA"
      ) {
        const raw =
          buscaEstoque
            .trim()
            .toLowerCase();

        if (!raw) {
          return [];
        }

        const digits =
          onlyDigits(
            raw
          );

        return estoque.filter(
          (p) => {
            if (
              digits.length >=
              8
            ) {
              return String(
                p.ean
              ).includes(
                digits
              );
            }

            return (
              p.nome
                .toLowerCase()
                .includes(
                  raw
                ) ||
              String(
                p.ean
              ).includes(
                raw
              ) ||
              String(
                p.laboratorio ||
                  ""
              )
                .toLowerCase()
                .includes(
                  raw
                )
            );
          }
        );
      }

      if (
        tipoRelatorioEstoque ===
        "BAIXO"
      ) {
        return estoque.filter(
          (p) =>
            p.estoque >
              0 &&
            p.estoque <=
              5
        );
      }

      if (
        tipoRelatorioEstoque ===
        "ZERADO"
      ) {
        return estoque.filter(
          (p) =>
            p.estoque <=
            0
        );
      }

      if (
        tipoRelatorioEstoque ===
        "COM_ESTOQUE"
      ) {
        return estoque.filter(
          (p) =>
            p.estoque >
            0
        );
      }

      if (
        tipoRelatorioEstoque ===
        "GERAL"
      ) {
        return estoque;
      }

      return [];
    }, [
      estoque,
      buscaEstoque,
      tipoRelatorioEstoque,
    ]);

  /* =======================================================
     RESUMO DO RELATÓRIO DE ESTOQUE
  ======================================================= */

  const resumoEstoque =
    useMemo(() => {
      let produtos =
        0;

      let unidades =
        0;

      let valorCusto =
        0;

      let valorVenda =
        0;

      let semCusto =
        0;

      estoqueResultado.forEach(
        (p) => {
          produtos++;

          const qtd =
            n(
              p.estoque
            );

          unidades +=
            qtd;

          if (
            p.preco_custo !==
              null &&
            n(
              p.preco_custo
            ) > 0
          ) {
            valorCusto +=
              qtd *
              n(
                p.preco_custo
              );
          } else if (
            qtd > 0
          ) {
            semCusto++;
          }

          if (
            p.preco_venda !==
              null &&
            n(
              p.preco_venda
            ) > 0
          ) {
            valorVenda +=
              qtd *
              n(
                p.preco_venda
              );
          }
        }
      );

      return {
        produtos,
        unidades,
        valorCusto,
        valorVenda,

        lucroPotencial:
          valorVenda -
          valorCusto,

        semCusto,
      };
    }, [
      estoqueResultado,
    ]);

  /* =======================================================
     CÂMERA
  ======================================================= */

  function pararCamera() {
    try {
      scannerControlsRef
        .current
        ?.stop?.();
    } catch {}

    scannerControlsRef.current =
      null;

    if (
      videoRef.current
        ?.srcObject
    ) {
      const stream =
        videoRef.current
          .srcObject as MediaStream;

      stream
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      videoRef.current.srcObject =
        null;
    }

    setCameraLendo(
      false
    );
  }

  function fecharCamera() {
    pararCamera();

    codigoLidoRef.current =
      false;

    setCameraAberta(
      false
    );

    setCameraErro(
      ""
    );
  }

  function abrirCamera() {
    setCameraErro(
      ""
    );

    codigoLidoRef.current =
      false;

    setCameraAberta(
      true
    );
  }

  useEffect(() => {
    if (
      !cameraAberta
    ) {
      return;
    }

    let cancelado =
      false;

    async function iniciarScanner() {
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            150
          )
      );

      if (
        cancelado ||
        !videoRef.current
      ) {
        return;
      }

      try {
        setCameraLendo(
          true
        );

        const reader =
          new BrowserMultiFormatReader();

        const controls =
          await reader.decodeFromConstraints(
            {
              video: {
                facingMode: {
                  ideal:
                    "environment",
                },

                width: {
                  ideal:
                    1280,
                },

                height: {
                  ideal:
                    720,
                },
              },

              audio: false,
            },

            videoRef.current,

            async (
              result
            ) => {
              if (
                !result ||
                codigoLidoRef.current
              ) {
                return;
              }

              const codigo =
                result
                  .getText()
                  .trim();

              if (
                !codigo
              ) {
                return;
              }

              codigoLidoRef.current =
                true;

              navigator.vibrate?.(
                120
              );

              setBuscaEstoque(
                codigo
              );

              setAba(
                "ESTOQUE"
              );

              /*
               * O scanner fecha e o resultado é
               * processado pela busca.
               */
              fecharCamera();

              let lista =
                estoque;

              if (
                !estoqueCarregado
              ) {
                lista =
                  await carregarEstoque();
              }

              if (
                lista.length >
                0
              ) {
                setTipoRelatorioEstoque(
                  "BUSCA"
                );
              }
            }
          );

        scannerControlsRef.current =
          controls;
      } catch (e: any) {
        console.error(
          e
        );

        setCameraLendo(
          false
        );

        if (
          e?.name ===
          "NotAllowedError"
        ) {
          setCameraErro(
            "Permissão da câmera bloqueada."
          );
        } else {
          setCameraErro(
            e?.message ||
              "Não foi possível abrir a câmera."
          );
        }
      }
    }

    iniciarScanner();

    return () => {
      cancelado =
        true;

      pararCamera();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cameraAberta,
  ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">

        <div className="text-center">

          <RefreshCw
            className="mx-auto animate-spin text-blue-800"
            size={32}
          />

          <div className="mt-3 font-black text-slate-800">
            Carregando relatório...
          </div>

          <div className="mt-1 text-xs font-bold text-slate-400">
            {dataBR(
              dataSelecionada
            )}
          </div>

        </div>

      </main>
    );
  }

  /* =======================================================
     LAYOUT
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-100 pb-24">

      {/* HEADER */}

      <header className="sticky top-0 z-30 bg-blue-950 text-white shadow-lg">

        <div className="mx-auto max-w-7xl px-3 py-3 md:px-5">

          <div className="flex items-center gap-3">

            <div className="min-w-0 flex-1">

              <div className="text-[10px] font-black uppercase text-blue-200">
                Drogarias Porto • Loja 2
              </div>

              <h1 className="truncate text-lg font-black">
                Relatórios
              </h1>

            </div>

            <button
              type="button"
              onClick={() =>
                carregarRelatorio(
                  dataSelecionada,
                  true
                )
              }
              disabled={
                atualizando
              }
              className="rounded-xl bg-white/10 p-2 disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw
                size={20}
                className={
                  atualizando
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

            <Link
              href="/drogariasporto/admin"
              className="rounded-xl bg-white/10 p-2"
              title="Voltar"
            >
              <ArrowLeft
                size={20}
              />
            </Link>

          </div>

          {/* SELETOR DE DATA */}

          <div className="mt-3 flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                setDataSelecionada(
                  mudarData(
                    dataSelecionada,
                    -1
                  )
                )
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10"
            >
              <ChevronLeft
                size={21}
              />
            </button>

            <label className="relative flex min-w-0 flex-1 items-center rounded-xl bg-white text-blue-950">

              <CalendarDays
                size={18}
                className="ml-3 shrink-0 text-blue-700"
              />

              <input
                type="date"
                value={
                  dataSelecionada
                }
                onChange={(e) => {
                  if (
                    e.target.value
                  ) {
                    setDataSelecionada(
                      e.target.value
                    );
                  }
                }}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-black outline-none"
              />

            </label>

            <button
              type="button"
              onClick={() =>
                setDataSelecionada(
                  mudarData(
                    dataSelecionada,
                    1
                  )
                )
              }
              disabled={
                dataSelecionada >=
                dataInputHoje()
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 disabled:opacity-30"
            >
              <ChevronRight
                size={21}
              />
            </button>

          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-blue-200">

            <span>
              Relatório de{" "}
              {dataBR(
                dataSelecionada
              )}
            </span>

            <span>
              {dataSelecionada ===
              dataInputHoje()
                ? "HOJE • tempo real"
                : "HISTÓRICO"}
            </span>

          </div>

        </div>

      </header>

      <div className="mx-auto max-w-7xl p-3 md:p-5">

        {/* =================================================
            RESUMO
        ================================================= */}

        {aba ===
          "RESUMO" && (
          <div className="space-y-3">

            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 to-blue-700 p-5 text-white shadow-lg">

              <div className="flex items-start justify-between gap-3">

                <div>

                  <div className="text-xs font-black uppercase text-blue-200">
                    Vendas •{" "}
                    {dataBR(
                      dataSelecionada
                    )}
                  </div>

                  <div className="mt-1 text-4xl font-black">
                    {brl(
                      resumo.totalVendido
                    )}
                  </div>

                  <div className="mt-2 text-sm font-bold text-blue-100">
                    {
                      resumo.qtdVendas
                    }{" "}
                    venda(s) • Ticket médio{" "}
                    {brl(
                      resumo.ticketMedio
                    )}
                  </div>

                </div>

                <TrendingUp
                  size={38}
                  className="shrink-0 text-blue-200"
                />

              </div>

            </section>

            <div className="grid grid-cols-2 gap-3">

              <MiniCard
                titulo="Lucro bruto"
                valor={brl(
                  resumo.lucroBruto
                )}
                detalhe={
                  resumo.vendaComCusto >
                  0
                    ? `${resumo.margemBruta
                        .toFixed(
                          1
                        )
                        .replace(
                          ".",
                          ","
                        )}% margem`
                    : "Sem custo cadastrado"
                }
                icon={
                  <CircleDollarSign />
                }
              />

              <MiniCard
                titulo="Custo vendido"
                valor={brl(
                  resumo.custoVendido
                )}
                detalhe={
                  resumo.itensSemCusto >
                  0
                    ? `${resumo.itensSemCusto} item(ns) sem custo`
                    : "Custos cadastrados"
                }
                icon={
                  <Package />
                }
              />

            </div>

            {resumo.itensSemCusto >
              0 && (
              <div className="rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                O lucro é estimado com base nos produtos que possuem preço de compra cadastrado.
              </div>
            )}

            {/* RECEBIMENTOS */}

            <section className="rounded-3xl bg-white p-4 shadow-sm">

              <div className="mb-3 flex items-center justify-between">

                <div>

                  <div className="font-black">
                    Recebimentos
                  </div>

                  <div className="text-xs text-slate-500">
                    {dataBR(
                      dataSelecionada
                    )}
                  </div>

                </div>

                <WalletCards className="text-blue-700" />

              </div>

              <div className="grid grid-cols-2 gap-2">

                <PagamentoCard
                  titulo="Dinheiro"
                  valor={
                    resumo.formas.Dinheiro
                  }
                  icon={
                    <Banknote
                      size={19}
                    />
                  }
                />

                <PagamentoCard
                  titulo="Pix"
                  valor={
                    resumo.formas.Pix
                  }
                  icon={
                    <DollarSign
                      size={19}
                    />
                  }
                />

                <PagamentoCard
                  titulo="Débito"
                  valor={
                    resumo.formas.Débito
                  }
                  icon={
                    <CreditCard
                      size={19}
                    />
                  }
                />

                <PagamentoCard
                  titulo="Crédito"
                  valor={
                    resumo.formas.Crédito
                  }
                  icon={
                    <CreditCard
                      size={19}
                    />
                  }
                />

              </div>

            </section>

            {/* VENDAS */}

            <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

              <div className="flex items-center justify-between border-b p-4">

                <div>

                  <div className="font-black">
                    Vendas do dia
                  </div>

                  <div className="text-xs text-slate-500">
                    Últimas movimentações
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAba(
                      "VENDAS"
                    )
                  }
                  className="text-xs font-black text-blue-700"
                >
                  VER TODAS
                </button>

              </div>

              {vendas
                .slice(0, 8)
                .map(
                  (v) => (
                    <VendaLinha
                      key={
                        v.id
                      }
                      venda={
                        v
                      }
                      pagamentos={
                        pagamentos.filter(
                          (p) =>
                            p.venda_id ===
                            v.id
                        )
                      }
                      onClick={() =>
                        setVendaAberta(
                          v.id
                        )
                      }
                    />
                  )
                )}

              {vendas.length ===
                0 && (
                <Vazio texto="Nenhuma venda registrada nesta data." />
              )}

            </section>

            {/* MAIS VENDIDOS */}

            <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

              <div className="flex items-center gap-2 border-b p-4">

                <BarChart3 className="text-blue-700" />

                <div>

                  <div className="font-black">
                    Mais vendidos
                  </div>

                  <div className="text-xs text-slate-500">
                    Ranking de{" "}
                    {dataBR(
                      dataSelecionada
                    )}
                  </div>

                </div>

              </div>

              {maisVendidos.length >
              0 ? (
                maisVendidos
                  .slice(0, 5)
                  .map(
                    (
                      p,
                      index
                    ) => (
                      <div
                        key={`${p.nome}-${index}`}
                        className="flex items-center gap-3 border-t p-3 first:border-t-0"
                      >

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-800">
                          {index +
                            1}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="truncate text-sm font-black">
                            {p.nome}
                          </div>

                          <div className="text-xs text-slate-500">
                            {brl(
                              p.total
                            )}{" "}
                            em vendas
                          </div>

                        </div>

                        <div className="text-right">

                          <div className="text-lg font-black text-blue-900">
                            {p.quantidade}
                          </div>

                          <div className="text-[9px] font-black uppercase text-slate-400">
                            unidades
                          </div>

                        </div>

                      </div>
                    )
                  )
              ) : (
                <Vazio texto="Não há produtos vendidos nesta data." />
              )}

            </section>

          </div>
        )}

        {/* =================================================
            VENDAS
        ================================================= */}

        {aba ===
          "VENDAS" && (
          <div className="space-y-3">

            <section className="rounded-3xl bg-white p-4 shadow-sm">

              <div className="text-xs font-black uppercase text-slate-500">
                Faturamento •{" "}
                {dataBR(
                  dataSelecionada
                )}
              </div>

              <div className="mt-1 text-3xl font-black text-blue-900">
                {brl(
                  resumo.totalVendido
                )}
              </div>

              <div className="mt-1 text-sm font-bold text-slate-500">
                {
                  resumo.qtdVendas
                }{" "}
                venda(s) • Ticket{" "}
                {brl(
                  resumo.ticketMedio
                )}
              </div>

            </section>

            <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

              <div className="flex items-center gap-2 border-b p-4">

                <ShoppingCart className="text-blue-700" />

                <div>

                  <div className="font-black">
                    Vendas
                  </div>

                  <div className="text-xs text-slate-500">
                    Toque para visualizar os produtos
                  </div>

                </div>

              </div>

              {vendas.map(
                (v) => (
                  <VendaLinha
                    key={
                      v.id
                    }
                    venda={
                      v
                    }
                    pagamentos={
                      pagamentos.filter(
                        (p) =>
                          p.venda_id ===
                          v.id
                      )
                    }
                    onClick={() =>
                      setVendaAberta(
                        v.id
                      )
                    }
                  />
                )
              )}

              {vendas.length ===
                0 && (
                <Vazio texto="Nenhuma venda registrada nesta data." />
              )}

            </section>

          </div>
        )}

        {/* =================================================
            CAIXA
        ================================================= */}

        {aba ===
          "CAIXA" && (
          <div className="space-y-3">

            {sessoes.length ===
              0 ? (

              <section className="rounded-3xl bg-white p-6 text-center shadow-sm">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Banknote
                    size={30}
                  />
                </div>

                <div className="mt-3 text-xl font-black">
                  Sem caixa nesta data
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  Nenhuma sessão de caixa foi encontrada em{" "}
                  {dataBR(
                    dataSelecionada
                  )}.
                </div>

              </section>

            ) : (
              <>

                <section
                  className={`rounded-3xl p-5 text-white shadow-lg ${
                    resumoCaixa.algumAberto
                      ? "bg-green-600"
                      : "bg-blue-900"
                  }`}
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <div className="text-xs font-black uppercase opacity-80">
                        {resumoCaixa.algumAberto
                          ? "Caixa aberto"
                          : "Caixa fechado"}
                      </div>

                      <div className="mt-1 text-2xl font-black">
                        {dataBR(
                          dataSelecionada
                        )}
                      </div>

                      <div className="mt-1 text-sm font-bold opacity-80">
                        {sessoes.length} sessão(ões) de caixa
                      </div>

                    </div>

                    <Clock3
                      size={36}
                      className="opacity-70"
                    />

                  </div>

                </section>

                <div className="grid grid-cols-2 gap-3">

                  <MiniCard
                    titulo="Vendas"
                    valor={brl(
                      resumo.totalVendido
                    )}
                    detalhe={`${resumo.qtdVendas} venda(s)`}
                    icon={
                      <ShoppingCart />
                    }
                  />

                  <MiniCard
                    titulo="Dinheiro esperado"
                    valor={brl(
                      resumoCaixa.dinheiroEsperado
                    )}
                    detalhe="Caixa físico"
                    icon={
                      <Banknote />
                    }
                  />

                </div>

                {/* FORMAS */}

                <section className="rounded-3xl bg-white p-4 shadow-sm">

                  <div className="mb-3 font-black">
                    Recebimentos do caixa
                  </div>

                  <div className="grid grid-cols-2 gap-2">

                    <PagamentoCard
                      titulo="Dinheiro"
                      valor={
                        resumoCaixa.p.Dinheiro
                      }
                      icon={
                        <Banknote
                          size={18}
                        />
                      }
                    />

                    <PagamentoCard
                      titulo="Pix"
                      valor={
                        resumoCaixa.p.Pix
                      }
                      icon={
                        <DollarSign
                          size={18}
                        />
                      }
                    />

                    <PagamentoCard
                      titulo="Débito"
                      valor={
                        resumoCaixa.p.Débito
                      }
                      icon={
                        <CreditCard
                          size={18}
                        />
                      }
                    />

                    <PagamentoCard
                      titulo="Crédito"
                      valor={
                        resumoCaixa.p.Crédito
                      }
                      icon={
                        <CreditCard
                          size={18}
                        />
                      }
                    />

                  </div>

                </section>

                {/* MOVIMENTAÇÃO */}

                <section className="rounded-3xl bg-white p-4 shadow-sm">

                  <div className="font-black">
                    Movimentação do dia
                  </div>

                  <div className="mt-3 space-y-2">

                    <LinhaResumo
                      nome="Fundo inicial"
                      valor={
                        resumoCaixa.fundoInicial
                      }
                    />

                    <LinhaResumo
                      nome="Suprimentos"
                      valor={
                        resumoCaixa.m.SUPRIMENTO
                      }
                    />

                    <LinhaResumo
                      nome="Sangrias"
                      valor={
                        resumoCaixa.m.SANGRIA
                      }
                      negativo
                    />

                    <LinhaResumo
                      nome="Despesas"
                      valor={
                        resumoCaixa.m.DESPESA
                      }
                      negativo
                    />

                    <LinhaResumo
                      nome="Boletos"
                      valor={
                        resumoCaixa.m.BOLETO
                      }
                      negativo
                    />

                  </div>

                  <div className="mt-4 border-t pt-4">

                    <div className="flex items-center justify-between">

                      <span className="font-bold text-slate-500">
                        Dinheiro esperado
                      </span>

                      <b className="text-xl text-blue-900">
                        {brl(
                          resumoCaixa.dinheiroEsperado
                        )}
                      </b>

                    </div>

                    {resumoCaixa.todosFechados && (
                      <>
                        <div className="mt-3 flex items-center justify-between">

                          <span className="font-bold text-slate-500">
                            Dinheiro contado
                          </span>

                          <b className="text-lg">
                            {brl(
                              resumoCaixa.valorContado
                            )}
                          </b>

                        </div>

                        <div className="mt-3 flex items-center justify-between">

                          <span className="font-bold text-slate-500">
                            Diferença
                          </span>

                          <b
                            className={
                              Math.abs(
                                resumoCaixa.diferenca
                              ) <
                              0.01
                                ? "text-green-700"
                                : "text-red-600"
                            }
                          >
                            {brl(
                              resumoCaixa.diferenca
                            )}
                          </b>

                        </div>
                      </>
                    )}

                  </div>

                </section>

                {/* SESSÕES */}

                <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

                  <div className="border-b p-4">

                    <div className="font-black">
                      Sessões de caixa
                    </div>

                  </div>

                  {sessoes.map(
                    (cx) => (
                      <div
                        key={
                          cx.id
                        }
                        className="border-t p-4 first:border-t-0"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <div className="font-black">
                              {cx.operador ||
                                "Operador"}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              Abertura{" "}
                              {hora(
                                cx.aberto_em
                              )}

                              {cx.fechado_em
                                ? ` • Fechamento ${hora(
                                    cx.fechado_em
                                  )}`
                                : " • Em andamento"}
                            </div>

                          </div>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-black ${
                              cx.status ===
                              "aberto"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {cx.status ===
                            "aberto"
                              ? "ABERTO"
                              : "FECHADO"}
                          </span>

                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">

                          <div className="rounded-xl bg-slate-50 p-2">

                            <div className="text-slate-400">
                              Fundo
                            </div>

                            <b>
                              {brl(
                                cx.valor_abertura
                              )}
                            </b>

                          </div>

                          <div className="rounded-xl bg-slate-50 p-2">

                            <div className="text-slate-400">
                              Diferença
                            </div>

                            <b
                              className={
                                Math.abs(
                                  n(
                                    cx.diferenca
                                  )
                                ) <
                                0.01
                                  ? "text-green-700"
                                  : "text-red-600"
                              }
                            >
                              {cx.status ===
                              "fechado"
                                ? brl(
                                    n(
                                      cx.diferenca
                                    )
                                  )
                                : "—"}
                            </b>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </section>

                {/* MOVIMENTOS DETALHADOS */}

                <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

                  <div className="border-b p-4">

                    <div className="font-black">
                      Sangrias, suprimentos e despesas
                    </div>

                    <div className="text-xs text-slate-500">
                      Movimentação de{" "}
                      {dataBR(
                        dataSelecionada
                      )}
                    </div>

                  </div>

                  {movimentos.map(
                    (m) => (
                      <div
                        key={
                          m.id
                        }
                        className="flex items-center gap-3 border-t p-3 first:border-t-0"
                      >

                        <div className="min-w-0 flex-1">

                          <div className="text-sm font-black">
                            {m.tipo}
                          </div>

                          <div className="truncate text-xs text-slate-500">
                            {m.descricao}
                          </div>

                        </div>

                        <div className="text-right">

                          <div
                            className={`font-black ${
                              m.tipo ===
                              "SUPRIMENTO"
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            {m.tipo ===
                            "SUPRIMENTO"
                              ? "+"
                              : "-"}{" "}
                            {brl(
                              m.valor
                            )}
                          </div>

                          <div className="text-[10px] text-slate-400">
                            {hora(
                              m.created_at
                            )}
                          </div>

                        </div>

                      </div>
                    )
                  )}

                  {movimentos.length ===
                    0 && (
                    <Vazio texto="Nenhuma movimentação de caixa nesta data." />
                  )}

                </section>

                {dataSelecionada ===
                  dataInputHoje() && (
                  <Link
                    href="/drogariasporto/caixa"
                    className="block rounded-2xl bg-blue-800 py-4 text-center font-black text-white"
                  >
                    ABRIR CAIXA OPERACIONAL
                  </Link>
                )}

              </>
            )}

          </div>
        )}

        {/* =================================================
            ESTOQUE
        ================================================= */}

        {aba ===
          "ESTOQUE" && (
          <div className="space-y-3">

            {/* CONSULTA */}

            <section className="rounded-3xl bg-white p-4 shadow-sm">

              <div className="flex items-center gap-2">

                <Box className="text-blue-700" />

                <div>

                  <div className="font-black">
                    Consultar estoque
                  </div>

                  <div className="text-xs text-slate-500">
                    Pesquise somente quando precisar
                  </div>

                </div>

              </div>

              <div className="mt-4 flex gap-2">

                <div className="flex min-w-0 flex-1 items-center rounded-xl border-2 border-blue-200 px-3 focus-within:border-blue-700">

                  <Search
                    size={19}
                    className="shrink-0 text-slate-500"
                  />

                  <input
                    value={
                      buscaEstoque
                    }
                    onChange={(e) => {
                      setBuscaEstoque(
                        e.target.value
                      );

                      setTipoRelatorioEstoque(
                        null
                      );
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                        "Enter"
                      ) {
                        pesquisarEstoque();
                      }
                    }}
                    placeholder="Nome ou código de barras"
                    className="min-w-0 flex-1 px-3 py-3 font-bold outline-none"
                  />

                  {buscaEstoque && (
                    <button
                      type="button"
                      onClick={() => {
                        setBuscaEstoque(
                          ""
                        );

                        setTipoRelatorioEstoque(
                          null
                        );
                      }}
                      className="p-1 text-slate-400"
                    >
                      <X
                        size={18}
                      />
                    </button>
                  )}

                </div>

                <button
                  type="button"
                  onClick={
                    abrirCamera
                  }
                  className="flex w-13 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 text-white"
                >
                  <Camera
                    size={22}
                  />
                </button>

              </div>

              <button
                type="button"
                onClick={
                  pesquisarEstoque
                }
                disabled={
                  loadingEstoque
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 py-3 font-black text-white disabled:opacity-50"
              >
                {loadingEstoque ? (
                  <RefreshCw
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Search
                    size={18}
                  />
                )}

                CONSULTAR PRODUTO
              </button>

            </section>

            {/* GERAR RELATÓRIOS */}

            <section className="rounded-3xl bg-white p-4 shadow-sm">

              <div className="flex items-center gap-2">

                <FileText className="text-blue-700" />

                <div>

                  <div className="font-black">
                    Relatórios de estoque
                  </div>

                  <div className="text-xs text-slate-500">
                    O estoque só será listado após selecionar um relatório
                  </div>

                </div>

              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">

                <BotaoRelatorioEstoque
                  titulo="Estoque baixo"
                  descricao="1 a 5 unidades"
                  tipo="amber"
                  onClick={() =>
                    gerarRelatorioEstoque(
                      "BAIXO"
                    )
                  }
                />

                <BotaoRelatorioEstoque
                  titulo="Estoque zerado"
                  descricao="Sem unidades"
                  tipo="red"
                  onClick={() =>
                    gerarRelatorioEstoque(
                      "ZERADO"
                    )
                  }
                />

                <BotaoRelatorioEstoque
                  titulo="Com estoque"
                  descricao="Produtos disponíveis"
                  tipo="green"
                  onClick={() =>
                    gerarRelatorioEstoque(
                      "COM_ESTOQUE"
                    )
                  }
                />

                <BotaoRelatorioEstoque
                  titulo="Relatório geral"
                  descricao="Inventário completo"
                  tipo="blue"
                  onClick={() =>
                    gerarRelatorioEstoque(
                      "GERAL"
                    )
                  }
                />

              </div>

            </section>

            {/* NADA GERADO */}

            {!tipoRelatorioEstoque && (
              <section className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Package
                    size={29}
                  />
                </div>

                <div className="mt-3 font-black text-slate-800">
                  Nenhum relatório aberto
                </div>

                <div className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
                  Pesquise um produto ou escolha um dos relatórios acima.
                </div>

              </section>
            )}

            {/* RESULTADO */}

            {tipoRelatorioEstoque && (
              <>

                <section className="rounded-3xl bg-blue-950 p-4 text-white shadow-lg">

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <div className="text-[10px] font-black uppercase text-blue-200">
                        Relatório de estoque
                      </div>

                      <div className="mt-1 text-xl font-black">
                        {tipoRelatorioEstoque ===
                        "BUSCA"
                          ? `Busca: ${buscaEstoque}`
                          : tipoRelatorioEstoque ===
                            "BAIXO"
                          ? "Estoque baixo"
                          : tipoRelatorioEstoque ===
                            "ZERADO"
                          ? "Estoque zerado"
                          : tipoRelatorioEstoque ===
                            "COM_ESTOQUE"
                          ? "Produtos com estoque"
                          : "Inventário geral"}
                      </div>

                      <div className="mt-1 text-xs font-bold text-blue-200">
                        {
                          resumoEstoque.produtos
                        }{" "}
                        produto(s)
                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setTipoRelatorioEstoque(
                          null
                        )
                      }
                      className="rounded-xl bg-white/10 p-2"
                    >
                      <X
                        size={19}
                      />
                    </button>

                  </div>

                </section>

                <div className="grid grid-cols-2 gap-2">

                  <ValorEstoque
                    titulo="Unidades"
                    texto={resumoEstoque.unidades.toLocaleString(
                      "pt-BR"
                    )}
                  />

                  <ValorEstoque
                    titulo="Custo"
                    texto={brl(
                      resumoEstoque.valorCusto
                    )}
                  />

                  <ValorEstoque
                    titulo="Venda potencial"
                    texto={brl(
                      resumoEstoque.valorVenda
                    )}
                  />

                  <ValorEstoque
                    titulo="Lucro potencial"
                    texto={brl(
                      resumoEstoque.lucroPotencial
                    )}
                  />

                </div>

                {resumoEstoque.semCusto >
                  0 && (
                  <div className="rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                    {
                      resumoEstoque.semCusto
                    }{" "}
                    produto(s) deste relatório possuem estoque, mas ainda não têm preço de compra cadastrado.
                  </div>
                )}

                <section className="space-y-2">

                  {estoqueResultado.map(
                    (p) => (
                      <ProdutoEstoqueCard
                        key={
                          p.produto_id
                        }
                        produto={
                          p
                        }
                      />
                    )
                  )}

                  {estoqueResultado.length ===
                    0 && (
                    <Vazio texto="Nenhum produto encontrado para este relatório." />
                  )}

                </section>

              </>
            )}

            <Link
              href="/drogariasporto/admin/produtos"
              className="block rounded-2xl bg-blue-800 py-4 text-center font-black text-white"
            >
              GERENCIAR PRODUTOS / ESTOQUE
            </Link>

          </div>
        )}

      </div>

      {/* ===================================================
          NAVEGAÇÃO
      =================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">

        <div className="mx-auto grid max-w-2xl grid-cols-4">

          <NavButton
            active={
              aba ===
              "RESUMO"
            }
            label="Resumo"
            icon={
              <BarChart3
                size={20}
              />
            }
            onClick={() =>
              setAba(
                "RESUMO"
              )
            }
          />

          <NavButton
            active={
              aba ===
              "VENDAS"
            }
            label="Vendas"
            icon={
              <ShoppingCart
                size={20}
              />
            }
            onClick={() =>
              setAba(
                "VENDAS"
              )
            }
          />

          <NavButton
            active={
              aba ===
              "CAIXA"
            }
            label="Caixa"
            icon={
              <Banknote
                size={20}
              />
            }
            onClick={() =>
              setAba(
                "CAIXA"
              )
            }
          />

          <NavButton
            active={
              aba ===
              "ESTOQUE"
            }
            label="Estoque"
            icon={
              <Box
                size={20}
              />
            }
            onClick={() =>
              setAba(
                "ESTOQUE"
              )
            }
          />

        </div>

      </nav>

      {/* ===================================================
          MODAL VENDA
      =================================================== */}

      {vendaSelecionada && (

        <div className="fixed inset-0 z-[80] bg-black/50 p-2">

          <div className="mx-auto flex h-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white">

            <div className="flex items-center justify-between border-b p-4">

              <div>

                <div className="text-xs font-bold text-slate-500">
                  VENDA
                </div>

                <div className="font-mono text-lg font-black">
                  #
                  {vendaSelecionada.id
                    .slice(
                      0,
                      8
                    )
                    .toUpperCase()}
                </div>

                <div className="text-xs text-slate-500">
                  {dataHora(
                    vendaSelecionada.created_at
                  )}
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setVendaAberta(
                    null
                  )
                }
                className="rounded-xl bg-slate-100 p-2"
              >
                <X
                  size={20}
                />
              </button>

            </div>

            <div className="flex-1 overflow-y-auto p-4">

              <div className="rounded-2xl bg-blue-50 p-4">

                <div className="text-xs font-black uppercase text-blue-600">
                  Total da venda
                </div>

                <div className="text-3xl font-black text-blue-950">
                  {brl(
                    vendaSelecionada.total
                  )}
                </div>

              </div>

              <div className="mt-5">

                <div className="mb-2 font-black">
                  Produtos
                </div>

                <div className="overflow-hidden rounded-2xl border">

                  {itensVendaSelecionada.map(
                    (i) => {
                      const totalItem =
                        n(
                          i.total
                        ) > 0
                          ? n(
                              i.total
                            )
                          : n(
                              i.preco_unitario
                            ) *
                              n(
                                i.quantidade
                              ) -
                            n(
                              i.desconto
                            );

                      return (
                        <div
                          key={
                            i.id
                          }
                          className="flex gap-3 border-t p-3 first:border-t-0"
                        >

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black">
                            {n(
                              i.quantidade
                            )}
                            x
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="text-sm font-black">
                              {i.nome}
                            </div>

                            <div className="text-xs text-slate-500">
                              {brl(
                                i.preco_unitario
                              )}{" "}
                              cada
                            </div>

                          </div>

                          <div className="font-black">
                            {brl(
                              totalItem
                            )}
                          </div>

                        </div>
                      );
                    }
                  )}

                  {itensVendaSelecionada.length ===
                    0 && (
                    <Vazio texto="Itens não encontrados para esta venda." />
                  )}

                </div>

              </div>

              <div className="mt-5">

                <div className="mb-2 font-black">
                  Pagamento
                </div>

                <div className="space-y-2">

                  {pagamentosVendaSelecionada.map(
                    (p) => (
                      <div
                        key={
                          p.id
                        }
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                      >

                        <span className="font-bold">
                          {nomeForma(
                            p.forma
                          )}
                        </span>

                        <b>
                          {brl(
                            p.valor
                          )}
                        </b>

                      </div>
                    )
                  )}

                </div>

              </div>

            </div>

            <div className="border-t p-3">

              <button
                type="button"
                onClick={() =>
                  setVendaAberta(
                    null
                  )
                }
                className="w-full rounded-2xl bg-blue-800 py-3 font-black text-white"
              >
                FECHAR
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ===================================================
          CÂMERA
      =================================================== */}

      {cameraAberta && (

        <div className="fixed inset-0 z-[100] bg-black">

          <div className="flex h-full flex-col">

            <div className="flex items-center justify-between bg-black/90 p-4 text-white">

              <div>

                <div className="font-black">
                  Consultar estoque
                </div>

                <div className="text-xs text-slate-300">
                  Aponte para o código de barras
                </div>

              </div>

              <button
                type="button"
                onClick={
                  fecharCamera
                }
                className="rounded-xl bg-white/10 p-2"
              >
                <X
                  size={24}
                />
              </button>

            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden">

              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                <div className="relative h-36 w-[88%] max-w-md rounded-2xl border-2 border-white">

                  <div className="absolute left-4 right-4 top-1/2 h-[2px] bg-red-500" />

                </div>

              </div>

              {cameraLendo && (

                <div className="absolute bottom-8 rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white">
                  Procurando código...
                </div>

              )}

            </div>

            {cameraErro && (

              <div className="bg-red-600 p-4 text-center text-sm font-bold text-white">
                {cameraErro}
              </div>

            )}

            <div className="bg-black p-4">

              <button
                type="button"
                onClick={
                  fecharCamera
                }
                className="w-full rounded-xl bg-white py-3 font-black"
              >
                Fechar câmera
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}
/* =========================================================
   COMPONENTES AUXILIARES
========================================================= */

function MiniCard({
  titulo,
  valor,
  detalhe,
  icon,
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase text-slate-500">
            {titulo}
          </div>

          <div className="mt-1 break-words text-xl font-black text-blue-950">
            {valor}
          </div>

          {detalhe && (
            <div className="mt-1 text-[11px] font-bold leading-tight text-slate-400">
              {detalhe}
            </div>
          )}
        </div>

        <div className="shrink-0 rounded-2xl bg-blue-50 p-2 text-blue-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGAMENTO
========================================================= */

function PagamentoCard({
  titulo,
  valor,
  icon,
}: {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center justify-between text-slate-500">
        <span className="text-xs font-black">
          {titulo}
        </span>

        <span className="text-blue-700">
          {icon}
        </span>
      </div>

      <div className="mt-2 text-lg font-black text-slate-950">
        {brl(valor)}
      </div>
    </div>
  );
}

/* =========================================================
   VENDA
========================================================= */

function VendaLinha({
  venda,
  pagamentos,
  onClick,
}: {
  venda: Venda;
  pagamentos: Pagamento[];
  onClick: () => void;
}) {
  const formas = Array.from(
    new Set(
      pagamentos.map((p) =>
        nomeForma(p.forma)
      )
    )
  );

  const tipo =
    venda.tipo_atendimento ||
    venda.modalidade ||
    venda.entrega_retirada ||
    "";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-t p-3 text-left first:border-t-0 active:bg-slate-50"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
        <ShoppingCart
          size={20}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black text-slate-800">
            #
            {venda.id
              .slice(0, 6)
              .toUpperCase()}
          </span>

          <span className="text-xs font-bold text-slate-400">
            {hora(
              venda.created_at
            )}
          </span>
        </div>

        <div className="mt-1 truncate text-xs font-bold text-slate-500">
          {formas.length
            ? formas.join(" + ")
            : "Pagamento não informado"}

          {tipo
            ? ` • ${tipo}`
            : ""}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="font-black text-blue-950">
          {brl(
            venda.total
          )}
        </div>

        <div className="mt-1 flex justify-end text-slate-400">
          <ChevronRight
            size={16}
          />
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   LINHA RESUMO DO CAIXA
========================================================= */

function LinhaResumo({
  nome,
  valor,
  negativo = false,
}: {
  nome: string;
  valor: number;
  negativo?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-sm font-bold text-slate-600">
        {nome}
      </span>

      <span
        className={`font-black ${
          negativo &&
          valor > 0
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {negativo &&
        valor > 0
          ? "- "
          : ""}

        {brl(valor)}
      </span>
    </div>
  );
}

/* =========================================================
   BOTÃO DE RELATÓRIO DO ESTOQUE
========================================================= */

function BotaoRelatorioEstoque({
  titulo,
  descricao,
  tipo,
  onClick,
}: {
  titulo: string;
  descricao: string;
  tipo:
    | "amber"
    | "red"
    | "green"
    | "blue";
  onClick: () => void;
}) {
  let classe =
    "bg-blue-50 text-blue-800 ring-blue-100";

  let classeIcone =
    "bg-blue-100 text-blue-700";

  if (
    tipo === "amber"
  ) {
    classe =
      "bg-amber-50 text-amber-900 ring-amber-100";

    classeIcone =
      "bg-amber-100 text-amber-700";
  }

  if (
    tipo === "red"
  ) {
    classe =
      "bg-red-50 text-red-800 ring-red-100";

    classeIcone =
      "bg-red-100 text-red-600";
  }

  if (
    tipo === "green"
  ) {
    classe =
      "bg-green-50 text-green-800 ring-green-100";

    classeIcone =
      "bg-green-100 text-green-700";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[112px] rounded-2xl p-3 text-left ring-1 active:scale-[0.98] ${classe}`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${classeIcone}`}
      >
        {tipo ===
        "red" ? (
          <X size={18} />
        ) : tipo ===
          "amber" ? (
          <Package
            size={18}
          />
        ) : tipo ===
          "green" ? (
          <Box size={18} />
        ) : (
          <FileText
            size={18}
          />
        )}
      </div>

      <div className="mt-2 text-sm font-black leading-tight">
        {titulo}
      </div>

      <div className="mt-1 text-[10px] font-bold opacity-70">
        {descricao}
      </div>
    </button>
  );
}

/* =========================================================
   VALOR DO RELATÓRIO DE ESTOQUE
========================================================= */

function ValorEstoque({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="text-[9px] font-black uppercase text-slate-400">
        {titulo}
      </div>

      <div className="mt-1 break-words text-lg font-black text-blue-950">
        {texto}
      </div>
    </div>
  );
}

/* =========================================================
   PRODUTO DO RELATÓRIO DE ESTOQUE
========================================================= */

function ProdutoEstoqueCard({
  produto,
}: {
  produto: ProdutoEstoque;
}) {
  const custo =
    produto.preco_custo !==
    null
      ? n(
          produto.preco_custo
        )
      : 0;

  const venda =
    produto.preco_venda !==
    null
      ? n(
          produto.preco_venda
        )
      : 0;

  const lucroUnitario =
    venda > 0
      ? venda - custo
      : 0;

  const margemProduto =
    custo > 0 &&
    venda > 0
      ? margem(
          custo,
          venda
        )
      : 0;

  const custoTotal =
    custo *
    n(
      produto.estoque
    );

  const vendaTotal =
    venda *
    n(
      produto.estoque
    );

  const lucroTotal =
    vendaTotal -
    custoTotal;

  const estoqueBaixo =
    produto.estoque >
      0 &&
    produto.estoque <=
      5;

  const zerado =
    produto.estoque <=
    0;

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">

      <div className="p-4">

        {/* CABEÇALHO */}

        <div className="flex items-start gap-3">

          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              zerado
                ? "bg-red-50 text-red-600"
                : estoqueBaixo
                ? "bg-amber-50 text-amber-600"
                : "bg-green-50 text-green-700"
            }`}
          >
            <Box
              size={25}
            />
          </div>

          <div className="min-w-0 flex-1">

            <div className="text-base font-black leading-tight text-slate-950">
              {produto.nome}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              EAN{" "}
              <b>
                {produto.ean ||
                  "—"}
              </b>
            </div>

            {(produto.laboratorio ||
              produto.apresentacao) && (
              <div className="mt-0.5 text-xs text-slate-400">

                {produto.laboratorio ||
                  ""}

                {produto.laboratorio &&
                produto.apresentacao
                  ? " • "
                  : ""}

                {produto.apresentacao ||
                  ""}

              </div>
            )}

          </div>

          <div className="shrink-0 text-right">

            <div
              className={`text-3xl font-black ${
                zerado
                  ? "text-red-600"
                  : estoqueBaixo
                  ? "text-amber-600"
                  : "text-green-700"
              }`}
            >
              {produto.estoque}
            </div>

            <div className="text-[9px] font-black uppercase text-slate-400">
              unidades
            </div>

          </div>

        </div>

        {/* ALERTA */}

        {zerado && (
          <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
            ESTOQUE ZERADO
          </div>
        )}

        {estoqueBaixo && (
          <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
            ESTOQUE BAIXO • REPOSIÇÃO
          </div>
        )}

        {/* PREÇOS */}

        <div className="mt-3 grid grid-cols-2 gap-2">

          <div className="rounded-2xl bg-slate-50 p-3">

            <div className="text-[9px] font-black uppercase text-slate-400">
              Compra
            </div>

            <div className="mt-1 font-black text-slate-900">
              {custo > 0
                ? brl(
                    custo
                  )
                : "Não cadastrado"}
            </div>

          </div>

          <div className="rounded-2xl bg-blue-50 p-3">

            <div className="text-[9px] font-black uppercase text-blue-500">
              Venda
            </div>

            <div className="mt-1 font-black text-blue-950">
              {venda > 0
                ? brl(
                    venda
                  )
                : "Sem preço"}
            </div>

          </div>

        </div>

        {/* LUCRO */}

        {custo > 0 &&
          venda > 0 && (

          <div className="mt-2 grid grid-cols-2 gap-2">

            <div className="rounded-2xl bg-green-50 p-3">

              <div className="text-[9px] font-black uppercase text-green-600">
                Lucro / unidade
              </div>

              <div
                className={`mt-1 font-black ${
                  lucroUnitario >=
                  0
                    ? "text-green-700"
                    : "text-red-600"
                }`}
              >
                {brl(
                  lucroUnitario
                )}
              </div>

            </div>

            <div className="rounded-2xl bg-green-50 p-3">

              <div className="text-[9px] font-black uppercase text-green-600">
                Margem
              </div>

              <div
                className={`mt-1 font-black ${
                  margemProduto >=
                  0
                    ? "text-green-700"
                    : "text-red-600"
                }`}
              >
                {margemProduto
                  .toFixed(1)
                  .replace(
                    ".",
                    ","
                  )}
                %
              </div>

            </div>

          </div>
        )}

        {/* VALOR DO ESTOQUE */}

        {produto.estoque >
          0 && (

          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">

            <div className="grid grid-cols-2 gap-3">

              <div>

                <div className="text-[9px] font-black uppercase text-slate-400">
                  Custo em estoque
                </div>

                <div className="mt-1 font-black text-slate-800">
                  {custo > 0
                    ? brl(
                        custoTotal
                      )
                    : "—"}
                </div>

              </div>

              <div className="text-right">

                <div className="text-[9px] font-black uppercase text-slate-400">
                  Venda potencial
                </div>

                <div className="mt-1 font-black text-blue-900">
                  {venda > 0
                    ? brl(
                        vendaTotal
                      )
                    : "—"}
                </div>

              </div>

            </div>

            {custo > 0 &&
              venda > 0 && (

              <div className="mt-3 flex items-center justify-between border-t pt-3">

                <span className="text-xs font-bold text-slate-500">
                  Lucro potencial
                </span>

                <b
                  className={
                    lucroTotal >=
                    0
                      ? "text-green-700"
                      : "text-red-600"
                  }
                >
                  {brl(
                    lucroTotal
                  )}
                </b>

              </div>
            )}

          </div>
        )}

        {/* CANAIS */}

        <div className="mt-3 flex flex-wrap gap-1">

          <StatusEstoque
            nome="FV"
            ativo={
              produto.ativo
            }
          />

          <StatusEstoque
            nome="Site"
            ativo={
              produto.ativo_site
            }
          />

          <StatusEstoque
            nome="PDV"
            ativo={
              produto.ativo_pdv
            }
          />

        </div>

      </div>

    </article>
  );
}

/* =========================================================
   STATUS PRODUTO
========================================================= */

function StatusEstoque({
  nome,
  ativo,
}: {
  nome: string;
  ativo: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[9px] font-black ${
        ativo
          ? "bg-green-100 text-green-700"
          : "bg-slate-100 text-slate-400"
      }`}
    >
      {nome}{" "}
      {ativo
        ? "✓"
        : "—"}
    </span>
  );
}

/* =========================================================
   NAVEGAÇÃO INFERIOR
========================================================= */

function NavButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[64px] flex-col items-center justify-center gap-1 px-1 ${
        active
          ? "text-blue-800"
          : "text-slate-400"
      }`}
    >
      <div
        className={`rounded-xl px-4 py-1 ${
          active
            ? "bg-blue-50"
            : ""
        }`}
      >
        {icon}
      </div>

      <span className="text-[10px] font-black">
        {label}
      </span>
    </button>
  );
}

/* =========================================================
   ESTADO VAZIO
========================================================= */

function Vazio({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="p-6 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Package
          size={22}
        />
      </div>

      <div className="mt-2 text-sm font-bold text-slate-500">
        {texto}
      </div>

    </div>
  );
}