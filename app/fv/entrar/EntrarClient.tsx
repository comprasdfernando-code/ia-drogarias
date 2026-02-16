"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function safePath(p: string) {
  if (!p) return "/fv/conta";
  // se vier URL completa, tenta usar só o pathname (evita redirect estranho)
  try {
    if (p.startsWith("http://") || p.startsWith("https://")) {
      const u = new URL(p);
      return u.pathname + (u.search || "");
    }
  } catch {}
  if (!p.startsWith("/")) return `/${p}`;
  return p;
}

function buildFVRedirect(origin: string, nextUrl: string) {
  // ✅ sempre volta pro callback do FV (não mistura com /profissional)
  const nextSafe = safePath(nextUrl);
  const cb = `/fv/auth/callback?next=${encodeURIComponent(nextSafe)}`;
  return `${origin}${cb}`;
}

export default function EntrarClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const nextUrl = useMemo(() => safePath(sp.get("next") || "/fv/conta"), [sp]);

  const [mode, setMode] = useState<"magic" | "senha">("magic");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // se já está logado, manda pra conta
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) router.replace(nextUrl);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureProfile() {
    // cria/atualiza perfil do cliente (best-effort)
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      const payload = {
        user_id: user.id,
        nome: nome || user.user_metadata?.name || null,
        email: (email || user.email || "").toLowerCase(),
        cpf: cpf ? onlyDigits(cpf).slice(0, 11) : null,
        phone: phone ? onlyDigits(phone) : null,
        updated_at: new Date().toISOString(),
      };

      await supabase.from("customer_profiles").upsert(payload, { onConflict: "user_id" });
    } catch {}
  }

  async function onSendMagicLink() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const e = (email || "").trim().toLowerCase();
      if (!e.includes("@")) throw new Error("Digite um e-mail válido.");

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const emailRedirectTo = origin ? buildFVRedirect(origin, nextUrl) : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: {
          // ✅ confirmação sempre cai no FV
          emailRedirectTo,
        },
      });

      if (error) throw error;

      setMsg("Te enviei um link de acesso no e-mail. Abra e volte pro site.");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function onLoginSenha() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const e = (email || "").trim().toLowerCase();
      if (!e.includes("@")) throw new Error("Digite um e-mail válido.");
      if (!senha || senha.length < 6) throw new Error("Senha inválida (mín. 6).");

      const { error } = await supabase.auth.signInWithPassword({ email: e, password: senha });
      if (error) throw error;

      await ensureProfile();
      router.replace(nextUrl);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function onCriarContaSenha() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const e = (email || "").trim().toLowerCase();
      if (!e.includes("@")) throw new Error("Digite um e-mail válido.");
      if (!senha || senha.length < 6) throw new Error("Senha inválida (mín. 6).");

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const emailRedirectTo = origin ? buildFVRedirect(origin, nextUrl) : undefined;

      const { error } = await supabase.auth.signUp({
        email: e,
        password: senha,
        options: {
          data: { name: nome || null },
          // ✅ confirmação de e-mail (signup) também cai no FV
          emailRedirectTo,
        },
      });
      if (error) throw error;

      await ensureProfile();
      setMsg("Conta criada! Se precisar confirmar, verifique seu e-mail e clique no link.");

      // tenta redirecionar (se já tiver sessão)
      const { data } = await supabase.auth.getUser();
      if (data?.user) router.replace(nextUrl);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-extrabold">Entrar</h1>
      <p className="mt-1 text-sm text-slate-600">Faça login para salvar seus dados e acompanhar pedidos.</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={[
            "rounded-xl border px-4 py-3 text-sm font-semibold",
            mode === "magic" ? "border-slate-900 bg-slate-900 text-white" : "bg-white hover:bg-slate-50",
          ].join(" ")}
        >
          Link no e-mail
        </button>
        <button
          type="button"
          onClick={() => setMode("senha")}
          className={[
            "rounded-xl border px-4 py-3 text-sm font-semibold",
            mode === "senha" ? "border-slate-900 bg-slate-900 text-white" : "bg-white hover:bg-slate-50",
          ].join(" ")}
        >
          E-mail + senha
        </button>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-4">
        <div className="grid gap-3">
          <div>
            <div className="mb-1 text-xs font-bold opacity-70">E-mail</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              placeholder="seuemail@dominio.com"
            />
          </div>

          {mode === "senha" ? (
            <div>
              <div className="mb-1 text-xs font-bold opacity-70">Senha</div>
              <input
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                type="password"
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                placeholder="••••••••"
              />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-xs font-bold opacity-70">Nome (opcional)</div>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-bold opacity-70">CPF (opcional)</div>
              <input
                value={cpf}
                onChange={(e) => setCpf(onlyDigits(e.target.value).slice(0, 11))}
                inputMode="numeric"
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                placeholder="Somente números"
              />
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-bold opacity-70">WhatsApp (opcional)</div>
            <input
              value={phone}
              onChange={(e) => setPhone(onlyDigits(e.target.value))}
              inputMode="numeric"
              className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              placeholder="DDD + número"
            />
          </div>

          {err ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-wrap">
              {err}
            </div>
          ) : null}

          {msg ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 whitespace-pre-wrap">
              {msg}
            </div>
          ) : null}

          {mode === "magic" ? (
            <button
              type="button"
              onClick={onSendMagicLink}
              disabled={busy}
              className="w-full rounded-xl bg-black px-4 py-3 font-extrabold text-white disabled:opacity-60"
            >
              {busy ? "Enviando…" : "Enviar link de acesso"}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onLoginSenha}
                disabled={busy}
                className="w-full rounded-xl bg-black px-4 py-3 font-extrabold text-white disabled:opacity-60"
              >
                {busy ? "Entrando…" : "Entrar"}
              </button>
              <button
                type="button"
                onClick={onCriarContaSenha}
                disabled={busy}
                className="w-full rounded-xl border px-4 py-3 font-extrabold disabled:opacity-60"
              >
                {busy ? "Criando…" : "Criar conta"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-slate-500">
        Ao entrar, você poderá acompanhar pedidos em <b>/fv/conta/pedidos</b>.
      </div>
    </div>
  );
}
