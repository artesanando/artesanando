/** Iniciais de um nome (até 2 letras): "Ana Luiza Prado" → "AL" */
export const ini = (n: string) =>
  n
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
