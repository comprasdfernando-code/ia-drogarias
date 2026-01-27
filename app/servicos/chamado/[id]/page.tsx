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
};

export default function ChamadoClientePage() {
  const params = useParams();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [errMsg, setErrMsg] = useState<string>("");

  const channelRef = useRef<any>(null);

  const statusLabel = useMemo(() => {
    const st = String(chamado?.status || "");
    if (!st) return "Carregando…";
    if (st === "procurando" || st === "SOLICITADO") return "Procurando profissional disponível…";
    if (st === "aceito") return "Profissional encontrado ✅";
    if (st === "em_andamento") return "Profissional a caminho 🚗";
    if (st === "cheguei") return "Profissional chegou 📍";
    if (st === "finalizado") return "Atendimento finalizado ✅";
    return `Status: ${st}`;
  }, [chamado?.status]);

  async function load() {
    if (!id) return;
    setLoading(true);
    setErrMsg("");

    const { data, error } = await supabase
      .from("chamados")
      .select(
        "id,created_at,status,servico,cliente_nome,cliente_whatsapp,endereco,observacoes,preco_servico,taxa_locomocao,total,profissional_id,profissional_nome,profissional_uid"
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
    // limpa
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    load();

    // realtime (escuta mudanças na tabela e recarrega quando mexer no meu ID)
    const ch = supabase
      .channel(`realtime-chamado-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chamados" }, (payload) => {
        const rowId =
          (payload as any)?.new?.id ||
          (payload as any)?.old?.id ||
          "";

        if (String(rowId) === String(id)) load();
      })
      .subscribe();

    channelRef.current = ch;

    // fallback polling (se realtime falhar)
    const t = setInterval(() => {
      load();
    }, 3000);

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
              <div className="text-xl font-extrabold text-slate-900">{statusLabel}</div>
              <div className="mt-1 text-sm text-slate-600">
                Serviço: <b>{chamado?.servico || "—"}</b>
              </div>
              <div className="mt-1 text-xs text-slate-400">ID: {id}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-right">
              <div className="text-xs text-slate-500">Total</div>
              <div className="text-lg font-extrabold text-slate-900">{brl(Number(chamado?.total || 0))}</div>
              <div className="text-xs text-slate-500">
                Serviço {brl(Number(chamado?.preco_servico || 0))} + Locomoção {brl(Number(chamado?.taxa_locomocao || 0))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Carregando…</div>
          ) : errMsg ? (
            <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{errMsg}</div>
          ) : (
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
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            IA Drogarias • Status do chamado em tempo real
          </div>
        </div>
      </div>
    </main>
  );
}
