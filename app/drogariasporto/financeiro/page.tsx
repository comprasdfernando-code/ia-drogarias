"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Banknote, Building2, CalendarDays, PlusCircle, ReceiptText, WalletCards } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { PORTO_LOJA_SLUG, brl } from "../_lib/porto";

type Conta = { id:string; nome:string; tipo:string; saldo_inicial:number };
type Mov = { id:string; conta_financeira_id:string; tipo:"ENTRADA"|"SAIDA"; categoria:string; descricao:string; valor:number; created_at:string };
type Boleto = { id:string; fornecedor:string|null; descricao:string; valor:number; vencimento:string; linha_digitavel:string|null; status:string; conta_financeira_id:string|null; pago_em:string|null };

export default function PortoFinanceiroPage(){
  const [contas,setContas]=useState<Conta[]>([]);
  const [movs,setMovs]=useState<Mov[]>([]);
  const [boletos,setBoletos]=useState<Boleto[]>([]);
  const [fornecedor,setFornecedor]=useState("");
  const [descricao,setDescricao]=useState("");
  const [valor,setValor]=useState("");
  const [vencimento,setVencimento]=useState("");
  const [linha,setLinha]=useState("");
  const [filtro,setFiltro]=useState<"TODOS"|"PENDENTE"|"PAGO">("TODOS");

  useEffect(()=>{carregar();},[]);

  async function carregar(){
    const [{data:c},{data:m},{data:b}] = await Promise.all([
      supabase.from("porto_contas_financeiras").select("id,nome,tipo,saldo_inicial").eq("loja_slug",PORTO_LOJA_SLUG).eq("ativo",true).order("nome"),
      supabase.from("porto_movimentacoes_financeiras").select("id,conta_financeira_id,tipo,categoria,descricao,valor,created_at").eq("loja_slug",PORTO_LOJA_SLUG).order("created_at",{ascending:false}).limit(500),
      supabase.from("porto_contas_pagar").select("id,fornecedor,descricao,valor,vencimento,linha_digitavel,status,conta_financeira_id,pago_em").eq("loja_slug",PORTO_LOJA_SLUG).order("vencimento",{ascending:true}),
    ]);
    setContas((c||[]) as Conta[]);setMovs((m||[]) as Mov[]);setBoletos((b||[]) as Boleto[]);
  }

  const saldoConta=useMemo(()=>{
    const map=new Map<string,number>();
    contas.forEach(c=>map.set(c.id,Number(c.saldo_inicial||0)));
    movs.forEach(m=>map.set(m.conta_financeira_id,(map.get(m.conta_financeira_id)||0)+(m.tipo==="ENTRADA"?Number(m.valor): -Number(m.valor))));
    return map;
  },[contas,movs]);

  const filtrados=boletos.filter(b=>filtro==="TODOS"||b.status===filtro);
  const pendente=boletos.filter(b=>b.status==="PENDENTE").reduce((s,b)=>s+Number(b.valor||0),0);

  async function cadastrarBoleto(){
    const n=Number((valor||"0").replace(",","."));
    if(!descricao.trim()||!vencimento||n<=0)return alert("Preencha descrição, valor e vencimento.");
    const {error}=await supabase.from("porto_contas_pagar").insert({loja_slug:PORTO_LOJA_SLUG,fornecedor:fornecedor||null,descricao:descricao.trim(),valor:n,vencimento,linha_digitavel:linha||null,status:"PENDENTE"});
    if(error)return alert(error.message);setFornecedor("");setDescricao("");setValor("");setVencimento("");setLinha("");await carregar();
  }

  async function pagar(b:Boleto){
    if(b.status!=="PENDENTE")return;
    const nomeContas=contas.map((c,i)=>`${i+1} - ${c.nome}`).join("\n");
    const escolha=prompt(`Pagar ${brl(b.valor)} de ${b.descricao}.\nEscolha a conta:\n${nomeContas}`);
    if(!escolha)return;
    const idx=Number(escolha)-1; const conta=contas[idx]; if(!conta)return alert("Conta inválida.");
    if(!confirm(`Confirmar pagamento de ${brl(b.valor)} usando ${conta.nome}?`))return;

    const {error:mErr}=await supabase.from("porto_movimentacoes_financeiras").insert({loja_slug:PORTO_LOJA_SLUG,conta_financeira_id:conta.id,tipo:"SAIDA",categoria:"BOLETO",descricao:`Boleto: ${b.descricao}`,valor:b.valor,origem_tipo:"CONTA_PAGAR",origem_id:b.id});
    if(mErr)return alert(mErr.message);

    if(conta.tipo==="CAIXA"){
      const {data:cx}=await supabase.from("porto_caixa_sessoes").select("id").eq("loja_slug",PORTO_LOJA_SLUG).eq("status","aberto").order("aberto_em",{ascending:false}).limit(1).maybeSingle();
      if(!cx)return alert("O movimento financeiro foi criado, mas não há caixa aberto para registrar a saída física. Abra o caixa e ajuste antes do fechamento.");
      const {error:cxErr}=await supabase.from("porto_caixa_movimentacoes").insert({loja_slug:PORTO_LOJA_SLUG,caixa_sessao_id:cx.id,tipo:"BOLETO",descricao:`Boleto: ${b.descricao}`,valor:b.valor,conta_financeira_id:conta.id});
      if(cxErr)return alert(cxErr.message);
    }

    const {error:uErr}=await supabase.from("porto_contas_pagar").update({status:"PAGO",conta_financeira_id:conta.id,pago_em:new Date().toISOString()}).eq("id",b.id);
    if(uErr)return alert(uErr.message);await carregar();
  }

  return <main className="min-h-screen bg-slate-100 p-4 md:p-6"><div className="mx-auto max-w-7xl">
    <header className="flex items-center justify-between rounded-2xl bg-blue-900 p-4 text-white"><div><p className="text-xs font-bold text-blue-200">DROGARIAS PORTO • LOJA 2</p><h1 className="text-2xl font-black">Financeiro</h1></div><Link href="/drogariasporto/caixa" className="rounded-xl bg-white/10 p-2"><ArrowLeft/></Link></header>

    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {contas.map(c=><div key={c.id} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-slate-500"><span className="text-sm font-bold">{c.nome}</span>{c.tipo==="CAIXA"?<Banknote/>:c.tipo==="CARTAO_RECEBER"?<WalletCards/>:<Building2/>}</div><div className="mt-2 text-2xl font-black text-blue-900">{brl(saldoConta.get(c.id)||0)}</div><div className="text-xs text-slate-400">{c.tipo}</div></div>)}
      <div className="rounded-2xl bg-red-600 p-4 text-white shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-bold">Boletos pendentes</span><CalendarDays/></div><div className="mt-2 text-2xl font-black">{brl(pendente)}</div><div className="text-xs text-red-100">{boletos.filter(b=>b.status==="PENDENTE").length} contas</div></div>
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[390px_1fr]">
      <section className="h-fit rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><PlusCircle className="text-blue-700"/><h2 className="text-xl font-black">Novo boleto / conta</h2></div><div className="mt-4 grid gap-3"><input value={fornecedor} onChange={e=>setFornecedor(e.target.value)} placeholder="Fornecedor" className="rounded-xl border p-3"/><input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Descrição" className="rounded-xl border p-3"/><input value={valor} onChange={e=>setValor(e.target.value)} placeholder="Valor" className="rounded-xl border p-3" inputMode="decimal"/><input type="date" value={vencimento} onChange={e=>setVencimento(e.target.value)} className="rounded-xl border p-3"/><textarea value={linha} onChange={e=>setLinha(e.target.value)} placeholder="Linha digitável (opcional)" className="min-h-20 rounded-xl border p-3"/><button onClick={cadastrarBoleto} className="rounded-xl bg-blue-700 py-4 font-black text-white">SALVAR CONTA</button></div></section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="text-xl font-black">Contas a pagar</h2><p className="text-sm text-slate-500">Pagamento vinculado ao caixa físico ou banco.</p></div><div className="flex gap-2">{(["TODOS","PENDENTE","PAGO"] as const).map(f=><button key={f} onClick={()=>setFiltro(f)} className={`rounded-lg px-3 py-2 text-sm font-bold ${filtro===f?"bg-blue-700 text-white":"border"}`}>{f}</button>)}</div></div>
        <div className="overflow-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Vencimento</th><th>Fornecedor / descrição</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>{filtrados.map(b=><tr key={b.id} className="border-t"><td className="p-3 font-bold">{new Date(b.vencimento+"T12:00:00").toLocaleDateString("pt-BR")}</td><td><b>{b.fornecedor||"—"}</b><small className="block text-slate-500">{b.descricao}</small></td><td className="font-black">{brl(b.valor)}</td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${b.status==="PAGO"?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}`}>{b.status}</span></td><td className="p-3 text-right">{b.status==="PENDENTE"&&<button onClick={()=>pagar(b)} className="rounded-lg bg-green-600 px-3 py-2 font-bold text-white">Pagar</button>}</td></tr>)}</tbody></table></div>
      </section>
    </div>

    <section className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm"><div className="border-b p-4"><div className="flex items-center gap-2"><ReceiptText className="text-blue-700"/><h2 className="text-xl font-black">Últimas movimentações financeiras</h2></div></div><div className="overflow-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Data</th><th>Conta</th><th>Categoria</th><th>Descrição</th><th>Entrada/Saída</th></tr></thead><tbody>{movs.slice(0,80).map(m=>{const conta=contas.find(c=>c.id===m.conta_financeira_id);return <tr key={m.id} className="border-t"><td className="p-3">{new Date(m.created_at).toLocaleString("pt-BR")}</td><td>{conta?.nome||"—"}</td><td className="font-bold">{m.categoria}</td><td>{m.descricao}</td><td className={`font-black ${m.tipo==="ENTRADA"?"text-green-700":"text-red-600"}`}>{m.tipo==="ENTRADA"?"+":"-"} {brl(m.valor)}</td></tr>})}</tbody></table></div></section>
  </div></main>;
}
