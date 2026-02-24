"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useLoja } from "../_components/LojaProvider";

type Alerta = {
  id: string;
  loja_id: string;
  local_id: string;
  leitura_id: string;
  nivel: "atencao" | "fora";
  mensagem: string;
  resolvido: boolean;
  resolvido_em: string | null;
  resolvido_por: string | null;
  created_at: string;
};

type LocalMap = Record<string, { nome: string; tipo?: string }>;

export default function TempAlertasPage() {
  const { lojaId, role, loading: lojaLoading } = useLoja();
  const canResolve = useMemo(() => ["gerente", "admin"].includes(role), [role]);

  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [locaisMap, setLocaisMap] = useState<LocalMap>({});
  const [loading, setLoading] = useState(true);
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [resolvingId, setResolvingId] = useState<string>("");

  async function loadLocaisMap() {
    if (!lojaId) return;
    const { data: locs } = await supabase
      .from("temp_locais")
      .select("id,nome,tipo")
      .eq("loja_id", lojaId);

    const map: LocalMap = {};
    (locs || []).forEach((l: any) => {
      map[l.id] = { nome: l.nome, tipo: l.tipo };
    });
    setLocaisMap(map);
  }

  async function loadAlertas() {
    if (!lojaId) return;
    setLoading(true);

    let q = supabase
      .from("temp_alertas")
      .select("id,loja_id,local_id,leitura_id,nivel,mensagem,resolvido,resolvido_em,resolvido_por,created_at")
      .eq("loja_id", lojaId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (onlyOpen) q = q.eq("resolvido", false);

    const { data, error } = await q;
    if (error) {
      console.error(error);
      setAlertas([]);
      setLoading(false);
      return;
    }

    setAlertas((data || []) as any);
    setLoading(false);
  }

  useEffect(() => {
    if (lojaLoading || !lojaId) return;
    loadLocaisMap();
    loadAlertas();

    const channel = supabase
      .channel("rt-temp-alertas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "temp_alertas" },
        () => loadAlertas()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId, lojaLoading]);

  useEffect(() => {
    if (lojaLoading || !lojaId) return;
    loadAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyOpen]);

  async function resolver(alertaId: string) {
    if (!canResolve) return;
    setResolvingId(alertaId);

    const { data: u } = await supabase.auth.getUser();
    const userId = u?.user?.id ?? null;

    const { error } = await supabase
      .from("temp_alertas")
      .update({
        resolvido: true,
        resolvido_em: new Date().toISOString(),
        resolvido_por: userId,
      })
      .eq("id", alertaId);

    setResolvingId("");
    if (error) {
      alert("Erro ao resolver: " + error.message);
      return;
    }

    await loadAlertas();
  }

  function badgeNivel(n: string) {
    const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold";
    if (n === "fora") return <span className={`${base} border-red-500/40 bg-red-500/10`}>FORA</span>;
    return <span className={`${base} border-yellow-500/40 bg-yellow-500/10`}>ATENÇÃO</span>;
  }

  if (lojaLoading) return <div className="p-4">Carregando…</div>;

  return (
    <div className="p-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Temperatura — Alertas</h1>
          <p className="text-sm opacity-70">
            {canResolve ? "Você pode resolver alertas." : "Somente gerente/admin resolve alertas (RLS)."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/planilhadigital/temp" className="rounded border px-3 py-2 text-sm hover:bg-black/5">
            Dashboard
          </Link>
          <Link href="/planilhadigital/temp/registro" className="rounded border px-3 py-2 text-sm hover:bg-black/5">
            Registrar
          </Link>
          <Link href="/planilhadigital/temp/config" className="rounded border px-3 py-2 text-sm hover:bg-black/5">
            Config
          </Link>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
          Mostrar só pendentes
        </label>

        <button onClick={() => loadAlertas()} className="rounded border px-3 py-2 text-sm hover:bg-black/5">
          Atualizar
        </button>
      </div>

      {loading ? (
        <p className="mt-4">Carregando…</p>
      ) : alertas.length === 0 ? (
        <div className="mt-6 rounded border p-4 text-sm opacity-80">
          Nenhum alerta {onlyOpen ? "pendente" : "encontrado"}.
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {alertas.map((a) => {
            const local = locaisMap[a.local_id];
            const localNome = local?.nome || a.local_id;
            const dt = new Date(a.created_at).toLocaleString("pt-BR");

            return (
              <div key={a.id} className="rounded border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {badgeNivel(a.nivel)}
                      <div className="text-sm font-semibold">
                        {localNome}
                        {local?.tipo ? <span className="opacity-70"> • {local.tipo}</span> : null}
                      </div>
                    </div>
                    <div className="text-sm">{a.mensagem}</div>
                    <div className="text-xs opacity-70">
                      Criado: {dt} • Status: <b>{a.resolvido ? "RESOLVIDO" : "PENDENTE"}</b>
                    </div>
                  </div>

                  {!a.resolvido && canResolve ? (
                    <button
                      onClick={() => resolver(a.id)}
                      disabled={resolvingId === a.id}
                      className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {resolvingId === a.id ? "Resolvendo…" : "Resolver"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}