"use client";

import PagbankPayment from "../_components/PagbankPayment";

export default function CheckoutPage() {
  const vendaId = "123"; // id da venda criada no Supabase (vendas_site.id)

  const cliente = {
    name: "Fernando Pereira",
    email: "cliente@iadrogarias.com",
    cpf: "32328752896", // ✅ CPF correto (11 dígitos)
    phone: "11999998888",
  };

  const items = [
    {
      reference_id: "item-1",
      name: "Losartana 50mg",
      quantity: 1,
      unit_amount: 399, // centavos
    },
    {
      reference_id: "item-2",
      name: "Atenolol 25mg",
      quantity: 1,
      unit_amount: 399, // centavos
    },
  ];

  function handlePaid() {
    alert("Pagamento aprovado 🎉");
    // router.push("/confirmacao");
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-semibold">
        Finalizar pagamento
      </h1>

      <PagbankPayment
        orderId={vendaId}
        cliente={cliente}
        items={items}
        onPaid={handlePaid}
      />
    </div>
  );
}
