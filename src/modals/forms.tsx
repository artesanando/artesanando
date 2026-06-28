import { FieldSelect, FieldStepper, Lbl } from '../components/ui/bits'
import { ModalBox, ModalFooter, ModalHeader } from './shared'

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
  return (
    <ModalBox maxWidth={520}>
      <ModalHeader
        title="Cadastrar integrante"
        sub="Ela receberá um usuário para acessar o sistema"
      />
      <div className="grid2" style={{ marginBottom: 18 }}>
        <div>
          <Lbl style={{ marginBottom: 7 }}>NOME COMPLETO</Lbl>
          <input className="field" defaultValue="Giulia Santos" />
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>USUÁRIO</Lbl>
          <input className="field" defaultValue="giulia.santos" />
        </div>
      </div>
      <div className="grid2" style={{ marginBottom: 18 }}>
        <div>
          <Lbl style={{ marginBottom: 7 }}>TELEFONE / WHATSAPP</Lbl>
          <input className="field" defaultValue="(11) 9 8888-0000" />
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>PREFERÊNCIA</Lbl>
          <FieldSelect>Crochê</FieldSelect>
        </div>
      </div>
      <Lbl style={{ marginBottom: 7 }}>PERFIL</Lbl>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <div
          className="seg"
          style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
        >
          Integrante
        </div>
        <div className="seg">Administradora</div>
      </div>
      <ModalFooter okLabel="Cadastrar" />
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
