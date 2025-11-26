import Image from "next/image";

export default function DraAnneDayane() {
  return (
    <main>
      {/* HERO */}
      <section className="anne-hero">
        <div className="anne-hero-content">
          <h1>
            Odontologia Integrada & <br />
            Estética Avançada
          </h1>
          <p>
            Tecnologia, precisão e naturalidade para transformar o seu sorriso.
          </p>

          <a
            href="https://wa.me/5512992240765"
            target="_blank"
            className="anne-hero-btn"
          >
            Agendar Avaliação
          </a>
        </div>

        <div className="anne-hero-img">
          <Image
            src="/clinicas/hero.jpg"
            width={450}
            height={550}
            alt="Dra Anne Dayane"
            priority
          />
        </div>
      </section>

      {/* SOBRE */}
      <section className="anne-sobre">
        <div className="anne-sobre-img">
          <Image
            src="/clinicas/sobre.jpg"
            width={420}
            height={500}
            alt="Dra Anne Dayane"
          />
        </div>

        <div className="anne-sobre-text">
          <h2>Sobre a Doutora</h2>

          <p>
            A Dra. Anne Dayane é especialista em Odontologia Estética e
            Harmonização Facial, unindo ciência, arte e tecnologia para entregar
            resultados naturais, seguros e personalizados. Seu atendimento é
            totalmente humanizado, pensado para proporcionar conforto e
            tranquilidade ao paciente.
          </p>

          <p>
            Com formação sólida e constante atualização, trabalha com técnicas
            modernas como escaneamento digital, planejamento 3D e procedimentos
            minimamente invasivos, integrando estética facial com saúde bucal de
            forma única.
          </p>

          <p className="anne-sobre-destaque">
            “Transformar sorrisos é transformar vidas.”
          </p>
        </div>
      </section>

      {/* TRATAMENTOS */}
      <section className="anne-tratamentos">
        <h2>Nossos Tratamentos</h2>

        <div className="anne-tratamentos-grid">
                {/* TECNOLOGIA DIGITAL */}
      <section className="anne-tecnologia">
        <h2>Tecnologia Digital</h2>

        <p className="anne-tec-sub">
          Mais conforto, precisão e previsibilidade para o seu tratamento.
        </p>

        <div className="anne-tec-grid">

          <div className="anne-tec-card">
            <span>📸</span>
            <h3>Escaneamento Intraoral 3D</h3>
            <p>
              Captura digital precisa do seu sorriso sem desconforto e sem massa.
            </p>
          </div>

          <div className="anne-tec-card">
            <span>🖥️</span>
            <h3>Planejamento Digital</h3>
            <p>
              O paciente visualiza o resultado antes do procedimento com total clareza.
            </p>
          </div>

          <div className="anne-tec-card">
            <span>🎯</span>
            <h3>Alta Precisão</h3>
            <p>
              Técnica digital que garante encaixe perfeito e resultados previsíveis.
            </p>
          </div>

          <div className="anne-tec-card">
            <span>💺</span>
            <h3>Mais Conforto</h3>
            <p>
              Experiência moderna, rápida e agradável para todos os pacientes.
            </p>
          </div>

        </div>

        <div className="anne-tec-foto">
          <Image
            src="/clinicas/draannedayane/tecnologia.jpg"
            width={900}
            height={550}
            alt="Tecnologia Digital - Scanner"
          />
        </div>
      </section>
      {/* ANTES E DEPOIS */}
      <section className="anne-antesdepois">
        <h2>Antes e Depois</h2>
        <p className="anne-ad-sub">
          Resultados reais de pacientes atendidos pela doutora.
        </p>

        <div className="anne-slider">

          {/* CARD 1 */}
          <div className="anne-ad-card">
            <div className="anne-ad-img">
              <Image
                src="/clinicas/draannedayane/antesdepois/1a.jpg"
                width={400}
                height={350}
                alt="Antes"
              />
              <span className="anne-tag antes">Antes</span>
            </div>

            <div className="anne-ad-img">
              <Image
                src="/clinicas/draannedayane/antesdepois/1d.jpg"
                width={400}
                height={350}
                alt="Depois"
              />
              <span className="anne-tag depois">Depois</span>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="anne-ad-card">
            <div className="anne-ad-img">
              <Image
                src="/clinicas/draannedayane/antesdepois/2a.jpg"
                width={400}
                height={350}
                alt="Antes"
              />
              <span className="anne-tag antes">Antes</span>
            </div>

            <div className="anne-ad-img">
              <Image
                src="/clinicas/draannedayane/antesdepois/2d.jpg"
                width={400}
                height={350}
                alt="Depois"
              />
              <span className="anne-tag depois">Depois</span>
            </div>
          </div>

          {/* CARD 3 */}
          <div className="anne-ad-card">
            <div className="anne-ad-img">
              <Image
                src="/clinicas/draannedayane/antesdepois/3a.jpg"
                width={400}
                height={350}
                alt="Antes"
              />
              <span className="anne-tag antes">Antes</span>
            </div>

            <div className="anne-ad-img">
              <Image
                src="/clinicas/draannedayane/antesdepois/3d.jpg"
                width={400}
                height={350}
                alt="Depois"
              />
              <span className="anne-tag depois">Depois</span>
            </div>
          </div>

        </div>
      </section>
      {/* DEPOIMENTOS */}
      <section className="anne-depoimentos">
        <h2>Depoimentos</h2>
        <p className="anne-dep-sub">
          A experiência de quem já transformou seu sorriso conosco.
        </p>

        <div className="anne-dep-slider">

          <div className="anne-dep-card">
            <p className="anne-dep-text">
              "Atendimento impecável! A doutora explica tudo com calma e o
              resultado ficou muito melhor do que imaginei."
            </p>
            <span className="anne-dep-author">— Mariana S.</span>
          </div>

          <div className="anne-dep-card">
            <p className="anne-dep-text">
              "Eu tinha medo de dentista, mas aqui perdi completamente! Ambiente
              confortável e tecnologia de ponta."
            </p>
            <span className="anne-dep-author">— Ana Paula</span>
          </div>

          <div className="anne-dep-card">
            <p className="anne-dep-text">
              "Fiz lentes de contato e ficou simplesmente perfeito. Natural,
              delicado e elegante. Recomendo demais!"
            </p>
            <span className="anne-dep-author">— Juliana M.</span>
          </div>

          <div className="anne-dep-card">
            <p className="anne-dep-text">
              "O planejamento digital fez toda a diferença. Consegui ver o
              resultado antes mesmo do procedimento!"
            </p>
            <span className="anne-dep-author">— Bianca A.</span>
          </div>

        </div>
      </section>
      {/* DIFERENCIAIS */}
      <section className="anne-diferenciais">
        <h2>Diferenciais da Clínica</h2>

        <div className="anne-dif-grid">

          <div className="anne-dif-card">
            <span>🌸</span>
            <h3>Atendimento Humanizado</h3>
            <p>
              Consultas tranquilas, explicativas e acolhedoras, pensando sempre no seu bem-estar.
            </p>
          </div>

          <div className="anne-dif-card">
            <span>🖥️</span>
            <h3>Tecnologia de Ponta</h3>
            <p>
              Escaneamento intraoral 3D, planejamento digital e precisão milimétrica.
            </p>
          </div>

          <div className="anne-dif-card">
            <span>🎯</span>
            <h3>Resultados Naturais</h3>
            <p>
              Técnicas avançadas para manter a harmonia facial e dental sem excessos.
            </p>
          </div>

          <div className="anne-dif-card">
            <span>⏳</span>
            <h3>Procedimentos Minimamente Invasivos</h3>
            <p>
              Menos dor, mais conforto e recuperação mais rápida para o paciente.
            </p>
          </div>

          <div className="anne-dif-card">
            <span>🧬</span>
            <h3>Tratamentos Personalizados</h3>
            <p>
              Cada paciente recebe um plano de tratamento exclusivo, feito sob medida.
            </p>
          </div>

          <div className="anne-dif-card">
            <span>🏆</span>
            <h3>Excelência Profissional</h3>
            <p>
              Constante atualização e protocolos modernos para entregar sempre o melhor.
            </p>
          </div>

        </div>
      </section>
      {/* CTA FINAL */}
      <section className="anne-cta-final">
        <h2>Pronta para transformar o seu sorriso?</h2>
        <p>
          Agende sua avaliação e descubra como a odontologia digital e a estética avançada
          podem realçar sua beleza natural com segurança e conforto.
        </p>

        <a
          href="https://wa.me/5512992240765"
          target="_blank"
          className="anne-cta-btn"
        >
          Agendar Avaliação
        </a>
      </section>

          {/* ---- ODONTOLÓGICOS ---- */}
          <div className="anne-card">
            <span>🦷</span>
            <h3>Implantes Dentários</h3>
            <p>Reposição definitiva com tecnologia moderna e excelente estética.</p>
          </div>

          <div className="anne-card">
            <span>😁</span>
            <h3>Lentes de Contato Dental</h3>
            <p>Sorriso perfeito, natural e harmônico com laminados ultrafinos.</p>
          </div>

          <div className="anne-card">
            <span>✨</span>
            <h3>Clareamento Dental</h3>
            <p>Dentes mais brancos com tratamentos supervisionados pela doutora.</p>
          </div>

          <div className="anne-card">
            <span>📐</span>
            <h3>Escaneamento Digital</h3>
            <p>Sem molde de massa: captura 3D precisa e confortável.</p>
          </div>

          <div className="anne-card">
            <span>🛠️</span>
            <h3>Reabilitação Oral</h3>
            <p>Tratamentos completos para recuperar função e estética.</p>
          </div>

          <div className="anne-card">
            <span>🦷</span>
            <h3>Aparelhos Invisíveis</h3>
            <p>Alinhadores transparentes para correções discretas e rápidas.</p>
          </div>

          {/* ---- ESTÉTICOS ---- */}
          <div className="anne-card">
            <span>💉</span>
            <h3>Botox</h3>
            <p>Suavização natural das linhas de expressão.</p>
          </div>

          <div className="anne-card">
            <span>👄</span>
            <h3>Preenchimento</h3>
            <p>Harmonização facial com segurança e naturalidade.</p>
          </div>

          <div className="anne-card">
            <span>💧</span>
            <h3>Skinbooster</h3>
            <p>Hidratação profunda e rejuvenescimento da pele.</p>
          </div>

          <div className="anne-card">
            <span>🧬</span>
            <h3>Microagulhamento</h3>
            <p>Renovação da pele e estímulo de colágeno.</p>
          </div>

          <div className="anne-card">
            <span>🪡</span>
            <h3>Fios de PDO</h3>
            <p>Efeito lifting imediato com sustentação facial.</p>
          </div>

          <div className="anne-card">
            <span>🔥</span>
            <h3>Lipo de Papada</h3>
            <p>Eliminação de gordura localizada com enzimas.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

