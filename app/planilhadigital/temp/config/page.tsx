"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useLoja } from "../_components/LojaProvider";

type Local = {
  id: string;
  loja_id: string;
  nome: string;
  tipo: "geladeira" | "ambiente" | "camara" | string;
  temp_min: number;
  temp_max: number;
  umid_min: number | null;
  umid_max: number | null;
  ativo: boolean;
  created_at: string;
};

type FormState = {
  id?: string;
  nome: string;
  tipo: string;
  temp_min: string;
  temp_max: string;
  umid_min: string;
  umid_max: string;
  ativo: boolean;
};

function toNum(s: string) {
  const v = Number((s || "").replace(",", "."));
  return Number.isNaN(v) ? null : v;
}

export default function TempConfigPage() {
  const { lojaId, role, loading: lojaLoading } = useLoja();
  const canEdit = useMemo(() => ["gerente", "admin"].includes(role), [role]);

  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({
    nome: "",
    tipo: "geladeira",
    temp_min: "2",
    temp_max: "8",
    umid_min: "",
    umid_max: "",
    ativo: true,
  });

  async function loadLocais() {
    if (!lojaId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("temp_locais")
      .select("id,loja_id,nome,tipo,temp_min,temp_max,umid_min,umid_max,ativo,created_at")
      .eq("loja_id", lojaId)
      .order("nome");

    if (error) {
      console.error(error);
      setLocais([]);
      setLoading(false);
      return;
    }
    setLocais((data || []) as any);
    setLoading(false);
  }

  useEffect(() => {
    if (lojaLoading || !lojaId) return;
    loadLocais();

    const channel = supabase
      .channel("rt-temp-locais")
      .on({ event: "*", schema: "public", table: "temp_locais" }, () => loadLocais())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId, lojaLoading]);

  function openNew() {
    setForm({
      nome: "",
      tipo: "geladeira",
      temp_min: "2",
      temp_max: "8",
      umid_min: "",
      umid_max: "",
      ativo: true,
    });
    setShowForm(true);
  }

  function openEdit(l: Local) {
    setForm({
      id: l.id,
      nome: l.nome,
      tipo: l.tipo,
      temp_min: String(l.temp_min ?? ""),
      temp_max: String(l.temp_max ?? ""),
      umid_min: l.umid_min == null ? "" : String(l.umid_min),
      umid_max: l.umid_max == null ? "" : String(l.umid_max),
      ativo: !!l.ativo,
    });
    setShowForm(true);
  }

  async function save() {
    if (!canEdit) return;
    if (!lojaId) return;

    const payload: any = {
      loja_id: lojaId,
      nome: form.nome.trim(),
      tipo: form.tipo,
      temp_min: toNum(form.temp_min),
      temp_max: toNum(form.temp_max),
      umid_min: form.umid_min ? toNum(form.umid_min) : null,
      umid_max: form.umid_max ? toNum(form.umid_max) : null,
      ativo: !!form.ativo,
    };

    if (!payload.nome) return alert("Informe o nome do local.");
    if (payload.temp_min == null || payload.temp_max == null) return alert("Informe temp mínima/máxima.");
    if (payload.temp_min >= payload.temp_max) return alert("Temp mínima deve ser menor que a máxima.");

    setSaving(true);

    if (form.id) {
      const { error } = await supabase.from("temp_locais").update(payload).eq("id", form.id);
      setSaving(false);
      if (error) return alert("Erro ao atualizar: " + error.message);
      setShowForm(false);
      await loadLocais();
    } else {
      const { error } = await supabase.from("temp_locais").insert(payload);
      setSaving(false);
      if (error) return alert("Erro ao criar: " + error.message);
      setShowForm(false);
      await loadLocais();
    }
  }

  async function toggleAtivo(l: Local) {
    if (!canEdit) return;
    const { error } = await supabase.from("temp_locais").update({ ativo: !l.ativo }).eq("id", l.id);
    if (error) alert("Erro: " + error.message);
    else await loadLocais();
  }

  if (lojaLoading) return <div className="p-4">Carregando…</div>;

  return (
    <div className="p-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Temperatura — Configuração</h1>
          <p className="text-sm opacity-70">
            {canEdit ? "Gerencie locais e limites (RLS valida no banco)." : "Somente gerente/admin pode editar."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/planilhadigital/temp" className="rounded border px-3 py-2 text-sm hover:bg-black/5">
            Dashboard
          </Link>
          <Link href="/planilhadigital/temp/registro" className="rounded border px-3 py-2 text-sm hover:bg-black/5">
            Registrar
          </Link>
          <Link href="/planilhadigital/temp/alertas" className="rounded border px-3 py-2 text-sm hover:bg-black/5">
            Alertas
          </Link>

          {canEdit ? (
            <button onClick={openNew} className="rounded bg-black px-3 py-2 text-sm text-white">
              + Novo local
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p className="mt-4">Carregando…</p>
      ) : locais.length === 0 ? (
        <div className="mt-6 rounded border p-4 text-sm opacity-80">
          Nenhum local cadastrado.
          {canEdit ? (
            <div className="mt-3">
              <button onClick={openNew} className="rounded bg-black px-3 py-2 text-sm text-white">
                Criar primeiro local
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {locais.map((l) => (
            <div key={l.id} className="rounded border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{l.nome}</div>
                  <div className="text-xs opacity-70">
                    {l.tipo} • {l.ativo ? "Ativo" : "Inativo"}
                  </div>
                </div>

                {canEdit ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(l)} className="rounded border px-3 py-1.5 text-sm hover:bg-black/5">
                      Editar
                    </button>
                    <button onClick={() => toggleAtivo(l)} className="rounded border px-3 py-1.5 text-sm hover:bg-black/5">
                      {l.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 text-sm">
                <div>
                  Temp: <b>{l.temp_min}</b> a <b>{l.temp_max}</b> °C
                </div>
                <div className="opacity-80">
                  Umid: <b>{l.umid_min == null ? "—" : l.umid_min}</b> a <b>{l.umid_max == null ? "—" : l.umid_max}</b> %
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{form.id ? "Editar local" : "Novo local"}</div>
              <button onClick={() => setShowForm(false)} className="rounded border px-2 py-1 text-sm hover:bg-black/5">
                Fechar
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm">Nome</span>
                <input className="mt-1 w-full rounded border p-2" value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Ex: Geladeira 1" />
              </label>

              <label className="block">
                <span className="text-sm">Tipo</span>
                <select className="mt-1 w-full rounded border p-2" value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
                  <option value="geladeira">geladeira</option>
                  <option value="ambiente">ambiente</option>
                  <option value="camara">camara</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm">Temp mínima (°C)</span>
                  <input className="mt-1 w-full rounded border p-2" value={form.temp_min}
                    onChange={(e) => setForm((p) => ({ ...p, temp_min: e.target.value }))} inputMode="decimal" />
                </label>
                <label className="block">
                  <span className="text-sm">Temp máxima (°C)</span>
                  <input className="mt-1 w-full rounded border p-2" value={form.temp_max}
                    onChange={(e) => setForm((p) => ({ ...p, temp_max: e.target.value }))} inputMode="decimal" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm">Umid mín (%)</span>
                  <input className="mt-1 w-full rounded border p-2" value={form.umid_min}
                    onChange={(e) => setForm((p) => ({ ...p, umid_min: e.target.value }))} inputMode="decimal" placeholder="opcional" />
                </label>
                <label className="block">
                  <span className="text-sm">Umid máx (%)</span>
                  <input className="mt-1 w-full rounded border p-2" value={form.umid_max}
                    onChange={(e) => setForm((p) => ({ ...p, umid_max: e.target.value }))} inputMode="decimal" placeholder="opcional" />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.ativo} onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))} />
                Ativo
              </label>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="rounded border px-3 py-2 text-sm hover:bg-black/5">
                  Cancelar
                </button>
                <button onClick={save} disabled={!canEdit || saving}
                  className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50">
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}