"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOJA = "drogariaredefabiano";

function fmt(n: any) {
  return Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isValidDateISO(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test((s || "").trim());
}

function formatHora(data: any) {
  if (!data) return "—";
  try {
    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function calcResumo(r: any) {
  const entradas =
    Number(r?.dinheiro || 0) +
    Number(r?.pix_cnpj || 0) +
    Number(r?.pix_qr || 0) +
    Number(r?.cartoes || 0) +
    Number(r?.receb_fiado || 0);

  const saidas =
    Number(r?.sangrias || 0) +
    Number(r?.despesas || 0) +
    Number(r?.boletos || 0) +
    Number(r?.compras || 0);

  const saldo = entradas - saidas;

  return { entradas, saidas, saldo };
}

export default function RelatorioDiarioCaixaEmbed() {
  const [dataRef, setDataRef] = useState<string>(toISODate(new Date()));
  const [registrosDoDia, setRegistrosDoDia] = useState<any[]>([]);
  const [registroId, setRegistroId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string>("");

  const registro = useMemo(() => {
    if (!registrosDoDia?.length) return null;
    const found = registrosDoDia.find((r) => String(r.id) === String(registroId));
    return found || registrosDoDia[0] || null;
  }, [registrosDoDia, registroId]);

  const calc = useMemo(() => {
    if (!registro) return null;
    return calcResumo(registro);
  }, [registro]);

  async function carregar(d?: string) {
    const dt = (d ?? dataRef)?.trim();

    setErro("");
    setLoading(true);
    setRegistrosDoDia([]);
    setRegistroId("");

    if (!isValidDateISO(dt)) {
      setErro("Selecione uma data válida.");
      setLoading(false);
      return;
    }

    const ini = `${dt}T00:00:00.000`;
    const fim = `${dt}T23:59:59.999`;

    const { data, error } = await supabase
      .from("caixa_diario")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", ini)
      .lte("data", fim)
      .order("data", { ascending: false });

    if (error) {
      console.error(error);
      setErro("Erro ao buscar fechamento do dia.");
      setLoading(false);
      return;
    }

    const lista = data || [];
    setRegistrosDoDia(lista);
    if (lista.length > 0) setRegistroId(String(lista[0].id));
    setLoading(false);
  }

  useEffect(() => {
    carregar(dataRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function gerarPDF() {
    window.print();
  }

  return (
    <section className="w-full">
      {/* ✅ CSS de impressão isolado: só imprime a área do relatório */}
      <style>{`
        @page { size: A4; margin: 12mm; }

        @media print {
          body { background: white !important; }

          /* esconde tudo */
          body * { visibility: hidden !important; }

          /* mostra só o relatório */
          #relatorio-print-area, #relatorio-print-area * { visibility: visible !important; }

          /* posiciona no topo */
          #relatorio-print-area { position: absolute; left: 0; top: 0; width: 100%; }

          /* esconde controles */
          .relatorio-no-print { display: none !important; }

          /* remove sombras/bordas pesadas */
          .relatorio-print-box { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* CONTROLES */}
      <div className="relatorio-no-print bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-bold text-blue-700 mb-3">
          📄 Relatório Diário (PDF) — Caixa
        </h2>

        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Data</label>
            <input
              type="date"
              value={dataRef}
              onChange={(e) => setDataRef(e.target.value)}
              className="border rounded p-2"
            />
          </div>

          <button
            onClick={() => carregar(dataRef)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
          >
            Buscar Fechamentos
          </button>

          <button
            onClick={gerarPDF}
            disabled={!registro}
            className={`px-4 py-2 rounded font-semibold ${
              registro
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            🖨️ Gerar PDF (Imprimir)
          </button>
        </div>

        {registrosDoDia.length > 0 && (
          <div className="mt-4">
            <label className="text-sm text-gray-600 block mb-1">
              Fechamentos encontrados: <b>{registrosDoDia.length}</b>
              {registrosDoDia.length > 1 ? " (escolha qual imprimir)" : ""}
            </label>

            <select
              value={registroId}
              onChange={(e) => setRegistroId(e.target.value)}
              className="border rounded p-2 w-full"
            >
              {registrosDoDia.map((r, idx) => {
                const hora = formatHora(r.data);
                const resumo = calcResumo(r);
                const label = `Fechamento ${idx + 1} • ${hora} • Venda R$ ${fmt(
                  r.venda_total
                )} • Entr R$ ${fmt(resumo.entradas)} • Saí R$ ${fmt(
                  resumo.saidas
                )} • Saldo R$ ${fmt(resumo.saldo)} • ID ${r.id}`;

                return (
                  <option key={r.id} value={String(r.id)}>
                    {label}
                  </option>
                );
              })}
            </select>

            {registrosDoDia.length > 1 && (
              <p className="text-amber-700 text-sm mt-2">
                ⚠️ Existem múltiplos fechamentos nesse dia. Selecione acima qual deseja gerar o PDF.
              </p>
            )}
          </div>
        )}

        {erro && <p className="text-red-600 mt-3">{erro}</p>}
        {loading && <p className="text-gray-600 mt-3">Carregando...</p>}
        {!loading && !erro && registrosDoDia.length === 0 && (
          <p className="text-gray-600 mt-3">Nenhum fechamento encontrado nessa data.</p>
        )}
      </div>

      {/* ✅ ÁREA DO PRINT (SÓ ELA VAI APARECER NA IMPRESSÃO) */}
      <div id="relatorio-print-area" className="relatorio-print-box bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="text-2xl font-bold text-blue-800">Drogaria Rede Fabiano</h3>
            <p className="text-sm text-gray-600">Relatório Diário do Caixa (Fechamento)</p>
            <p className="text-sm text-gray-600">
              Data: <span className="font-semibold">{dataRef}</span>
            </p>
            {registro && (
              <p className="text-xs text-gray-500 mt-1">
                Fechamento selecionado: <b>ID {registro.id}</b> • Horário:{" "}
                <b>{formatHora(registro.data)}</b>
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600">Loja</p>
            <p className="font-semibold">{LOJA}</p>
          </div>
        </div>

        {!registro ? (
          <div className="py-10 text-center text-gray-600">
            Selecione a data e clique em <b>Buscar Fechamentos</b>.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="border rounded p-3">
                <p className="text-xs text-gray-600">Venda Total</p>
                <p className="text-lg font-bold">R$ {fmt(registro.venda_total)}</p>
              </div>
              <div className="border rounded p-3">
                <p className="text-xs text-gray-600">Entradas</p>
                <p className="text-lg font-bold text-green-700">R$ {fmt(calc?.entradas)}</p>
              </div>
              <div className="border rounded p-3">
                <p className="text-xs text-gray-600">Saídas</p>
                <p className="text-lg font-bold text-red-700">R$ {fmt(calc?.saidas)}</p>
              </div>
              <div className="border rounded p-3">
                <p className="text-xs text-gray-600">Saldo do Dia</p>
                <p className={`text-lg font-bold ${(calc?.saldo || 0) >= 0 ? "text-green-700" : "text-red-700"}`}>
                  R$ {fmt(calc?.saldo)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-bold text-blue-700 mb-2">Entradas</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Item label="Dinheiro" value={registro.dinheiro} />
                <Item label="Pix CNPJ" value={registro.pix_cnpj} />
                <Item label="Pix QR" value={registro.pix_qr} />
                <Item label="Cartões" value={registro.cartoes} />
                <Item label="Receb. Fiado" value={registro.receb_fiado} strong />
                <Item label="Venda Fiado (registro)" value={registro.venda_fiado} accent />
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-bold text-blue-700 mb-2">Saídas</h4>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                <ItemDesc label="Sangrias" value={registro.sangrias} desc={registro.desc_sangrias} />
                <ItemDesc label="Despesas" value={registro.despesas} desc={registro.desc_despesas} />
                <ItemDesc label="Boletos" value={registro.boletos} desc={registro.desc_boletos} />
                <ItemDesc label="Compras" value={registro.compras} desc={registro.desc_compras} />
              </div>
            </div>

            <div className="mt-8 pt-4 border-t flex items-end justify-between">
              <div className="text-xs text-gray-500">Gerado em: {new Date().toLocaleString("pt-BR")}</div>
              <div className="text-right">
                <p className="text-sm font-semibold">Fernando dos Santos Pereira</p>
                <p className="text-xs text-gray-500">Responsável</p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Item({ label, value, strong, accent }: any) {
  const v = Number(value || 0);
  return (
    <div className="border rounded p-3">
      <p className="text-xs text-gray-600">{label}</p>
      <p className={["text-base font-bold", strong ? "text-green-700" : "", accent ? "text-orange-700" : ""].join(" ")}>
        R$ {v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

function ItemDesc({ label, value, desc }: any) {
  const v = Number(value || 0);
  return (
    <div className="border rounded p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-600">{label}</p>
          <p className="text-base font-bold text-red-700">R$ {v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="text-right text-xs text-gray-500 max-w-[60%]">{desc ? desc : "—"}</div>
      </div>
    </div>
  );
}
