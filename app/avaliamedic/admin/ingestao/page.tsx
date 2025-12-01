"use client";

import { useState } from "react";

export const dynamic = "force-static";


export default function IngestaoEnciclopedia() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [categoria, setCategoria] = useState("protocolos");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function enviar(e: any) {
    e.preventDefault();

    if (!arquivo) {
      alert("Selecione um arquivo PDF.");
      return;
    }

    setLoading(true);
    setMensagem("");

    const form = new FormData();
    form.append("arquivo", arquivo);
    form.append("categoria", categoria);

    const resp = await fetch("/avaliamedic/api/ingestao", {
      method: "POST",
      body: form,
    });

    const json = await resp.json();

    if (json.sucesso) {
      setMensagem("📘 Enciclopédia ingerida com sucesso!");
    } else {
      setMensagem("❌ Erro: " + json.error);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-2xl mx-auto bg-white shadow-xl border rounded-2xl p-10">

        <h1 className="text-3xl font-bold text-emerald-700">
          Ingestão de Enciclopédia
        </h1>
        <p className="text-gray-600 mt-2">
          Envie protocolos, bulas, guias de diluição e materiais clínicos.
        </p>

        <form onSubmit={enviar} className="mt-10 space-y-8">

          {/* CATEGORIA */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Categoria
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full mt-1 p-3 border rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
            >
              <option value="protocolos">Protocolos</option>
              <option value="bulas">Bulas</option>
              <option value="diluicoes">Diluições</option>
              <option value="farmaco">Farmacologia</option>
              <option value="uti">UTI Adulto</option>
              <option value="neonatal">Neonatologia</option>
              <option value="obstetricia">Obstetrícia</option>
            </select>
          </div>

          {/* UPLOAD */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Enviar PDF
            </label>

            <label className="mt-2 w-full border-2 border-dashed border-emerald-600 rounded-xl p-8 flex flex-col items-center justify-center text-emerald-700 cursor-pointer hover:bg-emerald-50 transition">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              />

              <span className="font-medium">
                Clique para selecionar o arquivo
              </span>

              {arquivo && (
                <span className="mt-3 text-gray-600 text-sm">
                  {arquivo.name}
                </span>
              )}
            </label>
          </div>

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 text-white p-4 rounded-lg text-lg font-medium hover:bg-emerald-800 transition disabled:opacity-70"
          >
            {loading ? "Processando PDF..." : "Enviar e Processar"}
          </button>
        </form>

        {/* MENSAGEM */}
        {mensagem && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-medium text-center">
            {mensagem}
          </div>
        )}
      </div>
    </main>
  );
}
