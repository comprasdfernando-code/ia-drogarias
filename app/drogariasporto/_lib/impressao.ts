export type ItemComprovante = {
  nome: string;
  qtd: number;
  precoUnit: number;
  total: number;
};

export type PagamentoComprovante = {
  forma: string;
  valor: number;
};

export type EnderecoEntregaComprovante = {
  endereco: string;
  numero: string;
  bairro: string;
  complemento?: string;
  referencia?: string;
};

export type ComprovantePorto = {
  numero: string;
  data: Date;
  origem: "PDV" | "SITE";
  tipo: "BALCAO" | "RETIRADA" | "ENTREGA";
  clienteNome?: string;
  clienteTelefone?: string;
  enderecoEntrega?: EnderecoEntregaComprovante | null;
  itens: ItemComprovante[];
  subtotal: number;
  taxaEntrega?: number;
  total: number;
  pagamentos: PagamentoComprovante[];
  observacoes?: string;
};

function money(v: number) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function esc(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function imprimirComprovantePorto(c: ComprovantePorto) {
  if (typeof window === "undefined") return;

  const endereco = c.enderecoEntrega;
  const itensHtml = c.itens
    .map(
      (i) => `
        <div class="item">
          <div class="nome">${esc(i.nome)}</div>
          <div class="linha"><span>${i.qtd} x ${money(i.precoUnit)}</span><b>${money(i.total)}</b></div>
        </div>`
    )
    .join("");

  const pagamentosHtml = c.pagamentos
    .map((p) => `<div class="linha"><span>${esc(p.forma)}</span><b>${money(p.valor)}</b></div>`)
    .join("");

  const entregaHtml =
    c.tipo === "ENTREGA" && endereco
      ? `
        <div class="separador"></div>
        <div class="titulo-bloco">DADOS DA ENTREGA</div>
        ${c.clienteNome ? `<div><b>Cliente:</b> ${esc(c.clienteNome)}</div>` : ""}
        ${c.clienteTelefone ? `<div><b>Telefone:</b> ${esc(c.clienteTelefone)}</div>` : ""}
        <div><b>Endereço:</b> ${esc(endereco.endereco)}, ${esc(endereco.numero)}</div>
        <div><b>Bairro:</b> ${esc(endereco.bairro)}</div>
        ${endereco.complemento ? `<div><b>Complemento:</b> ${esc(endereco.complemento)}</div>` : ""}
        ${endereco.referencia ? `<div><b>Referência:</b> ${esc(endereco.referencia)}</div>` : ""}
      `
      : c.tipo === "RETIRADA"
      ? `
        <div class="separador"></div>
        <div class="titulo-bloco">RETIRADA NA LOJA</div>
        ${c.clienteNome ? `<div><b>Cliente:</b> ${esc(c.clienteNome)}</div>` : ""}
        ${c.clienteTelefone ? `<div><b>Telefone:</b> ${esc(c.clienteTelefone)}</div>` : ""}
      `
      : "";

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Drogarias Porto - ${esc(c.numero)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { width: 72mm; margin: 0 auto; font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 11px; line-height: 1.35; }
  .center { text-align: center; }
  .loja { font-size: 16px; font-weight: 900; }
  .sub { font-size: 11px; font-weight: 700; }
  .nao-fiscal { margin-top: 4px; font-size: 9px; }
  .separador { border-top: 1px dashed #000; margin: 8px 0; }
  .linha { display: flex; justify-content: space-between; gap: 8px; }
  .item { margin: 6px 0; }
  .nome { font-weight: 700; }
  .titulo-bloco { font-weight: 900; margin-bottom: 4px; }
  .total { font-size: 15px; font-weight: 900; }
  .rodape { margin-top: 10px; text-align: center; font-size: 9px; }
</style>
</head>
<body>
  <div class="center loja">DROGARIAS PORTO</div>
  <div class="center sub">LOJA 2</div>
  <div class="center nao-fiscal">COMPROVANTE DE VENDA / PEDIDO - NÃO FISCAL</div>
  <div class="separador"></div>
  <div><b>Nº:</b> ${esc(c.numero)}</div>
  <div><b>Data:</b> ${esc(c.data.toLocaleString("pt-BR"))}</div>
  <div><b>Origem:</b> ${esc(c.origem)}</div>
  <div><b>Tipo:</b> ${c.tipo === "ENTREGA" ? "ENTREGA" : c.tipo === "RETIRADA" ? "RETIRADA" : "BALCÃO"}</div>
  ${entregaHtml}
  <div class="separador"></div>
  <div class="titulo-bloco">ITENS</div>
  ${itensHtml}
  <div class="separador"></div>
  <div class="linha"><span>Subtotal</span><b>${money(c.subtotal)}</b></div>
  ${Number(c.taxaEntrega || 0) > 0 ? `<div class="linha"><span>Taxa de entrega</span><b>${money(Number(c.taxaEntrega || 0))}</b></div>` : ""}
  <div class="linha total"><span>TOTAL</span><span>${money(c.total)}</span></div>
  <div class="separador"></div>
  <div class="titulo-bloco">PAGAMENTO</div>
  ${pagamentosHtml || '<div>Não informado</div>'}
  ${c.observacoes ? `<div class="separador"></div><div><b>Observações:</b> ${esc(c.observacoes)}</div>` : ""}
  <div class="rodape">Obrigado pela preferência!</div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1200);
  }, 250);
}
