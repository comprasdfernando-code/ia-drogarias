export default function Footer() {
  return (
    <footer className="w-full py-10 px-6 bg-[#05070A] border-t border-white/10 mt-20">
      <div className="max-w-6xl mx-auto text-center">

        {/* Nome / Branding */}
        <h3 className="text-xl font-semibold mb-3">
          Tech Fernando Pereira
        </h3>

        <p className="text-gray-400 text-sm mb-6">
          Tecnologia prática, moderna e inteligente para o seu negócio.
        </p>

        {/* Links */}
        <div className="flex justify-center gap-8 text-sm text-gray-400 mb-6">
          <a href="#portfolio" className="hover:text-white transition">Portfólio</a>
          <a href="#services" className="hover:text-white transition">Serviços</a>
          <a href="#sobre" className="hover:text-white transition">Sobre Mim</a>
          <a
            href="https://wa.me/5511964819472"
            target="_blank"
            className="hover:text-white transition"
          >
            Contato
          </a>
        </div>

        {/* Linha */}
        <div className="w-full border-t border-white/10 my-6"></div>

        {/* Copyright */}
        <p className="text-gray-600 text-xs">
          © {new Date().getFullYear()} Tech Fernando Pereira — Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
