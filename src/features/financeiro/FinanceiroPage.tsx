import { useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { useAuth } from '../../state/auth'
import { Lbl } from '../../components/ui/bits'
import { DatePicker, MenuKebab } from '../../components/ui/controles'
import { useAcoesArquivo } from '../../components/ui/useAcoesItem'
import { separaArquivados } from '../../lib/arquivo'
import { useSemestreAtivo } from '../../lib/semestre'
import { fmtCentavos, fmtDataCurta, hojeIso } from '../../lib/format'
import { IconSetaLonga } from '../../components/ui/icons'
import { CabecalhoPagina } from '../../components/layout/CabecalhoPagina'
import { useOrdenacao } from '../../components/ui/useOrdenacao'
import { ColunaOrdenavel } from '../../components/ui/CabecalhoOrdenavel'
import {
  fetchMovimentacoes,
  filtraPeriodo,
  limitesDoMes,
  saldo,
  totalDoTipo,
  type Movimentacao,
} from './api'

type Atalho = 'mes' | 'semestre' | 'tudo' | 'livre'

const chip = (on: boolean): CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 99,
  fontSize: 12,
  fontWeight: on ? 800 : 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
  border: on ? '1px solid var(--primary)' : '1px solid var(--field-border)',
  background: on ? 'var(--primary)' : 'transparent',
  color: on ? '#fff' : 'var(--ink-soft)',
  transition: 'background var(--dur-rapida) var(--ease-suave)',
})

export function FinanceiroPage() {
  const { openFin } = useStore()
  const { can } = useAuth()
  const semestre = useSemestreAtivo()
  const ord = useOrdenacao<'data' | 'descricao' | 'categoria' | 'valor'>('data', 'desc')
  const acoesArquivo = useAcoesArquivo()

  const {
    data: movs,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['movimentacoes'], queryFn: fetchMovimentacoes })

  const hoje = hojeIso()
  const mes = limitesDoMes(hoje)
  // o caixa é por semestre — é assim que a própria tela se apresenta
  const [atalho, setAtalho] = useState<Atalho>('semestre')
  const [livre, setLivre] = useState({ de: mes.de, ate: mes.ate })
  const [verArquivadas, setVerArquivadas] = useState(false)

  /* período derivado do atalho, não copiado para o estado: assim ele acompanha
     o semestre quando a query dele chega depois da primeira renderização */
  const SEMPRE = { de: '0000-01-01', ate: '9999-12-31' }
  const periodo =
    atalho === 'mes'
      ? mes
      : atalho === 'semestre'
        ? { de: semestre?.inicio ?? SEMPRE.de, ate: semestre?.fim ?? SEMPRE.ate }
        : atalho === 'tudo'
          ? SEMPRE
          : livre

  const { ativos, arquivados } = separaArquivados(movs ?? [])
  const base = verArquivadas ? arquivados : ativos
  const doPeriodo = filtraPeriodo(base, periodo.de, periodo.ate)

  /* Saída é valor negativo na conta, mas na tabela quem ordena por valor quer o
     tamanho do lançamento — não o sinal dele. */
  const ordenados = ord.ordenar(doPeriodo, (m, k) =>
    k === 'valor' ? m.valor_centavos : k === 'data' ? m.data : (m[k] ?? ''),
  )

  // o saldo é sempre do caixa inteiro; entradas e saídas seguem o filtro
  const kpiSaldo = saldo(ativos)
  const entradas = totalDoTipo(doPeriodo, 'entrada')
  const saidas = totalDoTipo(doPeriodo, 'saida')

  const linha = (m: Movimentacao, ultima: boolean) => {
    const entrada = m.tipo === 'entrada'
    return (
      <div
        key={m.id}
        className="linha-fin"
        style={{ borderBottom: ultima ? undefined : '1px solid var(--divider)' }}
      >
        <div style={{ color: 'var(--muted)', fontWeight: 700 }}>{fmtDataCurta(m.data)}</div>
        <div style={{ fontWeight: 700 }}>{m.descricao}</div>
        <div>
          <span
            className="tag"
            style={{
              background: entrada ? 'var(--chip-green)' : 'var(--chip-rose)',
              color: entrada ? 'var(--green-dark)' : 'var(--accent)',
            }}
          >
            {m.categoria}
          </span>
        </div>
        <div
          style={{
            textAlign: 'right',
            fontWeight: 800,
            color: entrada ? 'var(--green-dark)' : 'var(--accent)',
          }}
        >
          {entrada ? '+' : '−'} {fmtCentavos(m.valor_centavos).replace('R$ ', '')}
        </div>
        <div style={{ textAlign: 'right' }}>
          {can('financeiro') && (
            <MenuKebab
              ariaLabel={`Ações de ${m.descricao}`}
              acoes={acoesArquivo({
                tabela: 'movimentacoes',
                id: m.id,
                nome: `a movimentação "${m.descricao}"`,
                motivoHistorico: 'O caixa',
                arquivado: Boolean(m.arquivado_em),
                invalidar: ['movimentacoes'],
              })}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="pagina">
      <CabecalhoPagina
        titulo="Financeiro"
        sub={`Caixa do projeto · semestre ${semestre?.label ?? '—'}`}
        acoes={
          can('financeiro') && (
            <>
              <button className="pill ghost" onClick={() => openFin('saida')}>
                <IconSetaLonga size={12} para="baixo" /> Saída
              </button>
              <button className="pill" onClick={() => openFin('entrada')}>
                <IconSetaLonga size={12} para="cima" /> Entrada
              </button>
            </>
          )
        }
      />

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <span className="lbl">PERÍODO</span>
        <button style={chip(atalho === 'mes')} onClick={() => setAtalho('mes')}>
          Este mês
        </button>
        <button style={chip(atalho === 'semestre')} onClick={() => setAtalho('semestre')}>
          {semestre?.label ?? 'Semestre'}
        </button>
        <button style={chip(atalho === 'tudo')} onClick={() => setAtalho('tudo')}>
          Tudo
        </button>
        <button style={chip(atalho === 'livre')} onClick={() => setAtalho('livre')}>
          Intervalo
        </button>
        {atalho === 'livre' && (
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 130 }}>
              <DatePicker
                value={livre.de}
                onChange={(de) => setLivre((p) => ({ ...p, de }))}
                ariaLabel="Data inicial"
              />
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>até</span>
            <span style={{ width: 130 }}>
              <DatePicker
                value={livre.ate}
                onChange={(ate) => setLivre((p) => ({ ...p, ate }))}
                ariaLabel="Data final"
              />
            </span>
          </span>
        )}
      </div>

      <div
        className="pgrid"
        style={{ '--cols': '1.4fr 1fr 1fr', '--gap': '14px', marginBottom: 28 } as CSSProperties}
      >
        <div
          style={{
            border: '1px solid var(--chip-rose-border)',
            borderRadius: 16,
            background: 'var(--chip-rose)',
            padding: '20px 22px',
          }}
        >
          <Lbl style={{ color: 'var(--accent)' }}>SALDO ATUAL</Lbl>
          <div className="h" style={{ fontSize: 34, color: 'var(--primary-dark)', marginTop: 4 }}>
            {fmtCentavos(kpiSaldo)}
          </div>
        </div>
        <div className="card" style={{ borderRadius: 16, padding: '20px 22px' }}>
          <Lbl>ENTRADAS · PERÍODO</Lbl>
          <div className="h" style={{ fontSize: 26, color: 'var(--green-dark)', marginTop: 6 }}>
            + {fmtCentavos(entradas)}
          </div>
        </div>
        <div className="card" style={{ borderRadius: 16, padding: '20px 22px' }}>
          <Lbl>SAÍDAS · PERÍODO</Lbl>
          <div className="h" style={{ fontSize: 26, color: 'var(--accent)', marginTop: 6 }}>
            − {fmtCentavos(saidas)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 12,
        }}
      >
        <div className="h" style={{ fontSize: 16 }}>
          Movimentações
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>
            {doPeriodo.length}
          </span>
        </div>
        {arquivados.length > 0 && (
          <button
            className="crumb"
            style={{ border: 'none', background: 'none', fontFamily: 'inherit' }}
            onClick={() => setVerArquivadas((v) => !v)}
          >
            {verArquivadas ? 'Voltar às ativas' : `Arquivadas (${arquivados.length})`}
          </button>
        )}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="lbl linha-fin cabecalho" role="row">
          {(
            [
              ['data', 'DATA', 'desc'],
              ['descricao', 'DESCRIÇÃO', 'asc'],
              ['categoria', 'CATEGORIA', 'asc'],
              ['valor', 'VALOR', 'desc'],
            ] as const
          ).map(([k, rotulo, natural]) => (
            <div key={k} style={k === 'valor' ? { textAlign: 'right' } : undefined}>
              <ColunaOrdenavel
                rotulo={rotulo}
                ativa={ord.coluna === k}
                direcao={ord.direcao}
                aoClicar={() => ord.alternar(k, natural)}
              />
            </div>
          ))}
          <div />
        </div>
        {isLoading && (
          <div style={{ padding: '14px 20px', fontSize: 13, color: 'var(--muted)' }}>
            Carregando…
          </div>
        )}
        {isError && (
          <div style={{ padding: '14px 20px', fontSize: 13, color: 'var(--accent)' }}>
            Não foi possível carregar o caixa. Recarregue a página.
          </div>
        )}
        {doPeriodo.length === 0 && !isLoading && !isError && (
          <div style={{ padding: '14px 20px', fontSize: 13, color: 'var(--muted)' }}>
            Nenhuma movimentação neste período.
          </div>
        )}
        {ordenados.map((m, i) => linha(m, i === ordenados.length - 1))}
      </div>
    </div>
  )
}
