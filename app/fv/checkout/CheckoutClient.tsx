"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useCustomer } from "../_components/useCustomer";

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Snap = {
  ok?: boolean;
  pedido_id?: string;
  grupo_id?: string | null;
  order_id?: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_tax_id?: string; // CPF
  cliente_phone?: string;
  itens?: { reference_id: string; name: string; quantity: number; unit_amount: number }[];
  total_centavos?: number;
  taxa_entrega_centavos?: number;
  entrega?: any;
  pagamento?: string;
};

export default function CheckoutClient() {
  const sp = useSearchParams();

  const orderId = sp.get("order_id") || "";
  const pedidoId = sp.get("pedido_id") || "";
  const grupoId = sp.get("grupo_id") || "";
  const taxaCentavos = Number(sp.get("taxa_centavos") || 0);

  // cliente logado (perfil)
  const { user, profile } = useCustomer();

  const [tab, setTab] = useState<"PIX" | "CARTAO">("PIX");
  const [cpf, setCpf] = useState("");
  const [status, setStatus] = useState<"NOVO" | "PAGO" | "CANCELADO" | "ERRO">("NOVO");

  const [loading, setLoading] = useState(false);
  const [pixQr, setPixQr] = useState<string | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState<string | null>(null);

  const [snap, setSnap] = useState<Snap | null>(null);

  // total exibido (fallback: tenta do snapshot; se não tiver, usa taxaCentavos + 0)
  const totalReais = useMemo(() => {
    const totalCent = Number(snap?.total_centavos || 0);
    if (totalCent > 0) return totalCent / 100;
    // se não achou snap, pelo menos mostra algo
    return Math.max(0, Number(taxaCentavos || 0)) / 100;
  }, [snap?.total_centavos, taxaCentavos]);

  // 1) pega snapshot salvo no sessionStorage (se existir)
  useEffect(() => {
    if (!orderId) return;
    try {
      const raw = sessionStorage.getItem(`fv_checkout_${orderId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Snap;
      setSnap(parsed);

      const cpfSnap = onlyDigits(parsed?.cliente_tax_id || "");
      if (cpfSnap && cpfSnap.length === 11) {
        setCpf((prev) => (onlyDigits(prev).length === 11 ? prev : cpfSnap));
      }
    } catch {}
  }, [orderId]);

  // 2) se está logado, preenche CPF do perfil (se ainda estiver vazio)
  useEffect(() => {
    const cpfPerfil = onlyDigits(profile?.cpf || "");
    if (cpfPerfil.length === 11) {
      setCpf((prev) => (onlyDigits(prev).length === 11 ? prev : cpfPerfil));
    }
  }, [profile?.cpf]);

  // opcional: se quiser também puxar do metadata do supabase user (se você salvar lá)
  useEffect(() => {
    const cpfMeta = onlyDigits((user as any)?.user_metadata?.cpf || "");
    if (cpfMeta.length === 11) {
      setCpf((prev) => (onlyDigits(prev).length === 11 ? prev : cpfMeta));
    }
  }, [user]);

  const cpfOk = onlyDigits(cpf).length === 11;

  async function gerarPix() {
    if (!cpfOk) {
      alert("Digite um CPF válido (11 dígitos) para gerar o PIX.");
      return;
    }
    if (!orderId || !pedidoId) {
      alert("order_id/pedido_id não encontrado.");
      return;
    }

    setLoading(true);
    try {
      // ✅ ajuste o endpoint conforme seu projeto
      const res = await fetch("/api/pagbank/pix", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          pedido_id: pedidoId,
          grupo_id: grupoId || null,
          cpf: onlyDigits(cpf),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao gerar PIX");

      // tente achar nos campos mais comuns
      const qr = data?.qr_code_base64 || data?.qrCodeBase64 || data?.qrcodeBase64 || null;
      const copia = data?.qr_code_text || data?.qrCodeText || data?.qrcodeText || null;

      setPixQr(qr);
      setPixCopiaCola(copia);
      setStatus("NOVO");
    } catch (e: any) {
      console.error(e);
      setStatus("ERRO");
      alert("Não consegui gerar o PIX. Verifique logs.");
    } finally {
      setLoading(false);
    }
  }

  async function verificar() {
    if (!orderId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/pagbank/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao verificar status");

      // mapeie para seu formato real
      const st = String(data?.status || "NOVO").toUpperCase();
      if (st.includes("PAID") || st.includes("PAGO")) setStatus("PAGO");
      else if (st.includes("CANCEL")) setStatus("CANCELADO");
      else setStatus("NOVO");
    } catch (e) {
      console.error(e);
      setStatus("ERRO");
      alert("Não consegui verificar. Veja logs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900 text-center">Finalizar pagamento</h1>

      <div className="mt-2 text-center text-xs text-slate-500">
        Fonte: <span className="font-mono">api/api/pagbank/status (POST)</span>
      </div>

      <div className="mt-1 text-center text-sm">
        Status: <span className="font-extrabold">{status}</span>
      </div>

      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("PIX")}
          className={`flex-1 rounded-xl border px-4 py-3 font-extrabold ${
            tab === "PIX" ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
          }`}
        >
          PIX (QRCode)
        </button>
        <button
          type="button"
          onClick={() => setTab("CARTAO")}
          className={`flex-1 rounded-xl border px-4 py-3 font-extrabold ${
            tab === "CARTAO" ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
          }`}
        >
          Cartão
        </button>
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <div className="font-extrabold text-slate-900">
          CPF {tab === "PIX" ? "(obrigatório para PIX)" : "(obrigatório para cartão)"}
        </div>

        <input
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          placeholder="Digite seu CPF (11 dígitos)"
          className="mt-3 w-full rounded-xl border px-4 py-3 outline-none focus:ring-4 focus:ring-slate-100"
        />

        <div className="mt-2 text-xs text-slate-500">Dica: só números. Ex: 12345678901</div>
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-slate-900">{tab === "PIX" ? "Pagamento PIX" : "Pagamento Cartão"}</div>
          <div className="text-sm">
            Status: <span className="font-extrabold">{status}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-slate-500">Total</div>
          <div className="text-4xl font-extrabold text-slate-900">{brl(totalReais)}</div>
        </div>

        {tab === "PIX" ? (
          <>
            <button
              type="button"
              onClick={gerarPix}
              disabled={loading || !cpfOk}
              className={`mt-6 w-full rounded-xl px-4 py-3 font-extrabold ${
                loading || !cpfOk ? "bg-slate-200 text-slate-500" : "bg-black text-white hover:opacity-95"
              }`}
            >
              {loading ? "Gerando..." : "Gerar PIX"}
            </button>

            {pixQr ? (
              <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
                <div className="text-sm font-extrabold text-slate-900">QRCode</div>
                {/* QR em base64 */}
                <img
                  alt="PIX QRCode"
                  className="mt-3 w-full max-w-[320px] mx-auto rounded-xl border bg-white p-2"
                  src={`data:image/png;base64,${pixQr}`}
                />

                {pixCopiaCola ? (
                  <>
                    <div className="mt-4 text-sm font-extrabold text-slate-900">Copia e Cola</div>
                    <textarea
                      readOnly
                      value={pixCopiaCola}
                      className="mt-2 w-full rounded-xl border bg-white p-3 text-xs font-mono"
                      rows={3}
                    />
                  </>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-6 text-sm text-slate-600">
            Cartão: (seu fluxo atual aqui).  
            Se você quiser, eu encaixo o mesmo “puxar CPF automático” + submit do cartão.
          </div>
        )}

        <button
          type="button"
          onClick={verificar}
          disabled={loading}
          className="mt-3 w-full rounded-xl border px-4 py-3 font-extrabold bg-white hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? "Verificando..." : "Já paguei / Verificar"}
        </button>
      </div>

      <div className="mt-6 text-xs text-slate-500">
        Debug: order_id=<span className="font-mono">{orderId || "—"}</span> / pedido_id=<span className="font-mono">{pedidoId || "—"}</span>
      </div>
    </div>
  );
}
