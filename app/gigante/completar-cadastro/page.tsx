"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CompletarCadastro() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    numero: "",
    bairro: "",
    complemento: "",
    referencia: "",
  });

  // 🔐 Verifica usuário logado
  useEffect(() => {
    async function carregarUsuario() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/gigante/login");
        return;
      }

      setUserId(data.user.id);

      // Verifica se já tem cadastro
      const { data: cliente } = await supabase
        .from("gigante_clientes")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (cliente) {
        router.push("/gigante/pedido");
      }
    }

    carregarUsuario();
  }, [router]);

  function handleChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvarCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const { error } = await supabase.from("gigante_clientes").insert({
      id: userId,
      ...form,
    });

    if (error) {
      setErro("Erro ao salvar cadastro. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/gigante/pedido");
  }

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
          placeholder="Rua / Avenida"
          onChange={handleChange}
          className="w-full border p-2 rounded mb-2"
          required
        />

        <div className="flex gap-2">
          <input
            name="numero"
            placeholder="Número"
            onChange={handleChange}
            className="w-full border p-2 rounded mb-2"
            required
          />

          <input
            name="bairro"
            placeholder="Bairro"
            onChange={handleChange}
            className="w-full border p-2 rounded mb-2"
            required
          />
        </div>

        <input
          name="complemento"
          placeholder="Complemento (opcional)"
          onChange={handleChange}
          className="w-full border p-2 rounded mb-2"
        />

        <input
          name="referencia"
          placeholder="Ponto de referência (opcional)"
          onChange={handleChange}
          className="w-full border p-2 rounded mb-3"
        />

        {erro && <p className="text-red-600 text-sm mb-2">{erro}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded"
        >
          {loading ? "Salvando..." : "Salvar e continuar"}
        </button>
      </form>
    </div>
  );
}
