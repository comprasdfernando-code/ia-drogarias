export default function Contato() {
  return (
    <section className="w-full py-24 px-6 bg-[#05070A]">
      <div className="max-w-4xl mx-auto text-center">

        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Vamos criar algo incrível?
        </h2>

        <p className="text-gray-300 text-lg">
          Me chama no WhatsApp para solicitar orçamento ou tirar dúvidas.
        </p>

        <a
          href="https://wa.me/5511964819472?text=Olá!%20Quero%20um%20orçamento."
          className="mt-10 inline-block px-10 py-4 bg-blue-600 hover:bg-blue-700 
                     rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg"
        >
          Falar no WhatsApp
        </a>

      </div>
    </section>
  );
}
