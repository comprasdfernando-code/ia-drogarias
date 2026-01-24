"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Prof = {
  id: string;
  nome: string | null;
  whatsapp: string | null;
  online: boolean | null;
  updated_at?: string | null;
};

type Chamado = {
  id: string;
  created_at: string | null;
  status: string | null;

  servico: string | null;
  cliente_nome: string | null;
  cliente_whatsapp: string | null;
  endereco: string | null;

  preco_servico: number | null;
  taxa_locomocao: number | null;
  total: number | null;

  profissional_uid: string | null;
  profissional_nome: string | null;
};

function fmt(n: number | null | undefined) {
  return Number(n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminOperacaoPage() {
  const [loading, setLoading] = useState(true);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [tab, setTab] = useState<"procurando" | "aceito" | "em_andamento" | "finalizado" | "cancelado">("procurando");

  async function loadAll() {
    setLoading(true);

    // profissionais: ajuste o nome da tabela conforme seu banco (ex: "profissionais")
    const p = await supabase
      .from("profissionais")
      .select("id,nome,whatsapp,online,updated_at")
      .order("online", { ascending: false })
      .order("nome", { ascending: true });

    if (p.error) console.error(p.error);
    setProfs((p.data as any) ?? []);

    // chamados
    const c = await supabase
      .from("chamados")
      .select("id,created_at,status,servico,cliente_nome,cliente_whatsapp,endereco,preco_servico,taxa_locomocao,total,profissional_uid,profissional_nome")
      .order("created_at", { ascending: false })
      .limit(200);

    if (c.error) console.error(c.error);
    setChamados((c.data as any) ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();

    // realtime (se tiver habilitado)
    const channel = supabase
      .channel("admin-operacao")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chamados" },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profissionais" },
        () => loadAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const chamadosTab = useMemo(() => {
    return chamados.filter((c) => (c.status ?? "") === tab);
  }, [chamados, tab]);

  async function setStatus(chamadoId: string, status: Chamado["status"]) {
    const { error } = await supabase.from("chamados").update({ status }).eq("id", chamadoId);
    if (error) {
      alert("Erro ao atualizar status (RLS?).");
      console.error(error);
    } else {
      setChamados((prev) => prev.map((c) => (c.id === chamadoId ? { ...c, status } : c)));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Admin • Operação</h1>
            <p className="text-sm text-slate-600">Online + acompanhamento de chamados.</p>
          </div>
          <button
            onClick={loadAll}
            className="px-4 py-2 rounded-lg bg-white border text-slate-800 font-semibold"
          >
            Atualizar
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* PROFISSIONAIS */}
          <div className="bg-white border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-bold text-slate-900">Profissionais</div>
              <div className="text-sm text-slate-600">{loading ? "..." : profs.length}</div>
            </div>

            <div className="divide-y">
              {profs.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-slate-900">{p.nome ?? "—"}</div>
                    <div className="text-sm text-slate-600">
                      {p.whatsapp ? `WhatsApp: ${p.whatsapp}` : "—"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "px-3 py-1 rounded-full text-xs font-bold",
                        p.online ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {p.online ? "ONLINE" : "OFF"}
                    </span>
                  </div>
                </div>
              ))}
              {profs.length === 0 && !loading ? (
                <div className="p-6 text-slate-600">Nenhum profissional encontrado.</div>
              ) : null}
            </div>
          </div>

          {/* CHAMADOS */}
          <div className="bg-white border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b">
              <div className="font-bold text-slate-900">Chamados</div>

              <div className="mt-2 flex flex-wrap gap-2">
                {(["procurando","aceito","em_andamento","finalizado","cancelado"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-bold border",
                      tab === k ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700",
                    ].join(" ")}
                  >
                    {k.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-slate-600">Carregando chamados...</div>
            ) : chamadosTab.length === 0 ? (
              <div className="p-6 text-slate-600">Nenhum chamado neste status.</div>
            ) : (
              <div className="divide-y">
                {chamadosTab.map((c) => (
                  <div key={c.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-slate-900">{c.servico ?? "—"}</div>
                        <div className="text-sm text-slate-600">
                          {c.cliente_nome ?? "—"} • {c.cliente_whatsapp ?? "—"}
                        </div>
                        {c.endereco ? (
                          <div className="text-sm text-slate-600">{c.endereco}</div>
                        ) : null}
                        <div className="text-xs text-slate-500 mt-1">
                          Profissional: {c.profissional_nome ?? "—"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500">Total</div>
                        <div className="font-extrabold text-slate-900">{fmt(c.total)}</div>
                        <div className="text-xs text-slate-500">
                          {fmt(c.preco_servico)} + {fmt(c.taxa_locomocao)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setStatus(c.id, "em_andamento")}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold"
                      >
                        Em andamento
                      </button>
                      <button
                        onClick={() => setStatus(c.id, "finalizado")}
                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold"
                      >
                        Finalizar
                      </button>
                      <button
                        onClick={() => setStatus(c.id, "cancelado")}
                        className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold"
                      >
                        Cancelar
                      </button>
                      <a
                        className="px-3 py-2 rounded-lg bg-slate-100 border text-slate-800 text-sm font-bold"
                        href={`/servicos/chamado/${c.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir detalhes
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Se aparecer 403/42501 aqui, é **RLS**. O ideal é aplicar a mesma lógica de <code>admin_users</code> também em <code>chamados</code> e <code>profissionais</code>.
        </div>
      </div>
    </div>
  );
}
