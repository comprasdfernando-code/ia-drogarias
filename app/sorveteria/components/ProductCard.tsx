"use client";

import Image from "next/image";
import { useCart } from "app/contexts/CartContext";

export default function ProductCard({ item }) {
  const { adicionarProduto } = useCart();

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: 15,
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#eee",
          borderRadius: 10,
        }}
      >
        {item.imagem ? (
          <Image
            src={item.imagem}
            alt={item.nome}
            width={140}
            height={180}
            style={{ objectFit: "contain" }}
          />
        ) : (
          <span style={{ color: "#aaa" }}>sem imagem</span>
        )}
      </div>

      <p style={{ marginTop: 10, fontWeight: "bold", color: "#333" }}>
        {item.nome}
      </p>

      <p style={{ marginTop: 5, color: "#555" }}>{item.sabor}</p>

      <p style={{ marginTop: 10, fontSize: 18, fontWeight: "bold" }}>
        R$ {item.preco}
      </p>

      <button
        onClick={() => adicionarProduto(item)}
        style={{
          width: "100%",
          marginTop: 10,
          background: "#ff48c4",
          border: "none",
          color: "white",
          padding: "8px 0",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Adicionar
      </button>
    </div>
  );
}
