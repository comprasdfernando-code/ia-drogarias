import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret");

  if (secret !== process.env.PAGBANK_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();
  const pagbankId = payload.id;
  const status = payload.charges?.[0]?.status?.toLowerCase();

  // Atualiza venda
  await supabase
    .from("vendas_site")
    .update({
      status,
      etapa: status === "paid" ? 2 : undefined,
      pagbank_id: pagbankId
    })
    .eq("pagbank_id", pagbankId);

  if (status === "paid") {
    await supabase.from("vendas_site_rastreamento").insert({
      venda_id: pagbankId,
      etapa: 2,
      descricao: "Pagamento aprovado"
    });
  }

  return NextResponse.json({ ok: true });
}
