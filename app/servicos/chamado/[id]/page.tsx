"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

  // ✅ Se você já tiver GPS no chamado, deixe estes campos na tabela e no select:
  profissional_lat?: number | null;
  profissional_lng?: number | null;
  gps_updated_at?: string | null;
};

function normStatus(raw: any) {
  const s = String(raw || "").trim();
  const up = s.toUpperCase();

  // aceita variações antigas/novas
  if (up === "SOLICITADO" || s === "procurando" || s === "PROCURANDO") return "SOLICITADO";
  if (up === "ACEITO" || s === "aceito") return "ACEITO";

  // A CAMINHO
  if (up === "A_CAMINHO" || up === "EM_ANDAMENTO" || s === "em_andamento") return "A_CAMINHO";

  // CHEGOU
  if (up === "CHEGOU" || s === "cheguei" || up === "CHEGUEI") return "CHEGOU";

  if (up === "FINALIZADO" || s === "finalizado") return "FINALIZADO";
  if (up === "CANCELADO" || s === "cancelado") return "CANCELADO";

  // fallback
  return up || s || "";
}

export default function ChamadoClientePage() {
  const params = useParams();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [errMsg, setErrMsg] = useState<string>("");

  const channelRef = useRef<any>(null);
  const lastLoadRef = useRef<number>(0);

  const st = useMemo(() => normStatus(chamado?.status), [chamado?.status]);

  const statusLabel = useMemo(() => {
    if (!st) return "Atualizando status…";
    if (st === "SOLICITADO") return "Procurando profissional disponível…";
    if (st === "ACEITO") return "Profissional encontrado ✅";
    if (st === "A_CAMINHO") return "Profissional a caminho 🚗";
    if (st === "CHEGOU") return "Profissional chegou 📍";
    if (st === "FINALIZADO") return "Atendimento finalizado ✅";
    if (st === "CANCELADO") return "Chamado cancelado ❌";
    return `Status: ${String(chamado?.status || st)}`;
  }, [st, chamado?.status]);

  const statusPill = useMemo(() => {
    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";

    if (st === "SOLICITADO") return `${base} bg-slate-50 text-slate-700 border-slate-200`;
    if (st === "ACEITO") return `${base} bg-emerald-50 text-emerald-800 border-emerald-200`;
    if (st === "A_CAMINHO") return `${base} bg-blue-50 text-blue-800 border-blue-200`;
    if (st === "CHEGOU") return `${base} bg-violet-50 text-violet-800 border-violet-200`;
    if (st === "FINALIZADO") return `${base} bg-emerald-50 text-emerald-800 border-emerald-200`;
    if (st === "CANCELADO") return `${base} bg-rose-50 text-rose-800 border-rose-200`;
    return `${base} bg-slate-50 text-slate-700 border-slate-200`;
  }, [st]);

  async function load() {
    if (!id) return;

    // evita spam de load em cascata (realtime + interval)
    const now = Date.now();
    if (now - lastLoadRef.current < 600) return;
    lastLoadRef.current = now;

    setErrMsg("");
    setLoading(true);

    const { data, error } = await supabase
      .from("chamados")
      .select(
        [
          "id",
          "created_at",
          "status",
          "servico",
          "cliente_nome",
          "cliente_whatsapp",
          "endereco",
          "observacoes",
          "preco_servico",
          "taxa_locomocao",
          "total",
          "profissional_id",
          "profissional_nome",
          "profissional_uid",
          // ✅ se existir no banco, descomenta:
          // "profissional_lat",
          // "profissional_lng",
          // "gps_updated_at",
        ].join(",")
      )
      .eq("id", id)
      .maybeSingle();

    setLoading(false);

    if (error || !data) {
      console.error("Erro load chamado:", error);
      setChamado(null);
      setErrMsg("Não consegui carregar este chamado. (Verifique se ele existe e se está público)");
      return;
    }

    setChamado(data as any);
  }

  useEffect(() => {
    // limpa canal anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    load();

    // realtime
    const ch = supabase
      .channel(`realtime-chamado-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chamados" }, (payload) => {
        const rowId = (payload as any)?.new?.id || (payload as any)?.old?.id || "";
        if (String(rowId) === String(id)) load();
      })
      .subscribe((status) => {
        // se realtime cair, o polling segura
        // console.log("Realtime status:", status);
      });

    channelRef.current = ch;

    // fallback polling
    const t = setInterval(() => load(), 2500);

    return () => {
      clearInterval(t);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-xl font-extrabold text-slate-900">{statusLabel}</div>
                <span className={statusPill}>{st || "—"}</span>
              </div>

              <div className="mt-2 text-sm text-slate-600">
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

          {loading ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Atualizando…
            </div>
          ) : errMsg ? (
            <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{errMsg}</div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-bold text-slate-900">Dados do cliente</div>
                  <div className="mt-2 text-sm text-slate-700">
                    <div>Nome: {chamado?.cliente_nome || "—"}</div>
                    <div>Endereço: {chamado?.endereco || "—"}</div>
                    <div>Obs: {chamado?.observacoes || "—"}</div>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-bold text-slate-900">Profissional</div>
                  <div className="mt-2 text-sm text-slate-700">
                    {chamado?.profissional_nome ? (
                      <div className="font-semibold text-emerald-700">{chamado.profissional_nome}</div>
                    ) : (
                      <div className="text-slate-500">Aguardando alguém aceitar…</div>
                    )}
                    <div className="mt-2 text-xs text-slate-500">
                      Não feche esta tela — ela atualiza automaticamente.
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ MAPA (somente se você já salvar lat/lng do profissional no chamado)
              {!!chamado?.profissional_lat && !!chamado?.profissional_lng && (
                <div className="mt-6 rounded-2xl border overflow-hidden">
                  <div className="border-b p-3 text-sm font-medium">Acompanhamento no mapa</div>
                  <div className="h-[360px] w-full">
                    <ChamadoMapa
                      profissional={{ lat: chamado.profissional_lat, lng: chamado.profissional_lng }}
                      destinoText={chamado.endereco || ""}
                    />
                  </div>
                </div>
              )} */}
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
