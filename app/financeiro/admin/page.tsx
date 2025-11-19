"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminPanel() {
  return (
    <div className="px-4 md:px-10 py-8 space-y-10">

      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle>Painel Administrativo — Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">
            Área de controle para lançamentos, edições e permissões.
          </p>
        </CardContent>
      </Card>

      {/* BOTÕES / ATALHOS */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Faturamento */}
        <Link href="/financeiro/admin/faturamento">
          <Card className="hover:bg-zinc-800 cursor-pointer transition">
            <CardHeader>
              <CardTitle>📄 Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Cadastrar, editar e gerenciar faturamento mensal.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Fomento */}
        <Link href="/financeiro/admin/fomento">
          <Card className="hover:bg-zinc-800 cursor-pointer transition">
            <CardHeader>
              <CardTitle>💰 Fomento (Clean)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Lançamentos financeiros relacionados ao Clean.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Despesas / DRE */}
        <Link href="/financeiro/admin/dre">
          <Card className="hover:bg-zinc-800 cursor-pointer transition">
            <CardHeader>
              <CardTitle>📊 Despesas / DRE</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Inserção de despesas operacionais e categorias da DRE.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Endividamento */}
        <Link href="/financeiro/admin/endividamento">
          <Card className="hover:bg-zinc-800 cursor-pointer transition">
            <CardHeader>
              <CardTitle>🏦 Endividamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Controle de dívidas, empréstimos e bancos.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Recebíveis */}
        <Link href="/financeiro/admin/recebiveis">
          <Card className="hover:bg-zinc-800 cursor-pointer transition">
            <CardHeader>
              <CardTitle>💳 Recebíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Controle de cartões, maquininhas e antecipações.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Instituições */}
        <Link href="/financeiro/admin/instituicoes">
          <Card className="hover:bg-zinc-800 cursor-pointer transition">
            <CardHeader>
              <CardTitle>🏛 Instituições / Bancos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Cadastro de bancos, limites, taxas e operações.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Permissões */}
        <Link href="/financeiro/admin/permissoes">
          <Card className="hover:bg-zinc-800 cursor-pointer transition">
            <CardHeader>
              <CardTitle>🔐 Permissões de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Definir o que cada usuário pode ver ou editar.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Auditoria / Logs */}
        <Link href="/financeiro/admin/logs">
          <Card className="hover:bg-zinc-800 cursor-pointer transition">
            <CardHeader>
              <CardTitle>📝 Auditoria / Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Histórico de ações e alterações do sistema.
              </p>
            </CardContent>
          </Card>
        </Link>

      </div>
    </div>
  );
}
