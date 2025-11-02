"use client";

export default function GiganteHome() {
  return (
    <main style={{ textAlign: "center", padding: "40px 0" }}>
      <img
        src="/gigante-logo.png"
        alt="Gigante dos Assados"
        style={{ width: "220px", margin: "0 auto 16px" }}
      />
      <h1 style={{ fontSize: "26px", fontWeight: "bold", color: "#C8102E" }}>
        Gigante dos Assados
      </h1>
      <h2 style={{ fontSize: "18px", color: "#000" }}>Grande no sabor</h2>

      <div
        style={{
          marginTop: 30,
          display: "flex",
          justifyContent: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <a href="/gigante/pdv">
          <button
            style={{
              background: "#C8102E",
              color: "#fff",
              padding: "12px 24px",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            PDV
          </button>
        </a>
        <a href="/gigante/produtos">
          <button
            style={{
              background: "#C8102E",
              color: "#fff",
              padding: "12px 24px",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Produtos
          </button>
        </a>
        <a href="/gigante/caixa">
          <button
            style={{
              background: "#C8102E",
              color: "#fff",
              padding: "12px 24px",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Caixa
          </button>
        </a>
      </div>
    </main>
  );
}