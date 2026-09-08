"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ChevronRight,
  HeartPulse,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

import { useCart } from "./_components/cart";
import { useToast } from "./_components/toast";
import FVBanners from "./_components/FVBanners";

/* =========================================================
   CONFIGURAÇÃO — DROGARIA REDE FABIANO
========================================================= */

const LOJA_SLUG = "drogariaredefabiano";
const PREFIX = "/drogarias/drogariaredefabiano";

const WHATS_DRF = "5511948343725";

const PROD_TABLE = "fv_produtos";
const STORE_TABLE = "fv_farmacia_produtos";

const HOME_LIMIT = 180;
const SEARCH_LIMIT = 100;
const SEARCH_DEBOUNCE = 300;

/* =========================================================
   TIPOS
========================================================= */

type Produto = {
  produto_id: string;
  farmacia_slug: string;

  ean: string;
  nome: string;

  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;

  imagens: any;

  pmc: number | null;

  estoque: number;
  preco_venda: number;

  disponivel_farmacia: boolean;

  ativo_site: boolean;
  ativo_pdv: boolean;

  em_promocao: boolean;

  preco_promocional: number | null;
  percentual_off: number | null;

  destaque_home: boolean;
};

type CategoriaItem = {
  label: string;
  termos: string[];
};

/* =========================================================
   CATEGORIAS
========================================================= */

const categorias: CategoriaItem[] = [
  {
    label: "Loja toda",
    termos: [],
  },

  {
    label: "Medicamentos",
    termos: [
      "medicamento",
      "medicamentos",
      "farmaco",
      "fármaco",
    ],
  },

  {
    label: "Higiene e Beleza",
    termos: [
      "higiene",
      "beleza",
      "cosmetico",
      "cosmético",
    ],
  },

  {
    label: "Mamãe e Bebê",
    termos: [
      "bebe",
      "bebê",
      "infantil",
      "mamae",
      "mamãe",
      "fralda",
    ],
  },

  {
    label: "Vitaminas",
    termos: [
      "vitamina",
      "vitaminas",
      "suplemento",
      "suplementos",
    ],
  },

  {
    label: "Cuidados Pessoais",
    termos: [
      "cuidados pessoais",
      "cuidado pessoal",
    ],
  },

  {
    label: "Dermocosméticos",
    termos: [
      "dermocosmetico",
      "dermocosmético",
      "dermocosmeticos",
      "dermocosméticos",
    ],
  },
];

/* =========================================================
   HELPERS
========================================================= */

function brl(
  valor: number | null | undefined
) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function onlyDigits(valor: string) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizeText(valor: string) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeImgs(valor: any): string[] {
  if (!valor) return [];

  if (Array.isArray(valor)) {
    return valor
      .map(String)
      .filter(Boolean);
  }

  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor);

      if (Array.isArray(parsed)) {
        return parsed
          .map(String)
          .filter(Boolean);
      }
    } catch {
      if (
        valor.startsWith("http") ||
        valor.startsWith("/")
      ) {
        return [valor];
      }
    }
  }

  if (
    valor &&
    typeof valor === "object"
  ) {
    return Object.values(valor)
      .map(String)
      .filter(Boolean);
  }

  return [];
}

function firstImg(imagens: any) {
  const lista = normalizeImgs(imagens);

  return (
    lista[0] ||
    "/produtos/caixa-padrao.png"
  );
}

function waLink(
  telefone: string,
  mensagem: string
) {
  const numero = onlyDigits(telefone);

  return `https://wa.me/${numero}?text=${encodeURIComponent(
    mensagem
  )}`;
}

/* =========================================================
   PREÇO DO PRODUTO

   REGRA:
   1. preco_venda da Rede Fabiano
   2. fallback PMC
   3. promoção somente se menor que o preço base
========================================================= */

function precoProduto(p: Produto) {
  const precoLoja = Number(
    p.preco_venda || 0
  );

  const pmc = Number(
    p.pmc || 0
  );

  const promocional = Number(
    p.preco_promocional || 0
  );

  const base =
    precoLoja > 0
      ? precoLoja
      : pmc;

  const promocaoValida =
    !!p.em_promocao &&
    promocional > 0 &&
    base > 0 &&
    promocional < base;

  const final = promocaoValida
    ? promocional
    : base;

  const percentualSalvo = Number(
    p.percentual_off || 0
  );

  const percentualCalculado =
    promocaoValida && base > 0
      ? Math.round(
          100 -
            (promocional / base) * 100
        )
      : 0;

  const percentual =
    percentualSalvo > 0
      ? percentualSalvo
      : percentualCalculado;

  return {
    base,
    final,
    promocional,
    emPromocao: promocaoValida,
    percentual,
    economia:
      promocaoValida
        ? Math.max(
            0,
            base - promocional
          )
        : 0,
  };
}

/* =========================================================
   HOME
========================================================= */

export default function DrogariaRedeFabianoHome() {
  const openedByQueryRef =
    useRef(false);

  const searchRef =
    useRef<HTMLInputElement>(null);

  const cart = useCart();

  const [produtos, setProdutos] =
    useState<Produto[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingBusca, setLoadingBusca] =
    useState(false);

  const [busca, setBusca] =
    useState("");

  const [resultadoBusca, setResultadoBusca] =
    useState<Produto[]>([]);

  const [categoria, setCategoria] =
    useState("Loja toda");

  const [cartOpen, setCartOpen] =
    useState(false);

  /* =======================================================
     CARRINHO
  ======================================================= */

  const totalCarrinho =
    cart.subtotal;

  const qtdCarrinho =
    cart.countItems;

  function abrirCarrinho() {
    setCartOpen(true);
  }

  function fecharCarrinho() {
    setCartOpen(false);
  }

  /* =======================================================
     ABRIR CARRINHO POR URL
     ?openCart=1
  ======================================================= */

  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    if (
      openedByQueryRef.current
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get("openCart") !== "1"
    ) {
      return;
    }

    openedByQueryRef.current = true;

    setCartOpen(true);

    params.delete("openCart");

    const query =
      params.toString();

    const novaUrl =
      window.location.pathname +
      (query ? `?${query}` : "");

    window.history.replaceState(
      {},
      "",
      novaUrl
    );
  }, []);

  /* =======================================================
     CARREGAR PRODUTOS DA REDE FABIANO

     Agora usa:
     fv_farmacia_produtos
             +
     fv_produtos

     Mesma arquitetura do Admin/PDV.
  ======================================================= */

  useEffect(() => {
    async function carregarProdutos() {
      try {
        setLoading(true);

        /* -----------------------------------------------
           1. PRODUTOS ATIVOS NO SITE DA LOJA
        ----------------------------------------------- */

        const {
          data: lojaRows,
          error: lojaError,
        } = await supabase
          .from(STORE_TABLE)
          .select(
            `
              produto_id,
              estoque,
              preco_venda,
              ativo,
              ativo_site,
              ativo_pdv,
              em_promocao,
              preco_promocional,
              percentual_off,
              destaque_home
            `
          )
          .eq(
            "farmacia_slug",
            LOJA_SLUG
          )
          .eq(
            "ativo_site",
            true
          )
          .gt(
            "estoque",
            0
          )
          .order(
            "destaque_home",
            {
              ascending: false,
            }
          )
          .order(
            "em_promocao",
            {
              ascending: false,
            }
          )
          .order(
            "estoque",
            {
              ascending: false,
            }
          )
          .limit(HOME_LIMIT);

        if (lojaError) {
          throw lojaError;
        }

        const ids = (
          lojaRows || []
        )
          .map(
            (row: any) =>
              String(
                row.produto_id || ""
              )
          )
          .filter(Boolean);

        if (!ids.length) {
          setProdutos([]);
          return;
        }

        /* -----------------------------------------------
           2. CATÁLOGO MASTER
        ----------------------------------------------- */

        const {
          data: masterRows,
          error: masterError,
        } = await supabase
          .from(PROD_TABLE)
          .select(
            `
              id,
              ean,
              nome,
              laboratorio,
              categoria,
              apresentacao,
              imagens,
              pmc,
              ativo
            `
          )
          .in(
            "id",
            ids
          )
          .eq(
            "ativo",
            true
          );

        if (masterError) {
          throw masterError;
        }

        /* -----------------------------------------------
           3. JUNTA MASTER + REDE FABIANO
        ----------------------------------------------- */

        const masterMap =
          new Map<string, any>();

        for (
          const master of
          masterRows || []
        ) {
          masterMap.set(
            String(master.id),
            master
          );
        }

        const unidos: Produto[] = (
          lojaRows || []
        )
          .map(
            (loja: any) => {
              const master =
                masterMap.get(
                  String(
                    loja.produto_id
                  )
                );

              if (!master) {
                return null;
              }

              return {
                produto_id:
                  String(
                    loja.produto_id
                  ),

                farmacia_slug:
                  LOJA_SLUG,

                ean:
                  String(
                    master.ean || ""
                  ),

                nome:
                  String(
                    master.nome || ""
                  ),

                laboratorio:
                  master.laboratorio ??
                  null,

                categoria:
                  master.categoria ??
                  null,

                apresentacao:
                  master.apresentacao ??
                  null,

                imagens:
                  master.imagens ??
                  null,

                pmc:
                  master.pmc == null
                    ? null
                    : Number(
                        master.pmc
                      ),

                estoque:
                  Number(
                    loja.estoque || 0
                  ),

                preco_venda:
                  Number(
                    loja.preco_venda ||
                      0
                  ),

                disponivel_farmacia:
                  !!loja.ativo,

                ativo_site:
                  !!loja.ativo_site,

                ativo_pdv:
                  !!loja.ativo_pdv,

                em_promocao:
                  !!loja.em_promocao,

                preco_promocional:
                  loja.preco_promocional ==
                  null
                    ? null
                    : Number(
                        loja.preco_promocional
                      ),

                percentual_off:
                  loja.percentual_off ==
                  null
                    ? null
                    : Number(
                        loja.percentual_off
                      ),

                destaque_home:
                  !!loja.destaque_home,
              } as Produto;
            }
          )
          .filter(
            Boolean
          ) as Produto[];

        unidos.sort(
          (a, b) => {
            if (
              a.destaque_home !==
              b.destaque_home
            ) {
              return a.destaque_home
                ? -1
                : 1;
            }

            if (
              a.em_promocao !==
              b.em_promocao
            ) {
              return a.em_promocao
                ? -1
                : 1;
            }

            return a.nome.localeCompare(
              b.nome,
              "pt-BR"
            );
          }
        );

        setProdutos(unidos);
      } catch (error) {
        console.error(
          "Erro ao carregar Rede Fabiano:",
          error
        );

        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }

    void carregarProdutos();
  }, []);

  /* =======================================================
     BUSCA DIRETA NO BANCO

     Não fica limitada aos produtos carregados na Home.
  ======================================================= */

  useEffect(() => {
    const termo =
      busca.trim();

    if (!termo) {
      setResultadoBusca([]);
      setLoadingBusca(false);
      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          try {
            setLoadingBusca(true);

            const digits =
              onlyDigits(termo);

            /* -------------------------------------------
               BUSCA MASTER
            ------------------------------------------- */

            let query =
              supabase
                .from(PROD_TABLE)
                .select(
                  `
                    id,
                    ean,
                    nome,
                    laboratorio,
                    categoria,
                    apresentacao,
                    imagens,
                    pmc,
                    ativo
                  `,
                  {
                    count: "exact",
                  }
                )
                .eq(
                  "ativo",
                  true
                )
                .limit(
                  SEARCH_LIMIT
                );

            if (
              digits.length >= 8 &&
              digits.length <= 14 &&
              digits === termo
            ) {
              query =
                query.eq(
                  "ean",
                  digits
                );
            } else if (
              digits.length >= 8 &&
              digits.length <= 14
            ) {
              query =
                query.or(
                  `ean.eq.${digits},nome.ilike.%${termo}%`
                );
            } else {
              query =
                query.or(
                  [
                    `nome.ilike.%${termo}%`,
                    `laboratorio.ilike.%${termo}%`,
                    `categoria.ilike.%${termo}%`,
                    `apresentacao.ilike.%${termo}%`,
                  ].join(",")
                );
            }

            const {
              data: masters,
              error: masterError,
            } =
              await query.order(
                "nome",
                {
                  ascending: true,
                }
              );

            if (masterError) {
              throw masterError;
            }

            const ids = (
              masters || []
            )
              .map(
                (p: any) =>
                  String(p.id)
              )
              .filter(Boolean);

            if (!ids.length) {
              setResultadoBusca(
                []
              );

              return;
            }

            /* -------------------------------------------
               BUSCA CONFIGURAÇÃO DA REDE FABIANO
            ------------------------------------------- */

            const {
              data: lojas,
              error: lojaError,
            } =
              await supabase
                .from(
                  STORE_TABLE
                )
                .select(
                  `
                    produto_id,
                    estoque,
                    preco_venda,
                    ativo,
                    ativo_site,
                    ativo_pdv,
                    em_promocao,
                    preco_promocional,
                    percentual_off,
                    destaque_home
                  `
                )
                .eq(
                  "farmacia_slug",
                  LOJA_SLUG
                )
                .eq(
                  "ativo_site",
                  true
                )
                .gt(
                  "estoque",
                  0
                )
                .in(
                  "produto_id",
                  ids
                );

            if (lojaError) {
              throw lojaError;
            }

            const lojaMap =
              new Map<string, any>();

            for (
              const loja of
              lojas || []
            ) {
              lojaMap.set(
                String(
                  loja.produto_id
                ),
                loja
              );
            }

            const resultado: Produto[] =
              (
                masters || []
              )
                .map(
                  (
                    master: any
                  ) => {
                    const loja =
                      lojaMap.get(
                        String(
                          master.id
                        )
                      );

                    if (!loja) {
                      return null;
                    }

                    return {
                      produto_id:
                        String(
                          master.id
                        ),

                      farmacia_slug:
                        LOJA_SLUG,

                      ean:
                        String(
                          master.ean ||
                            ""
                        ),

                      nome:
                        String(
                          master.nome ||
                            ""
                        ),

                      laboratorio:
                        master.laboratorio ??
                        null,

                      categoria:
                        master.categoria ??
                        null,

                      apresentacao:
                        master.apresentacao ??
                        null,

                      imagens:
                        master.imagens ??
                        null,

                      pmc:
                        master.pmc ==
                        null
                          ? null
                          : Number(
                              master.pmc
                            ),

                      estoque:
                        Number(
                          loja.estoque ||
                            0
                        ),

                      preco_venda:
                        Number(
                          loja.preco_venda ||
                            0
                        ),

                      disponivel_farmacia:
                        !!loja.ativo,

                      ativo_site:
                        !!loja.ativo_site,

                      ativo_pdv:
                        !!loja.ativo_pdv,

                      em_promocao:
                        !!loja.em_promocao,

                      preco_promocional:
                        loja.preco_promocional ==
                        null
                          ? null
                          : Number(
                              loja.preco_promocional
                            ),

                      percentual_off:
                        loja.percentual_off ==
                        null
                          ? null
                          : Number(
                              loja.percentual_off
                            ),

                      destaque_home:
                        !!loja.destaque_home,
                    } as Produto;
                  }
                )
                .filter(
                  Boolean
                ) as Produto[];

            resultado.sort(
              (a, b) => {
                if (
                  a.em_promocao !==
                  b.em_promocao
                ) {
                  return a.em_promocao
                    ? -1
                    : 1;
                }

                return a.nome.localeCompare(
                  b.nome,
                  "pt-BR"
                );
              }
            );

            setResultadoBusca(
              resultado
            );
          } catch (error) {
            console.error(
              "Erro busca Rede Fabiano:",
              error
            );

            setResultadoBusca(
              []
            );
          } finally {
            setLoadingBusca(
              false
            );
          }
        },
        SEARCH_DEBOUNCE
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [busca]);

  /* =======================================================
     FILTRO DE CATEGORIA
  ======================================================= */

  const produtosBase =
    busca.trim()
      ? resultadoBusca
      : produtos;

  const produtosFiltrados =
    useMemo(() => {
      if (
        categoria === "Loja toda"
      ) {
        return produtosBase;
      }

      const config =
        categorias.find(
          (item) =>
            item.label ===
            categoria
        );

      if (!config) {
        return produtosBase;
      }

      return produtosBase.filter(
        (produto) => {
          const categoriaProduto =
            normalizeText(
              produto.categoria ||
                ""
            );

          const nomeProduto =
            normalizeText(
              produto.nome || ""
            );

          return config.termos.some(
            (termo) => {
              const t =
                normalizeText(
                  termo
                );

              return (
                categoriaProduto.includes(
                  t
                ) ||
                nomeProduto.includes(
                  t
                )
              );
            }
          );
        }
      );
    }, [
      produtosBase,
      categoria,
    ]);

  /* =======================================================
     DESTAQUES / PROMOÇÕES
  ======================================================= */

  const promocoes =
    useMemo(
      () =>
        produtosFiltrados.filter(
          (produto) =>
            precoProduto(
              produto
            ).emPromocao
        ),
      [produtosFiltrados]
    );

  const destaques =
    useMemo(() => {
      const marcados =
        produtosFiltrados.filter(
          (produto) =>
            produto.destaque_home
        );

      if (marcados.length) {
        return marcados.slice(
          0,
          10
        );
      }

      return produtosFiltrados.slice(
        0,
        10
      );
    }, [produtosFiltrados]);

  /* =======================================================
     MAPA DE ESTOQUE PARA O CARRINHO
  ======================================================= */

  const estoqueByEan =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          number
        >();

      for (
        const produto of
        produtos
      ) {
        mapa.set(
          produto.ean,
          Number(
            produto.estoque ||
              0
          )
        );
      }

      for (
        const produto of
        resultadoBusca
      ) {
        mapa.set(
          produto.ean,
          Number(
            produto.estoque ||
              0
          )
        );
      }

      return mapa;
    }, [
      produtos,
      resultadoBusca,
    ]);

  /* =======================================================
     WHATSAPP / ENCOMENDA
  ======================================================= */

  function encomendar(
    produto: Produto
  ) {
    const mensagem =
      `Olá! Gostaria de consultar/encomendar este produto na Drogaria Rede Fabiano:\n\n` +
      `• ${produto.nome}\n` +
      `• EAN: ${produto.ean}\n` +
      (produto.apresentacao
        ? `• Apresentação: ${produto.apresentacao}\n`
        : "") +
      (produto.laboratorio
        ? `• Laboratório: ${produto.laboratorio}\n`
        : "") +
      `\nPode me informar disponibilidade e valor?`;

    window.open(
      waLink(
        WHATS_DRF,
        mensagem
      ),
      "_blank"
    );
  }

  /* =======================================================
     CONTROLE DA BUSCA
  ======================================================= */

  function limparBusca() {
    setBusca("");
    setResultadoBusca([]);

    window.setTimeout(
      () =>
        searchRef.current?.focus(),
      50
    );
  }

  const isSearching =
    !!busca.trim();

  const quantidadeExibida =
    produtosFiltrados.length;

  /* =======================================================
     A PARTIR DAQUI ENTRA O RETURN PRINCIPAL
     CONTINUA NO BLOCO 2
  ======================================================= */
    return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1450px] items-center gap-3 px-3 py-3 md:px-4">
          {/* LOGO / NOME */}

          <Link href={PREFIX} className="min-w-fit">
            <div className="text-lg font-black tracking-tight text-blue-800 md:text-xl">
              REDE{" "}
              <span className="text-green-600">
                FABIANO
              </span>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Drogaria
            </div>
          </Link>

          {/* BUSCA DESKTOP */}

          <div className="hidden flex-1 items-center rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-600 focus-within:bg-white md:flex">
            <Search
              size={20}
              className="shrink-0 text-blue-700"
            />

            <input
              ref={searchRef}
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              placeholder="Busque por medicamento, produto, EAN ou laboratório..."
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold outline-none"
            />

            {busca.trim() && (
              <button
                type="button"
                onClick={limparBusca}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                title="Limpar busca"
              >
                <X size={18} />
              </button>
            )}

            {loadingBusca && (
              <span className="ml-2 text-xs font-bold text-blue-700">
                Buscando...
              </span>
            )}
          </div>

          {/* AÇÕES */}

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="hidden h-11 w-11 items-center justify-center rounded-xl border bg-white text-slate-600 transition hover:bg-slate-50 sm:flex"
              title="Minha conta"
            >
              <UserRound size={20} />
            </button>

            <button
              type="button"
              onClick={abrirCarrinho}
              className="relative flex items-center gap-2 rounded-xl border bg-white px-3 py-2 transition hover:bg-slate-50"
            >
              <ShoppingBag className="text-green-600" />

              <div className="hidden text-left sm:block">
                <div className="text-sm font-black">
                  {brl(totalCarrinho)}
                </div>

                <div className="text-[10px] font-bold text-slate-500">
                  {qtdCarrinho} item(ns)
                </div>
              </div>

              {qtdCarrinho > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-green-600 px-1 text-[10px] font-black text-white">
                  {qtdCarrinho}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* BUSCA MOBILE */}

        <div className="mx-auto max-w-[1450px] px-3 pb-3 md:hidden">
          <div className="flex items-center rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 focus-within:border-blue-600 focus-within:bg-white">
            <Search
              size={19}
              className="shrink-0 text-blue-700"
            />

            <input
              ref={searchRef}
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              placeholder="Buscar produto ou EAN..."
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold outline-none"
            />

            {busca.trim() && (
              <button
                type="button"
                onClick={limparBusca}
                className="rounded-lg p-1.5 text-slate-500"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {isSearching && (
            <div className="mt-1 px-2 text-[11px] font-bold text-slate-500">
              {loadingBusca
                ? "Buscando produtos..."
                : `${quantidadeExibida} produto(s) encontrado(s)`}
            </div>
          )}
        </div>
      </header>

      {/* =====================================================
          BANNERS
      ===================================================== */}

      {!isSearching && (
        <div className="mx-auto mt-4 max-w-[1450px]">
          <FVBanners />
        </div>
      )}

      {/* =====================================================
          LAYOUT
      ===================================================== */}

      <div className="mx-auto grid max-w-[1450px] gap-6 px-3 py-5 md:px-4 lg:grid-cols-[290px_1fr] lg:py-8">
        {/* ===================================================
            MENU LATERAL DESKTOP
        =================================================== */}

        <aside className="hidden lg:block">
          <div className="sticky top-24 overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-800 text-white">
                  <Store size={26} />
                </div>

                <div>
                  <h1 className="font-black leading-tight">
                    Drogaria Rede Fabiano
                  </h1>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Saúde perto de você
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-center gap-2 font-black text-slate-800">
                  <Truck
                    size={18}
                    className="text-green-600"
                  />
                  Entrega ou retirada
                </div>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Escolha como deseja receber seu pedido no fechamento da compra.
                </p>
              </div>

              <div className="mt-3 rounded-2xl border bg-green-50 p-4">
                <div className="flex items-center gap-2 font-black text-green-800">
                  <PackageCheck size={18} />
                  Estoque da loja
                </div>

                <p className="mt-1 text-xs text-green-700">
                  Produtos disponíveis integrados ao estoque da Rede Fabiano.
                </p>
              </div>
            </div>

            <div className="border-t p-3">
              <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Categorias
              </div>

              <nav className="space-y-1">
                {categorias.map((item) => (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() =>
                      setCategoria(item.label)
                    }
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      categoria === item.label
                        ? "bg-blue-50 font-black text-blue-800"
                        : "font-semibold text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{item.label}</span>

                    <ChevronRight size={16} />
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* ===================================================
            CONTEÚDO
        =================================================== */}

        <section className="min-w-0">
          {/* =================================================
              CATEGORIAS MOBILE
          ================================================= */}

          <div className="mb-4 overflow-x-auto pb-1 lg:hidden">
            <div className="flex min-w-max gap-2">
              {categorias.map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() =>
                    setCategoria(item.label)
                  }
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black transition ${
                    categoria === item.label
                      ? "border-blue-800 bg-blue-800 text-white"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* =================================================
              HERO
          ================================================= */}

          {!isSearching && (
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 p-5 text-white shadow-lg md:p-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-blue-100">
                  <HeartPulse size={15} />
                  DROGARIA REDE FABIANO
                </div>

                <h2 className="mt-4 text-2xl font-black leading-tight md:text-4xl">
                  Sua saúde, sua farmácia,
                  <span className="text-green-300">
                    {" "}
                    perto de você.
                  </span>
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 md:text-base">
                  Consulte produtos, preços e estoque da Rede Fabiano. Compre pelo celular e escolha entre entrega ou retirada.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      searchRef.current?.focus();

                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                    className="rounded-xl bg-green-500 px-5 py-3 text-sm font-black text-white transition hover:bg-green-600"
                  >
                    Buscar produto
                  </button>

                  <button
                    type="button"
                    onClick={abrirCarrinho}
                    className="rounded-xl bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
                  >
                    Ver carrinho
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              BUSCA
          ================================================= */}

          {isSearching && (
            <div className="rounded-3xl border bg-white p-4 shadow-sm md:p-5">
              <div className="text-xs font-black uppercase tracking-wider text-blue-700">
                Busca
              </div>

              <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black md:text-2xl">
                    Resultados para “{busca}”
                  </h2>

                  {!loadingBusca && (
                    <p className="mt-1 text-sm text-slate-500">
                      {quantidadeExibida} produto(s) disponível(is) na Rede Fabiano.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={limparBusca}
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-black text-slate-700"
                >
                  Limpar busca
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              PROMOÇÕES
          ================================================= */}

          {!isSearching &&
            categoria === "Loja toda" &&
            promocoes.length > 0 && (
              <section className="mt-8">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-red-600">
                      Ofertas
                    </p>

                    <h2 className="text-xl font-black md:text-2xl">
                      Promoções da Rede Fabiano
                    </h2>
                  </div>

                  <span className="text-xs font-bold text-slate-500">
                    {promocoes.length} oferta(s)
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-5">
                  {promocoes
                    .slice(0, 10)
                    .map((produto) => (
                      <ProdutoCard
                        key={`promo-${produto.produto_id}`}
                        produto={produto}
                        onEncomendar={() =>
                          encomendar(produto)
                        }
                      />
                    ))}
                </div>
              </section>
            )}

          {/* =================================================
              PRODUTOS
          ================================================= */}

          <section className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-blue-700">
                  {isSearching
                    ? "Resultado"
                    : categoria === "Loja toda"
                    ? "Destaques"
                    : categoria}
                </p>

                <h2 className="text-xl font-black md:text-2xl">
                  {isSearching
                    ? "Produtos encontrados"
                    : categoria === "Loja toda"
                    ? "Produtos disponíveis"
                    : `Produtos • ${categoria}`}
                </h2>
              </div>

              {!loading &&
                !loadingBusca && (
                  <div className="text-xs font-bold text-slate-500">
                    {quantidadeExibida} produto(s)
                  </div>
                )}
            </div>

            {loading ||
            (isSearching && loadingBusca) ? (
              <GridSkeleton />
            ) : produtosFiltrados.length === 0 ? (
              <div className="mt-5 rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center md:p-12">
                <Search
                  size={36}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-3 font-black">
                  Nenhum produto encontrado
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  Tente outro nome, laboratório ou código de barras.
                </p>

                {isSearching && (
                  <button
                    type="button"
                    onClick={limparBusca}
                    className="mt-4 rounded-xl bg-blue-800 px-4 py-3 text-sm font-black text-white"
                  >
                    Voltar aos produtos
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-5">
                {(isSearching
                  ? produtosFiltrados
                  : categoria === "Loja toda"
                  ? destaques
                  : produtosFiltrados
                ).map((produto) => (
                  <ProdutoCard
                    key={produto.produto_id}
                    produto={produto}
                    onEncomendar={() =>
                      encomendar(produto)
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* =================================================
              TODOS OS PRODUTOS
          ================================================= */}

          {!isSearching &&
            categoria === "Loja toda" &&
            produtosFiltrados.length > 10 && (
              <section className="mt-10">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-green-700">
                    Catálogo
                  </p>

                  <h2 className="text-xl font-black md:text-2xl">
                    Mais produtos da loja
                  </h2>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-5">
                  {produtosFiltrados
                    .slice(10)
                    .map((produto) => (
                      <ProdutoCard
                        key={`all-${produto.produto_id}`}
                        produto={produto}
                        onEncomendar={() =>
                          encomendar(produto)
                        }
                      />
                    ))}
                </div>
              </section>
            )}

          {/* =================================================
              INFORMAÇÕES
          ================================================= */}

          {!isSearching && (
            <section className="mt-12 grid gap-3 md:grid-cols-3">
              <InfoCard
                icon={<Store size={23} />}
                titulo="Rede Fabiano"
                descricao="Compre diretamente no estoque da drogaria."
              />

              <InfoCard
                icon={<Truck size={23} />}
                titulo="Entrega ou retirada"
                descricao="Escolha a melhor opção no fechamento do pedido."
              />

              <InfoCard
                icon={<ShoppingBag size={23} />}
                titulo="Compra rápida"
                descricao="Adicione ao carrinho e finalize pelo celular."
              />
            </section>
          )}
        </section>
      </div>

      {/* =====================================================
          BARRA MOBILE DO CARRINHO
      ===================================================== */}

      {qtdCarrinho > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-2 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:hidden">
          <button
            type="button"
            onClick={abrirCarrinho}
            className="mx-auto flex w-full max-w-lg items-center gap-3 rounded-2xl bg-blue-800 px-4 py-3 text-white"
          >
            <div className="relative">
              <ShoppingBag size={23} />

              <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[9px] font-black">
                {qtdCarrinho}
              </span>
            </div>

            <div className="min-w-0 flex-1 text-left">
              <div className="text-[10px] font-bold text-blue-200">
                VER CARRINHO
              </div>

              <div className="font-black">
                {brl(totalCarrinho)}
              </div>
            </div>

            <ChevronRight />
          </button>
        </div>
      )}

      {/* =====================================================
          CARRINHO / CHECKOUT
      ===================================================== */}

      <CartModal
        open={cartOpen}
        onClose={fecharCarrinho}
        estoqueByEan={estoqueByEan}
      />
    </main>
  );
}

/* =========================================================
   CARD DE PRODUTO
========================================================= */

function ProdutoCard({
  produto,
  onEncomendar,
}: {
  produto: Produto;
  onEncomendar: () => void;
}) {
  const cart = useCart();
  const { push } = useToast();

  const preco =
    precoProduto(produto);

  const estoque =
    Number(produto.estoque || 0);

  const itemCarrinho =
    cart.items.find(
      (item) =>
        item.ean === produto.ean
    );

  const qtdCarrinho =
    Number(
      itemCarrinho?.qtd || 0
    );

  const indisponivel =
    estoque <= 0 ||
    preco.final <= 0;

  function adicionar() {
    if (indisponivel) {
      return;
    }

    if (
      qtdCarrinho >= estoque
    ) {
      push({
        title:
          "Limite do estoque",
        desc:
          "Você já adicionou toda a quantidade disponível.",
      });

      return;
    }

    cart.addItem(
      {
        ean:
          produto.ean,

        nome:
          produto.nome,

        laboratorio:
          produto.laboratorio,

        apresentacao:
          produto.apresentacao,

        imagem:
          firstImg(
            produto.imagens
          ),

        preco:
          preco.final,
      },
      1
    );

    push({
      title:
        "Adicionado ao carrinho ✅",
      desc:
        produto.nome,
    });
  }

  function diminuir() {
    if (!itemCarrinho) {
      return;
    }

    cart.dec(
      produto.ean
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* IMAGEM */}

      <div className="relative p-3">
        <Link
          href={`${PREFIX}/produtos/${produto.ean}`}
          className="relative block aspect-square overflow-hidden rounded-2xl bg-slate-50"
        >
          <Image
            src={firstImg(
              produto.imagens
            )}
            alt={produto.nome}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 220px"
            className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        </Link>

        {preco.emPromocao &&
          preco.percentual > 0 && (
            <span className="absolute left-5 top-5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black text-white shadow">
              -
              {Math.round(
                preco.percentual
              )}
              %
            </span>
          )}

        {produto.destaque_home && (
          <span className="absolute right-5 top-5 rounded-full bg-green-600 px-2 py-1 text-[9px] font-black text-white shadow">
            DESTAQUE
          </span>
        )}
      </div>

      {/* CONTEÚDO */}

      <div className="flex flex-1 flex-col px-3 pb-3">
        <div className="min-h-[92px]">
          <div className="line-clamp-1 text-[10px] font-bold uppercase text-slate-400">
            {produto.laboratorio ||
              produto.categoria ||
              "Rede Fabiano"}
          </div>

          <Link
            href={`${PREFIX}/produtos/${produto.ean}`}
            className="mt-1 line-clamp-2 text-xs font-black leading-snug text-slate-900 transition hover:text-blue-800 sm:text-sm"
          >
            {produto.nome}
          </Link>

          {produto.apresentacao && (
            <div className="mt-1 line-clamp-1 text-[10px] font-semibold text-slate-500">
              {produto.apresentacao}
            </div>
          )}

          <div className="mt-1 text-[9px] text-slate-400">
            EAN {produto.ean}
          </div>
        </div>

        {/* PREÇO */}

        <div className="mt-2">
          {preco.emPromocao &&
            preco.base >
              preco.final && (
              <div className="text-[10px] font-semibold text-slate-400 line-through">
                {brl(
                  preco.base
                )}
              </div>
            )}

          <div className="text-lg font-black leading-tight text-green-700">
            {brl(
              preco.final
            )}
          </div>

          {preco.emPromocao &&
            preco.economia > 0 && (
              <div className="mt-0.5 text-[9px] font-black text-green-700">
                Economize{" "}
                {brl(
                  preco.economia
                )}
              </div>
            )}
        </div>

        {/* ESTOQUE */}

        <div className="mt-2">
          {estoque > 0 ? (
            <span className="text-[10px] font-bold text-slate-500">
              Disponível:{" "}
              <b>{estoque}</b>
            </span>
          ) : (
            <span className="text-[10px] font-black text-red-600">
              Sem estoque
            </span>
          )}
        </div>

        {/* BOTÃO */}

        <div className="mt-auto pt-3">
          {!itemCarrinho ? (
            <button
              type="button"
              onClick={adicionar}
              disabled={indisponivel}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black transition sm:text-sm ${
                indisponivel
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-blue-800 text-white hover:bg-blue-900"
              }`}
            >
              <Plus size={17} />

              {indisponivel
                ? "Indisponível"
                : "Adicionar"}
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-xl border-2 border-blue-100 bg-blue-50 p-1">
              <button
                type="button"
                onClick={diminuir}
                className="grid h-9 w-9 place-items-center rounded-lg bg-white text-blue-800 shadow-sm"
              >
                <Minus size={16} />
              </button>

              <div className="text-center">
                <div className="text-sm font-black text-blue-900">
                  {qtdCarrinho}
                </div>

                <div className="text-[8px] font-bold uppercase text-blue-500">
                  no carrinho
                </div>
              </div>

              <button
                type="button"
                onClick={adicionar}
                disabled={
                  qtdCarrinho >=
                  estoque
                }
                className="grid h-9 w-9 place-items-center rounded-lg bg-blue-800 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          {indisponivel && (
            <button
              type="button"
              onClick={onEncomendar}
              className="mt-2 w-full rounded-xl bg-green-600 py-2.5 text-xs font-black text-white hover:bg-green-700"
            >
              Encomendar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   CARRINHO / CHECKOUT
========================================================= */

function CartModal({
  open,
  onClose,
  estoqueByEan,
}: {
  open: boolean;
  onClose: () => void;
  estoqueByEan: Map<
    string,
    number
  >;
}) {
  const cart = useCart();

  const { push } =
    useToast();

  const [clienteNome, setClienteNome] =
    useState("");

  const [
    clienteTelefone,
    setClienteTelefone,
  ] = useState("");

  const [
    tipoEntrega,
    setTipoEntrega,
  ] = useState<
    "ENTREGA" | "RETIRADA"
  >("ENTREGA");

  const [
    endereco,
    setEndereco,
  ] = useState("");

  const [
    numero,
    setNumero,
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
    pagamento,
    setPagamento,
  ] = useState<
    | "PIX"
    | "CARTAO"
    | "DINHEIRO"
    | "COMBINAR"
  >("PIX");

  const [
    trocoPara,
    setTrocoPara,
  ] = useState("");

  const [
    observacoes,
    setObservacoes,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    pedidoId,
    setPedidoId,
  ] = useState<
    string | null
  >(null);

  const taxaEntrega =
    tipoEntrega ===
    "ENTREGA"
      ? 10
      : 0;

  const total =
    Number(
      cart.subtotal || 0
    ) + taxaEntrega;

  /* =======================================================
     VALIDAÇÃO
  ======================================================= */

  const canCheckout =
    useMemo(() => {
      if (
        cart.items.length ===
        0
      ) {
        return false;
      }

      if (
        !clienteNome.trim()
      ) {
        return false;
      }

      if (
        onlyDigits(
          clienteTelefone
        ).length < 10
      ) {
        return false;
      }

      if (
        tipoEntrega ===
        "ENTREGA"
      ) {
        if (
          !endereco.trim() ||
          !numero.trim() ||
          !bairro.trim()
        ) {
          return false;
        }
      }

      return true;
    }, [
      cart.items.length,
      clienteNome,
      clienteTelefone,
      tipoEntrega,
      endereco,
      numero,
      bairro,
    ]);

  /* =======================================================
     QUANTIDADE SEGURA
  ======================================================= */

  function incrementar(
    ean: string
  ) {
    const estoque =
      Number(
        estoqueByEan.get(
          ean
        ) ?? 0
      );

    const item =
      cart.items.find(
        (x) =>
          x.ean === ean
      );

    if (!item) {
      return;
    }

    if (
      estoque > 0 &&
      item.qtd >= estoque
    ) {
      push({
        title:
          "Limite do estoque",
        desc:
          `Disponível: ${estoque} unidade(s).`,
      });

      return;
    }

    cart.inc(ean);
  }

  function alterarQtd(
    ean: string,
    quantidade: number
  ) {
    const estoque =
      Number(
        estoqueByEan.get(
          ean
        ) ?? 0
      );

    const alvo =
      Math.max(
        1,
        Math.floor(
          Number(
            quantidade || 1
          )
        )
      );

    const final =
      estoque > 0
        ? Math.min(
            alvo,
            estoque
          )
        : alvo;

    const item =
      cart.items.find(
        (x) =>
          x.ean === ean
      );

    if (!item) {
      return;
    }

    if (
      final > item.qtd
    ) {
      for (
        let i = 0;
        i <
        final - item.qtd;
        i++
      ) {
        cart.inc(ean);
      }
    }

    if (
      final < item.qtd
    ) {
      for (
        let i = 0;
        i <
        item.qtd - final;
        i++
      ) {
        cart.dec(ean);
      }
    }
  }

  function limparCarrinho() {
    const carrinho =
      cart as any;

    if (
      typeof carrinho.clear ===
      "function"
    ) {
      carrinho.clear();
      return;
    }

    for (
      const item of
      cart.items
    ) {
      cart.remove(
        item.ean
      );
    }
  }

  /* =======================================================
     FINALIZAR
  ======================================================= */

  async function finalizarPedido() {
    if (
      !canCheckout ||
      submitting
    ) {
      return;
    }

    try {
      setSubmitting(true);

      /* -----------------------------------------------
         CONFERE ESTOQUE ANTES DE GRAVAR
      ----------------------------------------------- */

      for (
        const item of
        cart.items
      ) {
        const estoque =
          Number(
            estoqueByEan.get(
              item.ean
            ) ?? 0
          );

        if (
          estoque > 0 &&
          item.qtd >
            estoque
        ) {
          throw new Error(
            `${item.nome}: estoque disponível ${estoque}.`
          );
        }
      }

      /* -----------------------------------------------
         ITENS
      ----------------------------------------------- */

      const itens =
        cart.items.map(
          (item) => ({
            ean:
              item.ean,

            nome:
              item.nome,

            qtd:
              item.qtd,

            preco_unit:
              Number(
                item.preco ||
                  0
              ),

            total_item:
              Number(
                (
                  Number(
                    item.preco ||
                      0
                  ) *
                  Number(
                    item.qtd ||
                      0
                  )
                ).toFixed(2)
              ),

            imagem:
              item.imagem ||
              null,
          })
        );

      /* -----------------------------------------------
         PAYLOAD EXISTENTE DA REDE FABIANO
      ----------------------------------------------- */

      const payload = {
        status: "NOVO",

        canal: "FV",

        comanda: null,

        cliente_nome:
          clienteNome.trim(),

        cliente_whatsapp:
          onlyDigits(
            clienteTelefone
          ),

        tipo_entrega:
          tipoEntrega,

        endereco:
          tipoEntrega ===
          "ENTREGA"
            ? endereco.trim()
            : null,

        numero:
          tipoEntrega ===
          "ENTREGA"
            ? numero.trim()
            : null,

        bairro:
          tipoEntrega ===
          "ENTREGA"
            ? bairro.trim()
            : null,

        pagamento,

        taxa_entrega:
          Number(
            taxaEntrega.toFixed(
              2
            )
          ),

        subtotal:
          Number(
            Number(
              cart.subtotal || 0
            ).toFixed(2)
          ),

        total:
          Number(
            total.toFixed(2)
          ),

        itens,
      };

      const {
        data,
        error,
      } = await supabase
        .from(
          "drf_pedidos"
        )
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      setPedidoId(
        data?.id || null
      );

      setSuccess(true);

      limparCarrinho();

      push({
        title:
          "Pedido enviado ✅",
        desc:
          "Seu pedido foi registrado na Drogaria Rede Fabiano.",
      });
    } catch (error: any) {
      console.error(
        "Erro finalizar pedido Rede Fabiano:",
        error
      );

      push({
        title:
          "Não foi possível enviar",
        desc:
          error?.message
            ? String(
                error.message
              )
            : "Tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     RESET
  ======================================================= */

  function fecharTudo() {
    setSuccess(false);
    setPedidoId(null);
    setSubmitting(false);

    onClose();
  }

  useEffect(() => {
    if (!open) {
      setSuccess(false);
      setPedidoId(null);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={
          success
            ? fecharTudo
            : onClose
        }
      />

      <div className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:w-[540px]">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b bg-slate-950 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-600">
              {success ? (
                <PackageCheck size={23} />
              ) : (
                <ShoppingBag size={22} />
              )}
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Drogaria Rede Fabiano
              </div>

              <h2 className="text-lg font-black">
                {success
                  ? "Pedido enviado"
                  : "Seu carrinho"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={
              success
                ? fecharTudo
                : onClose
            }
            className="rounded-xl bg-white/10 p-2 transition hover:bg-white/20"
          >
            <X size={21} />
          </button>
        </div>

        {/* =================================================
            SUCESSO
        ================================================= */}

        {success ? (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="rounded-3xl border border-green-200 bg-green-50 p-5">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-green-600 text-white">
                <PackageCheck size={28} />
              </div>

              <h3 className="mt-4 text-xl font-black text-green-900">
                Pedido recebido!
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-green-800">
                Seu pedido foi registrado com sucesso na Drogaria Rede Fabiano.
              </p>

              {pedidoId && (
                <div className="mt-4 rounded-2xl bg-white p-3 ring-1 ring-green-200">
                  <div className="text-[10px] font-black uppercase text-green-700">
                    Código do pedido
                  </div>

                  <div className="mt-1 break-all text-sm font-black text-slate-900">
                    {pedidoId}
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!pedidoId}
                  onClick={() => {
                    if (
                      pedidoId
                    ) {
                      navigator.clipboard?.writeText(
                        pedidoId
                      );

                      push({
                        title:
                          "Copiado ✅",
                        desc:
                          "Código do pedido copiado.",
                      });
                    }
                  }}
                  className="rounded-xl border bg-white py-3 text-sm font-black disabled:opacity-40"
                >
                  Copiar código
                </button>

                <button
                  type="button"
                  onClick={fecharTudo}
                  className="rounded-xl bg-blue-800 py-3 text-sm font-black text-white"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* =============================================
                CONTEÚDO ROLÁVEL
            ============================================= */}

            <div className="flex-1 overflow-y-auto">
              {/* ITENS */}

              <section className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="font-black">
                      Produtos
                    </div>

                    <div className="text-xs font-semibold text-slate-500">
                      {cart.countItems} item(ns)
                    </div>
                  </div>

                  {cart.items.length >
                    0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Limpar o carrinho?"
                          )
                        ) {
                          limparCarrinho();
                        }
                      }}
                      className="text-xs font-black text-red-600"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {cart.items.length ===
                0 ? (
                  <div className="rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center">
                    <ShoppingBag
                      size={36}
                      className="mx-auto text-slate-300"
                    />

                    <div className="mt-3 font-black">
                      Carrinho vazio
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      Adicione produtos para continuar.
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-4 rounded-xl bg-blue-800 px-4 py-3 text-sm font-black text-white"
                    >
                      Ver produtos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.items.map(
                      (item) => {
                        const estoque =
                          Number(
                            estoqueByEan.get(
                              item.ean
                            ) ?? 0
                          );

                        return (
                          <div
                            key={
                              item.ean
                            }
                            className="rounded-2xl border bg-white p-3"
                          >
                            <div className="flex gap-3">
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                                <Image
                                  src={
                                    item.imagem ||
                                    "/produtos/caixa-padrao.png"
                                  }
                                  alt={
                                    item.nome
                                  }
                                  fill
                                  sizes="64px"
                                  className="object-contain p-1"
                                  unoptimized
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="line-clamp-2 text-sm font-black leading-tight">
                                  {
                                    item.nome
                                  }
                                </div>

                                <div className="mt-1 text-[10px] font-semibold text-slate-400">
                                  EAN{" "}
                                  {
                                    item.ean
                                  }
                                </div>

                                <div className="mt-1 font-black text-green-700">
                                  {brl(
                                    item.preco
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={
                                  submitting
                                }
                                onClick={() =>
                                  cart.remove(
                                    item.ean
                                  )
                                }
                                className="self-start rounded-lg px-2 py-1 text-xs font-black text-red-600"
                              >
                                Excluir
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-2">
                              <div className="flex items-center overflow-hidden rounded-xl border">
                                <button
                                  type="button"
                                  disabled={
                                    submitting
                                  }
                                  onClick={() =>
                                    cart.dec(
                                      item.ean
                                    )
                                  }
                                  className="grid h-10 w-10 place-items-center bg-slate-50"
                                >
                                  <Minus
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                <input
                                  type="number"
                                  min={1}
                                  max={
                                    Math.max(
                                      1,
                                      estoque
                                    )
                                  }
                                  value={
                                    item.qtd
                                  }
                                  disabled={
                                    submitting
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    alterarQtd(
                                      item.ean,
                                      Number(
                                        e
                                          .target
                                          .value
                                      )
                                    )
                                  }
                                  className="h-10 w-12 border-x text-center text-sm font-black outline-none"
                                />

                                <button
                                  type="button"
                                  disabled={
                                    submitting ||
                                    (estoque >
                                      0 &&
                                      item.qtd >=
                                        estoque)
                                  }
                                  onClick={() =>
                                    incrementar(
                                      item.ean
                                    )
                                  }
                                  className="grid h-10 w-10 place-items-center bg-blue-800 text-white disabled:bg-slate-200 disabled:text-slate-400"
                                >
                                  <Plus
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </div>

                              <div className="text-right">
                                <div className="text-[9px] font-black uppercase text-slate-400">
                                  Total
                                </div>

                                <div className="font-black">
                                  {brl(
                                    Number(
                                      item.preco ||
                                        0
                                    ) *
                                      Number(
                                        item.qtd ||
                                          0
                                      )
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 text-[10px] font-semibold text-slate-500">
                              Disponível:{" "}
                              <b>
                                {
                                  estoque
                                }
                              </b>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </section>

              {/* =============================================
                  CLIENTE
              ============================================= */}

              {cart.items.length >
                0 && (
                <>
                  <section className="border-t bg-slate-50 p-4">
                    <div className="mb-3">
                      <div className="font-black">
                        Seus dados
                      </div>

                      <div className="text-xs text-slate-500">
                        Para identificação do pedido
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        value={
                          clienteNome
                        }
                        onChange={(e) =>
                          setClienteNome(
                            e.target
                              .value
                          )
                        }
                        disabled={
                          submitting
                        }
                        placeholder="Nome do cliente"
                        className="checkout-input"
                      />

                      <input
                        value={
                          clienteTelefone
                        }
                        onChange={(e) =>
                          setClienteTelefone(
                            onlyDigits(
                              e.target
                                .value
                            )
                          )
                        }
                        disabled={
                          submitting
                        }
                        inputMode="tel"
                        placeholder="WhatsApp com DDD"
                        className="checkout-input"
                      />
                    </div>
                  </section>

                  {/* =========================================
                      ENTREGA
                  ========================================= */}

                  <section className="border-t p-4">
                    <div className="mb-3">
                      <div className="font-black">
                        Como deseja receber?
                      </div>

                      <div className="text-xs text-slate-500">
                        Escolha entrega ou retirada
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={
                          submitting
                        }
                        onClick={() =>
                          setTipoEntrega(
                            "ENTREGA"
                          )
                        }
                        className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-black ${
                          tipoEntrega ===
                          "ENTREGA"
                            ? "border-blue-800 bg-blue-800 text-white"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        <Truck
                          size={18}
                        />
                        Entrega
                      </button>

                      <button
                        type="button"
                        disabled={
                          submitting
                        }
                        onClick={() =>
                          setTipoEntrega(
                            "RETIRADA"
                          )
                        }
                        className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-black ${
                          tipoEntrega ===
                          "RETIRADA"
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        <Store
                          size={18}
                        />
                        Retirada
                      </button>
                    </div>

                    {tipoEntrega ===
                      "ENTREGA" && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
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
                          disabled={
                            submitting
                          }
                          placeholder="Endereço"
                          className="checkout-input col-span-2"
                        />

                        <input
                          value={
                            numero
                          }
                          onChange={(
                            e
                          ) =>
                            setNumero(
                              e.target
                                .value
                            )
                          }
                          disabled={
                            submitting
                          }
                          placeholder="Número"
                          className="checkout-input"
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
                          disabled={
                            submitting
                          }
                          placeholder="Bairro"
                          className="checkout-input col-span-3"
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
                          disabled={
                            submitting
                          }
                          placeholder="Complemento"
                          className="checkout-input col-span-3"
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
                          disabled={
                            submitting
                          }
                          placeholder="Ponto de referência"
                          className="checkout-input col-span-3"
                        />

                        <div className="col-span-3 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-800">
                          Taxa de entrega:{" "}
                          {brl(
                            taxaEntrega
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* =========================================
                      PAGAMENTO
                  ========================================= */}

                  <section className="border-t bg-slate-50 p-4">
                    <div className="mb-3">
                      <div className="font-black">
                        Pagamento
                      </div>

                      <div className="text-xs text-slate-500">
                        Escolha como deseja pagar
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          [
                            "PIX",
                            "Pix",
                          ],
                          [
                            "CARTAO",
                            "Cartão",
                          ],
                          [
                            "DINHEIRO",
                            "Dinheiro",
                          ],
                          [
                            "COMBINAR",
                            "Combinar",
                          ],
                        ] as const
                      ).map(
                        ([
                          valor,
                          label,
                        ]) => (
                          <button
                            type="button"
                            key={
                              valor
                            }
                            disabled={
                              submitting
                            }
                            onClick={() =>
                              setPagamento(
                                valor
                              )
                            }
                            className={`rounded-xl border-2 py-3 text-sm font-black ${
                              pagamento ===
                              valor
                                ? "border-blue-800 bg-blue-800 text-white"
                                : "border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            {
                              label
                            }
                          </button>
                        )
                      )}
                    </div>

                    {pagamento ===
                      "DINHEIRO" && (
                      <div className="mt-3">
                        <input
                          value={
                            trocoPara
                          }
                          onChange={(
                            e
                          ) =>
                            setTrocoPara(
                              e.target
                                .value
                            )
                          }
                          disabled={
                            submitting
                          }
                          inputMode="decimal"
                          placeholder="Troco para quanto? Ex.: 100,00"
                          className="checkout-input"
                        />
                      </div>
                    )}

                    <textarea
                      value={
                        observacoes
                      }
                      onChange={(e) =>
                        setObservacoes(
                          e.target
                            .value
                        )
                      }
                      disabled={
                        submitting
                      }
                      rows={2}
                      placeholder="Observações do pedido (opcional)"
                      className="checkout-input mt-3 resize-none"
                    />
                  </section>
                </>
              )}
            </div>

            {/* =============================================
                RODAPÉ CHECKOUT
            ============================================= */}

            {cart.items.length >
              0 && (
              <div className="border-t bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">
                      Subtotal
                    </span>

                    <span className="font-black">
                      {brl(
                        cart.subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">
                      Taxa de entrega
                    </span>

                    <span className="font-black">
                      {brl(
                        taxaEntrega
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-end justify-between border-t pt-3">
                    <span className="font-black">
                      Total
                    </span>

                    <span className="text-2xl font-black text-green-700">
                      {brl(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    !canCheckout ||
                    submitting
                  }
                  onClick={() =>
                    void finalizarPedido()
                  }
                  className={`mt-4 w-full rounded-2xl py-4 text-base font-black transition ${
                    canCheckout &&
                    !submitting
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "cursor-not-allowed bg-slate-200 text-slate-500"
                  }`}
                >
                  {submitting
                    ? "ENVIANDO PEDIDO..."
                    : `FINALIZAR • ${brl(
                        total
                      )}`}
                </button>

                {!canCheckout && (
                  <div className="mt-2 text-center text-[10px] font-semibold text-slate-500">
                    Informe nome e WhatsApp
                    {tipoEntrega ===
                    "ENTREGA"
                      ? " e preencha o endereço de entrega."
                      : "."}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        .checkout-input {
          width: 100%;
          border: 2px solid rgb(226 232 240);
          border-radius: 0.75rem;
          background: white;
          padding: 0.75rem;
          outline: none;
          font-weight: 600;
          color: rgb(15 23 42);
        }

        .checkout-input:focus {
          border-color: rgb(37 99 235);
        }

        .checkout-input:disabled {
          background: rgb(248 250 252);
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon,
  titulo,
  descricao,
}: {
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-800">
        {icon}
      </div>

      <div className="mt-3 font-black">
        {titulo}
      </div>

      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        {descricao}
      </p>
    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function GridSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-5">
      {Array.from({
        length: 10,
      }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border bg-white shadow-sm"
        >
          <div className="p-3">
            <div className="aspect-square animate-pulse rounded-2xl bg-slate-100" />
          </div>

          <div className="px-3 pb-3">
            <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" />

            <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-100" />

            <div className="mt-1 h-4 w-2/3 animate-pulse rounded bg-slate-100" />

            <div className="mt-4 h-5 w-20 animate-pulse rounded bg-slate-100" />

            <div className="mt-4 h-10 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}