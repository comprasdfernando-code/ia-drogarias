import "./styles.css";

import Header from "./components/Header";
import BotaoFlutuante from "./components/BotaoFlutuante";
import Rodape from "./components/Rodape";


export const metadata = {
  title: "Clínica Dra. Anne Dayane – Odontologia Estética",
};

export default function Layout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        {children}
        <BotaoFlutuante />
        <Rodape />
      </body>
    </html>
  );
}
