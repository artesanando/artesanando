import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Popover, useGatilho } from './Popover'
import { PALETTE } from '../../lib/paleta'
import { dataLocal, fmtDataBarra } from '../../lib/format'
import { IconCheck, IconChevron, IconKebab } from './icons'

/* Substitutos dos controles nativos: o <select>, o <input type=date|time|color>
   e o window.confirm abrem janelas do sistema, que não seguem a estética do app
   e mudam de navegador para navegador. */

/* ---------- Select ---------- */

export function Select<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  style,
  disabled,
  /** acima disso o painel ganha um campo de busca */
  buscaAPartirDe = 8,
  placeholder = 'Escolher…',
}: {
  value: T
  onChange: (v: T) => void
  options: [T, string][]
  ariaLabel?: string
  style?: CSSProperties
  disabled?: boolean
  buscaAPartirDe?: number
  placeholder?: string
}) {
  const g = useGatilho()
  const [busca, setBusca] = useState('')

  const atual = options.find(([v]) => v === value)
  const comBusca = options.length >= buscaAPartirDe
  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return options
    return options.filter(([, label]) => label.toLowerCase().includes(q))
  }, [options, busca])

  const escolher = (v: T) => {
    onChange(v)
    setBusca('')
    g.fechar()
  }

  return (
    <>
      <button
        ref={g.ref}
        type="button"
        className="field campo-gatilho"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={g.aberto}
        disabled={disabled}
        onClick={g.alternar}
        style={style}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: atual ? 'var(--ink)' : 'var(--faint)',
          }}
        >
          {atual?.[1] ?? placeholder}
        </span>
        <span className="seta"><IconChevron /></span>
      </button>
      <Popover aberto={g.aberto} aoFechar={g.fechar} ancora={g.ref.current} ariaLabel={ariaLabel}>
        {comBusca && (
          <input
            className="field"
            placeholder="Buscar…"
            aria-label="Buscar na lista"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ marginBottom: 6, borderRadius: 8 }}
          />
        )}
        <div role="listbox" aria-label={ariaLabel}>
          {filtradas.map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={v === value}
              className="opcao"
              onClick={() => escolher(v)}
            >
              <span style={{ width: 12, flex: 'none' }}>{v === value && <IconCheck size={12} />}</span>
              {label}
            </button>
          ))}
          {filtradas.length === 0 && (
            <div style={{ padding: '10px 11px', fontSize: 12.5, color: 'var(--muted)' }}>
              Nada encontrado.
            </div>
          )}
        </div>
      </Popover>
    </>
  )
}

/* ---------- Calendário ---------- */

const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Dias da grade do mês, incluindo os vazios do começo da primeira semana */
export function diasDoMes(ano: number, mes: number): (string | null)[] {
  const primeiro = new Date(ano, mes, 1)
  const total = new Date(ano, mes + 1, 0).getDate()
  return [
    ...Array.from({ length: primeiro.getDay() }, () => null),
    ...Array.from({ length: total }, (_, i) => iso(new Date(ano, mes, i + 1))),
  ]
}

/** Marcador de um dia no calendário: a bolinha embaixo do número */
export interface MarcaDia {
  cor: string
  /** dia riscado — encontro cancelado continua visível, mas sem chamada */
  riscado?: boolean
}

export function Calendario({
  valor,
  onChange,
  /** dias que ganham marcador, por data ISO */
  marcas = {},
  /** ocupa a largura disponível em vez dos 250px do popover */
  fluido = false,
}: {
  valor: string
  onChange: (iso: string) => void
  marcas?: Record<string, MarcaDia>
  fluido?: boolean
}) {
  const base = valor ? dataLocal(valor) : new Date()
  const [ano, setAno] = useState(base.getFullYear())
  const [mes, setMes] = useState(base.getMonth())
  const hoje = iso(new Date())

  const mover = (delta: number) => {
    const d = new Date(ano, mes + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth())
  }

  return (
    <div style={{ width: fluido ? '100%' : 250, maxWidth: '100%', padding: 4 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <button type="button" className="kebab" aria-label="Mês anterior" onClick={() => mover(-1)}>
          <IconChevron size={12} para="esquerda" />
        </button>
        <b style={{ fontSize: 13 }}>
          {MESES[mes]} {ano}
        </b>
        <button type="button" className="kebab" aria-label="Próximo mês" onClick={() => mover(1)}>
          <IconChevron size={12} para="direita" />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {DIAS.map((d, i) => (
          <div
            key={i}
            className="lbl"
            style={{ textAlign: 'center', fontSize: 10, padding: '2px 0' }}
          >
            {d}
          </div>
        ))}
        {diasDoMes(ano, mes).map((dia, i) => {
          if (!dia) return <span key={`v${i}`} />
          const nun = Number(dia.slice(8))
          const ativo = dia === valor
          const marca = marcas[dia]
          return (
            <button
              key={dia}
              type="button"
              onClick={() => onChange(dia)}
              aria-label={`${nun} de ${MESES[mes]} de ${ano}`}
              aria-pressed={ativo}
              style={{
                position: 'relative',
                border: dia === hoje && !ativo ? '1px solid var(--field-border)' : 'none',
                background: ativo ? 'var(--primary)' : 'transparent',
                color: ativo ? '#fff' : 'var(--ink)',
                fontWeight: ativo ? 800 : 600,
                fontFamily: 'inherit',
                fontSize: 12.5,
                borderRadius: 8,
                padding: '7px 0',
                cursor: 'pointer',
                textDecoration: marca?.riscado ? 'line-through' : undefined,
                opacity: marca?.riscado ? 0.55 : 1,
                transition: 'background var(--dur-rapida) var(--ease-suave)',
              }}
            >
              {nun}
              {marca && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 3,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: ativo ? '#fff' : marca.cor,
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DatePicker({
  value,
  onChange,
  ariaLabel,
  disabled,
}: {
  value: string
  onChange: (iso: string) => void
  ariaLabel?: string
  disabled?: boolean
}) {
  const g = useGatilho()
  return (
    <>
      <button
        ref={g.ref}
        type="button"
        className="field campo-gatilho"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={g.aberto}
        disabled={disabled}
        onClick={g.alternar}
      >
        <span style={{ color: value ? 'var(--ink)' : 'var(--faint)' }}>
          {value ? fmtDataBarra(value) : 'dd/mm'}
        </span>
        <span className="seta"><IconChevron /></span>
      </button>
      <Popover
        aberto={g.aberto}
        aoFechar={g.fechar}
        ancora={g.ref.current}
        largura={262}
        ariaLabel={ariaLabel ?? 'Escolher data'}
      >
        <Calendario
          valor={value}
          onChange={(d) => {
            onChange(d)
            g.fechar()
          }}
        />
      </Popover>
    </>
  )
}

/* ---------- Hora ---------- */

export function TimePicker({
  value,
  onChange,
  ariaLabel,
  /** de meia em meia hora entre 7h e 22h cobre a rotina dos encontros */
  passoMinutos = 30,
}: {
  value: string
  onChange: (hora: string) => void
  ariaLabel?: string
  passoMinutos?: number
}) {
  const g = useGatilho()
  const horas = useMemo(() => {
    const out: string[] = []
    for (let m = 7 * 60; m <= 22 * 60; m += passoMinutos) {
      out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
    }
    return out
  }, [passoMinutos])

  return (
    <>
      <button
        ref={g.ref}
        type="button"
        className="field campo-gatilho"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={g.aberto}
        onClick={g.alternar}
      >
        <span style={{ color: value ? 'var(--ink)' : 'var(--faint)' }}>{value || '--:--'}</span>
        <span className="seta"><IconChevron /></span>
      </button>
      <Popover aberto={g.aberto} aoFechar={g.fechar} ancora={g.ref.current} ariaLabel={ariaLabel}>
        <div role="listbox" aria-label={ariaLabel}>
          {horas.map((h) => (
            <button
              key={h}
              type="button"
              role="option"
              aria-selected={h === value}
              className="opcao"
              onClick={() => {
                onChange(h)
                g.fechar()
              }}
            >
              <span style={{ width: 12, flex: 'none' }}>{h === value && <IconCheck size={12} />}</span>
              {h}
            </button>
          ))}
        </div>
      </Popover>
    </>
  )
}

/* ---------- Cor ---------- */

/* Um novelo do estoque oferecido como cor. Quem chama monta a lista — assim o
   ColorPicker segue sem saber que `features/estoque` existe. */
export interface FioDoEstoque {
  id: string
  nome: string
  detalhe: string | null
  cor_hex: string
  capa?: string | null
}

export function ColorPicker({
  value,
  onChange,
  ariaLabel = 'Cor',
  /** deixa escolher qualquer cor além da paleta de fios */
  livre = true,
  /** novelos do estoque, com foto — some quando a lista vem vazia */
  fios,
}: {
  value: string
  onChange: (hex: string) => void
  ariaLabel?: string
  livre?: boolean
  fios?: FioDoEstoque[]
}) {
  const g = useGatilho()
  const daPaleta = PALETTE.find(([c]) => c.toLowerCase() === value.toLowerCase())?.[1]
  // o fio escolhido nomeia a cor melhor do que o hex cru
  const fio = (fios ?? []).find((f) => f.cor_hex.toLowerCase() === value.toLowerCase())
  const nome = fio?.nome ?? daPaleta

  return (
    <>
      <button
        ref={g.ref}
        type="button"
        className="field campo-gatilho"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={g.aberto}
        onClick={g.alternar}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: value,
              border: '1px solid rgba(0,0,0,.12)',
              flex: 'none',
            }}
          />
          {nome ?? value}
        </span>
        <span className="seta"><IconChevron /></span>
      </button>
      <Popover
        aberto={g.aberto}
        aoFechar={g.fechar}
        ancora={g.ref.current}
        largura={224}
        ariaLabel={ariaLabel}
      >
        <div style={{ padding: 6 }}>
          <div className="lbl" style={{ marginBottom: 8 }}>
            PALETA DE FIOS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {PALETTE.map(([c, n]) => (
              <button
                key={c}
                type="button"
                title={n}
                aria-label={n}
                aria-pressed={c.toLowerCase() === value.toLowerCase()}
                onClick={() => {
                  onChange(c)
                  g.fechar()
                }}
                style={{
                  height: 34,
                  borderRadius: 8,
                  background: c,
                  border: '1px solid rgba(0,0,0,.12)',
                  cursor: 'pointer',
                  boxShadow:
                    c.toLowerCase() === value.toLowerCase() ? '0 0 0 2px var(--ink)' : undefined,
                  transition: 'transform var(--dur-rapida) var(--ease-mola)',
                }}
              />
            ))}
          </div>
          {(fios ?? []).length > 0 && (
            <>
              <div className="lbl" style={{ margin: '12px 0 6px' }}>
                FIOS DO ESTOQUE
              </div>
              <div style={{ maxHeight: 168, overflowY: 'auto' }}>
                {(fios ?? []).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={f.cor_hex.toLowerCase() === value.toLowerCase()}
                    onClick={() => {
                      onChange(f.cor_hex)
                      g.fechar()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      border: 'none',
                      background:
                        f.cor_hex.toLowerCase() === value.toLowerCase()
                          ? 'var(--chip-rose)'
                          : 'none',
                      borderRadius: 8,
                      padding: '5px 6px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <span className="miniatura-item" style={{ background: f.cor_hex }}>
                      {f.capa && <img src={f.capa} alt="" />}
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 12,
                          fontWeight: 700,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {f.nome}
                      </span>
                      {f.detalhe && (
                        <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{f.detalhe}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {livre && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                marginTop: 12,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                  width: 26,
                  height: 26,
                  border: 'none',
                  padding: 0,
                  background: 'none',
                  cursor: 'pointer',
                }}
              />
              Outra cor
            </label>
          )}
        </div>
      </Popover>
    </>
  )
}

/* ---------- Menu de ações ---------- */

export interface AcaoMenu {
  label: string
  onSelect: () => void
  perigo?: boolean
  desabilitado?: boolean
  dica?: string
}

export function MenuKebab({ acoes, ariaLabel = 'Ações' }: { acoes: AcaoMenu[]; ariaLabel?: string }) {
  const g = useGatilho()
  // sem permissão nenhuma a lista chega vazia — aí o botão não deve existir
  if (acoes.length === 0) return null
  return (
    <>
      <button
        ref={g.ref}
        type="button"
        className="kebab"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={g.aberto}
        onClick={(e) => {
          e.stopPropagation()
          g.alternar()
        }}
      >
        <IconKebab />
      </button>
      <Popover
        aberto={g.aberto}
        aoFechar={g.fechar}
        ancora={g.ref.current}
        largura={196}
        alinhamento="fim"
        ariaLabel={ariaLabel}
      >
        <div role="menu">
          {acoes.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              className={`opcao${a.perigo ? ' perigo' : ''}`}
              disabled={a.desabilitado}
              title={a.dica}
              onClick={(e) => {
                e.stopPropagation()
                g.fechar()
                a.onSelect()
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </Popover>
    </>
  )
}

/* ---------- Dica (tooltip) ---------- */

interface Caixa {
  top: number
  left: number
  right: number
  altura: number
}

const MARGEM = 10
const BORDA = 8

export function Dica({ texto, children }: { texto: string; children: ReactNode }) {
  const alvo = useRef<HTMLSpanElement>(null)
  const balao = useRef<HTMLSpanElement>(null)
  const [caixa, setCaixa] = useState<Caixa | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  /* O invólucro é `display: contents` para não entrar no layout de quem chama —
     e elemento assim não gera caixa nenhuma: `getBoundingClientRect()` devolve
     tudo zero, e a dica ia parar no canto de cima da janela. Quem tem caixa é o
     filho, que é o botão de verdade. */
  const mostrar = (ponteiro?: { clientX: number; clientY: number }) => {
    const el = alvo.current?.firstElementChild ?? alvo.current
    const r = el?.getBoundingClientRect()
    if (r && (r.width > 0 || r.height > 0)) {
      setCaixa({ top: r.top, left: r.left, right: r.right, altura: r.height })
    } else if (ponteiro) {
      setCaixa({
        top: ponteiro.clientY,
        left: ponteiro.clientX,
        right: ponteiro.clientX,
        altura: 0,
      })
    } else if (r) {
      setCaixa({ top: r.top, left: r.left, right: r.right, altura: r.height })
    }
  }

  const esconder = () => {
    setCaixa(null)
    setPos(null)
  }

  /* A posição depende do tamanho do balão, que só se sabe depois de desenhado —
     por isso ele nasce invisível e só ganha lugar aqui. */
  useLayoutEffect(() => {
    if (!caixa) return
    const b = balao.current?.getBoundingClientRect()
    const largura = b?.width ?? 0
    const altura = b?.height ?? 0
    const cabeADireita = caixa.right + MARGEM + largura <= window.innerWidth - BORDA
    const left = cabeADireita
      ? caixa.right + MARGEM
      : Math.max(BORDA, caixa.left - MARGEM - largura)
    const teto = Math.max(BORDA, window.innerHeight - altura - BORDA)
    const top = Math.min(Math.max(BORDA, caixa.top + caixa.altura / 2 - altura / 2), teto)
    setPos({ top, left })
  }, [caixa])

  return (
    <>
      <span
        ref={alvo}
        onPointerEnter={(e) => mostrar(e)}
        onPointerLeave={esconder}
        onFocus={() => mostrar()}
        onBlur={esconder}
        style={{ display: 'contents' }}
      >
        {children}
      </span>
      {caixa &&
        createPortal(
          <span
            ref={balao}
            role="tooltip"
            className="dica"
            style={{
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              visibility: pos ? 'visible' : 'hidden',
            }}
          >
            {texto}
          </span>,
          document.body,
        )}
    </>
  )
}
