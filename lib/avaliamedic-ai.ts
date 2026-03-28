import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function fileToDataUrl(file: File) {
  return new Promise<string>(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mime = file.type || "image/png";
      const base64 = buffer.toString("base64");
      resolve(`data:${mime};base64,${base64}`);
    } catch (error) {
      reject(error);
    }
  });
}

const ClienteSchema = z.object({
  nome_cliente: z.string().optional().default(""),
  saudacao_detectada: z.string().optional().default(""),
  texto_cliente: z.string().default(""),
  medicamentos_solicitados: z.array(
    z.object({
      nome: z.string(),
      dosagem: z.string().optional().default(""),
      quantidade: z.string().optional().default(""),
      observacao: z.string().optional().default(""),
    })
  ).default([]),
  duvidas_cliente: z.array(z.string()).default([]),
});

const OrcamentoSchema = z.object({
  atendente: z.string().optional().default(""),
  cliente: z.string().optional().default(""),
  itens: z.array(
    z.object({
      nome: z.string(),
      descricao: z.string().optional().default(""),
      quantidade: z.number().default(1),
      preco_liquido: z.number(),
      total_item: z.number(),
    })
  ).default([]),
  total: z.number().default(0),
  desconto_total: z.number().optional().default(0),
});

export type ClienteExtraido = z.infer<typeof ClienteSchema>;
export type OrcamentoExtraido = z.infer<typeof OrcamentoSchema>;

export async function extrairClienteDeImagem(file: File): Promise<ClienteExtraido> {
  const dataUrl = await fileToDataUrl(file);

  const response = await openai.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Você extrai dados de prints de WhatsApp e fotos de receita. " +
              "Retorne apenas JSON válido. " +
              "Identifique nomes de medicamentos, dúvidas do cliente e o texto principal. " +
              "Não invente medicamento que não apareça.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Leia esta imagem. Extraia:\n" +
              "- nome do cliente, se visível\n" +
              "- texto enviado pelo cliente\n" +
              "- medicamentos solicitados\n" +
              "- dúvidas do cliente\n" +
              "Retorne JSON estrito.",
          },
          {
            type: "input_image",
            image_url: dataUrl,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "cliente_extraido",
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

  const parsed = JSON.parse(response.output_text);
  return ClienteSchema.parse(parsed);
}

export async function extrairOrcamentoDeImagem(file: File): Promise<OrcamentoExtraido> {
  const dataUrl = await fileToDataUrl(file);

  const response = await openai.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Você extrai dados de prints de orçamento de sistemas de farmácia. " +
              "Retorne apenas JSON válido. " +
              "Leia nomes, quantidades, preços líquidos, total por item e total geral. " +
              "Não invente linhas que não existam.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Leia esta imagem do orçamento. Extraia:\n" +
              "- nome do atendente, se aparecer\n" +
              "- nome do cliente, se aparecer\n" +
              "- itens com quantidade, preço líquido e total do item\n" +
              "- total geral\n" +
              "- desconto total, se aparecer\n" +
              "Retorne JSON estrito.",
          },
          {
            type: "input_image",
            image_url: dataUrl,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "orcamento_extraido",
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
                required: ["nome", "descricao", "quantidade", "preco_liquido", "total_item"],
              },
            },
            total: { type: "number" },
            desconto_total: { type: "number" },
          },
          required: ["atendente", "cliente", "itens", "total", "desconto_total"],
        },
      },
    },
  });

  const parsed = JSON.parse(response.output_text);
  return OrcamentoSchema.parse(parsed);
}

export type RespostaFinalInput = {
  lojaNome: string;
  atendenteNome: string;
  cliente: ClienteExtraido;
  orcamento: OrcamentoExtraido;
};

export async function gerarRespostaWhatsApp(inputData: RespostaFinalInput) {
  const { lojaNome, atendenteNome, cliente, orcamento } = inputData;

  const response = await openai.responses.create({
    model: "gpt-5.4",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Você escreve mensagens de WhatsApp para farmácia. " +
              "Tom profissional, humano, claro e vendedor sem exagero. " +
              "Nunca faça promessa médica. " +
              "Se houver dúvida do cliente sobre necessidade de um item, responda com cautela e linguagem simples. " +
              "Retorne apenas o texto final da mensagem.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Monte uma mensagem pronta para WhatsApp.\n\n` +
              `Loja: ${lojaNome}\n` +
              `Atendente: ${atendenteNome}\n\n` +
              `Dados do cliente extraídos:\n${JSON.stringify(cliente, null, 2)}\n\n` +
              `Dados do orçamento extraídos:\n${JSON.stringify(orcamento, null, 2)}\n\n` +
              `Regras:\n` +
              `- Comece com saudação amigável\n` +
              `- Diga "Aqui é o ${atendenteNome} da ${lojaNome}"\n` +
              `- Liste os itens disponíveis com bullets\n` +
              `- Mostre valores por item\n` +
              `- Mostre total\n` +
              `- Se houver dúvida sobre item tipo Buscopan, responda com cautela e de forma informativa, sem substituir orientação médica\n` +
              `- Termine oferecendo separar ou enviar por delivery\n` +
              `- Assinatura final com nome e loja\n`,
          },
        ],
      },
    ],
  });

  return response.output_text.trim();
}