"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

const WHATS_CENTRAL = "5511952068432";
const wpp = (text: string) => `https://wa.me/${WHATS_CENTRAL}?text=${encodeURIComponent(text)}`;

type Atendimento = {
  id: string;
  created_at: string;
  protocolo: string;
  status: "novo" | "em_atendimento" | "finalizado" | "cancelado";
  cliente_nome: string;
  cliente_whatsapp: string;
  motivo: string;
  mensagem: string;
  anexo_url: string | null;
  anexo_path: string | null;
};

const STATUS_OPTS: Atendimento["status"][] = ["novo", "em_atendimento", "finalizado", "cancelado"];

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR");
}

export default function CentralBalcaoClient() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Atendimento[]>([]);
  const [status, setStatus] = useState<Atendimento["status"] | "todos">("novo");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("balcao_atendimentos")
      .select("id,created_at,protocolo,status,cliente_nome,cliente_whatsapp,motivo,mensagem,anexo_url,anexo_path")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) console.error(error);
    setItems((data || []) as Atendimento[]);
    setLoading(false);
  }

  useEffect(() => {
    load();

    // realtime: INSERT + UPDATE
    const channel = supabase
      .channel("balcao_atendimentos_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "balcao_atendimentos" },
        () => {
          // recarrega (MVP robusto)
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((it) => {
      const okStatus = status === "todos" ? true : it.status === status;
      if (!okStatus) return false;
      if (!qq) return true;

      const hay = [
        it.protocolo,
        it.cliente_nome,
        it.cliente_whatsapp,
        it.motivo,
        it.mensagem,
        it.status,
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(qq);
    });
  }, [items, status, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: items.length };
    for (const s of STATUS_OPTS) c[s] = items.filter((x) => x.status === s).length;
    return c;
  }, [items]);

  async function setStatusItem(id: string, newStatus: Atendimento["status"]) {
    const { error } = await supabase.from("balcao_atendimentos").update({ status: newStatus }).eq("id", id);
    if (error) {
      console.error(error);
      alert("Erro ao atualizar status.");
    }
  }

  function abrirWhats(it: Atendimento) {
    const anexoTxt = it.anexo_url ? `\n📎 Anexo: ${it.anexo_url}` : "";
    const msg = `Central IA Drogarias - Balcão Virtual
🧾 Protocolo: ${it.protocolo}
👤 Cliente: ${it.cliente_nome}
📱 WhatsApp: ${it.cliente_whatsapp}
🧩 Motivo: ${it.motivo}
📝 Mensagem: ${it.mensagem}${anexoTxt}`;

    window.open(wpp(msg), "_blank");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold tracking-tight text-slate-900">IA Drogarias</div>
          <div className="text-xs text-slate-500">Painel • Balcão Virtual</div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-bold text-slate-900">Fila de atendimentos</div>
              <div className="text-xs text-slate-500">
                Atualiza em tempo real (novos/alterações).
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por protocolo, nome, WhatsApp…"
                className="w-full sm:w-[360px] rounded-2xl border px-3 py-2 text-sm outline-none focus:border-slate-900"
              />

              <button
                onClick={load}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Recarregar
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setStatus("todos")}
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold",
                status === "todos" ? "border-slate-900 bg-slate-900 text-white" : "bg-white text-slate-700",
              ].join(" ")}
            >
              Todos ({counts.todos || 0})
            </button>

            {STATUS_OPTS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  status === s ? "border-slate-900 bg-slate-900 text-white" : "bg-white text-slate-700",
                ].join(" ")}
              >
                {s.replace("_", " ")} ({counts[s] || 0})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="p-4 text-sm text-slate-600">Carregando atendimentos…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">
              Nenhum atendimento encontrado.
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((it) => (
                <div key={it.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{it.protocolo}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          {it.status.replace("_", " ")}
                        </span>
                        <span className="text-[11px] text-slate-500">{fmtDateTime(it.created_at)}</span>
                      </div>

                      <div className="mt-2 text-sm text-slate-900">
                        <b>{it.cliente_nome}</b>{" "}
                        <span className="text-slate-500">•</span>{" "}
                        <span className="font-semibold">{it.cliente_whatsapp}</span>
                      </div>

                      <div className="mt-1 text-sm text-slate-700">
                        <span className="font-semibold">Motivo:</span> {it.motivo}
                      </div>

                      <div className="mt-2 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
                        {it.mensagem}
                      </div>

                      {it.anexo_url ? (
                        <div className="mt-3 rounded-xl border bg-white p-3">
                          <div className="text-xs font-semibold text-slate-700">Anexo</div>
                          <a
                            href={it.anexo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs font-semibold text-emerald-700 underline"
                          >
                            Abrir anexo em nova aba
                          </a>

                          {/* se for imagem, mostra preview simples */}
                          {/\.(jpg|jpeg|png|webp)$/i.test(it.anexo_url) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={it.anexo_url}
                              alt="Anexo"
                              className="mt-2 w-full max-h-[360px] rounded-xl border object-contain"
                            />
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 md:w-[260px]">
                      <button
                        onClick={() => abrirWhats(it)}
                        className="w-full rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                      >
                        Abrir WhatsApp
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setStatusItem(it.id, "em_atendimento")}
                          className="rounded-2xl border bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          Assumir
                        </button>
                        <button
                          onClick={() => setStatusItem(it.id, "finalizado")}
                          className="rounded-2xl border bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          Finalizar
                        </button>
                        <button
                          onClick={() => setStatusItem(it.id, "cancelado")}
                          className="rounded-2xl border bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => setStatusItem(it.id, "novo")}
                          className="rounded-2xl border bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          Voltar p/ novo
                        </button>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3 text-[11px] text-slate-600">
                        Dica: clique em <b>Assumir</b> quando começar e <b>Finalizar</b> ao concluir.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
