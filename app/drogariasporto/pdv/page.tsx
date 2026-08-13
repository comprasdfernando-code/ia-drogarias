"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, CreditCard, Minus, Plus, QrCode, ReceiptText, Search, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { PORTO_LOJA_SLUG, brl } from "../_lib/porto";

type Produto = { id:string; ean:string; nome:string; laboratorio:string|null; apresentacao:string|null; estoque:number; preco_venda:number };
type Item = Produto & { qtd:number };
type Forma = "Dinheiro" | "Pix" | "Débito" | "Crédito";
type Pagamento = { forma: Forma; valor: string };
type Conta = { id:string; nome:string; tipo:string };

export default function PortoPDV() {
  const [busca,setBusca] = useState("");
  const [resultados,setResultados] = useState<Produto[]>([]);
  const [itens,setItens] = useState<Item[]>([]);
  const [pagamentos,setPagamentos] = useState<Pagamento[]>([{ forma:"Dinheiro", valor:"" }]);
  const [contas,setContas] = useState<Conta[]>([]);
  const [loading,setLoading] = useState(false);
  const [salvando,setSalvando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const total = useMemo(() => itens.reduce((s,i)=>s+i.preco_venda*i.qtd,0),[itens]);
  const totalPagamentos = useMemo(() => pagamentos.reduce((s,p)=>s+Number((p.valor||"0").replace(",",".")),0),[pagamentos]);
  const faltante = Math.max(0, total-totalPagamentos);

  useEffect(()=>{ inputRef.current?.focus(); carregarContas(); },[]);

  async function carregarContas(){
    const { data } = await supabase.from("porto_contas_financeiras").select("id,nome,tipo").eq("loja_slug",PORTO_LOJA_SLUG).eq("ativo",true);
    setContas((data||[]) as Conta[]);
  }

  async function pesquisar(){
    const termo=busca.trim(); if(!termo)return; setLoading(true);
    try{
      const digits=termo.replace(/\D/g,"");
      let q=supabase.from("fv_produtos").select("id,ean,nome,laboratorio,apresentacao,ativo").eq("ativo",true).limit(30);
      q=digits.length>=8?q.eq("ean",digits):q.ilike("nome",`%${termo}%`);
      const {data:cat,error}=await q; if(error)throw error;
      const ids=(cat||[]).map((p:any)=>p.id); if(!ids.length){setResultados([]);return;}
      const {data:loja,error:e2}=await supabase.from("fv_farmacia_produtos").select("produto_id,estoque,preco_venda,ativo").eq("farmacia_slug",PORTO_LOJA_SLUG).in("produto_id",ids); if(e2)throw e2;
      const map=new Map((loja||[]).map((x:any)=>[String(x.produto_id),x]));
      const out=(cat||[]).map((p:any)=>{const l:any=map.get(String(p.id));return{id:String(p.id),ean:String(p.ean||""),nome:String(p.nome||""),laboratorio:p.laboratorio,apresentacao:p.apresentacao,estoque:Number(l?.estoque||0),preco_venda:Number(l?.preco_venda||0)}}).filter((p:any)=>p.estoque>0&&p.preco_venda>0);
      setResultados(out as Produto[]); if(out.length===1)add(out[0] as Produto);
    }catch(e:any){ alert(e?.message||"Erro ao buscar produto"); }
    finally{ setLoading(false); setBusca(""); inputRef.current?.focus(); }
  }

  function add(p:Produto){ setItens(old=>{const f=old.find(i=>i.id===p.id);if(f)return old.map(i=>i.id===p.id?{...i,qtd:Math.min(i.qtd+1,p.estoque)}:i);return[...old,{...p,qtd:1}]}); }
  function qtd(id:string,d:number){ setItens(old=>old.map(i=>i.id===id?{...i,qtd:Math.min(Math.max(i.qtd+d,0),i.estoque)}:i).filter(i=>i.qtd>0)); }
  function valorNumero(v:string){ return Number((v||"0").replace(",",".")); }

  function contaPorForma(forma:Forma){
    if(forma==="Dinheiro") return contas.find(c=>c.tipo==="CAIXA") || null;
    if(forma==="Pix") return contas.find(c=>c.tipo==="BANCO" || c.tipo==="PIX") || null;
    return contas.find(c=>c.tipo==="CARTAO_RECEBER") || null;
  }

  function addPagamento(){ setPagamentos(p=>[...p,{forma:"Pix",valor:""}]); }
  function setPagamento(idx:number, patch:Partial<Pagamento>){ setPagamentos(old=>old.map((p,i)=>i===idx?{...p,...patch}:p)); }
  function removerPagamento(idx:number){ setPagamentos(old=>old.filter((_,i)=>i!==idx)); }

  async function finalizar(){
    if(!itens.length)return alert("Adicione produtos à venda.");
    const validos=pagamentos.map(p=>({...p,numero:valorNumero(p.valor)})).filter(p=>p.numero>0);
    if(!validos.length)return alert("Informe o pagamento.");
    if(Math.abs(validos.reduce((s,p)=>s+p.numero,0)-total)>0.009)return alert(`Os pagamentos precisam somar exatamente ${brl(total)}.`);

    setSalvando(true);
    try{
      const {data:cx,error:cxErr}=await supabase.from("porto_caixa_sessoes").select("id").eq("loja_slug",PORTO_LOJA_SLUG).eq("status","aberto").order("aberto_em",{ascending:false}).limit(1).maybeSingle();
      if(cxErr)throw cxErr; if(!cx)throw new Error("Abra o caixa antes de finalizar vendas.");

      const {data:v,error}=await supabase.from("porto_vendas").insert({loja_slug:PORTO_LOJA_SLUG,caixa_sessao_id:cx.id,origem:"PDV",status:"FINALIZADA",total,finalizada_em:new Date().toISOString()}).select("id").single(); if(error)throw error;

      const rows=itens.map(i=>({venda_id:v.id,loja_slug:PORTO_LOJA_SLUG,produto_id:i.id,ean:i.ean,nome:i.nome,qtd:i.qtd,preco_unit:i.preco_venda,total:i.preco_venda*i.qtd}));
      const {error:ei}=await supabase.from("porto_venda_itens").insert(rows); if(ei)throw ei;

      for(const p of validos){
        const conta=contaPorForma(p.forma);
        const {error:ep}=await supabase.from("porto_venda_pagamentos").insert({venda_id:v.id,caixa_sessao_id:cx.id,loja_slug:PORTO_LOJA_SLUG,forma:p.forma,valor:p.numero,conta_financeira_id:conta?.id||null}); if(ep)throw ep;
        if(conta){
          const {error:mf}=await supabase.from("porto_movimentacoes_financeiras").insert({loja_slug:PORTO_LOJA_SLUG,conta_financeira_id:conta.id,tipo:"ENTRADA",categoria:`VENDA_${p.forma.toUpperCase()}`,descricao:`Venda PDV ${v.id.slice(0,8)}`,valor:p.numero,origem_tipo:"VENDA",origem_id:v.id}); if(mf)throw mf;
        }
      }

      for(const i of itens){
        const novo=Math.max(0,i.estoque-i.qtd);
        const {error:est}=await supabase.from("fv_farmacia_produtos").update({estoque:novo}).eq("farmacia_slug",PORTO_LOJA_SLUG).eq("produto_id",i.id); if(est)throw est;
      }

      alert(`Venda finalizada: ${brl(total)}.\nPagamento(s) enviado(s) automaticamente ao caixa.`);
      setItens([]); setResultados([]); setPagamentos([{forma:"Dinheiro",valor:""}]);
    }catch(e:any){ console.error(e); alert(e?.message||"Erro ao finalizar venda"); }
    finally{ setSalvando(false); inputRef.current?.focus(); }
  }

  return <main className="min-h-screen bg-slate-100 p-4 md:p-6"><div className="mx-auto max-w-[1500px]">
    <header className="mb-4 flex items-center justify-between rounded-2xl bg-blue-900 p-4 text-white"><div><p className="text-xs font-bold text-blue-200">DROGARIAS PORTO • LOJA 2</p><h1 className="text-2xl font-black">PDV</h1></div><div className="flex gap-2"><Link href="/drogariasporto" className="rounded-xl bg-white/10 p-2"><ArrowLeft/></Link><Link href="/drogariasporto/caixa" className="rounded-xl bg-white px-4 py-2 font-bold text-blue-900">Caixa</Link></div></header>
    <div className="grid gap-4 xl:grid-cols-[1fr_460px]">
      <section className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex gap-2"><div className="flex flex-1 items-center rounded-xl border-2 border-blue-200 px-4 focus-within:border-blue-600"><Search/><input ref={inputRef} value={busca} onChange={e=>setBusca(e.target.value)} onKeyDown={e=>e.key==="Enter"&&pesquisar()} placeholder="Bipar EAN ou digitar produto" className="w-full px-3 py-4 text-lg outline-none"/></div><button onClick={pesquisar} className="rounded-xl bg-blue-700 px-6 font-black text-white">Buscar</button></div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">{loading?<p>Buscando...</p>:resultados.map(p=><button key={p.id} onClick={()=>add(p)} className="rounded-xl border p-3 text-left hover:border-blue-500"><div className="font-black">{p.nome}</div><div className="text-xs text-slate-500">{p.laboratorio} • {p.apresentacao}</div><div className="mt-1 flex justify-between"><b className="text-blue-700">{brl(p.preco_venda)}</b><span className="text-xs">Estoque {p.estoque}</span></div></button>)}</div>
      <div className="mt-5 overflow-hidden rounded-xl border"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Produto</th><th>Qtd</th><th>Unit.</th><th>Total</th><th></th></tr></thead><tbody>{itens.map(i=><tr key={i.id} className="border-t"><td className="p-3"><b>{i.nome}</b><small className="block text-slate-500">EAN {i.ean}</small></td><td><div className="inline-flex items-center rounded-lg border"><button onClick={()=>qtd(i.id,-1)} className="p-2"><Minus size={14}/></button><b className="px-2">{i.qtd}</b><button onClick={()=>qtd(i.id,1)} className="p-2"><Plus size={14}/></button></div></td><td>{brl(i.preco_venda)}</td><td className="font-bold">{brl(i.preco_venda*i.qtd)}</td><td><button onClick={()=>setItens(x=>x.filter(y=>y.id!==i.id))} className="p-2 text-red-600"><Trash2 size={18}/></button></td></tr>)}</tbody></table>{!itens.length&&<div className="p-10 text-center text-slate-400">Venda vazia</div>}</div></section>

      <aside className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">TOTAL DA VENDA</p><div className="mt-1 text-5xl font-black text-blue-900">{brl(total)}</div>
        <div className="mt-6 flex items-center justify-between"><h2 className="font-black">Pagamentos</h2><button onClick={addPagamento} className="rounded-lg border px-3 py-2 text-sm font-bold">+ Pagamento misto</button></div>
        <div className="mt-3 space-y-3">{pagamentos.map((p,idx)=><div key={idx} className="rounded-xl border p-3"><div className="grid grid-cols-[1fr_130px_auto] gap-2"><select value={p.forma} onChange={e=>setPagamento(idx,{forma:e.target.value as Forma})} className="rounded-lg border p-2 font-bold"><option>Dinheiro</option><option>Pix</option><option>Débito</option><option>Crédito</option></select><input value={p.valor} onChange={e=>setPagamento(idx,{valor:e.target.value})} className="rounded-lg border p-2 text-right font-bold" placeholder="0,00" inputMode="decimal"/>{pagamentos.length>1&&<button onClick={()=>removerPagamento(idx)} className="rounded-lg p-2 text-red-600"><Trash2 size={18}/></button>}</div></div>)}</div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm"><div className="flex justify-between"><span>Informado</span><b>{brl(totalPagamentos)}</b></div><div className="mt-1 flex justify-between"><span>Falta</span><b className={faltante>0?"text-red-600":"text-green-700"}>{brl(faltante)}</b></div></div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-500"><div><Banknote className="mx-auto"/>Dinheiro</div><div><QrCode className="mx-auto"/>Pix</div><div><CreditCard className="mx-auto"/>Débito</div><div><CreditCard className="mx-auto"/>Crédito</div></div>
        <button disabled={salvando||!itens.length||Math.abs(totalPagamentos-total)>0.009} onClick={finalizar} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-5 text-xl font-black text-white disabled:opacity-40"><ReceiptText/>{salvando?"Finalizando...":"FINALIZAR VENDA"}</button><p className="mt-3 text-center text-xs text-slate-500">Cada parte do pagamento vai para o caixa/conta correspondente.</p>
      </aside>
    </div>
  </div></main>;
}
