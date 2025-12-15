"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CompletarCadastro() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    endereco: "",
  });

  // 🔐 Controle correto da sessão
  useEffect(() => {
    const carregarSessao = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // ⏳ ainda carregando
      if (!session?.user) {
        setLoadingAuth(false);
        router.replace("/gigante/login");
        return;
      }

      setUserId(session.user.id);

      // 🔎 verifica se já tem cadastro
      const { data: cliente } = await supabase
        .from("gigante_clientes")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cliente) {
        router.replace("/gigante/pedido");
        return;
      }

      setLoadingAuth(false);
    };

    carregarSessao();
  }, [router]);

  function handleChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvarCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSaving(true);

    const { error } = await supabase.from("gigante_clientes").insert({
      id: userId,
      ...form,
    });

    if (error) {
      setErro("Erro ao salvar cadastro");
      setSaving(false);
      return;
    }

    router.replace("/gigante/pedido");
  }

  // ⏳ Aguarda sessão
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  // 🧾 FORMULÁRIO
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <form
        onSubmit={salvarCadastro}
        className="bg-white p-6 rounded-xl shadow w-full max-w-md"
      >
        <h1 className="text-xl font-bold text-center mb-4">
          Complete seu cadastro 🍖
        </h1>

        <input
          name="nome"
          placeholder="Nome completo"
          onChange={handleChange}
          className="w-full border p-2 rounded mb-2"
          required
        />

        <input
          name="telefone"
          placeholder="WhatsApp"
          onChange={handleChange}
          className="w-full border p-2 rounded mb-2"
          required
        />

        <input
          name="endereco"
          placeholder="Endereço"
          onChange={handleChange}
          className="w-full border p-2 rounded mb-3"
          required
        />

        {erro && <p className="text-red-600 text-sm mb-2">{erro}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-red-600 text-white py-2 rounded"
        >
          {saving ? "Salvando..." : "Salvar e continuar"}
        </button>
      </form>
    </div>
  );
}
