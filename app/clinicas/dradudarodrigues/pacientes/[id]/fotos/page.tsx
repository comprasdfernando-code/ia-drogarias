"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TipoFoto = "antes" | "depois";

type FotoPaciente = {
  id: string;
  paciente_id: string;
  tipo: TipoFoto;
  sessao: string | null;
  observacao: string | null;
  image_url: string;
  created_at: string;
};

export default function FotosPacientePage() {
  const params = useParams();
  const pacienteId = String(params?.id || "");

  const [tipo, setTipo] = useState<TipoFoto>("antes");
  const [sessao, setSessao] = useState("Sessão 1");
  const [observacao, setObservacao] = useState("");
  const [fotos, setFotos] = useState<FotoPaciente[]>([]);
  const [loading, setLoading] = useState(false);

  async function carregarFotos() {
    if (!pacienteId) return;

    const { data, error } = await supabase
      .from("clinic_patient_photos")
      .select("*")
      .eq("paciente_id", pacienteId)
      .eq("clinica_slug", "dradudarodrigues")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar fotos: " + error.message);
      return;
    }

    setFotos((data || []) as FotoPaciente[]);
  }

  useEffect(() => {
    carregarFotos();
  }, [pacienteId]);

  async function enviarFoto(file?: File | null) {
    if (!file || !pacienteId) return;

    try {
      setLoading(true);

      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${pacienteId}/${Date.now()}-${tipo}.${ext}`;

      const upload = await supabase.storage
        .from("clinic-patient-photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (upload.error) throw upload.error;

      const publicUrl = supabase.storage
        .from("clinic-patient-photos")
        .getPublicUrl(fileName).data.publicUrl;

      const insert = await supabase.from("clinic_patient_photos").insert({
        clinica_slug: "dradudarodrigues",
        paciente_id: pacienteId,
        tipo,
        sessao,
        observacao,
        image_url: publicUrl,
      });

      if (insert.error) throw insert.error;

      setObservacao("");
      await carregarFotos();
    } catch (err: any) {
      alert("Erro ao enviar foto: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function excluirFoto(id: string) {
    const confirmar = confirm("Deseja excluir essa foto?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("clinic_patient_photos")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao excluir: " + error.message);
      return;
    }

    setFotos((prev) => prev.filter((f) => f.id !== id));
  }

  const agrupadas = useMemo(() => {
    return fotos.reduce<Record<string, FotoPaciente[]>>((acc, foto) => {
      const key = foto.sessao || "Sem sessão";
      acc[key] = acc[key] || [];
      acc[key].push(foto);
      return acc;
    }, {});
  }, [fotos]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-400">Fotos antes/depois</p>
        <h2 className="text-2xl font-bold text-slate-100">
          Evolução do paciente
        </h2>
      </div>

      <div className="rounded-2xl bg-[#5a555d] p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-white">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoFoto)}
              className="w-full rounded-lg bg-[#1f1a22] px-3 py-2 text-white"
            >
              <option value="antes">Antes</option>
              <option value="depois">Depois</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-white">
              Sessão
            </label>
            <input
              value={sessao}
              onChange={(e) => setSessao(e.target.value)}
              className="w-full rounded-lg bg-[#1f1a22] px-3 py-2 text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-white">
              Observação
            </label>
            <input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: início do tratamento, retorno..."
              className="w-full rounded-lg bg-[#1f1a22] px-3 py-2 text-white"
            />
          </div>
        </div>

        <label className="mt-5 inline-block cursor-pointer rounded-xl bg-[#f0b978] px-5 py-3 text-sm font-bold text-[#241722]">
          {loading ? "Enviando..." : "Tirar / enviar foto"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={loading}
            className="hidden"
            onChange={(e) => enviarFoto(e.target.files?.[0])}
          />
        </label>
      </div>

      {fotos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Nenhuma foto cadastrada ainda.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(agrupadas).map(([nomeSessao, lista]) => (
            <div key={nomeSessao} className="rounded-2xl bg-white p-5">
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                {nomeSessao}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {lista.map((foto) => (
                  <div key={foto.id} className="overflow-hidden rounded-xl border">
                    <img
                      src={foto.image_url}
                      alt={foto.tipo}
                      className="h-56 w-full object-cover"
                    />

                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {foto.tipo === "antes" ? "Antes" : "Depois"}
                        </span>

                        <button
                          onClick={() => excluirFoto(foto.id)}
                          className="text-xs font-bold text-red-600"
                        >
                          Excluir
                        </button>
                      </div>

                      {foto.observacao && (
                        <p className="mt-2 text-sm text-slate-600">
                          {foto.observacao}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(foto.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}