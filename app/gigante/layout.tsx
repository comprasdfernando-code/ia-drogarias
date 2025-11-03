export const metadata = {
  title: "Gigante dos Assados",
  description: "Grande no sabor 🍗",
};

export default function GiganteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          backgroundImage: "url('/gigante-logo.png')", // 🔥 coloca seu logo na pasta /public
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
          backgroundSize: "450px auto", // ajusta o tamanho
          backgroundColor: "#fff",
        }}
      >
        {/* camada branca leve pra deixar o conteúdo legível */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.92)",
            minHeight: "100vh",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}