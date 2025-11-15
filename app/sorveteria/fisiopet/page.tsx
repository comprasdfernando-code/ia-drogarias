"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Estrutura de cada item da implantação
type Item = {
  id: string;
  categoria: string;
  descricao: string;
  valor_total: number;
  entrada: number;
  parcelas: number;
  parcelas_pagas: number;
  valor_parcela: number;
  saldo_restante: number;
};

export default function ImplantacaoFisioPet() {
  const [itens, setItens] = useState<Item[]>([]);
  const [form, setForm] = useState({
    categoria: "",
    descricao: "",
    valor_total: "",
    entrada: "",
    parcelas: "",
  });

  // Carregar dados
  async function carregarItens() {
    const { data, error } = await supabase
      .from("implantacao_fisiopet")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setItens(data);
  }

  useEffect(() => {
    carregarItens();
  }, []);

  // Salvar novo item
  async function salvarItem() {
    if (!form.valor_total || !form.descricao || !form.categoria) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    const valorTotal = Number(form.valor_total);
    const entrada = Number(form.entrada || 0);
    const parcelas = Number(form.parcelas || 0);

    const saldoFinanciado = valorTotal - entrada;
    const valorParcela = parcelas > 0 ? saldoFinanciado / parcelas : 0;

    const { error } = await supabase.from("implantacao_fisiopet").insert([
      {
        categoria: form.categoria,
        descricao: form.descricao,
        valor_total: valorTotal,
        entrada: entrada,
        parcelas: parcelas,
        parcelas_pagas: 0,
        valor_parcela: valorParcela,
        saldo_restante: saldoFinanciado,
      },
    ]);

    if (error) {
      alert("Erro ao salvar.");
      return;
    }

    setForm({
      categoria: "",
      descricao: "",
      valor_total: "",
      entrada: "",
      parcelas: "",
    });

    carregarItens();
  }

  // Registrar pagamento de parcela
  async function pagarParcela(item: Item) {
    if (item.parcelas_pagas >= item.parcelas) return;

    const novasPagas = item.parcelas_pagas + 1;
    const novoSaldo = item.saldo_restante - item.valor_parcela;

    const { error } = await supabase
      .from("implantacao_fisiopet")
      .update({
        parcelas_pagas: novasPagas,
        saldo_restante: novoSaldo,
      })
      .eq("id", item.id);

    if (!error) carregarItens();
  }

  // Totais gerais
  const totalInvestido = itens.reduce(
    (acc, curr) => acc + (curr.valor_total - curr.saldo_restante),
    0
  );

  const totalPendente = itens.reduce((acc, curr) => acc + curr.saldo_restante, 0);

  return (
    <main className="max-w-3xl mx-auto p-6">

      <h1 className="text-3xl font-bold text-center mb-6">
        🐾💛 Implantação FisioPet – Controle da Franquia
      </h1>

      {/* FORMULÁRIO */}
      <div className="bg-white shadow p-5 rounded mb-8">
        <h2 className="text-lg font-bold mb-4">Cadastrar novo item</h2>

        <select
          className="border p-2 rounded w-full mb-3"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        >
          <option value="">Selecione a Categoria</option>
          <option>Equipamentos</option>
          <option>Reforma / Pedreiro</option>
          <option>Fachada</option>
          <option>Documentação</option>
          <option>Taxa da Franquia</option>
          <option>Marketing Inicial</option>
          <option>Outros</option>
        </select>

        <input
          className="border p-2 rounded w-full mb-3"
          placeholder="Descrição do item"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />

        <input
          type="number"
          className="border p-2 rounded w-full mb-3"
          placeholder="Valor total do item"
          value={form.valor_total}
          onChange={(e) => setForm({ ...form, valor_total: e.target.value })}
        />

        <input
          type="number"
          className="border p-2 rounded w-full mb-3"
          placeholder="Entrada (opcional)"
          value={form.entrada}
          onChange={(e) => setForm({ ...form, entrada: e.target.value })}
        />

        <input
          type="number"
          className="border p-2 rounded w-full mb-4"
          placeholder="Quantidade de parcelas (opcional)"
          value={form.parcelas}
          onChange={(e) => setForm({ ...form, parcelas: e.target.value })}
        />

        <button
          onClick={salvarItem}
          className="bg-blue-600 text-white w-full p-3 rounded"
        >
          Salvar Item
        </button>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-100 p-4 rounded text-center shadow">
          <p>Total Investido</p>
          <p className="font-bold text-green-700 text-xl">
            R$ {totalInvestido.toFixed(2)}
          </p>
        </div>

        <div className="bg-red-100 p-4 rounded text-center shadow">
          <p>Total Pendente</p>
          <p className="font-bold text-red-700 text-xl">
            R$ {totalPendente.toFixed(2)}
          </p>
        </div>
      </div>

      {/* LISTAGEM */}
      <h2 className="text-xl font-bold mb-4">Itens da Implantação</h2>

      <ul className="space-y-4">
        {itens.map((item) => (
          <li key={item.id} className="bg-white p-4 rounded shadow">

            <p className="font-bold text-lg">{item.descricao}</p>
            <p className="text-sm opacity-70 mb-2">{item.categoria}</p>

            <p><strong>Valor total:</strong> R$ {item.valor_total.toFixed(2)}</p>
            <p><strong>Entrada:</strong> R$ {item.entrada.toFixed(2)}</p>
            <p><strong>Saldo restante:</strong> R$ {item.saldo_restante.toFixed(2)}</p>

            {item.parcelas > 0 && (
              <>
                <p><strong>Parcelas:</strong> {item.parcelas_pagas}/{item.parcelas}</p>
                <p><strong>Valor da parcela:</strong> R$ {item.valor_parcela.toFixed(2)}</p>

                {item.parcelas_pagas < item.parcelas && (
                  <button
                    onClick={() => pagarParcela(item)}
                    className="bg-green-600 text-white mt-3 p-2 rounded"
                  >
                    Registrar pagamento da próxima parcela
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
