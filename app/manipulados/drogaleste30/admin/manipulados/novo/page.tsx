import NovoManipuladoClient from "./NovoManipuladoClient";

type PageProps = {
  searchParams?: {
    formula_id?: string;
  };
};

export default function Page({ searchParams }: PageProps) {
  return (
    <NovoManipuladoClient formulaId={searchParams?.formula_id || ""} />
  );
}