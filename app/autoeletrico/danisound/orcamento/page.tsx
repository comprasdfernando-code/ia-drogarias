"use client";

import { useState } from "react";
import Image from "next/image";

export default function OrcamentoDaniSound() {
  const [nome, setNome] = useState("");
  const [carro, setCarro] = useState("");
  const [servico, setServico] = useState("");
  const [foto, setFoto] = useState<string | null>(null);

  const handleFoto = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const gerarMensagem = () => {
    return `Olá! Quero fazer um orçamento.%0A
Nome: ${nome}%0A
Carro: ${carro}%0A
Serviço desejado: ${servico}%0A
(Se tiver foto, estou enviando aí no WhatsApp!)`;
  };

  const linkWhats = `https://wa.me/5511977844066?text=${gerarMensagem()}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10 text-white">

      {/* TÍTULO */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold neon-red">Solicitar Orçamento</h1>
        <p className="text-zinc-300 text-sm">
          Preencha os dados abaixo e envie sua foto. O Dani responde em poucos minutos.
        </p>
      </div>

      {/* FORMULÁRIO */}
      <div className="card-premium-dark p-6 space-y-6">

        {/* Nome */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Seu nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Fernando Santos"
            className="w-full px-3 py-2 bg-black/40 border border-zinc-700 rounded-lg text-white"
          />
        </div>

        {/* Carro */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Modelo do carro</label>
          <input
            type="text"
            value={carro}
            onChange={(e) => setCarro(e.target.value)}
            placeholder="Ex: Honda Fit 2015"
            className="w-full px-3 py-2 bg-black/40 border border-zinc-700 rounded-lg text-white"
          />
        </div>

        {/* Serviço */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Serviço desejado</label>
          <textarea
            value={servico}
            onChange={(e) => setServico(e.target.value)}
            placeholder="Ex: Instalar multimídia + câmera de ré"
            className="w-full px-3 py-2 bg-black/40 border border-zinc-700 rounded-lg text-white h-24"
          />
        </div>

        {/* Foto */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Enviar foto do problema (opcional)</label>

          <input
            type="file"
            accept="image/*"
            onChange={handleFoto}
            className="w-full text-sm text-zinc-300"
          />

          {foto && (
            <div className="relative w-full h-64 mt-3 rounded-xl overflow-hidden img-neon">
              <Image
                src={foto}
                alt="Foto enviada"
                fill
                className="object-cover"
              />
            </div>
          )}

          <p className="text-xs text-zinc-500">
            Pode ser foto do painel, porta, farol, módulo, multimídia, etc.
          </p>
        </div>

        {/* BOTÃO ENVIAR */}
        <a
          href={linkWhats}
          target="_blank"
          className="btn-neon w-full block text-center py-3 rounded-full text-lg"
        >
          Enviar no WhatsApp
        </a>

      </div>

    </div>
  );
}
