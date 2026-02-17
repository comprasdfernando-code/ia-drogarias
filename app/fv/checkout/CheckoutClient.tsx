"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomer } from "../_components/useCustomer";

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type Metodo = "PIX" | "CARTAO";

type Snap = {
  pedido_id?: string;
  grupo_id?: string;
  total_centavos?: number;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_tax_id?: string;
  cliente_phone?: string;
};

const CART_KEYS = [
  "cart_fv",
  "cart_farmacia_virtual",
  "cart_fv_virtual",
  "cart_iadrogarias_fv",
];

function clearCarts() {
  try {
    CART_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export default function CheckoutClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const orderId = sp.get("order_id") || "";
  const pedidoIdQS = sp.get("pedido_id") || "";
  const grupoIdQS = sp.get("grupo_id") || "";

  const { user, profile } = useCustomer();

  const [metodo, setMetodo] = useState<Metodo>("PIX");
  const [cpf, setCpf] = useState("");
  const [status, setStatus] = useState("NOVO");
  const [loading, setLoading] = useState(false);

  const [snap, setSnap] = useState<Snap | null>(null);

  /* ==============================
     SNAPSHOT DO CHECKOUT
  ===============================*/

  useEffect(() => {
    if (!orderId) return;

    try {
      const raw = sessionStorage.getItem(`fv_checkout_${orderId}`);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setSnap(parsed);

      const cpfSnap = onlyDigits(parsed?.cliente_tax_id || "");
      if (cpfSnap.length === 11) setCpf(cpfSnap);
    } catch {}
  }, [orderId]);

  /* ==============================
     PREENCHER CPF DO PERFIL
  ===============================*/

  useEffect(() => {
    const cpfPerfil = onlyDigits(profile?.cpf || "");
    if (cpfPerfil.length === 11) {
      setCpf((prev) =>
        onlyDigits(prev).length === 11 ? prev : cpfPerfil
      );
    }
  }, [profile?.cpf]);

  useEffect(() => {
    const cpfMeta = onlyDigits(
      (user as any)?.user_metadata?.cpf || ""
    );
    if (cpfMeta.length === 11) {
      setCpf((prev) =>
        onlyDigits(prev).length === 11 ? prev : cpfMeta
      );
    }
  }, [user]);

  const totalReais = useMemo(() => {
    return (Number(snap?.total_centavos || 0) / 100);
  }, [snap]);

  const cpfOk = onlyDigits(cpf).length === 11;

  /* ==============================
     CONFIRMAR PAGAMENTO BACKEND
  ===============================*/

  async function confirmPaid() {
    try {
      await fetch("/api/fv/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          pedido_id: pedidoIdQS || snap?.pedido_id,
          grupo_id: grupoIdQS || snap?.grupo_id,
          status: "PAID",
        }),
      });
    } catch {}
  }

  async function finalizarSucesso() {
    await confirmPaid();

    clearCarts();
    sessionStorage.removeItem(`fv_checkout_${orderId}`);

    router.replace("/fv?paid=1");
  }

  /* ==============================
     GERAR PIX
  ===============================*/

  async function gerarPix() {
    if (!cpfOk) {
      alert("CPF inválido");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/pagbank/pix", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          pedido_id: pedidoIdQS,
          grupo_id: grupoIdQS,
          cpf: onlyDigits(cpf),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);

      setStatus("NOVO");
      alert("PIX gerado. Após pagar clique em Verificar.");
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  }

  /* ==============================
     VERIFICAR STATUS
  ===============================*/

  async function verificar() {
    setLoading(true);

    try {
      const res = await fetch("/api/pagbank/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);

      const st = String(data?.status || "").toUpperCase();

      if (st.includes("PAID") || st.includes("PAGO")) {
        setStatus("PAGO");
        await finalizarSucesso();
        return;
      }

      if (st.includes("CANCEL")) {
        setStatus("CANCELADO");
        return;
      }

      setStatus("NOVO");
      alert("Ainda não identificado. Aguarde alguns segundos.");
    } catch (e) {
      console.error(e);
      alert("Não consegui verificar. Veja logs.");
      setStatus("ERRO");
    } finally {
      setLoading(false);
    }
  }

  /* ==============================
     UI
  ===============================*/

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold text-center">
        Finalizar pagamento
      </h1>

      <div className="mt-2 text-center text-sm">
        Status: <b>{status}</b>
      </div>

      <div className="mt-8 flex gap-2">
        <button
          onClick={() => setMetodo("PIX")}
          className={`flex-1 rounded-xl border px-4 py-3 font-bold ${
            metodo === "PIX"
              ? "bg-black text-white"
              : "bg-white"
          }`}
        >
          PIX
        </button>

        <button
          onClick={() => setMetodo("CARTAO")}
          className={`flex-1 rounded-xl border px-4 py-3 font-bold ${
            metodo === "CARTAO"
              ? "bg-black text-white"
              : "bg-white"
          }`}
        >
          Cartão
        </button>
      </div>

      <div className="mt-6 border rounded-2xl p-5">
        <div className="font-bold">
          CPF (obrigatório)
        </div>

        <input
          value={cpf}
          onChange={(e) =>
            setCpf(onlyDigits(e.target.value).slice(0, 11))
          }
          className="mt-3 w-full border rounded-xl px-4 py-3"
          placeholder="Digite seu CPF"
        />
      </div>

      <div className="mt-6 border rounded-2xl p-5">
        <div className="text-sm text-gray-500">Total</div>
        <div className="text-4xl font-extrabold">
          {brl(totalReais)}
        </div>

        {metodo === "PIX" ? (
          <button
            onClick={gerarPix}
            disabled={loading || !cpfOk}
            className="mt-6 w-full bg-black text-white py-3 rounded-xl font-bold"
          >
            Gerar PIX
          </button>
        ) : (
          <div className="mt-6 text-sm text-gray-600">
            (Seu fluxo de cartão permanece no componente PagbankPayment)
          </div>
        )}

        <button
          onClick={verificar}
          disabled={loading}
          className="mt-3 w-full border py-3 rounded-xl font-bold"
        >
          {loading ? "Verificando..." : "Já paguei / Verificar"}
        </button>
      </div>
    </div>
  );
}
