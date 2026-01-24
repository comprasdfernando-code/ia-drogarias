"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Chamado = {
  id: string;
  status: string;
  servico: string;
  cliente_nome: string | null;
  cliente_whatsapp: string | null;
  endereco: string | null;
  observacoes: string | null;
  preco_servico: number;
  taxa_locomocao: number;
  total: number;
  profissional_nome: string | null;
};

export default function ChamadoStatusPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [chamado, setChamado] = useState<Chamado | null>(null);

  const statusLabel = useMemo(() => {
    const s = chamado?.status;
    if (s === "procurando") return { t: "Procurando profissional disponível…", c: "text-slate-900" };
    if (s === "aceito") return { t: "Profissional encontrado ✅", c: "text-emerald-700" };
    if (s === "cancelado") return { t: "Chamado cancelado", c: "text-rose-700" };
    if (s === "concluido") return { t: "Concluído", c: "text-slate-700" };
    return { t: s || "—", c: "text-slate-700" };
  }, [chamado?.status]);

  useEffect(() => {
    if (!id) return;

    let sub: any;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("chamados")
        .select("id,status,servico,cliente_nome,cliente_whatsapp,endereco,observacoes,preco_servico,taxa_locomocao,total,profissional_nome")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        console.error(error);
        setChamado(null);
        setLoading(false);
        return;
      }

      setChamado({
        ...data,
        preco_servico: Number((data as any).preco_servico ?? 0),
        taxa_locomocao: Number((data as any).taxa_locomocao ?? 0),
        total: Number((data as any).total ?? 0),
      } as any);
      setLoading(false);

      sub = supabase
        .channel(`chamado-${id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "chamados", filter: `id=eq.${id}` },
          (payload) => {
            const n = payload.new as any;
            setChamado((prev) => ({
              ...(prev || ({} as any)),
              ...n,
              preco_servico: Number(n.preco_servico ?? 0),
              taxa_locomocao: Number(n.taxa_locomocao ?? 0),
              total: Number(n.total ?? 0),
            }));
          }
        )
        .subscribe();
    }

    load();

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [id]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">IA Drogarias</div>
          <div className="text-xs text-slate-500">Status do chamado</div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          {loading ? (
            <div className="text-sm text-slate-500">Carregando chamado…</div>
          ) : !chamado ? (
            <div className="text-sm text-rose-600">Chamado não encontrado.</div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className={`text-xl font-bold ${statusLabel.c}`}>{statusLabel.t}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Serviço: <b>{chamado.servico}</b>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">ID: {chamado.id}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-slate-500">Total</span>
                    <span className="text-base font-bold text-slate-900">{formatBRL(Number(chamado.total ?? 0))}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Serviço {formatBRL(Number(chamado.preco_servico ?? 0))} + Locomoção {formatBRL(Number(chamado.taxa_locomocao ?? 0))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-semibold text-slate-900">Dados do cliente</div>
                  <div className="mt-2 text-sm text-slate-700">
                    <div><span className="text-slate-500">Nome:</span> {chamado.cliente_nome || "—"}</div>
                    <div><span className="text-slate-500">Endereço:</span> {chamado.endereco || "—"}</div>
                    <div><span className="text-slate-500">Obs:</span> {chamado.observacoes || "—"}</div>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-semibold text-slate-900">Profissional</div>
                  <div className="mt-2 text-sm text-slate-700">
                    {chamado.status === "aceito" ? (
                      <div className="text-emerald-700 font-semibold">
                        {chamado.profissional_nome || "Profissional aceitou"}
                      </div>
                    ) : (
                      <div className="text-slate-500">Aguardando alguém aceitar…</div>
                    )}
                  </div>

                  {chamado.status === "procurando" ? (
                    <div className="mt-3 text-xs text-slate-500">
                      Não feche esta tela — ela atualiza automaticamente.
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
