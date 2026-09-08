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
  Camera,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  DollarSign,
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
  | "HOJE"
  | "VENDAS"
  | "CAIXA"
  | "ESTOQUE";

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

function hora(v: string) {
  try {
    return new Date(
      v
    ).toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
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
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
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

function inicioHojeISO() {
  const d = new Date();

  d.setHours(
    0,
    0,
    0,
    0
  );

  return d.toISOString();
}

function fimHojeISO() {
  const d = new Date();

  d.setHours(
    23,
    59,
    59,
    999
  );

  return d.toISOString();
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
    f.includes("pix")
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
  const [aba, setAba] =
    useState<Aba>("HOJE");

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

  const [
    sessao,
    setSessao,
  ] =
    useState<Sessao | null>(
      null
    );

  const [
    movimentos,
    setMovimentos,
  ] =
    useState<
      MovimentoCaixa[]
    >([]);

  const [
    estoque,
    setEstoque,
  ] =
    useState<
      ProdutoEstoque[]
    >([]);

  const [
    buscaEstoque,
    setBuscaEstoque,
  ] =
    useState("");

  const [
    vendaAberta,
    setVendaAberta,
  ] =
    useState<string | null>(
      null
    );

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
     CARREGAMENTO
  ======================================================= */

  const carregar =
    useCallback(
      async (
        silencioso = false
      ) => {
        try {
          if (silencioso) {
            setAtualizando(
              true
            );
          } else {
            setLoading(true);
          }

          const inicio =
            inicioHojeISO();

          const fim =
            fimHojeISO();

          /* ===============================================
             1. VENDAS DO DIA
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

          const vendasHoje =
            (vendasData ||
              []) as Venda[];

          setVendas(
            vendasHoje
          );

          const vendaIds =
            vendasHoje.map(
              (v) => v.id
            );

          /* ===============================================
             2. PAGAMENTOS + ITENS
          =============================================== */

          let pagamentosHoje:
            Pagamento[] =
              [];

          let itensHoje:
            ItemVenda[] =
              [];

          if (
            vendaIds.length >
            0
          ) {
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
                      vendaIds
                    )
                    .order(
                      "created_at",
                      {
                        ascending:
                          false,
                      }
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
                      vendaIds
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

            pagamentosHoje =
              (pagamentosRes.data ||
                []) as Pagamento[];

            itensHoje =
              (itensRes.data ||
                []) as ItemVenda[];
          }

          setPagamentos(
            pagamentosHoje
          );

          /* ===============================================
             3. ESTOQUE PORTO
          =============================================== */

          const {
            data:
              relacoes,
            error:
              estoqueError,
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
            estoqueError
          ) {
            throw estoqueError;
          }

          const rel =
            relacoes || [];

          const produtoIds =
            rel
              .map(
                (r: any) =>
                  r.produto_id
              )
              .filter(Boolean);

          let masterMap =
            new Map<
              string,
              any
            >();

          if (
            produtoIds.length >
            0
          ) {
            /*
             * Evita uma URL gigantesca no Supabase caso
             * futuramente a loja tenha muitos produtos.
             */
            const chunkSize =
              500;

            const allMaster: any[] =
              [];

            for (
              let i = 0;
              i <
              produtoIds.length;
              i += chunkSize
            ) {
              const chunk =
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
                    chunk
                  );

              if (
                masterError
              ) {
                throw masterError;
              }

              allMaster.push(
                ...(
                  master ||
                  []
                )
              );
            }

            masterMap =
              new Map(
                allMaster.map(
                  (p: any) => [
                    String(
                      p.id
                    ),
                    p,
                  ]
                )
              );
          }

          const estoqueFinal: ProdutoEstoque[] =
            rel.map(
              (r: any) => {
                const p =
                  masterMap.get(
                    String(
                      r.produto_id
                    )
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

                  /*
                   * Mesma lógica prática do PDV:
                   * se não houver preço Porto, usamos PMC
                   * para consulta do potencial de venda.
                   */
                  preco_venda:
                    n(
                      r.preco_venda
                    ) > 0
                      ? n(
                          r.preco_venda
                        )
                      : n(
                          p?.pmc
                        ) >
                        0
                      ? n(
                          p?.pmc
                        )
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

          estoqueFinal.sort(
            (a, b) => {
              if (
                a.estoque >
                  0 &&
                b.estoque <=
                  0
              ) {
                return -1;
              }

              if (
                a.estoque <=
                  0 &&
                b.estoque >
                  0
              ) {
                return 1;
              }

              return a.nome.localeCompare(
                b.nome,
                "pt-BR"
              );
            }
          );

          setEstoque(
            estoqueFinal
          );

          /* ===============================================
             4. COLOCA CUSTO NOS ITENS VENDIDOS
          =============================================== */

          const estoqueMap =
            new Map(
              estoqueFinal.map(
                (p) => [
                  p.produto_id,
                  p,
                ]
              )
            );

          const eanMap =
            new Map(
              estoqueFinal
                .filter(
                  (p) =>
                    p.ean
                )
                .map(
                  (p) => [
                    p.ean,
                    p,
                  ]
                )
            );

          const itensComCusto: ItemVendaDetalhado[] =
            itensHoje.map(
              (item) => {
                const porId =
                  item.produto_id
                    ? estoqueMap.get(
                        String(
                          item.produto_id
                        )
                      )
                    : undefined;

                const porEan =
                  item.ean
                    ? eanMap.get(
                        String(
                          item.ean
                        )
                      )
                    : undefined;

                const produto =
                  porId ||
                  porEan;

                return {
                  ...item,

                  custo_unitario:
                    produto?.preco_custo ??
                    null,
                };
              }
            );

          setItens(
            itensComCusto
          );

          /* ===============================================
             5. CAIXA ABERTO
          =============================================== */

          const {
            data: caixa,
            error:
              caixaError,
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

          if (
            caixaError
          ) {
            throw caixaError;
          }

          setSessao(
            (caixa as Sessao) ||
              null
          );

          if (caixa?.id) {
            const {
              data: mov,
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
                .eq(
                  "caixa_sessao_id",
                  caixa.id
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

            setMovimentos(
              (mov ||
                []) as MovimentoCaixa[]
            );
          } else {
            setMovimentos(
              []
            );
          }

          setUltimaAtualizacao(
            new Date()
          );
        } catch (e: any) {
          console.error(
            "Relatórios Porto:",
            e
          );

          if (!silencioso) {
            alert(
              e?.message ||
                "Erro ao carregar painel."
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

  useEffect(() => {
    carregar();

    const timer =
      window.setInterval(
        () => {
          carregar(true);
        },
        30000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [carregar]);

  /* =======================================================
     CÁLCULOS DO DIA
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
            forma === "Pix"
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
              ) * qtd;

            vendaComCusto +=
              totalItem;
          } else {
            itensSemCusto +=
              1;
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
     MAIS VENDIDOS
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
        .slice(0, 10);
    }, [itens]);

  /* =======================================================
     ESTOQUE
  ======================================================= */

  const resumoEstoque =
    useMemo(() => {
      let comEstoque =
        0;

      let zerados =
        0;

      let baixos =
        0;

      let unidades =
        0;

      let valorCusto =
        0;

      let valorVenda =
        0;

      let semCusto =
        0;

      estoque.forEach(
        (p) => {
          const qtd =
            n(
              p.estoque
            );

          if (qtd > 0) {
            comEstoque++;
          } else {
            zerados++;
          }

          if (
            qtd > 0 &&
            qtd <= 5
          ) {
            baixos++;
          }

          unidades += qtd;

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

          valorVenda +=
            qtd *
            n(
              p.preco_venda
            );
        }
      );

      return {
        comEstoque,
        zerados,
        baixos,
        unidades,
        valorCusto,
        valorVenda,

        lucroPotencial:
          valorVenda -
          valorCusto,

        semCusto,
      };
    }, [estoque]);

  const estoqueFiltrado =
    useMemo(() => {
      const raw =
        buscaEstoque
          .trim()
          .toLowerCase();

      if (!raw) {
        /*
         * Na tela inicial do estoque mostramos primeiro
         * os produtos que merecem atenção.
         */
        return estoque
          .filter(
            (p) =>
              p.estoque <= 5
          )
          .slice(0, 80);
      }

      const digits =
        onlyDigits(raw);

      return estoque
        .filter(
          (p) => {
            if (
              digits.length >=
              8
            ) {
              return p.ean.includes(
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
        )
        .slice(0, 100);
    }, [
      estoque,
      buscaEstoque,
    ]);

  /* =======================================================
     CAIXA
  ======================================================= */

  const resumoCaixa =
    useMemo(() => {
      const p = {
        Dinheiro: 0,
        Pix: 0,
        Débito: 0,
        Crédito: 0,
      };

      if (
        sessao?.id
      ) {
        pagamentos
          .filter(
            (x) =>
              x.caixa_sessao_id ===
              sessao.id
          )
          .forEach(
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
                  n(
                    x.valor
                  );
              }

              if (
                forma ===
                "Pix"
              ) {
                p.Pix +=
                  n(
                    x.valor
                  );
              }

              if (
                forma ===
                "Débito"
              ) {
                p.Débito +=
                  n(
                    x.valor
                  );
              }

              if (
                forma ===
                "Crédito"
              ) {
                p.Crédito +=
                  n(
                    x.valor
                  );
              }
            }
          );
      }

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

      const dinheiroEsperado =
        n(
          sessao?.valor_abertura
        ) +
        p.Dinheiro +
        m.SUPRIMENTO -
        m.SANGRIA -
        m.DESPESA -
        m.BOLETO;

      const totalSessao =
        p.Dinheiro +
        p.Pix +
        p.Débito +
        p.Crédito;

      return {
        p,
        m,
        dinheiroEsperado,
        totalSessao,
      };
    }, [
      sessao,
      pagamentos,
      movimentos,
    ]);

  /* =======================================================
     VENDA ABERTA
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
     CÂMERA ESTOQUE
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
                  ideal: 1280,
                },

                height: {
                  ideal: 720,
                },
              },

              audio: false,
            },

            videoRef.current,

            (result) => {
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

              if (!codigo) {
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

              setTimeout(
                () => {
                  fecharCamera();
                },
                100
              );
            }
          );

        scannerControlsRef.current =
          controls;
      } catch (e: any) {
        console.error(e);

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
  }, [cameraAberta]);

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
            Carregando painel Porto...
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

        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 md:px-5">

          <div className="min-w-0 flex-1">

            <div className="text-[10px] font-black uppercase text-blue-200">
              Drogarias Porto • Loja 2
            </div>

            <div className="flex items-center gap-2">

              <h1 className="truncate text-lg font-black">
                Painel em tempo real
              </h1>

              {sessao && (
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-black text-white">
                  CAIXA ABERTO
                </span>
              )}

            </div>

            <div className="mt-0.5 text-[10px] text-blue-200">

              {new Date().toLocaleDateString(
                "pt-BR"
              )}

              {ultimaAtualizacao &&
                ` • atualizado ${ultimaAtualizacao.toLocaleTimeString(
                  "pt-BR",
                  {
                    hour:
                      "2-digit",
                    minute:
                      "2-digit",
                  }
                )}`}

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              carregar(true)
            }
            disabled={
              atualizando
            }
            className="rounded-xl bg-white/10 p-2 disabled:opacity-50"
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
          >
            <ArrowLeft
              size={20}
            />
          </Link>

        </div>

      </header>

      <div className="mx-auto max-w-7xl p-3 md:p-5">

        {/* =================================================
            ABA HOJE
        ================================================= */}

        {aba ===
          "HOJE" && (
          <div className="space-y-3">

            {/* FATURAMENTO */}

            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 to-blue-700 p-5 text-white shadow-lg">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-xs font-black uppercase text-blue-200">
                    Vendas hoje
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
                  className="text-blue-200"
                />

              </div>

            </section>

            {/* LUCRO */}

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
                    : "Cadastre os custos"
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
                O lucro é estimado apenas nos itens que possuem preço de compra cadastrado.
              </div>
            )}

            {/* FORMAS DE PAGAMENTO */}

            <section className="rounded-3xl bg-white p-4 shadow-sm">

              <div className="mb-3 flex items-center justify-between">

                <div>

                  <div className="font-black text-slate-900">
                    Recebimentos
                  </div>

                  <div className="text-xs text-slate-500">
                    Vendas realizadas hoje
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

            {/* ÚLTIMAS VENDAS */}

            <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

              <div className="flex items-center justify-between border-b p-4">

                <div>

                  <div className="font-black">
                    Últimas vendas
                  </div>

                  <div className="text-xs text-slate-500">
                    Acompanhe o movimento da loja
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

              <div>

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
                            (
                              p
                            ) =>
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
                  <Vazio texto="Nenhuma venda registrada hoje." />
                )}

              </div>

            </section>

            {/* MAIS VENDIDOS */}

            <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

              <div className="flex items-center gap-2 border-b p-4">

                <BarChart3 className="text-blue-700" />

                <div>

                  <div className="font-black">
                    Mais vendidos hoje
                  </div>

                  <div className="text-xs text-slate-500">
                    Ranking por quantidade
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

                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            unidades
                          </div>

                        </div>

                      </div>
                    )
                  )
              ) : (
                <Vazio texto="Ainda não há itens vendidos hoje." />
              )}

            </section>

          </div>
        )}

        {/* =================================================
            ABA VENDAS
        ================================================= */}

        {aba ===
          "VENDAS" && (
          <div className="space-y-3">

            <section className="rounded-3xl bg-white p-4 shadow-sm">

              <div className="text-xs font-black uppercase text-slate-500">
                Faturamento de hoje
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

              <div className="border-b p-4">

                <div className="flex items-center gap-2">

                  <ShoppingCart className="text-blue-700" />

                  <div>

                    <div className="font-black">
                      Vendas do dia
                    </div>

                    <div className="text-xs text-slate-500">
                      Toque para visualizar os itens
                    </div>

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
                <Vazio texto="Nenhuma venda registrada hoje." />
              )}

            </section>

          </div>
        )}

        {/* =================================================
            ABA CAIXA
        ================================================= */}

        {aba ===
          "CAIXA" && (
          <div className="space-y-3">

            {!sessao ? (

              <section className="rounded-3xl bg-white p-6 text-center shadow-sm">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Banknote
                    size={30}
                  />
                </div>

                <div className="mt-3 text-xl font-black">
                  Caixa fechado
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  Não existe uma sessão de caixa aberta neste momento.
                </div>

                <Link
                  href="/drogariasporto/caixa"
                  className="mt-5 inline-flex rounded-2xl bg-blue-800 px-5 py-3 font-black text-white"
                >
                  IR PARA O CAIXA
                </Link>

              </section>

            ) : (
              <>

                <section className="rounded-3xl bg-green-600 p-5 text-white shadow-lg">

                  <div className="flex items-center justify-between">

                    <div>

                      <div className="text-xs font-black uppercase text-green-100">
                        Caixa aberto
                      </div>

                      <div className="mt-1 text-2xl font-black">
                        {sessao.operador ||
                          "Operador"}
                      </div>

                      <div className="mt-1 text-sm text-green-100">
                        Aberto às{" "}
                        {hora(
                          sessao.aberto_em
                        )}
                      </div>

                    </div>

                    <Clock3
                      size={36}
                      className="text-green-100"
                    />

                  </div>

                </section>

                <div className="grid grid-cols-2 gap-3">

                  <MiniCard
                    titulo="Vendido na sessão"
                    valor={brl(
                      resumoCaixa.totalSessao
                    )}
                    detalhe="Todos os pagamentos"
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

                <section className="rounded-3xl bg-white p-4 shadow-sm">

                  <div className="mb-3 font-black">
                    Pagamentos da sessão
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

                <section className="rounded-3xl bg-white p-4 shadow-sm">

                  <div className="font-black">
                    Movimento do caixa
                  </div>

                  <div className="mt-3 space-y-2">

                    <LinhaResumo
                      nome="Fundo inicial"
                      valor={
                        sessao.valor_abertura
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

                    <div className="flex items-end justify-between">

                      <div className="text-sm font-bold text-slate-500">
                        Dinheiro esperado
                      </div>

                      <div className="text-2xl font-black text-blue-900">
                        {brl(
                          resumoCaixa.dinheiroEsperado
                        )}
                      </div>

                    </div>

                  </div>

                </section>

                <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

                  <div className="border-b p-4">

                    <div className="font-black">
                      Últimos movimentos
                    </div>

                  </div>

                  {movimentos
                    .slice(0, 15)
                    .map(
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
                    <Vazio texto="Nenhuma movimentação nesta sessão." />
                  )}

                </section>

                <Link
                  href="/drogariasporto/caixa"
                  className="block rounded-2xl bg-blue-800 py-4 text-center font-black text-white"
                >
                  ABRIR CAIXA COMPLETO
                </Link>

              </>
            )}

          </div>
        )}

        {/* =================================================
            ABA ESTOQUE
        ================================================= */}

        {aba ===
          "ESTOQUE" && (
          <div className="space-y-3">

            <div className="grid grid-cols-3 gap-2">

              <EstoqueNumero
                titulo="Com estoque"
                valor={
                  resumoEstoque.comEstoque
                }
                classe="text-green-700"
              />

              <EstoqueNumero
                titulo="Baixo"
                valor={
                  resumoEstoque.baixos
                }
                classe="text-amber-600"
              />

              <EstoqueNumero
                titulo="Zerado"
                valor={
                  resumoEstoque.zerados
                }
                classe="text-red-600"
              />

            </div>

            <section className="rounded-3xl bg-white p-4 shadow-sm">

              <div className="grid grid-cols-2 gap-3">

                <ValorEstoque
                  titulo="Estoque a custo"
                  valor={
                    resumoEstoque.valorCusto
                  }
                />

                <ValorEstoque
                  titulo="Potencial de venda"
                  valor={
                    resumoEstoque.valorVenda
                  }
                />

                <ValorEstoque
                  titulo="Lucro potencial"
                  valor={
                    resumoEstoque.lucroPotencial
                  }
                />

                <div className="rounded-2xl bg-slate-50 p-3">

                  <div className="text-[10px] font-black uppercase text-slate-400">
                    Unidades
                  </div>

                  <div className="mt-1 text-xl font-black text-slate-900">
                    {resumoEstoque.unidades.toLocaleString(
                      "pt-BR"
                    )}
                  </div>

                </div>

              </div>

              {resumoEstoque.semCusto >
                0 && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800">
                  {
                    resumoEstoque.semCusto
                  }{" "}
                  produto(s) com estoque ainda não possuem custo cadastrado.
                </div>
              )}

            </section>

            {/* BUSCA ESTOQUE */}

            <section className="sticky top-[76px] z-20 rounded-2xl bg-white p-3 shadow-md">

              <div className="flex gap-2">

                <div className="flex min-w-0 flex-1 items-center rounded-xl border-2 border-blue-200 px-3 focus-within:border-blue-700">

                  <Search
                    size={19}
                    className="shrink-0 text-slate-500"
                  />

                  <input
                    value={
                      buscaEstoque
                    }
                    onChange={(e) =>
                      setBuscaEstoque(
                        e.target.value
                      )
                    }
                    placeholder="Nome ou EAN"
                    className="min-w-0 flex-1 px-3 py-3 font-bold outline-none"
                  />

                  {buscaEstoque && (
                    <button
                      type="button"
                      onClick={() =>
                        setBuscaEstoque(
                          ""
                        )
                      }
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
                  className="flex w-12 items-center justify-center rounded-xl bg-slate-900 text-white"
                >
                  <Camera
                    size={21}
                  />
                </button>

              </div>

              {!buscaEstoque && (
                <div className="mt-2 text-xs font-bold text-slate-500">
                  Mostrando primeiro produtos com estoque baixo ou zerado.
                </div>
              )}

            </section>

            {/* PRODUTOS */}

            <section className="space-y-2">

              {estoqueFiltrado.map(
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

              {estoqueFiltrado.length ===
                0 && (
                <Vazio texto="Nenhum produto encontrado." />
              )}

            </section>

            <Link
              href="/drogariasporto/admin/produtos"
              className="block rounded-2xl bg-blue-800 py-4 text-center font-black text-white"
            >
              GERENCIAR ESTOQUE
            </Link>

          </div>
        )}

      </div>

      {/* ===================================================
          NAVEGAÇÃO MOBILE
      =================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">

        <div className="mx-auto grid max-w-2xl grid-cols-4">

          <NavButton
            active={
              aba ===
              "HOJE"
            }
            label="Hoje"
            icon={
              <BarChart3
                size={20}
              />
            }
            onClick={() =>
              setAba(
                "HOJE"
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
                    (i) => (
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
                            n(
                              i.total
                            ) >
                              0
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
                                  )
                          )}
                        </div>

                      </div>
                    )
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
   COMPONENTES DO PAINEL
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
        <div className="min-w-0">
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
   CARD PAGAMENTO
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
   LINHA VENDA
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
        <ShoppingCart size={20} />
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
            {hora(venda.created_at)}
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
          {brl(venda.total)}
        </div>

        <div className="mt-1 flex justify-end text-slate-400">
          <ChevronRight size={16} />
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   LINHA RESUMO CAIXA
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
          negativo && valor > 0
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {negativo && valor > 0
          ? "- "
          : ""}
        {brl(valor)}
      </span>
    </div>
  );
}

/* =========================================================
   NÚMERO ESTOQUE
========================================================= */

function EstoqueNumero({
  titulo,
  valor,
  classe,
}: {
  titulo: string;
  valor: number;
  classe?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
      <div
        className={`text-2xl font-black ${
          classe || "text-blue-900"
        }`}
      >
        {valor}
      </div>

      <div className="mt-1 text-[10px] font-black uppercase leading-tight text-slate-400">
        {titulo}
      </div>
    </div>
  );
}

/* =========================================================
   VALOR ESTOQUE
========================================================= */

function ValorEstoque({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-[10px] font-black uppercase text-slate-400">
        {titulo}
      </div>

      <div className="mt-1 text-lg font-black text-blue-950">
        {brl(valor)}
      </div>
    </div>
  );
}

/* =========================================================
   PRODUTO ESTOQUE
========================================================= */

function ProdutoEstoqueCard({
  produto,
}: {
  produto: ProdutoEstoque;
}) {
  const custo =
    produto.preco_custo !== null
      ? n(produto.preco_custo)
      : 0;

  const venda =
    produto.preco_venda !== null
      ? n(produto.preco_venda)
      : 0;

  const lucroUnitario =
    venda > 0
      ? venda - custo
      : 0;

  const margemProduto =
    custo > 0 &&
    venda > 0
      ? margem(custo, venda)
      : 0;

  const custoTotal =
    custo *
    n(produto.estoque);

  const vendaTotal =
    venda *
    n(produto.estoque);

  const estoqueBaixo =
    produto.estoque > 0 &&
    produto.estoque <= 5;

  const zerado =
    produto.estoque <= 0;

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="p-4">
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
            <Box size={25} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-base font-black leading-tight text-slate-950">
              {produto.nome}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              EAN{" "}
              <b>
                {produto.ean || "—"}
              </b>
            </div>

            {produto.laboratorio && (
              <div className="mt-0.5 truncate text-xs text-slate-400">
                {produto.laboratorio}

                {produto.apresentacao
                  ? ` • ${produto.apresentacao}`
                  : ""}
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div
              className={`text-2xl font-black ${
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
              estoque
            </div>
          </div>
        </div>

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

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-[9px] font-black uppercase text-slate-400">
              Compra
            </div>

            <div className="mt-1 font-black text-slate-900">
              {produto.preco_custo === null ||
              custo <= 0
                ? "Não cadastrado"
                : brl(custo)}
            </div>
          </div>

          <div className="rounded-2xl bg-blue-50 p-3">
            <div className="text-[9px] font-black uppercase text-blue-500">
              Venda
            </div>

            <div className="mt-1 font-black text-blue-950">
              {venda > 0
                ? brl(venda)
                : "Sem preço"}
            </div>
          </div>
        </div>

        {custo > 0 &&
          venda > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-green-50 p-3">
                <div className="text-[9px] font-black uppercase text-green-600">
                  Lucro / un.
                </div>

                <div
                  className={`mt-1 font-black ${
                    lucroUnitario >= 0
                      ? "text-green-700"
                      : "text-red-600"
                  }`}
                >
                  {brl(lucroUnitario)}
                </div>
              </div>

              <div className="rounded-2xl bg-green-50 p-3">
                <div className="text-[9px] font-black uppercase text-green-600">
                  Margem
                </div>

                <div
                  className={`mt-1 font-black ${
                    margemProduto >= 0
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

        {produto.estoque > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
            <div>
              <div className="text-[9px] font-black uppercase text-slate-400">
                Custo no estoque
              </div>

              <div className="font-black text-slate-700">
                {custo > 0
                  ? brl(custoTotal)
                  : "—"}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] font-black uppercase text-slate-400">
                Venda potencial
              </div>

              <div className="font-black text-blue-900">
                {venda > 0
                  ? brl(vendaTotal)
                  : "—"}
              </div>
            </div>
          </div>
        )}

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
        <Package size={22} />
      </div>

      <div className="mt-2 text-sm font-bold text-slate-500">
        {texto}
      </div>
    </div>
  );
}