import Link from "next/link";

const modulos = [
  ["Site da loja","/drogariasporto","Vitrine pública da Drogarias Porto Loja 2"],
  ["Produtos","/drogariasporto/produtos","Catálogo, busca e carrinho"],
  ["PDV","/drogariasporto/pdv","Venda rápida, EAN e pagamento misto"],
  ["Caixa","/drogariasporto/caixa","Abertura, vendas automáticas, sangrias e fechamento"],
  ["Financeiro","/drogariasporto/financeiro","Dinheiro, banco, cartões e boletos"],
];

export default function PortoAdminPage(){
  return <main className="min-h-screen bg-slate-100 p-6"><div className="mx-auto max-w-6xl"><div className="rounded-2xl bg-blue-900 p-6 text-white"><p className="text-xs font-bold text-blue-200">DROGARIAS PORTO • LOJA 2</p><h1 className="text-3xl font-black">Administração</h1><p className="mt-1 text-blue-100">Site + PDV + Caixa + Financeiro + vínculo FV</p></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{modulos.map(([t,h,d])=><Link key={h} href={h} className="rounded-2xl border bg-white p-6 shadow-sm hover:border-blue-500"><b className="text-lg text-blue-900">{t}</b><p className="mt-2 text-sm text-slate-500">{d}</p></Link>)}</div><div className="mt-6 rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">Fluxo da Loja 2</h2><p className="mt-2 text-slate-600">Venda do PDV → forma(s) de pagamento → caixa/conta financeira → fechamento automático. Boletos pagos pelo caixa físico também entram como saída no fechamento. Produtos continuam vinculados ao catálogo FV pelo slug <b>drogariasporto-loja2</b>.</p></div></div></main>
}
