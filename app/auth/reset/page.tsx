"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetSenhaPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [senha1, setSenha1] = useState("");
  const [senha2, setSenha2] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // garante que existe sessão (porque /auth/confirm criou a sessão)
    (async () => {
      const { data } = await supabase.auth.getSession();
      setReady(!!data?.session);
    })();
  }, []);

  async function salvar() {
    const s1 = senha1.trim();
    const s2 = senha2.trim();

    if (s1.length < 6) return alert("Senha muito curta. Use pelo menos 6 caracteres.");
    if (s1 !== s2) return alert("As senhas não conferem.");

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: s1 });
      if (error) throw error;

      alert("Senha atualizada ✅");
      router.replace("/profissional/painel");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao atualizar senha.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>IA Drogarias</h1>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Link inválido ou expirado.</div>
          <div style={{ marginTop: 6, opacity: 0.8 }}>
            Volte e solicite a recuperação de senha novamente.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Redefinir senha</h1>

      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <b>Nova senha</b>
          <input
            type="password"
            value={senha1}
            onChange={(e) => setSenha1(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <b>Confirmar nova senha</b>
          <input
            type="password"
            value={senha2}
            onChange={(e) => setSenha2(e.target.value)}
            placeholder="Repita a senha"
            style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
          />
        </label>

        <button
          onClick={salvar}
          disabled={saving}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 900,
            border: "1px solid #ddd",
          }}
        >
          {saving ? "Salvando..." : "Salvar nova senha"}
        </button>
      </div>
    </main>
  );
}
