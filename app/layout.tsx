export const metadata = {
  title: "IA Farma – Farmácia Virtual",
  description: "Sua Farmácia Virtual com atendimento humano + IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/logo-iafarma.png" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
