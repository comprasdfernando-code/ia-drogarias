"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* =========================
   SUPABASE
========================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* =========================
   CONFIG
========================= */
const SENHA_ADMIN = "102030";
const TABELA = "usuarios"; // ✅ sua tabela

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
        .eq("tipo", aba) // ✅ aqui filtra profissionais/cliente
        .order("criado_em", { ascending: false })
        .range(range.from, range.to);

      if (qq) {
        // busca em nome/email/telefone
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

  async function exportarCSV() {
    setLoading(true);
    try {
      const qq = q.trim();
      const dig = onlyDigits(qq);

      let query = supabase
        .from(TABELA)
        .select("id,nome,email,tipo,criado_em,telefone")
        .eq("tipo", aba)
        .order("criado_em", { ascending: false });

      if (qq) {
        const parts: string[] = [];
        parts.push(`nome.ilike.%${qq}%`);
        parts.push(`email.ilike.%${qq}%`);
        parts.push(`telefone.ilike.%${qq}%`);
        if (dig.length >= 6) parts.push(`telefone.ilike.%${dig}%`);
        query = query.or(parts.join(","));
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data as UsuarioRow[]) || [];
      const headers = ["criado_em", "tipo", "nome", "telefone", "email", "id"];

      const esc = (s: any) => {
        const v = (s ?? "").toString();
        if (v.includes(",") || v.includes('"') || v.includes("\n"))
          return `"${v.replace(/"/g, '""')}"`;
        return v;
      };

      const csv = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => esc((r as any)[h])).join(",")),
      ].join("\n");

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
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>Cadastros (tabela usuarios)</h1>
        <button onClick={sair} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}>
          Sair
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
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
          Profissionais (farmaceutico)
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
          Clientes (cliente)
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={exportarCSV}
          style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 800 }}
        >
          Exportar CSV
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
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Criado em</th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Nome</th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Telefone</th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Email</th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #eee" }}>Tipo</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ padding: 14 }}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}

              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{fmtData(r.criado_em)}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{r.nome || "—"}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{r.telefone || "—"}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{r.email || "—"}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{r.tipo || "—"}</td>
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
        Lendo: <b>public.usuarios</b> • filtro: <b>tipo = {aba}</b> • ordenado por <b>criado_em</b>
      </p>
    </div>
  );
}
