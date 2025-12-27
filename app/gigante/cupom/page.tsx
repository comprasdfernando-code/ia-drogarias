"use client";

import { useEffect, useMemo } from "react";

type Item = { nome: string; quantidade: number; preco: number };

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Ajuste aqui se quiser 80mm
const CUPOM_LARGURA_MM = 58;

export default function CupomPage() {
  // ✅ MVP: exemplo fixo (depois a gente lê do localStorage/querystring)
  const itens: Item[] = [
    { nome: "Torresmo", quantidade: 1, preco: 20 },
    { nome: "Frango", quantidade: 1, preco: 55 },
    { nome: "Cupim", quantidade: 1, preco: 70 },
  ];

  const subtotal = useMemo(
    () => itens.reduce((s, i) => s + i.preco * i.quantidade, 0),
    [itens]
  );

  const pedidoNumero = "#001";
  const data = new Date();

  useEffect(() => {
    // ✅ imprime
    setTimeout(() => window.print(), 300);

    // ✅ fecha depois de imprimir (nem todo navegador permite sempre, mas ajuda)
    const onAfterPrint = () => {
      try {
        window.close();
      } catch {}
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  return (
    <div className="cupom-root">
      {/* CSS do cupom */}
      <style>{`
        /* Tela */
        .cupom-root {
          display: flex;
          justify-content: center;
          padding: 12px;
          background: #fff;
        }

        .cupom {
          width: ${CUPOM_LARGURA_MM}mm;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 12px;
          line-height: 1.25;
          color: #000;
        }

        .center { text-align: center; }
        .bold { font-weight: 700; }
        .muted { opacity: 0.85; }

        .hr {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .item {
          margin: 6px 0;
        }

        .item-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 40mm;
        }

        /* Impressão */
        @media print {
          @page { margin: 0; }
          body { margin: 0; }
          .cupom-root { padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="cupom">
        <div className="center bold" style={{ fontSize: 14 }}>
          Gigante dos Assados
        </div>
        <div className="center muted">grande no sabor</div>

        <div className="hr" />

        <div className="row">
          <span>Pedido:</span>
          <span className="bold">{pedidoNumero}</span>
        </div>
        <div className="row">
          <span>Data:</span>
          <span>{data.toLocaleString("pt-BR")}</span>
        </div>

        <div className="hr" />

        {itens.map((i, idx) => (
          <div className="item" key={idx}>
            <div className="row">
              <span className="item-name">
                {i.quantidade}x {i.nome}
              </span>
              <span>{formatBRL(i.preco * i.quantidade)}</span>
            </div>
          </div>
        ))}

        <div className="hr" />

        <div className="row bold" style={{ fontSize: 13 }}>
          <span>Total:</span>
          <span>{formatBRL(subtotal)}</span>
        </div>

        <div className="hr" />

        <div className="center">Obrigado pela preferência!</div>
        <div className="center muted" style={{ marginTop: 6 }}>
          Volte sempre 🙂
        </div>

        {/* Botões só pra teste (não imprime) */}
        <div className="no-print" style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          >
            Imprimir
          </button>
          <button
            onClick={() => window.close()}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
