"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TABLE = "df_clientes";

type DrogariaCliente = {
  id: string;
  cnpj: string;
  nome_fantasia: string;
  responsavel: string | null;
  telefone: string | null;
  email: string | null;
  senha_pdv: string;

  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;

  ultima_visita: string | null;   // YYYY-MM-DD
  proxima_visita: string | null;  // YYYY-MM-DD
  status_visita: string | null;   // Novo / Em andamento / Visitado
  created_at: string;
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function waLink(phone: string, msg: string) {
  const clean = onlyDigits(phone);
  const text = encodeURIComponent(msg);
  return `https://wa.me/55${clean.startsWith("55") ? clean.slice(2) : clean}?text=${text}`;
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

export default function ClientesDistribuidoraPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DrogariaCliente[]>([]);
  const [q, setQ] = useState("");

  // form
  const [cnpj, setCnpj] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senhaPdv, setSenhaPdv] = useState("");

  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [cep, setCep] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }
    setRows((data || []) as DrogariaCliente[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const blob = `${r.nome_fantasia} ${r.cnpj} ${r.responsavel ?? ""} ${r.telefone ?? ""} ${r.email ?? ""} ${r.endereco ?? ""} ${r.bairro ?? ""} ${r.cidade ?? ""} ${r.uf ?? ""}`.toLowerCase();
      return blob.includes(s);
    });
  }, [rows, q]);

  async function add() {
    const cnpjDigits = onlyDigits(cnpj);
    const telDigits = onlyDigits(telefone);

    if (cnpjDigits.length < 14) return alert("CNPJ inválido.");
    if (!nomeFantasia.trim()) return alert("Nome fantasia obrigatório.");
    if (!senhaPdv.trim()) return alert("Senha PDV obrigatória.");

    const { error } = await supabase.from(TABLE).insert({
      cnpj: cnpjDigits,
      nome_fantasia: nomeFantasia.trim(),
      responsavel: responsavel.trim() || null,
      telefone: telDigits || null,
      email: email.trim() || null,
      senha_pdv: senhaPdv.trim(),

      endereco: endereco.trim() || null,
      bairro: bairro.trim() || null,
      cidade: cidade.trim() || null,
      uf: uf.trim() || null,
      cep: onlyDigits(cep) || null,

      status_visita: "Novo",
    });

    if (error) return alert(error.message);

    // limpa
    setCnpj("");
    setNomeFantasia("");
    setResponsavel("");
    setTelefone("");
    setEmail("");
    setSenhaPdv("");
    setEndereco("");
    setBairro("");
    setCidade("");
    setUf("");
    setCep("");

    load();
  }

  async function remove(id: string) {
    if (!confirm("Remover esta drogaria cliente?")) return;
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return alert(error.message);
    setRows((prev) => prev.filter((x) => x.id !== id));
  }

  async function marcarVisita(r: DrogariaCliente) {
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, "0");
    const dd = String(hoje.getDate()).padStart(2, "0");
    const data = `${yyyy}-${mm}-${dd}`;

    const { error } = await supabase
      .from(TABLE)
      .update({ ultima_visita: data, status_visita: "Visitado" })
      .eq("id", r.id);

    if (error) return alert(error.message);

    setRows((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, ultima_visita: data, status_visita: "Visitado" } : x))
    );

    const end = [r.endereco, r.bairro, r.cidade, r.uf, r.cep].filter(Boolean).join(" - ");
    const msg =
      `Olá, ${r.responsavel || r.nome_fantasia}! Tudo bem?\n\n` +
      `Sou da DF Distribuidora e queria agendar uma visita.\n` +
      `Drogaria: ${r.nome_fantasia}\nCNPJ: ${r.cnpj}\n` +
      `Endereço: ${end || "-"}\n\nQual melhor dia/horário?`;

    if (r.telefone) {
      window.open(waLink(r.telefone, msg), "_blank", "noopener,noreferrer");
    } else {
      alert("Esse cliente não tem telefone/Whats cadastrado.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
          DF Distribuidora • Drogarias (Clientes)
        </h1>
        <p className="text-gray-600 mt-1">Cadastro de drogarias + endereço + marcar visita.</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, CNPJ, cidade, telefone..."
            className="md:col-span-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 flex items-center justify-between">
            <span>Total</span>
            <span className="font-semibold">{rows.length}</span>
          </div>
        </div>

        {/* FORM */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Cadastrar drogaria</h2>
            <button
              onClick={add}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="CNPJ" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder="Nome fantasia" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />

            <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Responsável / Contato" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone/Whats (com DDD)" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />

            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={senhaPdv} onChange={(e) => setSenhaPdv(e.target.value)} placeholder="Senha PDV" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />

            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço" className="md:col-span-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={uf} onChange={(e) => setUf(e.target.value)} placeholder="UF" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="CEP" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
        </div>

        {/* LISTA */}
        <div className="mt-6">
          {loading ? (
            <div className="text-gray-600">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
              Nenhuma drogaria encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtrados.map((r) => (
                <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{r.nome_fantasia}</h3>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">CNPJ:</span> {r.cnpj}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Resp.:</span> {r.responsavel || "—"}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Whats:</span> {r.telefone || "—"}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Email:</span> {r.email || "—"}
                      </p>

                      <p className="text-sm text-gray-600 mt-2">
                        {[r.endereco, r.bairro, r.cidade, r.uf, r.cep].filter(Boolean).join(" - ") || "—"}
                      </p>

                      <p className="text-xs text-gray-500 mt-2">
                        Status: <span className="font-medium">{r.status_visita || "—"}</span> • Última visita:{" "}
                        <span className="font-medium">{fmtDate(r.ultima_visita)}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => remove(r.id)}
                      className="text-xs rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => marcarVisita(r)}
                      className="rounded-xl bg-green-600 px-4 py-2 text-white text-sm font-medium hover:bg-green-700"
                    >
                      Marcar visita
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
