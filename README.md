# IA Farma – Demo (Next.js + Tailwind)

Este projeto contém a **landing page da IA Farma** pronta para publicar.
Inclui Tailwind, componentes simples e os assets (logo e avatar).

## Pré-requisitos
- Node.js LTS instalado (recomendado 18+)
- Conta no GitHub e no Vercel

## Como rodar localmente
```bash
npm install
npm run dev
```
Acesse http://localhost:3000

## Publicar no Vercel (recomendado)
1. Crie um repositório no GitHub (ex.: `iafarma-demo`) e **suba** os arquivos deste projeto.
2. No Vercel, clique em **Add New → Project** e importe o repositório.
3. Framework: **Next.js**. (Config padrão do Vercel já funciona)
4. Clique em **Deploy**.

### Via Vercel CLI (opcional)
```bash
npm i -g vercel
vercel
```

## Onde alterar informações
- **WhatsApp**: arquivo `app/page.tsx` (procurar por `5511952068432`)
- **E-mail, CNPJ, horários**: `app/page.tsx` (rodapé “Contato”)
- **Textos das seções**: `app/page.tsx`
- **Logo/Avatar**: estão em `public/logo-iafarma.png` e `public/avatar-iafarma.png`

## Dica
- Se quiser usar **domínio próprio** no Vercel (ex.: `iafarma.com.br`):
  - Settings do projeto → **Domains** → Adicione seu domínio e siga os passos de DNS.
