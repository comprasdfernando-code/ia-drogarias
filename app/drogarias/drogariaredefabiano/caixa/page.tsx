"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOJA = "drogariaredefabiano";

export default function CaixaPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [boletos, setBoletos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Formulário de novas movimentações
  const [tipo, setTipo] = useState<"Entrada" | "Saída">("Entrada");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");

  // Formulário de novo boleto
  const [fornecedor, setFornecedor] = useState("");
  const [descricaoBoleto, setDescricaoBoleto] = useState("");
  const [valorBoleto, setValorBoleto] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);

    const { data: movs } = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("loja", LOJA)
      .order("data", { ascending: false });

    const { data: bol } = await supabase
      .from("boletos_a_vencer")
      .select("*")
      .eq("loja", LOJA)
      .order("data_vencimento", { ascending: true });

    setEntradas(movs?.filter((m) => m.tipo === "Entrada") || []);
    setSaidas(movs?.filter((m) => m.tipo === "Saída") || []);
    setBoletos(bol || []);
    setCarregando(false);
  }

  function fmt(n: number) {
    return n?.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  async function registrarMovimentacao() {
    if (!descricao || !valor) {
      alert("Preencha a descrição e o valor!");
      return;
    }

    await supabase.from("movimentacoes_caixa").insert({
      tipo,
      descricao,
      valor: Number(valor),
      forma_pagamento: formaPagamento,
      data: new Date(),
      loja: LOJA,
    });

    alert(`${tipo} registrada com sucesso! ✅`);
    setDescricao("");
    setValor("");
    carregarDados();
  }

  async function registrarBoleto() {
    if (!fornecedor || !valorBoleto || !dataVencimento) {
      alert("Preencha fornecedor, valor e data de vencimento!");
      return;
    }

    await supabase.from("boletos_a_vencer").insert({
      fornecedor,
      descricao: descricaoBoleto,
      valor: Number(valorBoleto),
      data_vencimento: dataVencimento,
      loja: LOJA,
    });

    alert("Boleto cadastrado com sucesso! 🧾");
    setFornecedor("");
    setDescricaoBoleto("");
    setValorBoleto("");
    setDataVencimento("");
    carregarDados();
  }

  async function marcarComoPago(boleto: any) {
    await supabase
      .from("boletos_a_vencer")
      .update({ pago: true, data_pagamento: new Date() })
      .eq("id", boleto.id);

    await supabase.from("movimentacoes_caixa").insert(`{
      tipo: "Saída",
      descricao: Pagamento de boleto ${boleto.fornecedor},
      valor: boleto.valor,
      forma_pagamento: "Boleto",
      data: new Date(),
      loja: LOJA,
    }`);

    alert("Boleto pago e registrado no caixa ✅");
    carregarDados();
  }

  const totalEntradas = entradas.reduce((a, i) => a + i.valor, 0);
  const totalSaidas = saidas.reduce((a, i) => a + i.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
        💼 Caixa - Drogaria Rede Fabiano
      </h1>

      {carregando ? (
        <p className="text-center text-gray-500">Carregando dados...</p>
      ) : (
        <>
          {/* FORMULÁRIO DE NOVA MOVIMENTAÇÃO */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold text-lg mb-3 text-blue-700">
              ➕ Nova Movimentação
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="border rounded px-3 py-2"
              >
                <option>Entrada</option>
                <option>Saída</option>
              </select>

              <input
                type="text"
                placeholder="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="border rounded px-3 py-2"
              />

              <input
                type="number"
                placeholder="Valor"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="border rounded px-3 py-2"
              />

              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option>Dinheiro</option>
                <option>Pix</option>
                <option>Cartão</option>
                <option>Boleto</option>
                <option>Fiado</option>
              </select>
            </div>
            <button
              onClick={registrarMovimentacao}
              className="mt-3 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold"
            >
              Salvar
            </button>
          </div>

          {/* FORMULÁRIO DE BOLETO */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold text-lg mb-3 text-blue-700">
              🧾 Registrar Boleto a Vencer
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Fornecedor"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Descrição"
                value={descricaoBoleto}
                onChange={(e) => setDescricaoBoleto(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Valor"
                value={valorBoleto}
                onChange={(e) => setValorBoleto(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
            <button
              onClick={registrarBoleto}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold"
            >
              Registrar Boleto
            </button>
          </div>

          {/* LISTAGENS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ENTRADAS */}
            <section className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-semibold text-green-700 text-lg mb-3">Entradas 💰</h2>
              <ul className="space-y-2 text-sm">
                {entradas.map((e) => (
                  <li key={e.id} className="flex justify-between border-b pb-1">
                    <span>{e.descricao}</span>
                    <b>R$ {fmt(e.valor)}</b>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right font-bold text-green-700">
                Total: R$ {fmt(totalEntradas)}
              </p>
            </section>

            {/* SAÍDAS */}
            <section className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-semibold text-red-700 text-lg mb-3">Saídas 💸</h2>
              <ul className="space-y-2 text-sm">
                {saidas.map((s) => (
                  <li key={s.id} className="flex justify-between border-b pb-1">
                    <span>{s.descricao}</span>
                    <b>R$ {fmt(s.valor)}</b>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right font-bold text-red-700">
                Total: R$ {fmt(totalSaidas)}
              </p>
            </section>

            {/* BOLETOS */}
            <section className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-semibold text-blue-700 text-lg mb-3">Boletos a Vencer 🧾</h2>
              <ul className="space-y-2 text-sm">
                {boletos.map((b) => (
                  <li
                    key={b.id}
                    className={`flex justify-between items-center border-b pb-2 ${
                      b.pago
                        ? "text-green-600"
                        : new Date(b.data_vencimento) < new Date()
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{b.fornecedor}</p>
                      <p className="text-xs">
                        Vence em {new Date(b.data_vencimento).toLocaleDateString()} – R$ {fmt(b.valor)}
                      </p>
                    </div>
                    {!b.pago && (
                      <button
                        onClick={() => marcarComoPago(b)}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                      >
                        Marcar Pago
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* SALDO FINAL */}
          <div className="mt-8 bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-xl font-bold">
              💵 Saldo Atual:{" "}
              <span
                className={`${
                  saldo >= 0 ? "text-green-700" : "text-red-700"
                } font-bold`}
              >
                R$ {fmt(saldo)}
              </span>
            </h3>
          </div>
        </>
      )}
    </main>
  );
}