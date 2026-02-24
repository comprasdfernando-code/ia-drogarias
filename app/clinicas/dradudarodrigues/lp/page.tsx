// app/clinicas/dradudarodrigues/lp/page.tsx
import Link from "next/link";

const WHATSAPP_NUMBER = "5511968730302"; // 55 + DDD + número (sem espaços)
const WHATSAPP_MSG =
  "Olá Dra Duda, quero garantir minha vaga na Mentoria VIP em São Paulo. Ainda tem disponibilidade?";

function waLink() {
  const text = encodeURIComponent(WHATSAPP_MSG);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

function Badge({ children }: { children: any }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#b88a5a]/30 bg-[#0b0612]/60 px-3 py-1 text-xs text-[#f7d9c4] backdrop-blur">
      {children}
    </span>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: any;
}) {
  return (
    <div className="rounded-3xl border border-[#2a1c2f]/70 bg-[#0b0612]/55 p-6 backdrop-blur">
      <div className="text-lg font-semibold text-[#f7d9c4]">{title}</div>
      <div className="mt-3 text-sm leading-relaxed text-slate-200/90">{children}</div>
    </div>
  );
}

function CTA() {
  return (
    <a
      href={waLink()}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f7d9c4] to-[#f2caa2] px-6 py-3 text-base font-semibold text-[#140a18] shadow-lg shadow-[#b88a5a]/10 hover:opacity-95"
    >
      Garantir minha vaga no WhatsApp
      <span aria-hidden>→</span>
    </a>
  );
}

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      {/* Topbar simples */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge>Mentoria VIP • Presencial</Badge>
            <Badge>São Paulo</Badge>
            <Badge>Vagas limitadas</Badge>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            <span className="text-[#f7d9c4]">MENTORIA VIP</span>{" "}
            <span className="text-slate-100">— Anatomia, Técnicas e Intercorrências</span>
          </h1>

          <p className="max-w-2xl text-base text-slate-200/85 md:text-lg">
            A mentoria presencial para profissionais da saúde que querem dominar a estética facial com{" "}
            <span className="text-[#f2caa2] font-semibold">segurança real</span>, técnica e
            posicionamento premium.
          </p>

          <div className="flex flex-wrap gap-2 pt-1 text-sm text-slate-200/85">
            <span className="rounded-full border border-[#b88a5a]/20 bg-[#0b0612]/40 px-3 py-1">
              💉 Toxina Botulínica
            </span>
            <span className="rounded-full border border-[#b88a5a]/20 bg-[#0b0612]/40 px-3 py-1">
              💉 Fios de PDO
            </span>
            <span className="rounded-full border border-[#b88a5a]/20 bg-[#0b0612]/40 px-3 py-1">
              💉 Ácido Hialurônico
            </span>
            <span className="rounded-full border border-[#b88a5a]/20 bg-[#0b0612]/40 px-3 py-1">
              💎 Full Face
            </span>
          </div>

          <div className="pt-3 flex flex-wrap gap-3 items-center">
            <CTA />
            <div className="text-sm text-slate-300/80">
              ⚠ <span className="text-[#f7d9c4] font-semibold">Apenas 5 vagas</span> • quando fechar, encerra.
            </div>
          </div>
        </div>

        {/* Box de destaque (substitui foto depois se quiser) */}
        <div className="w-full md:max-w-sm">
          <div className="rounded-3xl border border-[#2a1c2f]/70 bg-[#0b0612]/55 p-6 backdrop-blur">
            <div className="text-sm text-slate-200/80">Participação especial</div>
            <div className="mt-2 text-xl font-bold text-[#f2caa2]">
              AO VIVO direto de Miami
            </div>
            <div className="mt-2 text-sm text-slate-200/85">
              Com <span className="font-semibold text-[#f7d9c4]">Dra. Patrícia Oyole</span> — referência mundial em anatomia facial.
            </div>

            <div className="mt-5 rounded-2xl border border-[#b88a5a]/20 bg-[#06030a]/60 p-4">
              <div className="text-xs text-slate-300">Investimento</div>
              <div className="mt-1 text-3xl font-extrabold text-slate-100">
                5x <span className="text-[#f7d9c4]">R$ 649,00</span>
              </div>
              <div className="mt-2 text-xs text-slate-300/90">
                Bônus: kit aluno • paciente modelo • certificado • coffee break
              </div>
            </div>

            <div className="mt-5">
              <CTA />
              <div className="mt-2 text-center text-xs text-slate-400">
                WhatsApp: (11) 96873-0302
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Linha separadora */}
      <div className="my-10 h-px w-full bg-gradient-to-r from-transparent via-[#b88a5a]/30 to-transparent" />

      {/* Seção: Quem é */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Quem é a Dra. Duda Rodrigues">
          Biomédica esteta, há 4 anos aprofundando estudos principalmente em{" "}
          <b>anatomia facial</b> para oferecer o melhor em procedimentos estéticos,
          conforto e principalmente <b>segurança</b> aos pacientes.
          <div className="mt-3 text-slate-200/85">
            Esta mentoria não é conteúdo raso. É formação prática + raciocínio anatômico.
          </div>
        </Card>

        <Card title="O diferencial que muda seu nível">
          Aula exclusiva de <b>Anatomia Facial</b> com transmissão ao vivo direto de Miami,
          ao lado de referência mundial no tema.
          <div className="mt-3">
            Você aprende <b>o porquê</b> das técnicas — e como executar com segurança.
          </div>
        </Card>
      </section>

      {/* Para quem é / não é */}
      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <Card title="Para quem é">
          <ul className="list-disc pl-5 space-y-2">
            <li>Profissionais da saúde iniciando na estética/harmonização</li>
            <li>Quem sente insegurança na anatomia</li>
            <li>Quem quer dominar intercorrências</li>
            <li>Quem quer elevar padrão e se posicionar no premium</li>
          </ul>
        </Card>

        <Card title="Para quem não é">
          <ul className="list-disc pl-5 space-y-2">
            <li>Quem busca conteúdo superficial</li>
            <li>Quem quer “atalhos” e não valoriza segurança clínica</li>
            <li>Quem não quer atenção individual (turma VIP)</li>
          </ul>
        </Card>
      </section>

      {/* Conteúdo */}
      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-[#f7d9c4] md:text-3xl">
            O que você vai dominar
          </h2>
          <Badge>Mentoria prática + raciocínio</Badge>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card title="💉 Toxina Botulínica">
            Mapeamento facial • aplicação estratégica • naturalidade • correções.
          </Card>

          <Card title="💉 Ácido Hialurônico / Preenchedores">
            Planejamento facial • harmonização equilibrada • Full Face estruturado.
          </Card>

          <Card title="💉 Lifting com Fios de PDO">
            Vetores corretos • indicações seguras • planejamento anatômico.
          </Card>

          <Card title="🧠 Intercorrências">
            Prevenção • conduta • raciocínio clínico • segurança em cada plano.
          </Card>
        </div>
      </section>

      {/* Bônus */}
      <section className="mt-10">
        <div className="rounded-3xl border border-[#2a1c2f]/70 bg-[#0b0612]/55 p-6 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xl font-bold text-[#f2caa2]">Bônus inclusos</div>
              <div className="text-sm text-slate-200/85">
                Tudo pensado para experiência VIP e aplicação prática.
              </div>
            </div>
            <Badge>Incluído na mentoria</Badge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {["Kit aluno", "Paciente modelo", "Certificado", "Coffee break"].map((x) => (
              <div
                key={x}
                className="rounded-2xl border border-[#b88a5a]/20 bg-[#06030a]/60 px-4 py-4 text-center text-sm text-slate-100"
              >
                <div className="text-[#f7d9c4] font-semibold">{x}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formato + escassez */}
      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <Card title="📍 Formato">
          Presencial — São Paulo • Turma VIP <b>(apenas 5 alunos)</b>.
          <div className="mt-3">
            Por quê 5? Porque atenção individual muda resultado e acelera confiança.
          </div>
        </Card>

        <Card title="⚠ Escassez real">
          <b>Somente 5 vagas.</b> Quando fechar as 5, encerra.
          <div className="mt-3">
            Se você quer se destacar no mercado, essa é a hora de virar a chave.
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="text-2xl font-extrabold text-[#f7d9c4] md:text-3xl">Perguntas frequentes</h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card title="Tem certificado?">Sim, certificado incluso.</Card>
          <Card title="É presencial?">Sim, presencial em São Paulo.</Card>
          <Card title="Tem prática?">
            Sim. Mentoria VIP com foco em aplicação e segurança.
          </Card>
          <Card title="Posso parcelar?">Sim, em 5x.</Card>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mt-12 rounded-3xl border border-[#2a1c2f]/70 bg-gradient-to-r from-[#0b0612]/70 to-[#06030a]/70 p-8 backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-2xl font-extrabold text-slate-100">
              Mentoria VIP —{" "}
              <span className="text-[#f7d9c4]">eleve sua carreira</span>
            </div>
            <div className="mt-2 text-sm text-slate-200/85">
              Anatomia • técnicas • intercorrências • transmissão ao vivo de Miami.
            </div>
            <div className="mt-3 text-sm text-slate-300">
              ⚠ Apenas 5 vagas — quando fechar, encerra.
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <CTA />
            <div className="text-xs text-slate-400">
              Ao clicar, você será direcionado para o WhatsApp com a mensagem pronta.
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé técnico (pra impressionar) */}
      <footer className="mt-10 flex flex-col gap-2 text-center text-xs text-slate-500">
        <div>
          Página criada para alta conversão • LP premium rosé + dourado • IA Drogarias
        </div>
        <div className="opacity-80">
          Produzido por Tech Fernando Pereira
        </div>

        {/* link discreto para a clínica (opcional) */}
        <div className="pt-2">
          <Link
            href="/clinicas/dradudarodrigues/dashboard"
            className="text-[#f2caa2]/80 hover:text-[#f7d9c4]"
          >
            Voltar para o sistema
          </Link>
        </div>
      </footer>
    </main>
  );
}