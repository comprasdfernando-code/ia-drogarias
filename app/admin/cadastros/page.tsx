"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SENHA_ADMIN = "102030";
const TABELA = "usuarios";

type UsuarioRow = {
  id: string;
  nome: string | null;
  email: string | null;
  tipo: string | null; // "farmaceutico" | "cliente"
  criado_em: string | null; // timestamptz
  telefone: string | null;
};

function fmtData(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("pt-BR");
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

/** normaliza tel pra 55 + DDD + número */
function normalizeBRPhone(raw: string | null | undefined) {
  const d = onlyDigits(raw || "");
  if (!d) return null;
  // já tem 55?
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
  // tem DDD (11 dígitos celular / 10 fixo)
  if (d.length === 10 || d.length === 11) return "55" + d;
  // fallback
  if (d.length > 11) return d;
  return null;
}

function waLink(phone55: string, message: string) {
  const text = encodeURIComponent(message);
  return `https://wa.me/${phone55}?text=${text}`;
}

/** textos padrão (edita livre) */
function msgAgradecer(nome: string) {
  return `Olá ${nome}! 😊

Aqui é da IA Drogarias.

Obrigado por se cadastrar como profissional na nossa plataforma. Seu cadastro foi recebido com sucesso ✅

Em breve você já poderá começar a receber solicitações de serviços com total flexibilidade (você define dias e horários).

Se quiser, me diga sua cidade/bairro e sua principal área de atuação pra eu já deixar seu perfil mais completo.`;
}

function msgProximosPassos(nome: string) {
  return `Olá ${nome}! 😊

Só pra te explicar os próximos passos na IA Drogarias:

1) Você define seus dias/horários disponíveis
2) Quando chegar um serviço, você vê região e valores a receber
3) Você pode aceitar ou recusar — total flexibilidade ✅

Se puder, me confirme:
• Cidade/bairro
• Área principal (ex.: serviços farmacêuticos, estética, etc.)
• Melhor horário para atendimentos`;
}

function msgDocs(nome: string) {
  return `Olá ${nome}! 😊

Para deixar seu perfil com mais credibilidade na IA Drogarias, você pode me enviar (se tiver):

• Documento profissional (ex.: CRF, certificado, etc.)
• Foto/Logo (opcional)
• Uma frase curta do seu atendimento

Assim seu perfil fica completo e passa mais confiança pros pacientes ✅`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Texto copiado ✅");
  } catch {
    alert("Não consegui copiar automaticamente. Se quiser, eu ajusto pra fallback.");
  }
}

export default function AdminCadastroPage() {
  const [authed, setAuthed] = useState(false);
  const [senha, setSenha] = useState("");

  const [aba, setAba] = useState<"farmaceutico" | "cliente">("farmaceutico");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<UsuarioRow[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const range = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    return { from, to };
  }, [page]);

  useEffect(() => {
    const ok = localStorage.getItem("admin_cadastro_ok");
    if (ok === "1") setAuthed(true);
  }, []);

  function entrar() {
    if (senha === SENHA_ADMIN) {
      setAuthed(true);
      localStorage.setItem("admin_cadastro_ok", "1");
    } else {
      alert("Senha incorreta.");
    }
  }

  function sair() {
    setAuthed(false);
    setSenha("");
    localStorage.removeItem("admin_cadastro_ok");
  }

  useEffect(() => {
    setPage(1);
  }, [aba, q]);

  async function carregar() {
    setLoading(true);
    try {
      const qq = q.trim();
      const dig = onlyDigits(qq);

      let query = supabase
        .from(TABELA)
        .select("id,nome,email,tipo,criado_em,telefone", { count: "exact" })
        .eq("tipo", aba)
        .order("criado_em", { ascending: false })
        .range(range.from, range.to);

      if (qq) {
        const parts: string[] = [];
        parts.push(`nome.ilike.%${qq}%`);
        parts.push(`email.ilike.%${qq}%`);
        parts.push(`telefone.ilike.%${qq}%`);
        if (dig.length >= 6) parts.push(`telefone.ilike.%${dig}%`);
        query = query.or(parts.join(","));
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setRows((data as any) || []);
      setTotal(count || 0);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao carregar cadastros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authed) return;
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, aba, page, range.from, range.to]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!authed) {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          Admin • Cadastros (Usuários)
        </h1>

        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
          <p style={{ marginBottom: 10 }}>Digite a senha do admin:</p>

          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            type="password"
            placeholder="Senha"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ddd",
              marginBottom: 10,
            }}
          />

          <button
            onClick={entrar}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>Cadastros (tabela usuarios)</h1>
        <button onClick={sair} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}>
          Sair
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => setAba("farmaceutico")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 800,
            border: aba === "farmaceutico" ? "2px solid #111" : "1px solid #ddd",
          }}
        >
          Profissionais
        </button>

        <button
          onClick={() => setAba("cliente")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 800,
            border: aba === "cliente" ? "2px solid #111" : "1px solid #ddd",
          }}
        >
          Clientes
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => carregar()}
          style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 900 }}
        >
          Atualizar
        </button>
      </div>

      {/* Busca */}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, email ou telefone..."
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
          }}
        />
        <button
          onClick={() => carregar()}
          style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer", fontWeight: 900 }}
        >
          Buscar
        </button>
      </div>

      {/* LISTA EM CARDS (melhor pra botões do WhatsApp) */}
      <div style={{ marginTop: 14 }}>
        <div style={{ opacity: 0.8, marginBottom: 10 }}>
          <b>{total}</b> registros • página <b>{page}</b> de <b>{totalPages}</b> {loading ? "• carregando..." : ""}
        </div>

        {rows.length === 0 && !loading && (
          <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
            Nenhum registro encontrado.
          </div>
        )}

        {rows.map((r) => {
          const nome = (r.nome || "tudo bem").trim();
          const phone55 = normalizeBRPhone(r.telefone);
          const isProf = r.tipo === "farmaceutico";

          // mensagens (somente pra profissional faz sentido esses textos)
          const m1 = msgAgradecer(nome);
          const m2 = msgProximosPassos(nome);
          const m3 = msgDocs(nome);

          return (
            <div
              key={r.id}
              style={{
                border: "1px solid #eaeaea",
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>{r.nome || "—"}</div>
                  <div style={{ opacity: 0.8, marginTop: 4 }}>
                    <b>Telefone:</b> {r.telefone || "—"} • <b>Email:</b> {r.email || "—"}
                  </div>
                  <div style={{ opacity: 0.75, marginTop: 4 }}>
                    <b>Tipo:</b> {r.tipo || "—"} • <b>Criado:</b> {fmtData(r.criado_em)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {phone55 ? (
                    <a
                      href={waLink(phone55, `Olá ${nome}! 😊`)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        textDecoration: "none",
                        fontWeight: 900,
                      }}
                    >
                      Abrir WhatsApp
                    </a>
                  ) : (
                    <span style={{ padding: "10px 12px", borderRadius: 10, border: "1px dashed #ddd", opacity: 0.7 }}>
                      Sem telefone válido
                    </span>
                  )}
                </div>
              </div>

              {/* Ações WhatsApp só para profissionais */}
              {isProf && (
                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    disabled={!phone55}
                    onClick={() => phone55 && window.open(waLink(phone55, m1), "_blank")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      cursor: phone55 ? "pointer" : "not-allowed",
                      border: "1px solid #ddd",
                      fontWeight: 900,
                    }}
                  >
                    WhatsApp • Agradecer
                  </button>

                  <button
                    disabled={!phone55}
                    onClick={() => phone55 && window.open(waLink(phone55, m2), "_blank")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      cursor: phone55 ? "pointer" : "not-allowed",
                      border: "1px solid #ddd",
                      fontWeight: 900,
                    }}
                  >
                    WhatsApp • Próximos passos
                  </button>

                  <button
                    disabled={!phone55}
                    onClick={() => phone55 && window.open(waLink(phone55, m3), "_blank")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      cursor: phone55 ? "pointer" : "not-allowed",
                      border: "1px solid #ddd",
                      fontWeight: 900,
                    }}
                  >
                    WhatsApp • Docs/Validação
                  </button>

                  <button
                    onClick={() => copyToClipboard(m1)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      border: "1px solid #ddd",
                      fontWeight: 900,
                    }}
                  >
                    Copiar texto (Agradecer)
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Paginação */}
        <div style={{ display: "flex", gap: 10, paddingTop: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}
          >
            Anterior
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}
          >
            Próxima
          </button>
        </div>
      </div>

      <p style={{ opacity: 0.7, marginTop: 10, fontSize: 13 }}>
        Lendo: <b>public.usuarios</b> • filtro: <b>tipo = {aba}</b> • ordenado por <b>criado_em</b>
      </p>
    </div>
  );
}
