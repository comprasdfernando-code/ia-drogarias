"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Camera,
  Minus,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const LOJA_SLUG = "drogariaredefabiano";
const SENHA_ADMIN = "102030";

/* =========================================================
   TIPOS
========================================================= */

type Produto = {
  id: string;
  ean: string;
  nome: string;

  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;

  imagem: string;

  estoque: number;

  preco_venda: number;
  preco_consulta: number;

  pode_vender: boolean;
};

type TipoDesconto =
  | "PERCENTUAL"
  | "VALOR";

type Item = Produto & {
  qtd: number;

  descontoTipo: TipoDesconto;
  desconto: number;
};

type Forma =
  | "Dinheiro"
  | "Pix"
  | "Débito"
  | "Crédito";

type Pagamento = {
  forma: Forma;
  valor: string;
};

type TipoAtendimento =
  | "BALCAO"
  | "ENTREGA";

type CaixaSessao = {
  id: string;

  loja_slug: string;

  operador: string | null;
  turno: string | null;

  status: string;

  valor_abertura: number | null;
  valor_fechamento: number | null;

  aberto_em: string;
  fechado_em: string | null;

  observacoes: string | null;
};

type FVProduto = {
  id: string;

  ean: string;
  nome: string;

  categoria: string | null;
  laboratorio: string | null;
  apresentacao: string | null;

  pmc: number | null;

  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;

  imagens: any;

  ativo: boolean | null;
};

type LojaProduto = {
  produto_id: string;

  farmacia_slug: string;

  estoque: number | null;
  preco_venda: number | null;

  ativo: boolean | null;
  ativo_pdv?: boolean | null;
};

type VendaSalva = {
  id: string;

  loja_slug?: string;

  origem?: string;
  status?: string;

  tipo_lancamento?: string | null;

  comanda?: string | null;

  cliente?: any;

  pagamento?: any;

  itens?: any;

  total?: number;

  created_at?: string;
  finalizada_em?: string | null;
};

/* =========================================================
   HELPERS
========================================================= */

function onlyDigits(
  value: string
) {
  return String(
    value || ""
  ).replace(
    /\D/g,
    ""
  );
}

function brl(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

/*
  Aceita:
  10
  10.50
  10,50
  1.250,90
*/

function numero(
  value:
    | string
    | number
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value
    )
      ? value
      : 0;
  }

  const original =
    String(value).trim();

  if (!original) {
    return 0;
  }

  let normalizado =
    original.replace(
      /[^\d,.-]/g,
      ""
    );

  /*
    Tem ponto e vírgula:
    1.250,90
  */

  if (
    normalizado.includes(
      ","
    ) &&
    normalizado.includes(
      "."
    )
  ) {
    normalizado =
      normalizado
        .replace(
          /\./g,
          ""
        )
        .replace(
          ",",
          "."
        );
  } else if (
    normalizado.includes(
      ","
    )
  ) {
    normalizado =
      normalizado.replace(
        ",",
        "."
      );
  }

  const n =
    Number(normalizado);

  return Number.isFinite(n)
    ? n
    : 0;
}

/*
  JSONB pode chegar como:
  array
  string JSON
  objeto
*/

function asArray<T = any>(
  value: any
): T[] {
  if (
    Array.isArray(value)
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    try {
      const parsed =
        JSON.parse(value);

      return Array.isArray(
        parsed
      )
        ? parsed
        : [];
    } catch {
      return value.trim()
        ? ([value] as T[])
        : [];
    }
  }

  if (
    value &&
    typeof value ===
    "object"
  ) {
    return Object.values(
      value
    ) as T[];
  }

  return [];
}

function primeiraImagem(
  imagens: any
) {
  const lista =
    asArray<any>(imagens);

  const primeira =
    lista.find(
      (x) =>
        typeof x ===
          "string" &&
        x.trim()
    );

  return primeira
    ? String(
        primeira
      ).trim()
    : "/produtos/caixa-padrao.png";
}

/* =========================================================
   PREÇO GLOBAL / CONSULTA
========================================================= */

function precoGlobalFinal(
  produto: FVProduto
) {
  const pmc =
    Number(
      produto.pmc || 0
    );

  const promocional =
    Number(
      produto
        .preco_promocional ||
        0
    );

  const promocaoValida =
    !!produto.em_promocao &&
    promocional > 0 &&
    (
      pmc <= 0 ||
      promocional < pmc
    );

  return promocaoValida
    ? promocional
    : pmc;
}

/* =========================================================
   PREÇO / DESCONTO DO ITEM
========================================================= */

function precoLiquidoItem(
  item: Item
) {
  const preco =
    Number(
      item.preco_venda ||
        0
    );

  if (
    item.descontoTipo ===
    "PERCENTUAL"
  ) {
    const percentual =
      Math.min(
        100,
        Math.max(
          0,
          Number(
            item.desconto ||
              0
          )
        )
      );

    return Math.max(
      0,
      preco -
        preco *
          (percentual /
            100)
    );
  }

  const desconto =
    Math.min(
      preco,
      Math.max(
        0,
        Number(
          item.desconto ||
            0
        )
      )
    );

  return Math.max(
    0,
    preco - desconto
  );
}

function descontoUnitarioItem(
  item: Item
) {
  return Math.max(
    0,
    Number(
      item.preco_venda ||
        0
    ) -
      precoLiquidoItem(
        item
      )
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function PDVPageFabiano() {

  /* =======================================================
     BUSCA / PRODUTOS
  ======================================================= */

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    resultados,
    setResultados,
  ] = useState<
    Produto[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  /* =======================================================
     CARRINHO
  ======================================================= */

  const [
    itens,
    setItens,
  ] = useState<Item[]>(
    []
  );

  /* =======================================================
     ATENDIMENTO
  ======================================================= */

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

  /* =======================================================
     PAGAMENTOS
  ======================================================= */

  const [
    pagamentos,
    setPagamentos,
  ] = useState<
    Pagamento[]
  >([
    {
      forma:
        "Dinheiro",
      valor: "",
    },
  ]);

  /* =======================================================
     COMANDA
  ======================================================= */

  const [
    modalComanda,
    setModalComanda,
  ] = useState(false);

  const [
    numeroComanda,
    setNumeroComanda,
  ] = useState("");

  const [
    salvandoComanda,
    setSalvandoComanda,
  ] = useState(false);

  /* =======================================================
     FINALIZAÇÃO
  ======================================================= */

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    caixaAbertoInfo,
    setCaixaAbertoInfo,
  ] =
    useState<CaixaSessao | null>(
      null
    );

  /* =======================================================
     COMPROVANTE
  ======================================================= */

  const [
    ultimoComprovante,
    setUltimoComprovante,
  ] =
    useState<VendaSalva | null>(
      null
    );

  /* =======================================================
     CONSULTA DE VENDAS
  ======================================================= */

  const [
    senha,
    setSenha,
  ] = useState("");

  const [
    mostrarVendas,
    setMostrarVendas,
  ] = useState(false);

  const [
    vendas,
    setVendas,
  ] = useState<any[]>(
    []
  );

  const [
    vendaSelecionada,
    setVendaSelecionada,
  ] = useState<
    any | null
  >(null);

  const [
    filtroData,
    setFiltroData,
  ] = useState("");

  /* =======================================================
     CÂMERA
  ======================================================= */

  const [
    cameraAberta,
    setCameraAberta,
  ] = useState(false);

  const [
    cameraErro,
    setCameraErro,
  ] = useState("");

  const [
    cameraLendo,
    setCameraLendo,
  ] = useState(false);

  /* =======================================================
     REFS
  ======================================================= */

  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  const videoRef =
    useRef<HTMLVideoElement>(
      null
    );

  const scannerControlsRef =
    useRef<any>(null);

  const codigoLidoRef =
    useRef(false);

  const pagamentoRef =
    useRef<HTMLDivElement>(
      null
    );

  /* =======================================================
     CÁLCULOS
  ======================================================= */

  const subtotalBruto =
    useMemo(
      () =>
        itens.reduce(
          (
            soma,
            item
          ) =>
            soma +
            Number(
              item.preco_venda ||
                0
            ) *
              Number(
                item.qtd ||
                  0
              ),
          0
        ),
      [itens]
    );

  const descontoTotal =
    useMemo(
      () =>
        itens.reduce(
          (
            soma,
            item
          ) =>
            soma +
            descontoUnitarioItem(
              item
            ) *
              item.qtd,
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
    tipoAtendimento ===
    "ENTREGA"
      ? Math.max(
          0,
          numero(
            taxaEntrega
          )
        )
      : 0;

  const total =
    subtotal + taxa;

  const quantidadeItens =
    useMemo(
      () =>
        itens.reduce(
          (
            soma,
            item
          ) =>
            soma +
            Number(
              item.qtd ||
                0
            ),
          0
        ),
      [itens]
    );

  const totalPagamentos =
    useMemo(
      () =>
        pagamentos.reduce(
          (
            soma,
            pagamento
          ) =>
            soma +
            numero(
              pagamento.valor
            ),
          0
        ),
      [pagamentos]
    );

  /*
    Para dinheiro podemos receber
    valor maior que o total.
    O excedente é troco.
  */

  const pagamentoDinheiro =
    useMemo(
      () =>
        pagamentos
          .filter(
            (p) =>
              p.forma ===
              "Dinheiro"
          )
          .reduce(
            (
              soma,
              p
            ) =>
              soma +
              numero(
                p.valor
              ),
            0
          ),
      [pagamentos]
    );

  const pagamentosNaoDinheiro =
    useMemo(
      () =>
        pagamentos
          .filter(
            (p) =>
              p.forma !==
              "Dinheiro"
          )
          .reduce(
            (
              soma,
              p
            ) =>
              soma +
              numero(
                p.valor
              ),
            0
          ),
      [pagamentos]
    );

  const necessarioEmDinheiro =
    Math.max(
      0,
      total -
        pagamentosNaoDinheiro
    );

  const troco =
    Math.max(
      0,
      pagamentoDinheiro -
        necessarioEmDinheiro
    );

  const totalEfetivamentePago =
    Math.max(
      0,
      totalPagamentos -
        troco
    );

  const faltante =
    Math.max(
      0,
      total -
        totalEfetivamentePago
    );

  /* =======================================================
     INICIALIZAÇÃO
  ======================================================= */

  useEffect(() => {
    inputRef.current?.focus();

    atualizarCaixaAbertoInfo();
  }, []);

  useEffect(() => {
    return () => {
      pararCamera();
    };
  }, []);

  /* =======================================================
     CAIXA
  ======================================================= */

  async function obterCaixaAberto() {

    const {
      data,
      error,
    } = await supabase
      .from(
        "caixa_sessoes"
      )
      .select("*")
      .eq(
        "loja_slug",
        LOJA_SLUG
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

    if (error) {
      throw error;
    }

    return (
      data as
        | CaixaSessao
        | null
    );
  }

  async function atualizarCaixaAbertoInfo() {

    try {

      const caixa =
        await obterCaixaAberto();

      setCaixaAbertoInfo(
        caixa
      );

    } catch (
      error
    ) {

      console.error(
        "Erro ao consultar caixa:",
        error
      );

      setCaixaAbertoInfo(
        null
      );

    }
  }

  /* =======================================================
     CÂMERA
     MESMO MÉTODO DO PDV PORTO:
     @zxing/browser
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
          (
            track
          ) =>
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

    setCameraErro("");
  }

  function abrirCamera() {

    setCameraErro("");

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

      /*
        Pequeno atraso para o
        <video> do modal existir.
      */

      await new Promise(
        (
          resolve
        ) =>
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

        if (
          !navigator
            .mediaDevices ||
          !navigator
            .mediaDevices
            .getUserMedia
        ) {
          throw new Error(
            "Câmera não disponível neste navegador."
          );
        }

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

            (
              result
            ) => {

              if (
                !result ||
                codigoLidoRef
                  .current
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

              if (
                "vibrate" in
                navigator
              ) {
                navigator
                  .vibrate?.(
                    120
                  );
              }

              setBusca(
                codigo
              );

              setTimeout(
                () => {

                  fecharCamera();

                  void pesquisar(
                    codigo
                  );

                },
                100
              );
            }
          );

        scannerControlsRef.current =
          controls;

      } catch (
        erro: any
      ) {

        console.error(
          "Erro câmera:",
          erro
        );

        setCameraLendo(
          false
        );

        if (
          erro?.name ===
          "NotAllowedError"
        ) {

          setCameraErro(
            "A câmera foi bloqueada. Libere a permissão da câmera para este site no navegador."
          );

        } else if (
          erro?.name ===
          "NotFoundError"
        ) {

          setCameraErro(
            "Nenhuma câmera foi encontrada neste aparelho."
          );

        } else {

          setCameraErro(
            erro?.message ||
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

  }, [cameraAberta]);

  /* =======================================================
     BUSCA GLOBAL + ESTOQUE REDE FABIANO
  ======================================================= */

  async function pesquisar(
    termoForcado?: string
  ) {

    const termo =
      (
        termoForcado ??
        busca
      ).trim();

    if (!termo) {

      setResultados(
        []
      );

      inputRef.current?.focus();

      return;
    }

    setLoading(
      true
    );

    try {

      const digits =
        onlyDigits(
          termo
        );

      const termoSemEspaco =
        termo.replace(
          /\s/g,
          ""
        );

      /*
        Primeiro consulta catálogo
        global da Farmácia Virtual.
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
            categoria,
            laboratorio,
            apresentacao,
            pmc,
            em_promocao,
            preco_promocional,
            percentual_off,
            imagens,
            ativo
          `)
          .eq(
            "ativo",
            true
          )
          .limit(100);

      /*
        EAN puro
      */

      if (
        digits.length >= 8 &&
        digits.length <= 14 &&
        digits ===
          termoSemEspaco
      ) {

        produtoQuery =
          produtoQuery.eq(
            "ean",
            digits
          );

      } else if (
        digits.length >= 8 &&
        digits.length <= 14
      ) {

        /*
          Permite scanner +
          eventual pesquisa.
        */

        produtoQuery =
          produtoQuery.or(
            `ean.eq.${digits},nome.ilike.%${termo}%`
          );

      } else {

        produtoQuery =
          produtoQuery.ilike(
            "nome",
            `%${termo}%`
          );

      }

      const {
        data:
          catalogo,
        error:
          catalogoError,
      } =
        await produtoQuery;

      if (
        catalogoError
      ) {
        throw catalogoError;
      }

      const produtosEncontrados =
        (
          catalogo ||
          []
        ) as FVProduto[];

      if (
        !produtosEncontrados
          .length
      ) {

        setResultados(
          []
        );

        return;
      }

      /*
        Agora consulta somente
        estoque/preço da
        Drogaria Rede Fabiano.
      */

      const ids =
        produtosEncontrados.map(
          (
            produto
          ) =>
            String(
              produto.id
            )
        );

      const {
        data:
          produtosLoja,
        error:
          lojaError,
      } =
        await supabase
          .from(
            "fv_farmacia_produtos"
          )
          .select(`
            produto_id,
            farmacia_slug,
            estoque,
            preco_venda,
            ativo,
            ativo_pdv
          `)
          .eq(
            "farmacia_slug",
            LOJA_SLUG
          )
          .in(
            "produto_id",
            ids
          );

      if (
        lojaError
      ) {
        throw lojaError;
      }

      const lojaMap =
        new Map<
          string,
          LojaProduto
        >();

      (
        produtosLoja ||
        []
      ).forEach(
        (
          registro: any
        ) => {

          lojaMap.set(
            String(
              registro.produto_id
            ),
            {
              produto_id:
                String(
                  registro.produto_id
                ),

              farmacia_slug:
                String(
                  registro.farmacia_slug ||
                    LOJA_SLUG
                ),

              estoque:
                registro.estoque,

              preco_venda:
                registro.preco_venda,

              ativo:
                registro.ativo,

              ativo_pdv:
                registro.ativo_pdv,
            }
          );

        }
      );

      /*
        Monta resultado final.

        Produto pode aparecer
        para consulta mesmo
        sem estoque na Fabiano.

        Só pode vender quando:
        - existe na loja
        - está ativo
        - ativo_pdv não é false
        - estoque > 0
        - preço > 0
      */

      const lista: Produto[] =
        produtosEncontrados.map(
          (
            produto
          ) => {

            const loja =
              lojaMap.get(
                String(
                  produto.id
                )
              );

            const ativoLoja =
              loja
                ? loja.ativo !==
                    false
                : false;

            const ativoPDV =
              loja
                ? loja.ativo_pdv !==
                    false
                : false;

            const estoque =
              ativoLoja &&
              ativoPDV
                ? Number(
                    loja
                      ?.estoque ||
                      0
                  )
                : 0;

            const precoLoja =
              Number(
                loja
                  ?.preco_venda ||
                  0
              );

            const precoGlobal =
              precoGlobalFinal(
                produto
              );

            /*
              Venda usa preço
              cadastrado da loja.

              Se ainda não houver
              preço próprio, usa
              PMC/promocional como
              fallback.
            */

            const precoVenda =
              precoLoja > 0
                ? precoLoja
                : precoGlobal;

            /*
              Consulta mostra
              PMC/promocional
              quando disponível.
            */

            const precoConsulta =
              precoGlobal > 0
                ? precoGlobal
                : precoVenda;

            const podeVender =
              !!loja &&
              ativoLoja &&
              ativoPDV &&
              estoque > 0 &&
              precoVenda > 0;

            return {
              id:
                String(
                  produto.id
                ),

              ean:
                String(
                  produto.ean ||
                    ""
                ),

              nome:
                String(
                  produto.nome ||
                    ""
                ),

              laboratorio:
                produto.laboratorio ??
                null,

              categoria:
                produto.categoria ??
                null,

              apresentacao:
                produto.apresentacao ??
                null,

              imagem:
                primeiraImagem(
                  produto.imagens
                ),

              estoque,

              preco_venda:
                precoVenda,

              preco_consulta:
                precoConsulta,

              pode_vender:
                podeVender,
            };
          }
        );

      /*
        Ordenação:

        1. Pode vender
        2. EAN exato
        3. Maior estoque
        4. Nome
      */

      lista.sort(
        (
          a,
          b
        ) => {

          if (
            a.pode_vender !==
            b.pode_vender
          ) {
            return a.pode_vender
              ? -1
              : 1;
          }

          const aEAN =
            digits.length >=
              8 &&
            onlyDigits(
              a.ean
            ) === digits;

          const bEAN =
            digits.length >=
              8 &&
            onlyDigits(
              b.ean
            ) === digits;

          if (
            aEAN !==
            bEAN
          ) {
            return aEAN
              ? -1
              : 1;
          }

          if (
            a.estoque !==
            b.estoque
          ) {
            return (
              b.estoque -
              a.estoque
            );
          }

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
        Se scanner/EAN encontrou
        exatamente um produto
        vendável, adiciona
        automaticamente.
      */

      if (
        digits.length >= 8
      ) {

        const exato =
          lista.find(
            (
              produto
            ) =>
              onlyDigits(
                produto.ean
              ) ===
                digits &&
              produto.pode_vender
          );

        if (exato) {

          adicionarProduto(
            exato
          );

          setBusca("");

          setResultados(
            []
          );
        }
      }

    } catch (
      error: any
    ) {

      console.error(
        "Erro ao pesquisar produto:",
        error
      );

      alert(
        error?.message ||
          "Erro ao buscar produto."
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

  /* =======================================================
     CARRINHO
  ======================================================= */

  function adicionarProduto(
    produto: Produto
  ) {

    if (
      !produto.pode_vender
    ) {

      alert(
        "Este produto está disponível apenas para consulta."
      );

      return;
    }

    if (
      produto.estoque <=
      0
    ) {

      alert(
        "Produto sem estoque."
      );

      return;
    }

    if (
      produto.preco_venda <=
      0
    ) {

      alert(
        "Produto sem preço de venda cadastrado."
      );

      return;
    }

    setItens(
      (
        anteriores
      ) => {

        const existente =
          anteriores.find(
            (
              item
            ) =>
              item.id ===
              produto.id
          );

        if (
          existente
        ) {

          if (
            existente.qtd >=
            produto.estoque
          ) {

            alert(
              `Estoque máximo disponível: ${produto.estoque}`
            );

            return anteriores;
          }

          return anteriores.map(
            (
              item
            ) =>
              item.id ===
              produto.id
                ? {
                    ...item,

                    qtd:
                      Math.min(
                        item.qtd +
                          1,
                        produto.estoque
                      ),
                  }
                : item
          );
        }

        return [
          ...anteriores,

          {
            ...produto,

            qtd: 1,

            descontoTipo:
              "PERCENTUAL",

            desconto: 0,
          },
        ];
      }
    );

    setBusca("");

    setResultados(
      []
    );

    setTimeout(
      () =>
        inputRef.current?.focus(),
      50
    );
  }

  function alterarQtd(
    id: string,
    delta: number
  ) {

    setItens(
      (
        anteriores
      ) =>
        anteriores
          .map(
            (
              item
            ) => {

              if (
                item.id !==
                id
              ) {
                return item;
              }

              const novaQtd =
                Math.min(
                  item.estoque,
                  Math.max(
                    0,
                    item.qtd +
                      delta
                  )
                );

              return {
                ...item,
                qtd: novaQtd,
              };
            }
          )
          .filter(
            (
              item
            ) =>
              item.qtd > 0
          )
    );
  }

  function removerItem(
    id: string
  ) {

    setItens(
      (
        anteriores
      ) =>
        anteriores.filter(
          (
            item
          ) =>
            item.id !== id
        )
    );
  }

  function alterarDesconto(
    id: string,
    tipo: TipoDesconto,
    valor: number
  ) {

    setItens(
      (
        anteriores
      ) =>
        anteriores.map(
          (
            item
          ) => {

            if (
              item.id !==
              id
            ) {
              return item;
            }

            const limite =
              tipo ===
              "PERCENTUAL"
                ? 100
                : item.preco_venda;

            return {
              ...item,

              descontoTipo:
                tipo,

              desconto:
                Math.min(
                  limite,
                  Math.max(
                    0,
                    Number(
                      valor ||
                        0
                    )
                  )
                ),
            };
          }
        )
    );
  }

  function limparVenda() {

    setItens([]);

    setResultados([]);

    setBusca("");

    setPagamentos([
      {
        forma:
          "Dinheiro",
        valor: "",
      },
    ]);

    setTipoAtendimento(
      "BALCAO"
    );

    limparEntrega();

    setNumeroComanda("");

    setModalComanda(
      false
    );

    setTimeout(
      () =>
        inputRef.current?.focus(),
      50
    );
  }

  /* =======================================================
     ENTREGA
  ======================================================= */

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

  function clienteVenda() {

    if (
      tipoAtendimento !==
      "ENTREGA"
    ) {
      return null;
    }

    return {
      nome:
        clienteNome.trim(),

      telefone:
        onlyDigits(
          clienteTelefone
        ),

      endereco:
        [
          endereco.trim(),
          numeroEndereco.trim()
            ? `Nº ${numeroEndereco.trim()}`
            : "",
          bairro.trim(),
          complemento.trim(),
          referencia.trim()
            ? `Ref: ${referencia.trim()}`
            : "",
        ]
          .filter(
            Boolean
          )
          .join(
            ", "
          ),
    };
  }

  function validarEntrega() {

    if (
      tipoAtendimento !==
      "ENTREGA"
    ) {
      return true;
    }

    if (
      !clienteNome.trim()
    ) {

      alert(
        "Informe o nome do cliente."
      );

      return false;
    }

    if (
      onlyDigits(
        clienteTelefone
      ).length < 10
    ) {

      alert(
        "Informe o telefone/WhatsApp com DDD."
      );

      return false;
    }

    if (
      !endereco.trim()
    ) {

      alert(
        "Informe o endereço."
      );

      return false;
    }

    if (
      !numeroEndereco.trim()
    ) {

      alert(
        "Informe o número do endereço."
      );

      return false;
    }

    if (
      !bairro.trim()
    ) {

      alert(
        "Informe o bairro."
      );

      return false;
    }

    return true;
  }

  /* =======================================================
     PAGAMENTO
  ======================================================= */

  function adicionarPagamento() {

    setPagamentos(
      (
        anteriores
      ) => [
        ...anteriores,

        {
          forma: "Pix",
          valor: "",
        },
      ]
    );
  }

  function alterarPagamento(
    index: number,
    patch:
      Partial<Pagamento>
  ) {

    setPagamentos(
      (
        anteriores
      ) =>
        anteriores.map(
          (
            pagamento,
            i
          ) =>
            i === index
              ? {
                  ...pagamento,
                  ...patch,
                }
              : pagamento
        )
    );
  }

  function removerPagamento(
    index: number
  ) {

    setPagamentos(
      (
        anteriores
      ) => {

        if (
          anteriores.length <=
          1
        ) {
          return anteriores;
        }

        return anteriores.filter(
          (
            _,
            i
          ) =>
            i !== index
        );
      }
    );
  }

  /* =======================================================
     BAIXA SEGURA DO ESTOQUE
  ======================================================= */

  async function baixarEstoqueSegura(
    vendaAtual: Item[]
  ) {

    for (
      const item of
      vendaAtual
    ) {

      const {
        data:
          registro,
        error:
          consultaError,
      } =
        await supabase
          .from(
            "fv_farmacia_produtos"
          )
          .select(
            "produto_id,estoque"
          )
          .eq(
            "farmacia_slug",
            LOJA_SLUG
          )
          .eq(
            "produto_id",
            item.id
          )
          .maybeSingle();

      if (
        consultaError
      ) {
        throw consultaError;
      }

      if (
        !registro
      ) {

        throw new Error(
          `Produto não encontrado no estoque da Rede Fabiano: ${item.nome}`
        );
      }

      const estoqueAtual =
        Number(
          registro.estoque ||
            0
        );

      const quantidade =
        Number(
          item.qtd || 0
        );

      if (
        estoqueAtual <
        quantidade
      ) {

        throw new Error(
          `Estoque insuficiente para ${item.nome}. Disponível: ${estoqueAtual}.`
        );
      }

      const novoEstoque =
        estoqueAtual -
        quantidade;

      /*
        Atualização otimista:
        só altera se estoque
        continuar igual ao que
        acabamos de consultar.
      */

      const {
        data:
          atualizado,
        error:
          updateError,
      } =
        await supabase
          .from(
            "fv_farmacia_produtos"
          )
          .update({
            estoque:
              novoEstoque,
          })
          .eq(
            "farmacia_slug",
            LOJA_SLUG
          )
          .eq(
            "produto_id",
            item.id
          )
          .eq(
            "estoque",
            estoqueAtual
          )
          .select(
            "produto_id"
          )
          .maybeSingle();

      if (
        updateError
      ) {
        throw updateError;
      }

      /*
        Se alguém alterou o
        estoque ao mesmo tempo,
        consulta novamente.
      */

      if (
        !atualizado
      ) {

        const {
          data:
            registro2,
          error:
            consulta2Error,
        } =
          await supabase
            .from(
              "fv_farmacia_produtos"
            )
            .select(
              "estoque"
            )
            .eq(
              "farmacia_slug",
              LOJA_SLUG
            )
            .eq(
              "produto_id",
              item.id
            )
            .maybeSingle();

        if (
          consulta2Error
        ) {
          throw consulta2Error;
        }

        const estoqueAtual2 =
          Number(
            registro2
              ?.estoque ||
              0
          );

        if (
          estoqueAtual2 <
          quantidade
        ) {

          throw new Error(
            `Estoque insuficiente para ${item.nome}. Disponível agora: ${estoqueAtual2}.`
          );
        }

        const {
          error:
            update2Error,
        } =
          await supabase
            .from(
              "fv_farmacia_produtos"
            )
            .update({
              estoque:
                estoqueAtual2 -
                quantidade,
            })
            .eq(
              "farmacia_slug",
              LOJA_SLUG
            )
            .eq(
              "produto_id",
              item.id
            )
            .eq(
              "estoque",
              estoqueAtual2
            );

        if (
          update2Error
        ) {
          throw update2Error;
        }
      }
    }
  }

  /* =======================================================
     MONTA ITENS PARA SALVAR
  ======================================================= */

  function itensParaBanco() {

    return itens.map(
      (
        item
      ) => {

        const precoFinal =
          precoLiquidoItem(
            item
          );

        const descontoUnitario =
          descontoUnitarioItem(
            item
          );

        return {
          produto_id:
            item.id,

          ean:
            item.ean,

          nome:
            item.nome,

          qtd:
            Number(
              item.qtd ||
                1
            ),

          preco_unit:
            Number(
              item.preco_venda ||
                0
            ),

          preco_original:
            Number(
              item.preco_venda ||
                0
            ),

          valor_cobrado:
            Number(
              precoFinal.toFixed(
                2
              )
            ),

          desconto_tipo:
            item.desconto >
            0
              ? item.descontoTipo
              : null,

          desconto:
            Number(
              item.desconto ||
                0
            ),

          desconto_unitario:
            Number(
              descontoUnitario.toFixed(
                2
              )
            ),

          desconto_total:
            Number(
              (
                descontoUnitario *
                item.qtd
              ).toFixed(
                2
              )
            ),

          total:
            Number(
              (
                precoFinal *
                item.qtd
              ).toFixed(
                2
              )
            ),
        };
      }
    );
  }

  /* =======================================================
     IMPRESSÃO
  ======================================================= */

  function imprimirVenda(
    venda:
      VendaSalva
  ) {

    const win =
      window.open(
        "",
        "_blank"
      );

    if (!win) {
      alert(
        "O navegador bloqueou a janela de impressão."
      );

      return;
    }

    const dataRaw =
      venda.finalizada_em ||
      venda.created_at ||
      new Date().toISOString();

    const data =
      new Date(
        dataRaw
      );

    const listaItens =
      asArray<any>(
        venda.itens
      );

    const cliente =
      venda.cliente ||
      {};

    const pagamento =
      venda.pagamento ||
      {};

    const pagamentosVenda =
      asArray<any>(
        pagamento?.pagamentos
      );

    const pagamentoTexto =
      pagamentosVenda.length
        ? pagamentosVenda
            .map(
              (
                p
              ) =>
                `${p.forma}: ${brl(
                  Number(
                    p.valor ||
                      0
                  )
                )}`
            )
            .join(
              "<br/>"
            )
        : pagamento?.forma
        ? String(
            pagamento.forma
          )
        : "";

    win.document.write(`
<!DOCTYPE html>
<html>
<head>

<meta charset="utf-8"/>

<title>Comprovante - Drogaria Rede Fabiano</title>

<style>

body {
  font-family: "Courier New", monospace;
  width: 58mm;
  margin: 0 auto;
  padding: 5px;
  color: #000;
  font-size: 11px;
}

.center {
  text-align: center;
}

.bold {
  font-weight: 900;
}

.line {
  border-top: 1px dashed #555;
  margin: 6px 0;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.small {
  font-size: 10px;
}

.total {
  font-size: 15px;
  font-weight: 900;
  text-align: right;
}

</style>

</head>

<body>

<div class="center bold">
DROGARIA REDE FABIANO
</div>

<div class="center small">
${
  venda.status ===
  "PRE_VENDA"
    ? "PRÉ-VENDA / COMANDA"
    : "COMPROVANTE DE VENDA"
}
</div>

${
  venda.comanda
    ? `
<div class="center bold">
COMANDA ${venda.comanda}
</div>
`
    : ""
}

<div class="line"></div>

<div>
Data:
${data.toLocaleDateString(
  "pt-BR"
)}
${data.toLocaleTimeString(
  "pt-BR"
)}
</div>

<div>
Venda:
${String(
  venda.id ||
    ""
)
  .slice(
    0,
    8
  )
  .toUpperCase()}
</div>

<div>
Status:
${venda.status || "-"}
</div>

${
  cliente?.nome
    ? `
<div>
Cliente: ${cliente.nome}
</div>
`
    : ""
}

${
  cliente?.telefone
    ? `
<div>
Telefone: ${cliente.telefone}
</div>
`
    : ""
}

${
  cliente?.endereco
    ? `
<div>
Endereço: ${cliente.endereco}
</div>
`
    : ""
}

<div class="line"></div>

${listaItens
  .map(
    (
      item
    ) => {

      const qtd =
        Number(
          item.qtd ||
            0
        );

      const unit =
        Number(
          item.valor_cobrado ??
            item.preco_unit ??
            0
        );

      const itemTotal =
        Number(
          item.total ??
            unit *
              qtd
        );

      return `
<div class="bold">
${qtd}x ${String(
        item.nome ||
          ""
      ).slice(
        0,
        28
      )}
</div>

<div class="row">
<span>${brl(
        unit
      )} un.</span>

<span>${brl(
        itemTotal
      )}</span>
</div>

${
  Number(
    item.desconto_total ||
      0
  ) > 0
    ? `
<div class="small">
Desconto: -${brl(
        Number(
          item.desconto_total
        )
      )}
</div>
`
    : ""
}

`;
    }
  )
  .join("")}

<div class="line"></div>

${
  pagamentoTexto
    ? `
<div>
Pagamento:<br/>
${pagamentoTexto}
</div>

<div class="line"></div>
`
    : ""
}

<div class="total">
TOTAL: ${brl(
      Number(
        venda.total ||
          0
      )
    )}
</div>

<div class="line"></div>

<div class="center small">
Obrigado pela preferência!
</div>

<div class="center small bold">
Drogaria Rede Fabiano
</div>

<div class="center small">
iadrogarias.com.br
</div>

</body>
</html>
    `);

    win.document.close();

    win.focus();

    setTimeout(
      () => {
        win.print();
      },
      250
    );
  }

  /* =======================================================
     SALVAR PRÉ-VENDA / COMANDA
  ======================================================= */

  function abrirModalComanda() {

    if (
      !itens.length
    ) {

      alert(
        "Adicione produtos antes de salvar a comanda."
      );

      return;
    }

    if (
      !validarEntrega()
    ) {
      return;
    }

    setNumeroComanda("");

    setModalComanda(
      true
    );
  }

  async function salvarComanda() {

    if (
      salvandoComanda
    ) {
      return;
    }

    if (
      !itens.length
    ) {
      return;
    }

    const comanda =
      numeroComanda.trim();

    if (!comanda) {

      alert(
        "Informe o número da comanda."
      );

      return;
    }

    if (
      !validarEntrega()
    ) {
      return;
    }

    setSalvandoComanda(
      true
    );

    try {

      const payload = {

        loja_slug:
          LOJA_SLUG,

        origem:
          "PDV",

        status:
          "PRE_VENDA",

        tipo_lancamento:
          "pre_venda",

        comanda,

        cliente:
          clienteVenda(),

        pagamento:
          null,

        itens:
          itensParaBanco(),

        total:
          Number(
            total.toFixed(
              2
            )
          ),
      };

      const {
        data:
          saved,
        error,
      } =
        await supabase
          .from(
            "vendas"
          )
          .insert([
            payload,
          ])
          .select("*")
          .single();

      if (error) {
        throw error;
      }

      const vendaSalva =
        saved as VendaSalva;

      setUltimoComprovante(
        vendaSalva
      );

      imprimirVenda(
        vendaSalva
      );

      alert(
        `Pré-venda salva na comanda ${comanda}.`
      );

      setModalComanda(
        false
      );

      limparVenda();

    } catch (
      error: any
    ) {

      console.error(
        "Erro ao salvar comanda:",
        error
      );

      alert(
        error?.message ||
          "Erro ao salvar a comanda."
      );

    } finally {

      setSalvandoComanda(
        false
      );
    }
  }

  /* =======================================================
     FINALIZAR VENDA
  ======================================================= */

  async function finalizarVenda() {

    if (
      salvando
    ) {
      return;
    }

    if (
      !itens.length
    ) {

      alert(
        "Adicione produtos à venda."
      );

      return;
    }

    if (
      !validarEntrega()
    ) {
      return;
    }

    /*
      Remove pagamentos zerados.
    */

    const pagamentosValidos =
      pagamentos
        .map(
          (
            pagamento
          ) => ({
            forma:
              pagamento.forma,

            valor:
              numero(
                pagamento.valor
              ),
          })
        )
        .filter(
          (
            pagamento
          ) =>
            pagamento.valor >
            0
        );

    if (
      !pagamentosValidos.length
    ) {

      alert(
        "Informe o pagamento."
      );

      return;
    }

    /*
      Não dinheiro não pode
      ultrapassar o total.
    */

    if (
      pagamentosNaoDinheiro >
      total + 0.009
    ) {

      alert(
        "Pix/Cartão não pode ultrapassar o total da venda."
      );

      return;
    }

    /*
      Total recebido precisa
      cobrir a venda.

      Dinheiro pode passar
      porque gera troco.
    */

    if (
      totalPagamentos <
      total - 0.009
    ) {

      alert(
        `Ainda falta ${brl(
          total -
            totalPagamentos
        )}.`
      );

      return;
    }

    setSalvando(
      true
    );

    try {

      /*
        1. Confirma caixa aberto
      */

      const caixa =
        await obterCaixaAberto();

      if (!caixa) {

        throw new Error(
          "Não existe caixa aberto. Faça a abertura do caixa antes de finalizar a venda."
        );
      }

      /*
        2. Baixa estoque
      */

      await baixarEstoqueSegura(
        itens
      );

      /*
        3. Monta pagamento salvo

        Guardamos:
        - pagamentos mistos
        - recebido
        - troco
        - atendimento
      */

      const pagamentoBanco = {

        tipo:
          tipoAtendimento ===
          "ENTREGA"
            ? "Entrega"
            : "Balcão",

        forma:
          pagamentosValidos.length ===
          1
            ? pagamentosValidos[
                0
              ].forma
            : "Misto",

        pagamentos:
          pagamentosValidos,

        recebido:
          Number(
            totalPagamentos.toFixed(
              2
            )
          ),

        troco:
          Number(
            troco.toFixed(
              2
            )
          ),
      };

      /*
        4. Salva venda
      */

      const payload = {

        loja_slug:
          LOJA_SLUG,

        origem:
          "PDV",

        status:
          "FINALIZADA",

        tipo_lancamento:
          "caixa",

        caixa_sessao_id:
          caixa.id,

        comanda:
          numeroComanda.trim() ||
          null,

        cliente:
          clienteVenda(),

        pagamento:
          pagamentoBanco,

        itens:
          itensParaBanco(),

        total:
          Number(
            total.toFixed(
              2
            )
          ),

        finalizada_em:
          new Date().toISOString(),
      };

      const {
        data:
          saved,
        error:
          vendaError,
      } =
        await supabase
          .from(
            "vendas"
          )
          .insert([
            payload,
          ])
          .select("*")
          .single();

      if (
        vendaError
      ) {
        throw vendaError;
      }

      /*
        5. Lançamentos no caixa.

        Cria uma movimentação para
        cada forma de pagamento.

        No dinheiro lançamos apenas
        o valor efetivo da venda,
        descontando o troco.
      */

      let trocoRestante =
        troco;

      for (
        const pagamento of
        pagamentosValidos
      ) {

        let valorCaixa =
          pagamento.valor;

        if (
          pagamento.forma ===
            "Dinheiro" &&
          trocoRestante > 0
        ) {

          const abatimento =
            Math.min(
              trocoRestante,
              valorCaixa
            );

          valorCaixa -=
            abatimento;

          trocoRestante -=
            abatimento;
        }

        if (
          valorCaixa <= 0
        ) {
          continue;
        }

        const {
          error:
            movimentoError,
        } =
          await supabase
            .from(
              "movimentacoes_caixa"
            )
            .insert([
              {
                tipo:
                  "entrada",

                descricao:
                  `Venda PDV ${String(
                    saved.id
                  ).slice(
                    0,
                    8
                  )}${
                    tipoAtendimento ===
                    "ENTREGA"
                      ? " - ENTREGA"
                      : ""
                  }`,

                valor:
                  Number(
                    valorCaixa.toFixed(
                      2
                    )
                  ),

                forma_pagamento:
                  pagamento.forma,

                loja:
                  LOJA_SLUG,

                referencia_venda:
                  saved.id,

                caixa_sessao_id:
                  caixa.id,

                data:
                  new Date()
                    .toISOString()
                    .slice(
                      0,
                      10
                    ),
              },
            ]);

        if (
          movimentoError
        ) {
          throw movimentoError;
        }
      }

      const vendaSalva =
        saved as VendaSalva;

      setUltimoComprovante(
        vendaSalva
      );

      /*
        6. Impressão automática
      */

      imprimirVenda(
        vendaSalva
      );

      alert(
        `${
          tipoAtendimento ===
          "ENTREGA"
            ? "Venda para entrega"
            : "Venda"
        } finalizada com sucesso!\n\nTotal: ${brl(
          total
        )}${
          troco > 0
            ? `\nTroco: ${brl(
                troco
              )}`
            : ""
        }`
      );

      limparVenda();

      await atualizarCaixaAbertoInfo();

    } catch (
      error: any
    ) {

      console.error(
        "Erro ao finalizar venda:",
        error
      );

      alert(
        error?.message ||
          "Erro ao finalizar venda."
      );

    } finally {

      setSalvando(
        false
      );

      setTimeout(
        () =>
          inputRef.current?.focus(),
        50
      );
    }
  }

  /* =======================================================
     CONSULTAR VENDAS
  ======================================================= */

  async function carregarVendas() {

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "vendas"
        )
        .select("*")
        .eq(
          "loja_slug",
          LOJA_SLUG
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(200);

    if (error) {

      console.error(
        error
      );

      alert(
        "Erro ao carregar vendas."
      );

      return;
    }

    setVendas(
      data || []
    );
  }

  async function buscarVendasPorData() {

    if (
      !filtroData
    ) {

      alert(
        "Selecione uma data."
      );

      return;
    }

    const inicio =
      `${filtroData}T00:00:00`;

    const fim =
      `${filtroData}T23:59:59.999`;

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "vendas"
        )
        .select("*")
        .eq(
          "loja_slug",
          LOJA_SLUG
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

    if (error) {

      console.error(
        error
      );

      alert(
        "Erro ao buscar vendas."
      );

      return;
    }

    setVendas(
      data || []
    );
  }

  async function verificarSenha() {

    if (
      senha !==
      SENHA_ADMIN
    ) {

      alert(
        "Senha incorreta."
      );

      return;
    }

    setSenha("");

    setMostrarVendas(
      true
    );

    await carregarVendas();
  }

  /* =======================================================
     NOVO PRODUTO
  ======================================================= */

  function abrirNovoProduto() {

    window.open(
      `/drogarias/${LOJA_SLUG}/admin`,
      "_blank"
    );
  }

  /* =======================================================
     ATALHOS
  ======================================================= */

  useEffect(() => {

    function handleKeyDown(
      event: KeyboardEvent
    ) {

      /*
        Evita disparar atalhos
        enquanto usuário está
        digitando em input/textarea,
        exceto teclas F.
      */

      const target =
        event.target as HTMLElement;

      const digitando =
        target?.tagName ===
          "INPUT" ||
        target?.tagName ===
          "TEXTAREA" ||
        target?.tagName ===
          "SELECT";

      if (
        digitando &&
        ![
          "F2",
          "F3",
          "F4",
          "F6",
          "F7",
          "Escape",
        ].includes(
          event.key
        )
      ) {
        return;
      }

      switch (
        event.key
      ) {

        case "F2":

          event.preventDefault();

          inputRef.current?.focus();

          break;

        case "F3":

          event.preventDefault();

          limparVenda();

          break;

        case "F4":

          event.preventDefault();

          abrirNovoProduto();

          break;

        case "F6":

          event.preventDefault();

          abrirModalComanda();

          break;

        case "F7":

          event.preventDefault();

          pagamentoRef.current?.scrollIntoView(
            {
              behavior:
                "smooth",

              block:
                "start",
            }
          );

          break;

        case "Escape":

          if (
            cameraAberta
          ) {

            event.preventDefault();

            fecharCamera();

          } else if (
            modalComanda
          ) {

            event.preventDefault();

            setModalComanda(
              false
            );

          } else if (
            vendaSelecionada
          ) {

            event.preventDefault();

            setVendaSelecionada(
              null
            );
          }

          break;
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

  }, [
    cameraAberta,
    modalComanda,
    vendaSelecionada,
    itens,
  ]);

  /* =======================================================
     BLOCO 1 TERMINA AQUI

     NÃO FECHE O COMPONENTE.

     O BLOCO 2 COMEÇA DIRETAMENTE
     COM:

     return (
  ======================================================= */
    return (
    <main className="min-h-screen bg-slate-100 pb-28 text-slate-900">
      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-blue-900 bg-blue-950 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 md:px-5">
          <Link
            href={`/drogarias/${LOJA_SLUG}/admin`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            title="Voltar"
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="truncate text-[10px] font-black uppercase tracking-wider text-blue-200">
              Drogaria Rede Fabiano
            </div>

            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-black">
                PDV
              </h1>

              {caixaAbertoInfo ? (
                <span className="rounded-full bg-green-500/20 px-2 py-1 text-[10px] font-black text-green-200">
                  ● CAIXA ABERTO
                </span>
              ) : (
                <span className="rounded-full bg-red-500/20 px-2 py-1 text-[10px] font-black text-red-200">
                  ● SEM CAIXA
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={abrirCamera}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            title="Câmera"
          >
            <Camera size={20} />
          </button>

          <button
            type="button"
            onClick={() => {
              setSenha("");
              setMostrarVendas(false);
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            title="Vendas"
          >
            <ReceiptText size={20} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-3 md:p-5">
        {/* ===================================================
            STATUS DO CAIXA
        =================================================== */}

        {!caixaAbertoInfo && (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
            O caixa da Rede Fabiano está fechado. Você pode montar
            uma venda ou salvar uma comanda, mas para finalizar no
            caixa será necessário abrir uma sessão de caixa.
          </div>
        )}

        {/* ===================================================
            ATALHOS DESKTOP
        =================================================== */}

        <div className="mb-3 hidden grid-cols-5 gap-2 lg:grid">
          <Atalho label="F2" descricao="Buscar produto" />
          <Atalho label="F3" descricao="Nova venda" />
          <Atalho label="F4" descricao="Novo produto" />
          <Atalho label="F6" descricao="Comanda" />
          <Atalho label="F7" descricao="Pagamento" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          {/* =================================================
              COLUNA ESQUERDA
          ================================================= */}

          <section className="space-y-4">
            {/* ===============================================
                BUSCA
            =============================================== */}

            <div className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase text-blue-700">
                    Produtos
                  </div>

                  <div className="text-sm font-bold text-slate-500">
                    Nome ou código de barras
                  </div>
                </div>

                <button
                  type="button"
                  onClick={abrirNovoProduto}
                  className="rounded-xl bg-green-50 px-3 py-2 text-xs font-black text-green-700"
                >
                  + Produto
                </button>
              </div>

              <div className="flex gap-2">
                <div className="flex min-w-0 flex-1 items-center rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 focus-within:border-blue-700 focus-within:bg-white">
                  <Search
                    size={21}
                    className="shrink-0 text-slate-500"
                  />

                  <input
                    ref={inputRef}
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void pesquisar();
                      }
                    }}
                    placeholder="Digite o nome ou leia o EAN..."
                    className="min-w-0 flex-1 bg-transparent px-3 py-4 text-base font-bold outline-none"
                    autoComplete="off"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void pesquisar()}
                  disabled={loading}
                  className="hidden rounded-2xl bg-blue-800 px-5 font-black text-white disabled:opacity-50 sm:block"
                >
                  {loading ? "..." : "Buscar"}
                </button>

                <button
                  type="button"
                  onClick={abrirCamera}
                  className="flex w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"
                  title="Ler código de barras"
                >
                  <Camera size={23} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => void pesquisar()}
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-blue-800 py-3 font-black text-white disabled:opacity-50 sm:hidden"
              >
                {loading ? "Buscando..." : "BUSCAR PRODUTO"}
              </button>
            </div>

            {/* ===============================================
                RESULTADOS
            =============================================== */}

            {loading && (
              <div className="rounded-2xl bg-white p-5 text-center font-bold text-blue-800 shadow-sm">
                Buscando produtos...
              </div>
            )}

            {!loading &&
              busca.trim() &&
              resultados.length === 0 && (
                <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-7 text-center">
                  <Search
                    size={34}
                    className="mx-auto text-slate-400"
                  />

                  <div className="mt-3 font-black">
                    Produto não encontrado
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    Tente outro nome/EAN ou cadastre o produto no
                    Admin.
                  </div>

                  <button
                    type="button"
                    onClick={abrirNovoProduto}
                    className="mt-4 rounded-xl bg-green-600 px-4 py-3 font-black text-white"
                  >
                    + Cadastrar produto
                  </button>
                </div>
              )}

            {resultados.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="text-xs font-black uppercase text-slate-500">
                    Resultado da busca
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResultados([]);
                      setBusca("");
                      inputRef.current?.focus();
                    }}
                    className="text-xs font-black text-blue-700"
                  >
                    Limpar
                  </button>
                </div>

                {resultados.map((produto) => (
                  <ResultadoProduto
                    key={produto.id}
                    produto={produto}
                    onAdd={() => adicionarProduto(produto)}
                  />
                ))}
              </div>
            )}

            {/* ===============================================
                CARRINHO
            =============================================== */}

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                    <ShoppingCart size={19} />
                  </div>

                  <div>
                    <div className="font-black">
                      Carrinho
                    </div>

                    <div className="text-xs font-bold text-slate-500">
                      {quantidadeItens} item(ns)
                    </div>
                  </div>
                </div>

                {itens.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Limpar todos os itens desta venda?"
                        )
                      ) {
                        limparVenda();
                      }
                    }}
                    className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {itens.length === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingCart
                    size={38}
                    className="mx-auto text-slate-300"
                  />

                  <div className="mt-3 font-black text-slate-700">
                    Carrinho vazio
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    Pesquise ou escaneie um produto para começar.
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {itens.map((item) => (
                    <ItemCarrinho
                      key={item.id}
                      item={item}
                      onQtd={(delta) =>
                        alterarQtd(item.id, delta)
                      }
                      onRemove={() => removerItem(item.id)}
                      onDesconto={(tipo, valor) =>
                        alterarDesconto(
                          item.id,
                          tipo,
                          valor
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ===============================================
                BALCÃO / ENTREGA
            =============================================== */}

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b px-4 py-3">
                <div className="text-xs font-black uppercase text-slate-500">
                  Atendimento
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoAtendimento("BALCAO");
                      setTaxaEntrega("0");
                    }}
                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 font-black ${
                      tipoAtendimento === "BALCAO"
                        ? "border-blue-700 bg-blue-700 text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <Store size={19} />
                    Balcão
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setTipoAtendimento("ENTREGA")
                    }
                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 font-black ${
                      tipoAtendimento === "ENTREGA"
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <Truck size={19} />
                    Entrega
                  </button>
                </div>
              </div>

              {tipoAtendimento === "ENTREGA" && (
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  <PDVField label="Nome do cliente">
                    <input
                      value={clienteNome}
                      onChange={(e) =>
                        setClienteNome(e.target.value)
                      }
                      className="pdv-input"
                      placeholder="Nome"
                    />
                  </PDVField>

                  <PDVField label="WhatsApp / telefone">
                    <input
                      value={clienteTelefone}
                      onChange={(e) =>
                        setClienteTelefone(
                          onlyDigits(e.target.value)
                        )
                      }
                      inputMode="tel"
                      className="pdv-input"
                      placeholder="11999999999"
                    />
                  </PDVField>

                  <PDVField
                    label="Endereço"
                    className="md:col-span-2"
                  >
                    <input
                      value={endereco}
                      onChange={(e) =>
                        setEndereco(e.target.value)
                      }
                      className="pdv-input"
                      placeholder="Rua / Avenida"
                    />
                  </PDVField>

                  <PDVField label="Número">
                    <input
                      value={numeroEndereco}
                      onChange={(e) =>
                        setNumeroEndereco(e.target.value)
                      }
                      className="pdv-input"
                      placeholder="Nº"
                    />
                  </PDVField>

                  <PDVField label="Bairro">
                    <input
                      value={bairro}
                      onChange={(e) =>
                        setBairro(e.target.value)
                      }
                      className="pdv-input"
                      placeholder="Bairro"
                    />
                  </PDVField>

                  <PDVField label="Complemento">
                    <input
                      value={complemento}
                      onChange={(e) =>
                        setComplemento(e.target.value)
                      }
                      className="pdv-input"
                      placeholder="Casa, apto..."
                    />
                  </PDVField>

                  <PDVField label="Referência">
                    <input
                      value={referencia}
                      onChange={(e) =>
                        setReferencia(e.target.value)
                      }
                      className="pdv-input"
                      placeholder="Próximo a..."
                    />
                  </PDVField>

                  <PDVField label="Taxa de entrega">
                    <div className="flex items-center rounded-xl border-2 border-slate-200 bg-white px-3 focus-within:border-blue-600">
                      <span className="font-black text-slate-500">
                        R$
                      </span>

                      <input
                        value={taxaEntrega}
                        onChange={(e) =>
                          setTaxaEntrega(e.target.value)
                        }
                        inputMode="decimal"
                        className="min-w-0 flex-1 bg-transparent px-2 py-3 font-black outline-none"
                        placeholder="0,00"
                      />
                    </div>
                  </PDVField>

                  <PDVField
                    label="Observações"
                    className="md:col-span-2"
                  >
                    <textarea
                      value={observacoes}
                      onChange={(e) =>
                        setObservacoes(e.target.value)
                      }
                      rows={2}
                      className="pdv-input"
                      placeholder="Observações da entrega..."
                    />
                  </PDVField>
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              COLUNA DIREITA
          ================================================= */}

          <section className="space-y-4">
            {/* ===============================================
                RESUMO
            =============================================== */}

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-[78px]">
              <div className="bg-slate-950 p-4 text-white">
                <div className="text-xs font-black uppercase text-slate-400">
                  Resumo da venda
                </div>

                <div className="mt-1 flex items-end justify-between">
                  <div>
                    <div className="text-sm text-slate-300">
                      {quantidadeItens} item(ns)
                    </div>

                    <div className="mt-1 text-3xl font-black">
                      {brl(total)}
                    </div>
                  </div>

                  {tipoAtendimento === "ENTREGA" && (
                    <div className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-black">
                      ENTREGA
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 p-4 text-sm">
                <ResumoLinha
                  label="Subtotal"
                  valor={brl(subtotalBruto)}
                />

                {descontoTotal > 0 && (
                  <ResumoLinha
                    label="Descontos"
                    valor={`- ${brl(descontoTotal)}`}
                    destaque="verde"
                  />
                )}

                {taxa > 0 && (
                  <ResumoLinha
                    label="Taxa de entrega"
                    valor={brl(taxa)}
                  />
                )}

                <div className="border-t pt-3">
                  <ResumoLinha
                    label="TOTAL"
                    valor={brl(total)}
                    grande
                  />
                </div>
              </div>

              {/* =============================================
                  PAGAMENTO
              ============================================= */}

              <div
                ref={pagamentoRef}
                className="border-t bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="font-black">
                      Pagamento
                    </div>

                    <div className="text-xs text-slate-500">
                      Aceita pagamento misto
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={adicionarPagamento}
                    className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-black text-blue-800"
                  >
                    + Forma
                  </button>
                </div>

                <div className="space-y-2">
                  {pagamentos.map((pagamento, index) => (
                    <PagamentoLinha
                      key={index}
                      pagamento={pagamento}
                      podeRemover={pagamentos.length > 1}
                      onChange={(patch) =>
                        alterarPagamento(index, patch)
                      }
                      onRemove={() =>
                        removerPagamento(index)
                      }
                    />
                  ))}
                </div>

                <div className="mt-4 space-y-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                  <ResumoLinha
                    label="Total recebido"
                    valor={brl(totalPagamentos)}
                  />

                  {faltante > 0 && (
                    <ResumoLinha
                      label="Falta receber"
                      valor={brl(faltante)}
                      destaque="vermelho"
                    />
                  )}

                  {troco > 0 && (
                    <ResumoLinha
                      label="Troco"
                      valor={brl(troco)}
                      destaque="verde"
                      grande
                    />
                  )}
                </div>
              </div>

              {/* =============================================
                  AÇÕES
              ============================================= */}

              <div className="grid gap-2 border-t p-4">
                <button
                  type="button"
                  onClick={abrirModalComanda}
                  disabled={!itens.length || salvando}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-blue-700 bg-white py-3 font-black text-blue-800 disabled:opacity-40"
                >
                  <ReceiptText size={19} />
                  SALVAR EM COMANDA
                </button>

                <button
                  type="button"
                  onClick={() => void finalizarVenda()}
                  disabled={!itens.length || salvando}
                  className="w-full rounded-2xl bg-green-600 py-4 text-lg font-black text-white shadow-lg shadow-green-600/20 disabled:opacity-40"
                >
                  {salvando
                    ? "FINALIZANDO..."
                    : `FINALIZAR • ${brl(total)}`}
                </button>

                {ultimoComprovante && (
                  <button
                    type="button"
                    onClick={() =>
                      imprimirVenda(ultimoComprovante)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-black text-slate-700"
                  >
                    <Printer size={17} />
                    Reimprimir último comprovante
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* =====================================================
          BARRA MOBILE
      ===================================================== */}

      {itens.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-2 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-2">
            <div className="min-w-0 flex-1 px-2">
              <div className="text-[10px] font-black uppercase text-slate-400">
                Total
              </div>

              <div className="truncate text-xl font-black text-slate-950">
                {brl(total)}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                pagamentoRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              className="rounded-xl bg-blue-100 px-3 py-3 text-xs font-black text-blue-800"
            >
              Pagamento
            </button>

            <button
              type="button"
              onClick={() => void finalizarVenda()}
              disabled={salvando}
              className="rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              Finalizar
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL CÂMERA
      ===================================================== */}

      {cameraAberta && (
        <div className="fixed inset-0 z-[100] bg-black">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between bg-black/90 p-4 text-white">
              <div>
                <div className="font-black">
                  Ler código de barras
                </div>

                <div className="text-xs text-slate-300">
                  Aponte a câmera para o EAN
                </div>
              </div>

              <button
                type="button"
                onClick={fecharCamera}
                className="rounded-xl bg-white/10 p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-40 w-[88%] max-w-md rounded-3xl border-2 border-white shadow-2xl">
                  <div className="absolute left-5 right-5 top-1/2 h-[2px] bg-red-500 shadow-lg" />

                  <div className="absolute -left-[2px] -top-[2px] h-8 w-8 rounded-tl-3xl border-l-4 border-t-4 border-green-400" />

                  <div className="absolute -right-[2px] -top-[2px] h-8 w-8 rounded-tr-3xl border-r-4 border-t-4 border-green-400" />

                  <div className="absolute -bottom-[2px] -left-[2px] h-8 w-8 rounded-bl-3xl border-b-4 border-l-4 border-green-400" />

                  <div className="absolute -bottom-[2px] -right-[2px] h-8 w-8 rounded-br-3xl border-b-4 border-r-4 border-green-400" />
                </div>
              </div>

              {cameraLendo && !cameraErro && (
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
                onClick={fecharCamera}
                className="w-full rounded-2xl bg-white py-3 font-black text-slate-950"
              >
                Fechar câmera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL COMANDA
      ===================================================== */}

      {modalComanda && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-2 sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-blue-950 p-4 text-white">
              <div>
                <div className="text-xs font-bold text-blue-200">
                  PRÉ-VENDA
                </div>

                <div className="text-lg font-black">
                  Salvar em Comanda
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalComanda(false)}
                className="rounded-xl bg-white/10 p-2"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <label className="block">
                <div className="mb-1 text-xs font-black uppercase text-slate-500">
                  Número / Nome da comanda
                </div>

                <input
                  value={numeroComanda}
                  onChange={(e) =>
                    setNumeroComanda(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void salvarComanda();
                    }
                  }}
                  autoFocus
                  className="w-full rounded-2xl border-2 border-slate-200 px-4 py-4 text-center text-2xl font-black outline-none focus:border-blue-700"
                  placeholder="Ex.: 15"
                />
              </label>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <ResumoLinha
                  label="Itens"
                  valor={String(quantidadeItens)}
                />

                <ResumoLinha
                  label="Total da pré-venda"
                  valor={brl(total)}
                  grande
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalComanda(false)}
                  className="rounded-xl border py-3 font-black"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void salvarComanda()}
                  disabled={salvandoComanda}
                  className="rounded-xl bg-blue-800 py-3 font-black text-white disabled:opacity-50"
                >
                  {salvandoComanda
                    ? "Salvando..."
                    : "SALVAR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CONSULTA DE VENDAS - LOGIN
      ===================================================== */}

      {!mostrarVendas && senha !== "__fechado__" && (
        <div className="pointer-events-none fixed right-3 top-[72px] z-50">
          {/* espaço reservado */}
        </div>
      )}

      {/* Botão flutuante desktop/mobile para consulta */}

      <button
        type="button"
        onClick={() => {
          const senhaDigitada = window.prompt(
            "Digite a senha para consultar as vendas:"
          );

          if (senhaDigitada === null) {
            return;
          }

          setSenha(senhaDigitada);

          if (senhaDigitada !== SENHA_ADMIN) {
            alert("Senha incorreta.");
            return;
          }

          setSenha("");
          setMostrarVendas(true);
          void carregarVendas();
        }}
        className="fixed bottom-24 right-3 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl lg:bottom-5"
        title="Consultar vendas"
      >
        <ReceiptText size={20} />
      </button>

      {/* =====================================================
          MODAL CONSULTA DE VENDAS
      ===================================================== */}

      {mostrarVendas && (
        <div className="fixed inset-0 z-[80] bg-black/60 p-2 md:p-4">
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-slate-950 p-4 text-white">
              <div>
                <div className="text-xs font-bold text-slate-400">
                  REDE FABIANO
                </div>

                <div className="text-lg font-black">
                  Vendas e Comandas
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMostrarVendas(false);
                  setVendaSelecionada(null);
                }}
                className="rounded-xl bg-white/10 p-2"
              >
                <X size={21} />
              </button>
            </div>

            <div className="border-b bg-slate-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="date"
                  value={filtroData}
                  onChange={(e) =>
                    setFiltroData(e.target.value)
                  }
                  className="rounded-xl border-2 border-slate-200 bg-white px-3 py-3 font-bold outline-none focus:border-blue-700"
                />

                <button
                  type="button"
                  onClick={() => void buscarVendasPorData()}
                  className="rounded-xl bg-blue-800 px-4 py-3 font-black text-white"
                >
                  Buscar data
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFiltroData("");
                    void carregarVendas();
                  }}
                  className="rounded-xl border bg-white px-4 py-3 font-black"
                >
                  Últimas vendas
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {vendas.length === 0 ? (
                <div className="p-10 text-center text-sm font-bold text-slate-500">
                  Nenhuma venda encontrada.
                </div>
              ) : (
                <div className="space-y-2">
                  {vendas.map((venda) => {
                    const dataVenda = new Date(
                      venda.finalizada_em ||
                        venda.created_at ||
                        new Date().toISOString()
                    );

                    const status = String(
                      venda.status || ""
                    ).toUpperCase();

                    return (
                      <button
                        type="button"
                        key={venda.id}
                        onClick={() =>
                          setVendaSelecionada(venda)
                        }
                        className="flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition hover:bg-slate-50"
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            status === "PRE_VENDA"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          <ReceiptText size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-black">
                              {status === "PRE_VENDA"
                                ? `Comanda ${
                                    venda.comanda || ""
                                  }`
                                : `Venda ${String(
                                    venda.id
                                  )
                                    .slice(0, 8)
                                    .toUpperCase()}`}
                            </div>

                            <span
                              className={`rounded-full px-2 py-1 text-[9px] font-black ${
                                status === "PRE_VENDA"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {status || "VENDA"}
                            </span>
                          </div>

                          <div className="mt-1 text-xs font-bold text-slate-500">
                            {dataVenda.toLocaleDateString(
                              "pt-BR"
                            )}{" "}
                            •{" "}
                            {dataVenda.toLocaleTimeString(
                              "pt-BR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black">
                            {brl(Number(venda.total || 0))}
                          </div>

                          <div className="text-[10px] font-bold text-slate-400">
                            Ver detalhes
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DETALHE DA VENDA
      ===================================================== */}

      {vendaSelecionada && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 p-2 sm:items-center">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <div className="text-xs font-black uppercase text-slate-500">
                  Detalhes
                </div>

                <div className="font-black">
                  {String(vendaSelecionada.status || "").toUpperCase() ===
                  "PRE_VENDA"
                    ? `Comanda ${
                        vendaSelecionada.comanda || ""
                      }`
                    : "Venda"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVendaSelecionada(null)}
                className="rounded-xl bg-slate-100 p-2"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {vendaSelecionada.cliente?.nome && (
                <div className="mb-4 rounded-2xl bg-orange-50 p-3">
                  <div className="text-xs font-black uppercase text-orange-700">
                    Cliente / Entrega
                  </div>

                  <div className="mt-1 font-black">
                    {vendaSelecionada.cliente.nome}
                  </div>

                  {vendaSelecionada.cliente.telefone && (
                    <div className="text-sm">
                      {vendaSelecionada.cliente.telefone}
                    </div>
                  )}

                  {vendaSelecionada.cliente.endereco && (
                    <div className="mt-1 text-sm text-slate-600">
                      {vendaSelecionada.cliente.endereco}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {asArray<any>(vendaSelecionada.itens).map(
                  (item, index) => (
                    <div
                      key={`${item.produto_id || index}-${index}`}
                      className="rounded-2xl border p-3"
                    >
                      <div className="font-black">
                        {item.nome}
                      </div>

                      <div className="mt-1 flex justify-between text-sm text-slate-600">
                        <span>
                          {Number(item.qtd || 0)} x{" "}
                          {brl(
                            Number(
                              item.valor_cobrado ??
                                item.preco_unit ??
                                0
                            )
                          )}
                        </span>

                        <span className="font-black text-slate-900">
                          {brl(
                            Number(
                              item.total ??
                                Number(item.qtd || 0) *
                                  Number(
                                    item.valor_cobrado ??
                                      item.preco_unit ??
                                      0
                                  )
                            )
                          )}
                        </span>
                      </div>

                      {Number(item.desconto_total || 0) >
                        0 && (
                        <div className="mt-1 text-xs font-bold text-green-700">
                          Desconto: -
                          {brl(
                            Number(item.desconto_total)
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
                <div className="text-xs font-bold text-slate-400">
                  TOTAL
                </div>

                <div className="text-3xl font-black">
                  {brl(
                    Number(vendaSelecionada.total || 0)
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t p-3">
              <button
                type="button"
                onClick={() => setVendaSelecionada(null)}
                className="rounded-xl border py-3 font-black"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() =>
                  imprimirVenda(vendaSelecionada)
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-800 py-3 font-black text-white"
              >
                <Printer size={17} />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ESTILO LOCAL DOS INPUTS
      ===================================================== */}

      <style jsx global>{`
        .pdv-input {
          width: 100%;
          border: 2px solid rgb(226 232 240);
          border-radius: 0.75rem;
          background: white;
          padding: 0.75rem;
          outline: none;
          font-weight: 600;
        }

        .pdv-input:focus {
          border-color: rgb(37 99 235);
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   RESULTADO DA BUSCA
========================================================= */

function ResultadoProduto({
  produto,
  onAdd,
}: {
  produto: Produto;
  onAdd: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ${
        produto.pode_vender
          ? "ring-slate-200"
          : "ring-orange-200"
      }`}
    >
      <div className="flex gap-3 p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-50">
          <img
            src={produto.imagem}
            alt={produto.nome}
            className="h-full w-full object-contain p-1"
            onError={(e) => {
              e.currentTarget.src =
                "/produtos/caixa-padrao.png";
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-black leading-tight">
            {produto.nome}
          </div>

          <div className="mt-1 text-xs font-bold text-slate-500">
            EAN {produto.ean || "—"}
          </div>

          {(produto.apresentacao ||
            produto.laboratorio) && (
            <div className="mt-1 truncate text-xs text-slate-500">
              {produto.apresentacao || ""}
              {produto.apresentacao &&
              produto.laboratorio
                ? " • "
                : ""}
              {produto.laboratorio || ""}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {produto.pode_vender ? (
              <>
                <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-black text-green-800">
                  ESTOQUE {produto.estoque}
                </span>

                <span className="text-lg font-black text-blue-900">
                  {brl(produto.preco_venda)}
                </span>
              </>
            ) : (
              <>
                <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black text-orange-800">
                  SOMENTE CONSULTA
                </span>

                {produto.preco_consulta > 0 && (
                  <span className="font-black text-slate-700">
                    {brl(produto.preco_consulta)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={!produto.pode_vender}
          className={`flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-xl ${
            produto.pode_vender
              ? "bg-green-600 text-white"
              : "cursor-not-allowed bg-slate-100 text-slate-400"
          }`}
          title={
            produto.pode_vender
              ? "Adicionar"
              : "Somente consulta"
          }
        >
          <Plus size={22} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ITEM DO CARRINHO
========================================================= */

function ItemCarrinho({
  item,
  onQtd,
  onRemove,
  onDesconto,
}: {
  item: Item;
  onQtd: (delta: number) => void;
  onRemove: () => void;
  onDesconto: (
    tipo: TipoDesconto,
    valor: number
  ) => void;
}) {
  const precoFinal = precoLiquidoItem(item);

  const totalItem =
    precoFinal * Number(item.qtd || 0);

  return (
    <div className="p-3">
      <div className="flex gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-50">
          <img
            src={item.imagem}
            alt={item.nome}
            className="h-full w-full object-contain p-1"
            onError={(e) => {
              e.currentTarget.src =
                "/produtos/caixa-padrao.png";
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-black leading-tight">
            {item.nome}
          </div>

          <div className="mt-1 text-xs font-bold text-slate-500">
            {brl(item.preco_venda)} • Estoque{" "}
            {item.estoque}
          </div>

          {item.desconto > 0 && (
            <div className="mt-1 text-xs font-black text-green-700">
              Final: {brl(precoFinal)} / un.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <div className="mb-1 text-[10px] font-black uppercase text-slate-400">
            Quantidade
          </div>

          <div className="flex items-center rounded-xl border bg-white">
            <button
              type="button"
              onClick={() => onQtd(-1)}
              className="p-3"
            >
              <Minus size={16} />
            </button>

            <div className="min-w-10 text-center font-black">
              {item.qtd}
            </div>

            <button
              type="button"
              onClick={() => onQtd(1)}
              disabled={item.qtd >= item.estoque}
              className="p-3 disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="min-w-[100px] flex-1">
          <div className="mb-1 text-[10px] font-black uppercase text-slate-400">
            Desconto
          </div>

          <div className="flex overflow-hidden rounded-xl border">
            <select
              value={item.descontoTipo}
              onChange={(e) =>
                onDesconto(
                  e.target.value as TipoDesconto,
                  item.desconto
                )
              }
              className="border-r bg-slate-50 px-2 text-xs font-black outline-none"
            >
              <option value="PERCENTUAL">%</option>
              <option value="VALOR">R$</option>
            </select>

            <input
              value={
                item.desconto === 0
                  ? ""
                  : String(item.desconto).replace(
                      ".",
                      ","
                    )
              }
              onChange={(e) =>
                onDesconto(
                  item.descontoTipo,
                  numero(e.target.value)
                )
              }
              inputMode="decimal"
              placeholder="0"
              className="min-w-0 flex-1 px-2 py-3 font-black outline-none"
            />
          </div>
        </div>

        <div className="ml-auto text-right">
          <div className="text-[10px] font-black uppercase text-slate-400">
            Total
          </div>

          <div className="text-lg font-black text-slate-950">
            {brl(totalItem)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGAMENTO
========================================================= */

function PagamentoLinha({
  pagamento,
  podeRemover,
  onChange,
  onRemove,
}: {
  pagamento: Pagamento;
  podeRemover: boolean;
  onChange: (patch: Partial<Pagamento>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2">
      <select
        value={pagamento.forma}
        onChange={(e) =>
          onChange({
            forma: e.target.value as Forma,
          })
        }
        className="w-[42%] rounded-xl border-2 border-slate-200 bg-white px-2 py-3 text-sm font-black outline-none focus:border-blue-600"
      >
        <option value="Dinheiro">
          Dinheiro
        </option>

        <option value="Pix">Pix</option>

        <option value="Débito">
          Débito
        </option>

        <option value="Crédito">
          Crédito
        </option>
      </select>

      <div className="flex min-w-0 flex-1 items-center rounded-xl border-2 border-slate-200 bg-white px-3 focus-within:border-blue-600">
        <span className="mr-2 text-xs font-black text-slate-500">
          R$
        </span>

        <input
          value={pagamento.valor}
          onChange={(e) =>
            onChange({
              valor: e.target.value,
            })
          }
          inputMode="decimal"
          placeholder="0,00"
          className="min-w-0 flex-1 py-3 font-black outline-none"
        />
      </div>

      {podeRemover && (
        <button
          type="button"
          onClick={onRemove}
          className="flex w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"
        >
          <X size={17} />
        </button>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENTES PEQUENOS
========================================================= */

function PDVField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <div className="mb-1 text-xs font-black text-slate-600">
        {label}
      </div>

      {children}
    </label>
  );
}

function ResumoLinha({
  label,
  valor,
  destaque,
  grande,
}: {
  label: string;
  valor: string;
  destaque?: "verde" | "vermelho";
  grande?: boolean;
}) {
  let cor = "text-slate-900";

  if (destaque === "verde") {
    cor = "text-green-700";
  }

  if (destaque === "vermelho") {
    cor = "text-red-600";
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={
          grande
            ? "font-black"
            : "font-bold text-slate-500"
        }
      >
        {label}
      </span>

      <span
        className={`${cor} ${
          grande
            ? "text-xl font-black"
            : "font-black"
        }`}
      >
        {valor}
      </span>
    </div>
  );
}

function Atalho({
  label,
  descricao,
}: {
  label: string;
  descricao: string;
}) {
  return (
    <div className="rounded-xl border bg-white px-3 py-2 shadow-sm">
      <span className="mr-2 rounded bg-slate-900 px-2 py-1 text-[10px] font-black text-white">
        {label}
      </span>

      <span className="text-xs font-bold text-slate-600">
        {descricao}
      </span>
    </div>
  );
}