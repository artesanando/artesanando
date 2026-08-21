import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { hojeIso } from '../../lib/format'
import { useSemestreAtivo } from '../../lib/semestre'
import { NIVEL_LABEL } from '../../types/database'
import { entregasDe, fetchEntregasLight } from '../integrantes/api'
import { fetchEncontros, fetchPresencas, frequenciaDe } from '../presenca/api'
import { avaliaRegra, textoDaLinha } from '../extensao/creditos'
import { fetchMarcas, fetchRegras } from '../extensao/creditosApi'

/* O que falta para ela fechar o semestre. A regra é de leitura geral — não é
   segredo —, mas a marca e o progresso das outras não aparecem aqui: a policy
   de `credito_marcas` só devolve a linha da própria dona. */
export function MinhaMeta() {
  const { profile } = useAuth()
  const semestre = useSemestreAtivo()
  const hoje = hojeIso()

  const { data: regras } = useQuery({
    queryKey: ['regras-credito', semestre?.id ?? null],
    queryFn: () => fetchRegras(semestre!.id),
    enabled: Boolean(semestre?.id),
  })
  const { data: marcas } = useQuery({
    queryKey: ['credito-marcas', semestre?.id ?? null],
    queryFn: () => fetchMarcas(semestre!.id),
    enabled: Boolean(semestre?.id),
  })
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: entregas } = useQuery({ queryKey: ['entregas-light'], queryFn: fetchEntregasLight })

  if (!profile || !semestre) return null

  const blocos = regras?.[profile.nivel] ?? []
  if (blocos.length === 0) return null

  const doSemestre = (encontros ?? []).filter((e) => e.semestre_id === semestre.id)
  const freq = frequenciaDe(profile.id, doSemestre, presencas ?? [], hoje, profile.turno)
  const minhas = entregas
    ? entregasDe(profile.id, entregas, semestre.id)
    : { amigurumis: 0, faixas: 0, grannies: 0, total: 0 }

  const av = avaliaRegra(blocos, minhas, freq.total.pct, marcas?.get(profile.id) ?? null)

  return (
    <>
      <div className="h" style={{ fontSize: 16, marginBottom: 10 }}>
        Minha meta do semestre
      </div>
      <div className="card" style={{ padding: '14px 16px', marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {semestre.label} · {NIVEL_LABEL[profile.nivel].toLowerCase()}
          </span>
          <span
            className="tag"
            style={
              av.cumpriu
                ? { background: 'var(--chip-green)', color: 'var(--green-dark)' }
                : { background: 'var(--chip-warn)', color: 'var(--gold-dark)' }
            }
          >
            {av.cumpriu ? 'CUMPRIDA' : 'EM ANDAMENTO'}
          </span>
        </div>
        {av.blocos.map((b, i) => (
          <div
            key={b.id}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              fontSize: 12.5,
              padding: '7px 0',
              borderTop: i > 0 ? '1px solid var(--border)' : undefined,
              color: b.cumpriu ? 'var(--green-dark)' : 'var(--ink-soft)',
            }}
          >
            <span style={{ flex: 'none', fontWeight: 800 }}>{b.cumpriu ? '✓' : '·'}</span>
            <span>{b.linhas.map(textoDaLinha).join('  ou  ')}</span>
          </div>
        ))}
      </div>
    </>
  )
}
