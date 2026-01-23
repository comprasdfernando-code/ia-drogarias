"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/** =========================
 *  CONFIG
 ========================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Ajuste conforme o seu padrão
const SENHA_ADMIN = "102030";

// ✅ Ajuste para os nomes reais das suas tabelas
const TBL_USUARIOS = "cadastros_usuarios";
const TBL_PROF = "cadastros_profissionais";

// Colunas que vamos exibir (ajuste conforme seu banco)
type CadastroBase = {
  id: string;
  created_at: string | null;
  nome?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  cidade?: string | null;
  origem?: string | null;
  area?: string | null; // profissionais
  crf?: string | null;  // profissionais
};

function fmtData(dt: string | null | undefined) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleString("pt-BR");
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function toCSV(rows: CadastroBase[], tipo: "usuarios" | "profissionais") {
  const headers =
    tipo === "usuarios"
      ? ["created_at", "nome", "whatsapp", "email", "cidade", "origem", "id"]
      : ["created_at", "nome", "whatsapp", "email", "area", "crf", "cidade", "origem", "id"];

  const esc = (s: any) => {
    const v = (s ?? "").toString();
    // escape simples csv
    if (v.includes(",") || v.includes('"') || v.includes("\n")) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc((r as any)[h])).join(",")),
  ];

  return lines.join("\n");
}

export default function AdminCadastrosPage() {
  const [authed, setAuthed] = useState(false);
  const [senha, setSenha] = useState("");

  const [aba, setAba] = useState<"usuarios" | "profissionais">("usuarios");
  const [q, setQ] = useState("");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 40;

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CadastroBase[]>([]);
  const [total, setTotal] = useState(0);

  const table = aba === "usuarios" ? TBL_USUARIOS : TBL_PROF;

  const range = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    return { from, to };
  }, [page]);

  function entrar() {
    if (senha === SENHA_ADMIN) {
      setAuthed(true);
      localStorage.setItem("admin_cadastros_ok", "1");
    } else {
      alert("Senha incorreta.");
    }
  }

  function sair() {
    setAuthed(false);
    setSenha("");
    localStorage.removeItem("admin_cadastros_ok");
  }

  useEffect(() => {
    const ok = localStorage.getItem("admin_cadastros_ok");
    if (ok === "1") setAuthed(true);
  }, []);

  // reset pagina quando muda aba ou busca
  useEffect(() => {
    setPage(1);
  }, [aba, q]);

  async function carregar() {
    setLoading(true);
    try {
      // Busca simples: nome, whatsapp, email (ajuste se suas colunas forem outras)
      const qq = q.trim();

      let query = supabase
        .from(table)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(range.from, range.to);

      if (qq) {
        const dig = onlyDigits(qq);
        // or() com ilike (texto). Para whatsapp, tentamos tanto raw quanto digits.
        const parts: string[] = [];
        parts.push(`nome.ilike.%${qq}%`);
        parts.push(`email.ilike.%${qq}%`);
        parts.push(`cidade.ilike.%${qq}%`);
        parts.push(`origem.ilike.%${qq}%`);
        parts.push(`whatsapp.ilike.%${qq}%`);
        if (dig.length >= 6) parts.push(`whatsapp.ilike.%${dig}%`);

        // profissionais: area/crf (se existir)
        if (aba === "profissionais") {
          parts.push(`area.ilike.%${qq}%`);
          parts.push(`crf.ilike.%${qq}%`);
        }

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

  async function exportarCSV() {
    // Exporta tudo com a busca aplicada (sem paginação)
    setLoading(true);
    try {
      const qq = q.trim();

      let query = supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });

      if (qq) {
        const dig = onlyDigits(qq);
        const parts: string[] = [];
        parts.push(`nome.ilike.%${qq}%`);
        parts.push(`email.ilike.%${qq}%`);
        parts.push(`cidade.ilike.%${qq}%`);
        parts.push(`origem.ilike.%${qq}%`);
        parts.push(`whatsapp.ilike.%${qq}%`);
        if (dig.length >= 6) parts.push(`whatsapp.ilike.%${dig}%`);
        if (aba === "profissionais") {
          parts.push(`area.ilike.%${qq}%`);
          parts.push(`crf.ilike.%${qq}%`);
        }
        query = query.or(parts.join(","));
      }

      const { data, error } = await query;
      if (error) throw error;

      const csv = toCSV((data as any) || [], aba);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `cadastros_${aba}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao exportar.");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!authed) {
    return (
      <div style={{ maxWidth: 460, margin: "40px auto", padding: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          Admin • Cadastros
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
              fontWeight: 700,
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Cadastros realizados</h1>
        <button onClick={sair} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}>
          Sair
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          onClick={() => setAba("usuarios")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            border: aba === "usuarios" ? "2px solid #111" : "1px solid #ddd",
          }}
        >
          Usuários
        </button>
        <button
          onClick={() => setAba("profissionais")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            border: aba === "profissionais" ? "2px solid #111" : "1px solid #ddd",
          }}
        >
          Profissionais
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={exportarCSV}
          style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}
        >
          Exportar CSV
        </button>
      </div>

      {/* Busca */}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, whatsapp, email, cidade..."
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
          }}
        />
        <button
          onClick={() => carregar()}
          style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer", fontWeight: 800 }}
        >
          Buscar
        </button>
      </div>

      {/* Tabela */}
      <div style={{ marginTop: 14, border: "1px solid #e5e5e5", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
          <div>
            <b>{total}</b> registros • página <b>{page}</b> de <b>{totalPages}</b>
          </div>
          <div>{loading ? "Carregando..." : ""}</div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Data</th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Nome</th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>WhatsApp</th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Email</th>

                {aba === "profissionais" && (
                  <>
                    <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Área</th>
                    <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>CRF</th>
                  </>
                )}

                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Cidade</th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Origem</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={aba === "profissionais" ? 8 : 6} style={{ padding: 14 }}>
                    Nenhum cadastro encontrado.
                  </td>
                </tr>
              )}

              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{fmtData(r.created_at)}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{r.nome || "—"}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{r.whatsapp || "—"}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{r.email || "—"}</td>

                  {aba === "profissionais" && (
                    <>
                      <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{r.area || "—"}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{r.crf || "—"}</td>
                    </>
                  )}

                  <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{r.cidade || "—"}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{r.origem || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div style={{ display: "flex", gap: 10, padding: 12, justifyContent: "flex-end", borderTop: "1px solid #eee" }}>
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
        Ajuste os nomes das tabelas/colunas no topo do arquivo (TBL_USUARIOS / TBL_PROF).
      </p>
    </div>
  );
}
