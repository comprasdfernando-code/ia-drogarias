"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Banknote, Building2, LockKeyhole, PlusCircle, Scissors, WalletCards } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { PORTO_LOJA_SLUG, brl } from "../_lib/porto";

type Sessao = { id:string; operador:string|null; status:string; valor_abertura:number; valor_contado:number|null; diferenca:number|null; resumo_pagamentos:any; aberto_em:string; fechado_em:string|null };
type Pagamento = { id:string; venda_id:string; forma:string; valor:number; created_at:string };
type Movimento = { id:string; tipo:"SANGRIA"|"SUPRIMENTO"|"DESPESA"|"BOLETO"; descricao:string; valor:number; created_at:string };
type Conta = { id:string; nome:string; tipo:string };

export default function PortoCaixaPage(){
  const [sessao,setSessao]=useState<Sessao|null>(null);
  const [pagamentos,setPagamentos]=useState<Pagamento[]>([]);
  const [movimentos,setMovimentos]=useState<Movimento[]>([]);
  const [contas,setContas]=useState<Conta[]>([]);
  const [operador,setOperador]=useState("");
  const [abertura,setAbertura]=useState("200");
  const [contado,setContado]=useState("");
  const [tipoMov,setTipoMov]=useState<Movimento["tipo"]>("SANGRIA");
  const [descricao,setDescricao]=useState("");
  const [valorMov,setValorMov]=useState("");
  const [contaId,setContaId]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{carregar();},[]);

  async function carregar(){
    setLoading(true);
    const [{data:cx},{data:ct}] = await Promise.all([
      supabase.from("porto_caixa_sessoes").select("*").eq("loja_slug",PORTO_LOJA_SLUG).eq("status","aberto").order("aberto_em",{ascending:false}).limit(1).maybeSingle(),
      supabase.from("porto_contas_financeiras").select("id,nome,tipo").eq("loja_slug",PORTO_LOJA_SLUG).eq("ativo",true),
    ]);
    setContas((ct||[]) as Conta[]);
    setSessao((cx as Sessao)||null);
    if(cx){ await carregarSessao(cx.id); }
    else { setPagamentos([]); setMovimentos([]); }
    setLoading(false);
  }

  async function carregarSessao(id:string){
    const [{data:p},{data:m}] = await Promise.all([
      supabase.from("porto_venda_pagamentos").select("id,venda_id,forma,valor,created_at").eq("caixa_sessao_id",id).order("created_at",{ascending:false}),
      supabase.from("porto_caixa_movimentacoes").select("id,tipo,descricao,valor,created_at").eq("caixa_sessao_id",id).order("created_at",{ascending:false}),
    ]);
    setPagamentos((p||[]) as Pagamento[]); setMovimentos((m||[]) as Movimento[]);
  }

  const totais=useMemo(()=>{
    const p:any={Dinheiro:0,Pix:0,"Débito":0,"Crédito":0};
    pagamentos.forEach(x=>p[x.forma]=(p[x.forma]||0)+Number(x.valor||0));
    const m:any={SANGRIA:0,SUPRIMENTO:0,DESPESA:0,BOLETO:0};
    movimentos.forEach(x=>m[x.tipo]=(m[x.tipo]||0)+Number(x.valor||0));
    const totalVendas = Number(p.Dinheiro||0)+Number(p.Pix||0)+Number(p["Débito"]||0)+Number(p["Crédito"]||0);
    return {p,m,totalVendas};
  },[pagamentos,movimentos]);

  const esperado=Number(sessao?.valor_abertura||0)+Number(totais.p.Dinheiro||0)+Number(totais.m.SUPRIMENTO||0)-Number(totais.m.SANGRIA||0)-Number(totais.m.DESPESA||0)-Number(totais.m.BOLETO||0);
  const contadoN=Number((contado||"0").replace(",","."));
  const diferenca=contado===""?0:contadoN-esperado;

  async function abrir(){
    if(!operador.trim())return alert("Informe o operador.");
    const {error}=await supabase.from("porto_caixa_sessoes").insert({loja_slug:PORTO_LOJA_SLUG,operador:operador.trim(),valor_abertura:Number((abertura||"0").replace(",",".")),status:"aberto"});
    if(error)return alert(error.message); setOperador(""); await carregar();
  }

  function contaCaixa(){ return contas.find(c=>c.tipo==="CAIXA")||null; }

  async function salvarMovimento(){
    if(!sessao)return;
    const valor=Number((valorMov||"0").replace(",",".")); if(!descricao.trim()||valor<=0)return alert("Informe descrição e valor.");
    const conta = contaId ? contas.find(c=>c.id===contaId) : contaCaixa();
    const {data:mov,error}=await supabase.from("porto_caixa_movimentacoes").insert({loja_slug:PORTO_LOJA_SLUG,caixa_sessao_id:sessao.id,tipo:tipoMov,descricao:descricao.trim(),valor,conta_financeira_id:conta?.id||null}).select("id").single();
    if(error)return alert(error.message);

    if(conta){
      let finTipo:"ENTRADA"|"SAIDA" = tipoMov==="SUPRIMENTO"?"ENTRADA":"SAIDA";
      await supabase.from("porto_movimentacoes_financeiras").insert({loja_slug:PORTO_LOJA_SLUG,conta_financeira_id:conta.id,tipo:finTipo,categoria:tipoMov,descricao:descricao.trim(),valor,origem_tipo:"CAIXA_MOV",origem_id:mov.id});
    }
    setDescricao("");setValorMov("");setContaId(""); await carregarSessao(sessao.id);
  }

  async function fechar(){
    if(!sessao)return; if(contado==="")return alert("Informe quanto dinheiro foi contado fisicamente.");
    const resumo={dinheiro:totais.p.Dinheiro||0,pix:totais.p.Pix||0,debito:totais.p["Débito"]||0,credito:totais.p["Crédito"]||0,sangria:totais.m.SANGRIA||0,suprimento:totais.m.SUPRIMENTO||0,despesa:totais.m.DESPESA||0,boleto:totais.m.BOLETO||0,total_vendas:totais.totalVendas,dinheiro_esperado:esperado};
    const {error}=await supabase.from("porto_caixa_sessoes").update({status:"fechado",valor_fechamento:esperado,valor_contado:contadoN,diferenca,resumo_pagamentos:resumo,fechado_em:new Date().toISOString()}).eq("id",sessao.id);
    if(error)return alert(error.message); alert("Caixa fechado. Todas as vendas e movimentações ficaram consolidadas automaticamente."); setContado(""); await carregar();
  }

  if(loading)return <main className="min-h-screen bg-slate-100 p-8">Carregando caixa...</main>;

  return <main className="min-h-screen bg-slate-100 p-4 md:p-6"><div className="mx-auto max-w-7xl">
    <header className="flex items-center justify-between rounded-2xl bg-blue-900 p-4 text-white"><div><p className="text-xs font-bold text-blue-200">DROGARIAS PORTO • LOJA 2</p><h1 className="text-2xl font-black">Caixa</h1></div><div className="flex gap-2"><Link href="/drogariasporto/pdv" className="rounded-xl bg-white/10 p-2"><ArrowLeft/></Link><Link href="/drogariasporto/financeiro" className="rounded-xl bg-white px-4 py-2 font-bold text-blue-900">Financeiro</Link></div></header>

    {!sessao?<section className="mx-auto mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Abrir caixa</h2><div className="mt-4 grid gap-3"><input value={operador} onChange={e=>setOperador(e.target.value)} placeholder="Operador" className="rounded-xl border p-3"/><input value={abertura} onChange={e=>setAbertura(e.target.value)} placeholder="Fundo inicial" className="rounded-xl border p-3" inputMode="decimal"/><button onClick={abrir} className="rounded-xl bg-green-600 py-4 font-black text-white">ABRIR CAIXA</button></div></section>:
    <>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card titulo="Dinheiro" valor={totais.p.Dinheiro||0} icon={<Banknote/>}/><Card titulo="Pix" valor={totais.p.Pix||0} icon={<Building2/>}/><Card titulo="Débito" valor={totais.p["Débito"]||0} icon={<WalletCards/>}/><Card titulo="Crédito" valor={totais.p["Crédito"]||0} icon={<WalletCards/>}/><Card titulo="Total vendido" valor={totais.totalVendas} icon={<LockKeyhole/>}/>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Movimentação do caixa</h2><p className="text-sm text-slate-500">Sangria, suprimento e despesas entram no fechamento automaticamente.</p></div><Scissors className="text-red-600"/></div>
            <div className="mt-4 grid gap-3 md:grid-cols-4"><select value={tipoMov} onChange={e=>setTipoMov(e.target.value as any)} className="rounded-xl border p-3 font-bold"><option value="SANGRIA">Sangria</option><option value="SUPRIMENTO">Suprimento</option><option value="DESPESA">Despesa</option></select><input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Descrição" className="rounded-xl border p-3 md:col-span-2"/><input value={valorMov} onChange={e=>setValorMov(e.target.value)} placeholder="Valor" className="rounded-xl border p-3" inputMode="decimal"/></div>
            <div className="mt-3 flex gap-3"><select value={contaId} onChange={e=>setContaId(e.target.value)} className="flex-1 rounded-xl border p-3"><option value="">Caixa físico</option>{contas.filter(c=>c.tipo!=="CARTAO_RECEBER").map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select><button onClick={salvarMovimento} className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 font-black text-white"><PlusCircle size={18}/>Lançar</button></div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="border-b p-4"><h2 className="font-black">Vendas desta sessão</h2></div><div className="overflow-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Venda</th><th>Forma</th><th>Valor</th><th>Horário</th></tr></thead><tbody>{pagamentos.map(p=><tr key={p.id} className="border-t"><td className="p-3 font-mono">{p.venda_id.slice(0,8)}</td><td className="font-bold">{p.forma}</td><td>{brl(p.valor)}</td><td>{new Date(p.created_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</td></tr>)}</tbody></table></div></div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="border-b p-4"><h2 className="font-black">Sangrias, suprimentos e despesas</h2></div><div className="overflow-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Tipo</th><th>Descrição</th><th>Valor</th><th>Horário</th></tr></thead><tbody>{movimentos.map(m=><tr key={m.id} className="border-t"><td className="p-3 font-bold">{m.tipo}</td><td>{m.descricao}</td><td>{brl(m.valor)}</td><td>{new Date(m.created_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</td></tr>)}</tbody></table></div></div>
        </section>

        <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm xl:sticky xl:top-5"><h2 className="text-xl font-black">Fechamento automático</h2><div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm"><Linha n="Fundo inicial" v={sessao.valor_abertura}/><Linha n="+ Vendas dinheiro" v={totais.p.Dinheiro||0}/><Linha n="+ Suprimentos" v={totais.m.SUPRIMENTO||0}/><Linha n="- Sangrias" v={-(totais.m.SANGRIA||0)}/><Linha n="- Despesas" v={-(totais.m.DESPESA||0)}/><Linha n="- Boletos em dinheiro" v={-(totais.m.BOLETO||0)}/><div className="border-t pt-3 flex justify-between text-base"><span>Dinheiro esperado</span><b>{brl(esperado)}</b></div></div>
          <label className="mt-5 block text-sm font-bold">Dinheiro contado fisicamente</label><input value={contado} onChange={e=>setContado(e.target.value)} placeholder="0,00" className="mt-1 w-full rounded-xl border p-3 text-lg font-black" inputMode="decimal"/>{contado!==""&&<div className={`mt-3 rounded-xl p-3 text-center font-black ${Math.abs(diferenca)<0.01?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>Diferença: {brl(diferenca)}</div>}
          <button onClick={fechar} className="mt-5 w-full rounded-2xl bg-red-600 py-4 font-black text-white">FECHAR CAIXA</button><p className="mt-3 text-xs text-slate-500">Pix e cartões já ficam registrados nas contas financeiras; o fechamento físico considera somente dinheiro.</p>
        </aside>
      </div>
    </>}
  </div></main>;
}

function Card({titulo,valor,icon}:{titulo:string;valor:number;icon:React.ReactNode}){return <div className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-slate-500"><span className="text-sm font-bold">{titulo}</span>{icon}</div><div className="mt-2 text-2xl font-black text-blue-900">{brl(valor)}</div></div>}
function Linha({n,v}:{n:string;v:number}){return <div className="flex justify-between"><span>{n}</span><b className={v<0?"text-red-600":""}>{brl(v)}</b></div>}
