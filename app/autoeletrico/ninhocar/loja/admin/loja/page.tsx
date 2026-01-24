"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { brl } from "@/lib/brl";

const BASE = "/autoeletrico/ninhocar";
const BUCKET = "ninho_car";

// simples (front). Se quiser endurecer depois, a gente coloca auth.
const SENHA_ADMIN = "102030";

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}
function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

type Produto = {
  id: string;
  nome: string;
  slug: string;
  ean: string | null;
  estoque: number;
  preco: number;
  preco_promocional: number | null;
  em_promocao: boolean;
  categoria: string | null;
  imagens: string[] | null;
  ativo: boolean;
  created_at: string;
};

function getImagemUrl(p: Produto) {
  const img = (p.imagens?.[0] || "").trim();
  if (!img) return "/placeholder-produto.png";
  try {
    return img.startsWith("http") ? encodeURI(img) : img;
  } catch {
    return img;
  }
}

export default function AdminNinhoCarLoja() {
  const [authed, setAuthed] = useState(false);
  const [senha, setSenha] = useState("");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Produto[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"conveniencia" | "auto">("conveniencia");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ninhocar_produtos")
      .select("id,nome,slug,ean,estoque,preco,preco_promocional,em_promocao,categoria,imagens,ativo,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      setItems([]);
    } else {
      setItems((data || []) as Produto[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  const filtered = useMemo(() => {
    const qq = norm(q);
    const digits = onlyDigits(q);

    return items.filter((p) => {
      const cat = norm(p.categoria || "");
      const isConv = cat.includes("conven") || cat.includes("conveni") || cat === "conv";
      const isAuto = cat.includes("auto") || cat.includes("eletric") || cat.includes("som") || cat.includes("acessor");

      if (tab === "conveniencia" && !isConv) return false;
      if (tab === "auto" && !isAuto) return false;

      if (!qq && !digits) return true;
      const blob = norm(`${p.nome} ${p.slug} ${p.categoria || ""}`);
      const eanDigits = onlyDigits(p.ean || "");
      return (qq && blob.includes(qq)) || (digits && eanDigits.includes(digits));
    });
  }, [items, q, tab]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
          <div className="text-xl font-extrabold">Admin • Ninho Car</div>
          <div className="mt-2 text-sm text-zinc-400">Digite a senha do admin.</div>

          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            type="password"
            className="mt-4 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
          />

          <button
            onClick={() => {
              if (senha === SENHA_ADMIN) setAuthed(true);
              else alert("Senha incorreta");
            }}
            className="mt-4 w-full rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-extrabold text-zinc-950 hover:brightness-110"
          >
            Entrar
          </button>

          <Link
            href={`${BASE}/loja`}
            className="mt-3 block text-center text-sm text-zinc-400 hover:text-zinc-200"
          >
            Voltar pra loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href={`${BASE}/loja`} className="flex items-center gap-3">
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
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
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

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Admin <span className="text-yellow-400">Ninho Car</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-400">Agora com EAN + Estoque + Foto (camera).</p>
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
              onClick={() => setTab("auto")}
              className={`rounded-2xl px-4 py-2 text-sm font-extrabold border ${
                tab === "auto"
                  ? "bg-yellow-400 text-zinc-950 border-yellow-300"
                  : "bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              ⚡ Auto Elétrico
            </button>
          </div>
        </div>

        <div className="mt-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, categoria, slug ou EAN..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
          />
          <div className="mt-2 text-xs text-zinc-500">Dica: cole o EAN aqui e ele acha na hora.</div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-zinc-400">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-sm text-zinc-300">
              Nenhum item encontrado nesta aba.
              <div className="mt-3">
                <button
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                  className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-extrabold text-zinc-950 hover:brightness-110"
                >
                  + Cadastrar primeiro item
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((p) => {
                const precoFinal =
                  p.em_promocao && p.preco_promocional ? Number(p.preco_promocional) : Number(p.preco);

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 flex flex-col gap-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-14 w-14 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                        <img
                          src={getImagemUrl(p)}
                          alt={p.nome}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold">{p.nome}</div>
                        <div className="text-xs text-zinc-400">
                          {p.categoria || "—"} • {p.ean ? `EAN: ${p.ean}` : "Sem EAN"} • Est: {p.estoque}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm font-extrabold text-yellow-300">{brl(precoFinal)}</span>
                          {p.em_promocao && p.preco ? (
                            <span className="text-xs text-zinc-400 line-through">{brl(p.preco)}</span>
                          ) : null}
                          {!p.ativo ? (
                            <span className="text-[11px] rounded-full bg-red-500/15 px-2 py-1 font-bold text-red-300">
                              Inativo
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => {
                          setEditing(p);
                          setModalOpen(true);
                        }}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-bold hover:bg-zinc-900"
                      >
                        Editar
                      </button>

                      <button
                        onClick={async () => {
                          const next = !p.em_promocao;
                          const { error } = await supabase
                            .from("ninhocar_produtos")
                            .update({ em_promocao: next })
                            .eq("id", p.id);

                          if (error) alert(error.message);
                          else load();
                        }}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-bold hover:bg-zinc-900"
                      >
                        {p.em_promocao ? "Tirar promo" : "Promo"}
                      </button>

                      <button
                        onClick={async () => {
                          const next = !p.ativo;
                          const { error } = await supabase
                            .from("ninhocar_produtos")
                            .update({ ativo: next })
                            .eq("id", p.id);

                          if (error) alert(error.message);
                          else load();
                        }}
                        className={`rounded-xl px-3 py-2 text-xs font-bold border ${
                          p.ativo
                            ? "border-red-900/60 bg-red-950/30 text-red-200 hover:bg-red-950/50"
                            : "border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
                        }`}
                      >
                        {p.ativo ? "Desativar" : "Ativar"}
                      </button>
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

      <ProdutoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSaved={() => {
          setModalOpen(false);
          load();
        }}
      />
    </div>
  );
}

function ProdutoModal({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: Produto | null;
  onSaved: () => void;
}) {
  const isEdit = !!editing;

  const [nome, setNome] = useState(editing?.nome || "");
  const [ean, setEan] = useState(editing?.ean || "");
  const [estoque, setEstoque] = useState(String(editing?.estoque ?? 0));
  const [slug, setSlug] = useState(editing?.slug || "");
  const [categoria, setCategoria] = useState(editing?.categoria || "Conveniência");
  const [preco, setPreco] = useState(String(editing?.preco ?? 0));
  const [emPromocao, setEmPromocao] = useState(!!editing?.em_promocao);
  const [precoPromo, setPrecoPromo] = useState(String(editing?.preco_promocional ?? 0));
  const [ativo, setAtivo] = useState(editing?.ativo ?? true);

  const [imgUrl, setImgUrl] = useState<string>((editing?.imagens?.[0] || "").trim());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(editing?.nome || "");
      setEan(editing?.ean || "");
      setEstoque(String(editing?.estoque ?? 0));
      setSlug(editing?.slug || "");
      setCategoria(editing?.categoria || "Conveniência");
      setPreco(String(editing?.preco ?? 0));
      setEmPromocao(!!editing?.em_promocao);
      setPrecoPromo(String(editing?.preco_promocional ?? 0));
      setAtivo(editing?.ativo ?? true);
      setImgUrl((editing?.imagens?.[0] || "").trim());
      setUploading(false);
      setSaving(false);
    }
  }, [open, editing]);

  useEffect(() => {
    if (!slug && nome) setSlug(slugify(nome));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome]);

  if (!open) return null;

  async function uploadFoto(file: File) {
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `produtos/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

      if (upErr) throw new Error(upErr.message);

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (!data?.publicUrl) throw new Error("Não consegui gerar URL pública.");

      setImgUrl(data.publicUrl);
    } catch (e: any) {
      console.error(e);
      alert(`Erro no upload: ${e?.message || "erro"}`);
    } finally {
      setUploading(false);
    }
  }

  async function salvar() {
    if (!nome.trim()) return alert("Informe o nome.");
    if (!slug.trim()) return alert("Slug vazio.");

    const payload: any = {
      nome: nome.trim(),
      slug: slug.trim(),
      ean: onlyDigits(ean) || null,
      estoque: Number(estoque || 0),
      categoria: categoria?.trim() || null,
      preco: Number(String(preco || "0").replace(",", ".")),
      em_promocao: !!emPromocao,
      preco_promocional: emPromocao ? Number(String(precoPromo || "0").replace(",", ".")) : null,
      imagens: imgUrl ? [imgUrl] : [],
      ativo: !!ativo,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    try {
      if (isEdit && editing) {
        const { error } = await supabase
          .from("ninhocar_produtos")
          .update(payload)
          .eq("id", editing.id);

        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("ninhocar_produtos").insert([payload]);
        if (error) throw new Error(error.message);
      }

      alert("✅ Salvo!");
      onSaved();
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao salvar: ${e?.message || "erro"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold">
              {isEdit ? "Editar item" : "Novo item"} •{" "}
              <span className="text-yellow-300">{categoria || "Categoria"}</span>
            </div>
            <div className="text-xs text-zinc-400">EAN + Estoque + Foto (camera).</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold hover:bg-zinc-800"
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4">
            <div className="text-sm font-extrabold">Foto do item</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-20 w-20 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                <img
                  src={imgUrl ? encodeURI(imgUrl) : "/placeholder-produto.png"}
                  alt="Prévia"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1">
                <div className="text-xs text-zinc-400">
                  No celular, isso abre a câmera traseira.
                </div>

                <label className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-xl bg-yellow-400 px-3 py-2 text-xs font-extrabold text-zinc-950 hover:brightness-110">
                  {uploading ? "Enviando..." : "Tirar foto"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadFoto(f);
                    }}
                  />
                </label>

                <div className="mt-2 text-[11px] text-zinc-500">
                  A foto enviada vira a capa.
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              URL atual (se quiser colar outra):<br />
              <input
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4">
            <div className="grid gap-3">
              <div>
                <div className="text-xs text-zinc-400">Nome</div>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-zinc-400">EAN</div>
                  <input
                    value={ean}
                    onChange={(e) => setEan(onlyDigits(e.target.value))}
                    className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
                    placeholder="789..."
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Estoque</div>
                  <input
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-zinc-400">Slug</div>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Categoria</div>
                  <input
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
                    placeholder="Conveniência / Auto Elétrica / Acessórios..."
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-zinc-400">Preço</div>
                  <input
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
                    placeholder="0"
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Preço promocional</div>
                  <input
                    value={precoPromo}
                    onChange={(e) => setPrecoPromo(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
                    placeholder="0"
                    disabled={!emPromocao}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={emPromocao}
                    onChange={(e) => setEmPromocao(e.target.checked)}
                  />
                  Em promoção
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
                  Ativo
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-bold hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={saving || uploading}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-extrabold text-zinc-950 hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
