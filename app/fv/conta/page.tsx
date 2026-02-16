"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  user_id: string;
  nome: string | null;
  email: string | null;
  cpf: string | null;
  phone: string | null;
};

type Address = {
  id: string;
  user_id: string;
  label: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  referencia: string | null;
  is_default: boolean | null;
  created_at?: string;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

export default function ContaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [addrForm, setAddrForm] = useState<Partial<Address>>({
    label: "Casa",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    referencia: "",
    is_default: true,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setMsg(null);

        const { data } = await supabase.auth.getUser();
        const u = data?.user;
        if (!u) {
          router.replace(`/fv/entrar?next=${encodeURIComponent("/fv/conta")}`);
          return;
        }

        if (cancelled) return;
        setUserId(u.id);

        // profile
        const { data: p } = await supabase
          .from("customer_profiles")
          .select("*")
          .eq("user_id", u.id)
          .maybeSingle();

        const prof: Profile = {
          user_id: u.id,
          nome: p?.nome ?? (u.user_metadata?.name ?? null),
          email: p?.email ?? (u.email ?? null),
          cpf: p?.cpf ?? null,
          phone: p?.phone ?? null,
        };
        if (!cancelled) setProfile(prof);

        // addresses
        const { data: addrs } = await supabase
          .from("customer_addresses")
          .select("*")
          .eq("user_id", u.id)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false });

        if (!cancelled) setAddresses((addrs as any) || []);
      } catch (e: any) {
        if (!cancelled) setErr(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const defaultAddr = useMemo(() => addresses.find((a) => a.is_default) || addresses[0] || null, [addresses]);

  async function salvarPerfil() {
    setErr(null);
    setMsg(null);
    try {
      if (!userId) return;

      const payload: Profile = {
        user_id: userId,
        nome: profile?.nome || null,
        email: (profile?.email || "").toLowerCase(),
        cpf: profile?.cpf ? onlyDigits(profile.cpf).slice(0, 11) : null,
        phone: profile?.phone ? onlyDigits(profile.phone) : null,
      };

      const { error } = await supabase.from("customer_profiles").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;

      setMsg("Perfil salvo.");
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  async function salvarEndereco() {
    setErr(null);
    setMsg(null);
    try {
      if (!userId) return;

      // se for default, zera os outros
      if (addrForm.is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("user_id", userId);
      }

      const payload = {
        user_id: userId,
        label: addrForm.label || "Endereço",
        cep: addrForm.cep || null,
        rua: addrForm.rua || null,
        numero: addrForm.numero || null,
        complemento: addrForm.complemento || null,
        bairro: addrForm.bairro || null,
        cidade: addrForm.cidade || null,
        uf: addrForm.uf || null,
        referencia: addrForm.referencia || null,
        is_default: !!addrForm.is_default,
      };

      const { error } = await supabase.from("customer_addresses").insert(payload);
      if (error) throw error;

      const { data: addrs } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      setAddresses((addrs as any) || []);
      setMsg("Endereço salvo.");
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  async function setDefaultAddress(id: string) {
    setErr(null);
    setMsg(null);
    try {
      if (!userId) return;

      await supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", userId);
      await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id);

      const { data: addrs } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      setAddresses((addrs as any) || []);
      setMsg("Endereço padrão atualizado.");
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  async function removerAddress(id: string) {
    setErr(null);
    setMsg(null);
    try {
      if (!userId) return;

      await supabase.from("customer_addresses").delete().eq("id", id);

      const { data: addrs } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      setAddresses((addrs as any) || []);
      setMsg("Endereço removido.");
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    router.replace("/fv");
  }

  if (loading) return <div className="p-6">Carregando…</div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">Minha conta</h1>
          <div className="flex gap-2">
            <Link className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50" href="/fv/conta/pedidos">
              Meus pedidos
            </Link>
            <button className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50" onClick={sair}>
              Sair
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-wrap">
            {err}
          </div>
        ) : null}

        {msg ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 whitespace-pre-wrap">
            {msg}
          </div>
        ) : null}

        {/* PERFIL */}
        <section className="mt-6 rounded-2xl border bg-white p-4">
          <div className="text-sm font-extrabold">Dados do cliente</div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-bold opacity-70">Nome</div>
              <input
                value={profile?.nome || ""}
                onChange={(e) => setProfile((p) => ({ ...(p as any), nome: e.target.value }))}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-bold opacity-70">E-mail</div>
              <input
                value={profile?.email || ""}
                onChange={(e) => setProfile((p) => ({ ...(p as any), email: e.target.value }))}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-bold opacity-70">CPF</div>
              <input
                value={profile?.cpf || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...(p as any), cpf: onlyDigits(e.target.value).slice(0, 11) }))
                }
                inputMode="numeric"
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-bold opacity-70">WhatsApp</div>
              <input
                value={profile?.phone || ""}
                onChange={(e) => setProfile((p) => ({ ...(p as any), phone: onlyDigits(e.target.value) }))}
                inputMode="numeric"
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={salvarPerfil}
            className="mt-4 rounded-xl bg-black px-4 py-3 text-sm font-extrabold text-white"
          >
            Salvar perfil
          </button>
        </section>

        {/* ENDEREÇO PADRÃO */}
        <section className="mt-6 rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-extrabold">Endereço padrão</div>
            {defaultAddr ? (
              <span className="text-xs rounded-full bg-slate-100 px-2 py-1">Selecionado</span>
            ) : (
              <span className="text-xs rounded-full bg-amber-100 px-2 py-1 text-amber-900">Nenhum</span>
            )}
          </div>

          {defaultAddr ? (
            <div className="mt-3 rounded-xl border p-3 text-sm">
              <div className="font-semibold">{defaultAddr.label || "Endereço"}</div>
              <div className="mt-1 text-slate-700">
                {defaultAddr.rua}, {defaultAddr.numero} {defaultAddr.complemento ? `- ${defaultAddr.complemento}` : ""}
              </div>
              <div className="text-slate-700">
                {defaultAddr.bairro} - {defaultAddr.cidade}/{defaultAddr.uf} • CEP {defaultAddr.cep}
              </div>
              {defaultAddr.referencia ? <div className="text-slate-600">Ref: {defaultAddr.referencia}</div> : null}
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-600">Cadastre um endereço abaixo.</div>
          )}

          <div className="mt-4 text-sm font-extrabold">Cadastrar novo endereço</div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-bold opacity-70">Label</div>
              <input
                value={addrForm.label || ""}
                onChange={(e) => setAddrForm((s) => ({ ...s, label: e.target.value }))}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                placeholder="Casa / Trabalho"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-bold opacity-70">CEP</div>
              <input
                value={addrForm.cep || ""}
                onChange={(e) => setAddrForm((s) => ({ ...s, cep: onlyDigits(e.target.value).slice(0, 8) }))}
                inputMode="numeric"
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                placeholder="00000000"
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-1 text-xs font-bold opacity-70">Rua</div>
              <input
                value={addrForm.rua || ""}
                onChange={(e) => setAddrForm((s) => ({ ...s, rua: e.target.value }))}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-bold opacity-70">Número</div>
              <input
                value={addrForm.numero || ""}
                onChange={(e) => setAddrForm((s) => ({ ...s, numero: e.target.value }))}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-bold opacity-70">Complemento</div>
              <input
                value={addrForm.complemento || ""}
                onChange={(e) => setAddrForm((s) => ({ ...s, complemento: e.target.value }))}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-bold opacity-70">Bairro</div>
              <input
                value={addrForm.bairro || ""}
                onChange={(e) => setAddrForm((s) => ({ ...s, bairro: e.target.value }))}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-bold opacity-70">Cidade</div>
              <input
                value={addrForm.cidade || ""}
                onChange={(e) => setAddrForm((s) => ({ ...s, cidade: e.target.value }))}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-bold opacity-70">UF</div>
              <input
                value={addrForm.uf || ""}
                onChange={(e) => setAddrForm((s) => ({ ...s, uf: e.target.value.toUpperCase().slice(0, 2) }))}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                placeholder="SP"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-bold opacity-70">Referência</div>
              <input
                value={addrForm.referencia || ""}
                onChange={(e) => setAddrForm((s) => ({ ...s, referencia: e.target.value }))}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!addrForm.is_default}
                onChange={(e) => setAddrForm((s) => ({ ...s, is_default: e.target.checked }))}
              />
              Definir como padrão
            </label>
          </div>

          <button
            type="button"
            onClick={salvarEndereco}
            className="mt-4 rounded-xl bg-black px-4 py-3 text-sm font-extrabold text-white"
          >
            Salvar endereço
          </button>
        </section>

        {/* LISTA ENDEREÇOS */}
        <section className="mt-6 rounded-2xl border bg-white p-4">
          <div className="text-sm font-extrabold">Meus endereços</div>

          {addresses.length === 0 ? (
            <div className="mt-3 text-sm text-slate-600">Nenhum endereço cadastrado.</div>
          ) : (
            <div className="mt-3 grid gap-3">
              {addresses.map((a) => (
                <div key={a.id} className="rounded-xl border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">
                      {a.label || "Endereço"}{" "}
                      {a.is_default ? <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs">Padrão</span> : null}
                    </div>
                    <div className="flex gap-2">
                      {!a.is_default ? (
                        <button className="rounded-lg border px-3 py-1 text-xs font-semibold hover:bg-slate-50" onClick={() => setDefaultAddress(a.id)}>
                          Tornar padrão
                        </button>
                      ) : null}
                      <button className="rounded-lg border px-3 py-1 text-xs font-semibold hover:bg-slate-50" onClick={() => removerAddress(a.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-slate-700">
                    {a.rua}, {a.numero} {a.complemento ? `- ${a.complemento}` : ""}
                  </div>
                  <div className="text-slate-700">
                    {a.bairro} - {a.cidade}/{a.uf} • CEP {a.cep}
                  </div>
                  {a.referencia ? <div className="text-slate-600">Ref: {a.referencia}</div> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
