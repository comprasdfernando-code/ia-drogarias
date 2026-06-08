import AuthGate from "./_components/AuthGate";

export default function SaudeLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <AuthGate>{children}</AuthGate>
    </main>
  );
}