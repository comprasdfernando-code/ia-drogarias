"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TipoRegistro = "envio" | "resposta" | "req" | "pedido";
type StatusRegistro = "enviado" | "confirmado" | "pendente" | "sem_resposta";

type RegistroExtraido = {
  loja: string;
  data_msg: string | null;
  hora_msg: string | null;
  paciente: string | null;
  telefone: string | null;
  cpf: string | null;
  formula_descricao: string | null;
  req_numero: string | null;
  valor: number | null;
  status: StatusRegistro;
  tipo_registro: TipoRegistro;
  mensagem_original: string;
  confirmado_em: string | null;
};

type RegistroBanco = RegistroExtraido & {
  id: string;
  criado_em?: string;
};

function normalizarNumero(valor: string) {
  const limpo = valor.replace(/\./g, "").replace(",", ".");
  const num = Number(limpo);
  return Number.isFinite(num) ? num : null;
}

function formatarMoeda(valor: number | null) {
  if (valor === null || Number.isNaN(valor)) return "-";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function limparTexto(texto: string) {
  return texto
    .replace(/\u200e/g, "")
    .replace(/\r/g, "")
    .trim();
}

function isLinhaIgnoravel(linha: string) {
  const l = linha.trim().toLowerCase();

  return (
    !l ||
    l === "null" ||
    l === "undefined" ||
    l.includes("as mensagens e chamadas são protegidas") ||
    l.includes("criptografia de ponta a ponta") ||
    l.includes("esta mensagem foi apagada") ||
    l.includes("imagem ocultada") ||
    l.includes("<mídia ocultada>") ||
    l.includes("vídeo omitido") ||
    l.includes("áudio omitido") ||
    l.includes("documento omitido")
  );
}

function extrairCabecalhoWhatsapp(linha: string) {
  /**
   * Exemplos comuns:
   * 12/03/2026 08:10 - Nome:
   * [12/03/2026, 08:10:22] Nome:
   * 12/03/26, 08:10 - Nome:
   */
  const modelos = [
    /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2})(?::\d{2})?\s+-\s+([^:]+):\s*(.*)$/i,
    /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2})(?::\d{2})?\]\s+([^:]+):\s*(.*)$/i,
  ];

  for (const regex of modelos) {
    const match = linha.match(regex);
    if (match) {
      return {
        data: match[1] || null,
        hora: match[2] || null,
        autor: (match[3] || "").trim(),
        mensagem: (match[4] || "").trim(),
      };
    }
  }

  return null;
}

function extrairReq(texto: string) {
  const match = texto.match(/REQ\s*[:#-]?\s*(\d{4,})/i);
  return match?.[1] || null;
}

function extrairCPF(texto: string) {
  const match = texto.match(/\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/);
  return match?.[0] || null;
}

function extrairTelefone(texto: string) {
  const match = texto.match(/\b(?:\(?\d{2}\)?\s*)?(?:9?\d{4})[-\s]?\d{4}\b/);
  return match?.[0] || null;
}

function extrairValor(texto: string) {
  const match = texto.match(/\b(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})\b/);
  if (!match) return null;
  return normalizarNumero(`${match[1]},${match[2]}`);
}

function pareceFormula(linha: string) {
  return /mg|mcg|g\b|ml|caps|cáps|cp\b|cps\b|gotas|sach[eê]|creme|gel|loção|solução|xarope|ampola|dose|ui\b|%/i.test(
    linha
  );
}

function pareceNomePessoa(linha: string) {
  const l = linha.trim();

  if (!l || l.length < 6) return false;
  if (/\d{4,}/.test(l)) return false;
  if (/req|cpf|tel|telefone|valor|pago|pix|loja|lj|att|boa tarde|bom dia|boa noite|confirma/i.test(l)) return false;

  const palavras = l.split(/\s+/).filter(Boolean);
  return palavras.length >= 2;
}

function normalizarTextoComparacao(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function extrairLojaNumero(texto: string) {
  const match = texto.match(/(?:loja|lj)\s*(\d{1,3})/i);
  return match?.[1] || null;
}

function montarBloco(mensagens: string[], inicio: number, limite = 8) {
  const bloco: string[] = [];

  for (let i = inicio; i < Math.min(inicio + limite, mensagens.length); i++) {
    const atual = mensagens[i]?.trim();
    if (!atual) continue;
    bloco.push(atual);
  }

  return bloco;
}

function extrairRegistrosDaConversa(textoBruto: string): RegistroExtraido[] {
  const linhasOriginais = limparTexto(textoBruto)
    .split("\n")
    .map((l) => limparTexto(l))
    .filter((l) => !isLinhaIgnoravel(l));

  type Msg = {
    data: string | null;
    hora: string | null;
    autor: string | null;
    mensagem: string;
  };

  const mensagens: Msg[] = [];
  let atual: Msg | null = null;

  for (const linha of linhasOriginais) {
    const cabecalho = extrairCabecalhoWhatsapp(linha);

    if (cabecalho) {
      if (atual) mensagens.push(atual);

      atual = {
        data: cabecalho.data,
        hora: cabecalho.hora,
        autor: cabecalho.autor,
        mensagem: cabecalho.mensagem,
      };
    } else if (atual) {
      atual.mensagem += `\n${linha}`;
    }
  }

  if (atual) mensagens.push(atual);

  const registros: RegistroExtraido[] = [];

  for (let i = 0; i < mensagens.length; i++) {
    const msg = mensagens[i];
    const texto = msg.mensagem || "";
    const textoNorm = normalizarTextoComparacao(texto);
    const lojaDaMensagem = extrairLojaNumero(texto);

    const eLoja30 =
      lojaDaMensagem === "30" ||
      /att\s*[:\-]?\s*.*(?:loja|lj)\s*30/i.test(texto) ||
      /(?:loja|lj)\s*30/i.test(texto);

    const eConfirmacao = /confirma por favor|confirma por gentileza|confirmar por favor/i.test(texto);
    const eRespostaEnviaremos = /\benviaremos\b/i.test(texto);
    const req = extrairReq(texto);

    if (!eLoja30 && !eConfirmacao && !eRespostaEnviaremos && !req) {
      continue;
    }

    const bloco = montarBloco(
      mensagens.map((m) => m.mensagem),
      i,
      1
    );

    const linhas = texto
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let paciente: string | null = null;
    let formula: string[] = [];
    let telefone: string | null = extrairTelefone(texto);
    let cpf: string | null = extrairCPF(texto);
    let valor: number | null = extrairValor(texto);

    for (const linha of linhas) {
      if (!paciente && pareceNomePessoa(linha)) {
        paciente = linha;
      }

      if (pareceFormula(linha)) {
        formula.push(linha);
      }

      if (!telefone) telefone = extrairTelefone(linha);
      if (!cpf) cpf = extrairCPF(linha);
      if (valor === null) valor = extrairValor(linha);
    }

    if (!paciente) {
      const proximasLinhas = texto
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const candidato = proximasLinhas.find((l) => pareceNomePessoa(l));
      if (candidato) paciente = candidato;
    }

    const formulaDescricao = formula.length ? Array.from(new Set(formula)).join(" | ") : null;

    let tipo_registro: TipoRegistro = "pedido";
    let status: StatusRegistro = "pendente";
    let confirmado_em: string | null = null;

    if (eConfirmacao) {
      tipo_registro = "envio";
      status = "enviado";
    }

    if (eRespostaEnviaremos) {
      tipo_registro = "resposta";
      status = "confirmado";
      confirmado_em = `${msg.data || ""} ${msg.hora || ""}`.trim() || null;
    }

    if (req && !eConfirmacao && !eRespostaEnviaremos) {
      tipo_registro = "req";
      if (status === "pendente") status = "pendente";
    }

    registros.push({
      loja: "30",
      data_msg: msg.data,
      hora_msg: msg.hora,
      paciente,
      telefone,
      cpf,
      formula_descricao: formulaDescricao,
      req_numero: req,
      valor,
      status,
      tipo_registro,
      mensagem_original: bloco.join("\n"),
      confirmado_em,
    });
  }

  return vincularRespostas(registros);
}

function vincularRespostas(registros: RegistroExtraido[]) {
  const saida = registros.map((r) => ({ ...r }));

  for (let i = 0; i < saida.length; i++) {
    const atual = saida[i];

    if (atual.tipo_registro !== "envio") continue;

    let encontrouResposta = false;

    for (let j = i + 1; j < Math.min(i + 8, saida.length); j++) {
      const prox = saida[j];

      if (prox.tipo_registro === "resposta" && prox.status === "confirmado") {
        atual.status = "confirmado";
        atual.confirmado_em = prox.confirmado_em;
        encontrouResposta = true;
        break;
      }
    }

    if (!encontrouResposta) {
      atual.status = "sem_resposta";
    }
  }

  return saida;
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "green" | "yellow" | "red" | "blue";
}) {
  const styles: Record<string, string> = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

function CardResumo({
  titulo,
  valor,
  detalhe,
}: {
  titulo: string;
  valor: number;
  detalhe?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className="mt-1 text-2xl font-bold">{valor}</p>
      {detalhe ? <p className="mt-1 text-xs text-gray-500">{detalhe}</p> : null}
    </div>
  );
}

export default function ConfirmacoesPage() {
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [registrosSalvos, setRegistrosSalvos] = useState<RegistroBanco[]>([]);

  const registrosExtraidos = useMemo(() => {
    if (!texto.trim()) return [];
    return extrairRegistrosDaConversa(texto);
  }, [texto]);

  const resumo = useMemo(() => {
    const enviados = registrosExtraidos.filter((r) => r.tipo_registro === "envio").length;
    const confirmados = registrosExtraidos.filter((r) => r.status === "confirmado").length;
    const semResposta = registrosExtraidos.filter((r) => r.status === "sem_resposta").length;
    const comReq = registrosExtraidos.filter((r) => !!r.req_numero).length;

    return { enviados, confirmados, semResposta, comReq };
  }, [registrosExtraidos]);

  const registrosFiltrados = useMemo(() => {
    return registrosSalvos.filter((item) => {
      const textoBusca = busca.trim().toLowerCase();

      const matchBusca =
        !textoBusca ||
        item.paciente?.toLowerCase().includes(textoBusca) ||
        item.formula_descricao?.toLowerCase().includes(textoBusca) ||
        item.req_numero?.toLowerCase().includes(textoBusca) ||
        item.mensagem_original?.toLowerCase().includes(textoBusca);

      const matchStatus =
        filtroStatus === "todos" || item.status === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [registrosSalvos, busca, filtroStatus]);

  async function carregarRegistrosSalvos() {
    try {
      setCarregandoLista(true);

      const { data, error } = await supabase
        .from("manipulados_confirmacoes_itens")
        .select("*")
        .eq("loja", "30")
        .order("criado_em", { ascending: false })
        .limit(300);

      if (error) throw error;

      setRegistrosSalvos((data || []) as RegistroBanco[]);
    } catch (error: any) {
      setMensagem(error.message || "Erro ao carregar registros salvos.");
    } finally {
      setCarregandoLista(false);
    }
  }

  async function salvarNoBanco() {
    if (!texto.trim()) {
      setMensagem("Cole a conversa antes de salvar.");
      return;
    }

    if (!registrosExtraidos.length) {
      setMensagem("Nenhum registro relevante foi encontrado.");
      return;
    }

    try {
      setSalvando(true);
      setMensagem("");

      const { data: importacao, error: erroImportacao } = await supabase
        .from("manipulados_confirmacoes_importacoes")
        .insert({
          loja: "30",
          nome_arquivo: nomeArquivo || "conversa-colada-whatsapp.txt",
          conteudo_bruto: texto,
        })
        .select("id")
        .single();

      if (erroImportacao) throw erroImportacao;
      if (!importacao?.id) throw new Error("Não foi possível criar a importação.");

      const payload = registrosExtraidos.map((item) => ({
        importacao_id: importacao.id,
        loja: item.loja,
        data_msg: item.data_msg,
        hora_msg: item.hora_msg,
        paciente: item.paciente,
        telefone: item.telefone,
        cpf: item.cpf,
        formula_descricao: item.formula_descricao,
        req_numero: item.req_numero,
        valor: item.valor,
        status: item.status,
        tipo_registro: item.tipo_registro,
        mensagem_original: item.mensagem_original,
        confirmado_em: item.confirmado_em,
      }));

      const { error: erroItens } = await supabase
        .from("manipulados_confirmacoes_itens")
        .insert(payload);

      if (erroItens) throw erroItens;

      setMensagem(`Importação concluída com ${payload.length} registros.`);
      carregarRegistrosSalvos();
    } catch (error: any) {
      setMensagem(error.message || "Erro ao salvar importação.");
    } finally {
      setSalvando(false);
    }
  }

  function aoLerArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setNomeArquivo(arquivo.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const conteudo = String(e.target?.result || "");
      setTexto(conteudo);
    };
    reader.readAsText(arquivo, "utf-8");
  }

  useEffect(() => {
    carregarRegistrosSalvos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Manipulados • Confirmações
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Módulo isolado para importar e organizar confirmações da Loja 30 sem mexer no restante do sistema.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="blue">Loja 30</Badge>
              <Badge>WhatsApp</Badge>
              <Badge variant="green">Módulo isolado</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <CardResumo titulo="Enviados" valor={resumo.enviados} />
          <CardResumo titulo="Confirmados" valor={resumo.confirmados} />
          <CardResumo titulo="Sem resposta" valor={resumo.semResposta} />
          <CardResumo titulo="Com REQ" valor={resumo.comReq} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Importar conversa</h2>
              <p className="text-sm text-gray-500">
                Cole o texto exportado do WhatsApp ou envie um arquivo .txt.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={nomeArquivo}
                onChange={(e) => setNomeArquivo(e.target.value)}
                placeholder="Nome do arquivo ou referência"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />

              <input
                type="file"
                accept=".txt"
                onChange={aoLerArquivo}
                className="w-full rounded-2xl border px-4 py-3 text-sm"
              />

              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Cole aqui a conversa exportada do WhatsApp..."
                className="min-h-[320px] w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={salvarNoBanco}
                  disabled={salvando || !texto.trim() || registrosExtraidos.length === 0}
                  className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Salvar no banco"}
                </button>

                <button
                  onClick={carregarRegistrosSalvos}
                  disabled={carregandoLista}
                  className="rounded-2xl border px-5 py-3 text-sm font-medium"
                >
                  {carregandoLista ? "Atualizando..." : "Atualizar lista"}
                </button>
              </div>

              {mensagem ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  {mensagem}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Prévia extraída</h2>
              <p className="text-sm text-gray-500">
                O sistema identifica envios, respostas, REQ e dados do paciente.
              </p>
            </div>

            <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
              {!registrosExtraidos.length ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-gray-500">
                  Nenhum registro extraído ainda.
                </div>
              ) : (
                registrosExtraidos.slice(0, 40).map((item, idx) => (
                  <div key={`${item.req_numero}-${idx}`} className="rounded-2xl border p-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge variant="blue">Loja {item.loja}</Badge>

                      <Badge
                        variant={
                          item.tipo_registro === "envio"
                            ? "yellow"
                            : item.tipo_registro === "resposta"
                            ? "green"
                            : item.tipo_registro === "req"
                            ? "blue"
                            : "default"
                        }
                      >
                        {item.tipo_registro}
                      </Badge>

                      <Badge
                        variant={
                          item.status === "confirmado"
                            ? "green"
                            : item.status === "sem_resposta"
                            ? "red"
                            : item.status === "enviado"
                            ? "yellow"
                            : "default"
                        }
                      >
                        {item.status}
                      </Badge>

                      {item.req_numero ? <Badge>REQ {item.req_numero}</Badge> : null}
                    </div>

                    <div className="grid gap-1 text-sm">
                      <p><strong>Data:</strong> {item.data_msg || "-"}</p>
                      <p><strong>Hora:</strong> {item.hora_msg || "-"}</p>
                      <p><strong>Paciente:</strong> {item.paciente || "-"}</p>
                      <p><strong>Telefone:</strong> {item.telefone || "-"}</p>
                      <p><strong>CPF:</strong> {item.cpf || "-"}</p>
                      <p><strong>Fórmula:</strong> {item.formula_descricao || "-"}</p>
                      <p><strong>Valor:</strong> {formatarMoeda(item.valor)}</p>
                      <p><strong>Confirmado em:</strong> {item.confirmado_em || "-"}</p>
                    </div>

                    <pre className="mt-3 overflow-auto rounded-2xl bg-gray-50 p-3 text-xs whitespace-pre-wrap">
                      {item.mensagem_original}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Registros salvos</h2>
              <p className="text-sm text-gray-500">
                Últimos registros salvos da Loja 30.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar paciente, fórmula, REQ..."
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="todos">Todos</option>
                <option value="confirmado">Confirmado</option>
                <option value="sem_resposta">Sem resposta</option>
                <option value="enviado">Enviado</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>

          <div className="overflow-auto rounded-2xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border-b px-3 py-3 text-left font-semibold">Data</th>
                  <th className="border-b px-3 py-3 text-left font-semibold">Hora</th>
                  <th className="border-b px-3 py-3 text-left font-semibold">Paciente</th>
                  <th className="border-b px-3 py-3 text-left font-semibold">Fórmula</th>
                  <th className="border-b px-3 py-3 text-left font-semibold">REQ</th>
                  <th className="border-b px-3 py-3 text-left font-semibold">Valor</th>
                  <th className="border-b px-3 py-3 text-left font-semibold">Tipo</th>
                  <th className="border-b px-3 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {carregandoLista ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : registrosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                      Nenhum registro salvo encontrado.
                    </td>
                  </tr>
                ) : (
                  registrosFiltrados.map((item) => (
                    <tr key={item.id} className="odd:bg-white even:bg-gray-50/50">
                      <td className="border-b px-3 py-3">{item.data_msg || "-"}</td>
                      <td className="border-b px-3 py-3">{item.hora_msg || "-"}</td>
                      <td className="border-b px-3 py-3">{item.paciente || "-"}</td>
                      <td className="border-b px-3 py-3">{item.formula_descricao || "-"}</td>
                      <td className="border-b px-3 py-3">{item.req_numero || "-"}</td>
                      <td className="border-b px-3 py-3">{formatarMoeda(item.valor)}</td>
                      <td className="border-b px-3 py-3">{item.tipo_registro || "-"}</td>
                      <td className="border-b px-3 py-3">
                        <Badge
                          variant={
                            item.status === "confirmado"
                              ? "green"
                              : item.status === "sem_resposta"
                              ? "red"
                              : item.status === "enviado"
                              ? "yellow"
                              : "default"
                          }
                        >
                          {item.status || "-"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}