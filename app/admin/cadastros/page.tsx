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

  // ✅ novos campos
  bloqueado?: boolean | null;
  bloqueado_em?: string | null;
  bloqueado_motivo?: string | null;
};

function fmtData(dt: string | null | undefined) {
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
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
  if (d.length === 10 || d.length === 11) return "55" + d;
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
  return `Olá ${nome}! tudo bem? 😊

Aqui é da IA Drogarias.

Para ativarmos seu cadastro como profissional na plataforma, precisamos validar seus dados.

Por favor, envie:
1️⃣ Seu CRF + UF (ex: CRF-SP 123456)  
2️⃣ Foto ou print do CRF (carteira ou consulta no site do conselho)  
3️⃣ Documento com foto (RG ou CNH)

Assim que conferirmos, seu perfil será ativado e você já poderá receber chamados normalmente ✅

Qualquer dúvida, fico à disposição. ✅`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Texto copiado ✅");
  } catch {
    alert("Não consegui copiar automaticamente.");
  }
}

/** ✅ chama API segura (service role no server) */
async function adminUpdateUsuario(payload: {
  id: string;
  nome?: string | null;
  telefone?: string | null;
  email?: string | null;
  bloqueado?: boolean;
  bloqueado_motivo?: string | null;
}) {
  const r = await fetch("/api/admin/usuarios/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || "Erro ao atualizar usuário");
  return true;
}

/** ✅ confirmar email no Auth (service role no server) */
async function adminConfirmEmail(email: string) {
  const r = await fetch("/api/admin/auth/confirm-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || "Erro ao confirmar e-mail");
  return true;
}

/** ✅ reenviar confirmação (service role no server) */
async function adminResendConfirmation(email: string) {
  const r = await fetch("/api/admin/auth/resend-confirmation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || "Erro ao reenviar confirmação");
  return true;
}

/** ✅ salvar dados extras do profissional (cadastros_profissionais) */
async function adminUpdateProfissionalExtra(payload: {
  email: string;
  nome?: string | null;
  whatsapp?: string | null;
  crf?: string | null;
}) {
  const r = await fetch("/api/admin/profissionais/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || "Erro ao atualizar profissional (extra)");
  return true;
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

  // ✅ modal edição (somente profissionais)
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editRow, setEditRow] = useState<UsuarioRow | null>(null);

  const [fNome, setFNome] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fTelefone, setFTelefone] = useState("");
  const [fBloqueado, setFBloqueado] = useState(false);
  const [fMotivo, setFMotivo] = useState("");

  // ✅ CRF (cadastros_profissionais)
  const [fCrf, setFCrf] = useState("");
  const [loadingCrf, setLoadingCrf] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);

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
        .select("id,nome,email,tipo,criado_em,telefone,bloqueado,bloqueado_em,bloqueado_motivo", { count: "exact" })
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

  // ✅ carrega CRF pelo email diretamente do Supabase (somente leitura)
  async function loadCrfByEmail(email: string) {
    const { data, error } = await supabase
      .from("cadastros_profissionais")
      .select("crf")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    return (data?.crf as string) || "";
  }

  async function abrirEdicao(r: UsuarioRow) {
    setEditRow(r);
    setFNome(r.nome || "");
    setFEmail(r.email || "");
    setFTelefone(r.telefone || "");
    setFBloqueado(!!r.bloqueado);
    setFMotivo(r.bloqueado_motivo || "");
    setConfirming(false);
    setResending(false);

    // CRF
    setFCrf("");
    setLoadingCrf(false);
    if (r.email) {
      setLoadingCrf(true);
      try {
        const crfAtual = await loadCrfByEmail(r.email);
        setFCrf(crfAtual || "");
      } catch (e) {
        console.warn("Não consegui carregar CRF:", e);
      } finally {
        setLoadingCrf(false);
      }
    }

    setEditOpen(true);
  }

  function fecharEdicao() {
    setEditOpen(false);
    setEditRow(null);
    setFNome("");
    setFEmail("");
    setFTelefone("");
    setFBloqueado(false);
    setFMotivo("");
    setFCrf("");
    setLoadingCrf(false);
    setConfirming(false);
    setResending(false);
  }

  async function salvarEdicao() {
    if (!editRow) return;
    setEditSaving(true);
    try {
      const emailTrim = fEmail.trim() || null;
      const nomeTrim = fNome.trim() || null;
      const telTrim = fTelefone.trim() || null;

      // 1) atualiza tabela usuarios (bloqueio, etc)
      await adminUpdateUsuario({
        id: editRow.id,
        nome: nomeTrim,
        email: emailTrim,
        telefone: telTrim,
        bloqueado: fBloqueado,
        bloqueado_motivo: fBloqueado ? (fMotivo.trim() || "Bloqueado pelo administrador") : null,
      });

      // 2) se for profissional, salva CRF (cadastros_profissionais)
      if ((editRow.tipo || "") === "farmaceutico" && emailTrim) {
        await adminUpdateProfissionalExtra({
          email: emailTrim,
          nome: nomeTrim,
          whatsapp: telTrim,
          crf: fCrf.trim() || null,
        });
      }

      alert("Atualizado ✅");
      fecharEdicao();
      await carregar();
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar");
    } finally {
      setEditSaving(false);
    }
  }

  async function toggleBloqueioRapido(r: UsuarioRow) {
    const bloquear = !r.bloqueado;
    const motivo = bloquear ? (prompt("Motivo do bloqueio (opcional):") || "") : null;

    try {
      await adminUpdateUsuario({
        id: r.id,
        bloqueado: !!bloquear,
        bloqueado_motivo: bloquear ? (motivo || "Bloqueado pelo administrador") : null,
      });
      await carregar();
    } catch (e: any) {
      alert(e?.message || "Erro ao bloquear/desbloquear");
    }
  }

  async function confirmarEmailRapido(r: UsuarioRow) {
    if (!r.email) return alert("Esse usuário não tem e-mail.");
    setConfirming(true);
    try {
      await adminConfirmEmail(r.email);
      alert("E-mail confirmado no Auth ✅");
    } catch (e: any) {
      alert(e?.message || "Erro ao confirmar e-mail");
    } finally {
      setConfirming(false);
    }
  }

  async function reenviarConfirmacaoRapido(r: UsuarioRow) {
    if (!r.email) return alert("Esse usuário não tem e-mail.");
    setResending(true);
    try {
      await adminResendConfirmation(r.email);
      alert("Confirmação reenviada ✅ (caixa de entrada / spam)");
    } catch (e: any) {
      alert(e?.message || "Erro ao reenviar confirmação");
    } finally {
      setResending(false);
    }
  }

  if (!authed) {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Admin • Cadastros (Usuários)</h1>

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

      {/* LISTA EM CARDS */}
      <div style={{ marginTop: 14 }}>
        <div style={{ opacity: 0.8, marginBottom: 10 }}>
          <b>{total}</b> registros • página <b>{page}</b> de <b>{totalPages}</b> {loading ? "• carregando..." : ""}
        </div>

        {rows.length === 0 && !loading && (
          <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}>Nenhum registro encontrado.</div>
        )}

        {rows.map((r) => {
          const nome = (r.nome || "tudo bem").trim();
          const phone55 = normalizeBRPhone(r.telefone);
          const isProf = r.tipo === "farmaceutico";
          const bloqueado = !!r.bloqueado;

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
                opacity: bloqueado ? 0.85 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>{r.nome || "—"}</div>

                    {bloqueado && (
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          border: "1px solid #f3b7b7",
                          background: "#fff5f5",
                          fontWeight: 900,
                          color: "#b42318",
                          fontSize: 12,
                        }}
                      >
                        BLOQUEADO
                      </span>
                    )}
                  </div>

                  <div style={{ opacity: 0.8, marginTop: 4 }}>
                    <b>Telefone:</b> {r.telefone || "—"} • <b>Email:</b> {r.email || "—"}
                  </div>

                  <div style={{ opacity: 0.75, marginTop: 4 }}>
                    <b>Tipo:</b> {r.tipo || "—"} • <b>Criado:</b> {fmtData(r.criado_em)}
                  </div>

                  {bloqueado && (
                    <div style={{ opacity: 0.85, marginTop: 6, fontSize: 13 }}>
                      <b>Bloqueado em:</b> {fmtData(r.bloqueado_em || null)}{" "}
                      {r.bloqueado_motivo ? (
                        <>
                          • <b>Motivo:</b> {r.bloqueado_motivo}
                        </>
                      ) : null}
                    </div>
                  )}
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

                  {isProf && (
                    <>
                      <button
                        onClick={() => abrirEdicao(r)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          cursor: "pointer",
                          border: "1px solid #ddd",
                          fontWeight: 900,
                        }}
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => toggleBloqueioRapido(r)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          cursor: "pointer",
                          border: "1px solid #ddd",
                          fontWeight: 900,
                        }}
                      >
                        {bloqueado ? "Desbloquear" : "Bloquear"}
                      </button>

                      <button
                        onClick={() => confirmarEmailRapido(r)}
                        disabled={confirming}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          cursor: confirming ? "not-allowed" : "pointer",
                          border: "1px solid #ddd",
                          fontWeight: 900,
                        }}
                      >
                        {confirming ? "Confirmando..." : "Confirmar e-mail"}
                      </button>

                      <button
                        onClick={() => reenviarConfirmacaoRapido(r)}
                        disabled={resending}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          cursor: resending ? "not-allowed" : "pointer",
                          border: "1px solid #ddd",
                          fontWeight: 900,
                        }}
                      >
                        {resending ? "Enviando..." : "Reenviar confirmação"}
                      </button>
                    </>
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

      {/* ✅ MODAL DE EDIÇÃO */}
      {editOpen && editRow && (
        <div
          onClick={fecharEdicao}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 560,
              background: "#fff",
              borderRadius: 14,
              padding: 16,
              border: "1px solid #eee",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>Editar profissional</div>
                <div style={{ opacity: 0.7, fontSize: 13 }}>ID: {editRow.id}</div>
              </div>

              <button onClick={fecharEdicao} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}>
                Fechar
              </button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <b>Nome</b>
                <input
                  value={fNome}
                  onChange={(e) => setFNome(e.target.value)}
                  style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <b>Email</b>
                <input
                  value={fEmail}
                  onChange={(e) => setFEmail(e.target.value)}
                  style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <b>Telefone</b>
                <input
                  value={fTelefone}
                  onChange={(e) => setFTelefone(e.target.value)}
                  style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
                />
              </label>

              {/* ✅ CRF */}
              <label style={{ display: "grid", gap: 6 }}>
                <b>CRF</b>
                <input
                  value={fCrf}
                  onChange={(e) => setFCrf(e.target.value)}
                  placeholder={loadingCrf ? "Carregando CRF..." : "Ex: CRF-SP 123456"}
                  disabled={loadingCrf}
                  style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
                />
                {loadingCrf ? <span style={{ fontSize: 12, opacity: 0.7 }}>Buscando CRF em cadastros_profissionais…</span> : null}
              </label>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="checkbox" checked={fBloqueado} onChange={(e) => setFBloqueado(e.target.checked)} />
                  <b>Bloqueado</b>
                </label>

                {fBloqueado && <span style={{ fontSize: 13, opacity: 0.75 }}>(não entra no painel)</span>}
              </div>

              {fBloqueado && (
                <label style={{ display: "grid", gap: 6 }}>
                  <b>Motivo do bloqueio</b>
                  <textarea
                    value={fMotivo}
                    onChange={(e) => setFMotivo(e.target.value)}
                    rows={3}
                    style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", resize: "vertical" }}
                  />
                </label>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={async () => {
                    if (!fEmail.trim()) return alert("Informe um e-mail válido no campo Email.");
                    setConfirming(true);
                    try {
                      await adminConfirmEmail(fEmail.trim());
                      alert("E-mail confirmado no Auth ✅");
                    } catch (e: any) {
                      alert(e?.message || "Erro ao confirmar e-mail");
                    } finally {
                      setConfirming(false);
                    }
                  }}
                  disabled={confirming}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: confirming ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    border: "1px solid #ddd",
                  }}
                >
                  {confirming ? "Confirmando..." : "Confirmar e-mail (Auth)"}
                </button>

                <button
                  onClick={async () => {
                    if (!fEmail.trim()) return alert("Informe um e-mail válido no campo Email.");
                    setResending(true);
                    try {
                      await adminResendConfirmation(fEmail.trim());
                      alert("Confirmação reenviada ✅");
                    } catch (e: any) {
                      alert(e?.message || "Erro ao reenviar confirmação");
                    } finally {
                      setResending(false);
                    }
                  }}
                  disabled={resending}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: resending ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    border: "1px solid #ddd",
                  }}
                >
                  {resending ? "Enviando..." : "Reenviar confirmação (Auth)"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
              <button onClick={fecharEdicao} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}>
                Cancelar
              </button>

              <button
                onClick={salvarEdicao}
                disabled={editSaving}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: editSaving ? "not-allowed" : "pointer",
                  fontWeight: 900,
                  border: "1px solid #ddd",
                }}
              >
                {editSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
