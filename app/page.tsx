'use client';

import React from "react";
import Image from "next/image"; // 👈 Import do Next.js para imagens
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { 
  CheckCircle2, Phone, ShoppingCart, ShieldCheck, 
  Stethoscope, Truck, Bot, Building2, MessageCircle, Sparkles 
} from "lucide-react";

const features = [
  { icon: <Stethoscope className="w-6 h-6" aria-hidden />, title: "Atendimento farmacêutico", desc: "Suporte humano + IA para dúvidas, posologia e acompanhamento." },
  { icon: <ShoppingCart className="w-6 h-6" aria-hidden />, title: "Catálogo inteligente", desc: "Busca rápida por medicamentos, genéricos e perfumaria." },
  { icon: <Truck className="w-6 h-6" aria-hidden />, title: "Entrega ágil", desc: "Parceiros locais e motoboys com rastreio de pedido." },
  { icon: <ShieldCheck className="w-6 h-6" aria-hidden />, title: "Segurança e conformidade", desc: "Fluxos alinhados à RDC, LGPD e boas práticas farmacêuticas." },
];

const steps = [
  { n: 1, title: "Fale com a IA Drogarias", text: "Clique no WhatsApp e diga o que precisa." },
  { n: 2, title: "Receba as opções", text: "Verifique disponibilidade, preços e prazos." },
  { n: 3, title: "Confirme e acompanhe", text: "Pagamento seguro e entrega rastreada." },
];

const benefits = [
  "Economia de tempo no balcão e no zap.",
  "Curadoria de farmácias parceiras confiáveis.",
  "Promoções e assinatura para uso contínuo.",
  "Atendimento humanizado com apoio de IA.",
];

export default function Page() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-iadrogarias.png" alt="Logo IA Drogarias" className="w-10 h-10 rounded-xl object-contain" />
            <div className="leading-tight">
              <span className="block text-xl font-bold tracking-tight">💊 IA Drogarias</span>
              <span className="block text-xs text-gray-500">Farmácia Virtual • Saúde simples</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#servicos" className="hover:text-teal-600">Serviços</a>
            <a href="#como-funciona" className="hover:text-teal-600">Como funciona</a>
            <a href="#credenciamento" className="hover:text-teal-600">Credenciar Farmácia</a>
            <a href="#contato" className="hover:text-teal-600">Contato</a>
          </nav>
          <div className="flex items-center gap-2">
            <Badge className="hidden sm:inline-flex">São Paulo • SP</Badge>
            <a href="https://wa.me/5511952068432?text=Ol%C3%A1%20IA%20Farma%2C%20preciso%20de%20ajuda%20com%20um%20pedido." className="inline-flex" aria-label="Falar no WhatsApp">
              <Button className="rounded-2xl">Falar no WhatsApp</Button>
            </a>
          </div>
        </div>
      </header>

      {/* Banner temporário */}
      <div className="w-full">
        <Image
          src="/banner-construcao.png"
          alt="Site em construção"
          width={1200}
          height={400}
          className="w-full rounded-lg shadow-md mb-8"
        />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 grid md:grid-cols-2 gap-10 items-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Sua <span className="text-teal-600">Farmácia Virtual</span> com atendimento humano + IA
          </h1>
          <p className="mt-4 text-gray-600 max-w-prose">
            Peça medicamentos, compare preços e fale com um farmacêutico em minutos. A IA Drogarias conecta você às farmácias parceiras mais próximas — rápido, seguro e sem complicação.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="#servicos"><Button variant="secondary" className="rounded-2xl">Ver serviços</Button></a>
            <a href="#credenciamento"><Button className="rounded-2xl">Credenciar Farmácia</Button></a>
          </div>
          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
            <CheckCircle2 className="w-4 h-4" /> Entrega em bairros selecionados de São Paulo
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <img src="/avatar-iadrogarias.png" alt="Avatar IA Drogarias" className="w-full h-auto object-contain" />
        </motion.div>
      </section>

      {/* aqui segue o resto do seu código normalmente (features, steps, benefits, credenciamento, footer, etc) */}
    </div>
  );
}
