"use client";

import { useCart } from "../../contexts/CartContext";

export default function FinalizarModal({ close }) {
  const { carrinho, limparCarrinho } = useCart();

  const telefone = "11999999999"; // coloque o número da OGGI aqui!

  const mensagem = carrinho
    .map((p) => `• ${p.nome} - R$ ${p.preco}`)
    .join("%0A");

  const total = carrinho.reduce(
  (acc, item) => acc + Number(item.preco) * Number(item.quantidade ?? 1),
  0
);


  const link = `https://wa.me/${telefone}?text=Olá!%20Quero%20fazer%20um%20pedido:%0A${mensagem}%0A%0ATotal:%20R$%20${total.toFixed(2)}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99,
      }}
    >
      <div
        style={{
          background: "white",
          padding: 25,
          width: "90%",
          maxWidth: 400,
          borderRadius: 12,
        }}
      >
        <h2>Finalizar Pedido</h2>

        <p style={{ marginTop: 10 }}>
          Revise abaixo os itens do seu pedido:
        </p>

        <div style={{ marginTop: 15 }}>
          {carrinho.map((item, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              {item.nome} — R$ {item.preco}
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 20 }}>Total: R$ {total.toFixed(2)}</h3>

        <a
          href={link}
          target="_blank"
          style={{
            display: "block",
            marginTop: 20,
            background: "#25d366",
            color: "#fff",
            padding: "10px 0",
            borderRadius: 10,
            textAlign: "center",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Enviar Pedido no WhatsApp
        </a>

        <button
          onClick={close}
          style={{
            marginTop: 10,
            width: "100%",
            background: "#ccc",
            padding: "8px 0",
            borderRadius: 10,
            border: "none",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
