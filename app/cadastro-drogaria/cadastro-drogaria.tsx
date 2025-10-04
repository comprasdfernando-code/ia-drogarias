"use client";

import { useState } from "react";
const ADMIN_WHATS = "5511948343725";

export default function CadastroDrogariaPage() {
  const [fantasia, setFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [resp, setResp] = useState("");
  const [tel, setTel] = useState("");
  const [bairro, setBairro] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg =
      *Cadastro de Drogaria*
      • Nome Fantasia: ${fantasia}
      • CNPJ: ${cnpj}
      • Responsável: ${resp}
      • WhatsApp: ${tel}
      • Bairro/Cidade: ${bairro};

    const url = https://wa.me/${ADMIN_WHATS}?text=${encodeURIComponent(msg)};
    window.open(url, "_blank");
  }

  return (
    <main className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Cadastro de Drogaria</h1>
      <p className="text-gray-600 mb-6">Credencie sua loja para oferecer serviços e e-commerce.</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-2xl border">
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Nome Fantasia" required value={fantasia} onChange={(e)=>setFantasia(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2" placeholder="CNPJ" required value={cnpj} onChange={(e)=>setCnpj(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Responsável" required value={resp} onChange={(e)=>setResp(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Telefone / WhatsApp" required value={tel} onChange={(e)=>setTel(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Bairro / Cidade" required value={bairro} onChange={(e)=>setBairro(e.target.value)} />
        <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
          Enviar pelo WhatsApp
        </button>
      </form>
    </main>
  );
}