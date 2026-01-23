"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { brl } from "@/lib/brl";

/** =========================
 *  CONFIG NINHO CAR
========================= */
const BASE = "/autoeletrico/ninhocar";
const SENHA_ADMIN = "102030"; // troque se quiser
const BUCKET = "ninho_car";   // ✅ seu bucket já existe e está PUBLIC

type Produto = {
  id: string;
  nome: string | null;
  slug: string | null;
  preco: number | null;
  preco_promocional: number | null;
  em_promocao: boolean | null;
  imagens: string[] | null;
  categoria: string | null;
  ativo: boolean | null;
  created_at?: string | null;
};

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function isConv(categoria: string | null) {
  const c = norm(categoria || "");
  return c.includes("conven") || c.includes("conveni") || c === "conv";
}

// Tudo que não for conveniência cai em Auto Elétrico (simples e prático)
function isAutoEletrico(categoria: string | null) {
  return !isConv(categoria);
}

function getImagem(p: Produto) {
  const img = p.imagens?.[0];
  return img && img.trim().length > 0 ? img : "/placeholder-produto.png";
}

function slugify(input: string) {
  return norm(input)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function onlyNumber(v: string) {
  // aceita 10,99 ou 10.99
  const cleaned = v.replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** =========================
 *  STORAGE HELPERS
========================= */
async function uploadFotoNinhoCar(file: File) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";

  const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;
  const storagePath = `produtos/${filename}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || `image/${safeExt}`,
  });

  if (error) throw new Error(error.message);

  // bucket é PUBLIC, então podemos pegar URL pública
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/** =========================
 *  PAGE
========================= */
export default function AdminLojaNinhoCar() {
  const [ok, setOk] = useState(false);
  const [senha, setSenha] = useState("");

  const [tab, setTab] = useState<"conveniencia" | "autoeletrico">("conveniencia");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Produto[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("produtos")
      .select("id,nome,slug,preco,preco_promocional,em_promocao,imagens,categoria,ativo,created_at")
      .order("nome", { ascending: true });

    if (error) {
      setErr(error.message);
      setItems([]);
    } else {
      setItems((data || []) as Produto[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (ok) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok]);

  const filtered = useMemo(() => {
    const qq = norm(q);

    const list =
      tab === "conveniencia"
        ? items.filter((p) => isConv(p.categoria))
        : items.filter((p) => isAutoEletrico(p.categoria));

    if (!qq) return list;

    return list.filter((p) => {
      const blob = norm(`${p.nome || ""} ${p.slug || ""} ${p.categoria || ""}`);
      return blob.includes(qq);
    });
  }, [items, q, tab]);

  const ativosCount = useMemo(() => filtered.filter((p) => p.ativo).length, [filtered]);

  async function toggleAtivo(p: Produto) {
    const next = !(p.ativo ?? true);
    const { error } = await supabase.from("produtos").update({ ativo: next }).eq("id", p.id);
    if (error) return alert("Erro ao atualizar ativo: " + error.message);

    setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, ativo: next } : x)));
  }

  async function togglePromo(p: Produto) {
    const next = !(p.em_promocao ?? false);
    const payload: any = { em_promocao: next };
    if (!next) payload.preco_promocional = null;

    const { error } = await supabase.from("produtos").update(payload).eq("id", p.id);
    if (error) return alert("Erro ao atualizar promoção: " + error.message);

    setItems((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? { ...x, em_promocao: next, preco_promocional: next ? x.preco_promocional : null }
          : x
      )
    );
  }

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(p: Produto) {
    setEditing(p);
    setModalOpen(true);
  }

  async function handleSave(values: {
    nome: string;
    slug: string;
    categoria: string;
    preco: number;
    em_promocao: boolean;
    preco_promocional: number | null;
    ativo: boolean;
    imagens: string[];
  }) {
    if (!values.nome.trim()) return alert("Nome é obrigatório.");
    if (!values.slug.trim()) return alert("Slug é obrigatório.");
    if (!values.categoria.trim()) return alert("Categoria é obrigatória.");

    if (editing) {
      const { error } = await supabase
        .from("produtos")
        .update({
          nome: values.nome,
          slug: values.slug,
          categoria: values.categoria,
          preco: values.preco,
          em_promocao: values.em_promocao,
          preco_promocional: values.em_promocao ? values.preco_promocional : null,
          ativo: values.ativo,
          imagens: values.imagens,
        })
        .eq("id", editing.id);

      if (error) return alert("Erro ao salvar: " + error.message);

      setItems((prev) =>
        prev.map((x) =>
          x.id === editing.id
            ? {
                ...x,
                nome: values.nome,
                slug: values.slug,
                categoria: values.categoria,
                preco: values.preco,
                em_promocao: values.em_promocao,
                preco_promocional: values.em_promocao ? values.preco_promocional : null,
                ativo: values.ativo,
                imagens: values.imagens,
              }
            : x
        )
      );
    } else {
      const { data, error } = await supabase
        .from("produtos")
        .insert([
          {
            nome: values.nome,
            slug: values.slug,
            categoria: values.categoria,
            preco: values.preco,
            em_promocao: values.em_promocao,
            preco_promocional: values.em_promocao ? values.preco_promocional : null,
            ativo: values.ativo,
            imagens: values.imagens,
          },
        ])
        .select("id,nome,slug,preco,preco_promocional,em_promocao,imagens,categoria,ativo,created_at")
        .single();

      if (error) return alert("Erro ao cadastrar: " + error.message);

      setItems((prev) => [data as Produto, ...prev]);
    }

    setModalOpen(false);
    setEditing(null);
  }

  /** =========================
   *  LOGIN SIMPLES
  ========================= */
  if (!ok) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur sticky top-0 z-40">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href={`${BASE}`} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-400 text-zinc-950 font-black flex items-center justify-center">
                NC
              </div>
              <div className="leading-tight">
                <div className="font-extrabold tracking-wide">
                  NINHO <span className="text-yellow-400">CAR</span>
                </div>
                <div className="text-xs text-zinc-400">Admin • Loja</div>
              </div>
            </Link>

            <Link
              href={`${BASE}/loja`}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
            >
              Ver Loja
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-md px-4 py-10">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h1 className="text-xl font-black">Acesso Admin</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Digite a senha para administrar os itens da Ninho Car.
            </p>

            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              type="password"
              className="mt-5 w-full rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
            />

            <button
              onClick={() => setOk(senha === SENHA_ADMIN)}
              className="mt-4 w-full rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-extrabold text-zinc-950 hover:brightness-110"
            >
              Entrar
            </button>

            <div className="mt-4 text-xs text-zinc-500">
              Depois, se quiser, trocamos isso por Auth (Supabase).
            </div>
          </div>
        </main>
      </div>
    );
  }

  /** =========================
   *  ADMIN
  ========================= */
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href={`${BASE}`} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-400 text-zinc-950 font-black flex items-center justify-center">
              NC
            </div>
            <div className="leading-tight">
              <div className="font-extrabold tracking-wide">
                NINHO <span className="text-yellow-400">CAR</span>
              </div>
              <div className="text-xs text-zinc-400">Admin • Itens</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={openNew}
              className="rounded-xl bg-yellow-400 px-3 py-2 text-sm font-extrabold text-zinc-950 hover:brightness-110"
            >
              + Novo item
            </button>

            <button
              onClick={load}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
            >
              Atualizar
            </button>

            <Link
              href={`${BASE}/loja`}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
            >
              Ver Loja
            </Link>
          </div>
        </div>
      </header>

      {/* Marca d’água */}
      <div
        className="pointer-events-none fixed inset-0 bg-center bg-no-repeat opacity-[0.03]"
        style={{ backgroundImage: "url('/ninhocar/logo-bg.png')", backgroundSize: "560px" }}
      />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Admin <span className="text-yellow-400">Ninho Car</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Cadastre e edite itens da <b>Conveniência</b> e do <b>Auto Elétrico</b>.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTab("conveniencia")}
              className={`rounded-2xl px-4 py-2 text-sm font-extrabold border ${
                tab === "conveniencia"
                  ? "bg-yellow-400 text-zinc-950 border-yellow-300"
                  : "bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              🛒 Conveniência
            </button>

            <button
              onClick={() => setTab("autoeletrico")}
              className={`rounded-2xl px-4 py-2 text-sm font-extrabold border ${
                tab === "autoeletrico"
                  ? "bg-yellow-400 text-zinc-950 border-yellow-300"
                  : "bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              ⚡ Auto Elétrico
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                tab === "conveniencia"
                  ? "Buscar na conveniência (café, bebidas, carregadores...)"
                  : "Buscar auto elétrico (lâmpadas, som, acessórios...)"
              }
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
            />
            <div className="mt-2 text-xs text-zinc-500">
              Regra: categoria contendo “Conveniência” vai pra aba Conveniência. O resto vai pra Auto Elétrico.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="text-xs text-zinc-400">Itens filtrados</div>
            <div className="mt-1 text-2xl font-black">{filtered.length}</div>
            <div className="mt-1 text-xs text-zinc-400">
              Ativos: <b className="text-zinc-200">{ativosCount}</b>
            </div>
            {err ? <div className="mt-2 text-xs text-red-300">Erro: {err}</div> : null}
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-sm text-zinc-300">
              Nenhum item encontrado nesta aba.
              <div className="mt-2">
                <button
                  onClick={openNew}
                  className="rounded-xl bg-yellow-400 px-3 py-2 text-sm font-extrabold text-zinc-950 hover:brightness-110"
                >
                  + Cadastrar primeiro item
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((p) => {
                const precoFinal =
                  p.em_promocao && p.preco_promocional ? p.preco_promocional : p.preco;

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border bg-zinc-900/30 p-3 ${
                      p.ativo ? "border-zinc-800" : "border-red-500/30 opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                        <Image src={getImagem(p)} alt={p.nome || "Item"} fill className="object-cover" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-extrabold">{p.nome || "Sem nome"}</div>

                          {!p.ativo ? (
                            <span className="rounded-full bg-red-500/15 px-2 py-1 text-[11px] font-bold text-red-300">
                              Inativo
                            </span>
                          ) : null}

                          {p.em_promocao ? (
                            <span className="rounded-full bg-yellow-400/15 px-2 py-1 text-[11px] font-bold text-yellow-300">
                              Promo
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                          <span className="rounded-full border border-zinc-800 bg-zinc-950/40 px-2 py-1">
                            {p.categoria || "Sem categoria"}
                          </span>
                          <span className="rounded-full border border-zinc-800 bg-zinc-950/40 px-2 py-1">
                            slug: {p.slug || "—"}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="text-sm font-extrabold text-yellow-300">{brl(precoFinal)}</div>
                          {p.em_promocao && p.preco ? (
                            <div className="text-xs text-zinc-400 line-through">{brl(p.preco)}</div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold hover:bg-zinc-800"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => togglePromo(p)}
                          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold hover:bg-zinc-800"
                        >
                          {p.em_promocao ? "Tirar promo" : "Colocar promo"}
                        </button>

                        <button
                          onClick={() => toggleAtivo(p)}
                          className={`rounded-xl px-3 py-2 text-xs font-extrabold hover:brightness-110 ${
                            p.ativo
                              ? "bg-red-500/15 text-red-200 border border-red-500/30"
                              : "bg-green-500/15 text-green-200 border border-green-500/30"
                          }`}
                        >
                          {p.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10">
          <Link
            href={`${BASE}`}
            className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
          >
            ← Voltar para Home
          </Link>
        </div>
      </main>

      {modalOpen ? (
        <ProdutoModal
          tab={tab}
          initial={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}

/** =========================
 *  MODAL
========================= */
function ProdutoModal({
  tab,
  initial,
  onClose,
  onSave,
}: {
  tab: "conveniencia" | "autoeletrico";
  initial: Produto | null;
  onClose: () => void;
  onSave: (values: {
    nome: string;
    slug: string;
    categoria: string;
    preco: number;
    em_promocao: boolean;
    preco_promocional: number | null;
    ativo: boolean;
    imagens: string[];
  }) => void;
}) {
  const isEdit = !!initial;

  const [nome, setNome] = useState(initial?.nome || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [categoria, setCategoria] = useState(
    initial?.categoria || (tab === "conveniencia" ? "Conveniência" : "Auto Elétrico")
  );

  const [preco, setPreco] = useState(initial?.preco != null ? String(initial.preco) : "");
  const [emPromo, setEmPromo] = useState(!!initial?.em_promocao);
  const [precoPromo, setPrecoPromo] = useState(
    initial?.preco_promocional != null ? String(initial.preco_promocional) : ""
  );

  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [imgs, setImgs] = useState((initial?.imagens || []).join("\n"));

  // upload/camera
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  function parseImgs(text: string) {
    return (text || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  // auto-slug (somente novo)
  useEffect(() => {
    if (isEdit) return;
    setSlug(slugify(nome || ""));
  }, [nome, isEdit]);

  async function handleFilePick(file?: File | null) {
    if (!file) return;

    // preview local
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      setUploading(true);
      const publicUrl = await uploadFotoNinhoCar(file);

      // coloca como capa (primeira linha)
      const current = parseImgs(imgs);
      const next = [publicUrl, ...current.filter((u) => u !== publicUrl)];
      setImgs(next.join("\n"));
    } catch (e: any) {
      alert("Erro no upload da foto: " + (e?.message || "desconhecido"));
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    const p = preco ? onlyNumber(preco) : 0;
    const pp = precoPromo ? onlyNumber(precoPromo) : 0;

    onSave({
      nome: nome.trim(),
      slug: (slug || slugify(nome)).trim(),
      categoria: categoria.trim(),
      preco: p,
      em_promocao: emPromo,
      preco_promocional: emPromo ? pp : null,
      ativo,
      imagens: parseImgs(imgs),
    });
  }

  const capa = preview || parseImgs(imgs)[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-black">
              {isEdit ? "Editar item" : "Novo item"} •{" "}
              <span className="text-yellow-400">
                {tab === "conveniencia" ? "Conveniência" : "Auto Elétrico"}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Foto pelo celular + cadastro rápido.
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold hover:bg-zinc-800"
          >
            Fechar
          </button>
        </div>

        {/* FOTO (CAMERA) */}
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-extrabold">Foto do item</div>
              <div className="text-xs text-zinc-400">
                No celular abre a câmera (traseira) pra tirar foto e já subir.
              </div>
            </div>

            <label
              className={`inline-flex cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold ${
                uploading ? "bg-zinc-800 text-zinc-300" : "bg-yellow-400 text-zinc-950 hover:brightness-110"
              }`}
            >
              {uploading ? "Enviando..." : "📸 Tirar foto"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFilePick(e.target.files?.[0])}
              />
            </label>
          </div>

          {capa ? (
            <div className="mt-4 flex items-center gap-3">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                <Image src={capa} alt="Prévia" fill className="object-cover" />
              </div>
              <div className="text-xs text-zinc-400">
                A foto enviada entra como <b>capa</b> (primeira imagem).
              </div>
            </div>
          ) : null}
        </div>

        {/* FORM */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-400">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Lâmpada LED H7, Cabo auxiliar, Café..."
              className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-gerado pelo nome"
              className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
            />
            <div className="mt-1 text-[11px] text-zinc-500">
              URL: <span className="text-zinc-300">/loja/produto/{slug || "seu-slug"}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Categoria</label>
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder={tab === "conveniencia" ? "Conveniência" : "Auto Elétrico"}
              className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
            />
            <div className="mt-1 text-[11px] text-zinc-500">
              Se contiver “Conveniência”, cai na aba Conveniência.
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Preço</label>
            <input
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="Ex.: 19,90"
              className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={emPromo}
                onChange={(e) => setEmPromo(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="font-bold">Em promoção</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="font-bold">Ativo</span>
            </label>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Preço promocional</label>
            <input
              value={precoPromo}
              onChange={(e) => setPrecoPromo(e.target.value)}
              placeholder="Ex.: 14,90"
              disabled={!emPromo}
              className={`mt-1 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                emPromo
                  ? "border-zinc-800 bg-zinc-900/60 focus:border-yellow-400/60"
                  : "border-zinc-800 bg-zinc-900/20 opacity-60"
              }`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-400">Imagens (1 URL por linha)</label>
            <textarea
              value={imgs}
              onChange={(e) => setImgs(e.target.value)}
              placeholder={`https://.../imagem1.jpg\nhttps://.../imagem2.jpg`}
              className="mt-1 w-full min-h-[110px] rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
            />
            <div className="mt-1 text-[11px] text-zinc-500">
              A primeira URL vira a imagem principal (capa).
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-bold hover:bg-zinc-800"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-extrabold text-zinc-950 hover:brightness-110"
          >
            {isEdit ? "Salvar alterações" : "Cadastrar item"}
          </button>
        </div>
      </div>
    </div>
  );
}
