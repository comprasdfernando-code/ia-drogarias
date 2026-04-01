import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
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

function makeInputImage(dataUrl: string) {
  return {
    type: "input_image" as const,
    image_url: dataUrl,
    detail: "auto" as const,
  };
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("A IA retornou um JSON inválido.");
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

const ClienteSchema = z.object({
  nome_cliente: z.string().optional().default(""),
  saudacao_detectada: z.string().optional().default(""),
  texto_cliente: z.string().default(""),
  medicamentos_solicitados: z
    .array(
      z.object({
        nome: z.string(),
        dosagem: z.string().optional().default(""),
        quantidade: z.string().optional().default(""),
        observacao: z.string().optional().default(""),
      })
    )
    .default([]),
  duvidas_cliente: z.array(z.string()).default([]),
});

const OrcamentoSchema = z.object({
  atendente: z.string().optional().default(""),
  cliente: z.string().optional().default(""),
  itens: z
    .array(
      z.object({
        nome: z.string(),
        descricao: z.string().optional().default(""),
        quantidade: z.number().default(1),
        preco_liquido: z.number(),
        total_item: z.number(),
      })
    )
    .default([]),
  total: z.number().default(0),
  desconto_total: z.number().optional().default(0),
  total_liquido: z.number().optional().default(0),
});

export type ClienteExtraido = z.infer<typeof ClienteSchema>;
export type OrcamentoExtraido = z.infer<typeof OrcamentoSchema>;

export async function extrairClienteDeImagem(
  file: File
): Promise<ClienteExtraido> {
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
              "Não invente medicamentos. " +
              "Se o cliente disser que já possui um item, precisa desse item apenas como contexto/dúvida, e não como medicamento principal a ser orçado. " +
              "Diferencie claramente: medicamentos da receita, dúvidas do cliente e observações adicionais.",
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
              "- saudação detectada, se houver\n" +
              "- texto principal do cliente\n" +
              "- medicamentos efetivamente solicitados ou presentes na receita\n" +
              "- dúvidas do cliente\n" +
              "\nRegras importantes:\n" +
              "- Se o cliente disser que já tem um medicamento e que não precisa dele no orçamento, não trate esse item como medicamento principal solicitado.\n" +
              "- Esse item pode aparecer apenas como contexto em duvidas_cliente ou observacao.\n" +
              "- Retorne JSON estrito.",
          },
          makeInputImage(dataUrl),
        ],
      },
    ] as any,
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
                required: [
                  "nome",
                  "dosagem",
                  "quantidade",
                  "observacao",
                ],
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

  const parsed = safeJsonParse(response.output_text);
  return ClienteSchema.parse(parsed);
}

export async function extrairOrcamentoDeImagem(
  file: File
): Promise<OrcamentoExtraido> {
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
              "Leia itens, quantidades, preço líquido, total por item, desconto total, total bruto e total líquido. " +
              "Quando houver 'Total Líquido', ele deve ser priorizado como valor final do orçamento. " +
              "Não invente linhas nem valores que não existam.",
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
              "- total bruto, se aparecer\n" +
              "- desconto total, se aparecer\n" +
              "- total líquido, se aparecer\n" +
              "\nRegras importantes:\n" +
              "- Se o sistema mostrar 'Total' e também 'Total Líquido', use os dois campos separadamente.\n" +
              "- O campo total_liquido deve receber o valor final a pagar.\n" +
              "- O campo total pode representar o total bruto antes do desconto.\n" +
              "- Retorne JSON estrito.",
          },
          makeInputImage(dataUrl),
        ],
      },
    ] as any,
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

  const parsed = safeJsonParse(response.output_text);

  const orcamento = OrcamentoSchema.parse(parsed);

  const itensSomados = orcamento.itens.reduce((acc, item) => {
    return acc + (Number(item.total_item) || 0);
  }, 0);

  if (!orcamento.total_liquido || orcamento.total_liquido <= 0) {
    if (itensSomados > 0) {
      orcamento.total_liquido = itensSomados;
    } else if (orcamento.total > 0 && orcamento.desconto_total > 0) {
      orcamento.total_liquido = Number(
        (orcamento.total - orcamento.desconto_total).toFixed(2)
      );
    } else {
      orcamento.total_liquido = orcamento.total;
    }
  }

  if ((!orcamento.total || orcamento.total <= 0) && orcamento.total_liquido > 0) {
    orcamento.total = orcamento.total_liquido;
  }

  return orcamento;
}

export type RespostaFinalInput = {
  lojaNome: string;
  atendenteNome: string;
  cliente: ClienteExtraido;
  orcamento: OrcamentoExtraido;
};

export async function gerarRespostaWhatsApp(
  inputData: RespostaFinalInput
): Promise<string> {
  const { lojaNome, atendenteNome, cliente, orcamento } = inputData;

  const totalFinal =
    orcamento.total_liquido && orcamento.total_liquido > 0
      ? orcamento.total_liquido
      : orcamento.total;

  const itensResumo = orcamento.itens
    .map((item) => {
      const nome = item.nome?.trim() || item.descricao?.trim() || "Item";
      const valor =
        item.total_item && item.total_item > 0
          ? item.total_item
          : item.preco_liquido;

      return `• ${nome} — ${formatCurrency(valor)}`;
    })
    .join("\n");

  const medicamentosCliente = cliente.medicamentos_solicitados
    .map((item) => {
      const nome = item.nome?.trim();
      const dosagem = item.dosagem?.trim();
      return [nome, dosagem].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .join(", ");

  const duvidasCliente = cliente.duvidas_cliente.join(" | ");

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
              "Responda de forma acolhedora e natural, com cara de atendimento real de drogaria. " +
              "A mensagem deve sair completa, sem começar cortada. " +
              "Use português do Brasil. " +
              "Evite texto excessivamente longo. " +
              "Se houver dúvida sobre um item que o cliente já informou possuir, explique isso com cuidado e não o inclua no orçamento como item principal. " +
              "Use o total líquido como valor final quando estiver disponível. " +
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
              `Atendente: ${atendenteNome}\n` +
              `Nome do cliente extraído: ${cliente.nome_cliente || ""}\n` +
              `Texto do cliente: ${cliente.texto_cliente}\n` +
              `Medicamentos da receita/pedido: ${medicamentosCliente || "não identificado com clareza"}\n` +
              `Dúvidas do cliente: ${duvidasCliente || "nenhuma"}\n\n` +
              `Itens do orçamento:\n${itensResumo || "Nenhum item encontrado"}\n\n` +
              `Total bruto: ${formatCurrency(orcamento.total || 0)}\n` +
              `Desconto total: ${formatCurrency(orcamento.desconto_total || 0)}\n` +
              `Total líquido/final: ${formatCurrency(totalFinal || 0)}\n\n` +
              `Regras:\n` +
              `- Comece com uma saudação amigável, como "Boa noite, tudo bem? 😊"\n` +
              `- Diga "Aqui é o ${atendenteNome} da ${lojaNome}."\n` +
              `- Diga que você verificou os itens da receita ou do pedido.\n` +
              `- Liste os itens disponíveis com bullets.\n` +
              `- Mostre o valor de cada item.\n` +
              `- Use como total final o valor ${formatCurrency(totalFinal || 0)}.\n` +
              `- Se houver dúvida do cliente sobre um item como Buscopan e ele já informou que possui esse item, explique que ele não entrou no orçamento porque o cliente informou que já tem, e acrescente orientação cautelosa e simples.\n` +
              `- Não trate esse item como item faltante nem como item principal do orçamento.\n` +
              `- Termine oferecendo separar para retirada ou envio por delivery.\n` +
              `- Finalize com assinatura: "Att, ${atendenteNome}" e na linha abaixo "${lojaNome}".\n` +
              `- Retorne apenas a mensagem final, pronta para copiar e colar.\n`,
          },
        ],
      },
    ] as any,
  });

  return response.output_text.trim();
}
export type RespostaContinuacaoInput = {
  lojaNome: string;
  atendenteNome: string;
  cliente: ClienteExtraido;
  orcamento: OrcamentoExtraido;
  mensagemAnterior: string;
  novaMensagemCliente: string;
};

export async function gerarRespostaContinuacaoWhatsApp(
  inputData: RespostaContinuacaoInput
): Promise<string> {
  const {
    lojaNome,
    atendenteNome,
    cliente,
    orcamento,
    mensagemAnterior,
    novaMensagemCliente,
  } = inputData;

  const totalFinal =
    orcamento.total_liquido && orcamento.total_liquido > 0
      ? orcamento.total_liquido
      : orcamento.total;

  const itensResumo = orcamento.itens
    .map((item) => {
      const nome = item.nome?.trim() || item.descricao?.trim() || "Item";
      const valor =
        item.total_item && item.total_item > 0
          ? item.total_item
          : item.preco_liquido;

      return `- ${nome}: ${formatCurrency(valor)}`;
    })
    .join("\n");

  const response = await openai.responses.create({
    model: "gpt-5.4",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Você continua atendimentos de farmácia no WhatsApp. " +
              "Tom humano, profissional, claro e vendedor sem exagero. " +
              "Nunca faça promessa médica. " +
              "Nunca afirme conduta clínica definitiva. " +
              "Se houver dúvida sobre uso, necessidade, troca, genérico ou preço, responda com cautela e linguagem simples. " +
              "O objetivo é responder a dúvida e manter a conversa evoluindo para fechamento quando fizer sentido. " +
              "Evite textos longos. " +
              "Retorne apenas a mensagem final pronta para enviar no WhatsApp.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Continue este atendimento.\n\n` +
              `Loja: ${lojaNome}\n` +
              `Atendente: ${atendenteNome}\n` +
              `Cliente extraído:\n${JSON.stringify(cliente, null, 2)}\n\n` +
              `Orçamento atual:\n${JSON.stringify(orcamento, null, 2)}\n\n` +
              `Itens resumidos:\n${itensResumo || "Nenhum item"}\n` +
              `Total final: ${formatCurrency(totalFinal || 0)}\n\n` +
              `Mensagem anterior enviada ao cliente:\n${mensagemAnterior}\n\n` +
              `Nova mensagem do cliente:\n${novaMensagemCliente}\n\n` +
              `Regras:\n` +
              `- Responda especificamente a nova dúvida do cliente.\n` +
              `- Se a dúvida for sobre preço, confirme o valor de forma objetiva.\n` +
              `- Se a dúvida for sobre opção mais barata, diga que pode verificar alternativa/genérico, sem inventar item que não foi confirmado.\n` +
              `- Se a dúvida for sobre entrega, responda de forma comercial e puxe para fechamento.\n` +
              `- Se a dúvida for sobre necessidade de medicamento, responda com cautela e sem substituir orientação profissional.\n` +
              `- Sempre que fizer sentido, finalize com uma chamada leve para ação, como separar, reservar ou enviar por delivery.\n` +
              `- Não repita toda a mensagem anterior; apenas continue a conversa.\n` +
              `- Retorne somente a mensagem pronta.\n`,
          },
        ],
      },
    ] as any,
  });

  return response.output_text.trim();
}
export type RespostaContinuacaoComItemInput = {
  lojaNome: string;
  atendenteNome: string;
  cliente: ClienteExtraido;
  orcamento: OrcamentoExtraido;
  mensagemAnterior: string;
  novaMensagemCliente: string;
  itemAdicionalNome: string;
  itemAdicionalValor: number;
  itemAdicionalQuantidade?: number;
};

export async function gerarRespostaContinuacaoComItemWhatsApp(
  inputData: RespostaContinuacaoComItemInput
): Promise<string> {
  const {
    lojaNome,
    atendenteNome,
    cliente,
    orcamento,
    mensagemAnterior,
    novaMensagemCliente,
    itemAdicionalNome,
    itemAdicionalValor,
    itemAdicionalQuantidade = 1,
  } = inputData;

  const totalBase =
    orcamento.total_liquido && orcamento.total_liquido > 0
      ? orcamento.total_liquido
      : orcamento.total;

  const valorItemTotal = Number(itemAdicionalValor || 0) * Number(itemAdicionalQuantidade || 1);
  const novoTotal = Number((totalBase + valorItemTotal).toFixed(2));

  const itensAtuais = orcamento.itens
    .map((item) => {
      const nome = item.nome?.trim() || item.descricao?.trim() || "Item";
      const valor =
        item.total_item && item.total_item > 0
          ? item.total_item
          : item.preco_liquido;

      return `• ${nome} — ${formatCurrency(valor)}`;
    })
    .join("\n");

  const itemNovoLinha =
    itemAdicionalQuantidade > 1
      ? `• ${itemAdicionalNome} (${itemAdicionalQuantidade}x) — ${formatCurrency(valorItemTotal)}`
      : `• ${itemAdicionalNome} — ${formatCurrency(valorItemTotal)}`;

  const response = await openai.responses.create({
    model: "gpt-5.4",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Você continua atendimentos de farmácia no WhatsApp. " +
              "Tom humano, profissional, claro e vendedor sem exagero. " +
              "Nunca faça promessa médica. " +
              "Retorne apenas a mensagem final pronta para enviar. " +
              "Quando houver item adicional confirmado, gere resposta com orçamento atualizado e total novo.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Continue este atendimento com atualização de orçamento.\n\n` +
              `Loja: ${lojaNome}\n` +
              `Atendente: ${atendenteNome}\n` +
              `Cliente extraído:\n${JSON.stringify(cliente, null, 2)}\n\n` +
              `Mensagem anterior enviada:\n${mensagemAnterior}\n\n` +
              `Nova mensagem do cliente:\n${novaMensagemCliente}\n\n` +
              `Itens atuais do orçamento:\n${itensAtuais || "Nenhum item"}\n\n` +
              `Total atual: ${formatCurrency(totalBase)}\n` +
              `Item adicional confirmado: ${itemAdicionalNome}\n` +
              `Quantidade adicional: ${itemAdicionalQuantidade}\n` +
              `Valor do item adicional: ${formatCurrency(itemAdicionalValor)}\n` +
              `Valor total do item adicional: ${formatCurrency(valorItemTotal)}\n` +
              `Novo total final: ${formatCurrency(novoTotal)}\n\n` +
              `Regras:\n` +
              `- Responda como continuação natural da conversa.\n` +
              `- Confirme que esse item também tem disponível.\n` +
              `- Mostre o orçamento atualizado completo.\n` +
              `- Liste os itens anteriores e o item adicional.\n` +
              `- Mostre o total atualizado.\n` +
              `- Termine oferecendo separar para retirada ou envio por delivery.\n` +
              `- Retorne somente a mensagem pronta.\n\n` +
              `Linha do item novo:\n${itemNovoLinha}`,
          },
        ],
      },
    ] as any,
  });

  return response.output_text.trim();
}