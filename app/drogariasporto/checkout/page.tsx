"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { PORTO_CART_KEY, PORTO_LOJA_SLUG, PORTO_TAXA_ENTREGA, PortoCartItem, brl, precoPorto } from "../_lib/porto";

type TipoEntrega = "ENTREGA" | "RETIRADA";
type Forma = "PIX" | "CARTAO" | "DINHEIRO" | "COMBINAR";

export default function PortoCheckoutPage() {
  const [cart, setCart] = useState<PortoCartItem[]>([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState<TipoEntrega>("ENTREGA");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [forma, setForma] = useState<Forma>("PIX");
  const [troco, setTroco] = useState("");
  const [obs, setObs] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(PORTO_CART_KEY); if (raw) setCart(JSON.parse(raw)); } catch {}
  }, []);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + precoPorto(i) * i.qtd, 0), [cart]);
  const taxa = tipo === "ENTREGA" ? PORTO_TAXA_ENTREGA : 0;
  const total = subtotal + taxa;

  async function finalizar() {
    if (!cart.length) return alert("Carrinho vazio.");
    if (!nome.trim() || !telefone.trim()) return alert("Informe nome e telefone.");
    if (tipo === "ENTREGA" && (!endereco.trim() || !numero.trim() || !bairro.trim())) return alert("Preencha endereço, número e bairro.");
    if (forma === "DINHEIRO" && troco && Number(troco.replace(",", ".")) < total) return alert("O valor para troco não pode ser menor que o total.");

    setSalvando(true);
    try {
      const { data: pedido, error } = await supabase.from("porto_pedidos_online").insert({
        loja_slug: PORTO_LOJA_SLUG,
        cliente_nome: nome.trim(),
        cliente_telefone: telefone.trim(),
        tipo_entrega: tipo,
        endereco: tipo === "ENTREGA" ? { endereco, numero, bairro, complemento } : null,
        forma_pagamento: forma,
        troco_para: forma === "DINHEIRO" && troco ? Number(troco.replace(",", ".")) : null,
        subtotal,
        taxa_entrega: taxa,
        total,
        observacoes: obs || null,
      }).select("id").single();
      if (error) throw error;

      const itens = cart.map(i => ({ pedido_id: pedido.id, produto_id: i.produto_id, ean: i.ean, nome: i.nome, qtd: i.qtd, preco_unit: precoPorto(i), total: precoPorto(i) * i.qtd }));
      const { error: itemError } = await supabase.from("porto_pedido_itens").insert(itens);
      if (itemError) throw itemError;

      localStorage.removeItem(PORTO_CART_KEY);
      setCart([]);
      setPedidoId(pedido.id);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao criar pedido.");
    } finally { setSalvando(false); }
  }

  if (pedidoId) return <main className="min-h-screen bg-slate-100 p-6"><div className="mx-auto mt-16 max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm"><CheckCircle2 className="mx-auto text-green-600" size={58}/><h1 className="mt-4 text-2xl font-black">Pedido recebido!</h1><p className="mt-2 text-slate-600">Pedido <b>{pedidoId.slice(0, 8).toUpperCase()}</b> enviado para a Drogarias Porto Loja 2.</p><Link href="/drogariasporto" className="mt-6 inline-block rounded-xl bg-blue-800 px-5 py-3 font-black text-white">Voltar para a loja</Link></div></main>;

  return <main className="min-h-screen bg-slate-100 p-4 md:p-6"><div className="mx-auto max-w-5xl"><header className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"><Link href="/drogariasporto/carrinho" className="rounded-xl border p-2"><ArrowLeft/></Link><div><p className="text-xs font-black text-red-600">DROGARIAS PORTO • LOJA 2</p><h1 className="text-2xl font-black">Finalizar pedido</h1></div></header>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]"><section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-black">Cliente</h2><div className="mt-3 grid gap-3 md:grid-cols-2"><input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome" className="rounded-xl border p-3"/><input value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="Telefone / WhatsApp" className="rounded-xl border p-3"/></div></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-black">Recebimento</h2><div className="mt-3 grid grid-cols-2 gap-2">{(["ENTREGA","RETIRADA"] as TipoEntrega[]).map(t=><button key={t} onClick={()=>setTipo(t)} className={`rounded-xl border-2 p-3 font-black ${tipo===t?"border-blue-700 bg-blue-50":""}`}>{t==="ENTREGA"?"Entrega":"Retirada na loja"}</button>)}</div>{tipo==="ENTREGA"&&<div className="mt-3 grid gap-3 md:grid-cols-2"><input value={endereco} onChange={e=>setEndereco(e.target.value)} placeholder="Endereço" className="rounded-xl border p-3"/><input value={numero} onChange={e=>setNumero(e.target.value)} placeholder="Número" className="rounded-xl border p-3"/><input value={bairro} onChange={e=>setBairro(e.target.value)} placeholder="Bairro" className="rounded-xl border p-3"/><input value={complemento} onChange={e=>setComplemento(e.target.value)} placeholder="Complemento" className="rounded-xl border p-3"/></div>}</div>
      <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-black">Pagamento</h2><div className="mt-3 grid grid-cols-2 gap-2">{(["PIX","CARTAO","DINHEIRO","COMBINAR"] as Forma[]).map(f=><button key={f} onClick={()=>setForma(f)} className={`rounded-xl border-2 p-3 font-black ${forma===f?"border-red-600 bg-red-50":""}`}>{f}</button>)}</div>{forma==="DINHEIRO"&&<input value={troco} onChange={e=>setTroco(e.target.value)} placeholder="Troco para? Ex.: 100,00" className="mt-3 w-full rounded-xl border p-3"/>}<textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Observações do pedido" className="mt-3 min-h-24 w-full rounded-xl border p-3"/></div>
    </section><aside className="h-fit rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-black">Resumo</h2><div className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><b>{brl(subtotal)}</b></div><div className="flex justify-between"><span>Entrega</span><b>{taxa?brl(taxa):"Grátis"}</b></div><div className="border-t pt-3 flex justify-between text-lg"><span>Total</span><b>{brl(total)}</b></div></div><button disabled={salvando||!cart.length} onClick={finalizar} className="mt-5 w-full rounded-2xl bg-green-600 py-4 font-black text-white disabled:opacity-40">{salvando?"Enviando...":"FINALIZAR PEDIDO"}</button></aside></div>
  </div></main>;
}
