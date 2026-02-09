"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProdutoSearch from "./_components/ProdutoSearch";
import ItensTable, { CartItem } from "./_components/ItensTable";
import ResumoVenda from "./_components/ResumoVenda";

const EMPRESA_ID = "264ceab9-6ba3-4b68-9bf7-30c5c01f15a6"; // troque pelo id certo (depois puxamos do login/contexto)

export default function VendasClient() {
  const [atendente, setAtendente] = useState<string>("");
  const [atendenteOk, setAtendenteOk] = useState(false);

  const [clienteNome, setClienteNome] = useState("");
  const [clienteWhats, setClienteWhats] = useState("");
  const [obs, setObs] = useState("");

  const [desconto, setDesconto] = useState<number>(0);
  const [acrescimo, setAcrescimo] = useState<number>(0);

  const [itens, setItens] = useState<CartItem[]>([]);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const subtotal = useMemo(
    () => itens.reduce((acc, it) => acc + (Number(it.preco) || 0) * (Number(it.quantidade) || 0), 0),
    [itens]
  );

  const total = useMemo(() => {
    const t = subtotal - (Number(desconto) || 0) + (Number(acrescimo) || 0);
    return t < 0 ? 0 : t;
  }, [subtotal, desconto, acrescimo]);

  function resetVenda() {
    setClienteNome("");
    setClienteWhats("");
    setObs("");
    setDesconto(0);
    setAcrescimo(0);
    setItens([]);
  }

  async function enviarProCaixa() {
    setMsg("");

    if (!atendenteOk || !atendente.trim()) {
      setMsg("Informe o atendente.");
      return;
    }
    if (itens.length === 0) {
      setMsg("Adicione pelo menos 1 item para enviar ao caixa.");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.rpc("ae_create_comanda_from_cart", {
        p_empresa_id: EMPRESA_ID,
        p_atendente: atendente,
        p_desconto: Number(desconto) || 0,
        p_acrescimo: Number(acrescimo) || 0,
        p_cliente_nome: clienteNome || null,
        p_cliente_whatsapp: clienteWhats || null,
        p_observacao: obs || null,
        p_itens: itens, // vira jsonb
      });

      if (error) {
        console.error(error);
        setMsg(`Erro ao enviar: ${error.message}`);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const numero = row?.numero ?? "—";

      setMsg(`✅ Enviado ao caixa! Comanda #${numero}`);
      resetVenda();
    } finally {
      setSending(false);
    }
  }

  // Tela de identificação do atendente
  if (!atendenteOk) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="text-lg font-semibold">Vendas · Identificação</div>
          <div className="text-xs text-slate-400">
            Informe o número/nome do atendente para iniciar.
          </div>

          <input
            className="w-full border border-slate-700 bg-slate-950/60 rounded px-3 py-2 outline-none"
            placeholder="Atendente (ex: 01, Fer, Dani)"
            value={atendente}
            onChange={(e) => setAtendente(e.target.value)}
          />

          <button
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-2 font-medium"
            onClick={() => {
              if (atendente.trim()) setAtendenteOk(true);
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // Página principal
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <div className="text-xl font-bold">Vendas</div>
          <div className="text-xs text-slate-400">Atendente: <b>{atendente}</b></div>
        </div>

        <div className="flex gap-2">
          <button
            className="bg-slate-800 hover:bg-slate-700 rounded px-4 py-2"
            onClick={() => {
              setAtendente("");
              setAtendenteOk(false);
              resetVenda();
              setMsg("");
            }}
          >
            Trocar atendente
          </button>

          <button
            className="bg-slate-800 hover:bg-slate-700 rounded px-4 py-2"
            onClick={() => {
              resetVenda();
              setMsg("");
            }}
          >
            Limpar venda
          </button>
        </div>
      </div>

      {/* Cliente / observação (opcional) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="text-sm font-semibold">Cliente (opcional)</div>
          <input
            className="w-full border border-slate-700 bg-slate-950/60 rounded px-3 py-2 outline-none"
            placeholder="Nome"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
          />
          <input
            className="w-full border border-slate-700 bg-slate-950/60 rounded px-3 py-2 outline-none"
            placeholder="WhatsApp"
            value={clienteWhats}
            onChange={(e) => setClienteWhats(e.target.value)}
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2 md:col-span-2">
          <div className="text-sm font-semibold">Observação</div>
          <textarea
            className="w-full border border-slate-700 bg-slate-950/60 rounded px-3 py-2 outline-none min-h-[86px]"
            placeholder="Ex: carro Gol, lâmpada H4, retorno às 16h..."
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </div>
      </div>

      <ProdutoSearch
        empresaId={EMPRESA_ID}
        onAdd={(item) => {
          setItens((prev) => {
            // se já existe, soma quantidade
            const idx = prev.findIndex((x) => x.produto_id === item.produto_id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], quantidade: copy[idx].quantidade + 1 };
              return copy;
            }
            return [...prev, item];
          });
        }}
      />

      <ItensTable itens={itens} setItens={setItens} />

      <ResumoVenda
        subtotal={subtotal}
        desconto={desconto}
        acrescimo={acrescimo}
        total={total}
        setDesconto={setDesconto}
        setAcrescimo={setAcrescimo}
        onEnviar={enviarProCaixa}
        sending={sending}
      />

      {msg && (
        <div className="text-sm bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          {msg}
        </div>
      )}
    </div>
  );
}
