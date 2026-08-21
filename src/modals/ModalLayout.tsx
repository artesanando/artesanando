import { useRef, useState, type CSSProperties } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { Lbl, Stepper } from '../components/ui/bits'
import { ColorPicker, Select } from '../components/ui/controles'
import { CampoMedida } from '../components/ui/CampoMedida'
import { PreviaFaixas } from '../components/ui/PreviaFaixas'
import { reordena, useReordenar } from '../components/ui/useReordenar'
import { useGradeInterativa, type ModoGrade } from '../components/ui/useGradeInterativa'
import { useZoomGrade } from '../components/ui/ZoomGrade'
import { faixasDaManta, gradePadrao, redimensionaCelulas } from '../lib/grade'
import { MODELS, PALETTE } from '../lib/paleta'
import { coresDoGranny, seqDaFaixa } from '../lib/padrao'
import { ModalBox, ModalHeader } from './shared'
import { SeletorCategoria } from './SeletorCategoria'
import { criarReceita, fetchReceitas } from '../features/biblioteca/api'
import { fmtMedida, tamanhoManta } from '../lib/medida'
import type { Tecnica } from '../types/database'
import type { ModeloNovo } from '../features/projetos/api'
import { IconArrastar, IconChevron, IconX } from '../components/ui/icons'
import { SquareGranny } from '../components/ui/SquareGranny'
import { useConfirmar } from '../components/ui/Confirm'
import { useFios } from '../features/estoque/useFios'

const LETRAS = 'ABCDEFGH'.split('')
const MIN = 2
const MAX = 20
const MIN_FAIXAS = 2
const MAX_FAIXAS = 60

const MODELOS_INICIAIS: ModeloNovo[] = (['A', 'B', 'C'] as const).map((k) => ({
  letra: k,
  nome: `Modelo ${k}`,
  cor_borda: MODELS[k].border,
  cor_miolo: MODELS[k].inner,
}))

const SEQ_INICIAL = PALETTE.slice(0, 3).map(([c]) => c)

const arrastarStyle: CSSProperties = {
  border: 'none',
  background: 'none',
  padding: 0,
  cursor: 'grab',
  color: 'var(--faint)',
  touchAction: 'none',
  display: 'flex',
}

const limitarFaixas = (n: number) => Math.max(MIN_FAIXAS, Math.min(MAX_FAIXAS, n))

/** Carreiras do modelo, com as duas cores antigas como fallback */
const carreiras = (m: ModeloNovo): string[] =>
  m.cores && m.cores.length > 0 ? m.cores : [m.cor_miolo, m.cor_borda]

const TECNICAS: [Tecnica, string][] = [
  ['croche', 'Crochê'],
  ['trico', 'Tricô'],
]

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

/* Editor do esquema de manta, nas duas técnicas.
   Crochê é a grade de squares: modelos livres, pincel que corre arrastando,
   squares que trocam de lugar e grade que cresce puxando a borda.
   Tricô é uma faixa modelo mais quantas faixas — as demais nascem com as cores
   deslocadas uma posição, que é o que faz a diagonal na manta pronta.
   Nos dois casos dá para puxar um padrão já salvo na biblioteca. */
export function ModalLayout() {
  const { backToProjeto } = useStore()
  const confirmar = useConfirmar()
  const { profile } = useAuth()
  const fios = useFios()
  const qc = useQueryClient()

  const [nome, setNome] = useState('')
  /* A técnica é escolhida ANTES de o editor abrir: crochê e tricô desenham
     coisas diferentes, e ver a grade de squares montada antes de dizer qual das
     duas é a manta confundia mais do que ajudava. */
  const [tecnica, setTecnica] = useState<Tecnica | null>(null)
  const [modelos, setModelos] = useState<ModeloNovo[]>(MODELOS_INICIAIS)
  const [seq, setSeq] = useState<string[]>(SEQ_INICIAL)
  const [faixas, setFaixas] = useState(8)
  /* Manta de tricô editada faixa a faixa. `null` é a manta seguindo a faixa
     modelo — o deslocamento automático. Assim que alguém mexe numa faixa
     sozinha, a manta materializa e cada faixa passa a valer por si. */
  const [faixasLivres, setFaixasLivres] = useState<string[][] | null>(null)
  const [faixaSel, setFaixaSel] = useState(0)
  /* De qual padrão de faixa da biblioteca vieram as cores, para mostrar o
     vínculo como o crochê já mostra no granny. */
  const [faixaReceitaId, setFaixaReceitaId] = useState('')
  const [faixaAjustada, setFaixaAjustada] = useState(false)
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

  /* Trocar de técnica joga fora o que foi desenhado — a grade de squares não
     vira pilha de faixas. Por isso avisa antes. */
  const trocarTecnica = async () => {
    const ok = await confirmar({
      titulo: 'Trocar a técnica apaga o que você desenhou. Continuar?',
      okLabel: 'Trocar',
      perigo: true,
    })
    if (ok) setTecnica(null)
  }

  const croche = tecnica === 'croche'

  /* No tricô a largura da peça já é a largura da manta; o que empilha é a
     altura da faixa, então a grade equivale a 1 coluna por N faixas. */
  const daManta = croche
    ? tamanhoManta('manta_croche', colunas, linhas, medida)
    : tamanhoManta('manta_trico', 1, faixas, medida)

  /* Os padrões salvos na biblioteca viram ponto de partida: granny para os
     modelos do crochê, faixa para a sequência do tricô. Quem não quer amarrar
     a nada segue escolhendo as cores à mão. */
  const { data: receitas } = useQuery({ queryKey: ['receitas'], queryFn: fetchReceitas })
  const grannies = (receitas ?? []).filter((r) => r.categoria === 'granny' && !r.arquivado_em)
  const padroesFaixa = (receitas ?? []).filter((r) => r.categoria === 'faixa' && !r.arquivado_em)

  const puxarGranny = (i: number, receitaId: string) => {
    const r = grannies.find((x) => x.id === receitaId)
    const cores = r && coresDoGranny(r)
    if (!r || !cores) return
    // o tamanho do granny é o tamanho do square: sem ele a manta fica sem medida
    if (!medida.largura && !medida.altura && (r.largura_cm || r.altura_cm)) {
      setMedida({ largura: r.largura_cm, altura: r.altura_cm })
    }
    mudarModelo(i, {
      nome: r.nome,
      cores,
      cor_miolo: cores[0],
      cor_borda: cores[cores.length - 1],
      receita_id: r.id,
      ajustado: false,
    })
  }

  /* Mexer numa cor não desfaz o vínculo em silêncio: o modelo continua sendo
     "a partir de X", só que ajustado — foi o que confundiu no uso. */
  const mudarCarreira = (i: number, j: number, cor: string) => {
    const atual = carreiras(modelos[i])
    const novas = atual.map((c, k) => (k === j ? cor : c))
    mudarModelo(i, {
      cores: novas,
      cor_miolo: novas[0],
      cor_borda: novas[novas.length - 1],
      ajustado: Boolean(modelos[i].receita_id),
    })
  }

  const mudarCarreiras = (i: number, novas: string[]) =>
    mudarModelo(i, {
      cores: novas,
      cor_miolo: novas[0],
      cor_borda: novas[novas.length - 1],
      ajustado: Boolean(modelos[i].receita_id),
    })

  /* O padrão de faixa guarda três coisas — as cores, quantas faixas empilham e
     o tamanho da faixa — e antes daqui só saíam as cores: a manta nascia com 8
     faixas e sem medida, por mais que o padrão dissesse outra coisa. */
  const puxarFaixa = (receitaId: string) => {
    const r = padroesFaixa.find((x) => x.id === receitaId)
    const nova = r && seqDaFaixa(r)
    if (!r || !nova) return
    setSeq(nova)
    setFaixasLivres(null)
    setFaixaSel(0)
    setFaixaReceitaId(r.id)
    setFaixaAjustada(false)
    if (r.conteudo.faixas) setFaixas(limitarFaixas(r.conteudo.faixas))
    if (r.largura_cm || r.altura_cm) setMedida({ largura: r.largura_cm, altura: r.altura_cm })
  }

  /* Mexer numa cor não desfaz o vínculo em silêncio, igual ao granny: o padrão
     continua sendo o de origem, só que ajustado. */
  const mudarSeq = (novas: string[]) => {
    setSeq(novas)
    if (faixaReceitaId) setFaixaAjustada(true)
  }

  const mudarQuantidade = (n: number) => {
    const q = limitarFaixas(n)
    setFaixas(q)
    // encolher corta as faixas de baixo; crescer devolve o deslocamento padrão
    setFaixasLivres((atual) => (atual === null ? null : faixasDaManta(seq, q, atual)))
    setFaixaSel((i) => Math.min(i, q - 1))
  }

  /* Toda edição faixa a faixa materializa a manta inteira: a partir daí as
     faixas não seguem mais o deslocamento da faixa modelo. */
  const editarManta = (muda: (linhas: string[][]) => string[][]) => {
    const novas = muda(faixasLivres ?? faixasDaManta(seq, faixas))
    const cortadas = novas.slice(0, MAX_FAIXAS)
    setFaixasLivres(cortadas)
    setFaixas(cortadas.length)
  }

  const editarFaixa = (i: number, cores: string[]) =>
    editarManta((linhas) => linhas.map((c, j) => (j === i ? cores : c)))

  const moverFaixa = (de: number, para: number) => {
    if (para < 0 || para >= faixas) return
    editarManta((linhas) => reordena(linhas, de, para))
    setFaixaSel(para)
  }

  const duplicarFaixa = (i: number) => {
    if (faixas >= MAX_FAIXAS) return
    editarManta((linhas) => [...linhas.slice(0, i + 1), linhas[i], ...linhas.slice(i + 1)])
    setFaixaSel(i + 1)
  }

  const removerFaixa = (i: number) => {
    if (faixas <= MIN_FAIXAS) return
    editarManta((linhas) => linhas.filter((_, j) => j !== i))
    setFaixaSel(Math.max(0, Math.min(i, faixas - 2)))
  }

  /* Voltar ao automático joga fora o que foi editado à mão — por isso avisa. */
  const redesenharFaixas = async () => {
    const ok = await confirmar({
      titulo: 'Redesenhar apaga as faixas que você editou à mão. Continuar?',
      okLabel: 'Redesenhar',
      perigo: true,
    })
    if (ok) setFaixasLivres(null)
  }

  const linhasDaManta = faixasDaManta(seq, faixas, faixasLivres ?? undefined)
  const coresSel = linhasDaManta[Math.min(faixaSel, faixas - 1)] ?? seq

  const ordemSeq = useReordenar((de, para) => mudarSeq(reordena(seq, de, para)))
  const ordemFaixa = useReordenar(
    (de, para) => editarFaixa(faixaSel, reordena(coresSel, de, para)),
    'cor',
  )

  /* Puxar a borda de baixo muda quantas faixas a manta tem, como a grade do
     crochê já fazia. Cada ~9px arrastados vale uma faixa. */
  const arrastoFaixas = useRef<{ y: number; faixas: number } | null>(null)
  const alcaFaixas = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      arrastoFaixas.current = { y: e.clientY, faixas }
    },
    onPointerMove: (e: React.PointerEvent) => {
      const ini = arrastoFaixas.current
      if (!ini) return
      mudarQuantidade(ini.faixas + Math.round((e.clientY - ini.y) / 9))
    },
    onPointerUp: () => {
      arrastoFaixas.current = null
    },
    onPointerCancel: () => {
      arrastoFaixas.current = null
    },
  }

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
        sub: croche
          ? `esquema de crochê · ${colunas}×${linhas} squares`
          : `esquema de tricô · ${faixas} faixas`,
        resumo: null,
        specs: [
          ...(croche
            ? ([
                ['Colunas', String(colunas)],
                ['Linhas', String(linhas)],
                ['Total', String(colunas * linhas)],
              ] as [string, string][])
            : ([
                ['Faixas', String(faixas)],
                ['Cores', String(seq.length)],
              ] as [string, string][])),
          ...(daManta ? ([['Manta', fmtMedida(daManta)]] as [string, string][]) : []),
        ],
        largura_cm: medida.largura,
        altura_cm: medida.altura,
        conteudo: croche
          ? {
              tecnica: 'croche',
              cells: celulas,
              modelos: Object.fromEntries(
                modelos.map((m) => [
                  m.letra,
                  {
                    border: m.cor_borda,
                    inner: m.cor_miolo,
                    cores: carreiras(m),
                    nome: m.nome,
                    ...(m.receita_id ? { receita_id: m.receita_id } : {}),
                  },
                ]),
              ),
            }
          : {
              tecnica: 'trico',
              seq,
              faixas,
              // só vai junto o que foi desenhado faixa a faixa
              ...(faixasLivres ? { faixasCores: faixasLivres } : {}),
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

      {!tecnica ? (
        <>
          <Lbl style={{ marginBottom: 10 }}>DE QUE TÉCNICA É A MANTA?</Lbl>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
            {TECNICAS.map(([t, label]) => (
              <button
                key={t}
                type="button"
                className="pill ghost"
                style={{ padding: '12px 26px', fontSize: 14 }}
                onClick={() => setTecnica(t)}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="pill ghost" onClick={backToProjeto}>
              Voltar
            </button>
          </div>
        </>
      ) : (
        <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <Lbl style={{ marginBottom: 7 }}>NOME</Lbl>
          <input
            className="field"
            value={nome}
            aria-label="Nome do esquema"
            onChange={(e) => setNome(e.target.value)}
            placeholder="Manta Ada"
          />
        </span>
        <span style={{ alignSelf: 'flex-end' }}>
          <button
            type="button"
            className="crumb"
            onClick={() => trocarTecnica()}
            style={{ whiteSpace: 'nowrap' }}
          >
            {TECNICAS.find(([t]) => t === tecnica)?.[1]}
          </button>
        </span>
      </div>

      {croche ? (
        <>
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
              <SquareGranny cores={carreiras(m)} tamanho={22} radius={3} style={{ flex: 'none' }} />
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
                      background: 'var(--sand)',
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
                    {m && <SquareGranny cores={carreiras(m)} tamanho={zoom.celula} />}
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
                    <IconX size={12} />
                  </button>
                )}
              </div>
              {/* O padrão vem primeiro: é dele que as carreiras nascem. Antes o
                  dropdown ficava embaixo de duas cores soltas, e não dava para
                  entender que uma coisa preenchia a outra. */}
              {grannies.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <Select
                    value={m.receita_id ?? ''}
                    onChange={(id) => puxarGranny(i, id)}
                    options={grannies.map((r) => [r.id, r.nome] as [string, string])}
                    ariaLabel={`Padrão do modelo ${m.letra}`}
                    placeholder="Padrão da biblioteca…"
                  />
                  {m.receita_id && (
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 4 }}>
                      {m.ajustado
                        ? `ajustado a partir de ${grannies.find((r) => r.id === m.receita_id)?.nome ?? 'um padrão'}`
                        : 'as carreiras vieram deste padrão'}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <SquareGranny cores={carreiras(m)} tamanho={30} style={{ flex: 'none' }} />
                <span className="lbl">CARREIRAS</span>
              </div>
              {carreiras(m).map((c, j) => (
                <div
                  key={j}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}
                >
                  <span style={{ fontSize: 10.5, color: 'var(--muted)', width: 34 }}>
                    {j === 0 ? 'miolo' : j === carreiras(m).length - 1 ? 'borda' : `${j + 1}ª`}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <ColorPicker
                      fios={fios}
                      value={c}
                      ariaLabel={`Carreira ${j + 1} do modelo ${m.letra}`}
                      onChange={(cor) => mudarCarreira(i, j, cor)}
                    />
                  </span>
                  {carreiras(m).length > 2 && (
                    <button
                      type="button"
                      className="kebab"
                      aria-label={`Remover a carreira ${j + 1} do modelo ${m.letra}`}
                      onClick={() =>
                        mudarCarreiras(
                          i,
                          carreiras(m).filter((_, k) => k !== j),
                        )
                      }
                    >
                      <IconX size={11} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="pill ghost"
                style={{ padding: '5px 12px', fontSize: 11.5 }}
                onClick={() =>
                  mudarCarreiras(i, [
                    ...carreiras(m),
                    PALETTE[carreiras(m).length % PALETTE.length][0],
                  ])
                }
              >
                + Carreira
              </button>
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
        </>
      ) : (
        <>
          <Lbl style={{ marginBottom: 9 }}>FAIXA MODELO</Lbl>
          {padroesFaixa.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <Select
                value={faixaReceitaId}
                onChange={puxarFaixa}
                options={padroesFaixa.map((r) => [r.id, r.nome] as [string, string])}
                ariaLabel="Puxar padrão de faixa da biblioteca"
                placeholder="Puxar da biblioteca…"
              />
              {faixaReceitaId && (
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 4 }}>
                  {faixaAjustada
                    ? `ajustado a partir de ${padroesFaixa.find((r) => r.id === faixaReceitaId)?.nome ?? 'um padrão'}`
                    : 'as cores, as faixas e a medida vieram deste padrão'}
                </div>
              )}
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            {seq.map((c, i) => (
              <div
                key={i}
                data-i={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 7,
                  opacity: ordemSeq.arrastado === i ? 0.4 : 1,
                  outline:
                    ordemSeq.alvo === i && ordemSeq.arrastado !== i
                      ? '2px dashed var(--ink)'
                      : 'none',
                  outlineOffset: 2,
                  borderRadius: 8,
                }}
              >
                <button
                  type="button"
                  aria-label={`Mover a cor ${i + 1} da faixa modelo`}
                  {...ordemSeq.alca(i)}
                  style={arrastarStyle}
                >
                  <IconArrastar size={13} />
                </button>
                <span style={{ fontSize: 11, color: 'var(--muted)', width: 16, fontWeight: 800 }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, minWidth: 130 }}>
                  <ColorPicker
                    fios={fios}
                    value={c}
                    ariaLabel={`Cor ${i + 1} da faixa`}
                    onChange={(nova) => mudarSeq(seq.map((x, j) => (j === i ? nova : x)))}
                  />
                </span>
                <button
                  type="button"
                  className="kebab"
                  aria-label={`Remover a cor ${i + 1}`}
                  disabled={seq.length <= 2}
                  onClick={() => mudarSeq(seq.filter((_, j) => j !== i))}
                >
                  <IconX size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="pill ghost"
              style={{ padding: '6px 14px', fontSize: 12 }}
              onClick={() => mudarSeq([...seq, PALETTE[seq.length % PALETTE.length][0]])}
            >
              + Cor
            </button>
          </div>

          <Lbl style={{ marginBottom: 7 }}>QUANTAS FAIXAS</Lbl>
          <div style={{ marginBottom: 18, maxWidth: 140 }}>
            <Stepper
              value={faixas}
              onChange={mudarQuantidade}
              min={MIN_FAIXAS}
              max={MAX_FAIXAS}
              ariaLabel="Faixas"
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <CampoMedida
              largura={medida.largura}
              altura={medida.altura}
              rotuloLargura="LARGURA DA FAIXA (CM)"
              rotuloAltura="ALTURA DA FAIXA (CM)"
              aoMudar={(patch) => setMedida((m) => ({ ...m, ...patch }))}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 9,
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <Lbl>A MANTA</Lbl>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              clique numa faixa para editar; puxe a borda de baixo para mudar a quantidade
            </span>
            {daManta && (
              <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--accent)' }}>
                {fmtMedida(daManta)}
              </span>
            )}
          </div>
          <div style={{ position: 'relative', paddingBottom: 14, marginBottom: 14 }}>
            <PreviaFaixas
              seq={seq}
              faixas={faixas}
              livres={faixasLivres ?? undefined}
              sel={faixaSel}
              aoSelecionar={setFaixaSel}
              altura={Math.min(300, faixas * 16)}
            />
            <button
              type="button"
              className="alca-grade alca-y"
              aria-label={`Quantidade de faixas: ${faixas}`}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') mudarQuantidade(faixas + 1)
                if (e.key === 'ArrowUp') mudarQuantidade(faixas - 1)
              }}
              {...alcaFaixas}
            />
          </div>

          {/* Edição livre: a faixa escolhida vale por si, sem seguir o
              deslocamento da faixa modelo. É o que faltava para mudar só uma
              faixa do meio da manta sem refazer o esquema inteiro. */}
          <div
            style={{
              background: 'var(--sand-soft)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 22,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 10,
                flexWrap: 'wrap',
              }}
            >
              <Lbl>FAIXA {faixaSel + 1}</Lbl>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                  type="button"
                  className="kebab"
                  aria-label={`Mover a faixa ${faixaSel + 1} para cima`}
                  disabled={faixaSel === 0}
                  onClick={() => moverFaixa(faixaSel, faixaSel - 1)}
                >
                  <IconChevron size={11} para="cima" />
                </button>
                <button
                  type="button"
                  className="kebab"
                  aria-label={`Mover a faixa ${faixaSel + 1} para baixo`}
                  disabled={faixaSel >= faixas - 1}
                  onClick={() => moverFaixa(faixaSel, faixaSel + 1)}
                >
                  <IconChevron size={11} para="baixo" />
                </button>
                <button
                  type="button"
                  className="pill ghost"
                  style={{ padding: '4px 11px', fontSize: 11.5 }}
                  disabled={faixas >= MAX_FAIXAS}
                  onClick={() => duplicarFaixa(faixaSel)}
                >
                  Duplicar
                </button>
                <button
                  type="button"
                  className="pill ghost"
                  style={{ padding: '4px 11px', fontSize: 11.5 }}
                  disabled={faixas <= MIN_FAIXAS}
                  onClick={() => removerFaixa(faixaSel)}
                >
                  Remover
                </button>
              </div>
            </div>

            {coresSel.map((c, i) => (
              <div
                key={i}
                data-cor={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                  opacity: ordemFaixa.arrastado === i ? 0.4 : 1,
                  outline:
                    ordemFaixa.alvo === i && ordemFaixa.arrastado !== i
                      ? '2px dashed var(--ink)'
                      : 'none',
                  outlineOffset: 2,
                  borderRadius: 8,
                }}
              >
                <button
                  type="button"
                  aria-label={`Mover a cor ${i + 1} da faixa ${faixaSel + 1}`}
                  {...ordemFaixa.alca(i)}
                  style={arrastarStyle}
                >
                  <IconArrastar size={13} />
                </button>
                <span style={{ flex: 1, minWidth: 130 }}>
                  <ColorPicker
                    fios={fios}
                    value={c}
                    ariaLabel={`Cor ${i + 1} da faixa ${faixaSel + 1}`}
                    onChange={(nova) =>
                      editarFaixa(
                        faixaSel,
                        coresSel.map((x, j) => (j === i ? nova : x)),
                      )
                    }
                  />
                </span>
                <button
                  type="button"
                  className="kebab"
                  aria-label={`Remover a cor ${i + 1} da faixa ${faixaSel + 1}`}
                  disabled={coresSel.length <= 2}
                  onClick={() =>
                    editarFaixa(
                      faixaSel,
                      coresSel.filter((_, j) => j !== i),
                    )
                  }
                >
                  <IconX size={12} />
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <button
                type="button"
                className="pill ghost"
                style={{ padding: '6px 14px', fontSize: 12 }}
                onClick={() =>
                  editarFaixa(faixaSel, [...coresSel, PALETTE[coresSel.length % PALETTE.length][0]])
                }
              >
                + Cor
              </button>
              {faixasLivres && (
                <button
                  type="button"
                  className="pill ghost"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                  onClick={redesenharFaixas}
                >
                  Redesenhar pela faixa modelo
                </button>
              )}
            </div>
            {faixasLivres && (
              <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 8 }}>
                as faixas foram editadas à mão e não seguem mais o deslocamento automático
              </div>
            )}
          </div>
        </>
      )}

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
        </>
      )}
    </ModalBox>
  )
}
