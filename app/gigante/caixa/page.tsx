"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CaixaGigante() {
  const [caixa, setCaixa] = useState<any>(null);
  const [valorAbertura, setValorAbertura] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [vendas, setVendas] = useState<any[]>([]);

  // Carregar caixa aberto
  async function carregarCaixa() {
    const { data } = await supabase
      .from("gigante_caixa")
      .select("*")
      .eq("status", "aberto")
      .single();

    setCaixa(data || null);
    setCarregando(false);

    if (data) carregarVendasDoDia(data.data_abertura);
  }

  // Carrega vendas do período do caixa
  async function carregarVendasDoDia(inicio: string) {
    const { data } = await supabase
      .from("gigante_vendas")
      .select("*")
      .gte("data", inicio)
      .order("data");

    setVendas(data || []);
  }

  useEffect(() => {
    carregarCaixa();
  }, []);

  // Abrir caixa
  async function abrirCaixa() {
    if (!valorAbertura) {
      alert("Digite o valor de abertura");
      return;
    }

    const { error } = await supabase.from("gigante_caixa").insert({
      valor_abertura: parseFloat(valorAbertura),
      status: "aberto",
      operador: "Operador 1",
    });

    if (!error) {
      setValorAbertura("");
      carregarCaixa();
    }
  }

  // Fechar caixa
  async function fecharCaixa() {
    if (!confirm("Deseja realmente fechar o caixa?")) return;

    const totais = {
      pix: 0,
      dinheiro: 0,
      debito: 0,
      credito: 0,
    };

    vendas.forEach((v) => {
      if (v.pagamento === "pix") totais.pix += Number(v.total);
      if (v.pagamento === "dinheiro") totais.dinheiro += Number(v.total);
      if (v.pagamento === "debito") totais.debito += Number(v.total);
      if (v.pagamento === "credito") totais.credito += Number(v.total);
    });

    const totalGeral =
      totais.pix + totais.dinheiro + totais.debito + totais.credito;

    await supabase
      .from("gigante_caixa")
      .update({
        data_fechamento: new Date().toISOString(),
        total_pix: totais.pix,
        total_dinheiro: totais.dinheiro,
        total_debito: totais.debito,
        total_credito: totais.credito,
        total_vendido: totalGeral,
        valor_fechamento: totalGeral,
        status: "fechado",
      })
      .eq("id", caixa.id);

    setCaixa(null);
    setVendas([]);
    alert("Caixa fechado!");
  }

  if (carregando) return <p>Carregando...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">

      <h1 className="text-3xl font-bold mb-4">💵 Caixa — Gigante dos Assados</h1>

      {/* Caixa fechado */}
      {!caixa && (
        <div className="bg-white shadow p-5 rounded">
          <h2 className="text-xl font-semibold mb-2">Abertura de Caixa</h2>

          <input
            type="number"
            placeholder="Valor de abertura (troco)"
            className="border p-2 rounded w-full"
            value={valorAbertura}
            onChange={(e) => setValorAbertura(e.target.value)}
          />

          <button
            onClick={abrirCaixa}
            className="bg-green-600 text-white w-full mt-3 p-3 rounded"
          >
            🧾 Abrir Caixa
          </button>
        </div>
      )}

      {/* Caixa Aberto */}
      {caixa && (
        <div className="bg-white shadow p-5 rounded">

          <h2 className="text-xl font-semibold mb-4">
            Caixa aberto às {new Date(caixa.data_abertura).toLocaleTimeString()}
          </h2>

          <p className="text-lg mb-4">
            Valor de abertura: <strong>R$ {caixa.valor_abertura.toFixed(2)}</strong>
          </p>

          <h3 className="text-xl font-bold mb-2">📊 Movimento do Caixa</h3>

          <ul className="mb-4">
            <li>💸 PIX: R$ {vendas
              .filter((v) => v.pagamento === "pix")
              .reduce((s, v) => s + Number(v.total), 0)
              .toFixed(2)}</li>

            <li>💵 Dinheiro: R$ {vendas
              .filter((v) => v.pagamento === "dinheiro")
              .reduce((s, v) => s + Number(v.total), 0)
              .toFixed(2)}</li>

            <li>🟦 Débito: R$ {vendas
              .filter((v) => v.pagamento === "debito")
              .reduce((s, v) => s + Number(v.total), 0)
              .toFixed(2)}</li>

            <li>🟥 Crédito: R$ {vendas
              .filter((v) => v.pagamento === "credito")
              .reduce((s, v) => s + Number(v.total), 0)
              .toFixed(2)}</li>
          </ul>

          <h3 className="text-xl font-bold">
            Total do Caixa:{" "}
            <span className="text-green-600">
              R${" "}
              {vendas
                .reduce((s, v) => s + Number(v.total), 0)
                .toFixed(2)}
            </span>
          </h3>

          <button
            onClick={fecharCaixa}
            className="bg-red-600 text-white w-full mt-6 p-3 rounded"
          >
            🔒 Fechar Caixa
          </button>
        </div>
      )}
    </div>
  );
}
