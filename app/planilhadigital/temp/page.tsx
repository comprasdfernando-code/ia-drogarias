"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLoja } from "./_components/LojaProvider";

type Ultima = {
  local_id: string;
  local_nome: string;
  tipo: string;
  temp_min: number;
  temp_max: number;
  lida_em: string | null;
  temp_c: number | null;
  umid_pct: number | null;
  status: "ok" | "atencao" | "fora" | null;
};

export default function TempDashboard() {
  const { lojaId, loading: lojaLoading } = useLoja();
  const [ultimas, setUltimas] = useState<Ultima[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!lojaId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("temp_ultimas_por_local")
      .select("*")
      .eq("loja_id", lojaId)
      .order("local_nome");

    if (error) {
      console.error(error);
      setUltimas([]);
      setLoading(false);
      return;
    }

    setUltimas((data || []) as any);
    setLoading(false);
  }

  useEffect(() => {
    if (lojaLoading) return;
    load();

    const channel = supabase
      .channel("rt-temp")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "temp_leituras" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId, lojaLoading]);

  if (lojaLoading) return <div className="p-4">Carregando…</div>;

  return (
    <div className="p-2">
      <h1 className="text-xl font-semibold">Temperatura — Dashboard</h1>

      {loading ? (
        <p className="mt-4">Carregando…</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {ultimas.map((u) => (
            <div key={u.local_id} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{u.local_nome}</div>
                  <div className="text-xs opacity-70">
                    {u.tipo} • Padrão {u.temp_min}–{u.temp_max}°C
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  {u.status ? u.status.toUpperCase() : "—"}
                </div>
              </div>

              <div className="mt-3 text-sm">
                <div>Temp: <b>{u.temp_c ?? "—"}</b> °C</div>
                <div>Umid: <b>{u.umid_pct ?? "—"}</b> %</div>
                <div className="text-xs opacity-70 mt-1">
                  Última: {u.lida_em ? new Date(u.lida_em).toLocaleString("pt-BR") : "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}