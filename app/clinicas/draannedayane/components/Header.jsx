import Image from "next/image";
import InstaLink from "./InstaLink";
import Link from "next/link";

export default function Header() {
  return (
    <header className="anne-header">
      <div className="anne-header-container">

        {/* LOGO */}
        <div className="anne-logo">
          <Image
            src="/clinicas/draannedayane/logo.png"
            width={60}
            height={60}
            alt="Logo Dra Anne Dayane"
          />
          <span className="anne-logo-text">Dra. Anne Dayane</span>
        </div>

        {/* MENU */}
        <nav className="anne-menu">
          <Link href="/clinicas/draannedayane">Início</Link>
          <Link href="#sobre">Sobre</Link>
          <Link href="#tratamentos">Tratamentos</Link>
          <Link href="#antesdepois">Antes e Depois</Link>
          <Link href="#contato">Contato</Link>
        </nav>

        {/* INSTAGRAM */}
        <div className="anne-header-right">
          <InstaLink />

          <a
            href="https://wa.me/5512992240765"
            className="anne-header-agendar"
            target="_blank"
          >
            Agendar
          </a>
        </div>

      </div>
    </header>
  );
}
