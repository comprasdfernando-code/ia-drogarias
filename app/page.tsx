'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "../components/ui/button";

// Tipagem do produto
interface Produto {
  id: number;
  nome: string;
  preco: string;
  imagem: string;
}

export default function Page() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Carrega JSON
  useEffect(() => {
    fetch("/data/mag.json")
      .then((res) => res.json())
      .then((data) => setProdutos(data));
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          {/* Logo + Nome */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-iadrogarias.png"
              alt="Logo IA Drogarias"
              className="w-06 h-06 rounded-xl object-contain"
            />
            <div className="leading-tight">
              <span className="block text-xl font-bold tracking-tight">💊 IA Drogarias</span>
              <span className="block text-xs text-gray-500">Farmácia Virtual • Saúde simples</span>
            </div>
          </div>

          {/* Menu */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#servicos" className="hover:text-teal-600">Serviços</a>
            <a href="#como-funciona" className="hover:text-teal-600">Como funciona</a>
            <a href="#contato" className="hover:text-teal-600">Contato</a>
          </nav>

          {/* Botão WhatsApp */}
          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/5511952068432?text=Olá%20IA%20Drogarias%2C%20preciso%20de%20ajuda."
              className="inline-flex"
              aria-label="Falar no WhatsApp"
            >
              <Button className="rounded-2xl bg-teal-600 hover:bg-teal-700 text-white">
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Banner Principal */}
      <section className="w-full bg-gradient-to-r from-teal-600 to-sky-600 text-white rounded-xl shadow-lg mt-6">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8 items-center">
          {/* Texto do banner */}
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Bem-vindo à <span className="text-yellow-300">IA Drogarias</span>
            </h1>
            <p className="mt-4 text-lg text-white/90">
              Seu novo jeito de comprar medicamentos, perfumaria e saúde.
              Rápido, seguro e no conforto do seu celular.
            </p>

            <div className="mt-6 flex gap-4">
              <a href="#produtos">
                <Button size="lg" className="rounded-2xl bg-white text-teal-700 hover:bg-white/90">
                  Ver Ofertas
                </Button>
              </a>
              <a href="https://wa.me/5511952068432?text=Olá%20IA%20Drogarias%20quero%20fazer%20um%20pedido">
                <Button size="lg" variant="secondary" className="rounded-2xl">
                  Falar no WhatsApp
                </Button>
              </a>
            </div>
          </div>

          {/* Imagem destaque */}
          <div className="hidden md:block">
            <Image
              src="/banner-farmacia.png"
              alt="Promoção IA Drogarias"
              width={500}
              height={400}
              className="w-full h-auto rounded-xl shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Produtos Linha MAG */}
      <section id="produtos" className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">💊 Nossos Produtos</h2>

        {/* GRID RESPONSIVO */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {produtos.map((p) => (
            <div
              key={p.id}
              className="border rounded-xl p-4 shadow hover:shadow-lg transition bg-white"
            >
              <img
                src={p.imagem}
                alt={p.nome}
                className="w-full h-24 object-contain mb-4"
                loading="lazy"
              />
              <h3 className="font-semibold leading-snug">{p.nome}</h3>
              <p className="font-bold text-teal-700 mt-2">{p.preco}</p>

              {/* Botão WhatsApp com nome + preço */}
              <a
                href={`https://wa.me/5511952068432?text=Olá,%20quero%20comprar%20${encodeURIComponent(
                  p.nome
                )}%20por%20${encodeURIComponent(p.preco)}`}
                target="_blank"
              >
                <Button className="mt-3 w-full rounded-2xl bg-teal-600 hover:bg-teal-700 text-white">
                  Comprar via WhatsApp
                </Button>
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
