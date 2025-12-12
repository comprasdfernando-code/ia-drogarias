"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLojinha() {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [precoNormal, setPrecoNormal] = useState("");
  const [validade, setValidade] = useState("");
  const [categoria, setCategoria] = useState("");
  const [foto, setFoto] = useState(null);
  const [fotoURL, setFotoURL] = useState("");

  async function uploadFoto(file: File) {
    const nomeArquivo = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("lojinha_imagens")
      .upload(nomeArquivo, file);

    if (error) {
      console.error(error);
      alert("Erro ao enviar imagem");
      return;
    }

    // URL pública
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/lojinha_imagens/${nomeArquivo}`;

    setFotoURL(url);
  }

  async function salvarProduto() {
    if (!nome || !preco || !fotoURL) {
      alert("Preencha o nome, preço e envie a foto!");
      return;
    }

    const { error } = await supabase
  .from("lojinha_produtos")
  .insert({
    nome,
    preco: Number(preco.replace(",", ".")),
    preco_normal: Number(precoNormal.replace(",", ".")) || 0,
    validade,
    categoria,
    foto: fotoURL,
  });


    if (error) {
      console.error(error);
      alert("Erro ao salvar.");
      return;
    }

    alert("Produto cadastrado com sucesso!");
    limpar();
  }

  function limpar() {
    setNome("");
    setPreco("");
    setPrecoNormal("");
    setCategoria("");
    setValidade("");
    setFoto(null);
    setFotoURL("");
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">
        Painel da Lojinha da Oportunidade 💛🖤
      </h1>

      <div className="bg-zinc-900 p-6 rounded-xl border border-yellow-500 max-w-lg">

        {/* Nome */}
        <label className="block mb-2">Nome do Produto</label>
        <input
          className="w-full p-2 rounded bg-black border border-yellow-400 text-white mb-4"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        {/* Preços */}
        <label className="block mb-2">Preço Promocional</label>
        <input
          type="number"
          className="w-full p-2 rounded bg-black border border-yellow-400 text-white mb-4"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
        />

        <label className="block mb-2">Preço Normal (opcional)</label>
        <input
          type="number"
          className="w-full p-2 rounded bg-black border border-yellow-400 text-white mb-4"
          value={precoNormal}
          onChange={(e) => setPrecoNormal(e.target.value)}
        />

        {/* Validade */}
        <label className="block mb-2">Validade</label>
        <input
          type="date"
          className="w-full p-2 rounded bg-black border border-yellow-400 text-white mb-4"
          value={validade}
          onChange={(e) => setValidade(e.target.value)}
        />

        {/* Categoria */}
        <label className="block mb-2">Categoria</label>
        <select
          className="w-full p-2 rounded bg-black border border-yellow-400 text-white mb-4"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Selecione</option>
          <option value="alimentos">Alimentos</option>
          <option value="higiene">Higiene & Limpeza</option>
          <option value="pet">Pet</option>
          <option value="utilidades">Utilidades</option>
          <option value="importados">Importados</option>
        </select>

        {/* Upload de Foto */}
        <label className="block mb-2">Foto</label>
        <input
          type="file"
          accept="image/*"
          className="mb-4"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFoto(file);
              uploadFoto(file);
            }
          }}
        />

        {fotoURL && (
          <img
            src={fotoURL}
            className="w-40 h-40 object-cover rounded mb-4 border border-yellow-400"
          />
        )}

        {/* Botão */}
        <button
          className="w-full py-3 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-300"
          onClick={salvarProduto}
        >
          SALVAR PRODUTO
        </button>
      </div>
    </div>
  );
}
