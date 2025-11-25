"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { name: "Dashboard", path: "/paineldecontrole" },
  { name: "Fomento", path: "/paineldecontrole/fomento" },
  { name: "Endividamento", path: "/paineldecontrole/endividamento" },
  { name: "Vendas", path: "/paineldecontrole/vendas" },
  { name: "Clientes", path: "/paineldecontrole/clientes" },
  { name: "Cadastros", path: "/paineldecontrole/cadastros" },
  { name: "Configurações", path: "/paineldecontrole/config" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-[#0A0F16] border-r border-white/10 p-6 hidden md:flex flex-col gap-4 fixed">
      
      <div className="text-xl font-bold mb-6">
        Painel de Controle
      </div>

      <nav className="flex flex-col gap-1">
        {menu.map((item, i) => {
          const active = pathname === item.path;

          return (
            <Link
              key={i}
              href={item.path}
              className={`px-4 py-3 rounded-lg transition-all 
                ${active 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-300 hover:bg-white/5"
                }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
