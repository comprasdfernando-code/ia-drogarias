// app/dani-sound/orcamento/page.tsx
"use client";

import { FormEvent, useState } from "react";

const WHATSAPP = "5511999999999"; // TROCAR PELO NÚMERO REAL

export default function OrcamentoDaniSound() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carro, setCarro] = useState("");
  const [ano, setAno] = useState("");
  const [servico, setServico] = useState("");
  const [detalhes, setDetalhes] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const mensagem = `
Olá, tudo bem?
Gostaria de um orçamento na Dani Sound.

Nome: ${nome || "-"}
Telefone: ${telefone || "-"}
Carro: ${carro || "-"}
Ano: ${ano || "-"}
Serviço desejado: ${servico || "-"}
Detalhes: ${detalhes || "-"}
    `.trim();

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
      mensagem
    )}`;

    window.open(url, "_blank");
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">
        Orçamento rápido
      </h1>
      <p className="text-sm text-zinc-300 mb-6">
        Preencha os dados e vou te responder no WhatsApp com uma ideia de valor
        e as opções para o seu carro.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-6"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-300">Seu nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="Ex: Fernando"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-300">Seu WhatsApp</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="(11) 9 9999-9999"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-300">Modelo do carro</label>
            <input
              value={carro}
              onChange={(e) => setCarro(e.target.value)}
              className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="Ex: Gol, Onix, HB20..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-300">Ano</label>
            <input
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="Ex: 2015"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-300">Serviço desejado</label>
          <input
            value={servico}
            onChange={(e) => setServico(e.target.value)}
            className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            placeholder="Som, elétrica, LED, acessório..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-300">Detalhes (opcional)</label>
          <textarea
            value={detalhes}
            onChange={(e) => setDetalhes(e.target.value)}
            rows={4}
            className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-emerald-500 resize-none"
            placeholder="Ex: Som corta quando aumenta, carro não pega de manhã, quero colocar LED branco, etc."
          />
        </div>

        <button
          type="submit"
          className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold"
        >
          Enviar no WhatsApp
        </button>

        <p class
