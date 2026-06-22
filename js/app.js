/* Artesanando — app de gestão do projeto de extensão de crochê e tricô.
   SPA em JS puro: estado global + re-render completo a cada interação. */

// ---------- Estado ----------
const S = {
  auth: false,
  papel: 'Administradora',
  screen: 'dashboard',
  modal: null,
  creatorReturn: null,
  menu: false,
  finKind: 'entrada',
  projCat: 'manta',
  projTec: 'croche',
  estoTab: 'novelos',
  mantaView: 'fluxo',
  selSquare: 26,
  grannyRings: [
    { c: '#DFA2AC', name: 'Rosé', n: 5 },
    { c: '#E3C07A', name: 'Amarelo', n: 3 },
    { c: '#7D9B76', name: 'Sálvia', n: 4 },
  ],
  faixaSeq: ['#ECD97C', '#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3', '#ECD97C'],
  faixaCount: 8,
  mantaTSel: 3,
  detKey: null,
  mantaTRows: [
    ['#ECD97C', '#A9BFA3', '#DFA2AC', '#ECD97C', '#A9BFA3', '#DFA2AC'],
    ['#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3', '#ECD97C', '#DFA2AC'],
    ['#DFA2AC', '#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3', '#ECD97C'],
    ['#ECD97C', '#DFA2AC', '#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3'],
    ['#A9BFA3', '#DFA2AC', '#ECD97C', '#A9BFA3', '#DFA2AC', '#ECD97C'],
    ['#DFA2AC', '#ECD97C', '#A9BFA3', '#DFA2AC', '#ECD97C', '#A9BFA3'],
    ['#ECD97C', '#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3', '#DFA2AC'],
    ['#A9BFA3', '#DFA2AC', '#ECD97C', '#DFA2AC', '#ECD97C', '#A9BFA3'],
  ],
  layoutCols: 8,
  layoutRows: 6,
  layoutBrush: 'A',
  layoutMap: {},
  perms: [
    ['AL', 'Ana Luiza', '#C4798A', [1, 1, 1, 0]],
    ['B', 'Beatriz', '#7D9B76', [1, 0, 1, 0]],
    ['C', 'Camila', '#C9B98F', [1, 0, 1, 0]],
    ['F', 'Fernanda', '#8FA3B8', [1, 1, 1, 0]],
  ],
};

const PALETTE = [
  ['#DFA2AC', 'Rosé'], ['#E3C07A', 'Amarelo'], ['#7D9B76', 'Sálvia'], ['#A9BFA3', 'Verde'],
  ['#B99BC4', 'Lilás'], ['#ECD97C', 'Manteiga'], ['#8FA3B8', 'Azul'], ['#C4798A', 'Rosa'],
];

const MODELS = {
  A: { nome: 'Modelo A — Flor de Maio', border: '#C4798A', inner: '#DFA2AC', resp: 'Ana Luiza' },
  B: { nome: 'Modelo B — Sunburst', border: '#B99BC4', inner: '#E3C07A', resp: 'Beatriz' },
  C: { nome: 'Modelo C — Clássico', border: '#7D9B76', inner: '#A9BFA3', resp: 'Fernanda' },
};

const ini = n => n.split(' ').map(w => w[0]).slice(0, 2).join('');
const isAdmin = () => S.papel === 'Administradora';
const set = patch => { Object.assign(S, patch); render(); };

// ---------- Dados derivados ----------
function buildMapa() {
  const plan = 'A'.repeat(40) + 'B'.repeat(24) + 'C'.repeat(16);
  // embaralho determinístico para o mapa não ficar em blocos
  const order = plan.split('').map((m, i) => ({ m, k: (i * 37) % 80 })).sort((a, b) => a.k - b.k).map(x => x.m);
  const doneByModel = { A: 32, B: 15, C: 16 };
  const seen = { A: 0, B: 0, C: 0 };
  return order.map((m, i) => {
    seen[m]++;
    const md = MODELS[m];
    return { i, m, border: md.border, inner: md.inner, done: seen[m] <= doneByModel[m] };
  });
}

const ESTOQUE = {
  novelos: { cols: ['MARCA / LINHA', 'COR', 'DISP.', 'EMPR.'], unit: 'novelos', rows: [
    { a: 'Círculo Balloon', dot: '#DFA2AC', det: 'rosé', disp: '18', dTone: 'ok', empr: '2' },
    { a: 'Círculo Balloon', dot: '#A9BFA3', det: 'sálvia', disp: '22', dTone: 'ok', empr: '—' },
    { a: 'Amigurumi Soft', dot: '#8B6A4F', det: 'marrom', disp: '9', dTone: 'ok', empr: '—' },
    { a: 'Mollet', dot: '#F3D9A4', det: 'amarelo bebê', disp: '2 ⚠', dTone: 'low', empr: '3' },
    { a: 'Anne', dot: '#B99BC4', det: 'lilás', disp: '14', dTone: 'ok', empr: '—' } ] },
  agulhas: { cols: ['TIPO', 'MEDIDA', 'DISP.', 'EMPR.'], unit: 'agulhas e ganchos', rows: [
    { a: 'Agulha de crochê', dot: null, det: '3,0 mm', disp: '8', dTone: 'ok', empr: '3' },
    { a: 'Agulha de crochê', dot: null, det: '4,0 mm', disp: '6', dTone: 'ok', empr: '5' },
    { a: 'Agulha de tricô (par)', dot: null, det: '4,5 mm', disp: '4', dTone: 'ok', empr: '2' },
    { a: 'Agulha de tricô (par)', dot: null, det: '5,0 mm', disp: '1 ⚠', dTone: 'low', empr: '1' },
    { a: 'Agulha circular', dot: null, det: '60 cm · 4 mm', disp: '3', dTone: 'ok', empr: '—' } ] },
  olhos: { cols: ['ITEM', 'TAMANHO', 'DISP.', 'EMPR.'], unit: 'olhos e itens de segurança', rows: [
    { a: 'Olho de segurança', dot: null, det: '9 mm · preto', disp: '40', dTone: 'ok', empr: '—' },
    { a: 'Olho de segurança', dot: null, det: '12 mm · preto', disp: '12', dTone: 'ok', empr: '—' },
    { a: 'Nariz de segurança', dot: null, det: '15 mm · marrom', disp: '8', dTone: 'ok', empr: '—' },
    { a: 'Trava de segurança', dot: null, det: 'par', disp: '3 ⚠', dTone: 'low', empr: '—' } ] },
  enchimento: { cols: ['ITEM', 'ESPECIFICAÇÃO', 'DISP.', 'EMPR.'], unit: 'enchimento', rows: [
    { a: 'Fibra siliconada', dot: null, det: 'pacote 400 g', disp: '6', dTone: 'ok', empr: '—' },
    { a: 'Fibra siliconada', dot: null, det: 'granel · kg', disp: '2', dTone: 'ok', empr: '—' },
    { a: 'Manta acrílica', dot: null, det: 'metro', disp: '1 ⚠', dTone: 'low', empr: '—' } ] },
  feira: { cols: ['ITEM', 'DETALHE', 'DISP.', 'VENDIDOS'], unit: 'itens de feira', rows: [
    { a: 'Touca de crochê', dot: null, det: 'bazar', disp: '10', dTone: 'ok', empr: '6' },
    { a: 'Chaveiro coração', dot: null, det: 'bazar', disp: '18', dTone: 'ok', empr: '12' },
    { a: 'Marca-página', dot: null, det: 'bazar', disp: '24', dTone: 'ok', empr: '9' },
    { a: 'Sousplat crochê', dot: null, det: 'bazar', disp: '5', dTone: 'ok', empr: '3' } ] },
};
const ESTO_TABS = [['novelos', 'Novelos'], ['agulhas', 'Agulhas'], ['olhos', 'Olhos & segurança'], ['enchimento', 'Enchimento'], ['feira', 'Itens de feira']];

const BIB_CAT = {
  amigurumi: { lbl: 'Amigurumi', fg: '#A05666', chip: '#F6E4E6', accent: '#C4798A' },
  granny: { lbl: 'Granny square', fg: '#55704E', chip: '#EAF0E6', accent: '#7D9B76' },
  faixa: { lbl: 'Faixa de tricô', fg: '#9A7328', chip: '#F1EAE0', accent: '#C9B98F' },
  manta: { lbl: 'Esquema de manta', fg: '#5E7286', chip: '#E7EDF2', accent: '#8FA3B8' },
};
const BIB_ITEMS = [
  ['Capivara da Lú', 'amigurumi', 'fio 4 mm', '3 pág'],
  ['Granny Flor de Maio', 'granny', '4 carreiras', '2 pág'],
  ['Faixa Ponto Arroz', 'faixa', 'agulha 5 mm', '1 pág'],
  ['Polvinho p/ prematuros', 'amigurumi', 'uso hospitalar', '4 pág'],
  ['Granny Sunburst', 'granny', '5 carreiras', '2 pág'],
  ['Manta Nuvem — esquema', 'manta', '8 faixas', '5 pág'],
  ['Coelha Nina', 'amigurumi', 'fio 3 mm', '3 pág'],
];

const DET = {
  'Faixa Ponto Arroz': { kind: 'faixa', tag: 'FAIXA DE TRICÔ', tBg: '#F1EAE0', tC: '#9A7328', sub: 'faixa de tricô · 5 mm',
    resumo: 'Faixa base da Manta Nuvem — uma linha inteira em ponto arroz, trocando as cores na sequência combinada.',
    specs: [['Ponto', 'Arroz'], ['Agulha', '5 mm'], ['Largura', '40 pts'], ['Comprimento', '~1,10 m']],
    seq: ['#ECD97C', '#A9BFA3', '#DFA2AC', '#ECD97C', '#A9BFA3', '#DFA2AC'],
    materiais: [{ c: '#ECD97C', name: 'Manteiga', qty: '2 novelos' }, { c: '#A9BFA3', name: 'Verde', qty: '2 novelos' }, { c: '#DFA2AC', name: 'Rosé', qty: '1 novelo' }] },
  'Manta Nuvem — esquema': { kind: 'manta', tag: 'MANTA DE TRICÔ', tBg: '#F1EAE0', tC: '#9A7328', sub: 'manta de tricô · 8 faixas',
    resumo: '8 faixas em ponto arroz, cada uma feita por uma integrante. Todas usam a mesma paleta — só muda a ordem das cores.',
    specs: [['Faixas', '8'], ['Ponto', 'Arroz'], ['Agulha', '5 mm'], ['Tamanho', '0,90×1,10 m']],
    paleta: [{ c: '#ECD97C', name: 'Manteiga' }, { c: '#A9BFA3', name: 'Verde' }, { c: '#DFA2AC', name: 'Rosé' }],
    montagem: ['Cada integrante tricota 1 faixa inteira.', 'Confira a ordem de cores de cada faixa no esquema.', 'Una as faixas com costura invisível (ponto colchão).', 'Faça a barra de acabamento em ponto baixo ao redor.'] },
  'Granny Flor de Maio': { kind: 'granny', tag: 'GRANNY SQUARE', tBg: '#EAF0E6', tC: '#55704E', sub: 'granny square · Primavera',
    resumo: 'Granny quadrado de 4 carreiras — miolo claro abrindo para a borda em sálvia. Base dos quadrados da Manta Primavera.',
    specs: [['Carreiras', '4'], ['Agulha', '4 mm'], ['Ponto', 'P. alto'], ['Tamanho', '12×12 cm']],
    rings: [{ c: '#E3C07A', name: 'Amarelo', n: 1, role: 'miolo' }, { c: '#DFA2AC', name: 'Rosé', n: 2, role: 'meio' }, { c: '#7D9B76', name: 'Sálvia', n: 1, role: 'borda' }] },
  'Granny Sunburst': { kind: 'granny', tag: 'GRANNY SQUARE', tBg: '#EAF0E6', tC: '#55704E', sub: 'granny square · médio',
    resumo: 'Granny com miolo em explosão de cor — carreiras concêntricas até o quadrado ficar médio.',
    specs: [['Carreiras', '5'], ['Agulha', '4 mm'], ['Ponto', 'P. alto'], ['Tamanho', '14×14 cm']],
    rings: [{ c: '#DFA2AC', name: 'Rosé', n: 1, role: 'miolo' }, { c: '#E3C07A', name: 'Amarelo', n: 2, role: 'meio' }, { c: '#7D9B76', name: 'Sálvia', n: 2, role: 'borda' }] },
};

const CHAMADA = [
  ['Ana Luiza Prado', '#C4798A', 1], ['Beatriz Gomes', '#7D9B76', 1], ['Camila Rocha', '#C9B98F', 0],
  ['Duda Ferreira', '#8FA3B8', 1], ['Elisa Martins', '#B99BC4', 1], ['Fernanda Dias', '#C9B98F', 1],
];

const MT_RESP = ['Giulia', 'Camila', 'Camila', 'Ana Luiza', 'Ana Luiza', 'Elisa', 'Ana Luiza', 'Giulia'];
const MT_ACOL = ['#C4798A', '#C9B98F', '#C9B98F', '#8FA3B8', '#8FA3B8', '#B99BC4', '#8FA3B8', '#C4798A'];
const MT_STATUS = ['feita', 'feita', 'feita', 'fazendo', 'afazer', 'afazer', 'afazer', 'afazer'];
const MT_NOMES = { '#ECD97C': 'Manteiga', '#A9BFA3': 'Verde', '#DFA2AC': 'Rosé' };

// ---------- Ações ----------
const A = {
  login: () => set({ auth: true }),
  logout: () => set({ auth: false, menu: false, screen: 'dashboard', modal: null }),
  toggleMenu: () => set({ menu: !S.menu }),
  go: screen => set({ screen, menu: false }),
  open: modal => set({ modal, menu: false }),
  close: () => set({ modal: null }),
  setEstoTab: k => set({ estoTab: k }),
  setMantaView: v => set({ mantaView: v }),
  pickSquare: i => set({ selSquare: i }),
  pickBand: i => set({ mantaTSel: i }),
  moveCell(from, to) {
    const rows = S.mantaTRows.map(r => r.slice());
    const row = rows[S.mantaTSel];
    if (to < 0 || to >= row.length) return;
    const [x] = row.splice(from, 1);
    row.splice(to, 0, x);
    set({ mantaTRows: rows });
  },
  shuffleBand() {
    const rows = S.mantaTRows.map(r => r.slice());
    const a = rows[S.mantaTSel];
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [a[k], a[j]] = [a[j], a[k]];
    }
    set({ mantaTRows: rows });
  },
  // criador de granny
  grannyInc: i => set({ grannyRings: S.grannyRings.map((x, j) => j === i ? { ...x, n: x.n + 1 } : x) }),
  grannyDec: i => set({ grannyRings: S.grannyRings.map((x, j) => j === i ? { ...x, n: Math.max(1, x.n - 1) } : x) }),
  grannyDel: i => set({ grannyRings: S.grannyRings.length > 1 ? S.grannyRings.filter((_, j) => j !== i) : S.grannyRings }),
  grannyAdd() {
    const used = S.grannyRings.map(r => r.c);
    const pick = PALETTE.find(p => !used.includes(p[0])) || PALETTE[0];
    set({ grannyRings: [...S.grannyRings, { c: pick[0], name: pick[1], n: 2 }] });
  },
  grannySetColor(c, name) {
    const last = S.grannyRings.length - 1;
    set({ grannyRings: S.grannyRings.map((x, j) => j === last ? { ...x, c, name } : x) });
  },
  // criador de faixa
  faixaCycle(i) {
    const pal = PALETTE.map(p => p[0]);
    const nx = pal[(pal.indexOf(S.faixaSeq[i]) + 1) % pal.length];
    set({ faixaSeq: S.faixaSeq.map((x, j) => j === i ? nx : x) });
  },
  faixaAdd: () => set({ faixaSeq: [...S.faixaSeq, PALETTE[S.faixaSeq.length % PALETTE.length][0]] }),
  faixaDrop: () => set({ faixaSeq: S.faixaSeq.length > 2 ? S.faixaSeq.slice(0, -1) : S.faixaSeq }),
  incFaixa: () => set({ faixaCount: Math.min(20, S.faixaCount + 1) }),
  decFaixa: () => set({ faixaCount: Math.max(2, S.faixaCount - 1) }),
  // organizador de quadrados
  layoutPaint: (r, c) => set({ layoutMap: { ...S.layoutMap, [r + '-' + c]: S.layoutBrush } }),
  pickBrush: k => set({ layoutBrush: k }),
  incCols: () => set({ layoutCols: Math.min(12, S.layoutCols + 1) }),
  decCols: () => set({ layoutCols: Math.max(3, S.layoutCols - 1) }),
  incRows: () => set({ layoutRows: Math.min(12, S.layoutRows + 1) }),
  decRows: () => set({ layoutRows: Math.max(3, S.layoutRows - 1) }),
  // modal de projeto
  setProjCat: c => set({ projCat: c }),
  setProjTec: t => set({ projTec: t }),
  openGranny: ret => set({ modal: 'granny', creatorReturn: ret, menu: false }),
  openFaixa: ret => set({ modal: 'faixa', creatorReturn: ret, menu: false }),
  openLayout: ret => set({ modal: 'layout', creatorReturn: ret, menu: false }),
  backToProjeto: () => set({ modal: S.creatorReturn }),
  // financeiro
  openFin: kind => set({ modal: 'financeiro', finKind: kind, menu: false }),
  setFinKind: k => set({ finKind: k }),
  // biblioteca
  openDetalhe: name => set({ modal: 'detalhe', detKey: name, menu: false }),
  // permissões
  togglePerm(p, t) {
    const perms = S.perms.map((row, i) => i === p ? [row[0], row[1], row[2], row[3].map((v, j) => j === t ? (v ? 0 : 1) : v)] : row);
    set({ perms });
  },
};
window.A = A;

// ---------- Componentes ----------
const icons = {
  dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  proj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h18M3 12h18M3 17h12"/></svg>',
  int: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 11a3 3 0 0 0 0-6M19.5 20a5 5 0 0 0-3-4.6"/></svg>',
  est: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/></svg>',
  bib: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/></svg>',
  pres: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>',
  fin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v20M17 6.5c0-2-2.2-3-5-3s-5 1-5 3 2.2 2.7 5 3.2 5 1.2 5 3.3-2.2 3-5 3-5-1-5-3"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
};

function loginView() {
  return `
  <div style="display:flex;min-height:100vh">
    <div style="width:52%;flex:none;background:#B96D7E;color:#fff;padding:56px 60px;display:flex;flex-direction:column">
      <div style="font-family:'Bitter',serif;font-weight:600;font-size:24px">Artesanando<span style="color:#F3D9DE">.</span></div>
      <div style="margin-top:auto">
        <div style="font-family:'Bitter',serif;font-weight:500;font-size:38px;line-height:1.15;letter-spacing:-.5px">Cada ponto<br>vira acolhimento.</div>
        <div style="font-size:14px;line-height:1.6;color:#F6DEE3;margin-top:18px;max-width:400px">Um espaço para organizar mantas, amigurumis, materiais e encontros do nosso projeto de extensão — juntas, no mesmo lugar.</div>
      </div>
    </div>
    <div style="flex:1;padding:56px 60px;display:flex;flex-direction:column;justify-content:center">
      <div style="max-width:340px;width:100%;margin:0 auto">
        <div style="font-family:'Bitter',serif;font-weight:500;font-size:26px;margin-bottom:4px">Bem-vinda de volta</div>
        <div style="font-size:13px;color:#9A8A80;margin-bottom:30px">Entre com seu usuário e senha</div>
        <div class="lbl" style="margin-bottom:7px">USUÁRIO</div>
        <input class="field" style="margin-bottom:18px" value="regina.prof">
        <div style="display:flex;justify-content:space-between;margin-bottom:7px"><span class="lbl">SENHA</span><span style="font-size:11.5px;font-weight:700;color:#A05666;cursor:pointer">esqueci</span></div>
        <input class="field" type="password" style="margin-bottom:14px" value="12345678">
        <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#61554D;margin-bottom:24px"><span style="width:16px;height:16px;border-radius:5px;background:#B96D7E;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">✓</span>Manter conectada</div>
        <button class="pill" style="width:100%;padding:13px;font-size:14px" onclick="A.login()">Entrar</button>
        <div style="font-size:12px;color:#9A8A80;text-align:center;margin-top:20px">Não tem acesso? Fale com uma <b style="color:#A05666">administradora</b>.</div>
      </div>
    </div>
  </div>`;
}

function sidebar() {
  const s = S.screen;
  const projGroup = ['projetos', 'mantaC', 'mantaT', 'amig'].includes(s);
  const items = [
    ['dashboard', 'Dashboard', icons.dash, s === 'dashboard'],
    ['projetos', 'Projetos', icons.proj, projGroup],
    ['integrantes', 'Integrantes', icons.int, s === 'integrantes'],
    ['estoque', 'Estoque', icons.est, s === 'estoque'],
    ['biblioteca', 'Biblioteca', icons.bib, s === 'biblioteca'],
    ['presenca', 'Presença', icons.pres, s === 'presenca'],
    ['financeiro', 'Financeiro', icons.fin, s === 'financeiro'],
  ];
  const nav = items.map(([key, label, icon, on]) => `
    <div class="nav" onclick="A.go('${key}')" style="color:${on ? '#3B342F' : '#9A8A80'}">${icon}${label}${on ? '<span style="width:6px;height:6px;border-radius:50%;background:#B96D7E;margin-left:auto"></span>' : ''}</div>`).join('');
  const menu = S.menu ? `
    <div class="menu">
      <div onclick="A.go('perfil')">Meu perfil</div>
      ${isAdmin() ? '<div onclick="A.go(\'config\')">Configurações</div>' : ''}
      <div onclick="A.logout()" style="border-top:1px solid #F2E4DE;color:#A05666">Sair</div>
    </div>` : '';
  return `
  <div style="width:212px;flex:none;padding:26px 22px;display:flex;flex-direction:column;border-right:1px dashed #E0CCC5;position:sticky;top:0;height:100vh">
    <div style="font-family:'Bitter',serif;font-weight:600;font-size:19px;letter-spacing:-.2px;margin-bottom:28px">Artesanando<span style="color:#B96D7E">.</span></div>
    <div style="display:flex;flex-direction:column;gap:4px">${nav}</div>
    ${menu}
    <div onclick="A.toggleMenu()" style="margin-top:auto;display:flex;align-items:center;gap:10px;padding-top:16px;border-top:1px dashed #E0CCC5;cursor:pointer">
      <div style="width:32px;height:32px;border-radius:50%;background:#C4798A;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex:none">R</div>
      <div style="line-height:1.25;flex:1;min-width:0"><div style="font-weight:800;font-size:12.5px;white-space:nowrap">Profa. Regina</div><div style="font-size:11px;color:#9A8A80;white-space:nowrap">${S.papel}</div></div>
      <span style="color:#C4B4AA;font-size:11px">▾</span>
    </div>
  </div>`;
}

function dashboardView() {
  return `
  <div style="padding:30px 40px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:26px">
      <div><div class="h" style="font-weight:500;font-size:28px">Boa tarde, Regina</div><div style="font-size:13px;color:#9A8A80;margin-top:4px">Quinta, 10 de julho — próximo encontro <b style="color:#A05666">terça 14, 14h · Sala 203</b></div></div>
      ${isAdmin() ? '<button class="pill" onclick="A.open(\'projeto\')">+ Novo projeto</button>' : ''}
    </div>
    <div style="display:flex;border-top:1px solid #E2CFC8;border-bottom:1px solid #E2CFC8;padding:18px 0;margin-bottom:30px">
      ${[['18', 'integrantes'], ['65', 'novelos em estoque'], ['5', 'novelos emprestados'], ['2', 'mantas em andamento'], ['2', 'amigurumis ativos']]
        .map(([n, l], i, arr) => `<div style="flex:1;padding:0 22px;${i < arr.length - 1 ? 'border-right:1px solid #ECDCD6' : ''}"><div class="h" style="font-size:30px">${n}</div><div style="font-size:12px;color:#9A8A80;font-weight:700">${l}</div></div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:44px;align-items:start">
      <div>
        <div class="h" style="font-size:17px;margin-bottom:14px">Em produção</div>
        <div style="border-top:1px solid #ECDCD6">
          <div onclick="A.go('mantaC')" style="padding:16px 2px;border-bottom:1px solid #ECDCD6;cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><div style="font-weight:800;font-size:15px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Manta Primavera <span style="font-weight:600;font-size:11.5px;color:#A05666">· crochê · 5 integrantes</span></div><div style="font-size:12.5px;font-weight:700;color:#A05666;flex:none">63/80</div></div>
            <div class="progress" style="margin:10px 0 0"><div style="width:79%"></div></div>
          </div>
          <div onclick="A.go('mantaT')" style="padding:16px 2px;border-bottom:1px solid #ECDCD6;cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><div style="font-weight:800;font-size:15px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Manta Nuvem <span style="font-weight:600;font-size:11.5px;color:#55704E">· tricô · 4 integrantes</span></div><div style="font-size:12.5px;font-weight:700;color:#A05666;flex:none">3/8 faixas</div></div>
            <div class="progress" style="margin:10px 0 0"><div style="width:37%"></div></div>
          </div>
          <div onclick="A.go('amig')" style="padding:16px 2px;border-bottom:1px solid #ECDCD6;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
            <div style="font-weight:800;font-size:15px">Amigurumi Capivara <span style="font-weight:600;font-size:11.5px;color:#9A8A80">· 4 integrantes</span></div>
            <span class="tag" style="border:1px solid #E3C6CB;color:#A05666">10/12 UND</span>
          </div>
        </div>
      </div>
      <div>
        <div class="h" style="font-size:17px;margin-bottom:14px">Atividade recente</div>
        <div style="display:flex;flex-direction:column">
          <div style="display:flex;gap:12px;padding:0 0 18px"><div style="width:9px;height:9px;border-radius:50%;background:#C4798A;margin-top:4px;flex:none"></div><div style="font-size:12.5px;line-height:1.5;color:#61554D"><b style="color:#3B342F">Ana</b> concluiu o miolo de 8 squares Modelo A · Primavera <span style="color:#B4A49A">· há 2h</span></div></div>
          <div style="display:flex;gap:12px;padding:0 0 18px"><div style="width:9px;height:9px;border-radius:50%;background:#7D9B76;margin-top:4px;flex:none"></div><div style="font-size:12.5px;line-height:1.5;color:#61554D"><b style="color:#3B342F">Camila</b> concluiu a faixa 3 · Manta Nuvem <span style="color:#B4A49A">· há 5h</span></div></div>
          <div style="display:flex;gap:12px;padding:0 0 18px"><div style="width:9px;height:9px;border-radius:50%;background:#C9B98F;margin-top:4px;flex:none"></div><div style="font-size:12.5px;line-height:1.5;color:#61554D"><b style="color:#3B342F">Fernanda</b> devolveu 2 novelos Balloon <span style="color:#B4A49A">· ontem</span></div></div>
          <div style="display:flex;gap:12px"><div style="width:9px;height:9px;border-radius:50%;background:#8FA3B8;margin-top:4px;flex:none"></div><div style="font-size:12.5px;line-height:1.5;color:#61554D"><b style="color:#3B342F">Regina</b> registrou presença de 07/07 <span style="color:#B4A49A">· ontem</span></div></div>
        </div>
      </div>
    </div>
  </div>`;
}

function projetosView() {
  const amigRow = (emoji, bg, nome, receita, und, meta, pct, integrantes, extra) => `
    <div class="card" onclick="A.go('amig')" style="display:grid;grid-template-columns:1.7fr 1.3fr 1.4fr .5fr;gap:14px;align-items:center;padding:14px 18px;cursor:pointer">
      <div style="display:flex;align-items:center;gap:12px"><div style="width:38px;height:38px;border-radius:11px;background:repeating-linear-gradient(-45deg,${bg} 0 6px,${bg}CC 6px 12px);display:flex;align-items:center;justify-content:center;font-size:17px">${emoji}</div><div><div style="font-weight:800;font-size:15px">${nome}</div><div style="font-size:11px;color:#9A8A80;font-weight:600">${receita}</div></div></div>
      <div><div style="font-size:12px;font-weight:700">${und} und <span style="color:#9A8A80;font-weight:600">· meta ${meta}</span></div><div class="progress" style="height:5px;margin-top:6px"><div style="width:${pct}%${pct >= 100 ? ';background:#7D9B76' : ''}"></div></div></div>
      <div style="font-size:11px;color:#9A8A80;font-weight:600">${integrantes} integrantes</div>
      ${extra}
    </div>`;
  return `
  <div style="padding:30px 40px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:20px">
      <div><div style="display:flex;align-items:center;gap:12px"><div class="h" style="font-weight:500;font-size:28px">Projetos</div><div class="field" style="border-radius:99px;padding:6px 14px;font-weight:800;font-size:12.5px;display:flex;align-items:center;gap:8px;cursor:pointer">2026.2 <span style="color:#B4A49A">▾</span></div></div><div style="font-size:12.5px;color:#9A8A80;margin-top:3px">2 mantas · 3 tipos de amigurumi</div></div>
      ${isAdmin() ? '<button class="pill" onclick="A.open(\'projeto\')">+ Novo projeto</button>' : ''}
    </div>
    <div style="display:flex;gap:22px;border-bottom:1px solid #E2CFC8;margin-bottom:18px;font-size:13px;font-weight:700">
      <div style="padding:8px 2px;border-bottom:2px solid #B96D7E">Todos</div>
      <div style="padding:8px 2px;color:#9A8A80">Mantas <span style="color:#55704E">2</span></div>
      <div style="padding:8px 2px;color:#9A8A80">Amigurumis <span style="color:#C08A2E">3</span></div>
    </div>
    <div class="lbl" style="margin-bottom:10px">MANTAS</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:26px">
      <div class="card" onclick="A.go('mantaC')" style="padding:16px 18px;cursor:pointer">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-weight:800;font-size:15px">Manta Primavera <span class="tag" style="background:#F6E4E6;color:#A05666;margin-left:4px">crochê</span></div><span style="font-size:12px;font-weight:700;color:#A05666">63/80</span></div>
        <div class="progress"><div style="width:79%"></div></div>
        <div style="font-size:11.5px;color:#9A8A80;font-weight:600;margin-top:8px">A 32/40 · B 15/24 · C 16/16 ✓</div>
      </div>
      <div class="card" onclick="A.go('mantaT')" style="padding:16px 18px;cursor:pointer">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-weight:800;font-size:15px">Manta Nuvem <span class="tag" style="background:#EAF0E6;color:#55704E;margin-left:4px">tricô</span></div><span style="font-size:12px;font-weight:700;color:#A05666">3/8</span></div>
        <div class="progress"><div style="width:37%"></div></div>
        <div style="font-size:11.5px;color:#9A8A80;font-weight:600;margin-top:8px">8 faixas · divididas entre 4 integrantes</div>
      </div>
    </div>
    <div class="lbl" style="margin-bottom:10px">AMIGURUMIS · por tipo</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${amigRow('🦫', '#F6E4E6', 'Capivara', 'Capivara da Lú', 10, 12, 83, 4, '<div style="text-align:right;color:#CBB9AF">›</div>')}
      ${amigRow('🐙', '#F6E4E6', 'Polvo Rosa', 'Polvinho p/ prematuros', 4, 20, 20, 2, '<div style="text-align:right;color:#CBB9AF">›</div>')}
      ${amigRow('🐰', '#EAF0E6', 'Coelhinha', 'Coelha Nina', 8, 8, 100, 4, '<div style="text-align:right"><span class="tag" style="border:1px solid #B9C9B2;color:#55704E">ENTREGUE</span></div>')}
    </div>
  </div>`;
}

function mantaCView() {
  const seg = on => on
    ? 'padding:7px 16px;border-radius:99px;background:#B96D7E;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer;white-space:nowrap'
    : 'padding:7px 16px;border-radius:99px;border:1px solid #DCC7BF;color:#61554D;font-weight:700;font-size:12.5px;cursor:pointer;white-space:nowrap';
  let body = '';
  if (S.mantaView === 'fluxo') {
    body = `
    <div style="font-size:12px;color:#9A8A80;margin-bottom:14px">miolo → aguardando borda → borda → pronto · o lote "precisa de alguém" fica livre para outra integrante pegar</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:26px">
      <div style="background:#F4EEE9;border-radius:14px;padding:12px">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#9A8A80;margin-bottom:10px"><span>MIOLO</span><span>1</span></div>
        <div class="card" style="padding:11px 12px;margin-bottom:8px"><div style="font-weight:800;font-size:13px">Modelo B ×6</div><div style="font-size:11px;color:#9A8A80;margin-top:2px">Duda · carr. 1–8</div></div>
      </div>
      <div style="background:#FBF1E7;border-radius:14px;padding:12px">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#9A7328;margin-bottom:10px"><span>AGUARDANDO BORDA</span><span>1</span></div>
        <div class="card" style="padding:11px 12px;margin-bottom:8px;border-color:#E7D6B8"><div style="font-weight:800;font-size:13px">Modelo A ×8</div><div style="font-size:11px;color:#9A8A80;margin-top:2px">miolo: Ana</div><div style="font-size:10.5px;font-weight:800;color:#9A7328;margin-top:6px">↳ precisa de alguém</div></div>
      </div>
      <div style="background:#F4EEE9;border-radius:14px;padding:12px">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#9A8A80;margin-bottom:10px"><span>BORDA</span><span>1</span></div>
        <div class="card" style="padding:11px 12px;margin-bottom:8px"><div style="font-weight:800;font-size:13px">Modelo A ×4</div><div style="font-size:11px;color:#9A8A80;margin-top:2px">Beatriz · carr. 9–12</div></div>
      </div>
      <div style="background:#EEF3EA;border-radius:14px;padding:12px">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#55704E;margin-bottom:10px"><span>PRONTO</span><span>1</span></div>
        <div class="card" style="padding:11px 12px;margin-bottom:8px;border-color:#D8E0D2"><div style="font-weight:800;font-size:13px">Modelo C ×16</div><div style="font-size:11px;color:#55704E;font-weight:700;margin-top:2px">✓ Fernanda</div></div>
      </div>
    </div>`;
  } else {
    const mapa = buildMapa();
    const sel = mapa[S.selSquare] || mapa[0];
    const selModel = MODELS[sel.m];
    const squares = mapa.map(sq => `<div onclick="A.pickSquare(${sq.i})" title="square ${sq.i}" style="width:30px;height:30px;background:${sq.border};opacity:${sq.done ? '1' : '.38'};box-shadow:${sq.i === S.selSquare ? '0 0 0 2px #3B342F' : 'none'};display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:2px"><div style="width:16px;height:16px;background:${sq.inner}"></div></div>`).join('');
    const respList = ['A', 'B', 'C'].map(k => {
      const md = MODELS[k];
      const total = mapa.filter(s => s.m === k).length;
      const done = mapa.filter(s => s.m === k && s.done).length;
      const full = done === total;
      return `<div style="display:flex;justify-content:space-between;padding:9px 2px;border-bottom:1px solid #ECDCD6;font-size:12.5px"><span style="font-weight:700;display:flex;align-items:center;gap:8px"><span style="width:10px;height:10px;border-radius:2px;background:${md.border}"></span>${md.nome.split('—')[0].trim()}</span><span style="font-weight:800;color:${full ? '#55704E' : '#A05666'}">${done}/${total}${full ? ' ✓' : ''}</span></div>`;
    }).join('');
    const selCol = 'L' + (Math.floor(S.selSquare / 10) + 1) + ' C' + (S.selSquare % 10 + 1);
    body = `
    <div style="font-size:12px;color:#9A8A80;margin-bottom:14px">Cada quadrinho é um granny da manta — a cor de fora é a borda, a de dentro o miolo. Toque para ver o padrão. Esmaecidos ainda não foram feitos.</div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:26px;align-items:start;margin-bottom:26px">
      <div style="display:grid;grid-template-columns:repeat(10,30px);gap:3px">${squares}</div>
      <div style="min-width:200px">
        <div class="h" style="font-size:15px;margin-bottom:10px">Padrões</div>
        <div style="border-top:1px solid #ECDCD6;margin-bottom:16px">${respList}</div>
        <div style="border:1px solid #ECDCD6;border-radius:12px;background:#FFFDFB;padding:12px 14px">
          <div class="lbl" style="margin-bottom:8px">SELECIONADO · ${selCol}</div>
          <div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;background:${sel.border};display:flex;align-items:center;justify-content:center;flex:none"><div style="width:22px;height:22px;background:${sel.inner}"></div></div><div style="font-size:12.5px;line-height:1.5"><b>${selModel.nome}</b><br><span style="color:#9A8A80">miolo + borda</span></div></div>
        </div>
      </div>
    </div>`;
  }
  return `
  <div style="padding:26px 40px 34px">
    <div class="crumb" onclick="A.go('projetos')" style="margin-bottom:8px">‹ Projetos / <span style="color:#3B342F">Manta Primavera</span></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:12px"><div class="h" style="font-weight:500;font-size:26px">Manta Primavera</div><span class="tag" style="border:1px solid #E3C6CB;color:#A05666">CROCHÊ</span></div>
      ${isAdmin() ? '<button class="pill" onclick="A.open(\'producao\')">+ Registrar produção</button>' : ''}
    </div>
    <div style="font-size:12.5px;color:#9A8A80;margin-bottom:18px">Destino: Hospital Infantil · 80 squares · padrões A/B/C · 5 integrantes</div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:26px"><div class="progress" style="flex:1;height:8px"><div style="width:79%"></div></div><div class="h" style="font-size:19px;color:#A05666;flex:none">63<span style="color:#B4A49A;font-size:14px">/80 squares</span></div></div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div onclick="A.setMantaView('fluxo')" style="${seg(S.mantaView === 'fluxo')}">Fluxo por etapa</div>
      <div onclick="A.setMantaView('mapa')" style="${seg(S.mantaView === 'mapa')}">Mapa de montagem</div>
    </div>
    ${body}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start">
      <div>
        <div class="h" style="font-size:16px;margin-bottom:12px">Comentários</div>
        <div style="display:flex;gap:10px;margin-bottom:12px"><div style="width:26px;height:26px;border-radius:50%;background:#7D9B76;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10.5px;flex:none">B</div><div class="card" style="border-radius:0 12px 12px 12px;padding:10px 13px;font-size:12.5px;line-height:1.5"><b>Beatriz</b> <span style="color:#B4A49A;font-size:11px">· hoje</span><br>Peguei as bordas do Modelo A 👍</div></div>
        <div class="field" style="border-radius:99px;color:#B4A49A;border-style:dashed">Escrever um comentário…</div>
      </div>
      <div>
        <div class="h" style="font-size:16px;margin-bottom:12px">Histórico de alterações</div>
        <div style="border-left:1px solid #E2CFC8;padding-left:16px;display:flex;flex-direction:column;gap:14px">
          <div style="font-size:12px;line-height:1.5;color:#61554D"><b style="color:#3B342F">Ana</b> concluiu miolo Modelo A ×8<div style="color:#B4A49A;font-size:11px">→ aguardando borda · hoje 14:32</div></div>
          <div style="font-size:12px;line-height:1.5;color:#61554D"><b style="color:#3B342F">Beatriz</b> pegou borda Modelo A ×4<div style="color:#B4A49A;font-size:11px">aguardando → borda · hoje 15:01</div></div>
          <div style="font-size:12px;line-height:1.5;color:#61554D"><b style="color:#3B342F">Fernanda</b> concluiu Modelo C ×16<div style="color:#B4A49A;font-size:11px">→ pronto · ontem</div></div>
        </div>
      </div>
    </div>
  </div>`;
}

function mantaTView() {
  const rows = S.mantaTRows;
  const sel = S.mantaTSel;
  const doneCount = MT_STATUS.filter(x => x === 'feita').length;
  const prog = Math.round(doneCount / rows.length * 100) + '%';
  const bands = rows.map((r, i) => {
    const isSel = i === sel;
    const op = isSel ? '1' : (MT_STATUS[i] === 'afazer' ? '.42' : '1');
    return `<div onclick="A.pickBand(${i})" style="position:relative;display:flex;height:34px;cursor:pointer;opacity:${op};box-shadow:${isSel ? 'inset 0 0 0 2px #3B342F' : 'none'};z-index:${isSel ? 1 : 0}">
      <div style="position:absolute;left:7px;top:0;bottom:0;display:flex;align-items:center;font-size:10px;font-weight:800;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.45)">F${i + 1}</div>
      ${r.map(c => `<div style="flex:1;background:${c}"></div>`).join('')}
    </div>`;
  }).join('');
  const edit = rows[sel].map((c, i) => `
    <div style="display:flex;align-items:center;gap:11px;background:#FFFDFB;border:1px solid #E7D9D2;border-radius:10px;padding:7px 11px">
      <span style="font-size:11px;font-weight:800;color:#C4B4AA;width:12px;flex:none">${i + 1}</span>
      <span style="width:26px;height:26px;border-radius:6px;background:${c};border:1px solid rgba(59,52,47,.12);flex:none"></span>
      <span style="flex:1;font-size:12.5px;font-weight:700">${MT_NOMES[c] || 'Cor'}</span>
      <span onclick="A.moveCell(${i},${i - 1})" style="cursor:pointer;color:#A05666;font-weight:800;font-size:13px;opacity:${i === 0 ? '.22' : '1'};padding:2px 4px">▲</span>
      <span onclick="A.moveCell(${i},${i + 1})" style="cursor:pointer;color:#A05666;font-weight:800;font-size:13px;opacity:${i === rows[sel].length - 1 ? '.22' : '1'};padding:2px 4px">▼</span>
    </div>`).join('');
  return `
  <div style="padding:26px 40px 34px">
    <div class="crumb" onclick="A.go('projetos')" style="margin-bottom:8px">‹ Projetos / <span style="color:#3B342F">Manta Nuvem</span></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:12px"><div class="h" style="font-weight:500;font-size:26px">Manta Nuvem</div><span class="tag" style="border:1px solid #B9C9B2;color:#55704E">TRICÔ</span></div>
      <div style="font-size:12.5px;font-weight:700;color:#A05666">${doneCount}/${rows.length} faixas</div>
    </div>
    <div style="font-size:12.5px;color:#9A8A80;margin-bottom:20px">Ponto arroz · agulha 5mm · cada faixa é uma linha inteira, feita por uma integrante</div>
    <div style="display:grid;grid-template-columns:1.35fr 1fr;gap:36px;align-items:start">
      <div>
        <div class="h" style="font-size:16px;margin-bottom:4px">Prévia da manta</div>
        <div style="font-size:11.5px;color:#9A8A80;margin-bottom:14px">toque numa faixa para reordenar as cores dela</div>
        <div style="border:1.5px solid #D8C7BF;border-radius:8px;overflow:hidden;max-width:360px">${bands}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:14px;max-width:360px"><div class="progress" style="flex:1;height:7px"><div style="width:${prog}"></div></div><span style="font-size:11.5px;font-weight:800;color:#A05666">${doneCount}/${rows.length}</span></div>
        <div style="font-size:11px;color:#9A8A80;margin-top:9px;max-width:360px;line-height:1.5">Mesma paleta em toda faixa — só muda a ordem. Faixas claras ainda não foram tricotadas.</div>
      </div>
      <div style="background:#FBF6F1;border:1px solid #ECDCD6;border-radius:14px;padding:18px 20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><div class="h" style="font-size:17px">Faixa ${sel + 1}</div><span class="tag" style="background:#F6E4E6;color:#A05666">EDITANDO</span></div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px"><div style="width:22px;height:22px;border-radius:50%;background:${MT_ACOL[sel]};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:9px;flex:none">${ini(MT_RESP[sel])}</div><span style="font-size:12.5px;font-weight:700">${MT_RESP[sel]}</span></div>
        <div class="lbl" style="margin-bottom:10px">ORDEM DAS CORES</div>
        <div style="display:flex;flex-direction:column;gap:8px">${edit}</div>
        <div style="display:flex;gap:9px;margin-top:18px"><button class="pill" style="flex:1;padding:10px" onclick="A.shuffleBand()">Embaralhar ordem</button>${isAdmin() ? '<button class="pill ghost" style="padding:10px 16px">Salvar</button>' : ''}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1.35fr 1fr;gap:36px;align-items:start;margin-top:30px;padding-top:24px;border-top:1px solid #ECDCD6">
      <div>
        <div class="h" style="font-size:16px;margin-bottom:12px">Comentários</div>
        <div style="display:flex;gap:10px"><div style="width:26px;height:26px;border-radius:50%;background:#C9B98F;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10.5px;flex:none">C</div><div class="card" style="border-radius:0 12px 12px 12px;padding:10px 13px;font-size:12.5px;line-height:1.5"><b>Camila</b> <span style="color:#B4A49A;font-size:11px">· ontem</span><br>Faixas 2 e 3 prontas!</div></div>
      </div>
      <div>
        <div class="h" style="font-size:16px;margin-bottom:12px">Histórico</div>
        <div style="border-left:1px solid #E2CFC8;padding-left:16px;display:flex;flex-direction:column;gap:14px">
          <div style="font-size:12px;line-height:1.5;color:#61554D"><b style="color:#3B342F">Camila</b> concluiu a faixa 3<div style="color:#B4A49A;font-size:11px">a fazer → feita · ontem</div></div>
          <div style="font-size:12px;line-height:1.5;color:#61554D"><b style="color:#3B342F">Regina</b> atribuiu a faixa 4<div style="color:#B4A49A;font-size:11px">— → Ana Luiza · 05/07</div></div>
        </div>
      </div>
    </div>
  </div>`;
}

function amigView() {
  const row = (t, tag, tone, first) => `
    <div style="display:flex;justify-content:space-between;padding:12px 16px;${first ? '' : 'border-top:1px solid #ECDCD6;'}font-size:12.5px"><b>${t}</b><span class="tag" style="border:1px solid ${tone === 'ok' ? '#B9C9B2' : '#E3C6CB'};color:${tone === 'ok' ? '#55704E' : '#A05666'}">${tag}</span></div>`;
  return `
  <div style="padding:26px 40px 34px">
    <div class="crumb" onclick="A.go('projetos')" style="margin-bottom:8px">‹ Projetos / <span style="color:#3B342F">Amigurumi Capivara</span></div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px"><div class="h" style="font-weight:500;font-size:26px">Amigurumi Capivara</div><span class="tag" style="border:1px solid #E3C6CB;color:#A05666">10/12 UND</span></div>
    <div style="font-size:12.5px;color:#9A8A80;margin-bottom:22px">Cada unidade é feita integralmente por uma integrante · destino: Dia das Crianças</div>
    <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:32px;align-items:start">
      <div>
        <div class="h" style="font-size:16px;margin-bottom:12px">Unidades por integrante</div>
        <div class="card" style="overflow:hidden">
          ${row('#1–3 · Ana Luiza', 'CONCLUÍDO', 'ok', true)}
          ${row('#4–6 · Beatriz', 'CONCLUÍDO', 'ok', false)}
          ${row('#7–10 · Camila', 'CONCLUÍDO', 'ok', false)}
          ${row('#11–12 · Duda', 'EM PRODUÇÃO', 'prod', false)}
        </div>
        ${isAdmin() ? '<div style="font-size:12.5px;font-weight:800;color:#A05666;margin-top:12px;cursor:pointer">+ Adicionar unidade</div>' : ''}
      </div>
      <div>
        <div class="h" style="font-size:16px;margin-bottom:12px">Ficha</div>
        <div style="border-top:1px solid #ECDCD6;margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;padding:11px 2px;border-bottom:1px solid #ECDCD6;font-size:12.5px"><span style="color:#9A8A80;font-weight:700">Receita</span><b style="color:#C08A2E;cursor:pointer" onclick="A.openDetalhe('Capivara da Lú')">Capivara da Lú ↗</b></div>
          <div style="display:flex;justify-content:space-between;padding:11px 2px;border-bottom:1px solid #ECDCD6;font-size:12.5px"><span style="color:#9A8A80;font-weight:700">Fio</span><b>Amigurumi Soft · marrom</b></div>
          <div style="display:flex;justify-content:space-between;padding:11px 2px;border-bottom:1px solid #ECDCD6;font-size:12.5px"><span style="color:#9A8A80;font-weight:700">Meta</span><b>12 unidades</b></div>
        </div>
        <div class="h" style="font-size:16px;margin-bottom:12px">Comentários</div>
        <div style="display:flex;gap:10px"><div style="width:26px;height:26px;border-radius:50%;background:#C4798A;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;flex:none">AL</div><div class="card" style="border-radius:0 12px 12px 12px;padding:10px 13px;font-size:12.5px;line-height:1.5"><b>Ana Luiza</b> <span style="color:#B4A49A;font-size:11px">· há 3 dias</span><br>Minhas 3 prontas 🧶</div></div>
      </div>
    </div>
  </div>`;
}

function integrantesView() {
  const member = (iniS, color, name, sub, pct, selected, subColor, pctColor) => selected
    ? `<div style="display:flex;align-items:center;gap:12px;padding:12px 8px;background:#F6E4E6;border-radius:10px;margin:6px 0"><div style="width:32px;height:32px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px">${iniS}</div><div style="flex:1"><div style="font-weight:800;font-size:14px">${name}</div><div style="font-size:11.5px;color:${subColor};font-weight:600">${sub}</div></div><div style="font-size:11.5px;font-weight:800;color:${pctColor}">${pct}</div></div>`
    : `<div style="display:flex;align-items:center;gap:12px;padding:12px 8px;border-bottom:1px solid #ECDCD6"><div style="width:32px;height:32px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px">${iniS}</div><div style="flex:1"><div style="font-weight:800;font-size:14px">${name}</div><div style="font-size:11.5px;color:${subColor};font-weight:600">${sub}</div></div><div style="font-size:11.5px;font-weight:800;color:${pctColor}">${pct}</div></div>`;
  return `
  <div style="padding:30px 40px;display:grid;grid-template-columns:1.1fr 1fr;gap:40px;align-items:start">
    <div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:16px"><div class="h" style="font-weight:500;font-size:28px">Integrantes <span style="font-size:15px;color:#B4A49A">18</span></div>${isAdmin() ? '<button class="pill" style="padding:8px 16px" onclick="A.open(\'integrante\')">+ Cadastrar</button>' : ''}</div>
      <input class="field" style="border-radius:99px;margin-bottom:14px" placeholder="🔍 Buscar integrante…">
      <div style="border-top:1px solid #ECDCD6">
        ${member('AL', '#C4798A', 'Ana Luiza Prado', '3 projetos · 2 novelos em casa', '92%', true, '#A05666', '#A05666')}
        ${member('B', '#7D9B76', 'Beatriz Gomes', '1 projeto', '83%', false, '#9A8A80', '#9A8A80')}
        ${member('C', '#C9B98F', 'Camila Rocha', '2 projetos', '75%', false, '#9A8A80', '#9A8A80')}
        ${member('F', '#8FA3B8', 'Fernanda Dias', '1 projeto', '100%', false, '#9A8A80', '#9A8A80')}
      </div>
    </div>
    <div class="card" style="border-radius:16px;padding:24px 26px">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px"><div style="width:52px;height:52px;border-radius:50%;background:#C4798A;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px">AL</div><div><div class="h" style="font-size:19px">Ana Luiza Prado</div><div style="font-size:12px;color:#9A8A80">@analuiza · desde 2025.1</div></div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div class="lbl">ENTREGAS NO SEMESTRE</div><div class="field" style="border-radius:99px;padding:6px 14px;font-weight:800;display:flex;gap:8px;cursor:pointer">2026.2 <span style="color:#B4A49A">▾</span></div></div>
      <div style="border:1px solid #ECDCD6;border-radius:12px;overflow:hidden;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:12px;padding:11px 14px"><span style="width:12px;height:12px;border-radius:3px;background:#DFA2AC"></span><span style="flex:1;font-size:13px;font-weight:600">Miolos de granny</span><b style="font-size:15px">24</b></div>
        <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-top:1px solid #ECDCD6"><span style="width:12px;height:12px;border-radius:3px;background:#7D9B76"></span><span style="flex:1;font-size:13px;font-weight:600">Bordas de granny</span><b style="font-size:15px">12</b></div>
        <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-top:1px solid #ECDCD6"><span style="width:12px;height:12px;border-radius:3px;background:#C08A2E"></span><span style="flex:1;font-size:13px;font-weight:600">Amigurumis</span><b style="font-size:15px">3</b></div>
        <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-top:1px solid #ECDCD6"><span style="width:12px;height:12px;border-radius:3px;background:#D98A96"></span><span style="flex:1;font-size:13px;font-weight:600">Itens de feira</span><b style="font-size:15px">2</b></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;background:#F6E4E6;border-radius:10px;padding:9px 12px;font-size:11.5px;color:#8E4B57;margin-bottom:16px">▦ Os 2 itens de feira também entraram no estoque da feira.</div>
      <div style="display:flex;gap:16px;align-items:center">
        <div style="flex:1"><div class="lbl" style="margin-bottom:6px">FREQUÊNCIA</div><div class="progress"><div style="width:92%"></div></div><div style="font-size:11px;color:#9A8A80;margin-top:4px">11/12 encontros · 92%</div></div>
        <div style="text-align:center;border-left:1px solid #ECDCD6;padding-left:16px"><div class="h" style="font-size:24px;color:#A05666">41</div><div style="font-size:10.5px;color:#9A8A80">entregas no semestre</div></div>
      </div>
    </div>
  </div>`;
}

function estoqueView() {
  const tab = ESTOQUE[S.estoTab];
  const tabs = ESTO_TABS.map(([k, label]) => {
    const on = k === S.estoTab;
    const st = on
      ? 'padding:7px 15px;border-radius:99px;background:#B96D7E;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer;white-space:nowrap'
      : 'padding:7px 15px;border-radius:99px;border:1px solid #DCC7BF;color:#61554D;font-weight:700;font-size:12.5px;cursor:pointer;white-space:nowrap';
    return `<div onclick="A.setEstoTab('${k}')" style="${st}">${label}</div>`;
  }).join('');
  const count = tab.rows.reduce((s, r) => s + (parseInt(r.disp) || 0), 0);
  const rows = tab.rows.map(r => {
    const dispBg = r.dTone === 'low' ? '#FBE4CE' : '#EAF0E6';
    const dispFg = r.dTone === 'low' ? '#9A7328' : '#55704E';
    const empr = r.empr === '—'
      ? '<span style="color:#CBB9AF;font-weight:700">—</span>'
      : `<span class="tag" style="background:#F6E4E6;color:#A05666">${r.empr}</span>`;
    return `
    <div style="display:grid;grid-template-columns:1.6fr 1.2fr .7fr .9fr;padding:13px 2px;border-bottom:1px solid #ECDCD6;font-size:13px;align-items:center">
      <div style="font-weight:800">${r.a}</div>
      <div style="display:flex;align-items:center;gap:8px;font-weight:600;color:#61554D">${r.dot ? `<span style="width:14px;height:14px;border-radius:50%;background:${r.dot};border:1px solid rgba(0,0,0,.08);flex:none"></span>` : ''}${r.det}</div>
      <div><span class="tag" style="background:${dispBg};color:${dispFg}">${r.disp}</span></div>
      <div style="font-size:12px">${empr}</div>
    </div>`;
  }).join('');
  return `
  <div style="padding:30px 40px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:22px">
      <div><div class="h" style="font-weight:500;font-size:28px">Estoque</div><div style="font-size:13px;color:#9A8A80;margin-top:4px">Materiais e itens do projeto, organizados por tipo</div></div>
      ${isAdmin() ? `<div style="display:flex;gap:10px"><button class="pill ghost" onclick="A.open('material')">+ Material</button><button class="pill ghost" onclick="A.open('devolucao')">Devolução</button><button class="pill" onclick="A.open('emprestimo')">+ Empréstimo</button></div>` : ''}
    </div>
    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">${tabs}</div>
    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:40px;align-items:start">
      <div>
        <div style="font-size:12.5px;color:#9A8A80;margin-bottom:12px"><b style="color:#3B342F">${count}</b> ${tab.unit} em estoque</div>
        <div style="display:grid;grid-template-columns:1.6fr 1.2fr .7fr .9fr;padding:8px 2px;border-bottom:1px solid #E2CFC8" class="lbl">${tab.cols.map(c => `<div>${c}</div>`).join('')}</div>
        ${rows}
      </div>
      <div>
        <div class="h" style="font-size:16px;margin-bottom:12px">Empréstimos ativos</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="card" style="padding:12px 14px"><div style="display:flex;justify-content:space-between;font-size:13px"><b>Ana Luiza</b><span style="font-size:11px;color:#B4A49A">30/06</span></div><div style="font-size:12px;color:#61554D;margin:3px 0 8px">2 novelos Balloon rosé · Primavera</div><div style="font-size:11.5px;font-weight:800;color:#A05666;cursor:pointer" onclick="A.open('devolucao')">Registrar devolução →</div></div>
          <div class="card" style="padding:12px 14px"><div style="display:flex;justify-content:space-between;font-size:13px"><b>Duda Ferreira</b><span style="font-size:11px;color:#B4A49A">21/06</span></div><div style="font-size:12px;color:#61554D;margin:3px 0 8px">3 novelos Mollet · Manta Nuvem</div><div style="font-size:11.5px;font-weight:800;color:#A05666;cursor:pointer" onclick="A.open('devolucao')">Registrar devolução →</div></div>
        </div>
      </div>
    </div>
  </div>`;
}

function bibliotecaView() {
  const cards = BIB_ITEMS.map(([name, catKey, sub, pages]) => {
    const c = BIB_CAT[catKey];
    const has = !!DET[name];
    return `
    <div class="card" ${has ? `onclick="A.openDetalhe('${name.replace(/'/g, "\\'")}')"` : ''} style="overflow:hidden;cursor:${has ? 'pointer' : 'default'};display:flex;flex-direction:column">
      <div style="height:5px;background:${c.accent}"></div>
      <div style="padding:16px 16px 14px;flex:1;display:flex;flex-direction:column">
        <span style="align-self:flex-start;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${c.fg};background:${c.chip};padding:4px 10px;border-radius:99px">${c.lbl}</span>
        <div style="font-weight:700;font-size:15px;line-height:1.25;margin:12px 0 4px">${name}</div>
        <div style="font-size:12px;color:#9A8A80">${sub} · ${pages}</div>
        <div style="flex:1"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:16px;padding-top:12px;border-top:1px solid #F2E4DE">
          <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#A05666;white-space:nowrap">${icons.pdf}PDF</span>
          ${has ? `<span style="font-size:12px;font-weight:700;color:${c.fg};white-space:nowrap">Abrir →</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  return `
  <div style="padding:30px 40px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:20px"><div class="h" style="font-weight:500;font-size:28px">Biblioteca</div>${isAdmin() ? `<div style="display:flex;gap:10px"><button class="pill ghost" style="white-space:nowrap" onclick="A.openGranny(null)">+ Granny</button><button class="pill ghost" style="white-space:nowrap" onclick="A.openFaixa(null)">+ Faixa</button><button class="pill" style="white-space:nowrap" onclick="A.open('receita')">+ Receita</button></div>` : ''}</div>
    <div style="display:flex;gap:10px;margin-bottom:22px;align-items:center">
      <input class="field" style="flex:1;border-radius:99px" placeholder="🔍 Buscar receita ou padrão…">
      <span class="tag" style="background:#B96D7E;color:#fff;padding:6px 14px;white-space:nowrap">Todos</span>
      <span class="tag" style="border:1px solid #DCC7BF;color:#61554D;padding:6px 14px;white-space:nowrap">Amigurumis</span>
      <span class="tag" style="border:1px solid #DCC7BF;color:#61554D;padding:6px 14px;white-space:nowrap">Granny</span>
      <span class="tag" style="border:1px solid #DCC7BF;color:#61554D;padding:6px 14px;white-space:nowrap">Faixas</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
      ${cards}
      <div onclick="A.open('receita')" style="border:2px dashed #DCC7BF;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#B4A49A;cursor:pointer;min-height:150px"><div style="font-size:22px">+</div><div style="font-size:12px;font-weight:700;text-align:center">Adicionar<br>receita ou padrão</div></div>
    </div>
  </div>`;
}

function presencaView() {
  const chamada = CHAMADA.map(([name, color, present]) => `
    <div style="display:flex;align-items:center;gap:12px;padding:11px 2px;border-bottom:1px solid #ECDCD6"><div style="width:26px;height:26px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px">${ini(name)}</div><div style="flex:1;font-weight:700;font-size:13.5px">${name}</div>${present ? '<div style="width:22px;height:22px;border-radius:50%;background:#B96D7E;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800">✓</div>' : '<div style="width:22px;height:22px;border-radius:50%;border:1.5px dashed #DCC7BF"></div>'}</div>`).join('');
  return `
  <div style="padding:30px 40px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:22px"><div><div class="h" style="font-weight:500;font-size:28px">Presença</div><div style="font-size:13px;color:#9A8A80;margin-top:4px">12 encontros no semestre · média de 14 presentes</div></div>${isAdmin() ? '<button class="pill" onclick="A.open(\'encontro\')">+ Novo encontro</button>' : ''}</div>
    <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:40px;align-items:start">
      <div>
        <div style="border:1px solid #E3C6CB;background:#F6E4E6;border-radius:14px;padding:16px 18px;margin-bottom:16px"><div class="lbl" style="color:#A05666">PRÓXIMO ENCONTRO</div><div class="h" style="font-size:20px;margin:6px 0 2px">Terça, 14 de julho · 14h</div><div style="font-size:12.5px;color:#8E6B70">Sala 203 · pauta: montagem da Manta Primavera</div></div>
        <div class="h" style="font-size:16px;margin-bottom:10px">Encontros anteriores</div>
        <div style="border-top:1px solid #ECDCD6">
          <div style="display:flex;align-items:center;gap:14px;padding:13px 2px;border-bottom:1px solid #ECDCD6"><div style="font-weight:800;font-size:13.5px;width:74px">07 jul</div><div class="progress" style="flex:1"><div style="width:89%"></div></div><div style="font-size:12px;font-weight:800;color:#A05666;width:88px;text-align:right">16 presentes</div></div>
          <div style="display:flex;align-items:center;gap:14px;padding:13px 2px;border-bottom:1px solid #ECDCD6"><div style="font-weight:800;font-size:13.5px;width:74px">30 jun</div><div class="progress" style="flex:1"><div style="width:78%;background:#D8A3AE"></div></div><div style="font-size:12px;font-weight:700;color:#9A8A80;width:88px;text-align:right">14 presentes</div></div>
          <div style="display:flex;align-items:center;gap:14px;padding:13px 2px;border-bottom:1px solid #ECDCD6"><div style="font-weight:800;font-size:13.5px;width:74px">23 jun</div><div class="progress" style="flex:1"><div style="width:67%;background:#D8A3AE"></div></div><div style="font-size:12px;font-weight:700;color:#9A8A80;width:88px;text-align:right">12 presentes</div></div>
        </div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px"><div class="h" style="font-size:16px">Chamada · 07 jul</div><div style="font-size:12px;font-weight:700;color:#9A8A80">16/18 presentes</div></div>
        <div style="border-top:1px solid #ECDCD6">${chamada}</div>
      </div>
    </div>
  </div>`;
}

function financeiroView() {
  return `
  <div style="padding:30px 40px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px"><div><div class="h" style="font-weight:500;font-size:28px">Financeiro</div><div style="font-size:12.5px;color:#9A8A80;margin-top:3px">Caixa do projeto · semestre 2026.2</div></div>${isAdmin() ? `<div style="display:flex;gap:10px"><button class="pill ghost" onclick="A.openFin('saida')">↓ Saída</button><button class="pill" onclick="A.openFin('entrada')">↑ Entrada</button></div>` : ''}</div>
    <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:14px;margin-bottom:28px">
      <div style="border:1px solid #E3C6CB;border-radius:16px;background:#F6E4E6;padding:20px 22px"><div class="lbl" style="color:#A05666">SALDO ATUAL</div><div class="h" style="font-size:34px;color:#8E4B57;margin-top:4px">R$ 1.240,50</div></div>
      <div class="card" style="border-radius:16px;padding:20px 22px"><div class="lbl">ENTRADAS · MÊS</div><div class="h" style="font-size:26px;color:#55704E;margin-top:6px">+ R$ 680</div></div>
      <div class="card" style="border-radius:16px;padding:20px 22px"><div class="lbl">SAÍDAS · MÊS</div><div class="h" style="font-size:26px;color:#A05666;margin-top:6px">− R$ 240</div></div>
    </div>
    <div class="h" style="font-size:16px;margin-bottom:10px">Movimentações</div>
    <div class="card" style="overflow:hidden">
      <div style="display:grid;grid-template-columns:.9fr 2.4fr 1.2fr 1fr;padding:9px 20px;background:#FBF4EF;border-bottom:1px solid #F2E4DE" class="lbl"><div>DATA</div><div>DESCRIÇÃO</div><div>CATEGORIA</div><div style="text-align:right">VALOR</div></div>
      <div style="display:grid;grid-template-columns:.9fr 2.4fr 1.2fr 1fr;padding:13px 20px;border-bottom:1px solid #F2E4DE;font-size:13px;align-items:center"><div style="color:#9A8A80;font-weight:700">08 jul</div><div style="font-weight:700">Bazar beneficente</div><div><span class="tag" style="background:#EAF0E6;color:#55704E">doação</span></div><div style="text-align:right;font-weight:800;color:#55704E">+ 420,00</div></div>
      <div style="display:grid;grid-template-columns:.9fr 2.4fr 1.2fr 1fr;padding:13px 20px;border-bottom:1px solid #F2E4DE;font-size:13px;align-items:center"><div style="color:#9A8A80;font-weight:700">05 jul</div><div style="font-weight:700">12 novelos Círculo Balloon</div><div><span class="tag" style="background:#F6E4E6;color:#A05666">material</span></div><div style="text-align:right;font-weight:800;color:#A05666">− 240,00</div></div>
      <div style="display:grid;grid-template-columns:.9fr 2.4fr 1.2fr 1fr;padding:13px 20px;font-size:13px;align-items:center"><div style="color:#9A8A80;font-weight:700">02 jul</div><div style="font-weight:700">Doação — Profa. Regina</div><div><span class="tag" style="background:#EAF0E6;color:#55704E">doação</span></div><div style="text-align:right;font-weight:800;color:#55704E">+ 260,00</div></div>
    </div>
  </div>`;
}

function perfilView() {
  return `
  <div style="padding:30px 44px;max-width:760px">
    <div class="crumb" onclick="A.go('dashboard')" style="margin-bottom:10px">‹ Voltar</div>
    <div class="h" style="font-weight:500;font-size:28px;margin-bottom:22px">Meu perfil</div>
    <div style="display:flex;align-items:center;gap:18px;padding-bottom:24px;border-bottom:1px solid #ECDCD6;margin-bottom:24px">
      <div style="width:66px;height:66px;border-radius:50%;background:#C4798A;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px">R</div>
      <div><div class="h" style="font-size:19px">Regina Almeida</div><div style="font-size:12.5px;color:#9A8A80">@regina.prof · ${S.papel}</div><div style="font-size:12px;font-weight:800;color:#A05666;margin-top:6px;cursor:pointer">Trocar foto</div></div>
    </div>
    <div class="grid2" style="margin-bottom:24px">
      <div><div class="lbl" style="margin-bottom:7px">NOME COMPLETO</div><input class="field" value="Regina Almeida"></div>
      <div><div class="lbl" style="margin-bottom:7px">USUÁRIO</div><div class="field" style="background:#F1EAE4;color:#9A8A80;display:flex;justify-content:space-between">regina.prof <span style="font-size:11px">🔒</span></div></div>
      <div><div class="lbl" style="margin-bottom:7px">TELEFONE / WHATSAPP</div><input class="field" value="(11) 9 9999-0000"></div>
      <div><div class="lbl" style="margin-bottom:7px">PREFERÊNCIA</div><div class="field" style="display:flex;justify-content:space-between">Crochê e tricô<span style="color:#B4A49A">▾</span></div></div>
    </div>
    <div class="h" style="font-size:16px;margin-bottom:10px">Segurança</div>
    <div class="card" style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <div><div style="font-weight:700;font-size:13.5px">Senha</div><div style="font-size:12px;color:#9A8A80">Alterada há 2 meses</div></div>
      <button class="pill ghost">Alterar senha</button>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="pill ghost" onclick="A.go('dashboard')">Cancelar</button>
      <button class="pill" onclick="A.go('dashboard')">Salvar alterações</button>
    </div>
  </div>`;
}

function configView() {
  const rows = S.perms.map((p, pi) => `
    <div style="display:grid;grid-template-columns:1.6fr repeat(4,1fr);padding:13px 18px;border-top:1px solid #F2E4DE;align-items:center;font-size:13px">
      <div style="display:flex;align-items:center;gap:10px"><div style="width:28px;height:28px;border-radius:50%;background:${p[2]};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px">${p[0]}</div><b>${p[1]}</b></div>
      ${p[3].map((v, ti) => `<div style="text-align:center"><span class="sw" onclick="A.togglePerm(${pi},${ti})" style="background:${v ? '#B96D7E' : '#E7DCCF'};cursor:pointer"><span style="${v ? 'right:2px' : 'left:2px'}"></span></span></div>`).join('')}
    </div>`).join('');
  return `
  <div style="padding:30px 40px;display:grid;grid-template-columns:180px 1fr;gap:34px;align-items:start">
    <div style="font-size:13px;display:flex;flex-direction:column;gap:4px">
      <div class="h" style="font-weight:500;font-size:26px;margin-bottom:12px">Ajustes</div>
      <div style="padding:8px 12px;border-radius:10px;background:#F6E4E6;color:#A05666;font-weight:800">Permissões</div>
      <div style="padding:8px 12px;color:#9A8A80;font-weight:700">Projeto</div>
      <div style="padding:8px 12px;color:#9A8A80;font-weight:700">Encontros</div>
    </div>
    <div>
      <div class="h" style="font-size:18px;margin-bottom:4px">Permissões das integrantes</div>
      <div style="font-size:12.5px;color:#9A8A80;margin-bottom:8px">Defina o que cada integrante pode editar. O perfil de administradora é fixo.</div>
      <div style="display:flex;align-items:center;gap:8px;background:#FBEEE9;border:1px solid #E3C6CB;border-radius:10px;padding:9px 13px;font-size:12px;color:#8E4B57;margin-bottom:20px">🔒 Apenas administradoras alteram permissões.</div>
      <div class="card" style="border-radius:14px;overflow:hidden">
        <div style="display:grid;grid-template-columns:1.6fr repeat(4,1fr);padding:10px 18px;background:#FBF4EF;font-size:10px;font-weight:800;letter-spacing:.4px;color:#B4A49A"><div>INTEGRANTE</div><div style="text-align:center">PROGRESSO</div><div style="text-align:center">DEVOLUÇÕES</div><div style="text-align:center">COMENTÁRIOS</div><div style="text-align:center">FINANCEIRO</div></div>
        ${rows}
      </div>
    </div>
  </div>`;
}

// ---------- Modais ----------
function modalHeader(title, sub) {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><div class="h" style="font-size:22px">${title}</div><button class="x" onclick="A.close()">×</button></div>
  <div style="font-size:12.5px;color:#9A8A80;margin-bottom:20px">${sub}</div>`;
}
function modalFooter(okLabel, cancelLabel) {
  return `<div style="display:flex;gap:10px;justify-content:flex-end"><button class="pill ghost" onclick="A.close()">${cancelLabel || 'Cancelar'}</button><button class="pill" onclick="A.close()">${okLabel}</button></div>`;
}
const fieldSelect = (val) => `<div class="field" style="display:flex;justify-content:space-between">${val}<span style="color:#B4A49A">▾</span></div>`;
const fieldStepper = (val) => `<div class="field" style="display:flex;justify-content:space-between;align-items:center"><span>${val}</span><span style="color:#B4A49A;font-weight:800">− +</span></div>`;

function modalProjeto() {
  const cardOn = 'border:1px solid #E3C6CB;background:#F6E4E6;border-radius:12px;padding:14px 16px;cursor:pointer;color:#A05666';
  const cardAmigOn = 'border:1px solid #E0D3BC;background:#FBF3E4;border-radius:12px;padding:14px 16px;cursor:pointer;color:#9A7328';
  const cardOff = 'border:1px solid #DCC7BF;border-radius:12px;padding:14px 16px;cursor:pointer;color:#3B342F';
  const tec = (on, c) => on
    ? `flex:1;text-align:center;padding:9px;border-radius:10px;background:${c};color:#fff;cursor:pointer;font-size:12px;font-weight:700`
    : 'flex:1;text-align:center;padding:9px;border-radius:10px;border:1px solid #DCC7BF;color:#61554D;cursor:pointer;font-size:12px;font-weight:700';
  const manta = S.projCat === 'manta';
  let body = '';
  if (manta) {
    let tecBody = '';
    if (S.projTec === 'croche') {
      tecBody = `
      <div class="lbl" style="margin-bottom:9px">PADRÕES DE GRANNY SQUARE</div>
      <div class="card" style="overflow:hidden;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid #F2E4DE;font-size:13px"><div style="width:34px;height:34px;border-radius:8px;background:repeating-linear-gradient(-45deg,#F6E4E6 0 5px,#F1D8DB 5px 10px);flex:none"></div><div style="flex:1"><div style="font-weight:700">Modelo A — Flor de Maio</div><div style="display:flex;gap:5px;margin-top:6px"><span style="width:13px;height:13px;border-radius:50%;background:#DFA2AC"></span><span style="width:13px;height:13px;border-radius:50%;background:#A9BFA3"></span><span style="width:13px;height:13px;border-radius:50%;background:#F0E3C8"></span></div></div><span style="border:1px solid #DCC7BF;border-radius:8px;padding:4px 12px;font-weight:800;color:#A05666">40</span></div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid #F2E4DE;font-size:13px"><div style="width:34px;height:34px;border-radius:8px;background:repeating-linear-gradient(-45deg,#EFE7F2 0 5px,#E3D6EC 5px 10px);flex:none"></div><div style="flex:1"><div style="font-weight:700">Modelo B — Sunburst</div><div style="display:flex;gap:5px;margin-top:6px"><span style="width:13px;height:13px;border-radius:50%;background:#B99BC4"></span><span style="width:13px;height:13px;border-radius:50%;background:#E3C07A"></span><span style="width:13px;height:13px;border-radius:50%;background:#DFA2AC"></span></div></div><span style="border:1px solid #DCC7BF;border-radius:8px;padding:4px 12px;font-weight:800;color:#A05666">24</span></div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;font-size:13px"><div style="width:34px;height:34px;border-radius:8px;background:repeating-linear-gradient(-45deg,#EAF0E6 0 5px,#DEE8D8 5px 10px);flex:none"></div><div style="flex:1"><div style="font-weight:700">Modelo C — Clássico</div><div style="display:flex;gap:5px;margin-top:6px"><span style="width:13px;height:13px;border-radius:50%;background:#A9BFA3"></span><span style="width:13px;height:13px;border-radius:50%;background:#7D9B76"></span><span style="width:13px;height:13px;border-radius:50%;background:#F0E3C8"></span></div></div><span style="border:1px solid #DCC7BF;border-radius:8px;padding:4px 12px;font-weight:800;color:#A05666">16</span></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><div style="display:flex;gap:16px"><span onclick="A.openGranny('projeto')" style="font-size:12px;font-weight:800;color:#A05666;cursor:pointer">+ Criar padrão de granny</span><span onclick="A.openLayout('projeto')" style="font-size:12px;font-weight:800;color:#55704E;cursor:pointer">▦ Organizar quadrados na manta</span></div><span style="font-size:12.5px;color:#9A8A80">Total: <b style="color:#3B342F">80 squares</b></span></div>`;
    } else {
      tecBody = `
      <div style="background:#EEF3EA;border:1px solid #D8E0D2;border-radius:12px;padding:14px 16px;margin-bottom:20px">
        <div style="font-size:12px;color:#5E6E55;margin-bottom:12px">As faixas de tricô usam o mesmo padrão — defina a <b>quantidade</b> e as <b>cores</b>.</div>
        <div class="grid2">
          <div><div class="lbl" style="margin-bottom:7px">FAIXAS</div>${fieldStepper('8')}</div>
          <div><div class="lbl" style="margin-bottom:7px">CORES</div><div class="field" style="display:flex;align-items:center;gap:6px"><span style="width:16px;height:16px;border-radius:50%;background:#A9BFA3"></span><span style="width:16px;height:16px;border-radius:50%;background:#DFA2AC"></span><span style="width:16px;height:16px;border-radius:50%;background:#F0E3C8"></span></div></div>
        </div>
        <div onclick="A.openFaixa('projeto')" style="margin-top:12px;font-size:12px;font-weight:800;color:#55704E;cursor:pointer">+ Editar padrão de cores das faixas</div>
      </div>`;
    }
    body = `
    <div class="grid2" style="margin-bottom:18px">
      <div><div class="lbl" style="margin-bottom:7px">TÉCNICA</div><div style="display:flex;gap:6px"><span onclick="A.setProjTec('croche')" style="${tec(S.projTec === 'croche', '#B96D7E')}">Crochê</span><span onclick="A.setProjTec('trico')" style="${tec(S.projTec === 'trico', '#55704E')}">Tricô</span></div></div>
      <div><div class="lbl" style="margin-bottom:7px">DESTINO</div>${fieldSelect('Hospital Infantil')}</div>
    </div>
    ${tecBody}`;
  } else {
    body = `
    <div class="grid2" style="margin-bottom:18px">
      <div><div class="lbl" style="margin-bottom:7px">RECEITA</div>${fieldSelect('Capivara da Lú')}</div>
      <div><div class="lbl" style="margin-bottom:7px">DESTINO</div>${fieldSelect('Dia das Crianças')}</div>
    </div>
    <div class="grid2" style="margin-bottom:18px">
      <div><div class="lbl" style="margin-bottom:7px">META DE UNIDADES</div>${fieldStepper('12')}</div>
      <div><div class="lbl" style="margin-bottom:7px">FIO PRINCIPAL</div><div class="field" style="display:flex;align-items:center;gap:8px"><span style="width:14px;height:14px;border-radius:50%;background:#8B6A4F"></span>Soft · marrom</div></div>
    </div>
    <div class="lbl" style="margin-bottom:9px">RESPONSÁVEIS</div>
    <div class="card" style="overflow:hidden;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid #F2E4DE;font-size:13px"><div style="width:28px;height:28px;border-radius:50%;background:#C4798A;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;flex:none">AL</div><span style="flex:1;font-weight:700">Ana Luiza</span><span style="border:1px solid #DCC7BF;border-radius:8px;padding:4px 12px;font-weight:800;color:#9A7328">3</span></div>
      <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid #F2E4DE;font-size:13px"><div style="width:28px;height:28px;border-radius:50%;background:#7D9B76;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;flex:none">B</div><span style="flex:1;font-weight:700">Beatriz</span><span style="border:1px solid #DCC7BF;border-radius:8px;padding:4px 12px;font-weight:800;color:#9A7328">3</span></div>
      <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;font-size:13px"><div style="width:28px;height:28px;border-radius:50%;background:#C9B98F;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;flex:none">C</div><span style="flex:1;font-weight:700">Camila</span><span style="border:1px solid #DCC7BF;border-radius:8px;padding:4px 12px;font-weight:800;color:#9A7328">4</span></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><span style="font-size:12px;font-weight:800;color:#A05666;cursor:pointer">+ Adicionar integrante</span><span style="font-size:12.5px;color:#9A8A80">Distribuídas: <b style="color:#3B342F">10 de 12</b></span></div>`;
  }
  return `
  <div class="modal" style="max-width:600px" onclick="event.stopPropagation()">
    ${modalHeader('Novo projeto', 'Defina o tipo para configurar a produção')}
    <div class="grid2" style="gap:10px;margin-bottom:20px">
      <div onclick="A.setProjCat('manta')" style="${manta ? cardOn : cardOff}"><div style="font-weight:800;font-size:14px">Manta</div><div style="font-size:11.5px;margin-top:2px">dividida entre integrantes</div></div>
      <div onclick="A.setProjCat('amig')" style="${!manta ? cardAmigOn : cardOff}"><div style="font-weight:800;font-size:14px">Amigurumi</div><div style="font-size:11.5px;margin-top:2px">unidades por integrante</div></div>
    </div>
    <div class="lbl" style="margin-bottom:7px">${manta ? 'NOME DO PROJETO' : 'NOME DO TIPO'}</div>
    <input class="field" style="margin-bottom:18px" value="${manta ? 'Manta Primavera' : 'Amigurumi Capivara'}">
    ${body}
    ${modalFooter('Criar projeto')}
  </div>`;
}

function modalFin() {
  const entrada = S.finKind === 'entrada';
  const box = (on, bg, bd, c) => on
    ? `flex:1;text-align:center;padding:12px;border-radius:12px;background:${bg};border:1px solid ${bd};font-weight:800;font-size:13.5px;color:${c};cursor:pointer`
    : 'flex:1;text-align:center;padding:12px;border-radius:12px;border:1px solid #DCC7BF;font-weight:700;font-size:13.5px;color:#9A8A80;cursor:pointer';
  return `
  <div class="modal" style="max-width:520px" onclick="event.stopPropagation()">
    ${modalHeader('Nova movimentação', 'Caixa do projeto · saldo atual R$ 1.240,50')}
    <div style="display:flex;gap:10px;margin-bottom:20px">
      <div onclick="A.setFinKind('entrada')" style="${box(entrada, '#EAF0E6', '#B9C9B2', '#55704E')}">↑ Entrada</div>
      <div onclick="A.setFinKind('saida')" style="${box(!entrada, '#FBEEE9', '#E3C6CB', '#A05666')}">↓ Saída</div>
    </div>
    <div class="lbl" style="margin-bottom:7px">VALOR</div>
    <div class="field h" style="font-size:20px;color:${entrada ? '#55704E' : '#A05666'};margin-bottom:18px">R$ 420,00</div>
    <div class="lbl" style="margin-bottom:7px">DESCRIÇÃO</div>
    <input class="field" style="margin-bottom:18px" value="Bazar beneficente da faculdade">
    <div class="grid2" style="margin-bottom:24px">
      <div><div class="lbl" style="margin-bottom:7px">CATEGORIA</div>${fieldSelect('Doação')}</div>
      <div><div class="lbl" style="margin-bottom:7px">DATA</div><input class="field" value="08/07/2026"></div>
    </div>
    ${modalFooter(entrada ? 'Registrar entrada' : 'Registrar saída')}
  </div>`;
}

function modalMaterial() {
  return `
  <div class="modal" style="max-width:560px" onclick="event.stopPropagation()">
    ${modalHeader('Novo material', 'Adicionar ao estoque coletivo')}
    <div class="lbl" style="margin-bottom:7px">TIPO</div>
    <div style="display:flex;gap:8px;margin-bottom:18px"><div class="seg" style="background:#B96D7E;color:#fff;border-color:#B96D7E">Novelo</div><div class="seg">Agulha</div><div class="seg">Enchimento</div><div class="seg">Outro</div></div>
    <div class="grid2" style="margin-bottom:18px">
      <div><div class="lbl" style="margin-bottom:7px">MARCA / LINHA</div><input class="field" value="Círculo Balloon"></div>
      <div><div class="lbl" style="margin-bottom:7px">COR</div><div class="field" style="display:flex;align-items:center;gap:8px"><span style="width:14px;height:14px;border-radius:50%;background:#DFA2AC"></span>rosé</div></div>
    </div>
    <div class="grid2" style="margin-bottom:24px">
      <div><div class="lbl" style="margin-bottom:7px">QUANTIDADE</div>${fieldStepper('12')}</div>
      <div><div class="lbl" style="margin-bottom:7px">CUSTO UNIT.</div><input class="field" placeholder="R$ 0,00"></div>
    </div>
    ${modalFooter('Adicionar ao estoque')}
  </div>`;
}

function modalReceita() {
  return `
  <div class="modal" style="max-width:560px" onclick="event.stopPropagation()">
    ${modalHeader('Adicionar à biblioteca', 'Receita de amigurumi ou padrão de manta')}
    <div class="lbl" style="margin-bottom:7px">CATEGORIA</div>
    <div style="display:flex;gap:8px;margin-bottom:18px"><div class="seg" style="background:#B96D7E;color:#fff;border-color:#B96D7E">Amigurumi</div><div class="seg">Granny square</div><div class="seg">Faixa de tricô</div></div>
    <div class="lbl" style="margin-bottom:7px">NOME</div>
    <input class="field" style="margin-bottom:18px" value="Capivara da Lú">
    <div class="grid2" style="margin-bottom:18px">
      <div><div class="lbl" style="margin-bottom:7px">IMAGEM</div><div style="border:2px dashed #DCC7BF;border-radius:12px;padding:18px;text-align:center;font-size:12px;color:#B4A49A;font-weight:700">📷 Arraste ou selecione</div></div>
      <div><div class="lbl" style="margin-bottom:7px">PDF</div><div style="border:2px dashed #DCC7BF;border-radius:12px;padding:18px;text-align:center;font-size:12px;color:#B4A49A;font-weight:700">📄 Anexar PDF</div></div>
    </div>
    <div class="lbl" style="margin-bottom:7px">OBSERVAÇÕES</div>
    <textarea class="field" style="min-height:52px;margin-bottom:24px;resize:vertical" placeholder="Ex.: usar fio 4mm, olhos de segurança 9mm…"></textarea>
    ${modalFooter('Salvar na biblioteca')}
  </div>`;
}

function modalEmprestimo() {
  return `
  <div class="modal" style="max-width:520px" onclick="event.stopPropagation()">
    ${modalHeader('Registrar empréstimo', 'Saída de novelos para uma integrante levar para casa')}
    <div class="lbl" style="margin-bottom:7px">INTEGRANTE</div>
    <div class="field" style="display:flex;justify-content:space-between;margin-bottom:18px">Ana Luiza Prado<span style="color:#B4A49A">▾</span></div>
    <div class="lbl" style="margin-bottom:7px">MATERIAL</div>
    <div class="field" style="display:flex;align-items:center;gap:8px;margin-bottom:18px"><span style="width:14px;height:14px;border-radius:50%;background:#DFA2AC"></span>Círculo Balloon · rosé <span style="margin-left:auto;color:#B4A49A">▾</span></div>
    <div class="grid2" style="margin-bottom:24px">
      <div><div class="lbl" style="margin-bottom:7px">QUANTIDADE</div>${fieldStepper('2')}</div>
      <div><div class="lbl" style="margin-bottom:7px">PROJETO</div>${fieldSelect('Primavera')}</div>
    </div>
    ${modalFooter('Registrar empréstimo')}
  </div>`;
}

function modalDevolucao() {
  return `
  <div class="modal" style="max-width:520px" onclick="event.stopPropagation()">
    ${modalHeader('Registrar devolução', 'Selecione o empréstimo a encerrar')}
    <div class="card" style="padding:13px 15px;margin-bottom:10px;border-color:#E3C6CB;background:#FBEEE9;display:flex;align-items:center;gap:12px"><span style="width:18px;height:18px;border-radius:50%;background:#B96D7E;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">✓</span><div style="flex:1"><div style="font-weight:800;font-size:13.5px">Ana Luiza · 2 novelos Balloon rosé</div><div style="font-size:11.5px;color:#9A8A80">Primavera · emprestado 30/06</div></div></div>
    <div class="card" style="padding:13px 15px;margin-bottom:20px;display:flex;align-items:center;gap:12px"><span style="width:18px;height:18px;border-radius:50%;border:1.5px solid #DCC7BF"></span><div style="flex:1"><div style="font-weight:800;font-size:13.5px">Duda Ferreira · 3 novelos Mollet</div><div style="font-size:11.5px;color:#9A8A80">Manta Nuvem · emprestado 21/06</div></div></div>
    <div class="lbl" style="margin-bottom:7px">QUANTIDADE DEVOLVIDA</div>
    <div class="field" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px"><span>2 de 2</span><span style="color:#B4A49A;font-weight:800">− +</span></div>
    ${modalFooter('Confirmar devolução')}
  </div>`;
}

function modalProducao() {
  return `
  <div class="modal" style="max-width:520px" onclick="event.stopPropagation()">
    ${modalHeader('Registrar produção', 'Manta Primavera · quem fez o quê')}
    <div class="grid2" style="margin-bottom:18px">
      <div><div class="lbl" style="margin-bottom:7px">PADRÃO / LOTE</div>${fieldSelect('Modelo A')}</div>
      <div><div class="lbl" style="margin-bottom:7px">QUANTIDADE</div>${fieldStepper('4')}</div>
    </div>
    <div class="lbl" style="margin-bottom:7px">ETAPA CONCLUÍDA</div>
    <div style="display:flex;gap:8px;margin-bottom:18px"><div class="seg">Miolo</div><div class="seg" style="background:#B96D7E;color:#fff;border-color:#B96D7E">Borda</div><div class="seg">Pronto</div></div>
    <div class="lbl" style="margin-bottom:7px">RESPONSÁVEL</div>
    <div class="field" style="display:flex;align-items:center;gap:8px;margin-bottom:24px"><span style="width:22px;height:22px;border-radius:50%;background:#7D9B76;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800">B</span>Beatriz Gomes<span style="margin-left:auto;color:#B4A49A">▾</span></div>
    ${modalFooter('Registrar')}
  </div>`;
}

function modalIntegrante() {
  return `
  <div class="modal" style="max-width:520px" onclick="event.stopPropagation()">
    ${modalHeader('Cadastrar integrante', 'Ela receberá um usuário para acessar o sistema')}
    <div class="grid2" style="margin-bottom:18px">
      <div><div class="lbl" style="margin-bottom:7px">NOME COMPLETO</div><input class="field" value="Giulia Santos"></div>
      <div><div class="lbl" style="margin-bottom:7px">USUÁRIO</div><input class="field" value="giulia.santos"></div>
    </div>
    <div class="grid2" style="margin-bottom:18px">
      <div><div class="lbl" style="margin-bottom:7px">TELEFONE / WHATSAPP</div><input class="field" value="(11) 9 8888-0000"></div>
      <div><div class="lbl" style="margin-bottom:7px">PREFERÊNCIA</div>${fieldSelect('Crochê')}</div>
    </div>
    <div class="lbl" style="margin-bottom:7px">PERFIL</div>
    <div style="display:flex;gap:8px;margin-bottom:24px"><div class="seg" style="background:#B96D7E;color:#fff;border-color:#B96D7E">Integrante</div><div class="seg">Administradora</div></div>
    ${modalFooter('Cadastrar')}
  </div>`;
}

function modalEncontro() {
  return `
  <div class="modal" style="max-width:520px" onclick="event.stopPropagation()">
    ${modalHeader('Novo encontro', 'Abre a chamada e a pauta do dia')}
    <div class="grid2" style="margin-bottom:18px">
      <div><div class="lbl" style="margin-bottom:7px">DATA</div><input class="field" value="14/07/2026"></div>
      <div><div class="lbl" style="margin-bottom:7px">HORÁRIO</div><input class="field" value="14:00"></div>
    </div>
    <div class="lbl" style="margin-bottom:7px">SALA</div>
    <input class="field" style="margin-bottom:18px" value="Sala 203">
    <div class="lbl" style="margin-bottom:7px">PAUTA</div>
    <textarea class="field" style="min-height:52px;margin-bottom:24px;resize:vertical">Montagem da Manta Primavera</textarea>
    ${modalFooter('Criar encontro')}
  </div>`;
}

function modalGranny() {
  const rings = S.grannyRings;
  const total = rings.reduce((s, r) => s + r.n, 0);
  const nameOf = i => i === 0 ? ' · miolo' : (i === rings.length - 1 ? ' · borda' : '');
  const list = rings.map((r, i) => `
    <div style="display:flex;align-items:center;gap:10px;border:1px solid #DCC7BF;border-radius:12px;background:#FFFDFB;padding:9px 12px;margin-bottom:7px">
      <span style="width:20px;height:20px;border-radius:50%;background:${r.c};border:1px solid rgba(0,0,0,.1);flex:none"></span>
      <span style="flex:1;font-size:13px;font-weight:600">${r.name}${nameOf(i)}</span>
      <span onclick="A.grannyDec(${i})" style="cursor:pointer;color:#B4A49A;font-weight:800;font-size:16px;padding:0 4px">−</span>
      <span style="border:1px solid #DCC7BF;border-radius:8px;padding:3px 11px;font-size:13px;font-weight:800;color:#A05666;min-width:26px;text-align:center">${r.n}</span>
      <span onclick="A.grannyInc(${i})" style="cursor:pointer;color:#A05666;font-weight:800;font-size:16px;padding:0 4px">+</span>
      ${rings.length > 1 ? `<span onclick="A.grannyDel(${i})" style="cursor:pointer;color:#CBB9AF;font-size:15px">✕</span>` : ''}
    </div>`).join('');
  const palette = PALETTE.map(([c, name]) => `<span onclick="A.grannySetColor('${c}','${name}')" title="${name}" style="width:22px;height:22px;border-radius:50%;background:${c};border:1px solid rgba(0,0,0,.12);cursor:pointer"></span>`).join('');
  // prévia: quadrados concêntricos, borda (última) por fora → miolo (primeira) no centro
  const n = rings.length;
  const preview = rings.map((r, i) => ({ c: r.c, sz: 128 - (n - 1 - i) * (104 / n) })).reverse()
    .map(ring => `<div style="position:absolute;width:${ring.sz}px;height:${ring.sz}px;background:${ring.c}"></div>`).join('');
  return `
  <div class="modal" style="max-width:580px" onclick="event.stopPropagation()">
    ${modalHeader('Padrão de granny square', 'Vai para a biblioteca e pode ser usado em qualquer manta')}
    <div class="lbl" style="margin-bottom:7px">NOME</div>
    <input class="field" style="margin-bottom:20px" value="Modelo A — Flor de Maio">
    <div style="display:flex;gap:22px;align-items:flex-start">
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span class="lbl">COR · DO CENTRO P/ FORA</span><span class="lbl">CARREIRAS</span></div>
        ${list}
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 4px">${palette}</div>
        <div onclick="A.grannyAdd()" style="font-size:12.5px;font-weight:800;color:#A05666;padding:6px 2px;cursor:pointer">+ Adicionar cor</div>
        <div style="border-top:1px dashed #DCC7BF;margin-top:6px;padding-top:10px;display:flex;justify-content:space-between;font-size:13px"><span style="color:#9A8A80;font-weight:700">Total de carreiras</span><b class="h" style="font-size:16px">${total}</b></div>
      </div>
      <div style="width:140px;flex:none">
        <div class="lbl" style="margin-bottom:8px">PRÉVIA</div>
        <div style="width:128px;height:128px;position:relative;display:flex;align-items:center;justify-content:center;border-radius:6px;overflow:hidden;background:#F1EAE4">${preview}</div>
        <div style="font-size:10.5px;color:#9A8A80;text-align:center;margin-top:8px">anéis do centro → borda</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:22px"><button class="pill ghost" onclick="A.backToProjeto()">Voltar</button><button class="pill" onclick="A.backToProjeto()">Salvar padrão</button></div>
  </div>`;
}

function modalFaixa() {
  const cells = S.faixaSeq.map((c, i) => `<div onclick="A.faixaCycle(${i})" style="width:36px;height:34px;background:${c};cursor:pointer"></div>`).join('');
  const rowH = Math.max(5, Math.round(150 / S.faixaCount)) + 'px';
  const preview = Array.from({ length: S.faixaCount }, () =>
    `<div style="display:flex;border-radius:3px;overflow:hidden">${S.faixaSeq.map(c => `<div style="flex:1;height:${rowH};background:${c}"></div>`).join('')}</div>`).join('');
  return `
  <div class="modal" style="max-width:560px" onclick="event.stopPropagation()">
    ${modalHeader('Padrão das faixas de tricô', 'Cada faixa repete a mesma sequência de cores · toque numa célula para trocar a cor')}
    <div class="lbl" style="margin-bottom:9px">SEQUÊNCIA DE CORES DA FAIXA</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <div style="display:flex;border-radius:6px;overflow:hidden;border:1px solid #DCC7BF">${cells}</div>
      <span onclick="A.faixaDrop()" style="cursor:pointer;color:#B4A49A;font-weight:800;font-size:18px;padding:0 4px">−</span>
      <span onclick="A.faixaAdd()" style="cursor:pointer;color:#A05666;font-weight:800;font-size:18px;padding:0 4px">+</span>
    </div>
    <div style="font-size:11px;color:#9A8A80;margin-bottom:20px">A sequência se repete ao longo da largura da manta.</div>
    <div class="lbl" style="margin-bottom:7px">QUANTIDADE DE FAIXAS</div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div class="field" style="display:flex;justify-content:space-between;align-items:center;width:120px"><span onclick="A.decFaixa()" style="cursor:pointer;color:#B4A49A;font-weight:800">−</span><b>${S.faixaCount}</b><span onclick="A.incFaixa()" style="cursor:pointer;color:#A05666;font-weight:800">+</span></div>
      <span style="font-size:12px;color:#9A8A80">uma faixa = uma linha inteira, feita por uma integrante</span>
    </div>
    <div class="lbl" style="margin-bottom:9px">PRÉVIA DA MANTA</div>
    <div style="display:flex;flex-direction:column;gap:3px;background:#F1EAE4;padding:8px;border-radius:8px;margin-bottom:22px">${preview}</div>
    <div style="display:flex;gap:10px;justify-content:flex-end"><button class="pill ghost" onclick="A.backToProjeto()">Voltar</button><button class="pill" onclick="A.backToProjeto()">Salvar padrão</button></div>
  </div>`;
}

function modalLayout() {
  const LM = { A: MODELS.A, B: MODELS.B, C: MODELS.C };
  const cellModel = (r, c) => S.layoutMap[r + '-' + c] || ['A', 'B', 'C'][(r + c) % 3];
  let grid = '';
  const cnt = { A: 0, B: 0, C: 0 };
  for (let r = 0; r < S.layoutRows; r++) for (let c = 0; c < S.layoutCols; c++) {
    const m = cellModel(r, c);
    cnt[m]++;
    const md = LM[m];
    grid += `<div onclick="A.layoutPaint(${r},${c})" style="width:28px;height:28px;background:${md.border};display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:2px"><div style="width:14px;height:14px;background:${md.inner}"></div></div>`;
  }
  const brushes = ['A', 'B', 'C'].map(k => {
    const md = LM[k];
    return `<div onclick="A.pickBrush('${k}')" style="display:flex;align-items:center;gap:7px;border:1px solid #DCC7BF;border-radius:99px;padding:5px 12px 5px 6px;cursor:pointer;${k === S.layoutBrush ? 'box-shadow:0 0 0 2px #3B342F' : ''}">
      <span style="width:22px;height:22px;background:${md.border};display:flex;align-items:center;justify-content:center;flex:none;border-radius:3px"><span style="width:11px;height:11px;background:${md.inner}"></span></span>
      <span style="font-size:12px;font-weight:700">Modelo ${k}</span>
    </div>`;
  }).join('');
  const legend = ['A', 'B', 'C'].map(k => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 2px;border-bottom:1px solid #ECDCD6;font-size:12.5px"><span style="display:flex;align-items:center;gap:8px;font-weight:700"><span style="width:11px;height:11px;border-radius:2px;background:${LM[k].border}"></span>Modelo ${k}</span><b style="color:#A05666">${cnt[k]}</b></div>`).join('');
  return `
  <div class="modal" style="max-width:640px" onclick="event.stopPropagation()">
    ${modalHeader('Organizar quadrados na manta', 'Escolha um modelo e toque nos quadrados para montar o próprio padrão da manta')}
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><span class="lbl" style="margin-right:2px">PINCEL</span>${brushes}</div>
    <div style="display:flex;gap:26px;align-items:flex-start">
      <div><div style="display:inline-grid;grid-template-columns:repeat(${S.layoutCols},28px);gap:3px;background:#F1EAE4;padding:6px;border-radius:8px">${grid}</div></div>
      <div style="flex:1;min-width:170px">
        <div class="lbl" style="margin-bottom:8px">TAMANHO</div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;margin-bottom:8px"><span style="font-weight:700">Colunas</span><div class="field" style="display:flex;justify-content:space-between;align-items:center;width:96px;padding:6px 12px"><span onclick="A.decCols()" style="cursor:pointer;color:#B4A49A;font-weight:800">−</span><b>${S.layoutCols}</b><span onclick="A.incCols()" style="cursor:pointer;color:#A05666;font-weight:800">+</span></div></div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;margin-bottom:16px"><span style="font-weight:700">Linhas</span><div class="field" style="display:flex;justify-content:space-between;align-items:center;width:96px;padding:6px 12px"><span onclick="A.decRows()" style="cursor:pointer;color:#B4A49A;font-weight:800">−</span><b>${S.layoutRows}</b><span onclick="A.incRows()" style="cursor:pointer;color:#A05666;font-weight:800">+</span></div></div>
        <div class="lbl" style="margin-bottom:8px">COMPOSIÇÃO</div>
        <div style="border-top:1px solid #ECDCD6">
          ${legend}
          <div style="display:flex;justify-content:space-between;padding:8px 2px;font-size:12.5px"><span style="color:#9A8A80;font-weight:700">Total</span><b class="h" style="font-size:15px">${S.layoutCols * S.layoutRows}</b></div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:22px"><button class="pill ghost" onclick="A.backToProjeto()">Voltar</button><button class="pill" onclick="A.backToProjeto()">Salvar montagem</button></div>
  </div>`;
}

function modalDetalhe() {
  const det = DET[S.detKey];
  if (!det) return '';
  const specs = det.specs.map(([k, v]) => `<div style="background:#F9F2ED;border-radius:10px;padding:10px 12px"><div class="lbl" style="margin-bottom:4px">${k}</div><div class="h" style="font-size:15px">${v}</div></div>`).join('');
  let body = '';
  if (det.kind === 'faixa') {
    body = `
    <div class="lbl" style="margin-bottom:9px">SEQUÊNCIA DE CORES</div>
    <div style="display:flex;border-radius:8px;overflow:hidden;border:1px solid #E7D9D2;margin-bottom:22px">${det.seq.map(c => `<div style="flex:1;height:40px;background:${c}"></div>`).join('')}</div>
    <div class="lbl" style="margin-bottom:10px">MATERIAIS</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:22px">
      ${det.materiais.map(m => `<div style="display:flex;align-items:center;gap:10px;font-size:13px"><span style="width:18px;height:18px;border-radius:5px;background:${m.c};border:1px solid rgba(0,0,0,.1);flex:none"></span><span style="flex:1;font-weight:700">${m.name}</span><span style="color:#9A8A80">${m.qty}</span></div>`).join('')}
    </div>`;
  } else if (det.kind === 'manta') {
    const esquema = S.mantaTRows.map(r => `<div style="display:flex;height:20px">${r.map(c => `<div style="flex:1;background:${c}"></div>`).join('')}</div>`).join('');
    body = `
    <div style="display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start;margin-bottom:22px">
      <div>
        <div class="lbl" style="margin-bottom:9px">ESQUEMA</div>
        <div style="border:1.5px solid #D8C7BF;border-radius:6px;overflow:hidden;width:150px">${esquema}</div>
      </div>
      <div>
        <div class="lbl" style="margin-bottom:9px">PALETA</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${det.paleta.map(p => `<div style="display:flex;align-items:center;gap:10px;font-size:13px"><span style="width:18px;height:18px;border-radius:5px;background:${p.c};border:1px solid rgba(0,0,0,.1);flex:none"></span><span style="font-weight:700">${p.name}</span></div>`).join('')}
        </div>
        <div style="font-size:11px;color:#9A8A80;margin-top:12px;line-height:1.5">Toda faixa usa essas 3 cores — só muda a ordem.</div>
      </div>
    </div>
    <div class="lbl" style="margin-bottom:11px">MONTAGEM</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${det.montagem.map((t, i) => `<div style="display:flex;gap:11px;font-size:12.5px;line-height:1.5;color:#61554D"><span style="width:20px;height:20px;border-radius:50%;background:#F6E4E6;color:#A05666;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;flex:none">${i + 1}</span><span>${t}</span></div>`).join('')}
    </div>`;
  } else if (det.kind === 'granny') {
    const dr = det.rings;
    const squares = dr.map((r, i) => ({ c: r.c, sz: 132 - (dr.length - 1 - i) * (108 / dr.length) })).reverse()
      .map(ring => `<div style="position:absolute;width:${ring.sz}px;height:${ring.sz}px;background:${ring.c}"></div>`).join('');
    body = `
    <div style="display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start;margin-bottom:22px">
      <div>
        <div class="lbl" style="margin-bottom:9px">PRÉVIA</div>
        <div style="width:132px;height:132px;position:relative;display:flex;align-items:center;justify-content:center;border-radius:6px;overflow:hidden;background:#F1EAE4">${squares}</div>
        <div style="font-size:10.5px;color:#9A8A80;text-align:center;margin-top:8px">centro → borda</div>
      </div>
      <div>
        <div class="lbl" style="margin-bottom:9px">CARREIRAS</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${dr.map(r => `<div style="display:flex;align-items:center;gap:10px;font-size:13px"><span style="width:18px;height:18px;border-radius:5px;background:${r.c};border:1px solid rgba(0,0,0,.1);flex:none"></span><span style="flex:1;font-weight:700">${r.name} <span style="color:#B4A49A;font-weight:600">· ${r.role}</span></span><span style="color:#9A8A80">${r.n}×</span></div>`).join('')}
        </div>
      </div>
    </div>`;
  }
  return `
  <div class="modal" style="max-width:600px;padding:0;overflow:hidden" onclick="event.stopPropagation()">
    <div style="background:${det.tBg};padding:22px 26px;display:flex;align-items:flex-start;justify-content:space-between">
      <div>
        <span class="tag" style="background:#FFFDFB;color:${det.tC}">${det.tag}</span>
        <div class="h" style="font-size:23px;margin-top:10px">${S.detKey}</div>
        <div style="font-size:12px;color:#7A6C62;margin-top:2px">${det.sub}</div>
      </div>
      <button class="x" onclick="A.close()">×</button>
    </div>
    <div style="padding:22px 26px">
      <div style="font-size:13px;line-height:1.55;color:#61554D;margin-bottom:20px">${det.resumo}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px">${specs}</div>
      ${body}
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:24px;padding-top:18px;border-top:1px solid #ECDCD6"><button class="pill ghost" onclick="A.close()">Fechar</button>${isAdmin() ? '<button class="pill">Usar em projeto</button>' : ''}</div>
    </div>
  </div>`;
}

function modalView() {
  if (!S.modal) return '';
  const modals = {
    projeto: modalProjeto, financeiro: modalFin, material: modalMaterial, receita: modalReceita,
    emprestimo: modalEmprestimo, devolucao: modalDevolucao, producao: modalProducao,
    integrante: modalIntegrante, encontro: modalEncontro, granny: modalGranny,
    faixa: modalFaixa, layout: modalLayout, detalhe: modalDetalhe,
  };
  const fn = modals[S.modal];
  if (!fn) return '';
  return `<div class="ov" onclick="A.close()">${fn()}</div>`;
}

// ---------- Render ----------
const SCREENS = {
  dashboard: dashboardView, projetos: projetosView, mantaC: mantaCView, mantaT: mantaTView,
  amig: amigView, integrantes: integrantesView, estoque: estoqueView, biblioteca: bibliotecaView,
  presenca: presencaView, financeiro: financeiroView, perfil: perfilView, config: configView,
};

function render() {
  const app = document.getElementById('app');
  if (!S.auth) {
    app.innerHTML = loginView();
    return;
  }
  const screen = (SCREENS[S.screen] || dashboardView)();
  app.innerHTML = `
  <div style="display:flex;min-height:100vh">
    ${sidebar()}
    <div style="flex:1;min-width:0">${screen}</div>
  </div>
  ${modalView()}`;
}

render();
