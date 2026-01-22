"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Store,
  Building2,
  BadgeCheck,
  Phone,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ClipboardList,
} from "lucide-react";

function cx(...s: Array<string | false | undefined | null>) {
  return s.filter(Boolean).join(" ");
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function formatCNPJ(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(
    8,
    12
  )}-${d.slice(12)}`;
}

function formatWhats(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const WHATS_COMERCIAL = "5511952068432"; // seu número

export default function CadastroDrogariasPage() {
  const [form, setForm] = useState({
    fantasia: "",
    cnpj: "",
    responsavel: "",
    telefone: "",
    cidade: "",
    bairro: "",
  });

  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.fantasia.trim().length >= 2 &&
      onlyDigits(form.cnpj).length === 14 &&
      form.responsavel.trim().length >= 3 &&
      onlyDigits(form.telefone).length >= 10 &&
      form.cidade.trim().length >= 2 &&
      form.bairro.trim().length >= 2
    );
  }, [form]);

  function handleChange(e: any) {
    const { name, value } = e.target;

    if (name === "cnpj") return setForm((p) => ({ ...p, cnpj: formatCNPJ(value) }));
    if (name === "telefone") return setForm((p) => ({ ...p, telefone: formatWhats(value) }));

    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      const mensagem = `
🏪 *Cadastro de Drogaria Parceira — IA Drogarias (FV + Serviços)*

📌 Nome Fantasia: ${form.fantasia}
🧾 CNPJ: ${form.cnpj}
👤 Responsável: ${form.responsavel}
📞 Telefone/Whats: ${form.telefone}
📍 Cidade: ${form.cidade}
🏘️ Bairro: ${form.bairro}

✅ Interesse: Marketplace de Medicamentos + Agendamentos de Serviços
`;

      const msg = encodeURIComponent(mensagem.trim());
      window.open(`https://wa.me/${WHATS_COMERCIAL}?text=${msg}`, "_blank");

      setForm({
        fantasia: "",
        cnpj: "",
        responsavel: "",
        telefone: "",
        cidade: "",
        bairro: "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.16),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_42%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.10),transparent_45%)]" />
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-10 relative">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Left */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 backdrop-blur px-4 py-2 text-sm text-slate-700 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Drogaria Parceira
                <span className="mx-1 text-slate-300">•</span>
                <Sparkles className="w-4 h-4 text-blue-700" />
                FV + Serviços
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                Cadastro de <span className="text-blue-700">Drogarias</span>
              </h1>
              <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
                Entre como parceira no ecossistema IA Drogarias:{" "}
                <b>vendas no marketplace</b> (Farmácia Virtual) +{" "}
                <b>agendamentos de serviços</b>. Mais clientes, mais receita, mais recorrência.
              </p>

              <div className="mt-6 grid sm:grid-cols-3 gap-3">
                {[
                  { icon: ClipboardList, t: "Pedidos no painel", d: "organização e fluxo" },
                  { icon: BadgeCheck, t: "Mais recorrência", d: "cliente volta mais" },
                  { icon: Store, t: "Marketplace FV", d: "vendas digitais" },
                ].map((b, i) => (
                  <div key={i} className="rounded-2xl border bg-white/70 backdrop-blur p-4 shadow-sm">
                    <b.icon className="w-5 h-5 text-slate-900" />
                    <div className="mt-2 font-extrabold text-slate-900 text-sm">{b.t}</div>
                    <div className="text-slate-600 text-xs">{b.d}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3 text-sm">
                <Link
                  href="/fv"
                  className="inline-flex items-center gap-2 font-extrabold text-slate-900 hover:text-blue-700 transition"
                >
                  Ver Farmácia Virtual (FV)
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  href="/servicos"
                  className="inline-flex items-center gap-2 font-extrabold text-slate-900 hover:text-emerald-700 transition"
                >
                  Ver Serviços
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Form card */}
            <div className="w-full max-w-md">
              <div className="rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-slate-900">Cadastrar agora</h2>
                  <span className="text-xs text-slate-500">WhatsApp</span>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  <Field label="Nome fantasia" name="fantasia" value={form.fantasia} onChange={handleChange} Icon={Store} />
                  <Field label="CNPJ" name="cnpj" value={form.cnpj} onChange={handleChange} Icon={Building2} placeholder="00.000.000/0000-00" />
                  <Field label="Responsável" name="responsavel" value={form.responsavel} onChange={handleChange} Icon={BadgeCheck} />
                  <Field label="Telefone / WhatsApp" name="telefone" value={form.telefone} onChange={handleChange} Icon={Phone} placeholder="(11) 90000-0000" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Cidade" name="cidade" value={form.cidade} onChange={handleChange} Icon={MapPin} />
                    <Field label="Bairro" name="bairro" value={form.bairro} onChange={handleChange} Icon={MapPin} />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className={cx(
                      "w-full rounded-2xl px-4 py-3 font-extrabold text-white shadow-md transition inline-flex items-center justify-center gap-2",
                      loading || !canSubmit
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:opacity-95"
                    )}
                  >
                    {loading ? "Abrindo WhatsApp..." : "Confirmar Cadastro"}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-slate-500 text-center pt-1">
                    Você será direcionado ao WhatsApp com os dados preenchidos.
                  </p>
                </form>
              </div>

              <div className="mt-4 text-center text-xs text-slate-500">
                IA Drogarias — Conectando negócios
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  Icon,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: any) => void;
  placeholder?: string;
  type?: string;
  Icon: any;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <div className="mt-1 relative">
        <Icon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full rounded-2xl border bg-white px-11 py-3 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
        />
      </div>
    </label>
  );
}
