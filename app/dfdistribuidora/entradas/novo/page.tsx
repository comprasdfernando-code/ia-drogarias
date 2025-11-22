"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function NovaEntrada() {
  const router = useRouter();

  const [fornecedor, setFornecedor] = useState("");
  const [nota, setNota] = useState("");
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  const [itens, setItens] = useState<any[]>([]);

  async function carregarProdutos() {
    const { data } = await supabase.from("df_produtos").select("*");
    if (data) setProdutos(data);
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  function addItem(p: any) {
    const quantidade = 1;
    const custo = p.preco_custo;

    if (itens.find((i) => i.id === p.id)) return;

    setItens([...itens, { ...p, quantidade, custo }]);
  }

  async function salvar() {
    if (!fornecedor) return alert("Fornecedor obrigatório.");

    const { data: entrada } = await supabase
      .from("df_entradas")
      .insert({
        fornecedor,
        numero_nota: nota,
        data: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    for (const item of itens) {
      await supabase.from("df_entradas_itens").insert({
        entrada_id: entrada.id,
        produto_id: item.id,
        quantidade: item.quantidade,
        custo_unitario: item.custo,
        subtotal: item.quantidade * item.custo,
      });

      // atualiza estoque
      await supabase
        .from("df_produtos")
        .update({
          estoque: (item.estoque ?? 0) + item.quantidade,
          preco_custo: item.custo, // opcional atualizar custo
        })
        .eq("id", item.id);
    }

    alert("Entrada registrada com sucesso!");
    router.push("/dfdistribuidora/entradas");
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nova Entrada</h1>

      <div className="mb-4">
        <input
          placeholder="Fornecedor"
          className="border p-2 w-full mb-2"
          value={fornecedor}
          onChange={(e) => setFornecedor(e.target.value)}
        />
        <input
          placeholder="Número da Nota (opcional)"
          className="border p-2 w-full"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
      </div>

      <h2 className="text-xl font-bold mt-4 mb-2">Adicionar Itens</h2>

      <input
        placeholder="Buscar produto..."
        className="border p-2 w-full mb-3"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="border rounded p-2 mb-4 max-h-60 overflow-y-scroll">
        {produtos
          .filter((p) =>
            p.nome.toLowerCase().includes(busca.toLowerCase())
          )
          .map((p) => (
            <div
              key={p.id}
              className="p-2 border-b cursor-pointer hover:bg-gray-100"
              onClick={() => addItem(p)}
            >
              {p.nome} — {p.apresentacao}
            </div>
          ))}
      </div>

      <h2 className="text-xl font-bold mt-4 mb-2">Itens da Entrada</h2>

      <table className="w-full border">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th>Produto</th>
            <th>Qtd</th>
            <th>Custo</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.id} className="border-b">
              <td>{i.nome}</td>
              <td>
                <input
                  type="number"
                  value={i.quantidade}
                  className="border p-1 w-16"
                  onChange={(e) =>
                    setItens(
                      itens.map((x) =>
                        x.id === i.id
                          ? { ...x, quantidade: Number(e.target.value) }
                          : x
                      )
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={i.custo}
                  className="border p-1 w-24"
                  onChange={(e) =>
                    setItens(
                      itens.map((x) =>
                        x.id === i.id
                          ? { ...x, custo: Number(e.target.value) }
                          : x
                      )
                    )
                  }
                />
              </td>
              <td>R$ {(i.quantidade * i.custo).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded shadow"
        onClick={salvar}
      >
        Finalizar Entrada
      </button>
    </div>
  );
}
