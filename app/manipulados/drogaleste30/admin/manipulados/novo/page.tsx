"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOJA = "Droga Leste 30";

export default function NovoManipuladoPage() {
  const [req, setReq] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteEndereco, setClienteEndereco] = useState("");
  const [formula, setFormula] = useState("");
  const [apresentacao, setApresentacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [observacaoInterna, setObservacaoInterna] = useState("");
  const [valor, setValor] = useState("");
  const [pago, setPago] = useState(false);
  const [solicitadoPor, setSolicitadoPor] = useState("");
  const [receita, setReceita] = useState<File | null>(null);
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadArquivo(
    bucket: string,
    pasta: string,
    file: File
  ): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const nomeArquivo = `${pasta}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(nomeArquivo, file, { upsert: false });

    if (error) throw error;
    return data.path;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let receitaUrl: string | null = null;
      let comprovanteUrl: string | null = null;

      if (receita) {
        receitaUrl = await uploadArquivo(
          "receitas-manipulados",
          "drogaleste30",
          receita
        );
      }

      if (comprovante) {
        comprovanteUrl = await uploadArquivo(
          "comprovantes-manipulados",
          "drogaleste30",
          comprovante
        );
      }

      const { error } = await supabase.from("manipulados_pedidos").insert({
        loja: LOJA,
        req,
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        cliente_endereco: clienteEndereco,
        formula,
        apresentacao,
        observacoes,
        observacao_interna: observacaoInterna,
        valor: Number(valor || 0),
        pago,
        status: "solicitado_manipulacao",
        solicitado_por: solicitadoPor,
        receita_url: receitaUrl,
        comprovante_url: comprovanteUrl,
      });

      if (error) throw error;

      alert("Pedido cadastrado com sucesso.");
      window.location.href = "/manipulados/drogaleste30/admin/manipulados";
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro ao salvar pedido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Novo pedido manipulado</h1>
          <p className="text-sm text-gray-500">{LOJA}</p>
        </div>

        <Link
          href="/manipulados/drogaleste30/admin/manipulados"
          className="rounded-xl border px-4 py-2"
        >
          Voltar
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border bg-white p-6"
      >
        <input
          className="w-full rounded-xl border p-3"
          placeholder="REQ / número do requerimento"
          value={req}
          onChange={(e) => setReq(e.target.value)}
        />

        <input
          className="w-full rounded-xl border p-3"
          placeholder="Nome do cliente"
          value={clienteNome}
          onChange={(e) => setClienteNome(e.target.value)}
          required
        />

        <input
          className="w-full rounded-xl border p-3"
          placeholder="Telefone do cliente"
          value={clienteTelefone}
          onChange={(e) => setClienteTelefone(e.target.value)}
        />

        <input
          className="w-full rounded-xl border p-3"
          placeholder="Endereço do cliente"
          value={clienteEndereco}
          onChange={(e) => setClienteEndereco(e.target.value)}
        />

        <input
          className="w-full rounded-xl border p-3"
          placeholder="Fórmula"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          required
        />

        <input
          className="w-full rounded-xl border p-3"
          placeholder="Apresentação"
          value={apresentacao}
          onChange={(e) => setApresentacao(e.target.value)}
          required
        />

        <textarea
          className="w-full rounded-xl border p-3"
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
        />

        <textarea
          className="w-full rounded-xl border p-3"
          placeholder="Observação interna"
          value={observacaoInterna}
          onChange={(e) => setObservacaoInterna(e.target.value)}
          rows={3}
        />

        <input
          className="w-full rounded-xl border p-3"
          type="number"
          step="0.01"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <input
          className="w-full rounded-xl border p-3"
          placeholder="Quem solicitou"
          value={solicitadoPor}
          onChange={(e) => setSolicitadoPor(e.target.value)}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pago}
            onChange={(e) => setPago(e.target.checked)}
          />
          Pago
        </label>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Receita
          </label>
          <input
            className="w-full rounded-xl border p-3"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setReceita(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Comprovante de pagamento
          </label>
          <input
            className="w-full rounded-xl border p-3"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setComprovante(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar pedido"}
        </button>
      </form>
    </div>
  );
}