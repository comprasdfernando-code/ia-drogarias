"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}
function num(v: any) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export type CadastroProdutoDefaults = {
  ean?: string;
  nome?: string;
  laboratorio?: string;
  categoria?: string;
  apresentacao?: string;
  pmc?: number | null;
  ativo?: boolean;
};

export default function CadastroProdutoModal({
  open,
  onClose,
  defaults,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  defaults?: CadastroProdutoDefaults;
  onSaved?: (p: { id: string; ean: string; nome: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [ean, setEan] = useState("");
  const [nome, setNome] = useState("");
  const [laboratorio, setLaboratorio] = useState("");
  const [categoria, setCategoria] = useState("");
  const [apresentacao, setApresentacao] = useState("");
  const [pmc, setPmc] = useState<number>(0);
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (!open) return;

    setErr(null);
    setEan(defaults?.ean ? onlyDigits(defaults.ean) : "");
    setNome(defaults?.nome || "");
    setLaboratorio(defaults?.laboratorio || "");
    setCategoria(defaults?.categoria || "");
    setApresentacao(defaults?.apresentacao || "");
    setPmc(defaults?.pmc ? Number(defaults.pmc) : 0);
    setAtivo(defaults?.ativo ?? true);
  }, [open, defaults]);

  async function salvar() {
    const cleanEAN = onlyDigits(ean);
    if (!cleanEAN || cleanEAN.length < 8) {
      setErr("Informe um EAN válido (mín. 8 dígitos).");
      return;
    }
    if (!nome.trim()) {
      setErr("Informe o nome do produto.");
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const payload: any = {
        ean: cleanEAN,
        nome: nome.trim(),
        laboratorio: laboratorio.trim() || null,
        categoria: categoria.trim() || null,
        apresentacao: apresentacao.trim() || null,
        pmc: pmc > 0 ? pmc : null,
        em_promocao: false,
        preco_promocional: null,
        percentual_off: 0,
        destaque_home: false,
        ativo: !!ativo,
        imagens: null,
      };

      const { data, error } = await supabase
        .from("fv_produtos")
        .upsert(payload, { onConflict: "ean" })
        .select("id,ean,nome")
        .single();

      if (error) throw error;

      onSaved?.(data as any);
      onClose();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-extrabold text-blue-950">Cadastrar produto</div>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold"
          >
            Fechar
          </button>
        </div>

        <div className="p-4 grid md:grid-cols-2 gap-3">
          {err ? (
            <div className="md:col-span-2 text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl">
              {err}
            </div>
          ) : null}

          <div>
            <label className="text-xs font-bold text-gray-700">EAN</label>
            <input
              value={ean}
              onChange={(e) => setEan(onlyDigits(e.target.value))}
              className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3 font-mono"
              placeholder="789..."
            />
          </div>

          <div className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
            />
            <span className="text-sm font-bold text-gray-700">Produto ativo</span>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-700">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
              placeholder="Nome do produto"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700">Laboratório</label>
            <input
              value={laboratorio}
              onChange={(e) => setLaboratorio(e.target.value)}
              className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700">Categoria</label>
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
              placeholder="Opcional"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-700">Apresentação</label>
            <input
              value={apresentacao}
              onChange={(e) => setApresentacao(e.target.value)}
              className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700">PMC</label>
            <input
              type="number"
              value={pmc || 0}
              onChange={(e) => setPmc(num(e.target.value))}
              className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3"
              placeholder="Opcional"
            />
          </div>

          <div className="md:col-span-2 mt-2 flex gap-2">
            <button
              onClick={salvar}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold disabled:opacity-50"
            >
              {loading ? "Salvando…" : "Salvar produto"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-white border hover:bg-gray-50 font-extrabold"
            >
              Cancelar
            </button>
          </div>

          <div className="md:col-span-2 text-[11px] text-gray-500">
            Dica: esse modal faz <b>upsert por EAN</b> (se já existir, ele atualiza).
          </div>
        </div>
      </div>
    </div>
  );
}
