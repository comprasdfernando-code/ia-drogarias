'use client';
import React from "react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { CheckCircle2, Phone, ShoppingCart, ShieldCheck, Stethoscope, Truck, Bot, Building2, MessageCircle, Sparkles } from "lucide-react";

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
              <span className="block text-xl font-bold tracking-tight">IA Drogarias</span>
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

      {/* Trust Bar */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center opacity-80">
          {["Farmácias parceiras", "Entrega Rápida", "Pagamento Seguro", "Atendimento 7 dias"].map((t, i) => (
            <div key={i} className="h-16 rounded-2xl border grid place-content-center text-sm">{t}</div>
          ))}
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-bold tracking-tight">Serviços IA Drogarias</h2>
        <p className="text-gray-600 mt-2">Tudo o que você espera de uma farmácia moderna, direto do seu celular.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <Card key={i} className="rounded-2xl hover:shadow-lg transition">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 grid place-content-center mb-3">
                  {f.icon}
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">{f.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-3xl font-bold tracking-tight">Como funciona</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <Card key={s.n} className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-teal-600 text-white font-bold">{s.n}</span>
                    {s.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600">{s.text}</CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <a className="inline-flex" href="https://wa.me/5511952068432?text=Quero%20fazer%20um%20pedido%20pela%20IA%20Farma">
              <Button size="lg" className="rounded-2xl"><MessageCircle className="w-4 h-4 mr-2" /> Começar no WhatsApp</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Por que escolher a IA Drogarias?</h2>
            <ul className="mt-6 space-y-3">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border p-6 grid grid-cols-2 gap-6">
            <div className="rounded-xl bg-gradient-to-b from-gray-50 to-white border p-4 text-center">
              <img src="/avatar-iadrogarias.png" alt="Avatar IA Drogarias" className="w-full h-auto object-contain mb-3" />
              <p className="text-sm text-gray-500">Seu avatar IA Farma</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-gray-50 to-white border p-4 text-center">
              <img src="/logo-iadrogarias.png" alt="Logo IA Drogarias" className="w-full h-auto object-contain mb-3" />
              <p className="text-sm text-gray-500">Logo oficial IA Drogarias</p>
            </div>
        </div>
        </div>
      </section>

      {/* Credenciamento de Farmácias */}
      <section id="credenciamento" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-6 h-6 text-teal-700" />
            <h2 className="text-3xl font-bold tracking-tight">Credencie sua farmácia</h2>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Faça parte da rede IA Drogarias e receba pedidos qualificados do seu bairro. Baixa taxa de adesão, mensalidade acessível e suporte para operação digital.
          </p>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Benefícios para parceiros</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-3">
                <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5" /> Leads de pedidos em tempo real (WhatsApp / painel)</div>
                <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5" /> Catálogo integrado (genéricos, MIPs, perfumaria)</div>
                <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5" /> Regras de comissionamento claras e transparentes</div>
                <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5" /> Treinamento e materiais de divulgação</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Quero credenciar</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Input placeholder="Nome da farmácia" />
                <Input placeholder="CNPJ" />
                <Input placeholder="Responsável técnico (CRF)" />
                <Input placeholder="Bairro / Cidade" />
                <Input placeholder="WhatsApp de contato" />
                <Textarea placeholder="Serviços ofertados (ex.: aplicação, atenção farmacêutica, acupuntura, estética...)" />
                <a href="https://wa.me/5511952068432?text=Quero%20credenciar%20minha%20farm%C3%A1cia%20na%20IA%20Farma" className="inline-flex">
                  <Button className="rounded-2xl">Enviar via WhatsApp</Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-gradient-to-br from-teal-600 to-sky-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-extrabold leading-tight">Pronto para começar?</h2>
            <p className="mt-3 text-white/90">Fale agora com a IA Drogarias e receba atendimento imediato.</p>
          </div>
          <div className="md:text-right">
            <a href="https://wa.me/5511952068432?text=Ol%C3%A1%2C%20IA%20Farma!" className="inline-flex">
              <Button size="lg" className="rounded-2xl bg-white text-teal-700 hover:bg-white/90"><Phone className="w-4 h-4 mr-2" /> Chamar no WhatsApp</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3">
              <img src="/logo-iadrogarias.png" alt="Logo IA Farma" className="w-9 h-9 rounded-xl object-contain" />
              <span className="font-semibold">IA Drogarias</span>
            </div>
            <p className="text-sm text-gray-600 mt-3">CNPJ 00.000.000/0000-00 • São Paulo/SP</p>
            <p className="text-sm text-gray-500 mt-1">© {new Date().getFullYear()} IA Drogarias. Todos os direitos reservados.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Links</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#servicos" className="hover:text-teal-700">Serviços</a></li>
              <li><a href="#como-funciona" className="hover:text-teal-700">Como funciona</a></li>
              <li><a href="#credenciamento" className="hover:text-teal-700">Credenciar</a></li>
              <li><a href="#contato" className="hover:text-teal-700">Contato</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Contato</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>WhatsApp: (11) 95206-8432</li>
              <li>E-mail: contato@iadrogarias.com.br</li>
              <li>Atendimento: seg–dom, 8h às 22h</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-xs text-gray-400">
          *Este site não realiza venda de medicamentos sob prescrição sem a apresentação e validação da receita conforme legislação vigente.
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a href="https://wa.me/5511952068432?text=Ol%C3%A1%20IA%20Farma" className="fixed bottom-5 right-5" aria-label="WhatsApp flutuante">
        <Button size="lg" className="rounded-full shadow-xl">
          <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
        </Button>
      </a>
    </div>
  );
}
