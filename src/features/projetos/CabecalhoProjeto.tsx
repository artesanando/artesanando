import { MenuKebab } from '../../components/ui/controles'
import { Progress } from '../../components/ui/bits'
import { useAcoesProjeto } from './useAcoesProjeto'
import type { Projeto } from './api'

/* As ações de projeto viviam só no cartão da lista, apesar de o comentário de
   `useAcoesProjeto` prometer as duas pontas: quem abria um projeto não tinha
   como editar a ficha, marcar como entregue nem arquivar sem voltar. */
export function AcoesProjeto({ projeto }: { projeto: Projeto }) {
  const acoes = useAcoesProjeto()
  return <MenuKebab ariaLabel={`Ações de ${projeto.nome}`} acoes={acoes(projeto)} />
}

/* Projeto arquivado abria idêntico a um ativo, editável e sem nenhum aviso. */
export function AvisoArquivado({ projeto }: { projeto: Projeto }) {
  if (!projeto.arquivado_em) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--chip-warn)',
        border: '1px solid #E7D6B8',
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 18,
        fontSize: 12.5,
        color: 'var(--gold-dark)',
      }}
    >
      <b>Projeto arquivado.</b> Fora das contas do semestre, mas ainda editável.
    </div>
  )
}

/* Progresso escrito do mesmo jeito nos quatro lugares que o mostravam de
   quatro maneiras: "9/30", "8 und · meta 20", "8/20 UND" e "5/12 faixas". */
export function ProgressoProjeto({
  done,
  total,
  unidade,
}: {
  done: number
  total: number
  unidade: string
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
      <Progress
        pct={`${pct}%`}
        style={{ flex: 1, height: 8 }}
        fillStyle={pct >= 100 ? { background: 'var(--green)' } : undefined}
      />
      <div className="h" style={{ fontSize: 19, color: 'var(--accent)', flex: 'none' }}>
        {done}
        <span style={{ color: 'var(--faint)', fontSize: 14 }}>
          /{total} {unidade}
        </span>
      </div>
    </div>
  )
}
