import type { CSSProperties } from 'react'
import { useStore } from '../state/store'
import { FieldSelect, FieldStepper, Lbl } from '../components/ui/bits'
import { ModalBox, ModalFooter, ModalHeader } from './shared'

const cardOn: CSSProperties = {
  border: '1px solid var(--chip-rose-border)',
  background: 'var(--chip-rose)',
  borderRadius: 12,
  padding: '14px 16px',
  cursor: 'pointer',
  color: 'var(--accent)',
}
const cardAmigOn: CSSProperties = {
  border: '1px solid #E0D3BC',
  background: '#FBF3E4',
  borderRadius: 12,
  padding: '14px 16px',
  cursor: 'pointer',
  color: 'var(--gold-dark)',
}
const cardOff: CSSProperties = {
  border: '1px solid var(--field-border)',
  borderRadius: 12,
  padding: '14px 16px',
  cursor: 'pointer',
  color: 'var(--ink)',
}

const tec = (on: boolean, c: string): CSSProperties =>
  on
    ? {
        flex: 1,
        textAlign: 'center',
        padding: 9,
        borderRadius: 10,
        background: c,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
      }
    : {
        flex: 1,
        textAlign: 'center',
        padding: 9,
        borderRadius: 10,
        border: '1px solid var(--field-border)',
        color: 'var(--ink-soft)',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
      }

function ModeloRow({
  bg1,
  bg2,
  nome,
  cores,
  qtd,
  last,
}: {
  bg1: string
  bg2: string
  nome: string
  cores: string[]
  qtd: number
  last?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderBottom: last ? undefined : '1px solid var(--divider)',
        fontSize: 13,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: `repeating-linear-gradient(-45deg,${bg1} 0 5px,${bg2} 5px 10px)`,
          flex: 'none',
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>{nome}</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
          {cores.map((c) => (
            <span
              key={c}
              style={{ width: 13, height: 13, borderRadius: '50%', background: c }}
            />
          ))}
        </div>
      </div>
      <span
        style={{
          border: '1px solid var(--field-border)',
          borderRadius: 8,
          padding: '4px 12px',
          fontWeight: 800,
          color: 'var(--accent)',
        }}
      >
        {qtd}
      </span>
    </div>
  )
}

function RespRow({ ini, cor, nome, qtd, last }: { ini: string; cor: string; nome: string; qtd: number; last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        borderBottom: last ? undefined : '1px solid var(--divider)',
        fontSize: 13,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: cor,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 10,
          flex: 'none',
        }}
      >
        {ini}
      </div>
      <span style={{ flex: 1, fontWeight: 700 }}>{nome}</span>
      <span
        style={{
          border: '1px solid var(--field-border)',
          borderRadius: 8,
          padding: '4px 12px',
          fontWeight: 800,
          color: 'var(--gold-dark)',
        }}
      >
        {qtd}
      </span>
    </div>
  )
}

export function ModalProjeto() {
  const { projCat, projTec, setProjCat, setProjTec, openGranny, openFaixa, openLayout } = useStore()
  const manta = projCat === 'manta'

  return (
    <ModalBox maxWidth={600}>
      <ModalHeader title="Novo projeto" sub="Defina o tipo para configurar a produção" />
      <div className="grid2" style={{ gap: 10, marginBottom: 20 }}>
        <div onClick={() => setProjCat('manta')} style={manta ? cardOn : cardOff}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Manta</div>
          <div style={{ fontSize: 11.5, marginTop: 2 }}>dividida entre integrantes</div>
        </div>
        <div onClick={() => setProjCat('amig')} style={!manta ? cardAmigOn : cardOff}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Amigurumi</div>
          <div style={{ fontSize: 11.5, marginTop: 2 }}>unidades por integrante</div>
        </div>
      </div>
      <Lbl style={{ marginBottom: 7 }}>{manta ? 'NOME DO PROJETO' : 'NOME DO TIPO'}</Lbl>
      <input
        className="field"
        style={{ marginBottom: 18 }}
        defaultValue={manta ? 'Manta Primavera' : 'Amigurumi Capivara'}
      />
      {manta ? (
        <>
          <div className="grid2" style={{ marginBottom: 18 }}>
            <div>
              <Lbl style={{ marginBottom: 7 }}>TÉCNICA</Lbl>
              <div style={{ display: 'flex', gap: 6 }}>
                <span
                  onClick={() => setProjTec('croche')}
                  style={tec(projTec === 'croche', 'var(--primary)')}
                >
                  Crochê
                </span>
                <span
                  onClick={() => setProjTec('trico')}
                  style={tec(projTec === 'trico', 'var(--green-dark)')}
                >
                  Tricô
                </span>
              </div>
            </div>
            <div>
              <Lbl style={{ marginBottom: 7 }}>DESTINO</Lbl>
              <FieldSelect>Hospital Infantil</FieldSelect>
            </div>
          </div>
          {projTec === 'croche' ? (
            <>
              <Lbl style={{ marginBottom: 9 }}>PADRÕES DE GRANNY SQUARE</Lbl>
              <div className="card" style={{ overflow: 'hidden', marginBottom: 10 }}>
                <ModeloRow
                  bg1="#F6E4E6"
                  bg2="#F1D8DB"
                  nome="Modelo A — Flor de Maio"
                  cores={['#DFA2AC', '#A9BFA3', '#F0E3C8']}
                  qtd={40}
                />
                <ModeloRow
                  bg1="#EFE7F2"
                  bg2="#E3D6EC"
                  nome="Modelo B — Sunburst"
                  cores={['#B99BC4', '#E3C07A', '#DFA2AC']}
                  qtd={24}
                />
                <ModeloRow
                  bg1="#EAF0E6"
                  bg2="#DEE8D8"
                  nome="Modelo C — Clássico"
                  cores={['#A9BFA3', '#7D9B76', '#F0E3C8']}
                  qtd={16}
                  last
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', gap: 16 }}>
                  <span
                    onClick={() => openGranny('projeto')}
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--accent)',
                      cursor: 'pointer',
                    }}
                  >
                    + Criar padrão de granny
                  </span>
                  <span
                    onClick={() => openLayout('projeto')}
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--green-dark)',
                      cursor: 'pointer',
                    }}
                  >
                    ▦ Organizar quadrados na manta
                  </span>
                </div>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  Total: <b style={{ color: 'var(--ink)' }}>80 squares</b>
                </span>
              </div>
            </>
          ) : (
            <div
              style={{
                background: '#EEF3EA',
                border: '1px solid #D8E0D2',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 12, color: '#5E6E55', marginBottom: 12 }}>
                As faixas de tricô usam o mesmo padrão — defina a <b>quantidade</b> e as{' '}
                <b>cores</b>.
              </div>
              <div className="grid2">
                <div>
                  <Lbl style={{ marginBottom: 7 }}>FAIXAS</Lbl>
                  <FieldStepper value="8" />
                </div>
                <div>
                  <Lbl style={{ marginBottom: 7 }}>CORES</Lbl>
                  <div
                    className="field"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {['#A9BFA3', '#DFA2AC', '#F0E3C8'].map((c) => (
                      <span
                        key={c}
                        style={{ width: 16, height: 16, borderRadius: '50%', background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div
                onClick={() => openFaixa('projeto')}
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--green-dark)',
                  cursor: 'pointer',
                }}
              >
                + Editar padrão de cores das faixas
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid2" style={{ marginBottom: 18 }}>
            <div>
              <Lbl style={{ marginBottom: 7 }}>RECEITA</Lbl>
              <FieldSelect>Capivara da Lú</FieldSelect>
            </div>
            <div>
              <Lbl style={{ marginBottom: 7 }}>DESTINO</Lbl>
              <FieldSelect>Dia das Crianças</FieldSelect>
            </div>
          </div>
          <div className="grid2" style={{ marginBottom: 18 }}>
            <div>
              <Lbl style={{ marginBottom: 7 }}>META DE UNIDADES</Lbl>
              <FieldStepper value="12" />
            </div>
            <div>
              <Lbl style={{ marginBottom: 7 }}>FIO PRINCIPAL</Lbl>
              <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{ width: 14, height: 14, borderRadius: '50%', background: '#8B6A4F' }}
                />
                Soft · marrom
              </div>
            </div>
          </div>
          <Lbl style={{ marginBottom: 9 }}>RESPONSÁVEIS</Lbl>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 10 }}>
            <RespRow ini="AL" cor="#C4798A" nome="Ana Luiza" qtd={3} />
            <RespRow ini="B" cor="#7D9B76" nome="Beatriz" qtd={3} />
            <RespRow ini="C" cor="#C9B98F" nome="Camila" qtd={4} last />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <span
              style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', cursor: 'pointer' }}
            >
              + Adicionar integrante
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              Distribuídas: <b style={{ color: 'var(--ink)' }}>10 de 12</b>
            </span>
          </div>
        </>
      )}
      <ModalFooter okLabel="Criar projeto" />
    </ModalBox>
  )
}
