"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CompletarCadastro() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    endereco: "",
  });

  useEffect(() => {
    const carregar = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/gigante/login");
        return;
      }

      setUserId(session.user.id);

      const { data: cliente } = await supabase
        .from("gigante_clientes")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cliente) {
        router.replace("/gigante/pedido");
        return;
      }

      setLoading(false);
    };

    carregar();
  }, [router]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("gigante_clientes").insert({
      id: userId,
      ...form,
    });

    if (error) {
      setErro("Erro ao salvar cadastro");
      return;
    }

    router.replace("/gigante/pedido");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <form
        onSubmit={salvar}
        className="bg-white p-6 rounded-xl shadow w-full max-w-md"
      >
        <h1 className="text-xl font-bold text-center mb-4">
          Complete seu cadastro 🍖
        </h1>

        <input
          placeholder="Nome"
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          className="w-full border p-2 rounded mb-2"
        />

        <input
          placeholder="Telefone"
          onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          className="w-full border p-2 rounded mb-2"
        />

        <input
          placeholder="Endereço"
          onChange={(e) => setForm({ ...form, endereco: e.target.value })}
          className="w-full border p-2 rounded mb-3"
        />

        {erro && <p className="text-red-600">{erro}</p>}

        <button className="w-full bg-red-600 text-white py-2 rounded">
          Salvar e continuar
        </button>
      </form>
    </div>
  );
}
