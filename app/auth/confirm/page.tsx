"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function parseHashParams(hash: string) {
  const h = (hash || "").replace(/^#/, "");
  const p = new URLSearchParams(h);
  const obj: Record<string, string> = {};
  p.forEach((v, k) => (obj[k] = v));
  return obj;
}

export default function AuthConfirmPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [msg, setMsg] = useState("Processando…");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // 1) FORMATO NOVO (PKCE): /auth/confirm?code=...
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          // Depois do exchange, o Supabase sabe se é recovery/confirm (depende do link)
          // Vamos checar o "type" se vier no query (às vezes não vem)
          const type = search.get("type") || "";

          if (type === "recovery") {
            setMsg("Sessão de recuperação criada ✅");
            router.replace("/auth/reset"); // crie essa página para definir nova senha
          } else {
            setMsg("E-mail confirmado ✅");
            router.replace("/profissional/painel"); // ajuste para o seu painel
          }
          return;
        }

        // 2) FORMATO HASH ANTIGO: /auth/confirm#access_token=...&refresh_token=...&type=...
        const hp = parseHashParams(window.location.hash || "");
        const access_token = hp["access_token"];
        const refresh_token = hp["refresh_token"];
        const type = hp["type"]; // "recovery" | "signup" | etc

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;

          if (type === "recovery") {
            setMsg("Sessão de recuperação criada ✅");
            router.replace("/auth/reset");
          } else {
            setMsg("E-mail confirmado ✅");
            router.replace("/profissional/painel");
          }
          return;
        }

        // 3) Sem parâmetros
        setMsg("Faltou parâmetro no link.");
        setDetail("Reenvie o e-mail e tente novamente.");
      } catch (e: any) {
        console.error("auth/confirm error:", e);
        setMsg("Não consegui confirmar.");
        setDetail(e?.message || "Erro desconhecido.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>IA Drogarias</h1>
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 900 }}>{msg}</div>
        {detail ? <div style={{ marginTop: 6, opacity: 0.8 }}>{detail}</div> : null}
      </div>
    </main>
  );
}
