"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function money(formData: FormData, key: string) {
  const raw = String(formData.get(key) || "").replace(".", "").replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export async function criarProcesso(formData: FormData) {
  const numero_cnj = text(formData, "numero_cnj");

  if (!numero_cnj) throw new Error("Número CNJ é obrigatório");

  const { error } = await supabase.from("jurisos_processos").insert({
    cliente_id: nullableText(formData, "cliente_id"),
    numero_cnj,
    area: text(formData, "area"),
    tribunal: text(formData, "tribunal"),
    vara: text(formData, "vara"),
    comarca: text(formData, "comarca"),
    fase: text(formData, "fase"),
    status: text(formData, "status") || "Em andamento",
    valor: money(formData, "valor"),
    descricao: text(formData, "descricao"),
    responsavel: text(formData, "responsavel"),
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/jurisos/processos");
  redirect("/jurisos/processos");
}

export async function atualizarProcesso(id: string, formData: FormData) {
  const numero_cnj = text(formData, "numero_cnj");

  if (!numero_cnj) throw new Error("Número CNJ é obrigatório");

  const { error } = await supabase
    .from("jurisos_processos")
    .update({
      cliente_id: nullableText(formData, "cliente_id"),
      numero_cnj,
      area: text(formData, "area"),
      tribunal: text(formData, "tribunal"),
      vara: text(formData, "vara"),
      comarca: text(formData, "comarca"),
      fase: text(formData, "fase"),
      status: text(formData, "status") || "Em andamento",
      valor: money(formData, "valor"),
      descricao: text(formData, "descricao"),
      responsavel: text(formData, "responsavel"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/jurisos/processos");
  revalidatePath(`/jurisos/processos/${id}`);
  redirect(`/jurisos/processos/${id}`);
}

export async function excluirProcesso(id: string) {
  const { error } = await supabase.from("jurisos_processos").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/jurisos/processos");
  redirect("/jurisos/processos");
}

export async function criarMovimentacao(processoId: string, formData: FormData) {
  const titulo = text(formData, "titulo");

  if (!titulo) throw new Error("Título é obrigatório");

  const { error } = await supabase.from("jurisos_movimentacoes").insert({
    processo_id: processoId,
    titulo,
    descricao: text(formData, "descricao"),
    tipo: text(formData, "tipo"),
    arquivo: text(formData, "arquivo"),
    data_movimentacao: text(formData, "data_movimentacao") || new Date().toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/jurisos/processos/${processoId}`);
}

export async function excluirMovimentacao(processoId: string, movimentacaoId: string) {
  const { error } = await supabase
    .from("jurisos_movimentacoes")
    .delete()
    .eq("id", movimentacaoId);

  if (error) throw new Error(error.message);

  revalidatePath(`/jurisos/processos/${processoId}`);
}
