import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = process.env.PAGBANK_TOKEN;
    const baseUrl =
      process.env.PAGBANK_BASE_URL || "https://sandbox.api.pagseguro.com";

    if (!token) {
      return NextResponse.json(
        { error: "PAGBANK_TOKEN não configurado" },
        { status: 500 }
      );
    }

    const resp = await fetch(`${baseUrl}/public-keys`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await resp.json();

    // padrão de resposta do PagBank
    const publicKey = data?.public_keys?.[0]?.public_key;

    if (!publicKey) {
      return NextResponse.json(
        { error: "Public key não retornada pelo PagBank", data },
        { status: 500 }
      );
    }

    return NextResponse.json({ public_key: publicKey });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao buscar public key PagBank", detalhe: String(e) },
      { status: 500 }
    );
  }
}
