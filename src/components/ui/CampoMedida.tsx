import { Campo } from './Campo'

/* Largura × altura em centímetros. Fica vazio enquanto ninguém mediu — é o que
   permite ao projeto dizer "sem medida" em vez de chutar um número. */
export function CampoMedida({
  largura,
  altura,
  rotuloLargura = 'LARGURA (CM)',
  rotuloAltura = 'ALTURA (CM)',
  aoMudar,
}: {
  largura: number | null
  altura: number | null
  rotuloLargura?: string
  rotuloAltura?: string
  aoMudar: (patch: { largura?: number | null; altura?: number | null }) => void
}) {
  const num = (v: string) => {
    const n = Number(v.replace(',', '.'))
    return v.trim() === '' || Number.isNaN(n) || n <= 0 ? null : n
  }

  return (
    <div className="grid2">
      <Campo label={rotuloLargura}>
        {(p) => (
          <input
            {...p}
            className="field"
            inputMode="decimal"
            value={largura ?? ''}
            onChange={(e) => aoMudar({ largura: num(e.target.value) })}
            placeholder="12"
          />
        )}
      </Campo>
      <Campo label={rotuloAltura}>
        {(p) => (
          <input
            {...p}
            className="field"
            inputMode="decimal"
            value={altura ?? ''}
            onChange={(e) => aoMudar({ altura: num(e.target.value) })}
            placeholder="12"
          />
        )}
      </Campo>
    </div>
  )
}
