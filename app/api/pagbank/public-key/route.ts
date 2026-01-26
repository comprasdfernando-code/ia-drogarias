import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = process.env.PAGBANK_TOKEN;
    const baseUrl = (process.env.PAGBANK_BASE_URL || "https://sandbox.api.pagseguro.com").trim();

    if (!token) {
      return NextResponse.json({ error: "PAGBANK_TOKEN não configurado" }, { status: 500 });
    }

    // GET: consultar chave pública existente
    const r1 = await fetch(`${baseUrl}/public-keys/card`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (r1.ok) {
      const d1: any = await r1.json();
      if (d1?.public_key) return NextResponse.json({ public_key: d1.public_key });
    }

    // POST: criar chave pública se não existir
    const r2 = await fetch(`${baseUrl}/public-keys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ type: "card" }),
      cache: "no-store",
    });

    const d2: any = await r2.json();

    if (!r2.ok || !d2?.public_key) {
      return NextResponse.json(
        { error: "Chave pública não retornada pelo PagBank", status: r2.status, dados: d2 },
        { status: 500 }
      );
    }

    return NextResponse.json({ public_key: d2.public_key });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Falha ao consultar/criar public key", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}
