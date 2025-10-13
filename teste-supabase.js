import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testarConexao() {
  console.log("🔍 Testando inserção no Supabase...");
  const { data, error } = await supabase.from("agendamentos").insert([
    {
      nome: "Gisele Dias de Sousa",
      whatsapp: "11948343725",
      endereco: "Rua Teste",
      servico: "Aferição de Pressão Arterial",
      data: "2025-10-13",
      horario: "22:22",
      observacoes: "Teste manual via terminal",
    },
  ]);

  if (error) {
    console.error("❌ Erro ao inserir:", error);
  } else {
    console.log("✅ Inserção bem-sucedida!", data);
  }
}

testarConexao();
