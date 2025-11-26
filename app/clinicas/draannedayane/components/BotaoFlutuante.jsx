import ToothIcon from "./ToothIcon";

export default function BotaoFlutuante() {
  return (
    <a
      href="https://wa.me/5512992240765"
      target="_blank"
      className="botao-dente-texto"
    >
      <div className="icone-dente">
        <ToothIcon />
      </div>
      <span className="texto-agendar">Agendar</span>
    </a>
  );
}
