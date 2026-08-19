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

export const IconFin = () => (
  <svg {...base}>
    <path d="M12 2v20M17 6.5c0-2-2.2-3-5-3s-5 1-5 3 2.2 2.7 5 3.2 5 1.2 5 3.3-2.2 3-5 3-5-1-5-3" />
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
