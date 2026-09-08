"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Barcode,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ImageIcon,
  Loader2,
  Package,
  PackagePlus,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";

import { createClient } from "@supabase/supabase-js";

/* =========================================================
   DROGARIA REDE FABIANO
   ADMIN PRODUTOS — MOBILE / MODERNO
   ========================================================= */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FARMACIA_SLUG = "drogariaredefabiano";
const SENHA_ADMIN = "102030";

const VIEW = "fv_produtos_loja_view";
const WRITE_TABLE = "fv_farmacia_produtos";
const PROD_TABLE = "fv_produtos";

const PAGE_SIZE = 30;

/* =========================================================
   TIPOS
   ========================================================= */

type ViewRow = {
  farmacia_slug: string;
  produto_id: string;

  ean: string | null;
  nome: string | null;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;

  imagens: any | null;

  disponivel_farmacia: boolean | null;

  estoque: number | null;

  preco_custo: number | null;
  preco_venda: number | null;

  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;

  destaque_home: boolean | null;
};

type RowUI = ViewRow & {
  _dirty?: boolean;
  _saving?: boolean;
  _error?: string | null;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => {
  detect: (
    source: ImageBitmapSource
  ) => Promise<
    Array<{
      rawValue?: string;
      format?: string;
    }>
  >;
};

/* =========================================================
   HELPERS
   ========================================================= */

function onlyDigits(value: string) {
  return (value || "").replace(/\D/g, "");
}

function brl(value: number | null | undefined) {
  const n = Number(value || 0);

  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function numberFromInput(value: string) {
  if (value.trim() === "") return null;

  /*
    Aceita:
    10
    10.50
    10,50
  */

  let normalized = value.trim();

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(",", ".");
  }

  const n = Number(normalized);

  return Number.isFinite(n) ? n : null;
}

function normalizeImgs(value: any): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      return value.trim() ? [value.trim()] : [];
    }
  }

  return [];
}

function firstImg(value: any) {
  const imgs = normalizeImgs(value);

  return imgs.length > 0
    ? imgs[0]
    : "/produtos/caixa-padrao.png";
}

function cleanUrl(url: string) {
  return (url || "").trim().replace(/\s+/g, "");
}

function isValidHttpUrl(url: string) {
  try {
    const parsed = new URL(url);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function urlsToJsonb(text: string): string[] {
  const lines = (text || "")
    .split("\n")
    .map((line) => cleanUrl(line))
    .filter(Boolean);

  const valid = lines.filter(isValidHttpUrl);

  return Array.from(new Set(valid));
}

function escapeForILike(term: string) {
  return term
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .replace(/,+/g, " ")
    .trim();
}

function stockStyle(stock: number) {
  if (stock <= 0) {
    return {
      label: "SEM ESTOQUE",
      className:
        "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (stock <= 5) {
    return {
      label: "ESTOQUE BAIXO",
      className:
        "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    label: "EM ESTOQUE",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}

/* =========================================================
   COMPONENTE
   ========================================================= */

export default function AdminProdutosFabiano() {
  /* =======================================================
     LOGIN
     ======================================================= */

  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");

  /* =======================================================
     GERAL
     ======================================================= */

  const [carregando, setCarregando] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  /*
    IMPORTANTE:

    A tela nova NÃO abre despejando o estoque inteiro.

    O usuário pesquisa pelo:
    - nome
    - EAN
    - laboratório
    - apresentação

    ou usa a câmera.
  */

  const [jaPesquisou, setJaPesquisou] = useState(false);

  const [rows, setRows] = useState<RowUI[]>([]);

  const rowsRef = useRef<RowUI[]>([]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  /* =======================================================
     BUSCA
     ======================================================= */

  const [busca, setBusca] = useState("");

  const buscaRef = useRef<HTMLInputElement | null>(null);

  const [somenteAtivos, setSomenteAtivos] = useState(false);
  const [somenteComEstoque, setSomenteComEstoque] =
    useState(false);

  /* =======================================================
     PAGINAÇÃO
     ======================================================= */

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = useMemo(() => {
    if (!totalCount) return 1;

    return Math.max(
      1,
      Math.ceil(totalCount / PAGE_SIZE)
    );
  }, [totalCount]);

  /* =======================================================
     AUTOSAVE
     ======================================================= */

  const timersRef = useRef<Record<string, any>>({});

  /* =======================================================
     MODAL IMAGEM
     ======================================================= */

  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [imgProduto, setImgProduto] =
    useState<RowUI | null>(null);

  const [imgTextarea, setImgTextarea] = useState("");
  const [imgSaving, setImgSaving] = useState(false);

  /* =======================================================
     NOVO PRODUTO
     ======================================================= */

  const [novoOpen, setNovoOpen] = useState(false);
  const [novoSaving, setNovoSaving] = useState(false);

  const [novoEAN, setNovoEAN] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoLab, setNovoLab] = useState("");
  const [novoCategoria, setNovoCategoria] = useState("");
  const [novoApresentacao, setNovoApresentacao] =
    useState("");

  const [novoImgs, setNovoImgs] = useState("");

  const [novoAtivo, setNovoAtivo] = useState(true);
  const [novoDestaque, setNovoDestaque] = useState(false);

  const [novoEstoque, setNovoEstoque] = useState("0");

  // NOVO — PREÇO DE CUSTO
  const [novoPrecoCusto, setNovoPrecoCusto] = useState("");

  const [novoPreco, setNovoPreco] = useState("");

  const [novoPromo, setNovoPromo] = useState(false);
  const [novoPrecoPromo, setNovoPrecoPromo] = useState("");
  const [novoOff, setNovoOff] = useState("");

  /* =======================================================
     CÂMERA / LEITOR EAN
     ======================================================= */

  const [cameraOpen, setCameraOpen] = useState(false);

  const [cameraTarget, setCameraTarget] = useState<
    "busca" | "novo"
  >("busca");

  const [cameraErro, setCameraErro] =
    useState<string | null>(null);

  const [cameraLendo, setCameraLendo] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const scanTimerRef = useRef<any>(null);

  /* =======================================================
     TOAST
     ======================================================= */

  function toast(message: string) {
    setToastMsg(message);

    window.clearTimeout((toast as any)._timer);

    (toast as any)._timer = window.setTimeout(() => {
      setToastMsg(null);
    }, 2200);
  }

  /* =======================================================
     LOGIN
     ======================================================= */

  function autenticar() {
    if (senha === SENHA_ADMIN) {
      setAutenticado(true);
      setSenha("");

      setTimeout(() => {
        buscaRef.current?.focus();
      }, 250);

      return;
    }

    alert("Senha incorreta!");
  }

  /* =======================================================
     LIMPAR BUSCA
     ======================================================= */

  function limparBusca() {
    setBusca("");
    setRows([]);
    setTotalCount(0);
    setPage(1);
    setJaPesquisou(false);

    setSomenteAtivos(false);
    setSomenteComEstoque(false);

    setTimeout(() => {
      buscaRef.current?.focus();
    }, 100);
  }

  /* =======================================================
     BUSCAR PRODUTOS
     ======================================================= */

  const carregar = useCallback(
    async (
      pagina = 1,
      termoForcado?: string
    ) => {
      const termo = (
        termoForcado !== undefined
          ? termoForcado
          : busca
      ).trim();

      /*
        Diferente da versão antiga:
        não busca todos os produtos quando campo está vazio.
      */

      if (!termo) {
        setRows([]);
        setTotalCount(0);
        setJaPesquisou(false);
        setCarregando(false);

        return;
      }

      try {
        setCarregando(true);
        setJaPesquisou(true);

        const digits = onlyDigits(termo);

        const from =
          (pagina - 1) * PAGE_SIZE;

        const to =
          from + PAGE_SIZE - 1;

        let query = supabase
          .from(VIEW)
          .select(
            `
              farmacia_slug,
              produto_id,
              ean,
              nome,
              laboratorio,
              categoria,
              apresentacao,
              imagens,
              disponivel_farmacia,
              estoque,
              preco_custo,
              preco_venda,
              em_promocao,
              preco_promocional,
              percentual_off,
              destaque_home
            `,
            {
              count: "exact",
            }
          )
          .eq(
            "farmacia_slug",
            FARMACIA_SLUG
          );

        if (somenteAtivos) {
          query = query.eq(
            "disponivel_farmacia",
            true
          );
        }

        if (somenteComEstoque) {
          query = query.gt("estoque", 0);
        }

        /*
          Se for código de barras:
          prioriza EAN.

          Ex:
          7891058001158
        */

        if (
          digits.length >= 6 &&
          digits === termo.replace(/\s/g, "")
        ) {
          query = query.ilike(
            "ean",
            `%${digits}%`
          );
        } else {
          const safe =
            escapeForILike(termo);

          query = query.or(
            [
              `nome.ilike.%${safe}%`,
              `laboratorio.ilike.%${safe}%`,
              `apresentacao.ilike.%${safe}%`,
              `ean.ilike.%${safe}%`,
            ].join(",")
          );
        }

        /*
          Produtos com estoque primeiro.
          Depois ordem alfabética.
        */

        query = query
          .order("estoque", {
            ascending: false,
            nullsFirst: false,
          })
          .order("nome", {
            ascending: true,
          })
          .range(from, to);

        const {
          data,
          error,
          count,
        } = await query;

        if (error) throw error;

        const list: RowUI[] = (
          data || []
        ).map((item: any) => ({
          ...item,

          preco_custo:
            item.preco_custo == null
              ? null
              : Number(item.preco_custo),

          preco_venda:
            item.preco_venda == null
              ? null
              : Number(item.preco_venda),

          estoque:
            item.estoque == null
              ? 0
              : Number(item.estoque),

          _dirty: false,
          _saving: false,
          _error: null,
        }));

        setRows(list);

        setTotalCount(
          Number(count || 0)
        );

        setPage(pagina);
      } catch (error: any) {
        console.error(error);

        setRows([]);
        setTotalCount(0);

        alert(
          error?.message ||
            "Erro ao buscar produtos."
        );
      } finally {
        setCarregando(false);
      }
    },
    [
      busca,
      somenteAtivos,
      somenteComEstoque,
    ]
  );

  /* =======================================================
     ENTER NA BUSCA
     ======================================================= */

  function handleBuscaKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key !== "Enter") return;

    event.preventDefault();

    setPage(1);

    carregar(1);
  }

  /* =======================================================
     BUSCA COM DEBOUNCE
     ======================================================= */

  useEffect(() => {
    if (!autenticado) return;

    const termo = busca.trim();

    if (!termo) {
      setRows([]);
      setTotalCount(0);
      setJaPesquisou(false);

      return;
    }

    /*
      Para EAN lido pela câmera ou digitado,
      não precisa esperar muito.
    */

    const digits = onlyDigits(termo);

    const delay =
      digits.length >= 8
        ? 150
        : 500;

    const timer = window.setTimeout(() => {
      setPage(1);

      carregar(1);
    }, delay);

    return () =>
      window.clearTimeout(timer);
  }, [
    busca,
    autenticado,
    somenteAtivos,
    somenteComEstoque,
    carregar,
  ]);

  /* =======================================================
     ALTERAR CAMPO
     ======================================================= */

  function setField(
    produtoId: string,
    patch: Partial<RowUI>,
    autosave = true
  ) {
    setRows((prev) =>
      prev.map((item) =>
        item.produto_id === produtoId
          ? {
              ...item,
              ...patch,
              _dirty: true,
              _error: null,
            }
          : item
      )
    );

    if (autosave) {
      agendarSalvar(produtoId);
    }
  }

  /* =======================================================
     AUTOSAVE
     ======================================================= */

  function agendarSalvar(
    produtoId: string,
    ms = 700
  ) {
    if (timersRef.current[produtoId]) {
      window.clearTimeout(
        timersRef.current[produtoId]
      );
    }

    timersRef.current[produtoId] =
      window.setTimeout(() => {
        salvarAgora(produtoId);

        timersRef.current[produtoId] =
          null;
      }, ms);
  }

  /* =======================================================
     SALVAR PRODUTO
     ======================================================= */

  async function salvarAgora(
    produtoId: string
  ) {
    const row =
      rowsRef.current.find(
        (item) =>
          item.produto_id === produtoId
      );

    if (!row) return;

    const imgs =
      normalizeImgs(row.imagens);

    const estoque =
      Math.max(
        0,
        Number(row.estoque || 0)
      );

    const precoCusto =
      row.preco_custo == null
        ? null
        : Number(row.preco_custo);

    const precoVenda =
      row.preco_venda == null
        ? null
        : Number(row.preco_venda);

    const precoPromo =
      row.preco_promocional == null
        ? null
        : Number(
            row.preco_promocional
          );

    const percentualOff =
      row.percentual_off == null
        ? null
        : Number(row.percentual_off);

    const payload = {
      farmacia_slug:
        FARMACIA_SLUG,

      produto_id:
        row.produto_id,

      ativo:
        !!row.disponivel_farmacia,

      estoque,

      // NOVO
      preco_custo: precoCusto,

      preco_venda: precoVenda,

      em_promocao:
        !!row.em_promocao,

      preco_promocional:
        precoPromo,

      percentual_off:
        percentualOff,

      destaque_home:
        !!row.destaque_home,

      imagens:
        imgs.length
          ? imgs
          : null,
    };

    setRows((prev) =>
      prev.map((item) =>
        item.produto_id === produtoId
          ? {
              ...item,
              _saving: true,
              _error: null,
            }
          : item
      )
    );

    try {
      const { error } =
        await supabase
          .from(WRITE_TABLE)
          .upsert(payload, {
            onConflict:
              "farmacia_slug,produto_id",
          });

      if (error) throw error;

      setRows((prev) =>
        prev.map((item) =>
          item.produto_id === produtoId
            ? {
                ...item,
                _saving: false,
                _dirty: false,
                _error: null,
              }
            : item
        )
      );

      toast("Produto salvo");
    } catch (error: any) {
      console.error(error);

      setRows((prev) =>
        prev.map((item) =>
          item.produto_id === produtoId
            ? {
                ...item,
                _saving: false,
                _error:
                  error?.message ||
                  "Erro ao salvar",
              }
            : item
        )
      );

      toast("Erro ao salvar");
    }
  }

  /* =======================================================
     IMAGENS
     ======================================================= */

  function abrirModalImagens(
    row: RowUI
  ) {
    setImgProduto(row);

    setImgTextarea(
      normalizeImgs(
        row.imagens
      ).join("\n")
    );

    setImgModalOpen(true);
  }

  function fecharModalImagens() {
    setImgModalOpen(false);
    setImgProduto(null);
    setImgTextarea("");
    setImgSaving(false);
  }

  async function salvarImagensDoModal() {
    if (!imgProduto) return;

    const imgs =
      urlsToJsonb(imgTextarea);

    const lines = (
      imgTextarea || ""
    )
      .split("\n")
      .map((line) =>
        cleanUrl(line)
      )
      .filter(Boolean);

    const invalid =
      lines.filter(
        (url) =>
          !isValidHttpUrl(url)
      );

    if (invalid.length > 0) {
      alert(
        "Existe uma URL inválida.\n\nAs imagens precisam começar com http:// ou https://"
      );

      return;
    }

    setImgSaving(true);

    try {
      const { error } =
        await supabase
          .from(WRITE_TABLE)
          .upsert(
            {
              farmacia_slug:
                FARMACIA_SLUG,

              produto_id:
                imgProduto.produto_id,

              imagens:
                imgs.length
                  ? imgs
                  : null,
            },
            {
              onConflict:
                "farmacia_slug,produto_id",
            }
          );

      if (error) throw error;

      setRows((prev) =>
        prev.map((item) =>
          item.produto_id ===
          imgProduto.produto_id
            ? {
                ...item,

                imagens:
                  imgs.length
                    ? imgs
                    : null,

                _dirty: false,
                _error: null,
              }
            : item
        )
      );

      toast("Imagens salvas");

      fecharModalImagens();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          "Erro ao salvar imagens."
      );
    } finally {
      setImgSaving(false);
    }
  }

  /* =======================================================
     NOVO PRODUTO
     ======================================================= */

  function abrirNovoProduto(
    eanInicial = ""
  ) {
    setNovoEAN(eanInicial);

    setNovoNome("");
    setNovoLab("");
    setNovoCategoria("");
    setNovoApresentacao("");
    setNovoImgs("");

    setNovoAtivo(true);
    setNovoDestaque(false);

    setNovoEstoque("0");

    setNovoPrecoCusto("");
    setNovoPreco("");

    setNovoPromo(false);
    setNovoPrecoPromo("");
    setNovoOff("");

    setNovoSaving(false);
    setNovoOpen(true);
  }

  function fecharNovoProduto() {
    setNovoOpen(false);
    setNovoSaving(false);
  }

  /* =======================================================
     SALVAR NOVO PRODUTO
     ======================================================= */

  async function salvarNovoProduto() {
    const eanDigits =
      onlyDigits(novoEAN);

    if (eanDigits.length < 6) {
      alert(
        "EAN inválido. Digite ou leia o código de barras."
      );

      return;
    }

    if (!novoNome.trim()) {
      alert(
        "Digite o nome do produto."
      );

      return;
    }

    const imgs =
      urlsToJsonb(novoImgs);

    const lines = (
      novoImgs || ""
    )
      .split("\n")
      .map((line) =>
        cleanUrl(line)
      )
      .filter(Boolean);

    const invalid =
      lines.filter(
        (url) =>
          !isValidHttpUrl(url)
      );

    if (invalid.length > 0) {
      alert(
        "Existe uma URL de imagem inválida."
      );

      return;
    }

    const estoqueNum =
      Math.max(
        0,
        Number(novoEstoque || 0)
      );

    const precoCustoNum =
      numberFromInput(
        novoPrecoCusto
      );

    const precoVendaNum =
      numberFromInput(
        novoPreco
      );

    const precoPromoNum =
      numberFromInput(
        novoPrecoPromo
      );

    const offNum =
      numberFromInput(
        novoOff
      );

    setNovoSaving(true);

    try {
      /*
        1 — Procura EAN na base master.
      */

      const {
        data: encontrado,
        error: erroBusca,
      } = await supabase
        .from(PROD_TABLE)
        .select("id")
        .eq("ean", eanDigits)
        .limit(1);

      if (erroBusca) {
        throw erroBusca;
      }

      let produtoId:
        | string
        | null =
        encontrado?.[0]?.id ??
        null;

      /*
        2 — Se não existir,
        cria produto master.
      */

      if (!produtoId) {
        const {
          data: criado,
          error: erroCriacao,
        } = await supabase
          .from(PROD_TABLE)
          .insert({
            ean: eanDigits,

            nome:
              novoNome.trim(),

            laboratorio:
              novoLab.trim() ||
              null,

            categoria:
              novoCategoria.trim() ||
              null,

            apresentacao:
              novoApresentacao.trim() ||
              null,

            imagens:
              imgs.length
                ? imgs
                : null,

            pmc: 0,
          })
          .select("id")
          .single();

        if (erroCriacao) {
          throw erroCriacao;
        }

        produtoId =
          criado?.id ?? null;
      } else {
        /*
          Produto já existe:
          atualiza informações master.
        */

        const {
          error: erroUpdate,
        } = await supabase
          .from(PROD_TABLE)
          .update({
            nome:
              novoNome.trim(),

            laboratorio:
              novoLab.trim() ||
              null,

            categoria:
              novoCategoria.trim() ||
              null,

            apresentacao:
              novoApresentacao.trim() ||
              null,

            imagens:
              imgs.length
                ? imgs
                : null,

            pmc: 0,
          })
          .eq(
            "id",
            produtoId
          );

        if (erroUpdate) {
          throw erroUpdate;
        }
      }

      if (!produtoId) {
        throw new Error(
          "Não foi possível obter o ID do produto."
        );
      }

      /*
        3 — Vincula o produto à
        Drogaria Rede Fabiano.

        Aqui entram:
        - estoque
        - custo
        - venda
        - promoção
      */

      const {
        error: erroLoja,
      } = await supabase
        .from(WRITE_TABLE)
        .upsert(
          {
            farmacia_slug:
              FARMACIA_SLUG,

            produto_id:
              produtoId,

            ativo:
              !!novoAtivo,

            estoque:
              estoqueNum,

            // NOVO
            preco_custo:
              precoCustoNum,

            preco_venda:
              precoVendaNum,

            em_promocao:
              !!novoPromo,

            preco_promocional:
              precoPromoNum,

            percentual_off:
              offNum,

            destaque_home:
              !!novoDestaque,

            imagens:
              imgs.length
                ? imgs
                : null,
          },
          {
            onConflict:
              "farmacia_slug,produto_id",
          }
        );

      if (erroLoja) {
        throw erroLoja;
      }

      toast(
        "Produto cadastrado com sucesso"
      );

      fecharNovoProduto();

      /*
        Após cadastrar:
        pesquisa automaticamente
        o EAN cadastrado.
      */

      setBusca(eanDigits);
      setPage(1);

      await carregar(
        1,
        eanDigits
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          "Erro ao cadastrar produto."
      );
    } finally {
      setNovoSaving(false);
    }
  }

  /* =======================================================
     CÂMERA
     ======================================================= */

  function pararCamera() {
    if (scanTimerRef.current) {
      window.clearInterval(
        scanTimerRef.current
      );

      scanTimerRef.current =
        null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setCameraLendo(false);
  }

  function fecharCamera() {
    pararCamera();

    setCameraOpen(false);
    setCameraErro(null);
  }

  async function abrirCamera(
    target:
      | "busca"
      | "novo" = "busca"
  ) {
    setCameraTarget(target);
    setCameraErro(null);
    setCameraOpen(true);
  }

  /* =======================================================
     RECEBE CÓDIGO DA CÂMERA
     ======================================================= */

  async function codigoDetectado(
    codigo: string
  ) {
    const ean =
      onlyDigits(codigo);

    if (ean.length < 6) return;

    /*
      Evita múltiplas leituras
      do mesmo código.
    */

    pararCamera();

    setCameraOpen(false);

    if (
      cameraTarget === "novo"
    ) {
      setNovoEAN(ean);

      toast(
        `Código lido: ${ean}`
      );

      return;
    }

    /*
      Se a câmera foi aberta
      pela busca:
    */

    setBusca(ean);
    setPage(1);

    toast(
      `Código lido: ${ean}`
    );

    await carregar(
      1,
      ean
    );
  }

  /* =======================================================
     INICIALIZA LEITOR DE CÓDIGO
     ======================================================= */

  useEffect(() => {
    if (!cameraOpen) return;

    let cancelado = false;

    async function iniciar() {
      try {
        setCameraErro(null);
        setCameraLendo(true);

        /*
          Preferência pela câmera traseira.
        */

        const stream =
          await navigator.mediaDevices.getUserMedia({
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
          });

        if (cancelado) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        streamRef.current =
          stream;

        if (!videoRef.current) {
          return;
        }

        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();

        /*
          BarcodeDetector é suportado
          principalmente em navegadores
          Chromium/Android.

          O modal do Bloco 2 também
          terá entrada manual caso
          o aparelho não suporte.
        */

        const Detector =
          (
            window as any
          ).BarcodeDetector as
            | BarcodeDetectorConstructor
            | undefined;

        if (!Detector) {
          setCameraErro(
            "Este navegador não possui leitura automática de código de barras. Você ainda pode usar a câmera e digitar o EAN manualmente."
          );

          setCameraLendo(false);

          return;
        }

        const detector =
          new Detector({
            formats: [
              "ean_13",
              "ean_8",
              "upc_a",
              "upc_e",
              "code_128",
              "code_39",
            ],
          });

        scanTimerRef.current =
          window.setInterval(
            async () => {
              try {
                const video =
                  videoRef.current;

                if (
                  !video ||
                  video.readyState <
                    2
                ) {
                  return;
                }

                const results =
                  await detector.detect(
                    video
                  );

                if (
                  results.length === 0
                ) {
                  return;
                }

                const raw =
                  results[0]
                    ?.rawValue;

                if (!raw) return;

                await codigoDetectado(
                  raw
                );
              } catch {
                /*
                  Ignora falhas
                  momentâneas de frame.
                */
              }
            },
            450
          );
      } catch (error: any) {
        console.error(error);

        setCameraLendo(false);

        if (
          error?.name ===
          "NotAllowedError"
        ) {
          setCameraErro(
            "Permissão da câmera negada. Libere o acesso à câmera no navegador."
          );

          return;
        }

        setCameraErro(
          "Não foi possível abrir a câmera deste aparelho."
        );
      }
    }

    /*
      Pequeno delay para o modal
      renderizar o <video>.
    */

    const timer =
      window.setTimeout(
        iniciar,
        120
      );

    return () => {
      cancelado = true;

      window.clearTimeout(
        timer
      );

      pararCamera();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen]);

  /* =======================================================
     PAGINAÇÃO
     ======================================================= */

  async function paginaAnterior() {
    if (page <= 1) return;

    const nova =
      page - 1;

    await carregar(nova);
  }

  async function proximaPagina() {
    if (
      page >= totalPages
    ) {
      return;
    }

    const nova =
      page + 1;

    await carregar(nova);
  }

  /* =======================================================
     RESUMO DOS RESULTADOS
     ======================================================= */

  const resumo = useMemo(() => {
    let estoqueTotal = 0;
    let ativos = 0;
    let zerados = 0;

    rows.forEach((row) => {
      const estoque =
        Math.max(
          0,
          Number(row.estoque || 0)
        );

      estoqueTotal += estoque;

      if (
        row.disponivel_farmacia
      ) {
        ativos++;
      }

      if (estoque <= 0) {
        zerados++;
      }
    });

    return {
      estoqueTotal,
      ativos,
      zerados,
    };
  }, [rows]);

  /* =========================================================
     BLOCO 1 TERMINA AQUI

     NÃO FECHE O COMPONENTE.

     O BLOCO 2 COMEÇA COM:

     if (!autenticado) {
       return (
         ...
       );
     }

     e contém todo o novo layout:
     - Login moderno
     - Cabeçalho mobile
     - Busca grande
     - Botão câmera
     - Cards de produto
     - Preço de custo
     - Preço de venda
     - Estoque
     - Ativo
     - Promoção
     - Modal câmera
     - Modal novo produto
     - Modal imagens
     ========================================================= */
       /* =========================================================
     LOGIN
     ========================================================= */

  if (!autenticado) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[28px] shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-7 text-white">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-5">
                <Package className="w-7 h-7" />
              </div>

              <p className="text-blue-100 text-sm font-medium">
                Drogaria Rede Fabiano
              </p>

              <h1 className="text-2xl font-black mt-1">
                Admin Produtos
              </h1>

              <p className="text-sm text-blue-100 mt-2">
                Estoque, custo, venda e produtos em um só lugar.
              </p>
            </div>

            <div className="p-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Senha administrativa
              </label>

              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") autenticar();
                }}
                placeholder="Digite sua senha"
                className="w-full h-12 border border-slate-200 rounded-2xl px-4 text-center text-lg outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                autoFocus
              />

              <button
                onClick={autenticar}
                className="mt-4 w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition text-white font-bold shadow-lg shadow-blue-200"
              >
                Entrar no Admin
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Package className="w-4 h-4" />
                Controle de produtos Rede Fabiano
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     ADMIN
     ========================================================= */

  return (
    <main className="min-h-screen bg-slate-100 pb-28">
      {/* =====================================================
          TOPO
          ===================================================== */}

      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-5">
          <div className="h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => window.history.back()}
                className="w-10 h-10 shrink-0 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 shrink-0" />

                  <h1 className="font-black text-base sm:text-xl truncate">
                    Admin Produtos
                  </h1>
                </div>

                <p className="text-[11px] sm:text-xs text-blue-100 truncate">
                  Drogaria Rede Fabiano
                </p>
              </div>
            </div>

            <button
              onClick={() => abrirNovoProduto()}
              className="shrink-0 h-10 px-3 sm:px-4 rounded-xl bg-white text-blue-700 font-black text-sm flex items-center gap-2 shadow"
            >
              <PackagePlus className="w-5 h-5" />

              <span className="hidden sm:inline">
                Novo Produto
              </span>

              <span className="sm:hidden">
                Novo
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4">
        {/* ===================================================
            BUSCA PRINCIPAL
            =================================================== */}

        <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-3 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>

            <div>
              <h2 className="font-black text-slate-900">
                Localizar produto
              </h2>

              <p className="text-xs text-slate-500">
                Nome, código de barras, laboratório ou apresentação
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

              <input
                ref={buscaRef}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={handleBuscaKeyDown}
                placeholder="Digite ou leia o código..."
                className="w-full h-14 pl-12 pr-11 rounded-2xl border-2 border-slate-200 bg-slate-50 outline-none text-base font-semibold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                inputMode="search"
                autoComplete="off"
              />

              {busca && (
                <button
                  onClick={limparBusca}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => abrirCamera("busca")}
              className="w-14 h-14 shrink-0 rounded-2xl bg-slate-900 hover:bg-black text-white flex items-center justify-center shadow-md active:scale-95 transition"
              title="Ler código de barras"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:flex gap-2">
            <button
              onClick={() => abrirCamera("busca")}
              className="h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 font-bold text-sm flex items-center justify-center gap-2"
            >
              <Barcode className="w-4 h-4" />
              Ler código
            </button>

            <button
              onClick={() => carregar(1)}
              disabled={!busca.trim() || carregando}
              className="h-10 rounded-xl bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              {carregando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}

              Buscar
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSomenteAtivos((v) => !v)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition ${
                somenteAtivos
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              Somente ativos
            </button>

            <button
              onClick={() => setSomenteComEstoque((v) => !v)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition ${
                somenteComEstoque
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              Com estoque
            </button>

            {jaPesquisou && (
              <button
                onClick={() => carregar(page)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    carregando ? "animate-spin" : ""
                  }`}
                />
                Atualizar
              </button>
            )}
          </div>
        </section>

        {/* ===================================================
            TOAST
            =================================================== */}

        {toastMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 max-w-[90vw]">
            <Check className="w-4 h-4 text-emerald-400" />
            {toastMsg}
          </div>
        )}

        {/* ===================================================
            TELA INICIAL
            =================================================== */}

        {!jaPesquisou && !carregando && (
          <section className="mt-4">
            <div className="bg-white border border-slate-200 rounded-[24px] p-7 sm:p-10 text-center shadow-sm">
              <div className="w-20 h-20 mx-auto rounded-[24px] bg-blue-50 text-blue-600 flex items-center justify-center">
                <Barcode className="w-10 h-10" />
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-900">
                Busque um produto
              </h2>

              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                Digite o nome ou código de barras. No celular, você também pode
                usar a câmera para localizar o produto rapidamente.
              </p>

              <button
                onClick={() => abrirCamera("busca")}
                className="mt-5 h-12 px-6 rounded-2xl bg-blue-600 text-white font-black inline-flex items-center gap-2 shadow-lg shadow-blue-100"
              >
                <Camera className="w-5 h-5" />
                Abrir câmera
              </button>
            </div>
          </section>
        )}

        {/* ===================================================
            LOADING
            =================================================== */}

        {carregando && (
          <section className="mt-4 bg-white border rounded-[24px] py-14 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />

            <p className="mt-3 text-sm font-bold text-slate-600">
              Buscando produtos...
            </p>
          </section>
        )}

        {/* ===================================================
            NADA ENCONTRADO
            =================================================== */}

        {!carregando &&
          jaPesquisou &&
          rows.length === 0 && (
            <section className="mt-4 bg-white border border-slate-200 rounded-[24px] p-8 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />

              <h3 className="mt-4 font-black text-slate-900">
                Produto não encontrado
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Nenhum produto corresponde a “{busca}”.
              </p>

              <button
                onClick={() => abrirNovoProduto(onlyDigits(busca))}
                className="mt-5 h-11 px-5 rounded-xl bg-emerald-600 text-white font-bold inline-flex items-center gap-2"
              >
                <PackagePlus className="w-5 h-5" />
                Cadastrar produto
              </button>
            </section>
          )}

        {/* ===================================================
            RESUMO
            =================================================== */}

        {!carregando && rows.length > 0 && (
          <>
            <section className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-white rounded-2xl border p-3 sm:p-4">
                <div className="text-[10px] sm:text-xs uppercase font-black text-slate-400">
                  Encontrados
                </div>

                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {totalCount}
                </div>
              </div>

              <div className="bg-white rounded-2xl border p-3 sm:p-4">
                <div className="text-[10px] sm:text-xs uppercase font-black text-slate-400">
                  Estoque
                </div>

                <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                  {resumo.estoqueTotal}
                </div>
              </div>

              <div className="bg-white rounded-2xl border p-3 sm:p-4">
                <div className="text-[10px] sm:text-xs uppercase font-black text-slate-400">
                  Zerados
                </div>

                <div className="text-xl sm:text-2xl font-black text-red-600 mt-1">
                  {resumo.zerados}
                </div>
              </div>
            </section>

            {/* =================================================
                CARDS DOS PRODUTOS
                ================================================= */}

            <section className="mt-4 space-y-3">
              {rows.map((r) => {
                const estoque = Math.max(
                  0,
                  Number(r.estoque || 0)
                );

                const stock = stockStyle(estoque);

                const custo =
                  r.preco_custo == null
                    ? 0
                    : Number(r.preco_custo);

                const venda =
                  r.preco_venda == null
                    ? 0
                    : Number(r.preco_venda);

                const margem =
                  custo > 0 && venda > 0
                    ? ((venda - custo) / custo) * 100
                    : null;

                return (
                  <article
                    key={r.produto_id}
                    className={`bg-white border rounded-[24px] shadow-sm overflow-hidden ${
                      r._dirty
                        ? "border-amber-300"
                        : "border-slate-200"
                    }`}
                  >
                    {/* PRODUTO */}

                    <div className="p-3 sm:p-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => abrirModalImagens(r)}
                          className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl border bg-slate-50 overflow-hidden"
                        >
                          <Image
                            src={firstImg(r.imagens)}
                            alt={r.nome || "Produto"}
                            fill
                            sizes="96px"
                            className="object-contain p-1"
                          />

                          <div className="absolute bottom-1 right-1 w-7 h-7 rounded-lg bg-white/95 shadow flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-slate-600" />
                          </div>
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-black text-slate-900 leading-tight text-base sm:text-lg">
                                {r.nome || "Produto sem nome"}
                              </h3>

                              <p className="text-xs text-slate-500 mt-1">
                                {r.laboratorio || "Sem laboratório"}

                                {r.apresentacao
                                  ? ` • ${r.apresentacao}`
                                  : ""}
                              </p>
                            </div>

                            {r._saving && (
                              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                            )}

                            {!r._saving && !r._dirty && (
                              <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600">
                              <Barcode className="w-3 h-3" />
                              {r.ean || "Sem EAN"}
                            </span>

                            {r.categoria && (
                              <span className="px-2 py-1 rounded-lg bg-blue-50 text-[11px] font-bold text-blue-700">
                                {r.categoria}
                              </span>
                            )}

                            <span
                              className={`px-2 py-1 rounded-lg border text-[10px] font-black ${stock.className}`}
                            >
                              {stock.label}
                            </span>
                          </div>

                          {r._error && (
                            <div className="mt-2 text-xs font-bold text-red-600">
                              {r._error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* =========================================
                        CUSTO / VENDA / ESTOQUE
                        ========================================= */}

                    <div className="border-t bg-slate-50/70 p-3 sm:p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {/* CUSTO */}

                        <div className="bg-white rounded-2xl border border-slate-200 p-3">
                          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                            <CircleDollarSign className="w-4 h-4" />

                            <span className="text-[10px] uppercase font-black">
                              Custo
                            </span>
                          </div>

                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              R$
                            </span>

                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              value={r.preco_custo ?? ""}
                              onChange={(e) =>
                                setField(r.produto_id, {
                                  preco_custo:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                })
                              }
                              className="w-full h-10 rounded-xl border border-slate-200 pl-8 pr-2 font-black text-right text-slate-900 outline-none focus:border-blue-500"
                              placeholder="0,00"
                            />
                          </div>

                          <div className="mt-1 text-right text-[10px] text-slate-400">
                            {r.preco_custo != null
                              ? brl(r.preco_custo)
                              : "Sem custo"}
                          </div>
                        </div>

                        {/* VENDA */}

                        <div className="bg-white rounded-2xl border border-slate-200 p-3">
                          <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                            <ShoppingCart className="w-4 h-4" />

                            <span className="text-[10px] uppercase font-black">
                              Venda
                            </span>
                          </div>

                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              R$
                            </span>

                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              value={r.preco_venda ?? ""}
                              onChange={(e) =>
                                setField(r.produto_id, {
                                  preco_venda:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                })
                              }
                              className="w-full h-10 rounded-xl border border-blue-200 bg-blue-50/30 pl-8 pr-2 font-black text-right text-blue-800 outline-none focus:border-blue-500"
                              placeholder="0,00"
                            />
                          </div>

                          <div className="mt-1 text-right text-[10px] text-slate-400">
                            {r.preco_venda != null
                              ? brl(r.preco_venda)
                              : "Sem preço"}
                          </div>
                        </div>

                        {/* ESTOQUE */}

                        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-slate-200 p-3">
                          <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                            <Package className="w-4 h-4" />

                            <span className="text-[10px] uppercase font-black">
                              Estoque
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setField(r.produto_id, {
                                  estoque: Math.max(0, estoque - 1),
                                })
                              }
                              className="w-10 h-10 rounded-xl bg-slate-100 font-black text-xl text-slate-600"
                            >
                              −
                            </button>

                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={estoque}
                              onChange={(e) =>
                                setField(r.produto_id, {
                                  estoque: Math.max(
                                    0,
                                    Number(e.target.value || 0)
                                  ),
                                })
                              }
                              className="min-w-0 flex-1 h-10 rounded-xl border border-slate-200 text-center font-black text-lg outline-none focus:border-emerald-500"
                            />

                            <button
                              onClick={() =>
                                setField(r.produto_id, {
                                  estoque: estoque + 1,
                                })
                              }
                              className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xl"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* MARGEM */}

                      {margem != null && (
                        <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-xs">
                          <span className="font-bold text-slate-500">
                            Custo {brl(custo)} → Venda {brl(venda)}
                          </span>

                          <span
                            className={`font-black ${
                              margem >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {margem.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* =========================================
                        STATUS
                        ========================================= */}

                    <div className="border-t p-3 sm:p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          onClick={() =>
                            setField(r.produto_id, {
                              disponivel_farmacia:
                                !r.disponivel_farmacia,
                            })
                          }
                          className={`h-11 rounded-xl border text-xs font-black transition ${
                            r.disponivel_farmacia
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {r.disponivel_farmacia
                            ? "✓ Ativo"
                            : "Inativo"}
                        </button>

                        <button
                          onClick={() =>
                            setField(r.produto_id, {
                              destaque_home: !r.destaque_home,
                            })
                          }
                          className={`h-11 rounded-xl border text-xs font-black flex items-center justify-center gap-1 ${
                            r.destaque_home
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-white text-slate-500 border-slate-200"
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />

                          {r.destaque_home
                            ? "Destaque"
                            : "Destacar"}
                        </button>

                        <button
                          onClick={() =>
                            setField(r.produto_id, {
                              em_promocao: !r.em_promocao,
                            })
                          }
                          className={`h-11 rounded-xl border text-xs font-black ${
                            r.em_promocao
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-white text-slate-500 border-slate-200"
                          }`}
                        >
                          {r.em_promocao
                            ? "🔥 Promoção"
                            : "Promoção"}
                        </button>

                        <button
                          onClick={() => abrirModalImagens(r)}
                          className="h-11 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-black flex items-center justify-center gap-2"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Imagem
                        </button>
                      </div>

                      {/* PROMOÇÃO */}

                      {r.em_promocao && (
                        <div className="mt-3 grid grid-cols-2 gap-2 bg-red-50/50 border border-red-100 rounded-2xl p-3">
                          <div>
                            <label className="text-[10px] uppercase font-black text-red-500">
                              Preço promocional
                            </label>

                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              value={r.preco_promocional ?? ""}
                              onChange={(e) =>
                                setField(r.produto_id, {
                                  preco_promocional:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                })
                              }
                              className="mt-1 w-full h-10 rounded-xl border border-red-200 bg-white px-3 font-black text-red-700 outline-none"
                              placeholder="R$ 0,00"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-black text-red-500">
                              Desconto %
                            </label>

                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              value={r.percentual_off ?? ""}
                              onChange={(e) =>
                                setField(r.produto_id, {
                                  percentual_off:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                })
                              }
                              className="mt-1 w-full h-10 rounded-xl border border-red-200 bg-white px-3 font-black text-red-700 outline-none"
                              placeholder="0%"
                            />
                          </div>
                        </div>
                      )}

                      {/* SALVAR */}

                      <button
                        onClick={() => salvarAgora(r.produto_id)}
                        disabled={!!r._saving}
                        className={`mt-3 w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition ${
                          r._saving
                            ? "bg-slate-200 text-slate-500"
                            : r._dirty
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {r._saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Salvando...
                          </>
                        ) : r._dirty ? (
                          <>
                            <Check className="w-4 h-4" />
                            Salvar alterações
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Produto atualizado
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* =================================================
                PAGINAÇÃO
                ================================================= */}

            <section className="mt-4 bg-white border rounded-2xl p-3 flex items-center justify-between">
              <button
                onClick={paginaAnterior}
                disabled={page <= 1 || carregando}
                className="h-10 px-3 rounded-xl border disabled:opacity-40 font-bold text-sm flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <div className="text-center">
                <div className="text-xs text-slate-400 font-bold">
                  Página
                </div>

                <div className="font-black text-slate-900">
                  {page} / {totalPages}
                </div>
              </div>

              <button
                onClick={proximaPagina}
                disabled={page >= totalPages || carregando}
                className="h-10 px-3 rounded-xl border disabled:opacity-40 font-bold text-sm flex items-center gap-1"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </section>
          </>
        )}
      </div>

      {/* =====================================================
          MODAL CÂMERA
          ===================================================== */}

      {cameraOpen && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
          <div className="h-16 px-4 flex items-center justify-between text-white">
            <div>
              <h3 className="font-black">
                Ler código de barras
              </h3>

              <p className="text-xs text-white/60">
                Aponte para o EAN do produto
              </p>
            </div>

            <button
              onClick={fecharCamera}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[88%] max-w-lg">
                <div className="h-44 border-2 border-white rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  <div className="absolute left-4 right-4 top-1/2 h-[2px] bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
                </div>

                <p className="text-white text-center text-sm font-bold mt-5">
                  Centralize o código dentro do quadro
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 pb-7">
            {cameraLendo && !cameraErro && (
              <div className="flex items-center justify-center gap-2 text-white text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Procurando código...
              </div>
            )}

            {cameraErro && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-800">
                {cameraErro}
              </div>
            )}

            <button
              onClick={fecharCamera}
              className="mt-3 w-full h-12 rounded-2xl bg-white text-slate-900 font-black"
            >
              Fechar câmera
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL IMAGENS
          ===================================================== */}

      {imgModalOpen && imgProduto && (
        <div className="fixed inset-0 z-[9998] bg-black/70 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-4 border-b flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-black text-slate-900 truncate">
                  Imagem do produto
                </h3>

                <p className="text-xs text-slate-500 truncate">
                  {imgProduto.nome}
                </p>
              </div>

              <button
                onClick={fecharModalImagens}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="w-full h-56 rounded-2xl bg-slate-50 border relative overflow-hidden">
                <Image
                  src={
                    urlsToJsonb(imgTextarea)[0] ||
                    "/produtos/caixa-padrao.png"
                  }
                  alt="Imagem"
                  fill
                  sizes="600px"
                  className="object-contain p-3"
                />
              </div>

              <label className="block mt-4 text-xs uppercase font-black text-slate-500">
                URLs das imagens
              </label>

              <textarea
                value={imgTextarea}
                onChange={(e) => setImgTextarea(e.target.value)}
                placeholder={"https://.../produto.png"}
                className="mt-2 w-full min-h-32 rounded-2xl border border-slate-200 p-3 outline-none focus:border-blue-500"
              />

              <p className="text-xs text-slate-400 mt-2">
                Coloque uma URL por linha. A primeira será a imagem principal.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={fecharModalImagens}
                  className="h-12 rounded-2xl border font-bold"
                >
                  Cancelar
                </button>

                <button
                  onClick={salvarImagensDoModal}
                  disabled={imgSaving}
                  className="h-12 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center gap-2"
                >
                  {imgSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}

                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL NOVO PRODUTO
          ===================================================== */}

      {novoOpen && (
        <div className="fixed inset-0 z-[9997] bg-black/70 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-3xl rounded-t-[28px] sm:rounded-[28px] max-h-[95vh] overflow-y-auto">
            {/* CABEÇALHO */}

            <div className="sticky top-0 bg-white z-20 border-b px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Novo Produto
                </h3>

                <p className="text-xs text-slate-500">
                  Cadastro Rede Fabiano
                </p>
              </div>

              <button
                onClick={fecharNovoProduto}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* EAN */}

              <div>
                <label className="text-xs uppercase font-black text-slate-500">
                  Código de barras / EAN *
                </label>

                <div className="mt-1 flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                    <input
                      value={novoEAN}
                      onChange={(e) =>
                        setNovoEAN(onlyDigits(e.target.value))
                      }
                      placeholder="789..."
                      inputMode="numeric"
                      className="w-full h-12 rounded-2xl border pl-11 pr-3 font-bold outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={() => abrirCamera("novo")}
                    className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* NOME */}

              <div>
                <label className="text-xs uppercase font-black text-slate-500">
                  Nome do produto *
                </label>

                <input
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Dipirona 500mg 20 comprimidos"
                  className="mt-1 w-full h-12 rounded-2xl border px-4 font-semibold outline-none focus:border-blue-500"
                />
              </div>

              {/* LAB / CATEGORIA */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase font-black text-slate-500">
                    Laboratório
                  </label>

                  <input
                    value={novoLab}
                    onChange={(e) => setNovoLab(e.target.value)}
                    placeholder="Laboratório"
                    className="mt-1 w-full h-12 rounded-2xl border px-4 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-black text-slate-500">
                    Categoria
                  </label>

                  <input
                    value={novoCategoria}
                    onChange={(e) => setNovoCategoria(e.target.value)}
                    placeholder="Medicamentos"
                    className="mt-1 w-full h-12 rounded-2xl border px-4 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* APRESENTAÇÃO */}

              <div>
                <label className="text-xs uppercase font-black text-slate-500">
                  Apresentação
                </label>

                <input
                  value={novoApresentacao}
                  onChange={(e) => setNovoApresentacao(e.target.value)}
                  placeholder="Ex: Caixa com 20 comprimidos"
                  className="mt-1 w-full h-12 rounded-2xl border px-4 outline-none focus:border-blue-500"
                />
              </div>

              {/* =============================================
                  CUSTO / VENDA / ESTOQUE
                  ============================================= */}

              <div className="bg-slate-50 border rounded-[22px] p-3">
                <div className="flex items-center gap-2 mb-3">
                  <CircleDollarSign className="w-5 h-5 text-blue-600" />

                  <h4 className="font-black text-slate-900">
                    Preços e estoque
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-500">
                      Preço de custo
                    </label>

                    <input
                      value={novoPrecoCusto}
                      onChange={(e) =>
                        setNovoPrecoCusto(e.target.value)
                      }
                      inputMode="decimal"
                      placeholder="0,00"
                      className="mt-1 w-full h-11 rounded-xl border bg-white px-3 font-black outline-none focus:border-blue-500"
                    />

                    <p className="mt-1 text-[10px] text-slate-400">
                      {numberFromInput(novoPrecoCusto) != null
                        ? brl(numberFromInput(novoPrecoCusto))
                        : "R$ 0,00"}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-black text-blue-600">
                      Preço de venda
                    </label>

                    <input
                      value={novoPreco}
                      onChange={(e) => setNovoPreco(e.target.value)}
                      inputMode="decimal"
                      placeholder="0,00"
                      className="mt-1 w-full h-11 rounded-xl border border-blue-200 bg-blue-50 px-3 font-black text-blue-800 outline-none focus:border-blue-500"
                    />

                    <p className="mt-1 text-[10px] text-slate-400">
                      {numberFromInput(novoPreco) != null
                        ? brl(numberFromInput(novoPreco))
                        : "R$ 0,00"}
                    </p>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-black text-emerald-600">
                      Estoque
                    </label>

                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={novoEstoque}
                      onChange={(e) => setNovoEstoque(e.target.value)}
                      className="mt-1 w-full h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-center font-black text-emerald-800 outline-none"
                    />
                  </div>
                </div>

                {/* MARGEM NOVO PRODUTO */}

                {numberFromInput(novoPrecoCusto) != null &&
                  Number(numberFromInput(novoPrecoCusto)) > 0 &&
                  numberFromInput(novoPreco) != null && (
                    <div className="mt-3 rounded-xl bg-white border px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        Margem sobre o custo
                      </span>

                      <span className="font-black text-emerald-600">
                        {(
                          ((Number(numberFromInput(novoPreco)) -
                            Number(numberFromInput(novoPrecoCusto))) /
                            Number(numberFromInput(novoPrecoCusto))) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  )}
              </div>

              {/* ATIVO / DESTAQUE */}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNovoAtivo((v) => !v)}
                  className={`h-12 rounded-2xl border font-black text-sm ${
                    novoAtivo
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-slate-100 border-slate-200 text-slate-500"
                  }`}
                >
                  {novoAtivo ? "✓ Ativo na loja" : "Inativo"}
                </button>

                <button
                  type="button"
                  onClick={() => setNovoDestaque((v) => !v)}
                  className={`h-12 rounded-2xl border font-black text-sm flex items-center justify-center gap-2 ${
                    novoDestaque
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-white border-slate-200 text-slate-500"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Destaque
                </button>
              </div>

              {/* PROMOÇÃO */}

              <div className="border rounded-[22px] p-3">
                <button
                  type="button"
                  onClick={() => setNovoPromo((v) => !v)}
                  className={`w-full h-11 rounded-xl font-black text-sm ${
                    novoPromo
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {novoPromo
                    ? "🔥 Produto em promoção"
                    : "Adicionar promoção"}
                </button>

                {novoPromo && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <label className="text-[10px] uppercase font-black text-red-500">
                        Preço promocional
                      </label>

                      <input
                        value={novoPrecoPromo}
                        onChange={(e) =>
                          setNovoPrecoPromo(e.target.value)
                        }
                        inputMode="decimal"
                        placeholder="0,00"
                        className="mt-1 w-full h-11 rounded-xl border border-red-200 px-3 font-black"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-black text-red-500">
                        Desconto %
                      </label>

                      <input
                        value={novoOff}
                        onChange={(e) => setNovoOff(e.target.value)}
                        inputMode="decimal"
                        placeholder="0"
                        className="mt-1 w-full h-11 rounded-xl border border-red-200 px-3 font-black"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* IMAGEM */}

              <div>
                <label className="text-xs uppercase font-black text-slate-500">
                  Imagem do produto
                </label>

                <textarea
                  value={novoImgs}
                  onChange={(e) => setNovoImgs(e.target.value)}
                  placeholder="https://.../imagem.png"
                  className="mt-1 w-full min-h-24 rounded-2xl border p-3 outline-none focus:border-blue-500"
                />

                {urlsToJsonb(novoImgs)[0] && (
                  <div className="mt-2 h-40 relative bg-slate-50 border rounded-2xl overflow-hidden">
                    <Image
                      src={urlsToJsonb(novoImgs)[0]}
                      alt="Preview"
                      fill
                      sizes="500px"
                      className="object-contain p-2"
                    />
                  </div>
                )}
              </div>

              {/* BOTÕES */}

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={fecharNovoProduto}
                  disabled={novoSaving}
                  className="h-12 rounded-2xl border font-bold text-slate-600"
                >
                  Cancelar
                </button>

                <button
                  onClick={() => abrirCamera("novo")}
                  disabled={novoSaving}
                  className="h-12 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    Ler EAN
                  </span>
                  <span className="sm:hidden">
                    EAN
                  </span>
                </button>

                <button
                  onClick={salvarNovoProduto}
                  disabled={novoSaving}
                  className="h-12 rounded-2xl bg-emerald-600 disabled:bg-emerald-300 text-white font-black flex items-center justify-center gap-2"
                >
                  {novoSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}

                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}