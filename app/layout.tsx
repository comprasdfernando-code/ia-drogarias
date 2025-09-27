export const metadata = {
  title: "IA Drogarias",
  description: "Farmácia Virtual • Saúde simples",
};

// ⚠️ Next 14+: use o export viewport (nada de <meta> manual no head)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-gray-900">{children}</body>
    </html>
  );
}