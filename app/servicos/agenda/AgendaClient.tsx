"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function SucessoAgendamento() {
  const params = useParams<{ profissional: string }>();
  const slug = params?.profissional;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-xl px-4 py-14">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Agendamento enviado ✅</div>
          <p className="mt-2 text-sm text-slate-600">
            Seu pedido foi registrado como <b>pendente</b>. O profissional vai confirmar pelo WhatsApp.
          </p>

          <div className="mt-6 flex gap-2">
            <Link
              href={`/agendamento/${slug}`}
              className="rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Fazer outro agendamento
            </Link>
            <Link
              href="/"
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              Voltar pra home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
