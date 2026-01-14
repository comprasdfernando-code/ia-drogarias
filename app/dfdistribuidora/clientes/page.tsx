"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ClientList, {
  ClientePessoa,
} from "@/app/dfdistribuidora/_components/ClientList";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TABLE = "df_clientes_pessoas";

// ================= UTIL =================
function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function isCpfValidBasic(cpfRaw: string) {
  const cpf = onlyDigits(cpfRaw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  return true;
}

function waLink(phone: string, msg: string) {
  const clean = onlyDigits(phone);
  if (!clean) return "";
  const text = encodeURIComponent(msg);
  return `https://wa.me/55${clean.startsWith("55") ? clean.slice(2) : clean}?text=${text}`;
}

// ================= PAGE =================
export default function ClientesDistribuidoraPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClientePessoa[]>([]);
  const [q, setQ] = useState("");

  // form
  const [cpf, setCpf] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");

  // ================= LOAD =================
  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setClientes((data || []) as ClientePessoa[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // ================= FILTER =================
  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clientes;
    return clientes.filter((c) => {
      const blob = `
        ${c.cpf}
        ${c.responsavel_nome}
        ${c.nome_fantasia ?? ""}
        ${c.whatsapp ?? ""}
        ${c.email ?? ""}
        ${c.endereco ?? ""}
      `.toLowerCase();
      return blob.includes(s);
    });
  }, [clientes, q]);

  // ================= ACTIONS =================
  async function addCliente() {
    if (!isCpfValidBasic(cpf)) return alert("CPF inválido.");
    if (!responsavelNome.trim())
      return alert("Nome do responsável é obrigatório.");

    const payload = {
      cpf: onlyDigits(cpf),
      responsavel_nome: responsavelNome.trim(),
      nome_fantasia: nomeFantasia.trim() || null,
      whatsapp: onlyDigits(whatsapp) || null,
      email: email.trim() || null,
      endereco: endereco.trim() || null,
      status_visita: "Novo",
    };

    const { error } = await supabase.from(TABLE).insert(payload);

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) {
        return alert("CPF já cadastrado.");
      }
      return alert(error.message);
    }

    // limpa form
    setCpf("");
    setResponsavelNome("");
    setNomeFantasia("");
    setWhatsapp("");
    setEmail("");
    setEndereco("");

    load();
  }

  async function remover(id: string) {
    if (!confirm("Remover este cliente?")) return;
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return alert(error.message);
    setClientes((prev) => prev.filter((c) => c.id !== id));
  }

  async function marcarVisita(c: ClientePessoa) {
    const hoje = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from(TABLE)
      .update({ ultima_visita: hoje, status_visita: "Visitado" })
      .eq("id", c.id);

    if (error) return alert(error.message);

    setClientes((prev) =>
      prev.map((x) =>
        x.id === c.id
          ? { ...x, ultima_visita: hoje, status_visita: "Visitado" }
          : x
      )
    );

    if (!c.whatsapp) return;

    const msg =
      `Olá, ${c.responsavel_nome}! Tudo bem?\n\n` +
      `Sou da DF Distribuidora e queria agendar uma visita.\n` +
      `Loja: ${c.nome_fantasia || "-"}\n` +
      `CPF: ${c.cpf}\n` +
      `Endereço: ${c.endereco || "-"}\n\n` +
      `Qual melhor dia/horário?`;

    window.open(waLink(c.whatsapp, msg), "_blank");
  }

  function copiarWhats(c: ClientePessoa) {
    if (!c.whatsapp) return alert("Sem Whats cadastrado.");
    navigator.clipboard.writeText(c.whatsapp);
    alert("Whats copiado!");
  }

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
          DF Distribuidora • Clientes
        </h1>
        <p className="text-gray-600 mt-1">
          Cadastro por CPF do responsável + nome fantasia da drogaria.
        </p>

        {/* BUSCA */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por CPF, responsável, loja..."
            className="md:col-span-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm flex justify-between">
            <span>Total</span>
            <span className="font-semibold">{clientes.length}</span>
          </div>
        </div>

        {/* FORM */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Cadastrar cliente</h2>
            <button
              onClick={addCliente}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="CPF" className="input" />
            <input value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} placeholder="Nome completo do responsável" className="input" />
            <input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder="Nome fantasia da drogaria" className="input" />
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" className="input" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" />
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço" className="input" />
          </div>
        </div>

        {/* LISTA */}
        <div className="mt-6">
          <ClientList
            clientes={filtrados}
            loading={loading}
            onMarcarVisita={marcarVisita}
            onRemove={remover}
            onCopiarWhats={copiarWhats}
          />
        </div>
      </div>
    </div>
  );
}
