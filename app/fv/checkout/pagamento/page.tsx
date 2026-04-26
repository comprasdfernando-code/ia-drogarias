"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/app/fv/_components/cart";
import { useCustomer } from "@/app/fv/_components/useCustomer";

const TAXA_ENTREGA = 10;

const PIX_CODE =
  "00020101021226850014BR.GOV.BCB.PIX2563exemplo-pix-chave520400005303986540510.005802BR5925IA DROGARIAS6009SAO PAULO62070503***6304ABCD";

type FormaPagamento = "pix" | "cartao" | "dinheiro";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PagamentoPage() {
  const router = useRouter();
  const { user } = useCustomer();

  const {
    items,
    subtotal,
    countItems,
    clear,
    endereco,
    setEndereco,
  } = useCart();

  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("pix");

  const total = countItems ? subtotal + TAXA_ENTREGA : 0;

  useEffect(() => {
    async function carregarEnderecoPrincipal() {
      if (!user?.id || endereco) return;

      const { data, error } = await supabase
        .from("cliente_enderecos")
        .select("*")
        .eq("cliente_id", user.id)
        .eq("principal", true)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar endereço principal:", error);
        return;
      }

      if (data) {
        setEndereco({
          cep: data.cep || "",
          endereco: data.endereco || "",
          numero: data.numero || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "São Paulo",
          estado: data.estado || "SP",
          complemento: data.complemento || "",
          referencia: data.referencia || "",
        });
      }
    }

    carregarEnderecoPrincipal();
  }, [user?.id, endereco, setEndereco]);

  function copiarPix() {
    navigator.clipboard.writeText(PIX_CODE);
    alert("Código PIX copiado.");
  }

  function jaPaguei() {
    try {
      [
        "FV_CART_V1",
        "FV_ENDERECO_ENTREGA_V1",
        "cart_fv",
        "cart_farmacia_virtual",
        "cart_fv_virtual",
        "cart_iadrogarias_fv",
      ].forEach((k) => localStorage.removeItem(k));
    } catch {}

    clear();
    router.push("/fv");
  }

  if (!countItems) {
    return (
      <main className="min-h-screen bg-slate-100 p-4">
        <div className="mx-auto max-w-lg rounded-2xl border bg-white p-6 text-center">
          <h1 className="text-xl font-black">Carrinho vazio</h1>

          <Link
            href="/fv"
            className="mt-4 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
          >
            Voltar para loja
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-black">Pagamento</h1>

          <Link href="/fv/carrinho" className="text-sm font-bold text-blue-700">
            Voltar ao carrinho
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            <div className="rounded-2xl border bg-white p-4">
              <h2 className="mb-2 font-black">Entrega</h2>

              {endereco ? (
                <>
                  <p className="text-sm font-bold">
                    {endereco.endereco}, {endereco.numero} — {endereco.bairro}
                  </p>

                  <p className="text-xs text-slate-500">
                    {endereco.cidade || "São Paulo"} / {endereco.estado || "SP"}
                    {endereco.cep ? ` • CEP: ${endereco.cep}` : ""}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Entrega programada em até 24h.
                  </p>
                </>
              ) : (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">
                  Nenhum endereço encontrado. Volte ao carrinho e cadastre um
                  endereço.
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <h2 className="mb-3 font-black">Escolha o pagamento</h2>

              <div className="mb-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormaPagamento("pix")}
                  className={`rounded-xl border px-3 py-3 font-black ${
                    formaPagamento === "pix"
                      ? "border-blue-600 bg-blue-50 text-blue-800"
                      : "bg-white text-slate-700"
                  }`}
                >
                  PIX
                </button>

                <button
                  type="button"
                  onClick={() => setFormaPagamento("cartao")}
                  className={`rounded-xl border px-3 py-3 font-black ${
                    formaPagamento === "cartao"
                      ? "border-blue-600 bg-blue-50 text-blue-800"
                      : "bg-white text-slate-700"
                  }`}
                >
                  Cartão
                </button>

                <button
                  type="button"
                  onClick={() => setFormaPagamento("dinheiro")}
                  className={`rounded-xl border px-3 py-3 font-black ${
                    formaPagamento === "dinheiro"
                      ? "border-blue-600 bg-blue-50 text-blue-800"
                      : "bg-white text-slate-700"
                  }`}
                >
                  Dinheiro
                </button>
              </div>

              {formaPagamento === "pix" && (
                <div className="rounded-2xl border-2 border-blue-600 bg-blue-50 p-4">
                  <p className="font-black text-blue-800">PIX selecionado</p>
                  <p className="text-sm text-slate-600">
                    Copie o código, pague no app do banco e clique em “Já
                    paguei”.
                  </p>

                  <div className="mt-4 break-all rounded-xl border bg-white p-3 font-mono text-xs">
                    {PIX_CODE}
                  </div>

                  <button
                    onClick={copiarPix}
                    className="mt-3 w-full rounded-xl bg-slate-900 py-3 font-black text-white"
                  >
                    Copiar código PIX
                  </button>

                  <button
                    onClick={jaPaguei}
                    className="mt-3 w-full rounded-xl bg-green-600 py-3 font-black text-white"
                  >
                    ✅ Já paguei
                  </button>
                </div>
              )}

              {formaPagamento === "cartao" && (
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="font-black">Cartão</p>
                  <p className="text-sm text-slate-600">
                    Em breve: pagamento por cartão direto no checkout.
                  </p>
                </div>
              )}

              {formaPagamento === "dinheiro" && (
                <div className="rounded-2xl border bg-green-50 p-4">
                  <p className="font-black text-green-800">Dinheiro na entrega</p>
                  <p className="text-sm text-slate-600">
                    O pedido será separado e a farmácia confirma a entrega pelo
                    WhatsApp.
                  </p>

                  <button
                    onClick={jaPaguei}
                    className="mt-3 w-full rounded-xl bg-green-600 py-3 font-black text-white"
                  >
                    Confirmar pedido
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border bg-white p-4">
            <h2 className="mb-3 font-black">Resumo final</h2>

            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.ean} className="flex justify-between gap-2">
                  <span>
                    {item.qtd}x {item.nome}
                  </span>
                  <b>{brl(item.preco * item.qtd)}</b>
                </div>
              ))}

              <div className="flex justify-between border-t pt-2">
                <span>Subtotal</span>
                <b>{brl(subtotal)}</b>
              </div>

              <div className="flex justify-between">
                <span>Entrega</span>
                <b>{brl(TAXA_ENTREGA)}</b>
              </div>

              <div className="flex justify-between border-t pt-2 text-lg">
                <span className="font-black">Total</span>
                <b className="text-green-700">{brl(total)}</b>
              </div>
            </div>

            <Link
              href="/fv/carrinho"
              className="mt-4 block text-center text-sm font-bold text-slate-500"
            >
              Voltar para o carrinho
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}