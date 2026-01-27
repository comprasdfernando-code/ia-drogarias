"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   HELPERS
========================= */
function brl(v: number) {
  return (v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

/* =========================
   ENUMS (BATEM COM O BANCO)
========================= */
const STATUS_PROCURANDO = "procurando";
const STATUS_SOLICITADO = "SOLICITADO";
const STATUS_ACEITO = "aceito";

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
};

/* =========================
   COMPONENT
========================= */
export default function PainelProfissional() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  const [prof, setProf] = useState<Prof | null>(null);
  const [online, setOnline] = useState(false);

  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(false);

  const channelRef = useRef<any>(null);

  /* =========================
     AUTH
  ========================= */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_e, session) => setUser(session?.user || null)
    );

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
    if (error) setAuthMsg("Falha no login.");
  }

  async function signOut() {
    setOnline(false);
    await supabase.auth.signOut();
    setProf(null);
    setChamados([]);
  }

  /* =========================
     LOAD PROFISSIONAL
  ========================= */
  useEffect(() => {
    if (!user?.id) return;

    supabase
      .from("cadastros_profissionais")
      .select("id,user_id,nome,whatsapp,email,area")
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle()
      .then(({ data }) => setProf(data || null));
  }, [user?.id]);

  /* =========================
     CHAMADOS
  ========================= */
  async function refreshChamados() {
    setLoadingChamados(true);

    const { data, error } = await supabase
      .from("chamados")
      .select("*")
      .in("status", [STATUS_PROCURANDO, STATUS_SOLICITADO])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      setChamados([]);
    } else {
      setChamados(data || []);
    }

    setLoadingChamados(false);
  }

  useEffect(() => {
    if (!online) return;

    refreshChamados();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel("chamados-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chamados" },
        () => refreshChamados()
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [online]);

  /* =========================
     ACEITAR CHAMADO
  ========================= */
  async function aceitarChamado(id: string) {
    if (!prof?.id) {
      alert("Cadastro profissional não vinculado.");
      return;
    }

    const { data, error } = await supabase
      .from("chamados")
      .update({
        status: STATUS_ACEITO,
        profissional_id: prof.id,
        profissional_nome: prof.nome,
        profissional_uid: user.id,
      })
      .eq("id", id)
      .in("status", [STATUS_PROCURANDO, STATUS_SOLICITADO])
      .select("id")
      .maybeSingle();

    if (error || !data) {
      alert("Outro profissional aceitou antes.");
      refreshChamados();
      return;
    }

    alert("Chamado aceito com sucesso 🚀");
    refreshChamados();
  }

  async function aceitarPrimeiro() {
    if (!chamados.length) return;
    aceitarChamado(chamados[0].id);
  }

  /* =========================
     UI
  ========================= */
  if (authLoading) {
    return <div className="p-10 text-center">Carregando…</div>;
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
          <h1 className="text-lg font-bold">Login profissional</h1>

          <input
            className="mt-4 w-full rounded-xl border px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="mt-2 w-full rounded-xl border px-3 py-2"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {authMsg && (
            <div className="mt-2 text-sm text-red-600">{authMsg}</div>
          )}

          <button
            onClick={signIn}
            className="mt-4 w-full rounded-xl bg-emerald-600 py-2 text-white font-semibold"
          >
            Entrar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      {/* BANNER PRIORIDADE */}
      {online && chamados.length > 0 && (
        <div className="mb-6 rounded-2xl bg-emerald-600 p-4 text-white flex items-center justify-between shadow-lg">
          <div>
            <div className="font-bold text-lg">
              🚨 CHAMADO DISPONÍVEL AGORA
            </div>
            <div className="text-sm">
              Clique para pegar o atendimento imediatamente
            </div>
          </div>
          <button
            onClick={aceitarPrimeiro}
            className="rounded-xl bg-white px-5 py-2 font-bold text-emerald-700"
          >
            ✅ ACEITAR O PRIMEIRO AGORA
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* PERFIL */}
        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex justify-between">
            <div>
              <div className="font-semibold">{prof?.nome}</div>
              <div className="text-sm text-slate-500">
                WhatsApp: {onlyDigits(prof?.whatsapp || "")}
              </div>
            </div>
            <button onClick={signOut} className="text-sm text-red-600">
              Sair
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border p-4">
            <div>
              <div className="font-semibold">Disponibilidade</div>
              <div className="text-sm text-slate-500">
                Receber chamados em tempo real
              </div>
            </div>
            <button
              onClick={() => setOnline(!online)}
              className={`rounded-xl px-4 py-2 font-semibold ${
                online
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-800"
              }`}
            >
              {online ? "Online" : "Offline"}
            </button>
          </div>
        </div>

        {/* CHAMADOS */}
        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex justify-between mb-3">
            <div className="font-semibold">
              Chamados procurando ({chamados.length})
            </div>
            <button onClick={refreshChamados} className="text-sm">
              Atualizar
            </button>
          </div>

          {loadingChamados && (
            <div className="text-sm text-slate-500">Carregando…</div>
          )}

          {!loadingChamados && chamados.length === 0 && (
            <div className="text-sm text-slate-500">
              Nenhum chamado no momento.
            </div>
          )}

          <div className="space-y-3">
            {chamados.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border p-4 flex justify-between items-start"
              >
                <div>
                  <div className="font-semibold">{c.servico}</div>
                  <div className="text-sm text-slate-500">
                    {c.endereco}
                  </div>
                  <div className="text-sm mt-1">
                    Total: <b>{brl(c.total || 0)}</b>
                  </div>
                </div>
                <button
                  onClick={() => aceitarChamado(c.id)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-white font-semibold"
                >
                  Aceitar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
