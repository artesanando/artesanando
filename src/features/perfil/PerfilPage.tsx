import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store'
import { Avatar, FieldSelect, Lbl } from '../../components/ui/bits'

export function PerfilPage() {
  const { papel } = useStore()
  const navigate = useNavigate()

  return (
    <div style={{ padding: '30px 44px', maxWidth: 760 }}>
      <div className="crumb" onClick={() => navigate('/')} style={{ marginBottom: 10 }}>
        ‹ Voltar
      </div>
      <div className="h" style={{ fontWeight: 500, fontSize: 28, marginBottom: 22 }}>
        Meu perfil
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          paddingBottom: 24,
          borderBottom: '1px solid var(--border)',
          marginBottom: 24,
        }}
      >
        <Avatar color="var(--fill)" size={66} fontSize={22}>
          R
        </Avatar>
        <div>
          <div className="h" style={{ fontSize: 19 }}>
            Regina Almeida
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>@regina.prof · {papel}</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--accent)',
              marginTop: 6,
              cursor: 'pointer',
            }}
          >
            Trocar foto
          </div>
        </div>
      </div>
      <div className="grid2" style={{ marginBottom: 24 }}>
        <div>
          <Lbl style={{ marginBottom: 7 }}>NOME COMPLETO</Lbl>
          <input className="field" defaultValue="Regina Almeida" />
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>USUÁRIO</Lbl>
          <div
            className="field"
            style={{
              background: '#F1EAE4',
              color: 'var(--muted)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            regina.prof <span style={{ fontSize: 11 }}>🔒</span>
          </div>
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>TELEFONE / WHATSAPP</Lbl>
          <input className="field" defaultValue="(11) 9 9999-0000" />
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>PREFERÊNCIA</Lbl>
          <FieldSelect>Crochê e tricô</FieldSelect>
        </div>
      </div>
      <div className="h" style={{ fontSize: 16, marginBottom: 10 }}>
        Segurança
      </div>
      <div
        className="card"
        style={{
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>Senha</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Alterada há 2 meses</div>
        </div>
        <button className="pill ghost">Alterar senha</button>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="pill ghost" onClick={() => navigate('/')}>
          Cancelar
        </button>
        <button className="pill" onClick={() => navigate('/')}>
          Salvar alterações
        </button>
      </div>
    </div>
  )
}
