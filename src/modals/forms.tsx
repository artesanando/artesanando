import { useState, type FormEvent } from 'react'
import { FieldSelect, FieldStepper, Lbl } from '../components/ui/bits'
import { ModalBox, ModalFooter, ModalHeader } from './shared'
import { supabase } from '../lib/supabase'
import { useStore } from '../state/store'
import type { Papel, Preferencia } from '../types/database'

export function ModalMaterial() {
  return (
    <ModalBox maxWidth={560}>
      <ModalHeader title="Novo material" sub="Adicionar ao estoque coletivo" />
      <Lbl style={{ marginBottom: 7 }}>TIPO</Lbl>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <div
          className="seg"
          style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
        >
          Novelo
        </div>
        <div className="seg">Agulha</div>
        <div className="seg">Enchimento</div>
        <div className="seg">Outro</div>
      </div>
      <div className="grid2" style={{ marginBottom: 18 }}>
        <div>
          <Lbl style={{ marginBottom: 7 }}>MARCA / LINHA</Lbl>
          <input className="field" defaultValue="Círculo Balloon" />
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>COR</Lbl>
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#DFA2AC' }} />
            rosé
          </div>
        </div>
      </div>
      <div className="grid2" style={{ marginBottom: 24 }}>
        <div>
          <Lbl style={{ marginBottom: 7 }}>QUANTIDADE</Lbl>
          <FieldStepper value="12" />
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>CUSTO UNIT.</Lbl>
          <input className="field" placeholder="R$ 0,00" />
        </div>
      </div>
      <ModalFooter okLabel="Adicionar ao estoque" />
    </ModalBox>
  )
}

export function ModalReceita() {
  return (
    <ModalBox maxWidth={560}>
      <ModalHeader title="Adicionar à biblioteca" sub="Receita de amigurumi ou padrão de manta" />
      <Lbl style={{ marginBottom: 7 }}>CATEGORIA</Lbl>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <div
          className="seg"
          style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
        >
          Amigurumi
        </div>
        <div className="seg">Granny square</div>
        <div className="seg">Faixa de tricô</div>
      </div>
      <Lbl style={{ marginBottom: 7 }}>NOME</Lbl>
      <input className="field" style={{ marginBottom: 18 }} defaultValue="Capivara da Lú" />
      <div className="grid2" style={{ marginBottom: 18 }}>
        <div>
          <Lbl style={{ marginBottom: 7 }}>IMAGEM</Lbl>
          <div
            style={{
              border: '2px dashed var(--field-border)',
              borderRadius: 12,
              padding: 18,
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--faint)',
              fontWeight: 700,
            }}
          >
            📷 Arraste ou selecione
          </div>
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>PDF</Lbl>
          <div
            style={{
              border: '2px dashed var(--field-border)',
              borderRadius: 12,
              padding: 18,
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--faint)',
              fontWeight: 700,
            }}
          >
            📄 Anexar PDF
          </div>
        </div>
      </div>
      <Lbl style={{ marginBottom: 7 }}>OBSERVAÇÕES</Lbl>
      <textarea
        className="field"
        style={{ minHeight: 52, marginBottom: 24, resize: 'vertical' }}
        placeholder="Ex.: usar fio 4mm, olhos de segurança 9mm…"
      />
      <ModalFooter okLabel="Salvar na biblioteca" />
    </ModalBox>
  )
}

export function ModalEmprestimo() {
  return (
    <ModalBox maxWidth={520}>
      <ModalHeader
        title="Registrar empréstimo"
        sub="Saída de novelos para uma integrante levar para casa"
      />
      <Lbl style={{ marginBottom: 7 }}>INTEGRANTE</Lbl>
      <FieldSelect style={{ marginBottom: 18 }}>Ana Luiza Prado</FieldSelect>
      <Lbl style={{ marginBottom: 7 }}>MATERIAL</Lbl>
      <div
        className="field"
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}
      >
        <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#DFA2AC' }} />
        Círculo Balloon · rosé <span style={{ marginLeft: 'auto', color: 'var(--faint)' }}>▾</span>
      </div>
      <div className="grid2" style={{ marginBottom: 24 }}>
        <div>
          <Lbl style={{ marginBottom: 7 }}>QUANTIDADE</Lbl>
          <FieldStepper value="2" />
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>PROJETO</Lbl>
          <FieldSelect>Primavera</FieldSelect>
        </div>
      </div>
      <ModalFooter okLabel="Registrar empréstimo" />
    </ModalBox>
  )
}

export function ModalDevolucao() {
  return (
    <ModalBox maxWidth={520}>
      <ModalHeader title="Registrar devolução" sub="Selecione o empréstimo a encerrar" />
      <div
        className="card"
        style={{
          padding: '13px 15px',
          marginBottom: 10,
          borderColor: 'var(--chip-rose-border)',
          background: 'var(--chip-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          ✓
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5 }}>Ana Luiza · 2 novelos Balloon rosé</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            Primavera · emprestado 30/06
          </div>
        </div>
      </div>
      <div
        className="card"
        style={{
          padding: '13px 15px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '1.5px solid var(--field-border)',
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5 }}>Duda Ferreira · 3 novelos Mollet</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            Manta Nuvem · emprestado 21/06
          </div>
        </div>
      </div>
      <Lbl style={{ marginBottom: 7 }}>QUANTIDADE DEVOLVIDA</Lbl>
      <div
        className="field"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <span>2 de 2</span>
        <span style={{ color: 'var(--faint)', fontWeight: 800 }}>− +</span>
      </div>
      <ModalFooter okLabel="Confirmar devolução" />
    </ModalBox>
  )
}

export function ModalProducao() {
  return (
    <ModalBox maxWidth={520}>
      <ModalHeader title="Registrar produção" sub="Manta Primavera · quem fez o quê" />
      <div className="grid2" style={{ marginBottom: 18 }}>
        <div>
          <Lbl style={{ marginBottom: 7 }}>PADRÃO / LOTE</Lbl>
          <FieldSelect>Modelo A</FieldSelect>
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>QUANTIDADE</Lbl>
          <FieldStepper value="4" />
        </div>
      </div>
      <Lbl style={{ marginBottom: 7 }}>ETAPA CONCLUÍDA</Lbl>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <div className="seg">Miolo</div>
        <div
          className="seg"
          style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
        >
          Borda
        </div>
        <div className="seg">Pronto</div>
      </div>
      <Lbl style={{ marginBottom: 7 }}>RESPONSÁVEL</Lbl>
      <div
        className="field"
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--green)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          B
        </span>
        Beatriz Gomes
        <span style={{ marginLeft: 'auto', color: 'var(--faint)' }}>▾</span>
      </div>
      <ModalFooter okLabel="Registrar" />
    </ModalBox>
  )
}

export function ModalIntegrante() {
  const { close } = useStore()
  const [nome, setNome] = useState('')
  const [usuario, setUsuario] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [preferencia, setPreferencia] = useState<Preferencia>('croche')
  const [papel, setPapel] = useState<Papel>('integrante')
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const cadastrar = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (!nome.trim() || !usuario.trim() || !email.includes('@')) {
      setErro('Preencha nome, usuário e um email válido.')
      return
    }
    setEnviando(true)
    const { data, error } = await supabase.functions.invoke('invite-member', {
      body: {
        nome: nome.trim(),
        usuario: usuario.trim().toLowerCase(),
        email: email.trim(),
        telefone: telefone.trim() || null,
        preferencia,
        papel,
        redirectTo: `${window.location.origin}/definir-senha`,
      },
    })
    setEnviando(false)
    const bodyErr = (data as { error?: string } | null)?.error
    if (error || bodyErr) {
      setErro(bodyErr ?? 'Não foi possível enviar o convite. Tente novamente.')
      return
    }
    setOk(true)
  }

  const segStyle = (on: boolean) =>
    on
      ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
      : undefined

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader
        title="Cadastrar integrante"
        sub="Ela recebe um convite por email para criar a senha"
      />
      {ok ? (
        <>
          <div
            style={{
              background: 'var(--chip-green)',
              border: '1px solid var(--chip-green-border)',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 13,
              color: 'var(--green-dark)',
              marginBottom: 24,
            }}
          >
            ✓ Convite enviado para <b>{email}</b>. Ela define a senha pelo link do email.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="pill" onClick={close}>
              Fechar
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={cadastrar}>
          <div className="grid2" style={{ marginBottom: 18 }}>
            <div>
              <Lbl style={{ marginBottom: 7 }}>NOME COMPLETO</Lbl>
              <input
                className="field"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Giulia Santos"
              />
            </div>
            <div>
              <Lbl style={{ marginBottom: 7 }}>USUÁRIO</Lbl>
              <input
                className="field"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="giulia.santos"
              />
            </div>
          </div>
          <Lbl style={{ marginBottom: 7 }}>EMAIL</Lbl>
          <input
            className="field"
            type="email"
            style={{ marginBottom: 18 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="giulia@email.com"
          />
          <div className="grid2" style={{ marginBottom: 18 }}>
            <div>
              <Lbl style={{ marginBottom: 7 }}>TELEFONE / WHATSAPP</Lbl>
              <input
                className="field"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 9 8888-0000"
              />
            </div>
            <div>
              <Lbl style={{ marginBottom: 7 }}>PREFERÊNCIA</Lbl>
              <select
                className="field"
                value={preferencia}
                onChange={(e) => setPreferencia(e.target.value as Preferencia)}
                style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}
              >
                <option value="croche">Crochê</option>
                <option value="trico">Tricô</option>
                <option value="ambos">Crochê e tricô</option>
              </select>
            </div>
          </div>
          <Lbl style={{ marginBottom: 7 }}>PERFIL</Lbl>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <div
              className="seg"
              onClick={() => setPapel('integrante')}
              style={segStyle(papel === 'integrante')}
            >
              Integrante
            </div>
            <div
              className="seg"
              onClick={() => setPapel('admin')}
              style={segStyle(papel === 'admin')}
            >
              Administradora
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
            <button type="button" className="pill ghost" onClick={close}>
              Cancelar
            </button>
            <button type="submit" className="pill" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar convite'}
            </button>
          </div>
        </form>
      )}
    </ModalBox>
  )
}

export function ModalEncontro() {
  return (
    <ModalBox maxWidth={520}>
      <ModalHeader title="Novo encontro" sub="Abre a chamada e a pauta do dia" />
      <div className="grid2" style={{ marginBottom: 18 }}>
        <div>
          <Lbl style={{ marginBottom: 7 }}>DATA</Lbl>
          <input className="field" defaultValue="14/07/2026" />
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>HORÁRIO</Lbl>
          <input className="field" defaultValue="14:00" />
        </div>
      </div>
      <Lbl style={{ marginBottom: 7 }}>SALA</Lbl>
      <input className="field" style={{ marginBottom: 18 }} defaultValue="Sala 203" />
      <Lbl style={{ marginBottom: 7 }}>PAUTA</Lbl>
      <textarea
        className="field"
        style={{ minHeight: 52, marginBottom: 24, resize: 'vertical' }}
        defaultValue="Montagem da Manta Primavera"
      />
      <ModalFooter okLabel="Criar encontro" />
    </ModalBox>
  )
}
