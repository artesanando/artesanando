import { useRef, useState, type CSSProperties } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { Lbl } from '../components/ui/bits'
import { ColorPicker } from '../components/ui/controles'
import { CampoMedida } from '../components/ui/CampoMedida'
import { useGradeInterativa, type ModoGrade } from '../components/ui/useGradeInterativa'
import { useZoomGrade } from '../components/ui/ZoomGrade'
import { gradePadrao, redimensionaCelulas } from '../lib/grade'
import { MODELS } from '../lib/paleta'
import { ModalBox, ModalHeader } from './shared'
import { SeletorCategoria } from './SeletorCategoria'
import { criarReceita } from '../features/biblioteca/api'
import { fmtMedida, tamanhoManta } from '../lib/medida'
import type { ModeloNovo } from '../features/projetos/api'

const LETRAS = 'ABCDEFGH'.split('')
const MIN = 2
const MAX = 20

const MODELOS_INICIAIS: ModeloNovo[] = (['A', 'B', 'C'] as const).map((k) => ({
  letra: k,
  nome: `Modelo ${k}`,
  cor_borda: MODELS[k].border,
  cor_miolo: MODELS[k].inner,
}))

const MODOS: [ModoGrade, string, string][] = [
  ['pintar', 'Pintar', 'escolha um modelo e arraste pela grade'],
  ['mover', 'Mover', 'arraste um square sobre outro para trocarem de lugar'],
]

const seg = (on: boolean): CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 99,
  fontSize: 12,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
  border: on ? '1px solid var(--primary)' : '1px solid var(--field-border)',
  background: on ? 'var(--primary)' : 'transparent',
  color: on ? '#fff' : 'var(--ink-soft)',
  fontWeight: on ? 800 : 700,
})

/* Editor do esquema de manta: quais modelos de granny entram e como ficam
   dispostos. Antes eram três modelos de cor fixa e um clique pintava uma célula
   por vez — dava para desenhar quase nada. Agora os modelos são livres, o
   pincel corre arrastando, dois squares trocam de lugar e a grade cresce
   puxando a borda. */
export function ModalLayout() {
  const { backToProjeto } = useStore()
  const { profile } = useAuth()
  const qc = useQueryClient()

  const [nome, setNome] = useState('')
  const [modelos, setModelos] = useState<ModeloNovo[]>(MODELOS_INICIAIS)
  const [colunas, setColunas] = useState(8)
  const [linhas, setLinhas] = useState(6)
  const [celulas, setCelulas] = useState<string[][]>(() =>
    gradePadrao(8, 6, MODELOS_INICIAIS.map((m) => m.letra)),
  )
  const [modo, setModo] = useState<ModoGrade>('pintar')
  const zoom = useZoomGrade(26)
  const [pincel, setPincel] = useState('A')
  const [medida, setMedida] = useState<{ largura: number | null; altura: number | null }>({
    largura: null,
    altura: null,
  })
  const [erro, setErro] = useState<string | null>(null)

  const daManta = tamanhoManta('manta_croche', colunas, linhas, medida)

  const letras = modelos.map((m) => m.letra)
  const porLetra = new Map(modelos.map((m) => [m.letra, m]))
  const letraEm = (pos: number) => celulas[Math.floor(pos / colunas)]?.[pos % colunas]

  const escrever = (mapear: (letra: string, pos: number) => string) =>
    setCelulas((atual) =>
      atual.map((linha, l) => linha.map((letra, c) => mapear(letra, l * colunas + c))),
    )

  const { arrastado, alvo, aoClicar, propsGrade } = useGradeInterativa({
    colunas,
    modo,
    ativo: true,
    aoPintar: (posicoes) => {
      const alvos = new Set(posicoes)
      escrever((letra, pos) => (alvos.has(pos) ? pincel : letra))
    },
    aoTrocar: (de, para) => {
      const a = letraEm(de)
      const b = letraEm(para)
      if (!a || !b) return
      escrever((letra, pos) => (pos === de ? b : pos === para ? a : letra))
    },
  })

  /* Redimensionar puxando a borda: a alça vira colunas/linhas pela distância
     percorrida, e o que já estava desenhado se preserva no que couber. */
  const arrastoTamanho = useRef<{ x: number; y: number; cols: number; rows: number } | null>(null)

  const redimensionar = (cols: number, rows: number) => {
    const c = Math.max(MIN, Math.min(MAX, cols))
    const l = Math.max(MIN, Math.min(MAX, rows))
    if (c === colunas && l === linhas) return
    setCelulas((atual) => redimensionaCelulas(atual, c, l, letras))
    setColunas(c)
    setLinhas(l)
  }

  const alca = (eixo: 'x' | 'y' | 'xy') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      arrastoTamanho.current = { x: e.clientX, y: e.clientY, cols: colunas, rows: linhas }
    },
    onPointerMove: (e: React.PointerEvent) => {
      const ini = arrastoTamanho.current
      if (!ini) return
      const dc = eixo === 'y' ? 0 : Math.round((e.clientX - ini.x) / (zoom.celula + 3))
      const dl = eixo === 'x' ? 0 : Math.round((e.clientY - ini.y) / (zoom.celula + 3))
      redimensionar(ini.cols + dc, ini.rows + dl)
    },
    onPointerUp: () => {
      arrastoTamanho.current = null
    },
    onPointerCancel: () => {
      arrastoTamanho.current = null
    },
  })

  const mudarModelo = (i: number, patch: Partial<ModeloNovo>) =>
    setModelos((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)))

  const adicionarModelo = () => {
    const letra = LETRAS[modelos.length]
    setModelos((ms) => [
      ...ms,
      { letra, nome: `Modelo ${letra}`, cor_borda: '#B99BC4', cor_miolo: '#E3C07A' },
    ])
  }

  const removerModelo = (i: number) => {
    const fora = modelos[i].letra
    const restantes = modelos.filter((_, j) => j !== i)
    setModelos(restantes)
    if (pincel === fora) setPincel(restantes[0].letra)
    // as células do modelo que saiu voltam para o padrão diagonal
    const padrao = gradePadrao(colunas, linhas, restantes.map((m) => m.letra))
    setCelulas((atual) =>
      atual.map((linha, l) => linha.map((letra, c) => (letra === fora ? padrao[l][c] : letra))),
    )
  }

  const contagem = new Map<string, number>()
  for (const linha of celulas) for (const letra of linha) {
    contagem.set(letra, (contagem.get(letra) ?? 0) + 1)
  }

  const salvar = useMutation({
    mutationFn: () =>
      criarReceita({
        nome: nome.trim() || 'Esquema sem nome',
        categoria: 'manta',
        sub: `esquema · ${colunas}×${linhas} squares`,
        resumo: null,
        specs: [
          ['Colunas', String(colunas)],
          ['Linhas', String(linhas)],
          ['Total', String(colunas * linhas)],
          ...(daManta ? ([['Manta', fmtMedida(daManta)]] as [string, string][]) : []),
        ],
        largura_cm: medida.largura,
        altura_cm: medida.altura,
        conteudo: {
          cells: celulas,
          modelos: Object.fromEntries(
            modelos.map((m) => [m.letra, { border: m.cor_borda, inner: m.cor_miolo, nome: m.nome }]),
          ),
        },
        origem: 'criador',
        criado_por: profile!.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receitas'] })
      backToProjeto()
    },
    onError: () => setErro('Não foi possível salvar o esquema.'),
  })

  return (
    <ModalBox maxWidth={680}>
      <ModalHeader title="Adicionar à biblioteca" />
      <SeletorCategoria atual="manta" />

      <Lbl style={{ marginBottom: 7 }}>NOME</Lbl>
      <input
        className="field"
        style={{ marginBottom: 18 }}
        value={nome}
        aria-label="Nome do esquema"
        onChange={(e) => setNome(e.target.value)}
        placeholder="Manta Ada"
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        {MODOS.map(([m, label]) => (
          <button key={m} type="button" onClick={() => setModo(m)} style={seg(modo === m)}>
            {label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto' }}>{zoom.controles}</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 14 }}>
        {MODOS.find(([m]) => m === modo)?.[2]}
      </div>

      {modo === 'pintar' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <span className="lbl" style={{ alignSelf: 'center' }}>
            PINCEL
          </span>
          {modelos.map((m) => (
            <button
              key={m.letra}
              type="button"
              onClick={() => setPincel(m.letra)}
              aria-pressed={pincel === m.letra}
              aria-label={`Pincel do modelo ${m.letra}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                border: '1px solid var(--field-border)',
                borderRadius: 99,
                padding: '5px 12px 5px 6px',
                cursor: 'pointer',
                background: 'transparent',
                fontFamily: 'inherit',
                boxShadow: m.letra === pincel ? '0 0 0 2px var(--ink)' : undefined,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  background: m.cor_borda,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                  borderRadius: 3,
                }}
              >
                <span style={{ width: 11, height: 11, background: m.cor_miolo }} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{m.letra}</span>
            </button>
          ))}
        </div>
      )}

      <div
        className="pgrid"
        style={{ '--cols': 'auto 1fr', '--gap': '22px', marginBottom: 18 } as CSSProperties}
      >
        <div className="rolagem-grade">
          <div style={{ display: 'inline-block', position: 'relative', paddingRight: 14, paddingBottom: 14 }}>
            <div
              {...propsGrade}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${colunas}, ${zoom.celula}px)`,
                gap: 1,
                background: 'var(--sand)',
                padding: 5,
                borderRadius: 8,
                touchAction: 'none',
                width: 'max-content',
              }}
            >
              {Array.from({ length: colunas * linhas }, (_, pos) => {
                const letra = letraEm(pos) ?? letras[0]
                const m = porLetra.get(letra)
                return (
                  <button
                    key={pos}
                    data-pos={pos}
                    type="button"
                    aria-label={`Linha ${Math.floor(pos / colunas) + 1}, coluna ${(pos % colunas) + 1} · modelo ${letra}`}
                    aria-pressed={arrastado === pos}
                    onClick={() => aoClicar(pos)}
                    style={{
                      width: zoom.celula,
                      height: zoom.celula,
                      padding: 0,
                      border: 'none',
                      borderRadius: 2,
                      background: m?.cor_borda ?? '#ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: modo === 'mover' ? 'grab' : 'pointer',
                      opacity: arrastado === pos ? 0.35 : 1,
                      outline: alvo === pos ? '2px dashed var(--ink)' : 'none',
                      outlineOffset: -2,
                      transform: alvo === pos ? 'scale(1.14)' : 'scale(1)',
                      zIndex: alvo === pos ? 1 : 0,
                      transition: 'transform var(--dur-media) var(--ease-mola)',
                    }}
                  >
                    <span
                      style={{
                        width: Math.round(zoom.celula * 0.46),
                        height: Math.round(zoom.celula * 0.46),
                        background: m?.cor_miolo ?? '#eee',
                      }}
                    />
                  </button>
                )
              })}
            </div>

            {/* alças de redimensionar: direita muda colunas, baixo muda linhas,
                o canto muda os dois. O botão é o caminho de teclado. */}
            <button
              type="button"
              className="alca-grade alca-x"
              aria-label={`Largura da grade: ${colunas} colunas`}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') redimensionar(colunas + 1, linhas)
                if (e.key === 'ArrowLeft') redimensionar(colunas - 1, linhas)
              }}
              {...alca('x')}
            />
            <button
              type="button"
              className="alca-grade alca-y"
              aria-label={`Altura da grade: ${linhas} linhas`}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') redimensionar(colunas, linhas + 1)
                if (e.key === 'ArrowUp') redimensionar(colunas, linhas - 1)
              }}
              {...alca('y')}
            />
            <button
              type="button"
              className="alca-grade alca-xy"
              aria-label={`Tamanho da grade: ${colunas} por ${linhas}`}
              {...alca('xy')}
            />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>
            {colunas} × {linhas} · {colunas * linhas} squares
            {daManta && (
              <>
                {' · '}
                <b style={{ color: 'var(--accent)' }}>{fmtMedida(daManta)}</b>
              </>
            )}
          </div>
        </div>

        <div style={{ minWidth: 200 }}>
          <Lbl style={{ marginBottom: 8 }}>MODELOS</Lbl>
          {modelos.map((m, i) => (
            <div
              key={m.letra}
              style={{
                border: '1px solid var(--field-border)',
                borderRadius: 12,
                padding: '9px 11px',
                marginBottom: 8,
                background: 'var(--card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <b style={{ flex: 'none' }}>{m.letra}</b>
                <input
                  className="field"
                  style={{ flex: 1, minWidth: 0, padding: '6px 10px', fontSize: 12.5 }}
                  value={m.nome}
                  aria-label={`Nome do modelo ${m.letra}`}
                  onChange={(e) => mudarModelo(i, { nome: e.target.value })}
                />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--accent)' }}>
                  {contagem.get(m.letra) ?? 0}
                </span>
                {modelos.length > 1 && (
                  <button
                    type="button"
                    className="kebab"
                    aria-label={`Remover modelo ${m.letra}`}
                    onClick={() => removerModelo(i)}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <ColorPicker
                    value={m.cor_borda}
                    ariaLabel={`Cor da borda do modelo ${m.letra}`}
                    onChange={(cor_borda) => mudarModelo(i, { cor_borda })}
                  />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <ColorPicker
                    value={m.cor_miolo}
                    ariaLabel={`Cor do miolo do modelo ${m.letra}`}
                    onChange={(cor_miolo) => mudarModelo(i, { cor_miolo })}
                  />
                </span>
              </div>
            </div>
          ))}
          {modelos.length < LETRAS.length && (
            <button
              type="button"
              className="pill ghost"
              style={{ padding: '6px 14px', fontSize: 12 }}
              onClick={adicionarModelo}
            >
              + Modelo
            </button>
          )}

          {/* a medida do square dá o tamanho da manta inteira */}
          <div style={{ marginTop: 16 }}>
            <CampoMedida
              largura={medida.largura}
              altura={medida.altura}
              rotuloLargura="LARGURA DO SQUARE (CM)"
              rotuloAltura="ALTURA DO SQUARE (CM)"
              aoMudar={(patch) => setMedida((m) => ({ ...m, ...patch }))}
            />
          </div>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          style={{
            background: 'var(--chip-soft)',
            border: '1px solid var(--chip-rose-border)',
            borderRadius: 10,
            padding: '9px 13px',
            fontSize: 12.5,
            color: 'var(--primary-dark)',
            marginBottom: 14,
          }}
        >
          {erro}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="pill ghost" onClick={backToProjeto}>
          Voltar
        </button>
        <button
          type="button"
          className="pill"
          disabled={salvar.isPending}
          onClick={() => salvar.mutate()}
        >
          {salvar.isPending ? 'Salvando…' : 'Salvar esquema'}
        </button>
      </div>
    </ModalBox>
  )
}
