"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const PROFILE_LS = "df_cliente_profile";
const TABLE = "df_clientes_pessoas";

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function isCpfValidBasic(cpfRaw: string) {
  const cpf = onlyDigits(cpfRaw);
  if (!cpf) return true; // opcional
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  return true;
}

export type DFClientProfile = {
  responsavel_nome: string;
  whatsapp: string;
  cpf?: string | null;
  nome_fantasia?: string | null;
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
};

export default function ClientProfileGate({
  children,
  onProfileReady,
}: {
  children: React.ReactNode;
  onProfileReady?: (p: DFClientProfile) => void;
}) {
  const [ready, setReady] = useState(false);

  // form
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [cpf, setCpf] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(PROFILE_LS) : null;
    if (!raw) return;
    try {
      const p = JSON.parse(raw) as DFClientProfile;
      if (p?.responsavel_nome && p?.whatsapp) {
        setReady(true);
        onProfileReady?.(p);
      }
    } catch {}
  }, [onProfileReady]);

  async function salvar() {
    if (!nome.trim()) return alert("Informe seu nome.");
    const w = onlyDigits(whats);
    if (w.length < 10) return alert("Informe Whats com DDD (ex: 11999999999).");
    if (!isCpfValidBasic(cpf)) return alert("CPF inválido.");

    const profile: DFClientProfile = {
      responsavel_nome: nome.trim(),
      whatsapp: w,
      cpf: onlyDigits(cpf) || null,
      nome_fantasia: nomeFantasia.trim() || null,
      endereco: endereco.trim() || null,
      numero: numero.trim() || null,
      bairro: bairro.trim() || null,
    };

    // salva local (para preencher carrinho automaticamente)
    localStorage.setItem(PROFILE_LS, JSON.stringify(profile));

    // grava no supabase (sem listar ninguém)
    // insert simples (se quiser evitar duplicado por CPF, deixe CPF UNIQUE no banco)
    const { error } = await supabase.from(TABLE).insert({
      cpf: profile.cpf,
      responsavel_nome: profile.responsavel_nome,
      nome_fantasia: profile.nome_fantasia,
      whatsapp: profile.whatsapp,
      endereco: profile.endereco,
      status_visita: "Novo",
    });

    // se der "duplicate" por CPF (caso unique), ignora
    if (error && !String(error.message || "").toLowerCase().includes("duplicate")) {
      // não bloqueia a loja, mas avisa
      console.log("Cadastro supabase aviso:", error.message);
    }

    setReady(true);
    onProfileReady?.(profile);
  }

  if (ready) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border rounded-3xl shadow-sm p-6">
        <div className="text-xl font-extrabold text-gray-900">Cadastro rápido</div>
        <div className="text-sm text-gray-600 mt-1">
          Para acessar os produtos, preencha seus dados (fica salvo neste navegador).
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome (obrigatório)"
            className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />
          <input
            value={whats}
            onChange={(e) => setWhats(e.target.value)}
            placeholder="WhatsApp com DDD (obrigatório)"
            className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />
          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="CPF (opcional)"
            className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />
          <input
            value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)}
            placeholder="Nome da drogaria (opcional)"
            className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />
          <input
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Endereço (opcional)"
            className="md:col-span-2 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Número (opcional)"
            className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />
          <input
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            placeholder="Bairro (opcional)"
            className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <button
          onClick={salvar}
          className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl py-3 font-extrabold"
        >
          Salvar e continuar
        </button>

        <div className="mt-3 text-[11px] text-gray-500">
          Seus dados ficam salvos no navegador para agilizar o pedido.
        </div>
      </div>
    </div>
  );
}
