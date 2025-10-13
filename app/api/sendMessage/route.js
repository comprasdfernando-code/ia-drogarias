import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🔹 Conexão Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const body = await req.json();
    const { nome, telefone, endereco, servico, data, horario, observacoes } = body;

    console.log("📦 Dados recebidos:", body);

    // 🔹 Salva o agendamento na Supabase
    const { error } = await supabase.from("agendamentos").insert([
      {
        nome,
        telefone,
        endereco,
        servico,
        data,
        horario,
        observacoes,
      },
    ]);

    if (error) {
      console.error("❌ Erro ao salvar no Supabase:", error);
      return NextResponse.json(
        { success: false, message: "Erro ao salvar no banco de dados" },
        { status: 500 }
      );
    }

    console.log("✅ Agendamento salvo com sucesso!");
    return NextResponse.json({
      success: true,
      message: "Agendamento salvo com sucesso no Supabase",
    });
  } catch (err) {
    console.error("⚠️ Erro geral no endpoint:", err);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}