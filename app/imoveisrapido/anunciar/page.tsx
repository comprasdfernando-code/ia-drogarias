"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CriarAnuncioPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [bairro, setBairro] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function criarAnuncio(e: any) {
    e.preventDefault();
    setLoading(true);

    let imageUrl = null;

    if (imagem) {
      const fileName = `imoveis/${Date.now()}-${imagem.name}`;
      const { data, error } = await supabase.storage
        .from("public")
        .upload(fileName, imagem);

      if (!error) {
        const { data: url } = supabase.storage
          .from("public")
          .getPublicUrl(fileName);

        imageUrl = url.publicUrl;
      }
    }

    await supabase.from("imoveis").insert({
      titulo,
      preco,
      descricao,
      bairro,
      whatsapp,
      imagem: imageUrl,
      leads: 0,
      status: "Publicado",
    });

    setLoading(false);
    router.push("/imoveisrapido/corretores");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Criar novo anúncio
      </h1>

      <form onSubmit={criarAnuncio} className="space-y-6">

        <div>
          <label className="font-semibold">Título do imóvel</label>
          <input
            type="text"
            required
            className="w-full border rounded-lg px-4 py-3 mt-1"
            placeholder="Casa à venda no Vila Bela"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div>
          <label className="font-semibold">Preço</label>
          <input
            type="number"
            required
            className="w-full border rounded-lg px-4 py-3 mt-1"
            placeholder="160000"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
          />
        </div>

        <div>
          <label className="font-semibold">Bairro</label>
          <input
            type="text"
            required
            className="w-full border rounded-lg px-4 py-3 mt-1"
            placeholder="São Mateus – SP"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
          />
        </div>

        <div>
          <label className="font-semibold">WhatsApp de contato</label>
          <input
            type="text"
            required
            className="w-full border rounded-lg px-4 py-3 mt-1"
            placeholder="11982047548"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </div>

        <div>
          <label className="font-semibold">Descrição</label>
          <textarea
            required
            className="w-full border rounded-lg px-4 py-3 mt-1 h-32"
            placeholder="Descreva os detalhes do imóvel..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div>
          <label className="font-semibold">Foto do imóvel</label>
          <input
            type="file"
            accept="image/*"
            required
            className="w-full border rounded-lg px-4 py-3 mt-1"
            onChange={(e: any) => setImagem(e.target.files[0])}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold w-full py-4 rounded-xl"
        >
          {loading ? "Publicando..." : "Publicar anúncio"}
        </button>
      </form>
    </div>
  );
}
