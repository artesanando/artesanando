/* Ícones do protótipo convertidos para componentes React */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
}

export const IconDash = () => (
  <svg {...base}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
)

export const IconProj = () => (
  <svg {...base}>
    <path d="M3 7h18M3 12h18M3 17h12" />
  </svg>
)

export const IconInt = () => (
  <svg {...base}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 11a3 3 0 0 0 0-6M19.5 20a5 5 0 0 0-3-4.6" />
  </svg>
)

export const IconEst = () => (
  <svg {...base}>
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
  </svg>
)

export const IconBib = () => (
  <svg {...base}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
  </svg>
)

export const IconPres = () => (
  <svg {...base}>
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </svg>
)

/* Cofrinho — o cifrão desenhado a traço parecia texto ao lado dos outros oito */
export const IconFin = () => (
  <svg {...base}>
    {/* corpo, focinho e as duas patas, num traço só */}
    <path d="M15 6.6a7.4 7.4 0 0 1 3.9 4h2.1v3.2h-2.1a7.5 7.5 0 0 1-2.2 2.8v1.8a.6.6 0 0 1-.6.6h-1.8a.6.6 0 0 1-.6-.6v-.8h-2.6v.8a.6.6 0 0 1-.6.6H8.7a.6.6 0 0 1-.6-.6v-1.8A7 7 0 0 1 5 11.3 6 6 0 0 1 11 5.9h1.4l2.9-2z" />
    {/* fenda da moeda e o olho */}
    <path d="M9.8 8.7h3.4" />
    <circle cx="16.7" cy="11.4" r=".9" fill="currentColor" stroke="none" />
  </svg>
)

export const IconPdf = () => (
  <svg {...base} width={13} height={13}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </svg>
)

export const IconVideo = () => (
  <svg {...base} width={13} height={13}>
    <rect x="3" y="6" width="12" height="12" rx="2" />
    <path d="m15 11 6-3v8l-6-3z" />
  </svg>
)

/* seta dupla do encolher/expandir do menu */
export const IconSeta = ({ virada = false }: { virada?: boolean }) => (
  <svg {...base} width={15} height={15} style={virada ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="m14 7-5 5 5 5" />
    <path d="m8 7-5 5 5 5" />
  </svg>
)

/* ---------- Ícones de ação ----------
   Substituem os caracteres que faziam papel de ícone (✓ ✕ × ⋮ ▼ ‹ › ↑ ↓ ⠿ ☰).
   Todos aceitam `size` porque aparecem em botões de tamanhos bem diferentes,
   do kebab de 20px ao botão de presença de 30px. */

const acao = (size: number) => ({ ...base, width: size, height: size })

export const IconCheck = ({ size = 15 }: { size?: number }) => (
  <svg {...acao(size)} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
)

export const IconX = ({ size = 14 }: { size?: number }) => (
  <svg {...acao(size)} strokeWidth={2.2} strokeLinecap="round">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const IconBusca = ({ size = 15 }: { size?: number }) => (
  <svg {...acao(size)} strokeLinecap="round">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 4.5 4.5" />
  </svg>
)

export const IconCamera = ({ size = 15 }: { size?: number }) => (
  <svg {...acao(size)}>
    <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.3-2h7l1.3 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3 17.5z" />
    <circle cx="11.5" cy="12.5" r="3.4" />
  </svg>
)

export const IconCadeado = ({ size = 13 }: { size?: number }) => (
  <svg {...acao(size)}>
    <rect x="4.5" y="10" width="15" height="10" rx="2" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </svg>
)

export const IconGaleria = () => (
  <svg {...base}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.6" />
    <path d="m4 17 4.8-5 3.4 3.4L15.5 12l4.5 5" />
  </svg>
)

export const IconKebab = ({ size = 15 }: { size?: number }) => (
  <svg {...acao(size)} fill="currentColor" stroke="none">
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
  </svg>
)

/* Uma seta só, girada pelo `para`. Cobre o ▼ dos seletores, o ‹ › do calendário
   e dos "voltar", e o ▲▼ de reordenar. */
export const IconChevron = ({
  size = 13,
  para = 'baixo',
}: {
  size?: number
  para?: 'cima' | 'baixo' | 'esquerda' | 'direita'
}) => {
  const giro = { cima: 180, baixo: 0, esquerda: 90, direita: -90 }[para]
  return (
    <svg
      {...acao(size)}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${giro}deg)` }}
    >
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  )
}

/* Entrada e saída do caixa, e o "abrir em" da biblioteca */
export const IconSetaLonga = ({
  size = 13,
  para = 'cima',
}: {
  size?: number
  para?: 'cima' | 'baixo' | 'direita' | 'diagonal'
}) => {
  const giro = { cima: 0, baixo: 180, direita: 90, diagonal: 45 }[para]
  return (
    <svg
      {...acao(size)}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${giro}deg)` }}
    >
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

export const IconMenu = ({ size = 18 }: { size?: number }) => (
  <svg {...acao(size)} strokeWidth={2} strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

/* alça de arrastar — o antigo ⠿ */
export const IconArrastar = ({ size = 14 }: { size?: number }) => (
  <svg {...acao(size)} fill="currentColor" stroke="none">
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
)

/* o "?" dos tooltips de cabeçalho de tabela */
export const IconAjuda = ({ size = 13 }: { size?: number }) => (
  <svg {...acao(size)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.6a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.8.7-.8 1.2v.4" strokeLinecap="round" />
    <circle cx="12" cy="16.6" r=".9" fill="currentColor" stroke="none" />
  </svg>
)

/* Identifica o tipo de projeto no cartão — antes isso era um emoji que a pessoa
   digitava, o que dava uma salada de figurinha e nenhuma informação confiável. */
export const IconCroche = ({ size = 19 }: { size?: number }) => (
  <svg {...acao(size)}>
    <rect x="4" y="4" width="16" height="16" rx="2.5" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
)

export const IconTrico = ({ size = 19 }: { size?: number }) => (
  <svg {...acao(size)} strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

export const IconAmigurumi = ({ size = 19 }: { size?: number }) => (
  <svg {...acao(size)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M6.5 20a5.5 5.5 0 0 1 11 0z" />
  </svg>
)
