"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnviarPrescricao() {
  const router = useRouter();

  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const form = e.currentTarget;
      const data = new FormData(form);

      const response = await fetch("/avaliamedic/api/analisar", {
        method: "POST",
        body: data,
      });

      // tenta ler como JSON, mas sem quebrar caso venha HTML/texto
      let json: any = null;
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        json = await response.json();
      } else {
        const text = await response.text();
        json = { error: text || "Resposta não-JSON do servidor." };
      }

      // se deu erro HTTP (500 etc), mostra motivo real
      if (!response.ok) {
        console.error("Erro HTTP:", response.status, json);
        alert(
          `Erro ao enviar a prescrição (HTTP ${response.status}).\n\n` +
            (json?.error || "Sem detalhes do servidor.")
        );
        return;
      }

      // sucesso
      if (json?.prescricao_id) {
        router.push(
          `/avaliamedic/processando?prescricao_id=${json.prescricao_id}`
      );
        return;
      }

      // resposta ok mas sem prescricao_id (erro de lógica/contrato)
      console.error("Resposta inesperada do servidor:", json);
      alert(
        "Servidor respondeu, mas não retornou prescricao_id.\n\n" +
          (json?.error || JSON.stringify(json))
      );
    } catch (err: any) {
      console.error("Falha no envio:", err);
      alert(
        "Erro ao enviar a prescrição.\n\n" +
          (err?.message || "Falha desconhecida no navegador.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-black border shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-semibold text-emerald-700">
          Enviar Prescrição
        </h1>
        <p className="text-gray-300 mt-1">
          Envie a foto ou PDF para análise inteligente.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* SETOR */}
          <div>
            <label className="text-sm font-medium text-gray-200">Setor</label>
            <select
              name="setor"
              defaultValue="Pronto Atendimento"
              className="w-full mt-1 p-3 border rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
            >
              <option value="Pronto Atendimento">Pronto Atendimento</option>
              <option value="UTI">UTI</option>
              <option value="UTI Neonatal">UTI Neonatal</option>
              <option value="Obstetrícia">Obstetrícia</option>
              <option value="Internação">Internação</option>
              <option value="Farmácia">Farmácia</option>
            </select>
          </div>

          {/* IDADE */}
          <div>
            <label className="text-sm font-medium text-gray-200">Idade</label>
            <input
              name="idade"
              type="number"
              placeholder="Ex: 32"
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          {/* PESO */}
          <div>
            <label className="text-sm font-medium text-gray-200">
              Peso (kg)
            </label>
            <input
              name="peso"
              type="number"
              placeholder="Ex: 68"
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          {/* ARQUIVO */}
          <div>
            <label className="text-sm font-medium text-gray-200">
              Arquivo da prescrição
            </label>

            <label className="w-full mt-2 flex flex-col items-center justify-center border-2 border-dashed border-emerald-600 rounded-xl p-6 cursor-pointer hover:bg-emerald-50 transition">
              <input
                type="file"
                name="arquivo"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) =>
                  setFileName(e.target.files?.[0]?.name || "")
                }
                required
              />

              <span className="text-emerald-700 font-medium">
                Clique para selecionar o arquivo
              </span>

              {fileName && (
                <span className="mt-2 text-sm text-gray-700">{fileName}</span>
              )}
            </label>
          </div>

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 text-white p-3 rounded-lg font-medium hover:bg-emerald-800 transition disabled:opacity-70"
          >
            {loading ? "Enviando..." : "Enviar para Análise"}
          </button>
        </form>
      </div>
    </main>
  );
}
