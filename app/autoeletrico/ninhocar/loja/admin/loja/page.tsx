"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Produto = {
  id: string;
  created_at?: string;
  ativo: boolean;

  nome: string;
  categoria?: string | null;
  descricao?: string | null;

  preco: number;
  estoque: number;
  imagem_url?: string | null;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminLojaPage() {
  const [items, setItems] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);

  // form
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("0");
  const [estoque, setEstoque] = useState("0");
  const [imagem, setImagem] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function resetForm() {
    setNome("");
    setCategoria("");
    setDescricao("");
    setPreco("0");
    setEstoque("0");
    setImagem("");
    setAtivo(true);
  }

  function fillForm(p: Produto) {
    setNome(p.nome || "");
    setCategoria(p.categoria || "");
    setDescricao(p.descricao || "");
    setPreco(String(p.preco ?? 0));
    setEstoque(String(p.estoque ?? 0));
    setImagem(p.imagem_url || "");
    setAtivo(!!p.ativo);
  }

  async function load() {
    setLoading(true);
    setMsg(null);
    setErr(null);

    const { data, error } = await supabase
      .from("ninhocar_produtos")
      .select("id,created_at,ativo,nome,categoria,descricao,preco,estoque,imagem_url")
      .order("created_at", { ascending: false });

    if (error) setErr(error.message);
    else setItems((data || []) as any);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((p) => (p.nome || "").toLowerCase().includes(qq));
  }, [items, q]);

  async function save() {
    setMsg(null);
    setErr(null);

    if (!nome.trim()) {
      setErr("Informe o nome do produto.");
      return;
    }

    const payload = {
      ativo,
      nome: nome.trim(),
      categoria: categoria.trim() || null,
      descricao: descricao.trim() || null,
      preco: Number(preco || 0),
      estoque: Number(estoque || 0),
      imagem_url: imagem.trim() || null,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from("ninhocar_produtos")
          .update(payload)
          .eq("id", editing.id);

        if (error) throw error;
        setMsg("Produto atualizado.");
      } else {
        const { error } = await supabase.from("ninhocar_produtos").insert(payload);
        if (error) throw error;
        setMsg("Produto criado.");
      }

      setOpen(false);
      setEditing(null);
      resetForm();
      await load();
    } catch (e: any) {
      setErr(e?.message || "Erro ao salvar.");
    }
  }

  async function del(id: string) {
    setMsg(null);
    setErr(null);

    const ok = window.confirm("Excluir este produto? (não pode desfazer)");
    if (!ok) return;

    const { error } = await supabase.from("ninhocar_produtos").delete().eq("id", id);
    if (error) setErr(error.message);
    else {
      setMsg("Produto excluído.");
      await load();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-black text-gray-900">Admin • Loja Ninho Car</div>
            <div className="text-sm text-gray-600">Cadastro e gestão de produtos</div>
          </div>

          <button
            onClick={() => {
              setEditing(null);
              resetForm();
              setOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-black text-white font-bold text-sm"
          >
            + Novo produto
          </button>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full md:flex-1 border rounded-xl px-3 py-2 text-sm"
          />
          <button onClick={load} className="px-4 py-2 rounded-xl border text-sm font-semibold">
            Atualizar
          </button>
        </div>

        {msg ? <div className="mt-3 p-3 rounded-xl border bg-green-50 text-sm text-green-700">{msg}</div> : null}
        {err ? <div className="mt-3 p-3 rounded-xl border bg-red-50 text-sm text-red-700">{err}</div> : null}

        <div className="mt-4 rounded-2xl border bg-white overflow-hidden">
          <div className="p-3 border-b text-sm text-gray-600">
            {loading ? "Carregando..." : `${filtered.length} produto(s)`}
          </div>

          <div className="divide-y">
            {filtered.map((p) => (
              <div key={p.id} className="p-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <div className="md:flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">
                    {p.nome}{" "}
                    {!p.ativo ? <span className="text-xs font-semibold text-gray-500">(inativo)</span> : null}
                  </div>
                  <div className="text-xs text-gray-600">
                    {p.categoria || "Sem categoria"} • Estoque: <b>{p.estoque}</b> • {brl(Number(p.preco))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditing(p);
                      fillForm(p);
                      setOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl border text-sm font-semibold"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => del(p.id)}
                    className="px-3 py-2 rounded-xl border text-sm font-semibold"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}

            {!loading && filtered.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">Nenhum produto encontrado.</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {open ? (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end md:items-center justify-center p-3">
          <div className="w-full md:max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-black">
                {editing ? "Editar produto" : "Novo produto"}
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  setEditing(null);
                  resetForm();
                }}
                className="px-3 py-1 rounded-lg border text-sm"
              >
                Fechar
              </button>
            </div>

            <div className="p-4 grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Nome</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-xs text-gray-600">Categoria</label>
                <input value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-xs text-gray-600">Ativo</label>
                <select value={String(ativo)} onChange={(e) => setAtivo(e.target.value === "true")} className="w-full border rounded-xl px-3 py-2 text-sm">
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600">Preço</label>
                <input value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-xs text-gray-600">Estoque</label>
                <input value={estoque} onChange={(e) => setEstoque(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Imagem URL</label>
                <input value={imagem} onChange={(e) => setImagem(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Descrição</label>
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm min-h-[90px]" />
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setEditing(null);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl border text-sm font-semibold"
              >
                Cancelar
              </button>

              <button onClick={save} className="px-5 py-2 rounded-xl bg-black text-white text-sm font-bold">
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
