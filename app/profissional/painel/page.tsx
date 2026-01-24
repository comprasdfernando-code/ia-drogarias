"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function brl(v: number) {
  return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

type Prof = {
  id: string;
  user_id: string | null;
  nome: string | null;
  whatsapp: string | null;
  email: string | null;
  area: string | null;
};

type Chamado = {
  id: string;
  created_at: string;
  status: string;
  servico: string;
  cliente_nome: string | null;
  cliente_whatsapp: string | null;
  endereco: string | null;
  observacoes: string | null;
  preco_servico: number;
  taxa_locomocao: number;
  total: number;
  profissional_id: string | null;
  profissional_nome: string | null;
};

export default function PainelProfissional() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [authMsg, setAuthMsg] = useState<string>("");

  const [prof, setProf] = useState<Prof | null>(null);
  const [loadingProf, setLoadingProf] = useState(false);

  const [online, setOnline] = useState(false);
  const [onlineSaving, setOnlineSaving] = useState(false);

  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(false);

  // Realtime channel ref (evita duplicar subscribe)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // -------- Auth boot --------
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setAuthLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, []);

  async function signIn() {
    setAuthMsg("");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) setAuthMsg("Falha no login. Verifique email e senha.");
  }

  async function signOut() {
    // tenta desligar no banco antes de sair
    try {
      await setOnlineToDB(false);
    } catch {
      // ignore
    }
    await supabase.auth.signOut();
    setProf(null);
    setOnline(false);
    setChamados([]);
  }

  // -------- Load profissional by user_id (or link by email) --------
  async function loadProfissional() {
    if (!user?.id) return;
    setLoadingProf(true);

    // 1) tenta por user_id
    let { data: p } = await supabase
      .from("cadastros_profissionais")
      .select("id,user_id,nome,whatsapp,email,area")
      .eq("user_id", user.id)
      .maybeSingle();

    // 2) se não achou, tenta vincular por email
    if (!p && user?.email) {
      const { data: byEmail } = await supabase
        .from("cadastros_profissionais")
        .select("id,user_id,nome,whatsapp,email,area")
        .eq("email", user.email)
        .maybeSingle();

      if (byEmail && !byEmail.user_id) {
        // vincula o cadastro ao usuário logado
        const { data: updated } = await supabase
          .from("cadastros_profissionais")
          .update({ user_id: user.id })
          .eq("id", byEmail.id)
          .select("id,user_id,nome,whatsapp,email,area")
          .maybeSingle();

        p = updated || byEmail;
      } else {
        p = byEmail || null;
      }
    }

    setProf((p as any) || null);
    setLoadingProf(false);

    // Depois de carregar prof, tenta ler status online do banco (tabela profissionais)
    // (não bloqueia se tabela/policies ainda não estiverem prontas)
    try {
      await loadOnlineFromDB(user.id);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (user?.id) loadProfissional();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // -------- ONLINE: DB (tabela public.profissionais) --------
  async function ensureProfRowInProfissionais(userId: string) {
    // cria/atualiza registro na tabela public.profissionais (fonte da verdade do online)
    // requer RLS: insert/update self (auth.uid() = user_id)
    const payload = {
      user_id: userId,
      nome: prof?.nome || user?.user_metadata?.nome || user?.email || "Profissional",
      whatsapp: prof?.whatsapp || null,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("profissionais")
      .upsert(payload, { onConflict: "user_id" });
  }

  async function loadOnlineFromDB(userId: string) {
    const { data, error } = await supabase
      .from("profissionais")
      .select("online")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return; // não trava o painel
    if (data?.online === true || data?.online === false) setOnline(!!data.online);
  }

  async function setOnlineToDB(nextOnline: boolean) {
    if (!user?.id) return;

    setOnlineSaving(true);
    try {
      // garante que existe linha do profissional antes do update
      await ensureProfRowInProfissionais(user.id);

      const { error } = await supabase
        .from("profissionais")
        .update({
          online: nextOnline,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro salvando online:", error);
        throw error;
      }
    } finally {
      setOnlineSaving(false);
    }
  }

  async function toggleOnline() {
    const next = !online;
    setOnline(next); // otimista
    try {
      await setOnlineToDB(next);
    } catch (e) {
      // reverte se falhou
      setOnline(!next);
      alert("Não consegui salvar seu status Online/Offline. Verifique as policies do Supabase.");
    }
  }

  // Desliga online ao fechar/atualizar a página (best-effort)
  useEffect(() => {
    if (!user?.id) return;

    const handler = () => {
      // não dá pra await no unload; best-effort
      try {
        supabase
          .from("profissionais")
          .update({ online: false, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } catch {
        // ignore
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [user?.id]);

  // -------- Load chamados + realtime (only when online) --------
  async function refreshChamados() {
    setLoadingChamados(true);

    const { data, error } = await supabase
      .from("chamados")
      .select("*")
      .eq("status", "procurando")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erro carregando chamados:", error);
      setChamados([]);
      setLoadingChamados(false);
      return;
    }

    setChamados((data as any) || []);
    setLoadingChamados(false);
  }

  useEffect(() => {
    // limpa subscribe anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!online) return;

    refreshChamados();

    const channel = supabase
      .channel("chamados-procurando")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chamados" },
        () => {
          refreshChamados();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  async function aceitarChamado(chamadoId: string) {
    if (!prof?.id) {
      alert("Seu cadastro profissional não está vinculado ao login ainda.");
      return;
    }

    const { data, error } = await supabase
      .from("chamados")
      .update({
        status: "aceito",
        profissional_id: prof.id,
        profissional_nome: prof.nome || "Profissional",
        // importante: vincula auth.uid() (para policies seguras)
        profissional_uid: user?.id || null,
      })
      .eq("id", chamadoId)
      .eq("status", "procurando") // trava concorrência
      .select("id,status")
      .maybeSingle();

    if (error) {
      console.error(error);
      alert("Erro ao aceitar. Tente novamente.");
      return;
    }
    if (!data) {
      alert("Outro profissional aceitou antes de você.");
      refreshChamados();
      return;
    }

    alert("Chamado aceito ✅");
    refreshChamados();
  }

  const headerTitle = useMemo(() => {
    if (authLoading) return "Carregando…";
    if (!user) return "Login do profissional";
    return "Painel do profissional";
  }, [authLoading, user]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">IA Drogarias</div>
          <div className="text-xs text-slate-500">{headerTitle}</div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {!user ? (
          <div className="mx-auto max-w-md rounded-2xl border bg-white p-5 shadow-sm">
            <h1 className="text-lg font-bold text-slate-900">Entrar</h1>
            <p className="mt-1 text-sm text-slate-600">Acesso exclusivo para profissionais.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                  placeholder="email@exemplo.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {authMsg ? <div className="text-sm text-rose-600">{authMsg}</div> : null}

              <button
                onClick={signIn}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
              >
                Entrar
              </button>

              <div className="text-xs text-slate-500">
                Se ainda não tiver conta, você cria pelo seu fluxo de cadastro e depois habilitamos o login.
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Seu perfil</div>
                  <div className="mt-1 text-xs text-slate-500">{user.email}</div>
                </div>
                <button
                  onClick={signOut}
                  className="rounded-xl border px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Sair
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  {loadingProf ? "Carregando cadastro…" : prof?.nome || "Cadastro não vinculado"}
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {prof?.area ? `Área: ${prof.area}` : "—"} •{" "}
                  {prof?.whatsapp ? `WhatsApp: ${onlyDigits(prof.whatsapp)}` : "—"}
                </div>

                {!prof ? (
                  <div className="mt-3 text-xs text-rose-600">
                    Não encontrei seu cadastro em <b>cadastros_profissionais</b> com <b>user_id</b> nem por email.
                    Você precisa vincular esse login ao cadastro.
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Disponibilidade</div>
                  <div className="text-xs text-slate-500">
                    Ative para receber chamados em tempo real {onlineSaving ? "(salvando…)" : ""}.
                  </div>
                </div>

                <button
                  onClick={toggleOnline}
                  disabled={onlineSaving}
                  className={[
                    "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                    online ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-900",
                    onlineSaving ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {online ? "Online" : "Offline"}
                </button>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                * Agora o status <b>Online</b> é salvo na tabela <b>public.profissionais</b> (usado no Admin Operação).
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Chamados procurando</div>
                  <div className="text-xs text-slate-500">
                    {online ? "Atualiza em tempo real" : "Ative Online para carregar"}
                  </div>
                </div>
                {online ? (
                  <button
                    onClick={refreshChamados}
                    className="rounded-xl border px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    Atualizar
                  </button>
                ) : null}
              </div>

              {!online ? (
                <div className="mt-6 text-sm text-slate-500">Ative “Online” para ver e aceitar chamados.</div>
              ) : loadingChamados ? (
                <div className="mt-6 text-sm text-slate-500">Carregando chamados…</div>
              ) : chamados.length === 0 ? (
                <div className="mt-6 text-sm text-slate-500">Nenhum chamado no momento.</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {chamados.map((c) => (
                    <div key={c.id} className="rounded-2xl border p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{c.servico}</div>
                          <div className="mt-1 text-xs text-slate-600">
                            {c.endereco || "Sem endereço"} • {c.cliente_nome || "Cliente"} •{" "}
                            {onlyDigits(c.cliente_whatsapp || "")}
                          </div>
                          {c.observacoes ? (
                            <div className="mt-2 text-xs text-slate-600">Obs: {c.observacoes}</div>
                          ) : null}

                          <div className="mt-2 text-xs text-slate-600">
                            Valor: <b>{brl(Number(c.preco_servico || 0))}</b> + Locomoção:{" "}
                            <b>{brl(Number(c.taxa_locomocao || 0))}</b> = <b>{brl(Number(c.total || 0))}</b>
                          </div>
                        </div>

                        <button
                          onClick={() => aceitarChamado(c.id)}
                          disabled={!prof?.id}
                          className={[
                            "rounded-2xl px-4 py-2 text-sm font-semibold text-white transition",
                            !prof?.id ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:opacity-95",
                          ].join(" ")}
                        >
                          Aceitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
