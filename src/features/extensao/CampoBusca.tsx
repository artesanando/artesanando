import { IconBusca } from '../../components/ui/icons'

/* Busca por nome, uma por seção — as tabelas de Créditos, Frequência e Entregas
   têm a lista inteira do semestre e ficam longas. */
export function CampoBusca({
  valor,
  aoMudar,
  rotulo = 'Buscar integrante',
}: {
  valor: string
  aoMudar: (v: string) => void
  rotulo?: string
}) {
  return (
    <div
      className="field"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 99,
        marginBottom: 12,
        maxWidth: 320,
      }}
    >
      <IconBusca size={13} />
      <input
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={rotulo}
        aria-label={rotulo}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          background: 'none',
          font: 'inherit',
          color: 'inherit',
          padding: 0,
          outline: 'none',
        }}
      />
    </div>
  )
}

/** Filtra qualquer lista que tenha `nome` */
export const filtraLinhas = <T extends { nome: string }>(linhas: T[], busca: string): T[] => {
  const q = busca.trim().toLowerCase()
  return q ? linhas.filter((l) => l.nome.toLowerCase().includes(q)) : linhas
}
