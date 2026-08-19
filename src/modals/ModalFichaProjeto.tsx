import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stepper } from '../components/ui/bits'
import { Campo, LegendaObrigatorio, useFormulario } from '../components/ui/Campo'
import { Select } from '../components/ui/controles'
import { useToast } from '../components/ui/Toast'
import { ModalBox, ModalHeader } from './shared'
import { useStore } from '../state/store'
import {
  atualizarProjeto,
  fetchProjeto,
  fetchReceitasAmigurumi,
  type Projeto,
} from '../features/projetos/api'

/* Editar a ficha depois de criado — nome, destino, emoji, meta e receita.
   Antes, tudo isso era decidido na criação e ficava assim para sempre. */
export function ModalFichaProjeto() {
  const { projetoId } = useStore()
  const { data: projeto } = useQuery({
    queryKey: ['projeto', projetoId],
    queryFn: () => fetchProjeto(projetoId!),
    enabled: !!projetoId,
  })

  // o formulário só monta com o projeto em mãos, então o estado nasce preenchido
  if (!projeto) return null
  return <Form projeto={projeto} />
}

function Form({ projeto }: { projeto: Projeto }) {
  const { close } = useStore()
  const qc = useQueryClient()
  const toast = useToast()
  const form = useFormulario<'nome'>()

  const amigurumi = projeto.tipo === 'amigurumi'
  const { data: receitas } = useQuery({
    queryKey: ['receitas-amigurumi'],
    queryFn: fetchReceitasAmigurumi,
    enabled: amigurumi,
  })

  const [nome, setNome] = useState(projeto.nome)
  const [destino, setDestino] = useState(projeto.destino ?? '')
  const [emoji, setEmoji] = useState(projeto.emoji ?? '🧶')
  const [meta, setMeta] = useState(projeto.meta ?? 12)
  const [receitaId, setReceitaId] = useState(projeto.receita_id ?? '')

  const salvar = useMutation({
    mutationFn: () =>
      atualizarProjeto(projeto.id, {
        nome: nome.trim(),
        destino: destino.trim() || null,
        emoji: emoji || null,
        meta: amigurumi ? meta : null,
        receita_id: amigurumi && receitaId ? receitaId : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projetos'] })
      qc.invalidateQueries({ queryKey: ['projeto', projeto.id] })
      toast('Ficha atualizada ✓')
      close()
    },
    onError: () => toast('Não foi possível salvar a ficha.', 'erro'),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.checar({ nome: nome.trim() ? undefined : 'Dê um nome ao projeto.' })) return
    salvar.mutate()
  }

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader title="Editar ficha" sub={`${projeto.nome} — o que dá para mudar depois`} />
      <form onSubmit={submit}>
        <Campo label="NOME" obrigatorio erro={form.erros.nome} style={{ marginBottom: 18 }}>
          {(p) => (
            <input
              {...p}
              className="field"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value)
                form.aoMudar('nome')
              }}
            />
          )}
        </Campo>

        <div className="grid2" style={{ marginBottom: 18 }}>
          <Campo label="DESTINO (OPCIONAL)">
            {(p) => (
              <input
                {...p}
                className="field"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Hospital Infantil"
              />
            )}
          </Campo>
          <Campo label="EMOJI">
            {(p) => (
              <input
                {...p}
                className="field"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
              />
            )}
          </Campo>
        </div>

        {amigurumi && (
          <div className="grid2" style={{ marginBottom: 22 }}>
            <Campo label="META DE UNIDADES">
              {() => (
                <Stepper value={meta} onChange={setMeta} min={1} max={999} ariaLabel="Meta" />
              )}
            </Campo>
            <Campo label="RECEITA (OPCIONAL)">
              {() => (
                <Select
                  ariaLabel="Receita"
                  value={receitaId}
                  onChange={setReceitaId}
                  options={[
                    ['', 'Nenhuma'],
                    ...(receitas ?? []).map((r) => [r.id, r.nome] as [string, string]),
                  ]}
                />
              )}
            </Campo>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <LegendaObrigatorio />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="pill ghost" onClick={close}>
              Cancelar
            </button>
            <button type="submit" className="pill" disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>
    </ModalBox>
  )
}
