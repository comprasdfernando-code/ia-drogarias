"use client";

export default function GiganteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Nenhum Header ou Footer aqui */}
        {children}
      </body>
    </html>
  );
}