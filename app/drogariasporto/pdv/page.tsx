"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  Camera,
  CreditCard,
  Minus,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  Store,
  X,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "@/lib/supabaseClient";
import { PORTO_LOJA_SLUG, brl } from "../_lib/porto";
import {
  ComprovantePorto,
  imprimirComprovantePorto,
} from "../_lib/impressao";

type Produto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  apresentacao: string | null;
  estoque: number;
  preco_venda: number;
  preco_consulta: number;
  pode_vender: boolean;
};

type TipoDesconto = "PERCENTUAL" | "VALOR";

type Item = Produto & {
  qtd: number;
  descontoTipo: TipoDesconto;
  desconto: number;
};

type Forma = "Dinheiro" | "Pix" | "Débito" | "Crédito";

type Pagamento = {
  forma: Forma;
  valor: string;
};

type Conta = {
  id: string;
  nome: string;
  tipo: string;
};

type TipoAtendimento = "BALCAO" | "ENTREGA";

function numero(v: string) {
  if (!v?.trim()) return 0;

  const s = v.trim().includes(",")
    ? v.replace(/\./g, "").replace(",", ".")
    : v;

  const n = Number(s);

  return Number.isFinite(n) ? n : 0;
}

function precoLiquidoItem(i: Item) {
  const desconto =
    i.descontoTipo === "PERCENTUAL"
      ? i.preco_venda *
        (Math.min(100, Math.max(0, i.desconto)) / 100)
      : Math.min(i.preco_venda, Math.max(0, i.desconto));

  return Math.max(0, i.preco_venda - desconto);
}

function descontoUnitarioItem(i: Item) {
  return Math.max(0, i.preco_venda - precoLiquidoItem(i));
}

export default function PortoPDV() {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Produto[]>([]);
  const [itens, setItens] = useState<Item[]>([]);

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([
    {
      forma: "Dinheiro",
      valor: "",
    },
  ]);

  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [tipoAtendimento, setTipoAtendimento] =
    useState<TipoAtendimento>("BALCAO");

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numeroEndereco, setNumeroEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState("0");
  const [observacoes, setObservacoes] = useState("");

  const [ultimoComprovante, setUltimoComprovante] =
    useState<ComprovantePorto | null>(null);

  const [cameraAberta, setCameraAberta] = useState(false);
  const [cameraErro, setCameraErro] = useState("");
  const [cameraLendo, setCameraLendo] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<any>(null);
  const codigoLidoRef = useRef(false);
  const pagamentoRef = useRef<HTMLDivElement>(null);

  const subtotalBruto = useMemo(
    () =>
      itens.reduce(
        (s, i) => s + i.preco_venda * i.qtd,
        0
      ),
    [itens]
  );

  const descontoTotal = useMemo(
    () =>
      itens.reduce(
        (s, i) =>
          s + descontoUnitarioItem(i) * i.qtd,
        0
      ),
    [itens]
  );

  const subtotal = Math.max(
    0,
    subtotalBruto - descontoTotal
  );

  const taxa =
    tipoAtendimento === "ENTREGA"
      ? Math.max(0, numero(taxaEntrega))
      : 0;

  const total = subtotal + taxa;

  const totalPagamentos = useMemo(
    () =>
      pagamentos.reduce(
        (s, p) => s + numero(p.valor),
        0
      ),
    [pagamentos]
  );

  const faltante = Math.max(
    0,
    total - totalPagamentos
  );

  const quantidadeItens = useMemo(
    () =>
      itens.reduce(
        (s, i) => s + i.qtd,
        0
      ),
    [itens]
  );

  useEffect(() => {
    inputRef.current?.focus();
    carregarContas();
  }, []);

  useEffect(() => {
    return () => {
      pararCamera();
    };
  }, []);

  async function carregarContas() {
    const { data } = await supabase
      .from("porto_contas_financeiras")
      .select("id,nome,tipo")
      .eq("loja_slug", PORTO_LOJA_SLUG)
      .eq("ativo", true);

    setContas((data || []) as Conta[]);
  }

  function pararCamera() {
    try {
      scannerControlsRef.current?.stop?.();
    } catch {}

    scannerControlsRef.current = null;

    if (videoRef.current?.srcObject) {
      const stream =
        videoRef.current.srcObject as MediaStream;

      stream
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      videoRef.current.srcObject = null;
    }

    setCameraLendo(false);
  }

  function fecharCamera() {
    pararCamera();
    codigoLidoRef.current = false;
    setCameraAberta(false);
    setCameraErro("");
  }

  async function abrirCamera() {
    setCameraErro("");
    codigoLidoRef.current = false;
    setCameraAberta(true);
  }

  useEffect(() => {
    if (!cameraAberta) return;

    let cancelado = false;

    async function iniciarScanner() {
      await new Promise((resolve) =>
        setTimeout(resolve, 150)
      );

      if (
        cancelado ||
        !videoRef.current
      ) {
        return;
      }

      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            "Câmera não disponível neste navegador."
          );
        }

        setCameraLendo(true);

        const reader =
          new BrowserMultiFormatReader();

        const controls =
          await reader.decodeFromConstraints(
            {
              video: {
                facingMode: {
                  ideal: "environment",
                },
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
              },
              audio: false,
            },
            videoRef.current,
            (result) => {
              if (
                !result ||
                codigoLidoRef.current
              ) {
                return;
              }

              const codigo =
                result.getText().trim();

              if (!codigo) return;

              codigoLidoRef.current = true;

              if (
                "vibrate" in navigator
              ) {
                navigator.vibrate?.(120);
              }

              setBusca(codigo);

              setTimeout(() => {
                fecharCamera();
                pesquisar(codigo);
              }, 100);
            }
          );

        scannerControlsRef.current =
          controls;
      } catch (erro: any) {
        console.error(
          "Erro ao abrir câmera:",
          erro
        );

        setCameraLendo(false);

        if (
          erro?.name ===
          "NotAllowedError"
        ) {
          setCameraErro(
            "A câmera foi bloqueada. Libere a permissão da câmera para este site no navegador."
          );
        } else if (
          erro?.name ===
          "NotFoundError"
        ) {
          setCameraErro(
            "Nenhuma câmera foi encontrada neste aparelho."
          );
        } else {
          setCameraErro(
            erro?.message ||
              "Não foi possível abrir a câmera."
          );
        }
      }
    }

    iniciarScanner();

    return () => {
      cancelado = true;
      pararCamera();
    };
  }, [cameraAberta]);

  async function pesquisar(
    termoForcado?: string
  ) {
    const termo = (
      termoForcado ??
      busca
    ).trim();

    if (!termo) {
      setResultados([]);
      return;
    }

    setLoading(true);

    try {
      const digits =
        termo.replace(/\D/g, "");

      let produtoQuery = supabase
        .from("fv_produtos")
        .select(`
          id,
          ean,
          nome,
          laboratorio,
          apresentacao,
          pmc
        `)
        .limit(100);

      if (digits.length >= 8) {
        produtoQuery =
          produtoQuery.or(
            `ean.eq.${digits},nome.ilike.%${termo}%`
          );
      } else {
        produtoQuery =
          produtoQuery.ilike(
            "nome",
            `%${termo}%`
          );
      }

      const {
        data: catalogo,
        error: produtoError,
      } = await produtoQuery;

      if (produtoError)
        throw produtoError;

      const produtosEncontrados =
        catalogo || [];

      if (!produtosEncontrados.length) {
        setResultados([]);
        return;
      }

      const ids =
        produtosEncontrados.map(
          (p: any) =>
            String(p.id)
        );

      const {
        data: produtosPorto,
        error: lojaError,
      } = await supabase
        .from("fv_farmacia_produtos")
        .select(`
          produto_id,
          estoque,
          preco_venda,
          ativo,
          ativo_pdv
        `)
        .eq(
          "farmacia_slug",
          PORTO_LOJA_SLUG
        )
        .in(
          "produto_id",
          ids
        );

      if (lojaError)
        throw lojaError;

      const portoMap =
        new Map(
          (produtosPorto || []).map(
            (r: any) => [
              String(r.produto_id),
              r,
            ]
          )
        );

      const lista: Produto[] =
        produtosEncontrados.map(
          (p: any) => {
            const porto: any =
              portoMap.get(
                String(p.id)
              );

            const estoque =
              Number(
                porto?.estoque || 0
              );

            const precoPortoCadastrado =
              Number(
                porto?.preco_venda || 0
              );

            const precoPMC =
              Number(p?.pmc || 0);

            const precoPorto =
              precoPortoCadastrado > 0
                ? precoPortoCadastrado
                : precoPMC;

            const precoConsulta =
              precoPMC > 0
                ? precoPMC
                : precoPorto;

            const podeVender =
              !!porto &&
              estoque > 0 &&
              precoPorto > 0;

            return {
              id: String(p.id),
              ean: String(p.ean || ""),
              nome: String(p.nome || ""),
              laboratorio:
                p.laboratorio ?? null,
              apresentacao:
                p.apresentacao ?? null,
              estoque,
              preco_venda:
                precoPorto,
              preco_consulta:
                precoConsulta,
              pode_vender:
                podeVender,
            };
          }
        );

      lista.sort((a, b) => {
        if (
          a.pode_vender !==
          b.pode_vender
        ) {
          return a.pode_vender
            ? -1
            : 1;
        }

        const aEAN =
          digits.length >= 8 &&
          a.ean.replace(/\D/g, "") ===
            digits;

        const bEAN =
          digits.length >= 8 &&
          b.ean.replace(/\D/g, "") ===
            digits;

        if (aEAN !== bEAN) {
          return aEAN ? -1 : 1;
        }

        return a.nome.localeCompare(
          b.nome,
          "pt-BR"
        );
      });

      setResultados(lista);

      if (digits.length >= 8) {
        const exato =
          lista.find(
            (p) =>
              p.ean.replace(
                /\D/g,
                ""
              ) === digits &&
              p.pode_vender
          );

        if (exato) {
          add(exato);
          setBusca("");
          setResultados([]);
        }
      }
    } catch (e: any) {
      console.error(
        "Erro ao buscar produto:",
        e
      );

      alert(
        e?.message ||
          "Erro ao buscar produto"
      );
    } finally {
      setLoading(false);

      setTimeout(
        () =>
          inputRef.current?.focus(),
        50
      );
    }
  }

  function add(p: Produto) {
    if (
      !p.pode_vender ||
      p.estoque <= 0 ||
      p.preco_venda <= 0
    ) {
      return;
    }

    setItens((old) => {
      const f = old.find(
        (i) => i.id === p.id
      );

      if (f) {
        return old.map((i) =>
          i.id === p.id
            ? {
                ...i,
                qtd: Math.min(
                  i.qtd + 1,
                  p.estoque
                ),
              }
            : i
        );
      }

      return [
        ...old,
        {
          ...p,
          qtd: 1,
          descontoTipo:
            "PERCENTUAL",
          desconto: 0,
        },
      ];
    });

    setBusca("");
    setResultados([]);
  }

  function qtd(
    id: string,
    d: number
  ) {
    setItens((old) =>
      old
        .map((i) =>
          i.id === id
            ? {
                ...i,
                qtd: Math.min(
                  Math.max(
                    i.qtd + d,
                    0
                  ),
                  i.estoque
                ),
              }
            : i
        )
        .filter((i) => i.qtd > 0)
    );
  }

  function alterarDesconto(
    id: string,
    tipo: TipoDesconto,
    valor: number
  ) {
    setItens((old) =>
      old.map((i) => {
        if (i.id !== id)
          return i;

        const limite =
          tipo ===
          "PERCENTUAL"
            ? 100
            : i.preco_venda;

        return {
          ...i,
          descontoTipo: tipo,
          desconto: Math.min(
            limite,
            Math.max(
              0,
              Number(valor) || 0
            )
          ),
        };
      })
    );
  }

  function contaPorForma(
    forma: Forma
  ) {
    if (forma === "Dinheiro") {
      return (
        contas.find(
          (c) => c.tipo === "CAIXA"
        ) || null
      );
    }

    if (forma === "Pix") {
      return (
        contas.find(
          (c) =>
            c.tipo === "BANCO" ||
            c.tipo === "PIX"
        ) || null
      );
    }

    return (
      contas.find(
        (c) =>
          c.tipo ===
          "CARTAO_RECEBER"
      ) || null
    );
  }

  function addPagamento() {
    setPagamentos((p) => [
      ...p,
      {
        forma: "Pix",
        valor: "",
      },
    ]);
  }

  function setPagamento(
    idx: number,
    patch: Partial<Pagamento>
  ) {
    setPagamentos((old) =>
      old.map((p, i) =>
        i === idx
          ? {
              ...p,
              ...patch,
            }
          : p
      )
    );
  }

  function removerPagamento(
    idx: number
  ) {
    setPagamentos((old) =>
      old.filter(
        (_, i) => i !== idx
      )
    );
  }

  function limparEntrega() {
    setClienteNome("");
    setClienteTelefone("");
    setEndereco("");
    setNumeroEndereco("");
    setBairro("");
    setComplemento("");
    setReferencia("");
    setTaxaEntrega("0");
    setObservacoes("");
  }
    async function finalizar() {
    if (!itens.length) {
      return alert(
        "Adicione produtos à venda."
      );
    }

    if (
      tipoAtendimento ===
      "ENTREGA"
    ) {
      if (!clienteNome.trim()) {
        return alert(
          "Informe o nome do cliente para entrega."
        );
      }

      if (
        !clienteTelefone.trim()
      ) {
        return alert(
          "Informe o telefone/WhatsApp do cliente."
        );
      }

      if (
        !endereco.trim() ||
        !numeroEndereco.trim() ||
        !bairro.trim()
      ) {
        return alert(
          "Para entrega, informe endereço, número e bairro."
        );
      }
    }

    const validos =
      pagamentos
        .map((p) => ({
          ...p,
          numero: numero(p.valor),
        }))
        .filter(
          (p) => p.numero > 0
        );

    if (!validos.length) {
      return alert(
        "Informe o pagamento."
      );
    }

    if (
      Math.abs(
        validos.reduce(
          (s, p) =>
            s + p.numero,
          0
        ) - total
      ) > 0.009
    ) {
      return alert(
        `Os pagamentos precisam somar exatamente ${brl(
          total
        )}.`
      );
    }

    setSalvando(true);

    try {
      const {
        data: cx,
        error: cxErr,
      } = await supabase
        .from(
          "porto_caixa_sessoes"
        )
        .select("id")
        .eq(
          "loja_slug",
          PORTO_LOJA_SLUG
        )
        .eq(
          "status",
          "aberto"
        )
        .order(
          "aberto_em",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (cxErr) {
        throw cxErr;
      }

      if (!cx) {
        throw new Error(
          "Abra o caixa antes de finalizar vendas."
        );
      }

      const cliente =
        tipoAtendimento ===
        "ENTREGA"
          ? {
              nome:
                clienteNome.trim(),
              telefone:
                clienteTelefone.trim(),
            }
          : null;

      const enderecoEntrega =
        tipoAtendimento ===
        "ENTREGA"
          ? {
              endereco:
                endereco.trim(),
              numero:
                numeroEndereco.trim(),
              bairro:
                bairro.trim(),
              complemento:
                complemento.trim() ||
                null,
              referencia:
                referencia.trim() ||
                null,
            }
          : null;

      const {
        data: v,
        error,
      } = await supabase
        .from("porto_vendas")
        .insert({
          loja_slug:
            PORTO_LOJA_SLUG,
          caixa_sessao_id:
            cx.id,
          origem: "PDV",
          status:
            "FINALIZADA",
          cliente,
          tipo_entrega:
            tipoAtendimento,
          endereco_entrega:
            enderecoEntrega,
          taxa_entrega: taxa,
          observacoes:
            observacoes.trim() ||
            null,
          total,
          finalizada_em:
            new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      const rows =
        itens.map((i) => {
          const precoLiquido =
            precoLiquidoItem(i);

          const descontoUnitario =
            descontoUnitarioItem(i);

          return {
            venda_id: v.id,
            loja_slug:
              PORTO_LOJA_SLUG,
            produto_id: i.id,
            ean: i.ean,
            nome: i.nome,
            qtd: i.qtd,
            preco_original:
              i.preco_venda,
            preco_unit:
              precoLiquido,
            desconto_tipo:
              i.desconto > 0
                ? i.descontoTipo
                : null,
            desconto_percentual:
              i.descontoTipo ===
              "PERCENTUAL"
                ? i.desconto
                : 0,
            desconto_unitario:
              descontoUnitario,
            desconto_total:
              descontoUnitario *
              i.qtd,
            total:
              precoLiquido *
              i.qtd,
          };
        });

      const {
        error: ei,
      } = await supabase
        .from(
          "porto_venda_itens"
        )
        .insert(rows);

      if (ei) {
        throw ei;
      }

      for (
        const p of validos
      ) {
        const conta =
          contaPorForma(
            p.forma
          );

        const {
          error: ep,
        } = await supabase
          .from(
            "porto_venda_pagamentos"
          )
          .insert({
            venda_id: v.id,
            caixa_sessao_id:
              cx.id,
            loja_slug:
              PORTO_LOJA_SLUG,
            forma: p.forma,
            valor: p.numero,
            conta_financeira_id:
              conta?.id ||
              null,
          });

        if (ep) {
          throw ep;
        }

        if (conta) {
          const {
            error: mf,
          } = await supabase
            .from(
              "porto_movimentacoes_financeiras"
            )
            .insert({
              loja_slug:
                PORTO_LOJA_SLUG,
              conta_financeira_id:
                conta.id,
              tipo: "ENTRADA",
              categoria:
                `VENDA_${p.forma.toUpperCase()}`,
              descricao:
                `Venda PDV ${v.id.slice(
                  0,
                  8
                )}${
                  tipoAtendimento ===
                  "ENTREGA"
                    ? " - ENTREGA"
                    : ""
                }`,
              valor:
                p.numero,
              origem_tipo:
                "VENDA",
              origem_id:
                v.id,
            });

          if (mf) {
            throw mf;
          }
        }
      }

      for (
        const i of itens
      ) {
        const novo =
          Math.max(
            0,
            i.estoque -
              i.qtd
          );

        const {
          error: est,
        } = await supabase
          .from(
            "fv_farmacia_produtos"
          )
          .update({
            estoque: novo,
          })
          .eq(
            "farmacia_slug",
            PORTO_LOJA_SLUG
          )
          .eq(
            "produto_id",
            i.id
          );

        if (est) {
          throw est;
        }
      }

      const comprovante: ComprovantePorto =
        {
          numero:
            v.id
              .slice(0, 8)
              .toUpperCase(),

          data: new Date(),

          origem: "PDV",

          tipo:
            tipoAtendimento,

          clienteNome:
            tipoAtendimento ===
            "ENTREGA"
              ? clienteNome.trim()
              : undefined,

          clienteTelefone:
            tipoAtendimento ===
            "ENTREGA"
              ? clienteTelefone.trim()
              : undefined,

          enderecoEntrega:
            enderecoEntrega
              ? {
                  endereco:
                    enderecoEntrega.endereco,
                  numero:
                    enderecoEntrega.numero,
                  bairro:
                    enderecoEntrega.bairro,
                  complemento:
                    enderecoEntrega.complemento ||
                    undefined,
                  referencia:
                    enderecoEntrega.referencia ||
                    undefined,
                }
              : null,

          itens:
            itens.map(
              (i) => ({
                nome: i.nome,
                qtd: i.qtd,
                precoOriginal:
                  i.preco_venda,
                precoUnit:
                  precoLiquidoItem(
                    i
                  ),
                descontoUnitario:
                  descontoUnitarioItem(
                    i
                  ),
                descontoTotal:
                  descontoUnitarioItem(
                    i
                  ) * i.qtd,
                total:
                  precoLiquidoItem(
                    i
                  ) * i.qtd,
              })
            ),

          subtotalBruto,

          descontoTotal,

          subtotal,

          taxaEntrega:
            taxa,

          total,

          pagamentos:
            validos.map(
              (p) => ({
                forma: p.forma,
                valor: p.numero,
              })
            ),

          observacoes:
            observacoes.trim() ||
            undefined,
        };

      setUltimoComprovante(
        comprovante
      );

      imprimirComprovantePorto(
        comprovante
      );

      alert(
        `${
          tipoAtendimento ===
          "ENTREGA"
            ? "Venda para entrega"
            : "Venda"
        } finalizada: ${brl(
          total
        )}.\n` +
          `Pagamento(s) enviado(s) automaticamente ao caixa.\n` +
          `A impressão do comprovante foi aberta.`
      );

      setItens([]);
      setResultados([]);
      setBusca("");

      setPagamentos([
        {
          forma: "Dinheiro",
          valor: "",
        },
      ]);

      setTipoAtendimento(
        "BALCAO"
      );

      limparEntrega();
    } catch (e: any) {
      console.error(e);

      alert(
        e?.message ||
          "Erro ao finalizar venda"
      );
    } finally {
      setSalvando(false);

      inputRef.current?.focus();
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-28 md:p-5 md:pb-5">

      <div className="mx-auto max-w-[1500px]">

        {/* CABEÇALHO */}

        <header className="sticky top-0 z-30 flex items-center justify-between bg-blue-900 px-3 py-3 text-white shadow md:relative md:mb-4 md:rounded-2xl md:px-5 md:py-4">

          <div>
            <p className="text-[10px] font-bold uppercase text-blue-200">
              Drogarias Porto • Loja 2
            </p>

            <h1 className="text-xl font-black">
              PDV
            </h1>
          </div>

          <div className="flex items-center gap-2">

            {ultimoComprovante && (
              <button
                type="button"
                onClick={() =>
                  imprimirComprovantePorto(
                    ultimoComprovante
                  )
                }
                className="hidden rounded-xl bg-white/10 px-3 py-2 font-bold md:flex md:items-center md:gap-2"
              >
                <Printer
                  size={17}
                />

                Reimprimir
              </button>
            )}

            <Link
              href="/drogariasporto"
              className="rounded-xl bg-white/10 p-2"
            >
              <ArrowLeft
                size={20}
              />
            </Link>

            <Link
              href="/drogariasporto/caixa"
              className="rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-900"
            >
              Caixa
            </Link>

          </div>

        </header>


        <div className="grid gap-4 md:px-0 xl:grid-cols-[1fr_480px]">

          {/* ESQUERDA */}

          <section className="bg-white p-3 shadow-sm md:rounded-2xl md:p-4">

            {/* BUSCA */}

            <div className="sticky top-[68px] z-20 -mx-3 bg-white px-3 pb-3 pt-1 md:relative md:top-auto md:mx-0 md:px-0 md:pt-0">

              <div className="flex gap-2">

                <div className="flex min-w-0 flex-1 items-center rounded-xl border-2 border-blue-300 bg-white px-3 focus-within:border-blue-700">

                  <Search
                    size={20}
                    className="shrink-0 text-slate-500"
                  />

                  <input
                    ref={inputRef}
                    value={busca}
                    onChange={(
                      e
                    ) =>
                      setBusca(
                        e.target.value
                      )
                    }
                    onKeyDown={(
                      e
                    ) => {
                      if (
                        e.key ===
                        "Enter"
                      ) {
                        pesquisar();
                      }
                    }}
                    placeholder="Nome ou código"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-bold outline-none md:py-4"
                  />

                </div>


                <button
                  type="button"
                  onClick={
                    abrirCamera
                  }
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white active:scale-95 md:h-auto md:w-14"
                  title="Ler código de barras"
                >
                  <Camera
                    size={22}
                  />
                </button>


                <button
                  type="button"
                  onClick={() =>
                    pesquisar()
                  }
                  disabled={loading}
                  className="hidden rounded-xl bg-blue-700 px-5 font-black text-white disabled:opacity-50 sm:block"
                >
                  {loading
                    ? "..."
                    : "Buscar"}
                </button>

              </div>


              <button
                type="button"
                onClick={() =>
                  pesquisar()
                }
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-blue-700 py-3 font-black text-white disabled:opacity-50 sm:hidden"
              >
                {loading
                  ? "Buscando..."
                  : "BUSCAR PRODUTO"}
              </button>

            </div>


            {/* RESULTADOS */}

            {loading && (
              <div className="rounded-xl bg-blue-50 p-4 text-center font-bold text-blue-800">
                Buscando produtos...
              </div>
            )}


            {!loading &&
              resultados.length >
                0 && (

              <div className="mb-4 space-y-2">

                <div className="flex items-center justify-between">

                  <h2 className="text-sm font-black uppercase text-slate-600">
                    Resultados
                  </h2>

                  <button
                    type="button"
                    onClick={() =>
                      setResultados(
                        []
                      )
                    }
                    className="text-xs font-bold text-slate-500"
                  >
                    Limpar
                  </button>

                </div>


                <div className="grid gap-2 md:grid-cols-2">

                  {resultados.map(
                    (p) => (

                      <div
                        key={p.id}
                        className={`rounded-2xl border-2 p-3 ${
                          p.pode_vender
                            ? "border-green-200 bg-green-50/40"
                            : "border-slate-200 bg-white"
                        }`}
                      >

                        <div className="flex gap-3">

                          <div className="min-w-0 flex-1">

                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black ${
                                p.pode_vender
                                  ? "bg-green-100 text-green-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {p.pode_vender
                                ? "EM ESTOQUE"
                                : "CONSULTA"}
                            </span>


                            <div className="mt-2 text-base font-black leading-tight text-slate-900">
                              {p.nome}
                            </div>


                            <div className="mt-1 text-xs text-slate-500">

                              {[
                                p.laboratorio,
                                p.apresentacao,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " • "
                                )}

                            </div>


                            {p.ean && (
                              <div className="mt-1 text-[11px] text-slate-400">
                                EAN {p.ean}
                              </div>
                            )}


                            <div className="mt-3 flex items-end justify-between gap-3">

                              <div>
                                <div className="text-[10px] font-bold uppercase text-slate-400">
                                  {p.pode_vender
                                    ? "Preço Porto"
                                    : "Consulta"}
                                </div>

                                <div className="text-2xl font-black text-blue-900">
                                  {brl(
                                    p.pode_vender
                                      ? p.preco_venda
                                      : p.preco_consulta
                                  )}
                                </div>
                              </div>


                              <div className="text-right">

                                <div className="text-[10px] font-bold uppercase text-slate-400">
                                  Estoque
                                </div>

                                <div
                                  className={`font-black ${
                                    p.estoque >
                                    0
                                      ? "text-green-700"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {p.estoque >
                                  0
                                    ? p.estoque
                                    : "0"}
                                </div>

                              </div>

                            </div>

                          </div>


                          <button
                            type="button"
                            disabled={
                              !p.pode_vender
                            }
                            onClick={() =>
                              add(p)
                            }
                            className={`self-end rounded-xl px-3 py-3 text-sm font-black ${
                              p.pode_vender
                                ? "bg-green-600 text-white active:scale-95"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {p.pode_vender
                              ? "+"
                              : "—"}
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}


            {/* CARRINHO MOBILE */}

            <div className="md:hidden">

              <div className="mb-2 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <ShoppingCart
                    size={18}
                  />

                  <h2 className="font-black">
                    Carrinho
                  </h2>

                </div>

                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-black text-blue-800">
                  {quantidadeItens} item(ns)
                </span>

              </div>


              {!itens.length && (

                <div className="rounded-2xl border-2 border-dashed p-8 text-center text-slate-400">
                  Nenhum produto adicionado
                </div>

              )}


              <div className="space-y-3">

                {itens.map(
                  (i) => (

                    <div
                      key={i.id}
                      className="rounded-2xl border bg-white p-3 shadow-sm"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0 flex-1">

                          <div className="font-black leading-tight">
                            {i.nome}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {brl(
                              i.preco_venda
                            )}{" "}
                            cada
                          </div>

                        </div>


                        <button
                          type="button"
                          onClick={() =>
                            setItens(
                              (
                                old
                              ) =>
                                old.filter(
                                  (
                                    x
                                  ) =>
                                    x.id !==
                                    i.id
                                )
                            )
                          }
                          className="rounded-lg bg-red-50 p-2 text-red-600"
                        >
                          <Trash2
                            size={18}
                          />
                        </button>

                      </div>


                      <div className="mt-3 flex items-center justify-between gap-2">

                        <div className="inline-flex items-center rounded-xl border">

                          <button
                            type="button"
                            onClick={() =>
                              qtd(
                                i.id,
                                -1
                              )
                            }
                            className="p-3"
                          >
                            <Minus
                              size={16}
                            />
                          </button>

                          <span className="min-w-9 text-center font-black">
                            {i.qtd}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              qtd(
                                i.id,
                                1
                              )
                            }
                            className="p-3"
                          >
                            <Plus
                              size={16}
                            />
                          </button>

                        </div>


                        <div className="text-right">

                          <div className="text-xs text-slate-500">
                            Total
                          </div>

                          <div className="text-xl font-black text-blue-900">
                            {brl(
                              precoLiquidoItem(
                                i
                              ) *
                                i.qtd
                            )}
                          </div>

                        </div>

                      </div>


                      <div className="mt-3 rounded-xl bg-slate-50 p-2">

                        <div className="mb-1 text-xs font-bold text-slate-500">
                          Desconto
                        </div>

                        <div className="grid grid-cols-[90px_1fr] gap-2">

                          <select
                            value={
                              i.descontoTipo
                            }
                            onChange={(
                              e
                            ) =>
                              alterarDesconto(
                                i.id,
                                e.target
                                  .value as TipoDesconto,
                                i.desconto
                              )
                            }
                            className="rounded-lg border bg-white px-2 py-2 font-bold"
                          >
                            <option value="PERCENTUAL">
                              %
                            </option>

                            <option value="VALOR">
                              R$
                            </option>
                          </select>


                          <input
                            value={
                              i.desconto
                                ? String(
                                    i.desconto
                                  ).replace(
                                    ".",
                                    ","
                                  )
                                : ""
                            }
                            onChange={(
                              e
                            ) =>
                              alterarDesconto(
                                i.id,
                                i.descontoTipo,
                                numero(
                                  e.target
                                    .value
                                )
                              )
                            }
                            inputMode="decimal"
                            placeholder="0"
                            className="rounded-lg border bg-white px-3 py-2 text-right font-bold outline-none"
                          />

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* CARRINHO DESKTOP */}

            <div className="mt-4 hidden overflow-x-auto rounded-xl border md:block">

              <table className="w-full min-w-[850px] text-sm">

                <thead className="bg-slate-50 text-left">

                  <tr>
                    <th className="p-3">
                      Produto
                    </th>

                    <th>Qtd</th>
                    <th>Preço</th>
                    <th>Desconto</th>
                    <th>Unit. final</th>
                    <th>Total</th>
                    <th></th>
                  </tr>

                </thead>

                <tbody>

                  {itens.map(
                    (i) => (

                      <tr
                        key={i.id}
                        className="border-t"
                      >

                        <td className="p-3">

                          <b>
                            {i.nome}
                          </b>

                          <small className="block text-slate-500">
                            EAN {i.ean}
                          </small>

                        </td>


                        <td>

                          <div className="inline-flex items-center rounded-lg border">

                            <button
                              type="button"
                              onClick={() =>
                                qtd(
                                  i.id,
                                  -1
                                )
                              }
                              className="p-2"
                            >
                              <Minus
                                size={14}
                              />
                            </button>

                            <b className="px-2">
                              {i.qtd}
                            </b>

                            <button
                              type="button"
                              onClick={() =>
                                qtd(
                                  i.id,
                                  1
                                )
                              }
                              className="p-2"
                            >
                              <Plus
                                size={14}
                              />
                            </button>

                          </div>

                        </td>


                        <td>
                          {brl(
                            i.preco_venda
                          )}
                        </td>


                        <td>

                          <div className="flex min-w-[170px] items-center gap-1">

                            <select
                              value={
                                i.descontoTipo
                              }
                              onChange={(
                                e
                              ) =>
                                alterarDesconto(
                                  i.id,
                                  e.target
                                    .value as TipoDesconto,
                                  i.desconto
                                )
                              }
                              className="rounded-lg border bg-white px-2 py-2 text-xs font-bold"
                            >
                              <option value="PERCENTUAL">
                                %
                              </option>

                              <option value="VALOR">
                                R$
                              </option>
                            </select>


                            <input
                              value={
                                i.desconto
                                  ? String(
                                      i.desconto
                                    ).replace(
                                      ".",
                                      ","
                                    )
                                  : ""
                              }
                              onChange={(
                                e
                              ) =>
                                alterarDesconto(
                                  i.id,
                                  i.descontoTipo,
                                  numero(
                                    e.target
                                      .value
                                  )
                                )
                              }
                              inputMode="decimal"
                              placeholder="0"
                              className="w-20 rounded-lg border px-2 py-2 text-right font-bold"
                            />

                          </div>

                        </td>


                        <td className="font-bold text-blue-800">
                          {brl(
                            precoLiquidoItem(
                              i
                            )
                          )}
                        </td>


                        <td className="font-bold">
                          {brl(
                            precoLiquidoItem(
                              i
                            ) *
                              i.qtd
                          )}
                        </td>


                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              setItens(
                                (
                                  old
                                ) =>
                                  old.filter(
                                    (
                                      x
                                    ) =>
                                      x.id !==
                                      i.id
                                  )
                              )
                            }
                            className="p-2 text-red-600"
                          >
                            <Trash2
                              size={18}
                            />
                          </button>
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>


              {!itens.length && (

                <div className="p-8 text-center text-slate-400">
                  Venda vazia
                </div>

              )}

            </div>

          </section>


          {/* FINALIZAÇÃO */}

          <aside
            ref={
              pagamentoRef
            }
            className="bg-white p-4 shadow-sm md:rounded-2xl md:p-5"
          >

            <div className="rounded-2xl bg-blue-950 p-4 text-white">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-xs font-bold text-blue-200">
                    TOTAL DA VENDA
                  </div>

                  <div className="text-4xl font-black">
                    {brl(total)}
                  </div>

                </div>

                <ShoppingCart
                  size={32}
                  className="text-blue-300"
                />

              </div>

            </div>


            {/* ATENDIMENTO */}

            <div className="mt-4">

              <div className="mb-2 text-sm font-black">
                Tipo de atendimento
              </div>

              <div className="grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setTipoAtendimento(
                      "BALCAO"
                    )
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 font-black ${
                    tipoAtendimento ===
                    "BALCAO"
                      ? "border-blue-700 bg-blue-50 text-blue-800"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Store
                    size={18}
                  />

                  Balcão
                </button>


                <button
                  type="button"
                  onClick={() =>
                    setTipoAtendimento(
                      "ENTREGA"
                    )
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 font-black ${
                    tipoAtendimento ===
                    "ENTREGA"
                      ? "border-green-600 bg-green-50 text-green-800"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Truck
                    size={18}
                  />

                  Entrega
                </button>

              </div>

            </div>


            {/* ENTREGA */}

            {tipoAtendimento ===
              "ENTREGA" && (

              <div className="mt-4 rounded-2xl border-2 border-green-100 bg-green-50/40 p-3">

                <div className="mb-3 flex items-center gap-2 font-black text-green-900">
                  <Truck
                    size={18}
                  />

                  Dados da entrega
                </div>


                <div className="grid gap-2">

                  <input
                    value={
                      clienteNome
                    }
                    onChange={(
                      e
                    ) =>
                      setClienteNome(
                        e.target.value
                      )
                    }
                    placeholder="Nome do cliente *"
                    className="rounded-xl border bg-white p-3"
                  />


                  <input
                    value={
                      clienteTelefone
                    }
                    onChange={(
                      e
                    ) =>
                      setClienteTelefone(
                        e.target.value
                      )
                    }
                    placeholder="Telefone / WhatsApp *"
                    className="rounded-xl border bg-white p-3"
                  />


                  <div className="grid grid-cols-[1fr_100px] gap-2">

                    <input
                      value={
                        endereco
                      }
                      onChange={(
                        e
                      ) =>
                        setEndereco(
                          e.target.value
                        )
                      }
                      placeholder="Endereço *"
                      className="min-w-0 rounded-xl border bg-white p-3"
                    />

                    <input
                      value={
                        numeroEndereco
                      }
                      onChange={(
                        e
                      ) =>
                        setNumeroEndereco(
                          e.target.value
                        )
                      }
                      placeholder="Nº *"
                      className="rounded-xl border bg-white p-3"
                    />

                  </div>


                  <input
                    value={bairro}
                    onChange={(
                      e
                    ) =>
                      setBairro(
                        e.target.value
                      )
                    }
                    placeholder="Bairro *"
                    className="rounded-xl border bg-white p-3"
                  />


                  <input
                    value={
                      complemento
                    }
                    onChange={(
                      e
                    ) =>
                      setComplemento(
                        e.target.value
                      )
                    }
                    placeholder="Complemento"
                    className="rounded-xl border bg-white p-3"
                  />


                  <input
                    value={
                      referencia
                    }
                    onChange={(
                      e
                    ) =>
                      setReferencia(
                        e.target.value
                      )
                    }
                    placeholder="Referência"
                    className="rounded-xl border bg-white p-3"
                  />


                  <input
                    value={
                      taxaEntrega
                    }
                    onChange={(
                      e
                    ) =>
                      setTaxaEntrega(
                        e.target.value
                      )
                    }
                    placeholder="Taxa de entrega"
                    inputMode="decimal"
                    className="rounded-xl border bg-white p-3"
                  />


                  <textarea
                    value={
                      observacoes
                    }
                    onChange={(
                      e
                    ) =>
                      setObservacoes(
                        e.target.value
                      )
                    }
                    placeholder="Observações"
                    className="min-h-20 rounded-xl border bg-white p-3"
                  />

                </div>

              </div>

            )}


            {/* PAGAMENTOS */}

            <div className="mt-5 flex items-center justify-between">

              <h2 className="font-black">
                Pagamentos
              </h2>

              <button
                type="button"
                onClick={
                  addPagamento
                }
                className="rounded-xl border px-3 py-2 text-xs font-black"
              >
                + Misto
              </button>

            </div>


            <div className="mt-3 space-y-2">

              {pagamentos.map(
                (
                  p,
                  idx
                ) => (

                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_120px_auto] gap-2 rounded-xl border p-2"
                  >

                    <select
                      value={
                        p.forma
                      }
                      onChange={(
                        e
                      ) =>
                        setPagamento(
                          idx,
                          {
                            forma:
                              e.target
                                .value as Forma,
                          }
                        )
                      }
                      className="min-w-0 rounded-lg border bg-white p-2 font-bold"
                    >
                      <option>
                        Dinheiro
                      </option>

                      <option>
                        Pix
                      </option>

                      <option>
                        Débito
                      </option>

                      <option>
                        Crédito
                      </option>
                    </select>


                    <input
                      value={
                        p.valor
                      }
                      onChange={(
                        e
                      ) =>
                        setPagamento(
                          idx,
                          {
                            valor:
                              e.target
                                .value,
                          }
                        )
                      }
                      inputMode="decimal"
                      placeholder="0,00"
                      className="min-w-0 rounded-lg border p-2 text-right font-black"
                    />


                    {pagamentos.length >
                      1 && (

                      <button
                        type="button"
                        onClick={() =>
                          removerPagamento(
                            idx
                          )
                        }
                        className="rounded-lg p-2 text-red-600"
                      >
                        <Trash2
                          size={18}
                        />
                      </button>

                    )}

                  </div>

                )
              )}

            </div>


            {/* RESUMO */}

            <div className="mt-4 space-y-1 rounded-xl bg-slate-50 p-3 text-sm">

              <div className="flex justify-between">
                <span>
                  Subtotal bruto
                </span>

                <b>
                  {brl(
                    subtotalBruto
                  )}
                </b>
              </div>


              {descontoTotal >
                0 && (

                <div className="flex justify-between text-green-700">
                  <span>
                    Descontos
                  </span>

                  <b>
                    -{" "}
                    {brl(
                      descontoTotal
                    )}
                  </b>
                </div>

              )}


              <div className="flex justify-between">
                <span>
                  Subtotal
                </span>

                <b>
                  {brl(
                    subtotal
                  )}
                </b>
              </div>


              {tipoAtendimento ===
                "ENTREGA" && (

                <div className="flex justify-between">
                  <span>
                    Taxa entrega
                  </span>

                  <b>
                    {brl(
                      taxa
                    )}
                  </b>
                </div>

              )}


              <div className="flex justify-between">
                <span>
                  Informado
                </span>

                <b>
                  {brl(
                    totalPagamentos
                  )}
                </b>
              </div>


              <div className="flex justify-between">
                <span>
                  Falta
                </span>

                <b
                  className={
                    faltante > 0
                      ? "text-red-600"
                      : "text-green-700"
                  }
                >
                  {brl(
                    faltante
                  )}
                </b>
              </div>

            </div>


            <button
              type="button"
              disabled={
                salvando ||
                !itens.length ||
                Math.abs(
                  totalPagamentos -
                    total
                ) > 0.009
              }
              onClick={
                finalizar
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-lg font-black text-white disabled:opacity-40"
            >
              <ReceiptText />

              {salvando
                ? "Finalizando..."
                : tipoAtendimento ===
                  "ENTREGA"
                ? "FINALIZAR ENTREGA"
                : "FINALIZAR VENDA"}
            </button>

          </aside>

        </div>

      </div>


      {/* BARRA FIXA MOBILE */}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-2 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] md:hidden">

        <div className="mx-auto flex max-w-lg items-center gap-3">

          <div className="min-w-0 flex-1">

            <div className="text-[10px] font-bold uppercase text-slate-500">
              {quantidadeItens} item(ns)
            </div>

            <div className="text-2xl font-black text-blue-950">
              {brl(total)}
            </div>

          </div>


          <button
            type="button"
            disabled={
              !itens.length
            }
            onClick={() =>
              pagamentoRef.current?.scrollIntoView(
                {
                  behavior:
                    "smooth",
                  block: "start",
                }
              )
            }
            className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white disabled:opacity-40"
          >
            PAGAMENTO
          </button>

        </div>

      </div>


      {/* MODAL CÂMERA */}

      {cameraAberta && (

        <div className="fixed inset-0 z-[100] bg-black">

          <div className="flex h-full flex-col">

            <div className="flex items-center justify-between bg-black/90 p-4 text-white">

              <div>

                <div className="font-black">
                  Ler código de barras
                </div>

                <div className="text-xs text-slate-300">
                  Aponte para o EAN do produto
                </div>

              </div>


              <button
                type="button"
                onClick={
                  fecharCamera
                }
                className="rounded-xl bg-white/10 p-2"
              >
                <X
                  size={24}
                />
              </button>

            </div>


            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">

              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />


              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                <div className="relative h-36 w-[88%] max-w-md rounded-2xl border-2 border-white">

                  <div className="absolute left-4 right-4 top-1/2 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />

                </div>

              </div>


              {cameraLendo && (
                <div className="absolute bottom-8 rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white">
                  Procurando código...
                </div>
              )}

            </div>


            {cameraErro && (

              <div className="bg-red-600 p-4 text-center text-sm font-bold text-white">
                {cameraErro}
              </div>

            )}


            <div className="bg-black p-4">

              <button
                type="button"
                onClick={
                  fecharCamera
                }
                className="w-full rounded-xl bg-white py-3 font-black text-slate-900"
              >
                Fechar câmera
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}