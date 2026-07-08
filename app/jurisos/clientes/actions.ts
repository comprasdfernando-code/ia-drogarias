"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export async function criarCliente(formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();

  if (!nome) {
    throw new Error("Nome é obrigatório");
  }

  await supabase.from("jurisos_clientes").insert({
    nome,
    cpf: String(formData.get("cpf") || ""),
    cnpj: String(formData.get("cnpj") || ""),
    telefone: String(formData.get("telefone") || ""),
    whatsapp: String(formData.get("whatsapp") || ""),
    email: String(formData.get("email") || ""),
    cep: String(formData.get("cep") || ""),
    logradouro: String(formData.get("logradouro") || ""),
    numero: String(formData.get("numero") || ""),
    bairro: String(formData.get("bairro") || ""),
    cidade: String(formData.get("cidade") || ""),
    estado: String(formData.get("estado") || ""),
    profissao: String(formData.get("profissao") || ""),
    empresa: String(formData.get("empresa") || ""),
    observacoes: String(formData.get("observacoes") || ""),
    status: String(formData.get("status") || "Ativo"),
  });

  revalidatePath("/jurisos/clientes");
  redirect("/jurisos/clientes");
}

export async function atualizarCliente(id: string, formData: FormData) {
  await supabase
    .from("jurisos_clientes")
    .update({
      nome: String(formData.get("nome") || ""),
      cpf: String(formData.get("cpf") || ""),
      cnpj: String(formData.get("cnpj") || ""),
      telefone: String(formData.get("telefone") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      email: String(formData.get("email") || ""),
      cep: String(formData.get("cep") || ""),
      logradouro: String(formData.get("logradouro") || ""),
      numero: String(formData.get("numero") || ""),
      bairro: String(formData.get("bairro") || ""),
      cidade: String(formData.get("cidade") || ""),
      estado: String(formData.get("estado") || ""),
      profissao: String(formData.get("profissao") || ""),
      empresa: String(formData.get("empresa") || ""),
      observacoes: String(formData.get("observacoes") || ""),
      status: String(formData.get("status") || "Ativo"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/jurisos/clientes");
  redirect(`/jurisos/clientes/${id}`);
}

export async function excluirCliente(id: string) {
  await supabase.from("jurisos_clientes").delete().eq("id", id);

  revalidatePath("/jurisos/clientes");
  redirect("/jurisos/clientes");
}