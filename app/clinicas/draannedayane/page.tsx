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
            A Dra. Anne Dayane é especialista em Odontologia Estética e Harmonização Facial,
            unindo ciência, arte e tecnologia para entregar resultados naturais e seguros.
          </p>

          <p>
            Seu atendimento é humanizado, pensado para proporcionar conforto e tranquilidade.
          </p>

          <p className="anne-sobre-destaque">
            “Transformar sorrisos é transformar vidas.”
          </p>
        </div>
      </section>


      {/* TRATAMENTOS PRINCIPAIS */}
      <section className="anne-tratamentos">
        <h2>Nossos Tratamentos</h2>

        <div className="anne-tratamentos-grid">

          <div className="anne-card">
            <span>🦷</span>
            <h3>Implantes Dentários</h3>
            <p>Reposição definitiva com estética impecável.</p>
          </div>

          <div className="anne-card">
            <span>😁</span>
            <h3>Lentes de Contato</h3>
            <p>Sorriso natural com laminados ultrafinos.</p>
          </div>

          <div className="anne-card">
            <span>✨</span>
            <h3>Clareamento Dental</h3>
            <p>Dentes mais brancos com total segurança.</p>
          </div>

          <div className="anne-card">
            <span>🛠️</span>
            <h3>Reabilitação Oral</h3>
            <p>Tratamentos completos de recuperação.</p>
          </div>

          <div className="anne-card">
            <span>🦷</span>
            <h3>Aparelhos Invisíveis</h3>
            <p>Correção estética com alinhadores.</p>
          </div>

          <div className="anne-card">
            <span>📐</span>
            <h3>Escaneamento Digital</h3>
            <p>Precisão absoluta sem molde de massa.</p>
          </div>

        </div>
      </section>


      {/* TECNOLOGIA DIGITAL */}
      <section className="anne-tecnologia">
        <h2>Tecnologia Digital</h2>

        <p className="anne-tec-sub">
          Conforto, precisão e previsibilidade.
        </p>

        <div className="anne-tec-grid">

          <div className="anne-tec-card">
            <span>📸</span>
            <h3>Escaneamento 3D</h3>
            <p>Captura digital sem desconforto.</p>
          </div>

          <div className="anne-tec-card">
            <span>🖥️</span>
            <h3>Planejamento Digital</h3>
            <p>Veja o resultado antes do procedimento.</p>
          </div>

          <div className="anne-tec-card">
            <span>🎯</span>
            <h3>Alta Precisão</h3>
            <p>Resultados previsíveis.</p>
          </div>

          <div className="anne-tec-card">
            <span>💺</span>
            <h3>Conforto Total</h3>
            <p>Atendimento moderno e rápido.</p>
          </div>
        </div>

        <div className="anne-tec-foto">
          <Image
            src="/clinicas/tecnologia.jpg"
            width={900}
            height={550}
            alt="Tecnologia Digital"
          />
        </div>
      </section>


      {/* ANTES E DEPOIS */}
      <section className="anne-antesdepois">
        <h2>Antes e Depois</h2>
        <p className="anne-ad-sub">Resultados reais.</p>

        <div className="anne-slider">

          <div className="anne-ad-card">
            <div className="anne-ad-img">
              <Image
                src="/clinicas/1a.jpg"
                width={400}
                height={350}
                alt="Antes"
              />
              <span className="anne-tag antes">Antes</span>
            </div>

            <div className="anne-ad-img">
              <Image
                src="/clinicas/1d.jpg"
                width={400}
                height={350}
                alt="Depois"
              />
              <span className="anne-tag depois">Depois</span>
            </div>
          </div>

          {/* MAIS CARDS… */}
        </div>
      </section>


      {/* DEPOIMENTOS */}
      <section className="anne-depoimentos">
        <h2>Depoimentos</h2>
        <p className="anne-dep-sub">A experiência de nossos pacientes.</p>

        <div className="anne-dep-slider">

          <div className="anne-dep-card">
            <p className="anne-dep-text">
              "Atendimento impecável!"
            </p>
            <span className="anne-dep-author">— Mariana S.</span>
          </div>

        <div className="anne-dep-card"> 
          <p className="anne-dep-text">
             "Fiz lentes de contato e ficou simplesmente perfeito.
              Natural, delicado e elegante. Recomendo demais!" 
              </p> <span className="anne-dep-author">— Juliana M.
                </span> </div> 
                
          {/* MAIS CARDS… */}
        </div>
      </section>


      {/* CTA FINAL */}
      <section className="anne-cta-final">
        <h2>Pronta para transformar seu sorriso?</h2>

        <p>
          Agende sua avaliação e descubra o poder do design digital do sorriso.
        </p>

        <a
          href="https://wa.me/5512992240765"
          target="_blank"
          className="anne-cta-btn"
        >
          Agendar Avaliação
        </a>
      </section>

    </main>
  );
}
