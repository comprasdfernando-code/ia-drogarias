"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

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
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  async function carregarFotos() {
    if (!pacienteId) return;

    setCarregando(true);

    const { data, error } = await supabase
      .from("clinic_patient_photos")
      .select("*")
      .eq("paciente_id", pacienteId)
      .eq("clinica_slug", "dradudarodrigues")
      .order("created_at", { ascending: false });

    if (error) {
      setMensagem("Erro ao carregar fotos: " + error.message);
      setCarregando(false);
      return;
    }

    setFotos((data || []) as FotoPaciente[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregarFotos();
  }, [pacienteId]);

  async function enviarFoto(file?: File | null) {
    if (!file || !pacienteId) return;

    try {
      setLoading(true);
      setMensagem("");

      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${pacienteId}/${Date.now()}-${tipo}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("clinic-patient-photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("clinic-patient-photos")
        .getPublicUrl(fileName);

      const publicUrl = publicData.publicUrl;

      const { error: insertError } = await supabase
        .from("clinic_patient_photos")
        .insert({
          clinica_slug: "dradudarodrigues",
          paciente_id: pacienteId,
          tipo,
          sessao,
          observacao,
          image_url: publicUrl,
        });

      if (insertError) throw insertError;

      setObservacao("");
      setMensagem("Foto enviada com sucesso.");
      await carregarFotos();
    } catch (err: any) {
      setMensagem("Erro ao enviar foto: " + err.message);
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
      setMensagem("Erro ao excluir: " + error.message);
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
    <div className="w-full space-y-6 pb-20 text-slate-100">
      <div>
        <p className="text-sm text-slate-300">Fotos antes/depois</p>
        <h2 className="text-2xl font-bold text-slate-50">
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
              className="w-full rounded-lg bg-[#1f1a22] px-3 py-3 text-white"
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
              className="w-full rounded-lg bg-[#1f1a22] px-3 py-3 text-white"
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
              className="w-full rounded-lg bg-[#1f1a22] px-3 py-3 text-white"
            />
          </div>
        </div>

        <label className="mt-5 inline-flex cursor-pointer rounded-xl bg-[#f0b978] px-5 py-3 text-sm font-bold text-[#241722]">
          {loading ? "Enviando..." : "Tirar / enviar foto"}
          <input
            type="file"
            accept="image/*"
            disabled={loading}
            className="hidden"
            onChange={(e) => enviarFoto(e.target.files?.[0])}
          />
        </label>

        {mensagem && (
          <div className="mt-4 rounded-xl bg-[#211b22] px-4 py-3 text-sm text-white">
            {mensagem}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 text-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Galeria</h3>
          <span className="text-xs text-slate-500">{fotos.length} foto(s)</span>
        </div>

        {carregando ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
            Carregando fotos...
          </div>
        ) : fotos.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
            Nenhuma foto cadastrada ainda.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(agrupadas).map(([nomeSessao, lista]) => (
              <div key={nomeSessao}>
                <h4 className="mb-3 font-bold">{nomeSessao}</h4>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {lista.map((foto) => (
                    <div
                      key={foto.id}
                      className="overflow-hidden rounded-xl border bg-slate-50"
                    >
                      <img
                        src={foto.image_url}
                        alt={foto.tipo}
                        className="h-64 w-full object-cover"
                      />

                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
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
                          {foto.created_at
                            ? new Date(foto.created_at).toLocaleString("pt-BR")
                            : ""}
                        </p>

                        <a
                          href={foto.image_url}
                          target="_blank"
                          className="mt-2 block text-xs font-bold text-blue-600"
                        >
                          Abrir imagem
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}