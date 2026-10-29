import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
const SLUG = 'farmacondetiradentes';
const BUCKET = 'farmaconde-produtos';
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function fail(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
async function authorized(req: NextRequest) {
  if (!URL || !ANON || !SERVICE || !process.env.FARMACONDE_ADMIN_EMAILS) return null;
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const auth = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user?.email) return null;
  const allowed = process.env.FARMACONDE_ADMIN_EMAILS.split(',').map(s => s.trim().toLowerCase());
  if (!allowed.includes(user.email.toLowerCase())) return null;
  return createClient(URL, SERVICE, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const db = await authorized(req);
  if (!db) return fail('Acesso não autorizado', 403);
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? 1) || 1);
  const size = 24;
  let storeQuery = db.from('fv_farmacia_produtos').select('id,produto_id,ean,estoque,preco_custo,preco_venda,ativo,ativo_site,ativo_pdv,imagens', { count: 'exact' }).eq('farmacia_slug', SLUG);
  if (q) {
    const safe = q.replace(/[%(),]/g, ' ').slice(0, 90);
    const { data: matches, error: searchError } = await db.from('fv_produtos').select('id').or(`nome.ilike.%${safe}%,ean.ilike.%${safe}%`).limit(1000);
    if (searchError) return fail(searchError.message, 500);
    const ids = (matches ?? []).map(p => p.id);
    if (!ids.length) return NextResponse.json({ items: [], total: 0, page, size });
    storeQuery = storeQuery.in('produto_id', ids);
  }
  const { data: rows, count, error } = await storeQuery.order('ean').range((page - 1) * size, page * size - 1);
  if (error) return fail(error.message, 500);
  const ids = (rows ?? []).map(r => r.produto_id).filter(Boolean);
  const { data: products, error: pe } = ids.length ? await db.from('fv_produtos').select('id,nome,ean,apresentacao,imagens').in('id', ids) : { data: [], error: null };
  if (pe) return fail(pe.message, 500);
  const byId = new Map((products ?? []).map(p => [p.id, p]));
  return NextResponse.json({ items: (rows ?? []).map(r => ({ ...r, produto: byId.get(r.produto_id) ?? null })), total: count ?? 0, page, size });
}

export async function PATCH(req: NextRequest) {
  const db = await authorized(req);
  if (!db) return fail('Acesso não autorizado', 403);
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== 'string') return fail('Produto inválido');
  const { data: old, error: oe } = await db.from('fv_farmacia_produtos').select('id,preco_custo,preco_venda,estoque').eq('id', body.id).eq('farmacia_slug', SLUG).single();
  if (oe || !old) return fail('Produto não encontrado', 404);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ['estoque', 'preco_custo', 'preco_venda']) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < 0 || (key === 'estoque' && !Number.isInteger(n))) return fail(`Valor inválido: ${key}`);
      patch[key] = n;
    }
  }
  for (const key of ['ativo', 'ativo_site', 'ativo_pdv']) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      if (typeof body[key] !== 'boolean') return fail(`Valor inválido: ${key}`);
      patch[key] = body[key];
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, 'imagens')) {
    if (!Array.isArray(body.imagens) || body.imagens.length > 8 || body.imagens.some((u: unknown) => typeof u !== 'string' || !u.startsWith(`${URL}/storage/v1/object/public/${BUCKET}/`))) return fail('Fotos inválidas');
    patch.imagens = body.imagens;
  }
  const custo = Number(patch.preco_custo ?? old.preco_custo ?? 0);
  const venda = Number(patch.preco_venda ?? old.preco_venda ?? 0);
  const estoque = Number(patch.estoque ?? old.estoque ?? 0);
  if ((patch.ativo_site === true || patch.ativo_pdv === true || patch.ativo === true) && (venda <= 0 || custo > venda || estoque <= 0)) return fail('Para liberar, informe estoque positivo e preço de venda maior ou igual ao custo.');
  if (estoque <= 0 || venda <= 0 || custo > venda) { patch.ativo_site = false; patch.ativo_pdv = false; patch.ativo = false; }
  const { data, error } = await db.from('fv_farmacia_produtos').update(patch).eq('id', body.id).eq('farmacia_slug', SLUG).select('id').single();
  if (error) return fail(error.message, 500);
  return NextResponse.json({ ok: true, id: data.id });
}

export async function POST(req: NextRequest) {
  const db = await authorized(req);
  if (!db) return fail('Acesso não autorizado', 403);
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const id = form?.get('id');
  if (!(file instanceof File) || typeof id !== 'string') return fail('Arquivo ou produto inválido');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) return fail('Envie JPG, PNG ou WEBP de até 4 MB');
  const { data: found } = await db.from('fv_farmacia_produtos').select('id').eq('id', id).eq('farmacia_slug', SLUG).maybeSingle();
  if (!found) return fail('Produto não encontrado', 404);
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (error) return fail(error.message, 500);
  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
