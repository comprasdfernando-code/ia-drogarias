"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   CONFIG STATUS (IGUAL SEU BANCO)
========================= */
const STATUS_PROCURANDO = "procurando";
const STATUS_SOLICITADO = "SOLICITADO";
const STATUS_ACEITO = "aceito";
const STATUS_EM_ANDAMENTO = "em_andamento";
const STATUS_CHEGUEI = "cheguei";
const STATUS_FINALIZADO = "finalizado";

/* =========================
   HELPERS
========================= */
function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}
function mapsLinkFromEndereco(endereco?: string | null) {
  if (!endereco) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}
function wppLink(phone?: string | null, text?: string) {
  const p = onlyDigits(phone || "");
  if (!p) return "#";
  const msg = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/55${p}${msg}`;
}
function friendlyAuthError(msg?: string) {
  const m = String(msg || "").toLowerCase();
  if (!m) return "Falha no login. Verifique email e senha.";
  if (m.includes("email not confirmed") || m.includes("email_not_confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou peça ao admin para confirmar.";
  }
  if (m.includes("invalid login credentials")) {
    return "Falha no login. Verifique email e senha.";
  }
  if (m.includes("too many requests")) {
    return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  }
  return msg || "Falha no login.";
}

/* =========================
   TYPES
========================= */
type Prof = {
  id: string;
  user_id: string | null;
  nome: string | null;
  whatsapp: string | null;
  email: string | null;
  area: string | null;
};

type UsuarioRow = {
  id: string;
  email: string | null;
  tipo: string | null;
  bloqueado?: boolean | null;
  bloqueado_motivo?: string | null;
  bloqueado_em?: string | null;
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

  preco_servico: number | null;
  taxa_locomocao: number | null;
  total: number | null;

  profissional_id: string | null;
  profissional_nome: string | null;
  profissional_uid?: string | null;

  profissional_lat?: number | null;
  profissional_lng?: number | null;
  profissional_pos_at?: string | null;
};

export default function PainelProfissionalPremium() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // login form
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  // checks
  const [emailConfirmed, setEmailConfirmed] = useState<boolean>(true);
  const [checkingGate, setCheckingGate] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState<{ blocked: boolean; motivo?: string; em?: string }>({
    blocked: false,
  });

  const [prof, setProf] = useState<Prof | null>(null);
  const [online, setOnline] = useState(true);

  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(false);

  const [meuChamado, setMeuChamado] = useState<Chamado | null>(null);
  const [loadingMeuChamado, setLoadingMeuChamado] = useState(false);

  // realtime channel
  const channelRef = useRef<any>(null);

  // SOUND
  const [soundArmed, setSoundArmed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTopIdRef = useRef<string>("");

  // GPS
  const watchIdRef = useRef<number | null>(null);
  const [gpsOn, setGpsOn] = useState(false);

  /* =========================
     AUTH BOOT
  ========================= */
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data?.user || null);
      setAuthLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  async function signIn() {
    setAuthMsg("");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      console.log("LOGIN ERROR:", error);
      setAuthMsg(friendlyAuthError(error.message));
      return;
    }

    setAuthMsg("");
  }

  async function signOut() {
    try {
      await saveOnline(false);
    } catch {}
    stopLiveLocation();
    await supabase.auth.signOut();
    setProf(null);
    setMeuChamado(null);
    setChamados([]);
    setOnline(false);
    setGpsOn(false);
    setEmailConfirmed(true);
    setBlockedInfo({ blocked: false });
  }

  /* =========================
     GATE: email confirmado + bloqueio admin
     - Usa user.identities / user.email_confirmed_at (quando disponível)
     - E verifica tabela public.usuarios (bloqueado)
  ========================= */
  async function checkEmailConfirmed(u: any) {
    // padrões do supabase: email_confirmed_at (string) ou confirmed_at
    const v1 = u?.email_confirmed_at || u?.confirmed_at;
    if (v1) return true;

    // fallback: identities (alguns casos)
    const identities = u?.identities || [];
    const anyConfirmed = identities?.some((id: any) => {
      const identData = id?.identity_data || {};
      return !!identData?.email_verified || !!identData?.email_confirmed;
    });
    return !!anyConfirmed;
  }

  async function gateAccess() {
    if (!user?.id) return;
    setCheckingGate(true);
    try {
      // 1) email confirmado
      const confirmed = await checkEmailConfirmed(user);
      setEmailConfirmed(confirmed);

      // 2) bloqueio admin (public.usuarios)
      //    Observação: seu admin/cadastros usa tabela "usuarios" com tipo "farmaceutico"
      if (user?.email) {
        const { data: urow, error } = await supabase
          .from("usuarios")
          .select("id,email,tipo,bloqueado,bloqueado_motivo,bloqueado_em")
          .eq("email", user.email)
          .maybeSingle<UsuarioRow>();

        if (error) console.warn("gate usuarios error:", error);

        if (urow?.bloqueado) {
          setBlockedInfo({
            blocked: true,
            motivo: urow.bloqueado_motivo || "Acesso bloqueado pelo administrador.",
            em: urow.bloqueado_em || undefined,
          });

          // derruba sessão pra não ficar preso
          try {
            await supabase.auth.signOut();
          } catch {}
          setUser(null);
          return;
        } else {
          setBlockedInfo({ blocked: false });
        }
      } else {
        setBlockedInfo({ blocked: false });
      }
    } finally {
      setCheckingGate(false);
    }
  }

  // roda gate sempre que user muda
  useEffect(() => {
    if (!user?.id) return;
    gateAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function resendConfirmation() {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          // ajuste se você tiver callback específico
          emailRedirectTo: `${window.location.origin}/profissional/painel`,
        },
      });
      if (error) throw error;
      alert("Reenviei o e-mail de confirmação ✅ (veja caixa de entrada e spam)");
    } catch (e: any) {
      alert(e?.message || "Não consegui reenviar agora.");
    }
  }

  /* =========================
     LOAD PROF (por user_id, senão por email)
  ========================= */
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      // 1) tenta por user_id
      let { data: p } = await supabase
        .from("cadastros_profissionais")
        .select("id,user_id,nome,whatsapp,email,area")
        .eq("user_id", user.id)
        .maybeSingle();

      // 2) tenta por email e vincula
      if (!p && user?.email) {
        const { data: byEmail } = await supabase
          .from("cadastros_profissionais")
          .select("id,user_id,nome,whatsapp,email,area")
          .eq("email", user.email)
          .maybeSingle();

        // tenta vincular user_id
        if (byEmail && !byEmail.user_id) {
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
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* =========================
     ONLINE (tabela public.profissionais)
  ========================= */
  async function ensureProfRow(userId: string) {
    await supabase.from("profissionais").upsert(
      {
        user_id: userId,
        nome: prof?.nome || user?.email || "Profissional",
        whatsapp: prof?.whatsapp || null,
      },
      { onConflict: "user_id" }
    );
  }

  async function saveOnline(next: boolean) {
    if (!user?.id) return;
    try {
      await ensureProfRow(user.id);
      await supabase.from("profissionais").update({ online: next }).eq("user_id", user.id);
    } catch (e) {
      console.warn("Não consegui salvar online/offline na tabela profissionais:", e);
    }
  }

  async function toggleOnline() {
    const next = !online;
    setOnline(next);
    await saveOnline(next);

    if (!next) {
      stopLiveLocation();
      setGpsOn(false);
    }
  }

  /* =========================
     SOUND
  ========================= */
  useEffect(() => {
    audioRef.current = new Audio("/sounds/farma.mp3");
    audioRef.current.preload = "auto";
    audioRef.current.volume = 1;
  }, []);

  async function armSound() {
    try {
      if (!audioRef.current) return;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setSoundArmed(true);
      alert("Alertas sonoros ativados ✅");
    } catch {
      alert("Seu navegador bloqueou o som. Tente de novo tocando no botão.");
    }
  }

  async function playAlert() {
    if (!soundArmed) return;
    try {
      if (!audioRef.current) return;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch {}
  }

  /* =========================
     LOAD CHAMADOS
  ========================= */
  async function refreshChamados() {
    setLoadingChamados(true);

    const { data, error } = await supabase
      .from("chamados")
      .select("*")
      .in("status", [STATUS_PROCURANDO, STATUS_SOLICITADO])
      .order("created_at", { ascending: false })
      .limit(50);

    setLoadingChamados(false);

    if (error) {
      console.error("Erro carregando chamados:", error);
      setChamados([]);
      return;
    }

    const rows = (data as any as Chamado[]) || [];
    setChamados(rows);

    const topId = rows?.[0]?.id || "";
    if (topId && topId !== lastTopIdRef.current) {
      if (lastTopIdRef.current) await playAlert();
      lastTopIdRef.current = topId;
    }
  }

  /* =========================
     MEU CHAMADO
  ========================= */
  async function loadMeuChamado() {
    if (!user?.id) return;
    setLoadingMeuChamado(true);

    const { data, error } = await supabase
      .from("chamados")
      .select("*")
      .eq("profissional_uid", user.id)
      .in("status", [STATUS_ACEITO, STATUS_EM_ANDAMENTO, STATUS_CHEGUEI])
      .order("created_at", { ascending: false })
      .limit(1);

    setLoadingMeuChamado(false);

    if (error) {
      console.error("Erro carregando meu chamado:", error);
      setMeuChamado(null);
      return;
    }
    setMeuChamado(((data as any[])?.[0] as Chamado) || null);
  }

  /* =========================
     REALTIME + FALLBACK POLLING
  ========================= */
  useEffect(() => {
    // limpa subscribe anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // gate: precisa estar logado + online + email confirmado
    if (!user?.id || !online) return;
    if (!emailConfirmed) return;

    refreshChamados();
    loadMeuChamado();

    const ch = supabase
      .channel("realtime-chamados-pro")
      .on("postgres_changes", { event: "*", schema: "public", table: "chamados" }, () => {
        refreshChamados();
        loadMeuChamado();
      })
      .subscribe();

    channelRef.current = ch;

    const t = setInterval(() => {
      refreshChamados();
      loadMeuChamado();
    }, 5000);

    return () => {
      clearInterval(t);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, online, soundArmed, emailConfirmed]);

  /* =========================
     ACEITAR (RPC accept_chamado)
  ========================= */
  async function aceitarChamado(chamadoId: string) {
    if (!emailConfirmed) {
      alert("Seu e-mail ainda não foi confirmado. Confirme para aceitar chamados.");
      return;
    }

    if (!prof?.id) {
      alert("Seu cadastro profissional não está vinculado ao login.");
      return;
    }

    const { data, error } = await supabase.rpc("accept_chamado", {
      p_chamado_id: chamadoId,
      p_profissional_id: prof.id,
      p_profissional_nome: prof.nome || "Profissional",
      p_profissional_uid: user?.id || null,
    });

    if (error) {
      console.error("Erro aceitarChamado:", error);
      alert(`Erro ao aceitar.\ncode: ${error.code || "-"}\nmessage: ${error.message || "-"}`);
      await refreshChamados();
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      const check = await supabase
        .from("chamados")
        .select("status,profissional_nome,profissional_id")
        .eq("id", chamadoId)
        .maybeSingle();

      const st = String(check.data?.status || "");
      const pid = String(check.data?.profissional_id || "");

      if (pid && pid !== "null") {
        alert(`Outro profissional aceitou antes: ${check.data?.profissional_nome || "—"}`);
      } else {
        alert(`Não consegui aceitar. Status atual: ${st || "desconhecido"}`);
      }

      await refreshChamados();
      return;
    }

    alert("Chamado aceito ✅");
    await refreshChamados();
    await loadMeuChamado();
  }

  async function aceitarPrimeiroAgora() {
    if (!chamados.length) return;
    await aceitarChamado(chamados[0].id);
  }

  /* =========================
     AÇÕES DO MEU CHAMADO
  ========================= */
  async function updateMeuChamadoStatus(nextStatus: string) {
    if (!meuChamado?.id) return;

    const { error } = await supabase
      .from("chamados")
      .update({ status: nextStatus })
      .eq("id", meuChamado.id)
      .eq("profissional_uid", user?.id || "");

    if (error) {
      console.error("Erro mudando status:", error);
      alert("Não consegui mudar o status. Veja o console.");
      return;
    }

    await loadMeuChamado();
    await refreshChamados();
  }

  /* =========================
     GPS LIVE LOCATION
  ========================= */
  async function startLiveLocation(chamadoId: string) {
    if (!chamadoId) return;
    if (typeof window === "undefined") return;

    if (!("geolocation" in navigator)) {
      alert("Seu dispositivo não suporta GPS.");
      return;
    }

    if (watchIdRef.current != null) {
      setGpsOn(true);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const { error } = await supabase
          .from("chamados")
          .update({
            profissional_lat: lat,
            profissional_lng: lng,
            profissional_pos_at: new Date().toISOString(),
          })
          .eq("id", chamadoId);

        if (error) console.warn("GPS update error:", error);
      },
      (err) => {
        console.warn("GPS error:", err);
        alert("Não consegui acessar sua localização. Libere a permissão de GPS.");
        stopLiveLocation();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      }
    );

    setGpsOn(true);
  }

  function stopLiveLocation() {
    if (typeof window === "undefined") return;

    if (watchIdRef.current != null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsOn(false);
  }

  useEffect(() => {
    if (!online) {
      stopLiveLocation();
      return;
    }
    if (!meuChamado?.id) {
      stopLiveLocation();
      return;
    }
    if (String(meuChamado.status) === STATUS_FINALIZADO) {
      stopLiveLocation();
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, meuChamado?.id, meuChamado?.status]);

  useEffect(() => {
    return () => stopLiveLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     HEADER TITLE
  ========================= */
  const headerTitle = useMemo(() => {
    if (authLoading) return "Carregando…";
    if (!user) return "Login do profissional";
    if (checkingGate) return "Validando acesso…";
    if (!emailConfirmed) return "Confirmação de e-mail pendente";
    return "Painel do profissional";
  }, [authLoading, user, checkingGate, emailConfirmed]);

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-extrabold text-slate-900">IA Drogarias</div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
              Profissional
            </span>
          </div>
          <div className="text-xs text-slate-500">{headerTitle}</div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* LOGIN */}
        {!user ? (
          <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-lg font-bold text-slate-900">Entrar</h1>
            <p className="mt-1 text-sm text-slate-600">Acesso exclusivo para profissionais.</p>

            {/* se foi bloqueado pelo admin */}
            {blockedInfo.blocked ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <div className="font-extrabold">Acesso bloqueado</div>
                <div className="mt-1 text-xs">
                  {blockedInfo.motivo || "Acesso bloqueado pelo administrador."}
                  {blockedInfo.em ? (
                    <span className="ml-2 text-rose-700/80">
                      ({new Date(blockedInfo.em).toLocaleString("pt-BR")})
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

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
            </div>
          </div>
        ) : (
          <>
            {/* Se email não confirmado: trava painel */}
            {!emailConfirmed ? (
              <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <div className="text-lg font-extrabold text-amber-900">Confirmação de e-mail pendente</div>
                <div className="mt-2 text-sm text-amber-900/90">
                  Seu e-mail <b>{user?.email}</b> ainda não foi confirmado.
                  <br />
                  Confirme para poder receber e aceitar chamados.
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={resendConfirmation}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                  >
                    Reenviar e-mail de confirmação
                  </button>

                  <button
                    onClick={signOut}
                    className="rounded-2xl border px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
                  >
                    Sair
                  </button>

                  <a
                    href="/admin/cadastros"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
                  >
                    Abrir admin (confirmar por lá)
                  </a>
                </div>

                {checkingGate ? <div className="mt-3 text-xs text-amber-900/70">Validando…</div> : null}
              </div>
            ) : (
              <>
                {/* Banner urgente */}
                {online && chamados.length > 0 ? (
                  <div className="mb-5 rounded-3xl border border-emerald-200 bg-emerald-600 p-4 text-white shadow-lg">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-base font-extrabold tracking-wide">🚨 CHAMADO DISPONÍVEL AGORA</div>
                        <div className="text-sm opacity-95">
                          Clique em <b>ACEITAR O PRIMEIRO AGORA</b> para pegar imediatamente.
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {!soundArmed ? (
                          <button
                            onClick={armSound}
                            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-emerald-700 shadow hover:opacity-95"
                          >
                            🔊 Ativar alertas
                          </button>
                        ) : (
                          <span className="rounded-2xl bg-white/15 px-3 py-2 text-xs font-semibold">
                            🔊 Alertas ON
                          </span>
                        )}

                        <button
                          onClick={aceitarPrimeiroAgora}
                          className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-700 shadow hover:opacity-95"
                        >
                          ✅ ACEITAR O PRIMEIRO AGORA
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  {/* Coluna esquerda */}
                  <div className="space-y-6">
                    {/* Perfil */}
                    <div className="rounded-3xl border bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Seu perfil</div>
                          <div className="mt-1 text-xs text-slate-500">{user.email}</div>
                        </div>
                        <button
                          onClick={signOut}
                          className="rounded-2xl border px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          Sair
                        </button>
                      </div>

                      <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                        <div className="text-sm font-extrabold text-slate-900">
                          {prof?.nome || "Cadastro não vinculado"}
                        </div>
                        <div className="mt-1 text-xs text-slate-700">
                          {prof?.area ? `Área: ${prof.area}` : "—"} •{" "}
                          {prof?.whatsapp ? `WhatsApp: ${onlyDigits(prof.whatsapp)}` : "—"}
                        </div>

                        {!prof ? (
                          <div className="mt-3 text-xs text-rose-600">
                            Não encontrei seu cadastro em <b>cadastros_profissionais</b> por <b>user_id</b> nem por
                            email.
                          </div>
                        ) : null}
                      </div>

                      {/* Online */}
                      <div className="mt-4 flex items-center justify-between rounded-3xl border p-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Disponibilidade</div>
                          <div className="text-xs text-slate-500">Receber chamados em tempo real</div>
                        </div>

                        <button
                          onClick={toggleOnline}
                          className={[
                            "rounded-2xl px-4 py-2 text-sm font-extrabold transition",
                            online ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-900",
                          ].join(" ")}
                        >
                          {online ? "Online" : "Offline"}
                        </button>
                      </div>

                      {/* Sound */}
                      <div className="mt-3 flex items-center justify-between rounded-3xl border p-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Alertas sonoros</div>
                          <div className="text-xs text-slate-500">Para tocar no celular, precisa ativar 1 vez.</div>
                        </div>

                        {!soundArmed ? (
                          <button
                            onClick={armSound}
                            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                          >
                            🔊 Ativar
                          </button>
                        ) : (
                          <span className="rounded-2xl bg-emerald-100 px-4 py-2 text-xs font-extrabold text-emerald-800">
                            ATIVO ✅
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meu chamado */}
                    <div className="rounded-3xl border bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Minha corrida</div>
                          <div className="text-xs text-slate-500">O atendimento que você aceitou</div>
                        </div>
                        <button
                          onClick={loadMeuChamado}
                          className="rounded-2xl border px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                        >
                          Atualizar
                        </button>
                      </div>

                      {loadingMeuChamado ? (
                        <div className="mt-4 text-sm text-slate-500">Carregando…</div>
                      ) : !meuChamado ? (
                        <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                          Você ainda não aceitou nenhum chamado.
                        </div>
                      ) : (
                        <div className="mt-4 rounded-3xl border p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-extrabold text-slate-900">{meuChamado.servico}</div>
                              <div className="mt-1 text-xs text-slate-600">
                                {meuChamado.endereco || "Sem endereço"} • {meuChamado.cliente_nome || "Cliente"}
                              </div>
                              {meuChamado.observacoes ? (
                                <div className="mt-2 text-xs text-slate-600">Obs: {meuChamado.observacoes}</div>
                              ) : null}
                              <div className="mt-2 text-xs text-slate-700">
                                Total: <b>{brl(Number(meuChamado.total || 0))}</b>
                              </div>

                              <div className="mt-2 text-xs text-slate-600">
                                GPS:{" "}
                                <b className={gpsOn ? "text-emerald-700" : "text-slate-600"}>
                                  {gpsOn ? "ATIVO" : "DESLIGADO"}
                                </b>
                                {meuChamado.profissional_pos_at ? (
                                  <span className="ml-2 text-slate-400">
                                    (última:{" "}
                                    {new Date(meuChamado.profissional_pos_at).toLocaleTimeString("pt-BR")})
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <a
                                href={mapsLinkFromEndereco(meuChamado.endereco)}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-2xl bg-slate-900 px-4 py-2 text-center text-sm font-extrabold text-white hover:opacity-95"
                              >
                                🗺️ Abrir rota
                              </a>

                              <a
                                href={wppLink(
                                  meuChamado.cliente_whatsapp,
                                  "Olá! Sou o profissional da IA Drogarias. Estou a caminho do seu atendimento."
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-2xl border px-4 py-2 text-center text-sm font-extrabold text-slate-900 hover:bg-slate-50"
                              >
                                💬 Whats do cliente
                              </a>

                              {!gpsOn ? (
                                <button
                                  onClick={() => startLiveLocation(meuChamado.id)}
                                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-center text-sm font-extrabold text-white hover:opacity-95"
                                >
                                  📍 Ativar GPS (compartilhar)
                                </button>
                              ) : (
                                <button
                                  onClick={stopLiveLocation}
                                  className="rounded-2xl border px-4 py-2 text-center text-sm font-extrabold text-slate-900 hover:bg-slate-50"
                                >
                                  ⛔ Parar GPS
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <button
                              onClick={() => updateMeuChamadoStatus(STATUS_EM_ANDAMENTO)}
                              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                            >
                              🚗 A CAMINHO
                            </button>
                            <button
                              onClick={() => updateMeuChamadoStatus(STATUS_CHEGUEI)}
                              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                            >
                              📍 CHEGUEI
                            </button>
                            <button
                              onClick={() => updateMeuChamadoStatus(STATUS_FINALIZADO)}
                              className="rounded-2xl border px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
                            >
                              ✅ FINALIZAR
                            </button>
                          </div>

                          <div className="mt-2 text-xs text-slate-500">
                            Status atual: <b>{meuChamado.status}</b>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coluna direita */}
                  <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Chamados disponíveis</div>
                        <div className="text-xs text-slate-500">
                          {online ? "Atualiza sozinho (Realtime + fallback)" : "Ative Online"}
                        </div>
                      </div>
                      <button
                        onClick={refreshChamados}
                        className="rounded-2xl border px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        Atualizar
                      </button>
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
                          <div key={c.id} className="rounded-3xl border p-4 transition hover:shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-extrabold text-slate-900">{c.servico}</div>
                                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-extrabold text-emerald-800">
                                    {String(c.status)}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-slate-600">
                                  {c.endereco || "Sem endereço"} • {c.cliente_nome || "Cliente"}
                                </div>
                                {c.observacoes ? (
                                  <div className="mt-2 text-xs text-slate-600">Obs: {c.observacoes}</div>
                                ) : null}

                                <div className="mt-2 text-xs text-slate-700">
                                  Serviço: <b>{brl(Number(c.preco_servico || 0))}</b> • Locomoção:{" "}
                                  <b>{brl(Number(c.taxa_locomocao || 0))}</b> • Total:{" "}
                                  <b>{brl(Number(c.total || 0))}</b>
                                </div>

                                <div className="mt-2 flex gap-2">
                                  <a
                                    href={mapsLinkFromEndereco(c.endereco)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-2xl border px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-50"
                                  >
                                    🗺️ Rota
                                  </a>
                                  <a
                                    href={`/servicos/chamado/${c.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-2xl border px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-50"
                                  >
                                    🔎 Ver tela do cliente
                                  </a>
                                </div>
                              </div>

                              <button
                                onClick={() => aceitarChamado(c.id)}
                                disabled={!prof?.id}
                                className={[
                                  "rounded-2xl px-5 py-3 text-sm font-extrabold text-white transition",
                                  !prof?.id ? "cursor-not-allowed bg-slate-400" : "bg-slate-900 hover:opacity-95",
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
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
