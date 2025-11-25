import Navbar from "./components/Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#05070A] text-white">
      <Navbar />
      <div className="pt-24"> {/* Dá espaço porque a navbar é fixa */}
        {children}
      </div>
    </div>
  );
}
