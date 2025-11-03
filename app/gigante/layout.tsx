export const metadata = {
  title: "Gigante dos Assados",
  description: "Grande no sabor 🍗",
};

export default function GiganteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head />
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#fff",
        }}
      >
        {/* Nenhum Header ou Footer aqui */}
        <main>{children}</main>
      </body>
    </html>
  );
}