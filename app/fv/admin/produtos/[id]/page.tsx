"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Produto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string;
  categoria: string | null;
  apresentacao: string | null;
  pmc: number | null;
  em_promocao: boolean;
  preco_promocional: number | null;
  percentual_off: number | null;
  ativo: boolean;
  destaque_home: boolean;
  imagens: string[] | null;
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminEditProdutoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [p, setP] = useState<Produto | null>(null);

  // campos editáveis
  const [pmc, setPmc] = useState<string>("");
  const [emPromocao, setEmPromocao] = useState<boolean>(false);
  const [precoPromo, setPrecoPromo] = useState<string>("");
  const [ativo, setAtivo] = useState<boolean>(true);
  const [destaque, setDestaque] = useState<boolean>(false);
  const [imagens, setImagens] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fv_produtos")
        .select("id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,ativo,destaque_home,imagens")
        .eq("id", id)
        .single();

      if (error) throw error;

      const prod = data as Produto;
      setP(prod);

      setPmc(prod.pmc != null ? String(prod.pmc) : "");
      setEmPromocao(!!prod.em_promocao);
      setPrecoPromo(prod.preco_promocional != null ? String(prod.preco_promocional) : "");
      setAtivo(!!prod.ativo);
      setDestaque(!!prod.destaque_home);
      setImagens(Array.isArray(prod.imagens) ? prod.imagens : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const pmcNum = useMemo(() => toNum(pmc), [pmc]);
  const promoNum = useMemo(() => toNum(precoPromo), [precoPromo]);

  // preview OFF local (o banco também calcula via trigger)
  const previewOff = useMemo(() => {
    if (!emPromocao) return null;
    if (!pmcNum || pmcNum <= 0) return null;
    if (!promoNum || promoNum <= 0) return null;
    const off = Math.round(((pmcNum - promoNum) / pmcNum) * 100);
    if (!Number.isFinite(off)) return null;
    return off;
  }, [emPromocao, pmcNum, promoNum]);

  async function salvar() {
    // validações mínimas
    if (!pmcNum || pmcNum <= 0) {
      alert("Informe um PMC válido (maior que 0).");
      return;
    }
    if (emPromocao && (!promoNum || promoNum <= 0)) {
      alert("Promoção ativa: informe o Preço Promocional.");
      return;
    }
    if (emPromocao && promoNum! >= pmcNum) {
      alert("Preço promocional deve ser menor que o PMC.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        pmc: pmcNum,
        em_promocao: emPromocao,
        preco_promocional: emPromocao ? promoNum : null,
        ativo,
        destaque_home: destaque,
        imagens: imagens.length ? imagens : null,
      };

      const { error } = await supabase.from("fv_produtos").update(payload).eq("id", id);
      if (error) throw error;

      // recarrega para pegar percentual_off do trigger
      await load();
      alert("Salvo com sucesso!");
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  // 3️⃣ Upload de imagem (Supabase Storage)
  async function uploadImagem(file: File) {
    if (!p) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `produtos/${p.ean}/${Date.now()}.${ext}`;

    // Bucket sugerido: fv_produtos (criar no Storage)
    const { error: upErr } = await supabase.storage.from("fv_produtos").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/jpeg",
    });
    if (upErr) {
      alert(upErr.message);
      return;
    }

    const { data } = supabase.storage.from("fv_produtos").getPublicUrl(path);
    const url = data.publicUrl;

    setImagens((prev) => [url, ...prev].slice(0, 6)); // limita a 6 no MVP
  }

  if (loading || !p) {
    return <div className="p-6 text-gray-600">Carregando produto…</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm text-gray-600">
            <Link className="underline" href="/fv/admin/produtos">← Voltar</Link>
          </div>
          <h1 className="text-xl font-semibold mt-2">Editar Produto (FV)</h1>
          <p className="text-sm text-gray-600">
            <b>{p.nome}</b> — {p.laboratorio} • EAN: <span className="font-mono">{p.ean}</span>
          </p>
        </div>

        <button
          onClick={salvar}
          disabled={saving}
          className="bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Preço e regras */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Preço</h2>

          <label className="block text-sm mb-1">PMC (preço cheio)</label>
          <input
            value={pmc}
            onChange={(e) => setPmc(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            placeholder="Ex: 49.90"
          />

          <div className="flex items-center gap-2 mt-4">
            <input
              id="promo"
              type="checkbox"
              checked={emPromocao}
              onChange={(e) => setEmPromocao(e.target.checked)}
            />
            <label htmlFor="promo" className="text-sm">
              Em promoção
            </label>
          </div>

          <label className="block text-sm mb-1 mt-3">Preço promocional</label>
          <input
            value={precoPromo}
            onChange={(e) => setPrecoPromo(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            placeholder="Ex: 39.90"
            disabled={!emPromocao}
          />

          {/* 4️⃣ Preview */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600">Preview no site</div>
            <div className="mt-1">
              <div className="text-sm">
                De <span className="line-through">{brl(pmcNum)}</span>
              </div>
              <div className="text-lg font-semibold flex items-center gap-2">
                Por {brl(emPromocao ? promoNum : pmcNum)}
                {emPromocao && previewOff != null && (
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                    {previewOff}% OFF
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Obs: % OFF final vem do trigger do banco.
              </div>
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Visibilidade</h2>

          <div className="flex items-center gap-2">
            <input id="ativo" type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
            <label htmlFor="ativo" className="text-sm">Produto ativo (aparece no site)</label>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <input id="home" type="checkbox" checked={destaque} onChange={(e) => setDestaque(e.target.checked)} />
            <label htmlFor="home" className="text-sm">Destaque na Home</label>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Imagens</h3>

            {/* 3️⃣ Upload */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImagem(file);
                e.currentTarget.value = "";
              }}
            />

            {imagens.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {imagens.map((url, idx) => (
                  <div key={url} className="border rounded overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`img-${idx}`} className="w-full h-24 object-cover" />
                    <button
                      className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded"
                      onClick={() => setImagens((prev) => prev.filter((u) => u !== url))}
                      type="button"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600 mt-2">Sem imagens ainda.</div>
            )}

            <div className="text-xs text-gray-500 mt-2">
              Bucket esperado: <b>fv_produtos</b> (Supabase Storage).
            </div>
          </div>
        </div>
      </div>

      {/* Info (somente leitura) */}
      <div className="border rounded-lg p-4 mt-6">
        <h2 className="font-semibold mb-2">Dados do catálogo</h2>
        <div className="text-sm text-gray-700">
          <div><b>Categoria:</b> {p.categoria || "—"}</div>
          <div><b>Apresentação:</b> {p.apresentacao || "—"}</div>
          <div><b>% OFF (banco):</b> {p.percentual_off != null ? `${p.percentual_off}%` : "—"}</div>
        </div>
      </div>
    </div>
  );
}

function toNum(v: string) {
  if (!v) return null;
  const s = v.replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
