import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const pagbank = await fetch(
      "https://sandbox.api.pagseguro.com/orders",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PAGBANK_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reference_id: body.order_id,
          customer: {
            name: body.cliente.nome,
            email: body.cliente.email
          },
          items: body.itens,
          qr_codes: [{}]
        })
      }
    );

    const data = await pagbank.json();

    return NextResponse.json({
      pagbank_id: data.id,
      qr: data.qr_codes?.[0]?.links?.[0]?.href,
      qr_base64: data.qr_codes?.[0]?.base64,
      status: "pending"
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "Erro criar pagamento" }, { status: 500 });
  }
}
