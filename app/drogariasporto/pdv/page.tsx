"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, Trash2, Plus, Minus, Banknote, CreditCard, QrCode, ArrowLeft, ReceiptText } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const LOJA_SLUG = "drogariasporto-loja2";

type Produto = { id:string; ean:string; nome:string; laboratorio:string|null; apresentacao:string|null; imagens:string[]|null; estoque:number; preco_venda:number };
type Item = Produto & { qtd:number };
type Forma = "Dinheiro" | "Pix" | "Débito" | "Crédito";

function brl(n:number){return Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}

export default function PortoPDV(){
  const [busca,setBusca]=useState(""); const [resultados,setResultados]=useState<Produto[]>([]); const [itens,setItens]=useState<Item[]>([]); const [loading,setLoading]=useState(false); const [forma,setForma]=useState<Forma>("Dinheiro"); const [salvando,setSalvando]=useState(false); const inputRef=useRef<HTMLInputElement>(null);
  const total=useMemo(()=>itens.reduce((s,i)=>s+i.preco_venda*i.qtd,0),[itens]);

  useEffect(()=>{inputRef.current?.focus()},[]);

  async function pesquisar(){
    const termo=busca.trim(); if(!termo)return; setLoading(true);
    try{
      const digits=termo.replace(/\D/g,"");
      let q=supabase.from("fv_produtos").select("id,ean,nome,laboratorio,apresentacao,imagens,ativo").eq("ativo",true).limit(30);
      q=digits.length>=8?q.eq("ean",digits):q.ilike("nome",`%${termo}%`);
      const {data:cat,error}=await q; if(error)throw error;
      const ids=(cat||[]).map((p:any)=>p.id); if(!ids.length){setResultados([]);return;}
      const {data:loja,error:e2}=await supabase.from("fv_farmacia_produtos").select("produto_id,estoque,preco_venda,ativo").eq("farmacia_slug",LOJA_SLUG).in("produto_id",ids); if(e2)throw e2;
      const map=new Map((loja||[]).map((x:any)=>[String(x.produto_id),x]));
      const out=(cat||[]).map((p:any)=>{const l:any=map.get(String(p.id));return{id:String(p.id),ean:String(p.ean||""),nome:String(p.nome||""),laboratorio:p.laboratorio,apresentacao:p.apresentacao,imagens:p.imagens,estoque:Number(l?.estoque||0),preco_venda:Number(l?.preco_venda||0)}}).filter((p:any)=>p.estoque>0&&p.preco_venda>0);
      setResultados(out as Produto[]); if(out.length===1)add(out[0] as Produto);
    }catch(e:any){alert(e?.message||"Erro ao buscar produto") }finally{setLoading(false);setBusca("");inputRef.current?.focus()}
  }

  function add(p:Produto){setItens(old=>{const f=old.find(i=>i.id===p.id);if(f)return old.map(i=>i.id===p.id?{...i,qtd:Math.min(i.qtd+1,p.estoque)}:i);return[...old,{...p,qtd:1}]})}
  function qtd(id:string,d:number){setItens(old=>old.map(i=>i.id===id?{...i,qtd:i.qtd+d}:i).filter(i=>i.qtd>0))}

  async function finalizar(){
    if(!itens.length)return alert("Adicione produtos à venda."); setSalvando(true);
    try{
      const {data:cx,error:cxErr}=await supabase.from("porto_caixa_sessoes").select("id").eq("loja_slug",LOJA_SLUG).eq("status","aberto").order("aberto_em",{ascending:false}).limit(1).maybeSingle(); if(cxErr)throw cxErr; if(!cx)return alert("Abra o caixa antes de finalizar vendas.");
      const vendaItens=itens.map(i=>({produto_id:i.id,ean:i.ean,nome:i.nome,qtd:i.qtd,preco_unit:i.preco_venda,total:i.preco_venda*i.qtd}));
      const {data:v,error}=await supabase.from("porto_vendas").insert({loja_slug:LOJA_SLUG,caixa_sessao_id:cx.id,origem:"PDV",status:"FINALIZADA",total,finalizada_em:new Date().toISOString()}).select("id").single(); if(error)throw error;
      const rows=vendaItens.map(i=>({...i,venda_id:v.id,loja_slug:LOJA_SLUG})); const {error:ei}=await supabase.from("porto_venda_itens").insert(rows); if(ei)throw ei;
      const {error:ep}=await supabase.from("porto_venda_pagamentos").insert({venda_id:v.id,caixa_sessao_id:cx.id,loja_slug:LOJA_SLUG,forma,valor:total}); if(ep)throw ep;
      for(const i of itens){const novo=Math.max(0,i.estoque-i.qtd);const {error:est}=await supabase.from("fv_farmacia_produtos").update({estoque:novo}).eq("farmacia_slug",LOJA_SLUG).eq("produto_id",i.id);if(est)throw est;}
      alert(`Venda finalizada: ${brl(total)} em ${forma}.\nO fechamento já receberá esta venda automaticamente.`); setItens([]); setResultados([]);
    }catch(e:any){console.error(e);alert(e?.message||"Erro ao finalizar venda") }finally{setSalvando(false);inputRef.current?.focus()}
  }

  return <main className="min-h-screen bg-slate-100 p-4 md:p-6">
    <div className="mx-auto max-w-[1500px]">
      <header className="mb-4 flex items-center justify-between rounded-2xl bg-blue-900 p-4 text-white"><div><p className="text-xs font-bold text-blue-200">DROGARIAS PORTO • LOJA 2</p><h1 className="text-2xl font-black">PDV</h1></div><div className="flex gap-2"><Link href="/drogariasporto" className="rounded-xl bg-white/10 px-3 py-2"><ArrowLeft/></Link><Link href="/drogariasporto/caixa" className="rounded-xl bg-white px-4 py-2 font-bold text-blue-900">Caixa</Link></div></header>
      <div className="grid gap-4 xl:grid-cols-[1fr_440px]">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex gap-2"><div className="flex flex-1 items-center rounded-xl border-2 border-blue-200 px-4 focus-within:border-blue-600"><Search/><input ref={inputRef} value={busca} onChange={e=>setBusca(e.target.value)} onKeyDown={e=>e.key==="Enter"&&pesquisar()} placeholder="Bipar EAN ou digitar produto" className="w-full px-3 py-4 text-lg outline-none"/></div><button onClick={pesquisar} className="rounded-xl bg-blue-700 px-6 font-black text-white">Buscar</button></div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">{loading?<p>Buscando...</p>:resultados.map(p=><button key={p.id} onClick={()=>add(p)} className="rounded-xl border p-3 text-left hover:border-blue-500"><div className="font-black">{p.nome}</div><div className="text-xs text-slate-500">{p.laboratorio} • {p.apresentacao}</div><div className="mt-1 flex justify-between"><b className="text-blue-700">{brl(p.preco_venda)}</b><span className="text-xs">Estoque {p.estoque}</span></div></button>)}</div>
          <div className="mt-5 overflow-hidden rounded-xl border"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Produto</th><th>Qtd</th><th>Unit.</th><th>Total</th><th></th></tr></thead><tbody>{itens.map(i=><tr key={i.id} className="border-t"><td className="p-3"><b>{i.nome}</b><small className="block text-slate-500">EAN {i.ean}</small></td><td><div className="inline-flex items-center rounded-lg border"><button onClick={()=>qtd(i.id,-1)} className="p-2"><Minus size={14}/></button><b className="px-2">{i.qtd}</b><button onClick={()=>qtd(i.id,1)} className="p-2"><Plus size={14}/></button></div></td><td>{brl(i.preco_venda)}</td><td className="font-bold">{brl(i.preco_venda*i.qtd)}</td><td><button onClick={()=>setItens(x=>x.filter(y=>y.id!==i.id))} className="p-2 text-red-600"><Trash2 size={18}/></button></td></tr>)}</tbody></table>{!itens.length&&<div className="p-10 text-center text-slate-400">Venda vazia</div>}</div>
        </section>
        <aside className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">TOTAL DA VENDA</p><div className="mt-1 text-5xl font-black text-blue-900">{brl(total)}</div><div className="mt-6 grid grid-cols-2 gap-2">{([['Dinheiro',Banknote],['Pix',QrCode],['Débito',CreditCard],['Crédito',CreditCard]] as const).map(([f,Icon])=><button key={f} onClick={()=>setForma(f)} className={`rounded-xl border-2 p-4 text-left ${forma===f?'border-blue-700 bg-blue-50':'border-slate-200'}`}><Icon/><b className="mt-2 block">{f}</b></button>)}</div><button disabled={salvando||!itens.length} onClick={finalizar} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-5 text-xl font-black text-white disabled:opacity-40"><ReceiptText/>{salvando?'Finalizando...':'FINALIZAR VENDA'}</button><p className="mt-3 text-center text-xs text-slate-500">Cada pagamento fica ligado à venda e à sessão de caixa.</p></aside>
      </div>
    </div>
  </main>
}
