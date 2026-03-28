import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  extrairClienteDeImagem,
  extrairOrcamentoDeImagem,
  gerarRespostaWhatsApp,
} from "@/lib/avaliamedic-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extrairClienteDeTexto(texto: string) {
  const response = await openai.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Você extrai dados de conversas de WhatsApp e textos de receita. " +
              "Retorne apenas JSON válido. " +
              "Não invente medicamentos. " +
              "Se o cliente disser que já possui um item e não precisa dele no orçamento, isso deve aparecer como contexto/dúvida, não como medicamento principal solicitado.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Analise o texto abaixo e extraia:\n" +
              "- nome do cliente, se houver\n" +
              "- saudação detectada, se houver\n" +
              "- texto principal do cliente\n" +
              "- medicamentos solicitados ou presentes na receita\n" +
              "- dúvidas do cliente\n\n" +
              `Texto:\n${texto}`,
          },
        ],
      },
    ] as any,
    text: {
      format: {
        type: "json_schema",
        name: "cliente_texto_extraido",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            nome_cliente: { type: "string" },
            saudacao_detectada: { type: "string" },
            texto_cliente: { type: "string" },
            medicamentos_solicitados: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  nome: { type: "string" },
                  dosagem: { type: "string" },
                  quantidade: { type: "string" },
                  observacao: { type: "string" },
                },
                required: ["nome", "dosagem", "quantidade", "observacao"],
              },
            },
            duvidas_cliente: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "nome_cliente",
            "saudacao_detectada",
            "texto_cliente",
            "medicamentos_solicitados",
            "duvidas_cliente",
          ],
        },
      },
    },
  });

  return JSON.parse(response.output_text);
}

async function extrairOrcamentoDeTexto(texto: string) {
  const response = await openai.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Você extrai dados de orçamentos de farmácia em texto. " +
              "Retorne apenas JSON válido. " +
              "Extraia atendente, cliente, itens, preços, desconto total, total bruto e total líquido. " +
              "Quando houver total líquido, ele deve ser priorizado como valor final.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Analise o orçamento em texto abaixo e extraia:\n" +
              "- nome do atendente, se houver\n" +
              "- nome do cliente, se houver\n" +
              "- itens com quantidade, preço líquido e total do item\n" +
              "- total bruto\n" +
              "- desconto total\n" +
              "- total líquido\n\n" +
              `Texto:\n${texto}`,
          },
        ],
      },
    ] as any,
    text: {
      format: {
        type: "json_schema",
        name: "orcamento_texto_extraido",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            atendente: { type: "string" },
            cliente: { type: "string" },
            itens: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  nome: { type: "string" },
                  descricao: { type: "string" },
                  quantidade: { type: "number" },
                  preco_liquido: { type: "number" },
                  total_item: { type: "number" },
                },
                required: [
                  "nome",
                  "descricao",
                  "quantidade",
                  "preco_liquido",
                  "total_item",
                ],
              },
            },
            total: { type: "number" },
            desconto_total: { type: "number" },
            total_liquido: { type: "number" },
          },
          required: [
            "atendente",
            "cliente",
            "itens",
            "total",
            "desconto_total",
            "total_liquido",
          ],
        },
      },
    },
  });

  return JSON.parse(response.output_text);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const clienteImage = formData.get("clienteImage");
    const orcamentoImage = formData.get("orcamentoImage");

    const conversaTexto = String(formData.get("conversaTexto") || "").trim();
    const orcamentoTexto = String(formData.get("orcamentoTexto") || "").trim();

    const lojaNome = String(formData.get("lojaNome") || "Drogaria");
    const atendenteNome = String(formData.get("atendenteNome") || "Atendente");

    const temTextoCliente = conversaTexto.length > 0;
    const temTextoOrcamento = orcamentoTexto.length > 0;
    const temImagemCliente = clienteImage instanceof File;
    const temImagemOrcamento = orcamentoImage instanceof File;

    if (!temTextoCliente && !temImagemCliente) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Envie a imagem do cliente/receita ou cole a conversa/texto da receita.",
        },
        { status: 400 }
      );
    }

    if (!temTextoOrcamento && !temImagemOrcamento) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Envie a imagem do orçamento ou cole o orçamento em texto.",
        },
        { status: 400 }
      );
    }

    const cliente = temTextoCliente
      ? await extrairClienteDeTexto(conversaTexto)
      : await extrairClienteDeImagem(clienteImage as File);

    const orcamento = temTextoOrcamento
      ? await extrairOrcamentoDeTexto(orcamentoTexto)
      : await extrairOrcamentoDeImagem(orcamentoImage as File);

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
        error: error?.message || "Erro interno ao processar.",
      },
      { status: 500 }
    );
  }
}