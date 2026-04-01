import { NextResponse } from "next/server";
import {
  gerarRespostaContinuacaoWhatsApp,
} from "@/lib/avaliamedic-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      lojaNome,
      atendenteNome,
      cliente,
      orcamento,
      mensagemAnterior,
      novaMensagemCliente,
    } = body || {};

    if (!mensagemAnterior || !String(mensagemAnterior).trim()) {
      return NextResponse.json(
        { ok: false, error: "Mensagem anterior não informada." },
        { status: 400 }
      );
    }

    if (!novaMensagemCliente || !String(novaMensagemCliente).trim()) {
      return NextResponse.json(
        { ok: false, error: "Nova mensagem do cliente não informada." },
        { status: 400 }
      );
    }

    if (!cliente || !orcamento) {
      return NextResponse.json(
        { ok: false, error: "Contexto do atendimento não encontrado." },
        { status: 400 }
      );
    }

    const mensagem = await gerarRespostaContinuacaoWhatsApp({
      lojaNome: String(lojaNome || "Drogaria"),
      atendenteNome: String(atendenteNome || "Atendente"),
      cliente,
      orcamento,
      mensagemAnterior: String(mensagemAnterior),
      novaMensagemCliente: String(novaMensagemCliente),
    });

    return NextResponse.json({
      ok: true,
      mensagem,
    });
  } catch (error: any) {
    console.error("Erro em /processar-print/continuar:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro interno ao continuar atendimento.",
      },
      { status: 500 }
    );
  }
}