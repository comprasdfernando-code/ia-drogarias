import Image from "next/image";

export const metadata = {
  title: "Mega Gil Cell - Assistência Técnica",
  description: "Conserto de celulares, venda de acessórios e assistência técnica completa.",
};

export default function MegaGilCell() {
  return (
    <div className="bg-black text-white min-h-screen">

      {/* HERO */}
      <section className="relative h-[60vh] flex items-center justify-center">
        <Image
          src="/megagil/logo.png"
          alt="Mega Gil Cell Logo"
          width={500}
          height={200}
          className="z-10"
        />
      </section>

      {/* CHAMADA */}
      <section className="text-center px-4">
        <h1 className="text-4xl font-extrabold">Assistência Técnica Especializada</h1>
        <p className="text-gray-300 mt-2 text-lg">
          Troca de tela • Bateria • Conector • Software • Acessórios
        </p>
        <a
          href="https://wa.me/5511989430764"
          className="inline-block mt-6 bg-green-500 text-black font-bold px-6 py-3 rounded-lg"
        >
          Chamar no WhatsApp
        </a>
      </section>

      {/* SERVIÇOS */}
      <section className="px-6 py-12">
        <h2 className="text-3xl font-bold mb-6">Serviços</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {[
            { nome: "Troca de Tela", img: "/megagil/tela.png" },
            { nome: "Troca de Bateria", img: "/megagil/bateria.png" },
            { nome: "Conector de Carga", img: "/megagil/carga.png" },
            { nome: "Desoxidação", img: "/megagil/desoxy.png" },
            { nome: "Troca de Câmera", img: "/megagil/camera.png" },
            { nome: "Software / Formatação", img: "/megagil/software.png" },
          ].map((item) => (
            <div key={item.nome} className="bg-zinc-900 p-6 rounded-xl text-center shadow-lg">
              <Image
                src={item.img}
                width={120}
                height={120}
                alt={item.nome}
                className="mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold">{item.nome}</h3>
            </div>
          ))}

        </div>
      </section>

      {/* ACESSÓRIOS */}
      <section className="px-6 py-12 bg-zinc-950">
        <h2 className="text-3xl font-bold mb-6">Acessórios</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[
            { nome: "Película 3D", preco: "9,99", img: "/megagil/pelicula.jpg" },
            { nome: "Capinha Premium", preco: "14,99", img: "/megagil/capinha.jpg" },
            { nome: "Carregador Turbo", preco: "29,99", img: "/megagil/carregador.jpg" },
            { nome: "Cabo iPhone", preco: "19,99", img: "/megagil/cabo.jpg" },
          ].map((item) => (
            <div key={item.nome} className="bg-zinc-900 p-4 rounded-xl shadow-lg text-center">
              <Image
                src={item.img}
                width={200}
                height={200}
                alt={item.nome}
                className="mx-auto mb-3 rounded-lg"
              />
              <h3 className="font-semibold">{item.nome}</h3>
              <p className="text-green-400 text-lg font-bold">R$ {item.preco}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="text-center py-6 text-gray-400 text-sm">
        Mega Gil Cell © {new Date().getFullYear()} • Assistência Técnica Profissional
      </footer>

      {/* BOTÃO WHATSAPP FIXO */}
      <a
        href="https://wa.me/5511989430764"
        className="fixed bottom-6 right-6 bg-green-500 p-4 rounded-full shadow-xl"
      >
        <Image src="/whats.png" width={40} height={40} alt="WhatsApp" />
      </a>

    </div>
  );
}
