import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "JurisOS | Sistema Operacional Jurídico",
  description: "Sistema inteligente para escritórios de advocacia.",
}

export default function JurisOSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}