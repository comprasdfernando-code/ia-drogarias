"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useLoja } from "../../temp/_components/LojaProvider";

type UsuarioLoja = {
  user_id: string;
  loja_id: string;
  role: string;
  created_at: string;
};

type Convite = {
  id: string;
  loja_id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export default function AdminUsuariosPage() {
  const { lojaId, role, loading: lojaLoading } = useLoja();
  const isAdmin = useMemo(() => role === "admin", [role]);
  const isManager = useMemo(() => ["admin", "gerente"].includes(role), [role]);

  const [membros, setMembros] = useState<UsuarioLoja[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);

  // modal simples
  const [openInvite, setOpenInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("operador");
  const [inviting, setInviting] = useState(false);

  async function load() {
    if (!lojaId) return;
    setLoading(true);

    const { data: mem, error: memErr } = await supabase
      .from("usuario_lojas")
      .select("user_id,loja_id,role,created_at")
      .eq("loja_id", lojaId)
      .order("created_at", { ascending: false });

    if (memErr) console.error(memErr);

    const { data: conv, error: convErr } = await supabase
      .from("loja_convites")
      .select("id,loja_id,email,role,status,expires_at,created_at")
      .eq("loja_id", lojaId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (convErr) console.error(convErr);

    setMembros((mem || []) as any);
    setConvites((conv || []) as any);
    setLoading(false);
  }

  useEffect(() => {
    if (lojaLoading || !lojaId) return;
    load();

    const ch1 = supabase
      .channel("rt-admin-usuario_lojas")
      .on({ event: "*", schema: "public", table: "usuario_lojas" }, () => load())
      .subscribe();

    const ch2 = supabase
      .channel("rt-admin-loja_convites")
      .on({ event: "*", schema: "public", table: "loja_convites" }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId, lojaLoading]);

  async function sendInvite() {
    if (!isManager) return;
    if (!lojaId) return;

    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes("@")) return alert("E-mail inválido.");

    setInviting(true);
    const { data, error } = await supabase.functions.invoke("invite_user_to_loja", {
      body: { loja_id: lojaId, email, role: inviteRole },
    });
    setInviting(false);

    if (error) return alert("Erro: " + error.message);
    if (data?.error) return alert("Erro: " + data.error);

    setInviteEmail("");
    setInviteRole("operador");
    setOpenInvite(false);
    await load();

    alert(
      data?.mode === "linked_existing_user"
        ? "Usuário já existia e foi vinculado à loja ✅"
        : "Convite criado ✅ (agora você pode enviar o link/token por e-mail/WhatsApp quando quiser)"
    );
  }

  async function changeRole(user_id: string, newRole: string) {
    if (!isAdmin) return alert("Somente admin pode alterar perfis.");
    const { data, error } = await supabase.functions.invoke("update_user_role", {
      body: { loja_id: lojaId, user_id, role: newRole },
    });
    if (error) return alert("Erro: " + error.message);
    if (data?.error) return alert("Erro: " + data.error);
    await load();
  }

  async function removeUser(user_id: string) {
    if (!isManager) return;
    if (!confirm("Remover acesso deste usuário à loja?")) return;

    const { data, error } = await supabase.functions.invoke("remove_user_from_loja", {
      body: { loja_id: lojaId, user_id },
    });
    if (error) return alert("Erro: " + error.message);
    if (data?.error) return alert("Erro: " + data.error);
    await load();
  }

  if (lojaLoading) return <div className="p-4">Carregando…</div>;

  if (!isManager) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold">Admin — Usuários</h1>
        <div className="mt-4 rounded border p-4 text-sm">
          Você não tem permissão para acessar esta área. (Precisa ser gerente/admin)
        </div>
        <div className="mt-4">
          <Link className="rounded border px-3 py-2 text-sm hover:bg-black/5" href="/planilhadigital/temp">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin — Usuários & Permissões</h1>
          <p className="text-sm opacity-70">
            Loja ativa: <b>{lojaId}</b> • Seu perfil: <b>{role}</b>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/planilhadigital/temp" className="rounded border px-3 py-2 text-sm hover:bg-black/5">
            Módulo Temperatura
          </Link>

          <button
            onClick={() => setOpenInvite(true)}
            className="rounded bg-black px-3 py-2 text-sm text-white"
          >
            + Convidar usuário
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4">Carregando…</p>
      ) : (
        <>
          {/* Membros */}
          <div className="mt-6">
            <div className="text-lg font-semibold">Membros da loja</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {membros.map((m) => (
                <div key={m.user_id} className="rounded border p-4">
                  <div className="text-sm">
                    <div className="font-semibold">User ID</div>
                    <div className="break-all opacity-80">{m.user_id}</div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm">
                      Perfil: <b>{m.role}</b>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <select
                          className="rounded border p-2 text-sm"
                          value={m.role}
                          onChange={(e) => changeRole(m.user_id, e.target.value)}
                        >
                          <option value="operador">operador</option>
                          <option value="gerente">gerente</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : null}

                      <button
                        onClick={() => removeUser(m.user_id)}
                        className="rounded border px-3 py-2 text-sm hover:bg-black/5"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-xs opacity-60">
                    Vinculado em: {new Date(m.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Convites */}
          <div className="mt-10">
            <div className="text-lg font-semibold">Convites</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {convites.map((c) => (
                <div key={c.id} className="rounded border p-4">
                  <div className="text-sm">
                    <div className="font-semibold">{c.email}</div>
                    <div className="opacity-80">
                      Perfil: <b>{c.role}</b> • Status: <b>{c.status}</b>
                    </div>
                  </div>
                  <div className="mt-2 text-xs opacity-60">
                    Criado: {new Date(c.created_at).toLocaleString("pt-BR")} • Expira:{" "}
                    {new Date(c.expires_at).toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
              {convites.length === 0 ? (
                <div className="rounded border p-4 text-sm opacity-80">
                  Nenhum convite ainda.
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* Modal Convidar */}
      {openInvite ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Convidar usuário</div>
              <button
                onClick={() => setOpenInvite(false)}
                className="rounded border px-2 py-1 text-sm hover:bg-black/5"
              >
                Fechar
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm">E-mail</span>
                <input
                  className="mt-1 w-full rounded border p-2"
                  placeholder="ex: gerente@drogaria.com.br"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-sm">Perfil</span>
                <select
                  className="mt-1 w-full rounded border p-2"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="operador">operador</option>
                  <option value="gerente">gerente</option>
                  <option value="admin">admin</option>
                </select>
              </label>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpenInvite(false)}
                  className="rounded border px-3 py-2 text-sm hover:bg-black/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={sendInvite}
                  disabled={inviting}
                  className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  {inviting ? "Enviando…" : "Criar convite"}
                </button>
              </div>

              <div className="text-xs opacity-70">
                * Por enquanto o convite fica registrado no sistema. Depois a gente liga envio automático por e-mail/WhatsApp.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}