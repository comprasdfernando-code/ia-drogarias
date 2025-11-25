import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function FomentoPage() {
  return (
    <>
      <Sidebar />
      <div className="ml-64 w-full">
        <Topbar />

        <div className="p-6">
          <h2 className="text-2xl font-bold">Fomento</h2>
          <p className="text-gray-400 mt-2">
            Em breve: integração completa com Supabase.
          </p>
        </div>
      </div>
    </>
  );
}
