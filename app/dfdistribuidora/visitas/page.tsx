"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TABLE = "df_clientes_pessoas";

type Cliente = {
  id: string;
  cpf: string | null; // ✅ opcional
  responsavel_nome: string;
  nome_fantasia: string | null;
  crf: string | null;
  whatsapp: string | null;
  email: string | null;

  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;

  ultima_visita: string | null;
  proxima_visita: string | null;
  status_visita: string | null;
  created_at: string;
};

// ---------------- util
function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function isCpfValidBasic(cpfRaw: string) {
  const cpf = onlyDigits(cpfRaw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  return true;
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}
function fullAddress(c: Cliente) {
  const parts = [
    c.endereco,
    c.bairro,
    c.cidade,
    c.uf,
    c.cep ? `CEP ${c.cep}` : null,
  ].filter(Boolean);
  return parts.join(" - ");
}
function waLink(phone: string, msg: string) {
  const clean = onlyDigits(phone);
  const text = encodeURIComponent(msg);
  return `https://wa.me/55${clean.startsWith("55") ? clean.slice(2) : clean}?text=${text}`;
}
function googleMapsRouteLink(addresses: string[]) {
  const clean = addresses.filter((a) => a && a.trim().length > 5);
  if (clean.length < 2) return "";
  const origin = encodeURIComponent(clean[0]);
  const destination = encodeURIComponent(clean[clean.length - 1]);
  const waypoints = clean.slice(1, -1).map(encodeURIComponent).join("|");
  const wp = waypoints ? `&waypoints=${waypoints}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${wp}&travelmode=driving`;
}

export default function VisitasPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");

  // agenda/rota
  const [dia, setDia] = useState(todayISO());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // modal cadastro
  const [open, setOpen] = useState(false);

  // form cadastro (CPF opcional)
  const [cpf, setCpf] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [crf, setCrf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [cep, setCep] = useState("");

  async function load() {
    setLoading(true);
    const res = await supabase.from(TABLE).select("*").order("created_at", { ascending: false });

    if (res.error) {
      alert(res.error.message);
      setLoading(false);
      return;
    }

    setClientes((res.data || []) as Cliente[]);
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
        ${c.cpf ?? ""}
        ${c.responsavel_nome}
        ${c.nome_fantasia ?? ""}
        ${c.crf ?? ""}
        ${c.whatsapp ?? ""}
        ${c.email ?? ""}
        ${c.endereco ?? ""}
        ${c.bairro ?? ""}
        ${c.cidade ?? ""}
        ${c.uf ?? ""}
        ${c.cep ?? ""}
      `.toLowerCase();
      return blob.includes(s);
    });
  }, [clientes, q]);

  const visitasDoDia = useMemo(() => {
    const list = clientes.filter((c) => (c.proxima_visita || "") === dia);

    // rota simples: cidade > bairro > endereco > responsavel
    return list.sort((a, b) => {
      const A = `${a.cidade ?? ""} ${a.bairro ?? ""} ${a.endereco ?? ""} ${a.responsavel_nome ?? ""}`.toLowerCase();
      const B = `${b.cidade ?? ""} ${b.bairro ?? ""} ${b.endereco ?? ""} ${b.responsavel_nome ?? ""}`.toLowerCase();
      return A.localeCompare(B);
    });
  }, [clientes, dia]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function selectAllCurrentSearch() {
    setSelected((prev) => {
      const n = new Set(prev);
      filtrados.forEach((c) => n.add(c.id));
      return n;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function agendarSelecionadosParaDia() {
    if (selected.size === 0) return alert("Selecione clientes primeiro.");
    if (!dia) return alert("Escolha um dia.");

    const ids = Array.from(selected);

    const { error } = await supabase
      .from(TABLE)
      .update({ proxima_visita: dia, status_visita: "Em andamento" })
      .in("id", ids);

    if (error) return alert(error.message);

    setClientes((prev) =>
      prev.map((c) =>
        selected.has(c.id) ? { ...c, proxima_visita: dia, status_visita: "Em andamento" } : c
      )
    );

    alert(`Agendado para ${fmtDate(dia)}: ${ids.length} cliente(s).`);
  }

  async function marcarVisitado(c: Cliente) {
    const hoje = todayISO();
    const { error } = await supabase
      .from(TABLE)
      .update({ ultima_visita: hoje, status_visita: "Visitado", proxima_visita: null })
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

  function copiarRotaTexto() {
    if (visitasDoDia.length === 0) return alert("Sem visitas para este dia.");

    const linhas = visitasDoDia.map((c, i) => {
      const addr = fullAddress(c) || "—";
      const w = c.whatsapp ? `Whats: ${c.whatsapp}` : "Whats: —";
      const loja = c.nome_fantasia ? `Loja: ${c.nome_fantasia}` : "Loja: —";
      const cpfTxt = c.cpf ? `CPF: ${c.cpf}` : `CPF: —`;
      const crfTxt = c.crf ? `CRF: ${c.crf}` : "";
      return `${i + 1}. ${c.responsavel_nome} | ${loja}\n   ${cpfTxt} • ${w}${crfTxt ? ` • ${crfTxt}` : ""}\n   ${addr}`;
    });

    const texto = `ROTA DF DISTRIBUIDORA - ${fmtDate(dia)}\n\n${linhas.join("\n\n")}`;
    navigator.clipboard?.writeText(texto);
    alert("Rota copiada!");
  }

  function abrirMapsRota() {
    const addrs = visitasDoDia.map((c) => fullAddress(c)).filter(Boolean);
    const link = googleMapsRouteLink(addrs);
    if (!link) return alert("Precisa de pelo menos 2 endereços válidos para gerar rota no Maps.");
    window.open(link, "_blank", "noopener,noreferrer");
  }

  async function addCliente() {
    if (!responsavelNome.trim()) return alert("Nome do responsável é obrigatório.");

    // ✅ CPF opcional: só valida se preencheu
    const cpfDigits = onlyDigits(cpf);
    if (cpfDigits && !isCpfValidBasic(cpfDigits)) return alert("CPF inválido (11 dígitos).");

    const payload = {
      cpf: cpfDigits || null,
      responsavel_nome: responsavelNome.trim(),
      nome_fantasia: nomeFantasia.trim() || null,
      crf: crf.trim() || null,
      whatsapp: onlyDigits(whatsapp) || null,
      email: email.trim() || null,

      endereco: endereco.trim() || null,
      bairro: bairro.trim() || null,
      cidade: cidade.trim() || null,
      uf: uf.trim() || null,
      cep: onlyDigits(cep) || null,

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

    // limpa form e fecha modal
    setCpf("");
    setResponsavelNome("");
    setNomeFantasia("");
    setCrf("");
    setWhatsapp("");
    setEmail("");
    setEndereco("");
    setBairro("");
    setCidade("");
    setUf("");
    setCep("");

    setOpen(false);
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        {/* HEADER CLEAN */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              DF Distribuidora • Rotas de Visita
            </h1>
            <p className="text-gray-600 mt-1">
              Buscar clientes • selecionar • agendar • gerar rota.
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
          >
            + Cadastrar cliente
          </button>
        </div>

        {/* CONTROLES */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, loja, cidade, Whats..."
            className="md:col-span-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
          />

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm flex items-center justify-between">
            <span>Total</span>
            <span className="font-semibold">{clientes.length}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <label className="text-sm text-gray-700">Dia:</label>
          <input
            type="date"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
          />

          <button
            onClick={selectAllCurrentSearch}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Selecionar (busca)
          </button>

          <button
            onClick={clearSelection}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Limpar seleção
          </button>

          <div className="ml-auto text-sm text-gray-700">
            Selecionados: <span className="font-semibold">{selected.size}</span>
          </div>

          <button
            onClick={agendarSelecionadosParaDia}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
          >
            Agendar selecionados
          </button>
        </div>

        {/* ROTA DO DIA */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Rota do dia</h2>
              <p className="text-sm text-gray-600">
                Próxima visita = <span className="font-medium">{fmtDate(dia)}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={copiarRotaTexto}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Copiar rota
              </button>
              <button
                onClick={abrirMapsRota}
                className="rounded-xl bg-green-600 px-4 py-2 text-white text-sm font-medium hover:bg-green-700"
              >
                Abrir no Maps
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 text-gray-600">Carregando...</div>
          ) : visitasDoDia.length === 0 ? (
            <div className="mt-4 text-sm text-gray-600">Nenhuma visita agendada para este dia.</div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {visitasDoDia.map((c, idx) => (
                <div key={c.id} className="rounded-2xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">Parada #{idx + 1}</div>
                  <div className="font-semibold text-gray-900 truncate">{c.responsavel_nome}</div>
                  <div className="text-sm text-gray-600 truncate">{c.nome_fantasia || "—"}</div>
                  <div className="text-sm text-gray-700 mt-2">{fullAddress(c) || "—"}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    CPF: {c.cpf || "—"} • Whats: {c.whatsapp || "—"} • CRF: {c.crf || "—"}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (!c.whatsapp) return alert("Sem Whats cadastrado.");
                        const msg =
                          `Olá, ${c.responsavel_nome}! Tudo bem?\n\n` +
                          `Sou da DF Distribuidora. Posso passar aí hoje?\n` +
                          `Loja: ${c.nome_fantasia || "-"}\n` +
                          `Endereço: ${fullAddress(c) || "-"}\n\n` +
                          `Qual melhor horário?`;
                        window.open(waLink(c.whatsapp, msg), "_blank", "noopener,noreferrer");
                      }}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Whats
                    </button>

                    <button
                      onClick={() => marcarVisitado(c)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
                    >
                      Visitado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LISTA GERAL (SELEÇÃO) */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Clientes</h2>

          {loading ? (
            <div className="text-gray-600">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtrados.map((c) => (
                <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggle(c.id)}
                          className="h-4 w-4"
                        />
                        <div className="font-semibold text-gray-900 truncate">{c.responsavel_nome}</div>
                      </div>

                      <div className="text-sm text-gray-600 truncate mt-1">{c.nome_fantasia || "—"}</div>

                      <div className="text-xs text-gray-500 mt-1">
                        CPF: {c.cpf || "—"} • CRF: {c.crf || "—"}
                      </div>

                      <div className="text-sm text-gray-700 mt-2">{fullAddress(c) || "—"}</div>

                      <div className="text-xs text-gray-500 mt-2">
                        Próxima: <span className="font-medium">{fmtDate(c.proxima_visita)}</span> • Última:{" "}
                        <span className="font-medium">{fmtDate(c.ultima_visita)}</span>
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Whats: {c.whatsapp || "—"} • Email: {c.email || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (!c.whatsapp) return alert("Sem Whats cadastrado.");
                        const msg =
                          `Olá, ${c.responsavel_nome}! Tudo bem?\n\n` +
                          `Sou da DF Distribuidora.\n` +
                          `Posso te fazer uma visita? Qual melhor dia/horário?\n\n` +
                          `Loja: ${c.nome_fantasia || "-"}\n` +
                          `Endereço: ${fullAddress(c) || "-"}\n`;
                        window.open(waLink(c.whatsapp, msg), "_blank", "noopener,noreferrer");
                      }}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Whats
                    </button>

                    <button
                      onClick={() => {
                        setSelected((prev) => {
                          const n = new Set(prev);
                          n.add(c.id);
                          return n;
                        });
                        alert("Cliente selecionado. Agora clique em 'Agendar selecionados'.");
                      }}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
                    >
                      Selecionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL CADASTRO */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200">
              <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Cadastrar cliente</h3>
                  <p className="text-sm text-gray-600">CPF opcional • Nome do responsável obrigatório</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>

              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    placeholder="Nome completo do responsável (obrigatório)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="CPF (opcional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />

                  <input
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Nome fantasia (opcional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    value={crf}
                    onChange={(e) => setCrf(e.target.value)}
                    placeholder="CRF (opcional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />

                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="WhatsApp (opcional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (opcional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />

                  <input
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Endereço (rua/número) (opcional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Bairro (opcional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade (opcional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    placeholder="UF (opcional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="CEP (opcional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="p-4 md:p-6 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={addCliente}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Salvar cliente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
