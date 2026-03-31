import NovoManipuladoClient from "./NovoManipuladoClient";

type PageProps = {
  searchParams?: Promise<{
    formula_id?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const formulaId = params.formula_id || "";

  return <NovoManipuladoClient formulaId={formulaId} />;
}