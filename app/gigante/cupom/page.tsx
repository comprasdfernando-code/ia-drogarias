"use client";

import { useEffect } from "react";

export default function CupomPage() {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <div className="p-4 text-sm font-mono">
      <h1 className="text-center font-bold">
        🍖 Gigante dos Assados
      </h1>

      <hr className="my-2" />

      <p>Pedido: #001</p>
      <p>Data: {new Date().toLocaleString()}</p>

      <hr className="my-2" />

      <p>1x Frango — R$ 55,00</p>
      <p>1x Cupim — R$ 70,00</p>
      <p>1x Torresmo — R$ 20,00</p>

      <hr className="my-2" />

      <p>Total: R$ 145,00</p>

      <hr className="my-2" />

      <p className="text-center">
        Obrigado pela preferência!
      </p>
    </div>
  );
}
