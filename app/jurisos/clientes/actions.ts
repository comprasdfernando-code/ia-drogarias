"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export async function criarCliente(formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();

  const { error } = await supabase.from("jurisos_clientes").insert({
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

  if (error) throw new Error(error.message);

  revalidatePath("/jurisos/clientes");
  redirect("/jurisos/clientes");
}

export async function atualizarCliente(id: string, formData: FormData) {
  const { error } = await supabase
    .from("jurisos_clientes")
    .update({
      nome: String(formData.get("nome") || "").trim(),
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

  if (error) throw new Error(error.message);

  revalidatePath("/jurisos/clientes");
  revalidatePath(`/jurisos/clientes/${id}`);
  redirect(`/jurisos/clientes/${id}`);
}

export async function excluirCliente(id: string) {
  const { error } = await supabase
    .from("jurisos_clientes")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/jurisos/clientes");
  redirect("/jurisos/clientes");
}