export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts } from "pdf-lib";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prescricao_id = searchParams.get("prescricao_id");

  if (!prescricao_id) {
    return NextResponse.json({ error: "ID não enviado" }, { status: 400 });
  }

  const { data: prescricao, error: e1 } = await supabase
    .from("prescricoes")
    .select("*")
    .eq("id", prescricao_id)
    .single();

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { data: itens, error: e2 } = await supabase
    .from("itens_prescricao")
    .select("*")
    .eq("prescricao_id", prescricao_id);

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 800;

  page.drawText("Relatório Clínico - AvaliaMedic", { x: 50, y, size: 16, font });
  y -= 30;

  page.drawText(`Setor: ${prescricao.setor || "-"}`, { x: 50, y, size: 11, font }); y -= 16;
  page.drawText(`Idade: ${prescricao.idade ?? "-"}`, { x: 50, y, size: 11, font }); y -= 16;
  page.drawText(`Peso: ${prescricao.peso ?? "-"}`, { x: 50, y, size: 11, font }); y -= 16;
  page.drawText(`Status: ${prescricao.status || "-"}`, { x: 50, y, size: 11, font }); y -= 24;

  page.drawText("Itens:", { x: 50, y, size: 12, font }); y -= 18;

  for (const it of itens || []) {
    const bloco = [
      `Medicamento: ${it.medicamento || "-"}`,
      `Dose: ${it.dose || "-"}`,
      `Via: ${it.via || "-"}`,
      `Frequência: ${it.frequencia || "-"}`,
      `Risco: ${it.risco || "-"}`,
      `Motivo: ${it.motivo || "-"}`,
      "-------------------------------",
    ];

    for (const line of bloco) {
      if (y < 60) {
        // nova página
        y = 800;
        pdfDoc.addPage([595.28, 841.89]);
      }
      page.drawText(line, { x: 50, y, size: 10, font });
      y -= 14;
    }
  }

  const bytes = await pdfDoc.save();

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="relatorio-${prescricao_id}.pdf"`,
    },
  });
}
