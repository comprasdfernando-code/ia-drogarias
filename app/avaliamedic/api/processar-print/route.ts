import { NextResponse } from "next/server";
import {
  extrairClienteDeImagem,
  extrairOrcamentoDeImagem,
  gerarRespostaWhatsApp,
} from "@/lib/avaliamedic-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const clienteImage = formData.get("clienteImage");
    const orcamentoImage = formData.get("orcamentoImage");
    const lojaNome = String(formData.get("lojaNome") || "Drogaria");
    const atendenteNome = String(formData.get("atendenteNome") || "Atendente");

    if (!(clienteImage instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Imagem do cliente/receita não enviada." },
        { status: 400 }
      );
    }

    if (!(orcamentoImage instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Imagem do orçamento não enviada." },
        { status: 400 }
      );
    }

    const [cliente, orcamento] = await Promise.all([
      extrairClienteDeImagem(clienteImage),
      extrairOrcamentoDeImagem(orcamentoImage),
    ]);

    const mensagem = await gerarRespostaWhatsApp({
      lojaNome,
      atendenteNome,
      cliente,
      orcamento,
    });

    return NextResponse.json({
      ok: true,
      cliente,
      orcamento,
      mensagem,
    });
  } catch (error: any) {
    console.error("Erro em /processar-print:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro interno ao processar imagens.",
      },
      { status: 500 }
    );
  }
}