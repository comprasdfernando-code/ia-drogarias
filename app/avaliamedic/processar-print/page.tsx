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
    const [itemAdicionalNome, setItemAdicionalNome] = useState("");
  const [itemAdicionalValor, setItemAdicionalValor] = useState("");
  const [itemAdicionalQuantidade, setItemAdicionalQuantidade] = useState("1");
  const [respostaContinuacaoComItem, setRespostaContinuacaoComItem] = useState("");
  const [copiadoContinuacaoComItem, setCopiadoContinuacaoComItem] = useState(false);
  const [statusEnvioContinuacaoComItem, setStatusEnvioContinuacaoComItem] = useState("");
  const [loadingContinuacaoComItem, setLoadingContinuacaoComItem] = useState(false);

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
    async function copiarContinuacaoComItem() {
    if (!respostaContinuacaoComItem) return;
    await navigator.clipboard.writeText(respostaContinuacaoComItem);
    setCopiadoContinuacaoComItem(true);
    setTimeout(() => setCopiadoContinuacaoComItem(false), 1800);
  }

  async function enviarContinuacaoComItemWhatsApp() {
    if (!respostaContinuacaoComItem || !telefoneCliente.trim()) {
      setStatusEnvioContinuacaoComItem("Informe o telefone do cliente.");
      return;
    }

    setSendingWhats(true);
    setStatusEnvioContinuacaoComItem("");

    try {
      const res = await fetch("/avaliamedic/api/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: telefoneCliente,
          message: respostaContinuacaoComItem,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Falha ao enviar continuação com item.");
      }

      setStatusEnvioContinuacaoComItem("Continuação com item enviada com sucesso.");
    } catch (error: any) {
      setStatusEnvioContinuacaoComItem(
        error?.message || "Erro ao enviar continuação com item."
      );
    } finally {
      setSendingWhats(false);
    }
  }

  async function gerarContinuacaoComItem() {
    if (!result?.mensagem || !result?.cliente || !result?.orcamento) {
      setStatusEnvioContinuacaoComItem("Gere primeiro a resposta principal.");
      return;
    }

    if (!novaMensagemCliente.trim()) {
      setStatusEnvioContinuacaoComItem("Cole a nova mensagem do cliente.");
      return;
    }

    if (!itemAdicionalNome.trim()) {
      setStatusEnvioContinuacaoComItem("Informe o nome do item adicional.");
      return;
    }

    const valor = Number(String(itemAdicionalValor).replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      setStatusEnvioContinuacaoComItem("Informe um valor válido para o item adicional.");
      return;
    }

    setLoadingContinuacaoComItem(true);
    setRespostaContinuacaoComItem("");
    setStatusEnvioContinuacaoComItem("");
    setCopiadoContinuacaoComItem(false);

    try {
      const res = await fetch("/avaliamedic/api/processar-print/continuar-com-item", {
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
          itemAdicionalNome,
          itemAdicionalValor: valor,
          itemAdicionalQuantidade: Number(itemAdicionalQuantidade || 1),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Erro ao gerar continuação com item.");
      }

      setRespostaContinuacaoComItem(json.mensagem || "");
    } catch (error: any) {
      setStatusEnvioContinuacaoComItem(
        error?.message || "Erro ao gerar continuação com item."
      );
    } finally {
      setLoadingContinuacaoComItem(false);
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
                      <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-emerald-700">
              Modo Conversa 2.0 — Adicionar item
            </h2>

            <p className="mb-4 text-sm text-neutral-600">
              Use quando o cliente pedir mais um item no meio da conversa e você já souber o valor.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Item adicional
                </label>
                <input
                  value={itemAdicionalNome}
                  onChange={(e) => setItemAdicionalNome(e.target.value)}
                  placeholder="Ex.: Dipirona gotas"
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Valor do item
                </label>
                <input
                  value={itemAdicionalValor}
                  onChange={(e) => setItemAdicionalValor(e.target.value)}
                  placeholder="Ex.: 12,90"
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Quantidade
                </label>
                <input
                  value={itemAdicionalQuantidade}
                  onChange={(e) => setItemAdicionalQuantidade(e.target.value)}
                  placeholder="1"
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={gerarContinuacaoComItem}
                disabled={loadingContinuacaoComItem}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {loadingContinuacaoComItem
                  ? "Gerando continuação com item..."
                  : "Gerar continuação com novo total"}
              </button>

              <button
                type="button"
                onClick={copiarContinuacaoComItem}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                {copiadoContinuacaoComItem ? "Copiado!" : "Copiar continuação 2.0"}
              </button>

              <button
                type="button"
                onClick={enviarContinuacaoComItemWhatsApp}
                disabled={sendingWhats || !respostaContinuacaoComItem}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {sendingWhats ? "Enviando..." : "Enviar continuação 2.0"}
              </button>
            </div>

            <textarea
              value={respostaContinuacaoComItem}
              readOnly
              className="mt-4 min-h-[240px] w-full rounded-xl border p-3"
              placeholder="A continuação com item adicional e total atualizado vai aparecer aqui..."
            />

            {statusEnvioContinuacaoComItem ? (
              <p className="mt-3 text-sm text-neutral-600">
                {statusEnvioContinuacaoComItem}
              </p>
            ) : null}
          </div>

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