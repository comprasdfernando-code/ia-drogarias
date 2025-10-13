"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function TesteBancoPage() {
  const [status, setStatus] = useState("⏳ Testando conexão com Supabase...");

  useEffect(() => {
    async function testarConexao() {
      try {
        // tenta buscar algo simples (a lista de usuários autenticados)
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          setStatus("❌ Falha na conexão ou nenhuma sessão ativa");
          console.error(error);
        } else {
          setStatus("✅ Conexão bem-sucedida com Supabase!");
          console.log("Dados retornados:", data);
        }
      } catch (err) {
        console.error(err);
        setStatus("⚠️ Erro inesperado ao conectar com Supabase");
      }
    }

    testarConexao();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">
        🔍 Teste de Conexão com Supabase
      </h1>
      <p className="text-lg text-gray-800">{status}</p>
    </div>
  );
}
