export const metadata = {
  title: "Tech Fernando Pereira",
  description: "Soluções digitais inteligentes para o seu negócio.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05070A] text-white">
      {children}
    </div>
  );
}
