import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.json();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from("agendamentos")
      .insert([
        {
          nome: body.nome,
          telefone: body.telefone,
          servico: body.servico,
          data: body.data,
          horario: body.horario,
        },
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao salvar no Supabase:", error.message);
    return NextResponse.json({ success: false, error: error.message });
  }
}
