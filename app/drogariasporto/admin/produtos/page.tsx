"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  ChevronUp,
  LogOut,
  Minus,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "@/lib/supabaseClient";

const SENHA_ADMIN = "021185";
const FARMACIA_SLUG = "drogariasporto-loja2";

const PROD_TABLE = "fv_produtos";
const STORE_TABLE = "fv_farmacia_produtos";

const PAGE_SIZE = 50;

type ProdutoPorto = {
  farmacia_slug: string;
  produto_id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  imagens: string[] | null;

  disponivel_farmacia: boolean | null;
  ativo_site: boolean | null;
  ativo_pdv: boolean | null;

  estoque: number | null;

  preco_custo: number | null;
  preco_venda: number | null;

  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  destaque_home: boolean | null;
};

type EditProduto = ProdutoPorto & {
  pmc?: number | null;
};

type NovoProduto = {
  ean: string;
  nome: string;
  laboratorio: string;
  categoria: string;
  apresentacao: string;

  pmc: string;

  preco_custo: string;
  preco_venda: string;

  estoque: string;

  em_promocao: boolean;
  preco_promocional: string;
  percentual_off: string;

  destaque_home: boolean;

  ativo: boolean;
  ativo_site: boolean;
  ativo_pdv: boolean;

  imagensText: string;
};

const NOVO_VAZIO: NovoProduto = {
  ean: "",
  nome: "",
  laboratorio: "",
  categoria: "",
  apresentacao: "",

  pmc: "",

  preco_custo: "",
  preco_venda: "",

  estoque: "0",

  em_promocao: false,
  preco_promocional: "",
  percentual_off: "",

  destaque_home: false,

  ativo: true,
  ativo_site: true,
  ativo_pdv: true,

  imagensText: "",
};

function brl(v: number | null | undefined) {
  if (
    v === null ||
    v === undefined ||
    Number.isNaN(Number(v))
  ) {
    return "—";
  }

  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function firstImg(imagens?: string[] | null) {
  if (
    Array.isArray(imagens) &&
    imagens.length > 0 &&
    imagens[0]
  ) {
    return imagens[0];
  }

  return "/produtos/caixa-padrao.png";
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function toNum(v: unknown) {
  if (v === null || v === undefined) {
    return null;
  }

  let s = String(v).trim();

  if (!s) {
    return null;
  }

  if (s.includes(",")) {
    s = s
      .replace(/\./g, "")
      .replace(",", ".");
  }

  const n = Number(s);

  return Number.isFinite(n)
    ? n
    : null;
}

function toInt(v: unknown) {
  const n = toNum(v);

  return n === null
    ? null
    : Math.trunc(n);
}

function safeJsonArray(
  v: string
): string[] | null {
  const raw = v.trim();

  if (!raw) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (Array.isArray(parsed)) {
      const arr = parsed
        .map((x) =>
          String(x || "").trim()
        )
        .filter(Boolean);

      return arr.length
        ? arr
        : null;
    }
  } catch {}

  const arr = raw
    .split(/[\n,;]/g)
    .map((x) => x.trim())
    .filter(Boolean);

  return arr.length
    ? arr
    : null;
}

function margem(
  custo: number | null | undefined,
  venda: number | null | undefined
) {
  const c =
    Number(custo || 0);

  const v =
    Number(venda || 0);

  if (
    c <= 0 ||
    v <= 0
  ) {
    return null;
  }

  return (
    ((v - c) / v) *
    100
  );
}

function lucro(
  custo: number | null | undefined,
  venda: number | null | undefined
) {
  const c =
    Number(custo || 0);

  const v =
    Number(venda || 0);

  if (v <= 0) {
    return null;
  }

  return v - c;
}

export default function AdminProdutosPorto() {
  const [authed, setAuthed] =
    useState(false);

  const [senha, setSenha] =
    useState("");

  useEffect(() => {
    if (
      typeof window !==
        "undefined" &&
      localStorage.getItem(
        "porto_admin_produtos_ok"
      ) === "1"
    ) {
      setAuthed(true);
    }
  }, []);

  function login() {
    if (
      senha === SENHA_ADMIN
    ) {
      localStorage.setItem(
        "porto_admin_produtos_ok",
        "1"
      );

      setAuthed(true);
    } else {
      alert("Senha incorreta.");
    }
  }

  function sair() {
    localStorage.removeItem(
      "porto_admin_produtos_ok"
    );

    setAuthed(false);
    setSenha("");
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">

        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">

          <div className="text-xs font-black uppercase text-blue-700">
            Drogarias Porto • Loja 2
          </div>

          <div className="mt-1 text-2xl font-black text-slate-950">
            Admin de Produtos
          </div>

          <div className="mt-1 text-sm text-slate-500">
            Integrado ao FV Marketplace
          </div>

          <input
            value={senha}
            onChange={(e) =>
              setSenha(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                login();
              }
            }}
            type="password"
            placeholder="Senha"
            className="mt-5 w-full rounded-2xl border-2 border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-600"
          />

          <button
            onClick={login}
            className="mt-3 w-full rounded-2xl bg-blue-800 py-3 font-black text-white"
          >
            Entrar
          </button>

        </div>

      </div>
    );
  }

  return (
    <AdminProdutosInner
      onSair={sair}
    />
  );
}

function AdminProdutosInner({
  onSair,
}: {
  onSair: () => void;
}) {
  const [loading, setLoading] =
    useState(false);

  const [
    savingId,
    setSavingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<string | null>(
      null
    );

  const [q, setQ] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [
    stockMode,
    setStockMode,
  ] =
    useState<
      "all" | "gt0" | "eq0"
    >("all");

  const [rows, setRows] =
    useState<ProdutoPorto[]>(
      []
    );

  const [total, setTotal] =
    useState(0);

  const [
    editing,
    setEditing,
  ] =
    useState<EditProduto | null>(
      null
    );

  const [novo, setNovo] =
    useState<NovoProduto>(
      NOVO_VAZIO
    );

  const [
    novoAberto,
    setNovoAberto,
  ] =
    useState(false);

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

  async function load(
    termoForcado?: string
  ) {
    const rawBusca =
      (
        termoForcado ??
        q
      ).trim();

    if (!rawBusca) {
      setRows([]);
      setTotal(0);
      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      let masterQuery =
        supabase
          .from(PROD_TABLE)
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,imagens,ativo",
            {
              count: "exact",
            }
          );

      const raw =
        rawBusca;

      const digits =
        onlyDigits(raw);

      const rawNoSpace =
        raw.replace(
          /\s/g,
          ""
        );

      if (
        digits.length >= 8 &&
        digits.length <= 14 &&
        digits === rawNoSpace
      ) {
        masterQuery =
          masterQuery.eq(
            "ean",
            digits
          );
      } else if (
        digits.length >= 8 &&
        digits.length <= 14
      ) {
        masterQuery =
          masterQuery.or(
            `ean.eq.${digits},nome.ilike.%${raw}%`
          );
      } else {
        const safe =
          raw.replace(
            /,/g,
            " "
          );

        masterQuery =
          masterQuery.or(
            `nome.ilike.%${safe}%,laboratorio.ilike.%${safe}%,categoria.ilike.%${safe}%,apresentacao.ilike.%${safe}%`
          );
      }

      masterQuery =
        masterQuery.order(
          "nome",
          {
            ascending: true,
          }
        );

      const from =
        (page - 1) *
        PAGE_SIZE;

      const to =
        from +
        PAGE_SIZE -
        1;

      const {
        data: master,
        count,
        error: masterError,
      } =
        await masterQuery.range(
          from,
          to
        );

      if (masterError) {
        throw masterError;
      }

      const produtos =
        master || [];

      const ids =
        produtos.map(
          (p: any) =>
            String(p.id)
        );

      let lojaMap =
        new Map<
          string,
          any
        >();

      if (ids.length) {
        const {
          data: loja,
          error: lojaError,
        } =
          await supabase
            .from(STORE_TABLE)
            .select(
              "produto_id,estoque,preco_custo,preco_venda,ativo,ativo_site,ativo_pdv,em_promocao,preco_promocional,percentual_off,destaque_home"
            )
            .eq(
              "farmacia_slug",
              FARMACIA_SLUG
            )
            .in(
              "produto_id",
              ids
            );

        if (lojaError) {
          throw lojaError;
        }

        lojaMap =
          new Map(
            (loja || []).map(
              (r: any) => [
                String(
                  r.produto_id
                ),
                r,
              ]
            )
          );
      }

      let merged: ProdutoPorto[] =
        produtos.map(
          (p: any) => {
            const loja =
              lojaMap.get(
                String(p.id)
              );

            return {
              farmacia_slug:
                FARMACIA_SLUG,

              produto_id:
                String(p.id),

              ean:
                String(
                  p.ean || ""
                ),

              nome:
                String(
                  p.nome || ""
                ),

              laboratorio:
                p.laboratorio ??
                null,

              categoria:
                p.categoria ??
                null,

              apresentacao:
                p.apresentacao ??
                null,

              imagens:
                Array.isArray(
                  p.imagens
                )
                  ? p.imagens
                  : null,

              disponivel_farmacia:
                !!loja?.ativo,

              ativo_site:
                !!loja?.ativo_site,

              ativo_pdv:
                !!loja?.ativo_pdv,

              estoque:
                Number(
                  loja?.estoque ??
                    0
                ),

              preco_custo:
                loja?.preco_custo ??
                null,

              preco_venda:
                loja?.preco_venda ??
                p.pmc ??
                null,

              em_promocao:
                !!loja?.em_promocao,

              preco_promocional:
                loja?.preco_promocional ??
                null,

              percentual_off:
                loja?.percentual_off ??
                null,

              destaque_home:
                !!loja?.destaque_home,
            };
          }
        );

      if (
        stockMode ===
        "gt0"
      ) {
        merged =
          merged.filter(
            (p) =>
              Number(
                p.estoque || 0
              ) > 0
          );
      }

      if (
        stockMode ===
        "eq0"
      ) {
        merged =
          merged.filter(
            (p) =>
              Number(
                p.estoque || 0
              ) === 0
          );
      }

      setRows(merged);
      setTotal(count || 0);

      if (
        digits.length >= 8 &&
        merged.length === 0
      ) {
        setNovo((p) => ({
          ...p,
          ean: digits,
        }));

        setNovoAberto(true);
      }
    } catch (e: any) {
      console.error(
        "Porto admin produtos:",
        e
      );

      alert(
        e?.message ||
          "Erro ao carregar produtos do catálogo FV."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (q.trim()) {
      load();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t =
      setTimeout(() => {
        setPage(1);
        load();
      }, 350);

    return () =>
      clearTimeout(t);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, stockMode]);

  const pages =
    Math.max(
      1,
      Math.ceil(
        total /
          PAGE_SIZE
      )
    );

  async function patchLoja(
    produtoId: string,
    patch: Record<
      string,
      unknown
    >
  ) {
    const { error } =
      await supabase
        .from(STORE_TABLE)
        .upsert(
          {
            farmacia_slug:
              FARMACIA_SLUG,

            produto_id:
              produtoId,

            ...patch,
          },
          {
            onConflict:
              "farmacia_slug,produto_id",
          }
        );

    if (error) {
      throw error;
    }
  }

  async function toggleQuick(
    produtoId: string,
    patch: Record<
      string,
      unknown
    >
  ) {
    try {
      setSavingId(
        produtoId
      );

      await patchLoja(
        produtoId,
        patch
      );

      await load();
    } catch (e) {
      console.error(e);

      alert(
        "Erro ao salvar alteração."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function changeEstoque(
    produtoId: string,
    delta: number
  ) {
    const current =
      rows.find(
        (r) =>
          r.produto_id ===
          produtoId
      )?.estoque ?? 0;

    const next =
      Math.max(
        0,
        Number(current) +
          delta
      );

    await toggleQuick(
      produtoId,
      {
        estoque: next,
      }
    );
  }

  async function quickSaveValores(
    produtoId: string,
    custo: string,
    venda: string,
    estoque: string
  ) {
    try {
      setSavingId(
        produtoId
      );

      await patchLoja(
        produtoId,
        {
          preco_custo:
            toNum(custo),

          preco_venda:
            toNum(venda),

          estoque:
            Math.max(
              0,
              Number(
                toInt(
                  estoque
                ) ?? 0
              )
            ),
        }
      );

      await load();
    } catch (e: any) {
      console.error(e);

      alert(
        e?.message ||
          "Erro ao salvar valores."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function openEdit(
    p: ProdutoPorto
  ) {
    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(PROD_TABLE)
          .select("pmc")
          .eq(
            "id",
            p.produto_id
          )
          .single();

      if (error) {
        throw error;
      }

      setEditing({
        ...p,
        pmc:
          data?.pmc ??
          null,
      });
    } catch {
      setEditing({
        ...p,
        pmc: null,
      });
    }
  }

  async function saveEdit() {
    if (!editing) {
      return;
    }

    const id =
      editing.produto_id;

    try {
      setSavingId(id);

      const ean =
        onlyDigits(
          editing.ean || ""
        );

      if (
        ean.length < 8
      ) {
        alert(
          "EAN inválido."
        );

        return;
      }

      if (
        !editing.nome.trim()
      ) {
        alert(
          "Nome é obrigatório."
        );

        return;
      }

      const {
        error:
          masterError,
      } =
        await supabase
          .from(PROD_TABLE)
          .update({
            ean,

            nome:
              editing.nome.trim(),

            laboratorio:
              editing.laboratorio?.trim() ||
              null,

            categoria:
              editing.categoria?.trim() ||
              null,

            apresentacao:
              editing.apresentacao?.trim() ||
              null,

            pmc:
              toNum(
                editing.pmc
              ) ?? 0,

            imagens:
              Array.isArray(
                editing.imagens
              )
                ? editing.imagens.filter(
                    Boolean
                  )
                : null,
          })
          .eq(
            "id",
            id
          );

      if (masterError) {
        throw masterError;
      }

      await patchLoja(
        id,
        {
          ativo:
            !!editing.disponivel_farmacia,

          ativo_site:
            !!editing.ativo_site,

          ativo_pdv:
            !!editing.ativo_pdv,

          estoque:
            Math.max(
              0,
              Number(
                toInt(
                  editing.estoque
                ) ?? 0
              )
            ),

          preco_custo:
            toNum(
              editing.preco_custo
            ),

          preco_venda:
            toNum(
              editing.preco_venda
            ),

          em_promocao:
            !!editing.em_promocao,

          preco_promocional:
            editing.em_promocao
              ? toNum(
                  editing.preco_promocional
                )
              : null,

          percentual_off:
            toNum(
              editing.percentual_off
            ),

          destaque_home:
            !!editing.destaque_home,
        }
      );

      setEditing(null);

      await load();

      alert(
        "Produto salvo."
      );
    } catch (e: any) {
      console.error(e);

      alert(
        e?.message ||
          "Erro ao salvar produto."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function createNovo() {
    try {
      setSavingId("novo");

      const ean =
        onlyDigits(
          novo.ean
        );

      if (
        ean.length < 8
      ) {
        alert(
          "EAN inválido (mínimo 8 dígitos)."
        );

        return;
      }

      if (
        !novo.nome.trim()
      ) {
        alert(
          "Nome é obrigatório."
        );

        return;
      }

      const imagens =
        safeJsonArray(
          novo.imagensText
        );

      const {
        data: found,
        error:
          findError,
      } =
        await supabase
          .from(PROD_TABLE)
          .select("id")
          .eq("ean", ean)
          .limit(1);

      if (findError) {
        throw findError;
      }

      let produtoId =
        found?.[0]?.id as
          | string
          | undefined;

      if (!produtoId) {
        const {
          data: created,
          error:
            createError,
        } =
          await supabase
            .from(PROD_TABLE)
            .insert({
              ean,

              nome:
                novo.nome.trim(),

              laboratorio:
                novo.laboratorio.trim() ||
                null,

              categoria:
                novo.categoria.trim() ||
                null,

              apresentacao:
                novo.apresentacao.trim() ||
                null,

              pmc:
                toNum(
                  novo.pmc
                ) ?? 0,

              imagens,

              ativo: true,
            })
            .select("id")
            .single();

        if (createError) {
          throw createError;
        }

        produtoId =
          created?.id;
      } else {
        const {
          error:
            updateMaster,
        } =
          await supabase
            .from(PROD_TABLE)
            .update({
              nome:
                novo.nome.trim(),

              laboratorio:
                novo.laboratorio.trim() ||
                null,

              categoria:
                novo.categoria.trim() ||
                null,

              apresentacao:
                novo.apresentacao.trim() ||
                null,

              pmc:
                toNum(
                  novo.pmc
                ) ?? 0,

              imagens,
            })
            .eq(
              "id",
              produtoId
            );

        if (
          updateMaster
        ) {
          throw updateMaster;
        }
      }

      if (!produtoId) {
        throw new Error(
          "Não foi possível obter produto_id."
        );
      }

      await patchLoja(
        produtoId,
        {
          ativo:
            novo.ativo,

          ativo_site:
            novo.ativo_site,

          ativo_pdv:
            novo.ativo_pdv,

          estoque:
            Math.max(
              0,
              Number(
                toInt(
                  novo.estoque
                ) ?? 0
              )
            ),

          preco_custo:
            toNum(
              novo.preco_custo
            ),

          preco_venda:
            toNum(
              novo.preco_venda
            ),

          em_promocao:
            novo.em_promocao,

          preco_promocional:
            novo.em_promocao
              ? toNum(
                  novo.preco_promocional
                )
              : null,

          percentual_off:
            toNum(
              novo.percentual_off
            ),

          destaque_home:
            novo.destaque_home,
        }
      );

      setNovo(
        NOVO_VAZIO
      );

      setNovoAberto(
        false
      );

      setQ(ean);
      setPage(1);

      await load(ean);

      alert(
        "Produto cadastrado na Porto + FV."
      );
    } catch (e: any) {
      console.error(e);

      alert(
        e?.message ||
          "Erro ao criar produto."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function retirarDaLoja(
    produtoId: string
  ) {
    if (
      !confirm(
        "Retirar este produto da Drogarias Porto Loja 2? O cadastro master do FV será mantido."
      )
    ) {
      return;
    }

    try {
      setDeletingId(
        produtoId
      );

      const { error } =
        await supabase
          .from(STORE_TABLE)
          .delete()
          .eq(
            "farmacia_slug",
            FARMACIA_SLUG
          )
          .eq(
            "produto_id",
            produtoId
          );

      if (error) {
        throw error;
      }

      await load();
    } catch (e) {
      console.error(e);

      alert(
        "Erro ao retirar produto."
      );
    } finally {
      setDeletingId(null);
    }
  }

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

    setCameraLendo(false);
  }

  function fecharCamera() {
    pararCamera();

    codigoLidoRef.current =
      false;

    setCameraAberta(false);
    setCameraErro("");
  }

  function abrirCamera() {
    setCameraErro("");

    codigoLidoRef.current =
      false;

    setCameraAberta(true);
  }

  useEffect(() => {
    if (!cameraAberta) {
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

              setQ(codigo);

              setTimeout(
                () => {
                  fecharCamera();

                  setPage(1);

                  load(codigo);
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
            "Permissão da câmera bloqueada. Libere a câmera para este site."
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
      cancelado = true;
      pararCamera();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraAberta]);

  return (
    <main className="min-h-screen bg-slate-100 pb-10">

      <header className="sticky top-0 z-30 bg-blue-950 text-white shadow-lg">

        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 md:px-5">

          <div className="min-w-0 flex-1">

            <div className="text-[10px] font-black uppercase text-blue-200">
              Drogarias Porto • Loja 2
            </div>

            <h1 className="truncate text-lg font-black md:text-xl">
              Produtos
            </h1>

          </div>

          <Link
            href="/drogariasporto/admin"
            className="rounded-xl bg-white/10 p-2"
            title="Admin"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <button
            onClick={() =>
              load()
            }
            className="rounded-xl bg-white/10 p-2"
            title="Atualizar"
          >
            <RefreshCw
              size={20}
            />
          </button>

          <button
            onClick={onSair}
            className="rounded-xl bg-white/10 p-2"
            title="Sair"
          >
            <LogOut
              size={20}
            />
          </button>

        </div>

      </header>

      <div className="mx-auto max-w-7xl space-y-3 p-3 md:space-y-5 md:p-5">

        {/* BUSCA */}

        <section className="sticky top-[60px] z-20 rounded-2xl bg-white p-3 shadow-sm md:top-[70px]">

          <div className="flex gap-2">

            <div className="flex min-w-0 flex-1 items-center rounded-xl border-2 border-blue-200 px-3 focus-within:border-blue-700">

              <Search
                size={20}
                className="shrink-0 text-slate-500"
              />

              <input
                value={q}
                onChange={(e) =>
                  setQ(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    load();
                  }
                }}
                placeholder="Nome ou EAN"
                className="min-w-0 flex-1 px-3 py-3 font-bold outline-none"
              />

            </div>

            <button
              type="button"
              onClick={
                abrirCamera
              }
              className="flex w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"
              title="Ler código de barras"
            >
              <Camera
                size={22}
              />
            </button>

          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">

            <FilterButton
              active={
                stockMode ===
                "all"
              }
              onClick={() =>
                setStockMode(
                  "all"
                )
              }
            >
              Todos
            </FilterButton>

            <FilterButton
              active={
                stockMode ===
                "gt0"
              }
              onClick={() =>
                setStockMode(
                  "gt0"
                )
              }
            >
              Com estoque
            </FilterButton>

            <FilterButton
              active={
                stockMode ===
                "eq0"
              }
              onClick={() =>
                setStockMode(
                  "eq0"
                )
              }
            >
              Zerados
            </FilterButton>

            <button
              type="button"
              onClick={() =>
                setNovoAberto(
                  (v) => !v
                )
              }
              className="ml-auto shrink-0 rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white"
            >
              + Novo
            </button>

          </div>

        </section>

        {novoAberto && (
          <NovoCard
            novo={novo}
            setNovo={setNovo}
            saving={
              savingId ===
              "novo"
            }
            onSave={
              createNovo
            }
            onClose={() => {
              setNovo(
                NOVO_VAZIO
              );

              setNovoAberto(
                false
              );
            }}
          />
        )}

        <div className="flex items-center justify-between px-1">

          <div className="text-sm font-black text-slate-700">
            {loading
              ? "Buscando..."
              : `${rows.length} resultado(s)`}
          </div>

          {q.trim() && (
            <div className="text-xs font-bold text-slate-500">
              Página {page}/
              {pages}
            </div>
          )}

        </div>

        {!q.trim() &&
          !novoAberto && (

          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">

            <Search
              className="mx-auto text-slate-400"
              size={36}
            />

            <div className="mt-3 font-black text-slate-800">
              Pesquise ou escaneie um produto
            </div>

            <div className="mt-1 text-sm text-slate-500">
              EAN não encontrado abre o cadastro de um novo produto.
            </div>

          </div>

        )}

        {loading && (

          <div className="rounded-2xl bg-white p-5 text-center font-bold text-blue-800 shadow-sm">
            Carregando produtos...
          </div>

        )}

        {!loading &&
          q.trim() &&
          rows.length ===
            0 && (

          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">

            <div className="font-black text-slate-800">
              Produto não encontrado
            </div>

            <button
              type="button"
              onClick={() => {
                setNovo(
                  (p) => ({
                    ...p,
                    ean:
                      onlyDigits(
                        q
                      ),
                  })
                );

                setNovoAberto(
                  true
                );
              }}
              className="mt-3 rounded-xl bg-green-600 px-4 py-3 font-black text-white"
            >
              + Cadastrar este produto
            </button>

          </div>

        )}

        <div className="grid gap-3 lg:grid-cols-2">

          {rows.map((p) => (

            <ProdutoCard
              key={
                p.produto_id
              }
              p={p}
              saving={
                savingId ===
                p.produto_id
              }
              deleting={
                deletingId ===
                p.produto_id
              }
              onEstoque={(
                delta
              ) =>
                changeEstoque(
                  p.produto_id,
                  delta
                )
              }
              onToggle={(
                patch
              ) =>
                toggleQuick(
                  p.produto_id,
                  patch
                )
              }
              onQuickSave={(
                custo,
                venda,
                estoque
              ) =>
                quickSaveValores(
                  p.produto_id,
                  custo,
                  venda,
                  estoque
                )
              }
              onEdit={() =>
                openEdit(p)
              }
              onDelete={() =>
                retirarDaLoja(
                  p.produto_id
                )
              }
            />

          ))}

        </div>

        {q.trim() &&
          rows.length > 0 &&
          pages > 1 && (

          <div className="flex justify-center gap-2">

            <button
              onClick={() =>
                setPage(
                  (p) =>
                    Math.max(
                      1,
                      p - 1
                    )
                )
              }
              disabled={
                page <= 1
              }
              className="rounded-xl border bg-white px-5 py-3 font-black disabled:opacity-40"
            >
              ← Anterior
            </button>

            <button
              onClick={() =>
                setPage(
                  (p) =>
                    Math.min(
                      pages,
                      p + 1
                    )
                )
              }
              disabled={
                page >=
                pages
              }
              className="rounded-xl border bg-white px-5 py-3 font-black disabled:opacity-40"
            >
              Próxima →
            </button>

          </div>

        )}

        {editing && (

          <EditModal
            p={editing}
            setP={setEditing}
            saving={
              savingId ===
              editing.produto_id
            }
            onClose={() =>
              setEditing(
                null
              )
            }
            onSave={
              saveEdit
            }
          />

        )}

      </div>

      {/* CÂMERA */}

      {cameraAberta && (

        <div className="fixed inset-0 z-[100] bg-black">

          <div className="flex h-full flex-col">

            <div className="flex items-center justify-between bg-black/90 p-4 text-white">

              <div>

                <div className="font-black">
                  Ler código de barras
                </div>

                <div className="text-xs text-slate-300">
                  Aponte para o EAN do produto
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
function ProdutoCard({
  p,
  saving,
  deleting,
  onEstoque,
  onToggle,
  onQuickSave,
  onEdit,
  onDelete,
}: {
  p: ProdutoPorto;
  saving: boolean;
  deleting: boolean;
  onEstoque: (delta: number) => void;
  onToggle: (patch: Record<string, unknown>) => void;
  onQuickSave: (
    custo: string,
    venda: string,
    estoque: string
  ) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [custo, setCusto] = useState(
    p.preco_custo === null
      ? ""
      : String(p.preco_custo).replace(".", ",")
  );

  const [venda, setVenda] = useState(
    p.preco_venda === null
      ? ""
      : String(p.preco_venda).replace(".", ",")
  );

  const [estoque, setEstoque] = useState(
    String(Number(p.estoque || 0))
  );

  useEffect(() => {
    setCusto(
      p.preco_custo === null
        ? ""
        : String(p.preco_custo).replace(".", ",")
    );

    setVenda(
      p.preco_venda === null
        ? ""
        : String(p.preco_venda).replace(".", ",")
    );

    setEstoque(
      String(Number(p.estoque || 0))
    );
  }, [
    p.preco_custo,
    p.preco_venda,
    p.estoque,
  ]);

  const custoN = toNum(custo);
  const vendaN = toNum(venda);

  const lucroN = lucro(
    custoN,
    vendaN
  );

  const margemN = margem(
    custoN,
    vendaN
  );

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">

      {/* CABEÇALHO DO PRODUTO */}

      <div className="flex gap-3 p-4">

        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50">

          <Image
            src={firstImg(p.imagens)}
            alt={
              p.nome ||
              "Produto"
            }
            width={70}
            height={70}
            className="object-contain"
          />

        </div>

        <div className="min-w-0 flex-1">

          <div className="text-base font-black leading-tight text-slate-950">
            {p.nome}
          </div>

          <div className="mt-1 text-xs text-slate-500">

            EAN{" "}

            <b>
              {p.ean}
            </b>

            {p.laboratorio
              ? ` • ${p.laboratorio}`
              : ""}

          </div>

          <div className="mt-2 flex flex-wrap gap-1">

            <StatusPill
              label="FV"
              active={
                !!p.disponivel_farmacia
              }
            />

            <StatusPill
              label="Site"
              active={
                !!p.ativo_site
              }
            />

            <StatusPill
              label="PDV"
              active={
                !!p.ativo_pdv
              }
            />

          </div>

        </div>

      </div>

      {/* VALORES RÁPIDOS */}

      <div className="border-t bg-slate-50/70 p-3">

        <div className="grid grid-cols-2 gap-2">

          <MoneyInput
            label="Compra"
            value={custo}
            onChange={
              setCusto
            }
          />

          <MoneyInput
            label="Venda"
            value={venda}
            onChange={
              setVenda
            }
          />

        </div>

        {/* LUCRO E MARGEM */}

        <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200">

          <div>

            <div className="text-[10px] font-black uppercase text-slate-400">
              Lucro / un.
            </div>

            <div
              className={`font-black ${
                lucroN !== null &&
                lucroN >= 0
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {lucroN === null
                ? "—"
                : brl(lucroN)}
            </div>

          </div>

          <div>

            <div className="text-[10px] font-black uppercase text-slate-400">
              Margem
            </div>

            <div
              className={`font-black ${
                margemN !== null &&
                margemN >= 0
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {margemN === null
                ? "—"
                : `${margemN
                    .toFixed(1)
                    .replace(
                      ".",
                      ","
                    )}%`}
            </div>

          </div>

        </div>

        {/* ESTOQUE */}

        <div className="mt-3">

          <div className="mb-1 text-[10px] font-black uppercase text-slate-500">
            Estoque Porto
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              disabled={
                saving ||
                Number(
                  p.estoque || 0
                ) <= 0
              }
              onClick={() =>
                onEstoque(-1)
              }
              className="rounded-xl border bg-white p-3 disabled:opacity-40"
            >
              <Minus
                size={17}
              />
            </button>

            <input
              value={estoque}
              onChange={(e) =>
                setEstoque(
                  onlyDigits(
                    e.target.value
                  )
                )
              }
              inputMode="numeric"
              className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 px-3 py-3 text-center text-lg font-black outline-none focus:border-blue-600"
            />

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                onEstoque(1)
              }
              className="rounded-xl border bg-white px-3 py-3 font-black"
            >
              +1
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                onEstoque(5)
              }
              className="rounded-xl border bg-white px-3 py-3 font-black"
            >
              +5
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                onEstoque(10)
              }
              className="hidden rounded-xl border bg-white px-3 py-3 font-black sm:block"
            >
              +10
            </button>

          </div>

        </div>

        {/* SALVAR RÁPIDO */}

        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onQuickSave(
              custo,
              venda,
              estoque
            )
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-800 py-3 font-black text-white disabled:opacity-50"
        >
          <Save
            size={18}
          />

          {saving
            ? "Salvando..."
            : "SALVAR COMPRA • VENDA • ESTOQUE"}

        </button>

      </div>

      {/* ATIVAÇÃO */}

      <div className="grid grid-cols-3 gap-2 border-t p-3">

        <QuickToggle
          label="FV"
          value={
            !!p.disponivel_farmacia
          }
          disabled={saving}
          onChange={(v) =>
            onToggle({
              ativo: v,
            })
          }
        />

        <QuickToggle
          label="Site"
          value={
            !!p.ativo_site
          }
          disabled={saving}
          onChange={(v) =>
            onToggle({
              ativo_site: v,
            })
          }
        />

        <QuickToggle
          label="PDV"
          value={
            !!p.ativo_pdv
          }
          disabled={saving}
          onChange={(v) =>
            onToggle({
              ativo_pdv: v,
            })
          }
        />

      </div>

      {/* AÇÕES */}

      <div className="flex gap-2 border-t p-3">

        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white py-3 font-black"
        >
          <Settings2
            size={17}
          />

          Editar completo
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded-xl bg-red-50 px-3 py-3 text-xs font-black text-red-700 disabled:opacity-50"
        >
          {deleting
            ? "..."
            : "Retirar"}
        </button>

      </div>

    </article>
  );
}

/* =========================================================
   NOVO PRODUTO
========================================================= */

function NovoCard({
  novo,
  setNovo,
  saving,
  onSave,
  onClose,
}: {
  novo: NovoProduto;
  setNovo: React.Dispatch<
    React.SetStateAction<NovoProduto>
  >;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const [
    detalhes,
    setDetalhes,
  ] =
    useState(false);

  const custoN =
    toNum(
      novo.preco_custo
    );

  const vendaN =
    toNum(
      novo.preco_venda
    );

  const lucroN =
    lucro(
      custoN,
      vendaN
    );

  const margemN =
    margem(
      custoN,
      vendaN
    );

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-green-200">

      <div className="flex items-center justify-between bg-green-600 px-4 py-3 text-white">

        <div>

          <div className="text-xs font-bold text-green-100">
            NOVO PRODUTO
          </div>

          <div className="font-black">
            Cadastro rápido Porto + FV
          </div>

        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-white/10 p-2"
        >
          <X
            size={20}
          />
        </button>

      </div>

      {/* DADOS PRINCIPAIS */}

      <div className="grid gap-3 p-4 md:grid-cols-2">

        <Field label="EAN">

          <input
            value={
              novo.ean
            }
            onChange={(e) =>
              setNovo(
                (p) => ({
                  ...p,

                  ean:
                    onlyDigits(
                      e.target
                        .value
                    ),
                })
              )
            }
            inputMode="numeric"
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
            placeholder="789..."
          />

        </Field>

        <Field label="Nome">

          <input
            value={
              novo.nome
            }
            onChange={(e) =>
              setNovo(
                (p) => ({
                  ...p,

                  nome:
                    e.target
                      .value,
                })
              )
            }
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
            placeholder="Nome do produto"
          />

        </Field>

        <MoneyField
          label="Preço de compra"
          value={
            novo.preco_custo
          }
          onChange={(v) =>
            setNovo(
              (p) => ({
                ...p,
                preco_custo:
                  v,
              })
            )
          }
        />

        <MoneyField
          label="Preço de venda"
          value={
            novo.preco_venda
          }
          onChange={(v) =>
            setNovo(
              (p) => ({
                ...p,
                preco_venda:
                  v,
              })
            )
          }
        />

        <Field label="Estoque inicial">

          <input
            value={
              novo.estoque
            }
            onChange={(e) =>
              setNovo(
                (p) => ({
                  ...p,

                  estoque:
                    onlyDigits(
                      e.target
                        .value
                    ),
                })
              )
            }
            inputMode="numeric"
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
          />

        </Field>

        {/* RESUMO */}

        <div className="rounded-2xl bg-slate-50 p-3">

          <div className="grid grid-cols-2 gap-3">

            <div>

              <div className="text-[10px] font-black uppercase text-slate-400">
                Lucro
              </div>

              <div className="font-black text-green-700">
                {lucroN === null
                  ? "—"
                  : brl(
                      lucroN
                    )}
              </div>

            </div>

            <div>

              <div className="text-[10px] font-black uppercase text-slate-400">
                Margem
              </div>

              <div className="font-black text-green-700">
                {margemN === null
                  ? "—"
                  : `${margemN
                      .toFixed(
                        1
                      )
                      .replace(
                        ".",
                        ","
                      )}%`}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* MAIS DETALHES */}

      <button
        type="button"
        onClick={() =>
          setDetalhes(
            (v) => !v
          )
        }
        className="mx-4 mb-3 flex items-center gap-2 text-sm font-black text-blue-800"
      >
        {detalhes
          ? (
            <ChevronUp
              size={17}
            />
          )
          : (
            <ChevronDown
              size={17}
            />
          )}

        {detalhes
          ? "Ocultar detalhes"
          : "Mais detalhes"}

      </button>

      {detalhes && (

        <div className="grid gap-3 border-t p-4 md:grid-cols-3">

          <Field label="Laboratório">

            <input
              value={
                novo.laboratorio
              }
              onChange={(e) =>
                setNovo(
                  (p) => ({
                    ...p,

                    laboratorio:
                      e.target
                        .value,
                  })
                )
              }
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
            />

          </Field>

          <Field label="Categoria">

            <input
              value={
                novo.categoria
              }
              onChange={(e) =>
                setNovo(
                  (p) => ({
                    ...p,

                    categoria:
                      e.target
                        .value,
                  })
                )
              }
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
            />

          </Field>

          <Field label="Apresentação">

            <input
              value={
                novo.apresentacao
              }
              onChange={(e) =>
                setNovo(
                  (p) => ({
                    ...p,

                    apresentacao:
                      e.target
                        .value,
                  })
                )
              }
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
            />

          </Field>

          <MoneyField
            label="PMC catálogo"
            value={
              novo.pmc
            }
            onChange={(v) =>
              setNovo(
                (p) => ({
                  ...p,
                  pmc: v,
                })
              )
            }
          />

          <Field label="Promoção">

            <SelectBool
              value={
                novo.em_promocao
              }
              onChange={(v) =>
                setNovo(
                  (p) => ({
                    ...p,
                    em_promocao:
                      v,
                  })
                )
              }
            />

          </Field>

          <MoneyField
            label="Preço promocional"
            value={
              novo.preco_promocional
            }
            onChange={(v) =>
              setNovo(
                (p) => ({
                  ...p,
                  preco_promocional:
                    v,
                })
              )
            }
          />

          <Field label="OFF (%)">

            <input
              value={
                novo.percentual_off
              }
              onChange={(e) =>
                setNovo(
                  (p) => ({
                    ...p,

                    percentual_off:
                      e.target
                        .value,
                  })
                )
              }
              inputMode="decimal"
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
            />

          </Field>

          <Field label="Destaque">

            <SelectBool
              value={
                novo.destaque_home
              }
              onChange={(v) =>
                setNovo(
                  (p) => ({
                    ...p,
                    destaque_home:
                      v,
                  })
                )
              }
            />

          </Field>

          <Field label="FV">

            <SelectBool
              value={
                novo.ativo
              }
              onChange={(v) =>
                setNovo(
                  (p) => ({
                    ...p,
                    ativo: v,
                  })
                )
              }
            />

          </Field>

          <Field label="Site Porto">

            <SelectBool
              value={
                novo.ativo_site
              }
              onChange={(v) =>
                setNovo(
                  (p) => ({
                    ...p,
                    ativo_site:
                      v,
                  })
                )
              }
            />

          </Field>

          <Field label="PDV">

            <SelectBool
              value={
                novo.ativo_pdv
              }
              onChange={(v) =>
                setNovo(
                  (p) => ({
                    ...p,
                    ativo_pdv:
                      v,
                  })
                )
              }
            />

          </Field>

          <Field
            label="Imagens (JSON ou URLs)"
            className="md:col-span-3"
          >

            <textarea
              value={
                novo.imagensText
              }
              onChange={(e) =>
                setNovo(
                  (p) => ({
                    ...p,

                    imagensText:
                      e.target
                        .value,
                  })
                )
              }
              rows={2}
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
            />

          </Field>

        </div>

      )}

      <div className="p-4 pt-0">

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full rounded-2xl bg-green-600 py-4 font-black text-white disabled:opacity-50"
        >
          {saving
            ? "Salvando..."
            : "CADASTRAR PRODUTO"}
        </button>

      </div>

    </section>
  );
}

/* =========================================================
   MODAL EDIÇÃO COMPLETA
========================================================= */

function EditModal({
  p,
  setP,
  saving,
  onClose,
  onSave,
}: {
  p: EditProduto;
  setP: (
    v:
      | EditProduto
      | null
  ) => void;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const imagensText =
    useMemo(
      () =>
        Array.isArray(
          p.imagens
        ) &&
        p.imagens.length
          ? JSON.stringify(
              p.imagens
            )
          : "",
      [p.imagens]
    );

  const custoN =
    Number(
      p.preco_custo || 0
    );

  const vendaN =
    Number(
      p.preco_venda || 0
    );

  const lucroN =
    lucro(
      custoN,
      vendaN
    );

  const margemN =
    margem(
      custoN,
      vendaN
    );

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 p-2 md:p-4">

      <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* TOPO */}

        <div className="flex items-center justify-between border-b bg-white p-4">

          <div className="min-w-0">

            <div className="font-black text-slate-950">
              Editar produto
            </div>

            <div className="truncate text-xs font-bold text-slate-500">
              {p.nome} •{" "}
              {p.ean}
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 p-2"
          >
            <X
              size={20}
            />
          </button>

        </div>

        {/* CONTEÚDO */}

        <div className="flex-1 overflow-y-auto p-4">

          <div className="grid gap-3 md:grid-cols-2">

            <Field label="EAN">

              <input
                value={
                  p.ean
                }
                onChange={(e) =>
                  setP({
                    ...p,
                    ean:
                      e.target
                        .value,
                  })
                }
                inputMode="numeric"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

            <Field label="Nome">

              <input
                value={
                  p.nome
                }
                onChange={(e) =>
                  setP({
                    ...p,
                    nome:
                      e.target
                        .value,
                  })
                }
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

            <Field label="Preço de compra">

              <input
                value={
                  p.preco_custo ??
                  ""
                }
                onChange={(e) =>
                  setP({
                    ...p,

                    preco_custo:
                      toNum(
                        e.target
                          .value
                      ),
                  })
                }
                inputMode="decimal"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

            <Field label="Preço de venda">

              <input
                value={
                  p.preco_venda ??
                  ""
                }
                onChange={(e) =>
                  setP({
                    ...p,

                    preco_venda:
                      toNum(
                        e.target
                          .value
                      ),
                  })
                }
                inputMode="decimal"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

            <Field label="Estoque">

              <input
                value={
                  p.estoque ??
                  0
                }
                onChange={(e) =>
                  setP({
                    ...p,

                    estoque:
                      Math.max(
                        0,
                        Number(
                          toInt(
                            e.target
                              .value
                          ) ??
                            0
                        )
                      ),
                  })
                }
                inputMode="numeric"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

            <Field label="PMC catálogo">

              <input
                value={
                  p.pmc ?? ""
                }
                onChange={(e) =>
                  setP({
                    ...p,

                    pmc:
                      toNum(
                        e.target
                          .value
                      ),
                  })
                }
                inputMode="decimal"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

          </div>

          {/* LUCRO */}

          <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3">

            <div>

              <div className="text-[10px] font-black uppercase text-slate-400">
                Lucro / un.
              </div>

              <div
                className={`font-black ${
                  lucroN !== null &&
                  lucroN >= 0
                    ? "text-green-700"
                    : "text-red-600"
                }`}
              >
                {lucroN === null
                  ? "—"
                  : brl(
                      lucroN
                    )}
              </div>

            </div>

            <div>

              <div className="text-[10px] font-black uppercase text-slate-400">
                Margem
              </div>

              <div
                className={`font-black ${
                  margemN !== null &&
                  margemN >= 0
                    ? "text-green-700"
                    : "text-red-600"
                }`}
              >
                {margemN === null
                  ? "—"
                  : `${margemN
                      .toFixed(
                        1
                      )
                      .replace(
                        ".",
                        ","
                      )}%`}
              </div>

            </div>

          </div>

          {/* DADOS COMPLETOS */}

          <div className="mt-4 grid gap-3 md:grid-cols-3">

            <Field label="Laboratório">

              <input
                value={
                  p.laboratorio ??
                  ""
                }
                onChange={(e) =>
                  setP({
                    ...p,

                    laboratorio:
                      e.target
                        .value,
                  })
                }
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

            <Field label="Categoria">

              <input
                value={
                  p.categoria ??
                  ""
                }
                onChange={(e) =>
                  setP({
                    ...p,

                    categoria:
                      e.target
                        .value,
                  })
                }
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

            <Field label="Apresentação">

              <input
                value={
                  p.apresentacao ??
                  ""
                }
                onChange={(e) =>
                  setP({
                    ...p,

                    apresentacao:
                      e.target
                        .value,
                  })
                }
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

            <Field label="Promoção">

              <SelectBool
                value={
                  !!p.em_promocao
                }
                onChange={(v) =>
                  setP({
                    ...p,
                    em_promocao:
                      v,
                  })
                }
              />

            </Field>

            <Field label="Preço promo">

              <input
                value={
                  p.preco_promocional ??
                  ""
                }
                onChange={(e) =>
                  setP({
                    ...p,

                    preco_promocional:
                      toNum(
                        e.target
                          .value
                      ),
                  })
                }
                inputMode="decimal"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

            <Field label="OFF (%)">

              <input
                value={
                  p.percentual_off ??
                  ""
                }
                onChange={(e) =>
                  setP({
                    ...p,

                    percentual_off:
                      toNum(
                        e.target
                          .value
                      ),
                  })
                }
                inputMode="decimal"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

            <Field label="Destaque">

              <SelectBool
                value={
                  !!p.destaque_home
                }
                onChange={(v) =>
                  setP({
                    ...p,

                    destaque_home:
                      v,
                  })
                }
              />

            </Field>

            <Field label="FV">

              <SelectBool
                value={
                  !!p.disponivel_farmacia
                }
                onChange={(v) =>
                  setP({
                    ...p,

                    disponivel_farmacia:
                      v,
                  })
                }
              />

            </Field>

            <Field label="Site">

              <SelectBool
                value={
                  !!p.ativo_site
                }
                onChange={(v) =>
                  setP({
                    ...p,

                    ativo_site:
                      v,
                  })
                }
              />

            </Field>

            <Field label="PDV">

              <SelectBool
                value={
                  !!p.ativo_pdv
                }
                onChange={(v) =>
                  setP({
                    ...p,

                    ativo_pdv:
                      v,
                  })
                }
              />

            </Field>

            <Field
              label="Imagens (JSON ou URLs)"
              className="md:col-span-3"
            >

              <textarea
                defaultValue={
                  imagensText
                }
                onChange={(e) =>
                  setP({
                    ...p,

                    imagens:
                      safeJsonArray(
                        e.target
                          .value
                      ),
                  })
                }
                rows={3}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
              />

            </Field>

          </div>

        </div>

        {/* RODAPÉ */}

        <div className="grid grid-cols-2 gap-2 border-t bg-white p-3">

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border py-3 font-black"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-xl bg-blue-800 py-3 font-black text-white disabled:opacity-50"
          >
            {saving
              ? "Salvando..."
              : "SALVAR"}
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   COMPONENTES AUXILIARES
========================================================= */

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${
        active
          ? "bg-blue-800 text-white"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function StatusPill({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-black ${
        active
          ? "bg-green-100 text-green-800"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}{" "}
      {active
        ? "✓"
        : "—"}
    </span>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    v: string
  ) => void;
}) {
  return (
    <label className="block">

      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">
        {label}
      </span>

      <div className="flex items-center rounded-xl border-2 border-slate-200 bg-white px-3 focus-within:border-blue-600">

        <span className="mr-2 text-sm font-black text-slate-500">
          R$
        </span>

        <input
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          inputMode="decimal"
          placeholder="0,00"
          className="min-w-0 flex-1 py-3 text-lg font-black outline-none"
        />

      </div>

    </label>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    v: string
  ) => void;
}) {
  return (
    <Field label={label}>

      <input
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        inputMode="decimal"
        placeholder="0,00"
        className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
      />

    </Field>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children:
    React.ReactNode;
}) {
  return (
    <label
      className={
        className
      }
    >

      <div className="mb-1 text-xs font-bold text-slate-600">
        {label}
      </div>

      {children}

    </label>
  );
}

function SelectBool({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (
    v: boolean
  ) => void;
}) {
  return (
    <select
      value={
        value
          ? "1"
          : "0"
      }
      onChange={(e) =>
        onChange(
          e.target.value ===
            "1"
        )
      }
      className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-600"
    >
      <option value="0">
        Não
      </option>

      <option value="1">
        Sim
      </option>

    </select>
  );
}

function QuickToggle({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (
    v: boolean
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !value
        )
      }
      disabled={
        disabled
      }
      className={`rounded-xl border px-2 py-2 text-xs font-black ${
        value
          ? "border-green-600 bg-green-600 text-white"
          : "border-slate-200 bg-white text-slate-600"
      } disabled:opacity-50`}
    >
      {label}:{" "}
      {value
        ? "Sim"
        : "Não"}
    </button>
  );
}