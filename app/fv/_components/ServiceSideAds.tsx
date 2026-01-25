"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Ad = {
  key: string;
  title: string;
  subtitle: string;
  href: string;        // pode ser /servicos/... OU link whatsapp
  img: string;         // /public/...
};

const WHATS = "5511948343725"; // troca se quiser
const wpp = (text: string) =>
  `https://wa.me/${WHATS}?text=${encodeURIComponent(text)}`;

export default function ServiceSideAds() {
  const ads: Ad[] = useMemo(
    () => [
      {
        key: "pressao",
        title: "Aferição de Pressão",
        subtitle: "Rápido e prático",
        href: wpp("Olá! Quero solicitar aferição de pressão. Pode me ajudar?"),
        img: "/banners/pressao-vertical.jpg",
      },
      {
        key: "glicemia",
        title: "Teste de Glicemia",
        subtitle: "Resultado na hora",
        href: wpp("Olá! Quero agendar um teste de glicemia. Como funciona?"),
        img: "/banners/glicemia-vertical.jpg",
      },
      {
        key: "injecao",
        title: "Aplicação de Injeção",
        subtitle: "Com profissional",
        href: wpp("Olá! Quero solicitar aplicação de injeção. Pode me orientar?"),
        img: "/banners/injecao-vertical.jpg",
      },
      {
        key: "revisao",
        title: "Revisão de Medicamentos",
        subtitle: "Mais segurança no tratamento",
        href: wpp("Olá! Quero uma revisão de medicamentos e orientação. Como agendo?"),
        img: "/banners/revisao-vertical.jpg",
      },
    ],
    []
  );

  // alterna esquerda/direita para mostrar os 4 sem poluir
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), 7000);
    return () => clearInterval(t);
  }, [ads.length]);

  const left = ads[idx % ads.length];
  const right = ads[(idx + 1) % ads.length];

  return (
    <>
      {/* LATERAIS (somente desktop grande) */}
      <div className="hidden xl:flex fixed top-28 left-3 z-40">
        <Link href={left.href} target="_blank" className="group">
          <div className="relative w-[160px] h-[520px] rounded-xl overflow-hidden shadow-lg">
            <Image
              src={left.img}
              alt={left.title}
              fill
              className="object-cover group-hover:scale-[1.03] transition"
              sizes="160px"
            />
          </div>
        </Link>
      </div>

      <div className="hidden xl:flex fixed top-28 right-3 z-40">
        <Link href={right.href} target="_blank" className="group">
          <div className="relative w-[160px] h-[520px] rounded-xl overflow-hidden shadow-lg">
            <Image
              src={right.img}
              alt={right.title}
              fill
              className="object-cover group-hover:scale-[1.03] transition"
              sizes="160px"
            />
          </div>
        </Link>
      </div>

      {/* MOBILE/TABLET: faixa serviços rápidos */}
      <div className="xl:hidden px-3 mt-3">
        <div className="rounded-2xl border bg-white p-3 shadow-sm">
          <div className="font-semibold text-sm mb-2">Serviços rápidos</div>
          <div className="grid grid-cols-2 gap-2">
            {ads.map((a) => (
              <Link
                key={a.key}
                href={a.href}
                target="_blank"
                className="rounded-xl border p-2 hover:shadow-sm transition"
              >
                <div className="text-sm font-semibold leading-tight">{a.title}</div>
                <div className="text-xs text-gray-600">{a.subtitle}</div>
                <div className="text-xs font-semibold mt-1 text-blue-700">
                  Solicitar
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
