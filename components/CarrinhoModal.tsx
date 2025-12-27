"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Pagamento = "pix" | "cartao" | "dinheiro" | "vr";
type TipoEntrega = "retirada" | "entrega";

export default function CarrinhoModal({
  aberto,
  setAberto,
  carrinho,
}: any) {
  if (!aberto) return null;

  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("retirada");

  const [cliente, setCliente] = useState({
    nome: "",
    telefone: "",
    endereco: "",
  });

  const [pagamento, setPagamento] = useState<Pagamento>("pix");
  const [trocoPara, setTrocoPara] = useState<string>("");

  const [loading, setLoading] = useState(false);

  // 🧮 Subtotal
  const subtotal = useMemo(
    () =>
      carrinho.reduce(
        (s: number, i: any) => s + Number(i.preco) * Number(i.quantidade),
        0
      ),
    [carrinho]
  );

  // 🚚 Frete (por enquanto: a calcular = 0)
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

  // 📲 Mensagem WhatsApp (se quiser mandar)
  const mensagemWhatsApp = useMemo(() => {
    const itens = carrinho
      .map(
        (i: any) =>
          `${i.quantidade}x ${i.nome} - R$ ${(
            Number(i.preco) * Number(i.quantidade)
          ).toFixed(2)}`
      )
      .join("\n");

    return encodeURIComponent(
      `🛒 *Pedido - Gigante dos Assados*\n\n` +
        `${itens}\n\n` +
        `Subtotal: R$ ${subtotal.toFixed(2)}\n` +
        `Frete: a calcular\n` +
        `*Total parcial: R$ ${total.toFixed(2)}*\n\n` +
        `Recebimento: ${tipoEntrega}\n` +
        (tipoEntrega === "entrega"
          ? `\n📍 *Entrega*\n` +
            `Cliente: ${cliente.nome}\n` +
            `WhatsApp: ${cliente.telefone}\n` +
            `Endereço: ${cliente.endereco}\n`
          : `\n🏠 Retirada no local\n`) +
        `\n💳 *Pagamento*: ${pagamentoTexto}\n`
    );
  }, [carrinho, subtotal, total, tipoEntrega, cliente, pagamentoTexto]);

  const podeFinalizar =
    carrinho.length > 0 &&
    (tipoEntrega === "retirada" ||
      (cliente.nome.trim() && cliente.telefone.trim() && cliente.endereco.trim()));

  async function salvarPedido() {
    if (!podeFinalizar) {
      alert(
        tipoEntrega === "entrega"
          ? "Preencha Nome, WhatsApp e Endereço para entrega."
          : "Adicione itens no carrinho."
      );
      return;
    }

    try {
      setLoading(true);

      // 1) cria venda
      const { data: venda, error: errVenda } = await supabase
        .from("gigante_vendas")
        .insert({
          data: new Date().toISOString(),
          total: total,
          subtotal: subtotal,
          frete: frete,
          metodo_pagamento: pagamentoTexto, // mantém seu campo atual
          pagamento_detalhe: pagamento, // extra (se você criou a coluna)
          tipo_entrega: tipoEntrega,
          status: "novo",
          cliente_nome: tipoEntrega === "entrega" ? cliente.nome : null,
          cliente_telefone: tipoEntrega === "entrega" ? cliente.telefone : null,
          cliente_endereco: tipoEntrega === "entrega" ? cliente.endereco : null,
          origem: "SITE",
          observacoes:
            pagamento === "dinheiro" && trocoPara
              ? `Troco para R$ ${trocoPara}`
              : null,
        })
        .select("id")
        .single();

      if (errVenda) throw errVenda;

      // 2) cria itens
      const itens = carrinho.map((i: any) => ({
        venda_id: venda.id,
        produto_id: i.id,
        nome: i.nome,
        quantidade: Number(i.quantidade),
        preco: Number(i.preco),
        subtotal: Number(i.preco) * Number(i.quantidade),
      }));

      const { error: errItens } = await supabase
        .from("gigante_venda_itens")
        .insert(itens);

      if (errItens) throw errItens;

      // ✅ (opcional) abre WhatsApp
      window.open(`https://wa.me/5511948163211?text=${mensagemWhatsApp}`, "_blank");

      alert("Pedido enviado! ✅");

      // fecha modal
      setAberto(false);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar pedido. Confira Supabase/RLS.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
      <div className="bg-white w-full max-w-sm h-full p-4 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4">🛒 Seu carrinho</h2>

        {/* ITENS */}
        {carrinho.map((i: any) => (
          <div key={i.id} className="flex justify-between mb-2 text-sm">
            <span>
              {i.quantidade}x {i.nome}
            </span>
            <span>R$ {(Number(i.preco) * Number(i.quantidade)).toFixed(2)}</span>
          </div>
        ))}

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

        {/* DADOS ENTREGA */}
        {tipoEntrega === "entrega" && (
          <div className="space-y-2 mb-3">
            <input
              placeholder="Nome"
              className="w-full border p-2 rounded"
              value={cliente.nome}
              onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
            />
            <input
              placeholder="WhatsApp"
              className="w-full border p-2 rounded"
              value={cliente.telefone}
              onChange={(e) =>
                setCliente({ ...cliente, telefone: e.target.value })
              }
            />
            <input
              placeholder="Endereço completo"
              className="w-full border p-2 rounded"
              value={cliente.endereco}
              onChange={(e) =>
                setCliente({ ...cliente, endereco: e.target.value })
              }
            />
          </div>
        )}

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
          <p>Subtotal: R$ {subtotal.toFixed(2)}</p>
          <p>Frete: a calcular</p>
          <p className="font-bold">Total parcial: R$ {total.toFixed(2)}</p>
        </div>

        {/* FINALIZAR (salva no banco) */}
        <button
          onClick={salvarPedido}
          disabled={loading}
          className={`block w-full mt-4 text-white text-center py-2 rounded ${
            loading ? "bg-gray-400" : "bg-green-600"
          }`}
        >
          {loading ? "Salvando..." : "Finalizar pedido"}
        </button>

        <button
          onClick={() => setAberto(false)}
          className="mt-2 w-full text-sm text-gray-500"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
