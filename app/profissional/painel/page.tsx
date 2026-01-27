"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= UTIL ================= */
function brl(v: number) {
  return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ================= TYPES ================= */
type Prof = {
  id: string;
  nome: string | null;
  whatsapp: string | null;
};

type Chamado = {
  id: string;
  created_at: string;
  status: "procurando" | "aceito" | "em_andamento" | "finalizado";
  servico: string;
  cliente_nome: string | null;
  cliente_whatsapp: string | null;
  endereco: string | null;
  preco_servico: number;
  taxa_locomocao: number;
  total: number;
};

/* ================= PAGE ================= */
export default function PainelProfissional() {
  const [user, setUser] = useState<any>(null);
  const [prof, setProf] = useState<Prof | null>(null);
  const [online, setOnline] = useState(true);

  const [chamados, setChamados] = useState<Chamado[]>([]);
  const lastIdsRef = useRef<string[]>([]);

  /* 🔊 áudio */
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
  }, []);

  /* ================= LOAD PROF ================= */
  useEffect(() => {
    if (!user?.id) return;

    supabase
      .from("cadastros_profissionais")
      .select("id,nome,whatsapp")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProf(data || null));
  }, [user?.id]);

  /* ================= AUDIO ================= */
  useEffect(() => {
    audioRef.current = new Audio("/sounds/farma.mp3");
    audioRef.current.volume = 1;
  }, []);

  function tocarSom() {
    try {
      audioRef.current?.play();
    } catch {}
  }

  /* ================= LOAD CHAMADOS ================= */
  async function loadChamados() {
    const { data } = await supabase
      .from("chamados")
      .select("*")
      .eq("status", "procurando")
      .order("created_at", { ascending: false });

    if (!data) return;

    const ids = data.map((c) => c.id);
    const antigos = lastIdsRef.current;

    // 🔔 novo chamado chegou
    if (ids.length > antigos.length) {
      tocarSom();
    }

    lastIdsRef.current = ids;
    setChamados(data as Chamado[]);
  }

  /* ================= POLLING ================= */
  useEffect(() => {
    if (!online) return;

    loadChamados();
    const t = setInterval(loadChamados, 5000);

    return () => clearInterval(t);
  }, [online]);

  /* ================= ACEITAR ================= */
  async function aceitarChamado(chamadoId: string) {
    if (!prof?.id) {
      alert("Cadastro profissional não vinculado.");
      return;
    }

    const { error, data } = await supabase
      .from("chamados")
      .update({
        status: "aceito",
        profissional_id: prof.id,
        profissional_nome: prof.nome,
      })
      .eq("id", chamadoId)
      .eq("status", "procurando")
      .select()
      .maybeSingle();

    if (error || !data) {
      alert("Outro profissional aceitou antes.");
      loadChamados();
      return;
    }

    alert("✅ Chamado aceito!");
    loadChamados();
  }

  function aceitarPrimeiro() {
    if (chamados.length > 0) {
      aceitarChamado(chamados[0].id);
    }
  }

  /* ================= UI ================= */
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-white p-4">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* 🔔 BANNER */}
        {online && chamados.length > 0 && (
          <div className="rounded-2xl bg-emerald-600 p-4 text-white shadow-xl animate-pulse">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-lg font-bold">🚨 CHAMADO DISPONÍVEL AGORA</div>
                <div className="text-sm opacity-90">
                  Clique para aceitar imediatamente
                </div>
              </div>
              <button
                onClick={aceitarPrimeiro}
                className="rounded-xl bg-white px-6 py-3 font-bold text-emerald-700 shadow"
              >
                ✅ ACEITAR O PRIMEIRO AGORA
              </button>
            </div>
          </div>
        )}

        {/* GRID */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* PERFIL */}
          <div className="rounded-2xl bg-white p-5 shadow">
            <div className="font-bold text-lg">Seu perfil</div>
            <div className="text-sm text-slate-500">{user?.email}</div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <div className="font-semibold">{prof?.nome || "—"}</div>
              <div className="text-sm text-slate-600">
                WhatsApp: {prof?.whatsapp || "—"}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm">Disponibilidade</span>
              <span className="rounded-full bg-emerald-600 px-4 py-1 text-sm font-bold text-white">
                Online
              </span>
            </div>
          </div>

          {/* CHAMADOS */}
          <div className="rounded-2xl bg-white p-5 shadow">
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-lg">
                Chamados procurando
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                {chamados.length} disponíveis
              </span>
            </div>

            {chamados.length === 0 ? (
              <div className="text-sm text-slate-500">
                Nenhum chamado no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {chamados.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-emerald-300 bg-emerald-50 p-4"
                  >
                    <div className="font-semibold">{c.servico}</div>
                    <div className="text-sm text-slate-600">
                      {c.endereco} • {c.cliente_nome}
                    </div>

                    <div className="mt-2 text-sm">
                      Total: <b>{brl(c.total)}</b>
                    </div>

                    <button
                      onClick={() => aceitarChamado(c.id)}
                      className="mt-3 w-full rounded-xl bg-slate-900 py-2 font-bold text-white"
                    >
                      Aceitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
