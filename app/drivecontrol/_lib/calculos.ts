export function calcularRodizioPorPlaca(placa: string) {
  const numeros = placa.replace(/\D/g, "");
  const final = Number(numeros.slice(-1));

  if (Number.isNaN(final)) {
    return { finalPlaca: null, rodizioDia: "" };
  }

  const mapa: Record<number, string> = {
    1: "Segunda-feira",
    2: "Segunda-feira",
    3: "Terça-feira",
    4: "Terça-feira",
    5: "Quarta-feira",
    6: "Quarta-feira",
    7: "Quinta-feira",
    8: "Quinta-feira",
    9: "Sexta-feira",
    0: "Sexta-feira",
  };

  return {
    finalPlaca: final,
    rodizioDia: mapa[final] ?? "",
  };
}

export function calcularKmRodado(kmInicial: number, kmFinal: number) {
  return Math.max(0, kmFinal - kmInicial);
}

export function calcularLucroLiquido(
  bruto: number,
  combustivel: number,
  outros: number
) {
  return bruto - combustivel - outros;
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}