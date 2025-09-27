export const metadata = {
  title: "IA Drogarias",
  description: "Farmácia Virtual • Saúde simples",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* TAG RESPONSIVA */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}