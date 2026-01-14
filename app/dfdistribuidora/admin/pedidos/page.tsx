"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   SENHA ADMIN (LOCAL)
========================= */
const ADMIN_SENHA = "102030"; // 🔴 troque se quiser
const LS_KEY = "df_admin_ok";

/* =========================
   TYPES
========================= */
type Pedido = {
  id: string;
  created_at: string;

  cliente_nome: string;
  cliente_whatsapp: string;
  cliente_cpf: string | null;
  cliente_nome_fantasia: string | null;

  tipo_entrega: string;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;

  pagamento: string;
  taxa_entrega: number;
  subtotal: number;
  total: number;

  itens: {
    ean: string;
    nome: string;
    qtd: number;
    preco: number;
    subtotal: number;
  }[];

  status: string;
};

/* =========================
   HELPERS
========================= */
function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleString("pt-BR");
}

function waLink(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`;
}

const STATUS = ["NOVO", "SEPARANDO", "FATURADO", "ENTREGUE", "CANCELADO"];

/* =========================
   PAGE
========================= */
export default function AdminPedidosPage() {
  const [ok, setOk] = useState(false);
  const [senha, setSenha] = useState("");

  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [q, setQ] = useState("");

  /* ===== AUTH ===== */
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) === "1";
    if (saved) setOk(true);
  }, []);

  function entrar() {
    if (senha === ADMIN_SENHA) {
      localStorage.setItem(LS_KEY, "1");
      setOk(true);
    } else {
      alert("Senha incorreta.");
    }
  }

  function sair() {
    localStorage.removeItem(LS_KEY);
    setOk(false);
    setSenha("");
  }

  /* ===== LOAD ===== */
  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("df_pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setPedidos((data || []) as Pedido[]);
    setLoading(false);
  }

  useEffect(() => {
    if (ok) load();
  }, [ok]);

  /* ===== FILTER ===== */
  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return pedidos;

    return pedidos.filter((p) => {
      const blob = `
        ${p.id}
        ${p.cliente_nome}
        ${p.cliente_whatsapp}
        ${p.cliente_nome_fantasia ?? ""}
        ${p.status}
      `.toLowerCase();

      return blob.includes(s);
    });
  }, [pedidos, q]);

  /* ===== STATUS ===== */
  async function alterarStatus(id: string, status: string) {
    const { error } = await supabase
      .from("df_pedidos")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  }

  /* =========================
     LOGIN
  ========================= */
  if (!ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border rounded-3xl shadow-sm p-6">
          <h1 className="text-xl font-extrabold text-gray-900">
            Admin • Pedidos DF
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Digite a senha administrativa
          </p>

          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? entrar() : null)}
            placeholder="Senha"
            className="mt-4 w-full border rounded-2xl px-4 py-3"
          />

          <button
            onClick={entrar}
            className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl py-3 font-extrabold"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  /* =========================
     LIST
  ========================= */
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Painel de Pedidos
            </h1>
            <p className="text-sm text-gray-600">
              DF Distribuidora • Admin
            </p>
          </div>

          <button
            onClick={sair}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 font-extrabold"
          >
            Sair
          </button>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente, Whats, status ou ID..."
            className="flex-1 rounded-xl border px-4 py-3"
          />

          <div className="rounded-xl border bg-white px-4 py-3 text-sm">
            Total: <b>{filtrados.length}</b>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 text-gray-600">Carregando pedidos…</div>
        ) : filtrados.length === 0 ? (
          <div className="mt-8 bg-white border rounded-2xl p-6 text-gray-600">
            Nenhum pedido encontrado.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtrados.map((p) => (
              <div
                key={p.id}
                className="bg-white border rounded-2xl p-4 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-gray-900">
                      {p.cliente_nome}
                    </div>
                    <div className="text-sm text-gray-600">
                      {fmtDate(p.created_at)} • ID {p.id}
                    </div>
                    {p.cliente_nome_fantasia && (
                      <div className="text-sm text-gray-700">
                        Loja: {p.cliente_nome_fantasia}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <select
                      value={p.status}
                      onChange={(e) =>
                        alterarStatus(p.id, e.target.value)
                      }
                      className="border rounded-xl px-3 py-2 text-sm font-bold"
                    >
                      {STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <a
                      href={waLink(
                        p.cliente_whatsapp,
                        `Olá ${p.cliente_nome}, seu pedido ${p.id} está com status: ${p.status}`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-extrabold"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-700">
                  <b>Entrega:</b>{" "}
                  {p.tipo_entrega === "ENTREGA"
                    ? `${p.endereco}, ${p.numero} - ${p.bairro}`
                    : "Retirada"}
                </div>

                <div className="mt-3 border-t pt-3">
                  <div className="text-sm font-bold mb-1">Itens</div>
                  {p.itens.map((i, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {i.nome} ({i.qtd}x)
                      </span>
                      <span>{brl(i.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-end font-extrabold text-lg">
                  Total: {brl(p.total)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
