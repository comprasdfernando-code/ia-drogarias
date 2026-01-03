"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Pagamento = "pix" | "cartao" | "dinheiro" | "vr";
type TipoEntrega = "retirada" | "entrega";

type Cliente = {
  nome: string;
  telefone: string;
  endereco: string;
};

type ItemCarrinho = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number; // unidade OU kg (ex: 0.850)
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ✅ Se tiver decimal (0.850) tratamos como KG (MVP)
// (para itens por unidade a quantidade normalmente é 1,2,3...)
function isKgItem(qtd: number) {
  return Math.abs(qtd - Math.round(qtd)) > 0.0001;
}

function formatQtd(qtd: number) {
  if (isKgItem(qtd)) {
    // 0.850 -> "0,850 kg"
    return `${qtd.toFixed(3).replace(".", ",")} kg`;
  }
  return `${qtd}x`;
}

export default function CarrinhoModal({
  aberto,
  setAberto,
  carrinho,
}: {
  aberto: boolean;
  setAberto: (v: boolean) => void;
  carrinho: ItemCarrinho[];
}) {
  if (!aberto) return null;

  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("retirada");

  const [cliente, setCliente] = useState<Cliente>({
    nome: "",
    telefone: "",
    endereco: "",
  });

  const [pagamento, setPagamento] = useState<Pagamento>("pix");
  const [trocoPara, setTrocoPara] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(() => {
    return carrinho.reduce(
      (s, i) => s + Number(i.preco || 0) * Number(i.quantidade || 0),
      0
    );
  }, [carrinho]);

  // ✅ contagem “de itens” do jeito humano:
  // unidade soma quantidade inteira, kg conta como 1 item
  const qtdItens = useMemo(() => {
    return carrinho.reduce((s, i) => {
      const q = Number(i.quantidade || 0);
      return s + (isKgItem(q) ? 1 : q);
    }, 0);
  }, [carrinho]);

  // ✅ MVP: frete 0 no sistema e "a calcular" no texto quando entrega
  const frete = 0;
  const total = subtotal + frete;

  const pagamentoTexto =
    pagamento === "pix"
      ? "Pix"
      : pagamento === "cartao"
      ? "Cartão"
      : pagamento === "dinheiro"
      ? `Dinheiro${trocoPara ? ` (troco para R$ ${trocoPara})` : ""}`
      : "VR/VA";

  // ✅ Nome e WhatsApp obrigatórios em qualquer tipo (retirada/entrega)
  const clienteOk = cliente.nome.trim() && cliente.telefone.trim();

  // ✅ Endereço obrigatório só na entrega
  const entregaOk = tipoEntrega === "retirada" || cliente.endereco.trim();

  const podeFinalizar = carrinho.length > 0 && !!clienteOk && !!entregaOk;

  function montarMensagemWhatsApp(pedidoId?: string) {
    const itens = carrinho
      .map((i) => {
        const qtd = Number(i.quantidade);
        const sub = Number(i.preco) * qtd;

        // ✅ exibe kg bonitinho
        const qtdTxt = formatQtd(qtd);

        return `${qtdTxt} ${i.nome} - R$ ${brl(sub)}`;
      })
      .join("\n");

    const cabecalhoId = pedidoId
      ? `🧾 *Pedido:* ${pedidoId.slice(0, 6).toUpperCase()}\n\n`
      : "";

    if (tipoEntrega === "entrega") {
      return encodeURIComponent(
        `🛒 *Pedido - Gigante dos Assados*\n` +
          cabecalhoId +
          `${itens}\n\n` +
          `Subtotal: R$ ${brl(subtotal)}\n` +
          `🚚 Frete: *a calcular*\n` +
          `✅ *Vamos calcular o frete e te enviar o valor total do pedido.*\n\n` +
          `📍 *Entrega*\n` +
          `Cliente: ${cliente.nome}\n` +
          `WhatsApp: ${cliente.telefone}\n` +
          `Endereço: ${cliente.endereco}\n\n` +
          `💳 Pagamento: ${pagamentoTexto}\n` +
          (pagamento === "dinheiro" && trocoPara
            ? `🪙 Troco: R$ ${trocoPara}\n`
            : "")
      );
    }

    // ✅ Retirada com Nome + WhatsApp
    return encodeURIComponent(
      `🛒 *Pedido - Gigante dos Assados*\n` +
        cabecalhoId +
        `${itens}\n\n` +
        `Total: R$ ${brl(total)}\n\n` +
        `🏠 *Retirada no local*\n` +
        `Cliente: ${cliente.nome}\n` +
        `WhatsApp: ${cliente.telefone}\n\n` +
        `💳 Pagamento: ${pagamentoTexto}\n` +
        (pagamento === "dinheiro" && trocoPara ? `🪙 Troco: R$ ${trocoPara}\n` : "")
    );
  }

  async function salvarPedido() {
    if (!podeFinalizar) {
      alert(
        tipoEntrega === "entrega"
          ? "Preencha Nome, WhatsApp e Endereço para entrega."
          : "Preencha Nome e WhatsApp para retirada."
      );
      return;
    }

    try {
      setLoading(true);

      const { data: venda, error: errVenda } = await supabase
        .from("gigante_vendas")
        .insert({
          data: new Date().toISOString(),
          subtotal,
          frete,
          total,
          metodo_pagamento: pagamentoTexto,
          pagamento_detalhe: pagamento,
          tipo_entrega: tipoEntrega,
          status: "novo",
          cliente_nome: cliente.nome,
          cliente_telefone: cliente.telefone,
          cliente_endereco: tipoEntrega === "entrega" ? cliente.endereco : null,
          origem: "SITE",
          observacoes:
            tipoEntrega === "entrega"
              ? `FRETE A CALCULAR (MVP)${
                  pagamento === "dinheiro" && trocoPara
                    ? ` | Troco: R$ ${trocoPara}`
                    : ""
                }`
              : pagamento === "dinheiro" && trocoPara
              ? `Troco: R$ ${trocoPara}`
              : null,
        })
        .select("id")
        .single();

      if (errVenda) throw errVenda;

      // ✅ Itens (quantidade pode ser decimal para KG)
      const itens = carrinho.map((i) => ({
        venda_id: venda.id,
        produto_id: i.id,
        nome: i.nome,
        quantidade: Number(i.quantidade), // unidade OU kg
        preco: Number(i.preco), // se kg, é preço por kg
        subtotal: Number(i.preco) * Number(i.quantidade),
      }));

      const { error: errItens } = await supabase
        .from("gigante_venda_itens")
        .insert(itens);

      if (errItens) throw errItens;

      const msg = montarMensagemWhatsApp(venda.id);
      window.open(`https://wa.me/5511948163211?text=${msg}`, "_blank");

      alert("Pedido enviado! ✅");
      setAberto(false);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar pedido. Veja o console (F12).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
      <div className="bg-white w-full max-w-sm h-full p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">🛒 Seu carrinho</h2>
          <button onClick={() => setAberto(false)} className="text-gray-500 text-sm">
            Fechar ✕
          </button>
        </div>

        {/* ITENS */}
        {carrinho.length === 0 ? (
          <div className="text-center text-gray-500 py-10">Seu carrinho está vazio.</div>
        ) : (
          <>
            {carrinho.map((i) => {
              const qtd = Number(i.quantidade);
              const sub = Number(i.preco) * qtd;
              return (
                <div key={i.id} className="flex justify-between mb-2 text-sm">
                  <span className="min-w-0 pr-2">
                    <b>{formatQtd(qtd)}</b> {i.nome}
                    {isKgItem(qtd) && (
                      <span className="text-[11px] text-gray-500 block">
                        ({brl(Number(i.preco))}/kg)
                      </span>
                    )}
                  </span>
                  <span className="whitespace-nowrap">R$ {brl(sub)}</span>
                </div>
              );
            })}

            <hr className="my-3" />

            {/* ENTREGA / RETIRADA */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setTipoEntrega("retirada")}
                className={`flex-1 py-2 rounded ${
                  tipoEntrega === "retirada" ? "bg-red-600 text-white" : "border"
                }`}
              >
                Retirada
              </button>

              <button
                onClick={() => setTipoEntrega("entrega")}
                className={`flex-1 py-2 rounded ${
                  tipoEntrega === "entrega" ? "bg-red-600 text-white" : "border"
                }`}
              >
                Entrega
              </button>
            </div>

            {/* DADOS DO CLIENTE (SEMPRE) */}
            <div className="space-y-2 mb-3">
              <p className="font-bold text-sm">👤 Seus dados</p>

              <input
                placeholder="Nome (obrigatório)"
                className="w-full border p-2 rounded"
                value={cliente.nome}
                onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
              />

              <input
                placeholder="WhatsApp (obrigatório)"
                className="w-full border p-2 rounded"
                value={cliente.telefone}
                onChange={(e) =>
                  setCliente({ ...cliente, telefone: e.target.value })
                }
              />

              {tipoEntrega === "entrega" && (
                <>
                  <input
                    placeholder="Endereço completo (obrigatório)"
                    className="w-full border p-2 rounded"
                    value={cliente.endereco}
                    onChange={(e) =>
                      setCliente({ ...cliente, endereco: e.target.value })
                    }
                  />

                  <div className="text-xs text-gray-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                    🚚 O frete será calculado após o pedido. Vamos te enviar o valor total no WhatsApp.
                  </div>
                </>
              )}

              {tipoEntrega === "retirada" && (
                <div className="text-xs text-gray-700 bg-gray-50 border rounded p-2">
                  🏠 Retirada no local — usaremos seu WhatsApp para confirmar quando estiver pronto.
                </div>
              )}
            </div>

            {/* PAGAMENTO */}
            <div className="mb-3">
              <p className="font-bold text-sm mb-2">💳 Forma de pagamento</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPagamento("pix")}
                  className={`py-2 rounded ${
                    pagamento === "pix" ? "bg-black text-white" : "border"
                  }`}
                >
                  Pix
                </button>
                <button
                  onClick={() => setPagamento("cartao")}
                  className={`py-2 rounded ${
                    pagamento === "cartao" ? "bg-black text-white" : "border"
                  }`}
                >
                  Cartão
                </button>
                <button
                  onClick={() => setPagamento("dinheiro")}
                  className={`py-2 rounded ${
                    pagamento === "dinheiro" ? "bg-black text-white" : "border"
                  }`}
                >
                  Dinheiro
                </button>
                <button
                  onClick={() => setPagamento("vr")}
                  className={`py-2 rounded ${
                    pagamento === "vr" ? "bg-black text-white" : "border"
                  }`}
                >
                  VR/VA
                </button>
              </div>

              {pagamento === "dinheiro" && (
                <input
                  placeholder="Troco para quanto? (opcional)"
                  className="w-full border p-2 rounded mt-2"
                  value={trocoPara}
                  onChange={(e) => setTrocoPara(e.target.value)}
                />
              )}
            </div>

            {/* TOTAIS */}
            <div className="text-sm space-y-1">
              <p>Itens: {qtdItens}</p>
              <p>Subtotal: R$ {brl(subtotal)}</p>
              {tipoEntrega === "entrega" ? (
                <p>
                  Frete: <b>a calcular</b>
                </p>
              ) : (
                <p>Frete: R$ 0,00</p>
              )}
              <p className="font-bold">
                {tipoEntrega === "entrega" ? "Total parcial" : "Total"}: R${" "}
                {brl(total)}
              </p>
            </div>

            {/* CONTINUAR COMPRANDO */}
            <button
              onClick={() => setAberto(false)}
              className="block w-full mt-4 border text-center py-2 rounded"
            >
              🛍️ Continuar comprando
            </button>

            {/* FINALIZAR */}
            <button
              onClick={salvarPedido}
              disabled={loading || !podeFinalizar}
              className={`block w-full mt-2 text-white text-center py-2 rounded ${
                loading || !podeFinalizar ? "bg-gray-400" : "bg-green-600"
              }`}
            >
              {loading ? "Enviando..." : "Finalizar pedido"}
            </button>

            {!podeFinalizar && (
              <p className="text-xs text-red-600 mt-2">
                {tipoEntrega === "entrega"
                  ? "Preencha Nome, WhatsApp e Endereço para entrega."
                  : "Preencha Nome e WhatsApp para retirada."}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
