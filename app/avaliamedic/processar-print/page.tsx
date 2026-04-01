"use client";

import { useState } from "react";

type ApiResponse = {
  ok: boolean;
  mensagem?: string;
  cliente?: any;
  orcamento?: any;
  error?: string;
};

export default function ProcessarPrintPage() {
  const [clienteImage, setClienteImage] = useState<File | null>(null);
  const [orcamentoImage, setOrcamentoImage] = useState<File | null>(null);

  const [conversaTexto, setConversaTexto] = useState("");
  const [orcamentoTexto, setOrcamentoTexto] = useState("");

  const [lojaNome, setLojaNome] = useState("Drogaria Leste");
  const [atendenteNome, setAtendenteNome] = useState("Fernando");
  const [telefoneCliente, setTelefoneCliente] = useState("");

  const [loading, setLoading] = useState(false);
  const [sendingWhats, setSendingWhats] = useState(false);
  const [loadingContinuacao, setLoadingContinuacao] = useState(false);

  const [result, setResult] = useState<ApiResponse | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [statusEnvio, setStatusEnvio] = useState("");

  const [novaMensagemCliente, setNovaMensagemCliente] = useState("");
  const [respostaContinuacao, setRespostaContinuacao] = useState("");
  const [copiadoContinuacao, setCopiadoContinuacao] = useState(false);
  const [statusEnvioContinuacao, setStatusEnvioContinuacao] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setStatusEnvio("");
    setCopiado(false);
    setRespostaContinuacao("");
    setStatusEnvioContinuacao("");
    setCopiadoContinuacao(false);

    try {
      const fd = new FormData();

      if (clienteImage) fd.append("clienteImage", clienteImage);
      if (orcamentoImage) fd.append("orcamentoImage", orcamentoImage);

      fd.append("conversaTexto", conversaTexto);
      fd.append("orcamentoTexto", orcamentoTexto);
      fd.append("lojaNome", lojaNome);
      fd.append("atendenteNome", atendenteNome);

      const res = await fetch("/avaliamedic/api/processar-print", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      setResult(json);
    } catch (error: any) {
      setResult({
        ok: false,
        error: error?.message || "Erro ao processar.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function copiarMensagem() {
    if (!result?.mensagem) return;
    await navigator.clipboard.writeText(result.mensagem);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  async function copiarContinuacao() {
    if (!respostaContinuacao) return;
    await navigator.clipboard.writeText(respostaContinuacao);
    setCopiadoContinuacao(true);
    setTimeout(() => setCopiadoContinuacao(false), 1800);
  }

  async function enviarWhatsApp() {
    if (!result?.mensagem || !telefoneCliente.trim()) {
      setStatusEnvio("Informe o telefone do cliente.");
      return;
    }

    setSendingWhats(true);
    setStatusEnvio("");

    try {
      const res = await fetch("/avaliamedic/api/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: telefoneCliente,
          message: result.mensagem,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Falha ao enviar no WhatsApp.");
      }

      setStatusEnvio("Mensagem enviada com sucesso.");
    } catch (error: any) {
      setStatusEnvio(error?.message || "Erro ao enviar mensagem.");
    } finally {
      setSendingWhats(false);
    }
  }

  async function enviarContinuacaoWhatsApp() {
    if (!respostaContinuacao || !telefoneCliente.trim()) {
      setStatusEnvioContinuacao("Informe o telefone do cliente.");
      return;
    }

    setSendingWhats(true);
    setStatusEnvioContinuacao("");

    try {
      const res = await fetch("/avaliamedic/api/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: telefoneCliente,
          message: respostaContinuacao,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Falha ao enviar no WhatsApp.");
      }

      setStatusEnvioContinuacao("Continuação enviada com sucesso.");
    } catch (error: any) {
      setStatusEnvioContinuacao(
        error?.message || "Erro ao enviar continuação."
      );
    } finally {
      setSendingWhats(false);
    }
  }

  async function gerarContinuacao() {
    if (!result?.mensagem || !result?.cliente || !result?.orcamento) {
      setStatusEnvioContinuacao("Gere primeiro a resposta principal.");
      return;
    }

    if (!novaMensagemCliente.trim()) {
      setStatusEnvioContinuacao("Cole a nova mensagem do cliente.");
      return;
    }

    setLoadingContinuacao(true);
    setRespostaContinuacao("");
    setStatusEnvioContinuacao("");
    setCopiadoContinuacao(false);

    try {
      const res = await fetch("/avaliamedic/api/processar-print/continuar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lojaNome,
          atendenteNome,
          cliente: result.cliente,
          orcamento: result.orcamento,
          mensagemAnterior: result.mensagem,
          novaMensagemCliente,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Erro ao gerar continuação.");
      }

      setRespostaContinuacao(json.mensagem || "");
    } catch (error: any) {
      setStatusEnvioContinuacao(
        error?.message || "Erro ao gerar continuação."
      );
    } finally {
      setLoadingContinuacao(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-bold text-emerald-700">
        AvaliaMedic — Modo Comercial IA
      </h1>

      <p className="mt-2 text-sm text-neutral-600">
        Você pode enviar imagens ou colar os textos. Se colar texto, o sistema
        prioriza o texto ao invés do print.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 rounded-2xl border bg-white p-4 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Nome da loja</label>
            <input
              value={lojaNome}
              onChange={(e) => setLojaNome(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Atendente</label>
            <input
              value={atendenteNome}
              onChange={(e) => setAtendenteNome(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Telefone do cliente
            </label>
            <input
              value={telefoneCliente}
              onChange={(e) => setTelefoneCliente(e.target.value)}
              placeholder="5511999999999"
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <h2 className="mb-3 text-lg font-semibold text-emerald-700">
              Cliente / Receita
            </h2>

            <label className="mb-2 block text-sm font-medium">
              Colar conversa ou texto da receita
            </label>
            <textarea
              value={conversaTexto}
              onChange={(e) => setConversaTexto(e.target.value)}
              placeholder="Cole aqui a conversa inteira do WhatsApp ou o texto da receita..."
              className="min-h-[220px] w-full rounded-xl border p-3"
            />

            <label className="mb-2 mt-4 block text-sm font-medium">
              Ou enviar print / foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setClienteImage(e.target.files?.[0] || null)}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div className="rounded-2xl border p-4">
            <h2 className="mb-3 text-lg font-semibold text-emerald-700">
              Orçamento
            </h2>

            <label className="mb-2 block text-sm font-medium">
              Colar orçamento em texto
            </label>
            <textarea
              value={orcamentoTexto}
              onChange={(e) => setOrcamentoTexto(e.target.value)}
              placeholder="Cole aqui o orçamento copiado do sistema..."
              className="min-h-[220px] w-full rounded-xl border p-3"
            />

            <label className="mb-2 mt-4 block text-sm font-medium">
              Ou enviar print do orçamento
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setOrcamentoImage(e.target.files?.[0] || null)}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-emerald-700 px-4 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Processando..." : "Gerar resposta automática"}
        </button>
      </form>

      {result && !result.ok && (
        <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">
          {result.error || "Erro ao processar."}
        </div>
      )}

      {result?.ok && (
        <section className="mt-6 grid gap-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Mensagem pronta</h2>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copiarMensagem}
                  className="rounded-xl border px-3 py-2 text-sm"
                  type="button"
                >
                  {copiado ? "Copiado!" : "Copiar resposta"}
                </button>

                <button
                  onClick={enviarWhatsApp}
                  disabled={sendingWhats}
                  className="rounded-xl bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-50"
                  type="button"
                >
                  {sendingWhats ? "Enviando..." : "Enviar no WhatsApp"}
                </button>
              </div>
            </div>

            <textarea
              value={result.mensagem || ""}
              readOnly
              className="min-h-[320px] w-full rounded-xl border p-3"
            />

            {statusEnvio ? (
              <p className="mt-3 text-sm text-neutral-600">{statusEnvio}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-emerald-700">
              Modo Conversa
            </h2>

            <label className="mb-2 block text-sm font-medium">
              Nova mensagem do cliente
            </label>
            <textarea
              value={novaMensagemCliente}
              onChange={(e) => setNovaMensagemCliente(e.target.value)}
              placeholder='Ex.: "Tem mais barato?", "Tem entrega?", "Precisa mesmo desse?", "Posso retirar mais tarde?"'
              className="min-h-[140px] w-full rounded-xl border p-3"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={gerarContinuacao}
                disabled={loadingContinuacao}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {loadingContinuacao
                  ? "Gerando continuação..."
                  : "Gerar resposta da continuação"}
              </button>

              <button
                type="button"
                onClick={copiarContinuacao}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                {copiadoContinuacao ? "Copiado!" : "Copiar continuação"}
              </button>

              <button
                type="button"
                onClick={enviarContinuacaoWhatsApp}
                disabled={sendingWhats || !respostaContinuacao}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {sendingWhats ? "Enviando..." : "Enviar continuação"}
              </button>
            </div>

            <textarea
              value={respostaContinuacao}
              readOnly
              className="mt-4 min-h-[220px] w-full rounded-xl border p-3"
              placeholder="A continuação da conversa vai aparecer aqui..."
            />

            {statusEnvioContinuacao ? (
              <p className="mt-3 text-sm text-neutral-600">
                {statusEnvioContinuacao}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="mb-2 font-semibold text-emerald-700">
                Extração do cliente
              </h3>
              <pre className="overflow-auto text-xs">
                {JSON.stringify(result.cliente, null, 2)}
              </pre>
            </div>

            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="mb-2 font-semibold text-emerald-700">
                Extração do orçamento
              </h3>
              <pre className="overflow-auto text-xs">
                {JSON.stringify(result.orcamento, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}