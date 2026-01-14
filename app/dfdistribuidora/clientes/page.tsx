"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ClientList, { ClientePessoa } from "@/app/dfdistribuidora/_components/ClientList";

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

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ================= PAGE =================
export default function ClientesDistribuidoraPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClientePessoa[]>([]);
  const [q, setQ] = useState("");

  // form (cadastro)
  const [cpf, setCpf] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [crf, setCrf] = useState(""); // ✅ opcional
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");

  // agenda
  const [dia, setDia] = useState(todayISO());

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

  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clientes;

    return clientes.filter((c) => {
      const blob = `
        ${c.cpf}
        ${c.responsavel_nome}
        ${c.nome_fantasia ?? ""}
        ${c.crf ?? ""}
        ${c.whatsapp ?? ""}
        ${c.email ?? ""}
        ${c.endereco ?? ""}
      `.toLowerCase();

      return blob.includes(s);
    });
  }, [clientes, q]);

  const visitasDoDia = useMemo(() => {
    return clientes
      .filter((c) => (c.proxima_visita || "") === dia)
      .sort((a, b) => (a.responsavel_nome || "").localeCompare(b.responsavel_nome || ""));
  }, [clientes, dia]);

  async function addCliente() {
    if (!isCpfValidBasic(cpf)) return alert("CPF inválido.");
    if (!responsavelNome.trim()) return alert("Nome do responsável é obrigatório.");

    const payload = {
      cpf: onlyDigits(cpf),
      responsavel_nome: responsavelNome.trim(),
      nome_fantasia: nomeFantasia.trim() || null,
      crf: crf.trim() || null, // ✅ opcional
      whatsapp: onlyDigits(whatsapp) || null,
      email: email.trim() || null,
      endereco: endereco.trim() || null,
      status_visita: "Novo",
      proxima_visita: null,
    };

    const { error } = await supabase.from(TABLE).insert(payload);

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) {
        return alert("CPF já cadastrado.");
      }
      return alert(error.message);
    }

    setCpf("");
    setResponsavelNome("");
    setNomeFantasia("");
    setCrf("");
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

  async function marcarVisitadoHoje(c: ClientePessoa) {
    const hoje = todayISO();

    const { error } = await supabase
      .from(TABLE)
      .update({
        ultima_visita: hoje,
        status_visita: "Visitado",
        proxima_visita: null,
      })
      .eq("id", c.id);

    if (error) return alert(error.message);

    setClientes((prev) =>
      prev.map((x) =>
        x.id === c.id
          ? { ...x, ultima_visita: hoje, status_visita: "Visitado", proxima_visita: null }
          : x
      )
    );
  }

  async function agendarVisita(c: ClientePessoa, dateISO: string) {
    const { error } = await supabase
      .from(TABLE)
      .update({ proxima_visita: dateISO, status_visita: "Em andamento" })
      .eq("id", c.id);

    if (error) return alert(error.message);

    setClientes((prev) =>
      prev.map((x) =>
        x.id === c.id ? { ...x, proxima_visita: dateISO, status_visita: "Em andamento" } : x
      )
    );
  }

  function abrirWhats(c: ClientePessoa) {
    if (!c.whatsapp) return alert("Sem Whats cadastrado.");

    const msg =
      `Olá, ${c.responsavel_nome}! Tudo bem?\n\n` +
      `Sou da DF Distribuidora.\n` +
      `Quero confirmar nossa visita/agendamento.\n` +
      `Loja: ${c.nome_fantasia || "-"}\n` +
      `Endereço: ${c.endereco || "-"}\n` +
      `CRF: ${c.crf || "-"}\n\n` +
      `Pode ser hoje? Qual melhor horário?`;

    window.open(waLink(c.whatsapp, msg), "_blank", "noopener,noreferrer");
  }

  // botão do card global
  async function marcarVisita(c: ClientePessoa) {
    await marcarVisitadoHoje(c);
    if (c.whatsapp) abrirWhats(c);
  }

  function copiarWhats(c: ClientePessoa) {
    if (!c.whatsapp) return alert("Sem Whats cadastrado.");
    navigator.clipboard.writeText(c.whatsapp);
    alert("Whats copiado!");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
          DF Distribuidora • Clientes
        </h1>
        <p className="text-gray-600 mt-1">
          Cadastro (CPF do responsável + nome fantasia) + controle interno de visitas do dia. CRF opcional.
        </p>

        {/* VISITAS DO DIA */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Visitas do dia</h2>
              <p className="text-sm text-gray-600">
                Lista clientes com <span className="font-medium">próxima visita</span> igual ao dia selecionado.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="date"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="text-sm text-gray-700">
                <span className="text-gray-500">Total:</span>{" "}
                <span className="font-semibold">{visitasDoDia.length}</span>
              </div>
            </div>
          </div>

          {visitasDoDia.length === 0 ? (
            <div className="mt-4 text-sm text-gray-600">Nenhuma visita agendada para este dia.</div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {visitasDoDia.map((c) => (
                <div key={c.id} className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{c.responsavel_nome}</div>
                      <div className="text-sm text-gray-600 truncate">{c.nome_fantasia || "—"}</div>
                      <div className="text-xs text-gray-500 mt-1">CPF: {c.cpf}</div>
                      {c.crf ? <div className="text-xs text-gray-500">CRF: {c.crf}</div> : null}
                      <div className="text-sm text-gray-700 mt-2">{c.endereco || "—"}</div>
                    </div>

                    <button
                      onClick={() => remover(c.id)}
                      className="text-xs rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => abrirWhats(c)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Whats
                    </button>

                    <button
                      onClick={() => marcarVisitadoHoje(c)}
                      className="rounded-xl bg-green-600 px-4 py-2 text-white text-sm font-medium hover:bg-green-700"
                    >
                      Visitado hoje
                    </button>

                    <button
                      onClick={() => agendarVisita(c, todayISO())}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
                    >
                      Jogar pra hoje
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs text-gray-500">Remarcar próxima visita</label>
                    <input
                      type="date"
                      value={c.proxima_visita || ""}
                      onChange={(e) => agendarVisita(c, e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BUSCA */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por CPF, responsável, loja, CRF..."
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
            <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="CPF" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} placeholder="Nome completo do responsável" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder="Nome fantasia da drogaria" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={crf} onChange={(e) => setCrf(e.target.value)} placeholder="CRF (opcional)" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
        </div>

        {/* LISTA GERAL */}
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

