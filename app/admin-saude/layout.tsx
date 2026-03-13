import AdminGate from "./_components/AdminGate";

export default function AdminSaudeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <AdminGate>{children}</AdminGate>
    </main>
  );
}