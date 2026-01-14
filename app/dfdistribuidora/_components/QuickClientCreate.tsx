"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TABLE = "df_clientes_pessoas";

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function isCpfValidBasic(cpfRaw: string) {
  const cpf = onlyDigits(cpfRaw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  return true;
}

export default function QuickClientCreate({
  onCreated,
  className = "",
  label = "+ Cadastrar cliente",
}: {
  onCreated?: () => void;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // CPF opcional
  const [cpf, setCpf] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [endereco, setEndereco] = useState("");

  function reset() {
    setCpf("");
    setResponsavelNome("");
    setNomeFantasia("");
    setWhatsapp("");
    setEndereco("");
  }

  async function salvar() {
    if (!responsavelNome.trim()) return alert("Nome do responsável é obrigatório.");

    const cpfDigits = onlyDigits(cpf);
    if (cpfDigits && !isCpfValidBasic(cpfDigits)) return alert("CPF inválido (11 dígitos).");

    setSaving(true);

    const payload = {
      cpf: cpfDigits || null,
      responsavel_nome: responsavelNome.trim(),
      nome_fantasia: nomeFantasia.trim() || null,
      whatsapp: onlyDigits(whatsapp) || null,
      endereco: endereco.trim() || null,
      status_visita: "Novo",
      proxima_visita: null,
    };

    const { error } = await supabase.from(TABLE).insert(payload);

    setSaving(false);

    if (error) {
      if (error.message?.toLowerCase().includes("duplicate")) {
        return alert("CPF já cadastrado.");
      }
      return alert(error.message);
    }

    reset();
    setOpen(false);
    onCreated?.();
    alert("Cliente cadastrado! Já aparece na página de visitas.");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ||
          "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold hover:bg-gray-50"
        }
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl border border-gray-200">
            <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Cadastro rápido</h3>
                <p className="text-sm text-gray-600">CPF opcional • Nome do responsável obrigatório</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>

            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={responsavelNome}
                  onChange={(e) => setResponsavelNome(e.target.value)}
                  placeholder="Nome do responsável (obrigatório)"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="CPF (opcional)"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Nome fantasia (opcional)"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Whats (opcional)"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Endereço (opcional)"
                  className="md:col-span-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                className="rounded-xl bg-blue-700 px-4 py-2 text-white text-sm font-extrabold hover:bg-blue-800 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
