"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOJA = "Droga Leste 30";
const WHATSAPP_LOJA = "11953996537";
const WHATSAPP_MANIPULACAO = "5511999999999"; // TROCAR PELO NÚMERO REAL

type Pedido = {
  id: string;
  loja: string;
  req: string | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_endereco: string | null;
  tipo_recebimento: string | null;
  formula: string;
  apresentacao: string;
  observacoes: string | null;
  observacao_interna: string | null;
  valor: number | null;
  pago: boolean;
  status: string;
  solicitado_por: string | null;
  recebido_por: string | null;
  dispensado_por: string | null;
  receita_url: string | null;
  comprovante_url: string | null;
  data_solicitacao: string | null;
  data_recebimento: string | null;
  data_disponivel_retirada: string | null;
  data_dispensa: string | null;
};

function limparTelefone(telefone?: string | null) {
  return (telefone || "").replace(/\D/g, "");
}

function telefoneCom55(telefone?: string | null) {
  const limpo = limparTelefone(telefone);
  if (!limpo) return "";
  return limpo.startsWith("55") ? limpo : `55${limpo}`;
}

function statusLabel(status: string) {
  switch (status) {
    case "solicitado_manipulacao":
      return "Solicitado";
    case "em_producao":
      return "Em produção";
    case "chegou_loja":
      return "Chegou na loja";
    case "disponivel_retirada":
      return "Disponível para retirada";
    case "retirado":
      return "Retirado";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
}

function tipoRecebimentoLabel(tipo?: string | null) {
  switch (tipo) {
    case "entrega":
      return "Entrega";
    case "retirada":
      return "Retirada na loja";
    default:
      return "-";
  }
}

function isPdf(url?: string | null) {
  return !!url && url.toLowerCase().includes(".pdf");
}

export default function DetalheManipuladoPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [acaoLoading, setAcaoLoading] = useState(false);

  const [novaReceita, setNovaReceita] = useState<File | null>(null);
  const [uploadingReceita, setUploadingReceita] = useState(false);

  const [novoComprovante, setNovoComprovante] = useState<File | null>(null);
  const [uploadingComprovante, setUploadingComprovante] = useState(false);

  async function carregarPedido() {
    setLoading(true);

    const { data, error } = await supabase
      .from("manipulados_pedidos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      alert("Erro ao carregar pedido.");
    } else {
      setPedido(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (id) carregarPedido();
  }, [id]);

  async function atualizarCampos(campos: Partial<Pedido>) {
    if (!pedido) return;

    setAcaoLoading(true);

    const { error } = await supabase
      .from("manipulados_pedidos")
      .update(campos)
      .eq("id", pedido.id);

    if (error) {
      console.error(error);
      alert("Erro ao atualizar pedido.");
    } else {
      await carregarPedido();
    }

    setAcaoLoading(false);
  }

  async function uploadArquivo(bucket: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const nomeArquivo = `drogaleste30/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(nomeArquivo, file, {
        upsert: false,
      });

    if (error) throw error;
    return data.path;
  }

  async function marcarEmProducao() {
    await atualizarCampos({
      status: "em_producao",
    });
  }

  async function marcarChegouLoja() {
    const recebidoPor = window.prompt("Quem recebeu a fórmula na loja?") || "";
    if (!recebidoPor.trim()) return;

    await atualizarCampos({
      status: "chegou_loja",
      recebido_por: recebidoPor,
      data_recebimento: new Date().toISOString(),
    });
  }

  async function marcarDisponivel() {
    await atualizarCampos({
      status: "disponivel_retirada",
      data_disponivel_retirada: new Date().toISOString(),
    });
  }

  async function marcarRetirado() {
    const dispensadoPor = window.prompt("Quem dispensou para o cliente?") || "";
    if (!dispensadoPor.trim()) return;

    await atualizarCampos({
      status: "retirado",
      dispensado_por: dispensadoPor,
      data_dispensa: new Date().toISOString(),
    });
  }

  async function alternarPago() {
    if (!pedido) return;

    await atualizarCampos({
      pago: !pedido.pago,
    });
  }

  async function anexarReceita() {
    if (!pedido || !novaReceita) return;

    try {
      setUploadingReceita(true);

      const path = await uploadArquivo("receitas-manipulados", novaReceita);

      const { error } = await supabase
        .from("manipulados_pedidos")
        .update({ receita_url: path })
        .eq("id", pedido.id);

      if (error) throw error;

      setNovaReceita(null);
      await carregarPedido();
      alert("Receita anexada com sucesso.");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro ao anexar receita.");
    } finally {
      setUploadingReceita(false);
    }
  }

  async function anexarComprovante() {
    if (!pedido || !novoComprovante) return;

    try {
      setUploadingComprovante(true);

      const path = await uploadArquivo(
        "comprovantes-manipulados",
        novoComprovante
      );

      const { error } = await supabase
        .from("manipulados_pedidos")
        .update({ comprovante_url: path })
        .eq("id", pedido.id);

      if (error) throw error;

      setNovoComprovante(null);
      await carregarPedido();
      alert("Comprovante anexado com sucesso.");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro ao anexar comprovante.");
    } finally {
      setUploadingComprovante(false);
    }
  }

  const receitaUrl = useMemo(() => {
    if (!pedido?.receita_url) return null;

    const { data } = supabase.storage
      .from("receitas-manipulados")
      .getPublicUrl(pedido.receita_url);

    return data?.publicUrl || null;
  }, [pedido?.receita_url]);

  const comprovanteUrl = useMemo(() => {
    if (!pedido?.comprovante_url) return null;

    const { data } = supabase.storage
      .from("comprovantes-manipulados")
      .getPublicUrl(pedido.comprovante_url);

    return data?.publicUrl || null;
  }, [pedido?.comprovante_url]);

  const whatsappClienteLink = useMemo(() => {
    if (!pedido?.cliente_telefone) return null;

    const telefone = telefoneCom55(pedido.cliente_telefone);
    if (!telefone) return null;

    const mensagem = encodeURIComponent(
      `Olá ${pedido.cliente_nome}, seu manipulado está pronto para ${
        pedido.tipo_recebimento === "entrega" ? "entrega" : "retirada"
      } na ${LOJA}.\n\nREQ: ${pedido.req || "-"}\nFórmula: ${
        pedido.formula
      }\nApresentação: ${pedido.apresentacao}\n\nWhatsApp da loja: ${WHATSAPP_LOJA}`
    );

    return `https://wa.me/${telefone}?text=${mensagem}`;
  }, [pedido]);

  const whatsappManipulacaoLink = useMemo(() => {
    if (!pedido) return null;

    const mensagem = encodeURIComponent(
      `CONFIRMAÇÃO DE PEDIDO MANIPULADO\n\nREQ: ${
        pedido.req || "-"
      }\nCliente: ${pedido.cliente_nome}\nWhats: ${
        pedido.cliente_telefone || "-"
      }\nForma de recebimento: ${tipoRecebimentoLabel(
        pedido.tipo_recebimento
      )}\nEndereço: ${pedido.cliente_endereco || "-"}\n\nFórmula: ${
        pedido.formula
      }\nApresentação: ${pedido.apresentacao}\n\nSolicitado pela loja: ${
        pedido.loja
      }`
    );

    return `https://wa.me/${WHATSAPP_MANIPULACAO}?text=${mensagem}`;
  }, [pedido]);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!pedido) {
    return <div className="p-6">Pedido não encontrado.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedido manipulado</h1>
          <p className="text-sm text-gray-500">{LOJA}</p>
        </div>

        <Link
          href="/manipulados/drogaleste30/admin/manipulados"
          className="rounded-xl border px-4 py-2"
        >
          Voltar
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Dados do paciente</h2>
          <div className="space-y-2 text-sm">
            <p><strong>REQ:</strong> {pedido.req || "-"}</p>
            <p><strong>Cliente:</strong> {pedido.cliente_nome}</p>
            <p><strong>Telefone:</strong> {pedido.cliente_telefone || "-"}</p>
            <p><strong>Forma de recebimento:</strong> {tipoRecebimentoLabel(pedido.tipo_recebimento)}</p>
            <p><strong>Endereço:</strong> {pedido.cliente_endereco || "-"}</p>
            <p><strong>Loja:</strong> {pedido.loja}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Dados da fórmula</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Fórmula:</strong> {pedido.formula}</p>
            <p><strong>Apresentação:</strong> {pedido.apresentacao}</p>
            <p><strong>Valor:</strong> R$ {Number(pedido.valor || 0).toFixed(2)}</p>
            <p><strong>Pago:</strong> {pedido.pago ? "Sim" : "Não"}</p>
            <p><strong>Status:</strong> {statusLabel(pedido.status)}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Responsáveis</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Solicitado por:</strong> {pedido.solicitado_por || "-"}</p>
            <p><strong>Recebido por:</strong> {pedido.recebido_por || "-"}</p>
            <p><strong>Dispensado por:</strong> {pedido.dispensado_por || "-"}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Datas</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Solicitação:</strong> {pedido.data_solicitacao || "-"}</p>
            <p><strong>Recebimento:</strong> {pedido.data_recebimento || "-"}</p>
            <p><strong>Disponível:</strong> {pedido.data_disponivel_retirada || "-"}</p>
            <p><strong>Dispensa:</strong> {pedido.data_dispensa || "-"}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Observações</h2>
          <div className="space-y-3 text-sm">
            <p><strong>Observações:</strong> {pedido.observacoes || "-"}</p>
            <p><strong>Observação interna:</strong> {pedido.observacao_interna || "-"}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Receita</h2>

          {receitaUrl ? (
            <div className="space-y-4">
              <a
                href={receitaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-xl border px-4 py-2 text-blue-600"
              >
                Abrir receita
              </a>

              {isPdf(receitaUrl) ? (
                <div className="rounded-xl border p-4 text-sm text-gray-600">
                  Arquivo em PDF. Clique em “Abrir receita”.
                </div>
              ) : (
                <img
                  src={receitaUrl}
                  alt="Receita"
                  className="max-h-[420px] rounded-xl border object-contain"
                />
              )}
            </div>
          ) : (
            <p className="mb-4 text-sm text-gray-500">Nenhuma receita anexada.</p>
          )}

          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded-xl border p-3"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setNovaReceita(e.target.files?.[0] || null)}
            />

            <button
              onClick={anexarReceita}
              disabled={!novaReceita || uploadingReceita}
              className="rounded-xl bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
            >
              {uploadingReceita ? "Enviando..." : "Anexar receita"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Comprovante de pagamento</h2>

          {comprovanteUrl ? (
            <div className="space-y-4">
              <a
                href={comprovanteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-xl border px-4 py-2 text-blue-600"
              >
                Abrir comprovante
              </a>

              {isPdf(comprovanteUrl) ? (
                <div className="rounded-xl border p-4 text-sm text-gray-600">
                  Arquivo em PDF. Clique em “Abrir comprovante”.
                </div>
              ) : (
                <img
                  src={comprovanteUrl}
                  alt="Comprovante"
                  className="max-h-[420px] rounded-xl border object-contain"
                />
              )}
            </div>
          ) : (
            <p className="mb-4 text-sm text-gray-500">
              Nenhum comprovante anexado.
            </p>
          )}

          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded-xl border p-3"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setNovoComprovante(e.target.files?.[0] || null)}
            />

            <button
              onClick={anexarComprovante}
              disabled={!novoComprovante || uploadingComprovante}
              className="rounded-xl bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
            >
              {uploadingComprovante ? "Enviando..." : "Anexar comprovante"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Ações</h2>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={marcarEmProducao}
            disabled={acaoLoading}
            className="rounded-xl bg-yellow-500 px-4 py-2 text-white disabled:opacity-50"
          >
            Em produção
          </button>

          <button
            onClick={marcarChegouLoja}
            disabled={acaoLoading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Chegou na loja
          </button>

          <button
            onClick={marcarDisponivel}
            disabled={acaoLoading}
            className="rounded-xl bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Disponível para retirada
          </button>

          {whatsappClienteLink && (
            <a
              href={whatsappClienteLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-emerald-700 px-4 py-2 text-white"
            >
              Avisar cliente no WhatsApp
            </a>
          )}

          {whatsappManipulacaoLink && (
            <a
              href={whatsappManipulacaoLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-orange-600 px-4 py-2 text-white"
            >
              Enviar confirmação p/ manipulação
            </a>
          )}

          <Link
            href={`/manipulados/drogaleste30/admin/manipulados/${pedido.id}/nota`}
            className="rounded-xl bg-slate-700 px-4 py-2 text-white"
          >
            Gerar nota de entrega
          </Link>

          <button
            onClick={marcarRetirado}
            disabled={acaoLoading}
            className="rounded-xl bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Cliente retirou
          </button>

          <button
            onClick={alternarPago}
            disabled={acaoLoading}
            className="rounded-xl bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
          >
            {pedido.pago ? "Marcar como não pago" : "Marcar como pago"}
          </button>
        </div>
      </div>
    </div>
  );
}