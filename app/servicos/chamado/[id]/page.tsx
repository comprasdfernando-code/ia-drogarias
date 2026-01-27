"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   HELPERS
========================= */
function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/* =========================
   MAPA (dynamic / sem SSR)
========================= */
const ChamadoMapa = dynamic(() => import("./_components/ChamadoMapa"), {
  ssr: false,
});

/* =========================
   TYPES
========================= */
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
  profissional_uid: string | null;

  cliente_lat?: number | null;
  cliente_lng?: number | null;
  profissional_lat?: number | null;
  profissional_lng?: number | null;
};

export default function ChamadoClientePage() {
  const params = useParams();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [errMsg, setErrMsg] = useState("");

  const channelRef = useRef<any>(null);

  /* =========================
     STATUS LABEL (ENUM SAFE)
  ========================= */
  const statusLabel = useMemo(() => {
    const st = String(chamado?.status || "");

    switch (st) {
      case "SOLICITADO":
        return "Procurando profissional disponível…";
      case "ACEITO":
        return "Profissional encontrado ✅";
      case "A_CAMINHO":
        return "Profissional a caminho 🚗";
      case "CHEGOU":
        return "Profissional chegou 📍";
      case "FINALIZADO":
        return "Atendimento finalizado ✅";
      case "CANCELADO":
        return "Chamado cancelado ❌";
      default:
        return "Atualizando status…";
    }
  }, [chamado?.status]);

  /* =========================
     LOAD CHAMADO
  ========================= */
  async function load() {
    if (!id) return;

    setLoading(true);
    setErrMsg("");

    const { data, error } = await supabase
      .from("chamados")
      .select(`
        id,
        created_at,
        status,
        servico,
        cliente_nome,
        cliente_whatsapp,
        endereco,
        observacoes,
        preco_servico,
        taxa_locomocao,
        total,
        profissional_id,
        profissional_nome,
        profissional_uid,
        cliente_lat,
        cliente_lng,
        profissional_lat,
        profissional_lng
      `)
      .eq("id", id)
      .maybeSingle();

    setLoading(false);

    if (error || !data) {
      console.error("Erro load chamado:", error);
      setChamado(null);
      setErrMsg("Não consegui carregar este chamado.");
      return;
    }

    setChamado(data as Chamado);
  }

  /* =========================
     REALTIME + FALLBACK
  ========================= */
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    load();

    const ch = supabase
      .channel(`realtime-chamado-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chamados" },
        (payload) => {
          const rowId =
            (payload as any)?.new?.id ||
            (payload as any)?.old?.id ||
            "";
          if (String(rowId) === id) load();
        }
      )
      .subscribe();

    channelRef.current = ch;

    const t = setInterval(load, 3000);

    return () => {
      clearInterval(t);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* =========================
     RENDER
  ========================= */
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          {/* HEADER */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div>
              <div className="text-xl font-extrabold text-slate-900">
                {statusLabel}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Serviço: <b>{chamado?.servico || "—"}</b>
              </div>
              <div className="mt-1 text-xs text-slate-400">ID: {id}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-right">
              <div className="text-xs text-slate-500">Total</div>
              <div className="text-lg font-extrabold text-slate-900">
                {brl(Number(chamado?.total || 0))}
              </div>
              <div className="text-xs text-slate-500">
                Serviço {brl(Number(chamado?.preco_servico || 0))} + Locomoção{" "}
                {brl(Number(chamado?.taxa_locomocao || 0))}
              </div>
            </div>
          </div>

          {/* BODY */}
          {loading ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm">
              Carregando…
            </div>
          ) : errMsg ? (
            <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
              {errMsg}
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-bold">Dados do cliente</div>
                  <div className="mt-2 text-sm">
                    <div>Nome: {chamado?.cliente_nome || "—"}</div>
                    <div>Endereço: {chamado?.endereco || "—"}</div>
                    <div>Obs: {chamado?.observacoes || "—"}</div>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-bold">Profissional</div>
                  <div className="mt-2 text-sm">
                    {chamado?.profissional_nome ? (
                      <div className="font-semibold text-emerald-700">
                        {chamado.profissional_nome}
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        Aguardando alguém aceitar…
                      </div>
                    )}
                    <div className="mt-2 text-xs text-slate-500">
                      Não feche esta tela — ela atualiza automaticamente.
                    </div>
                  </div>
                </div>
              </div>

              {/* MAPA */}
              {(chamado?.cliente_lat || chamado?.profissional_lat) && (
                <div className="mt-6">
                  <ChamadoMapa
                    clienteLat={chamado?.cliente_lat}
                    clienteLng={chamado?.cliente_lng}
                    profLat={chamado?.profissional_lat}
                    profLng={chamado?.profissional_lng}
                  />
                </div>
              )}
            </>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            IA Drogarias • Status do chamado em tempo real
          </div>
        </div>
      </div>
    </main>
  );
}
