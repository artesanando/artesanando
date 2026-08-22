import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stepper } from '../components/ui/bits'
import { Campo, LegendaObrigatorio, useFormulario } from '../components/ui/Campo'
import { ColorPicker, Select } from '../components/ui/controles'
import { useToast } from '../components/ui/Toast'
import { CampoCapa } from '../components/ui/CampoCapa'
import { subirCapa } from '../lib/capa'
import { ModalBox, ModalHeader } from './shared'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { MOTIVO_LABEL, type EstoqueCategoria } from '../types/database'
import {
  atualizarItemEstoque,
  criarItemEstoque,
  fetchEstoque,
  fetchMovimentosDoItem,
  lancarMovimento,
} from '../features/estoque/api'
import { fmtDataBarra } from '../lib/format'
import { useSemestreAtivo } from '../lib/semestre'
import { fetchIntegrantes } from '../features/integrantes/api'

const CATS: [EstoqueCategoria, string][] = [
  ['novelos', 'Novelo'],
  ['agulhas', 'Agulha'],
  ['outros', 'Outros'],
  ['feira', 'Feira'],
]

/* Novo material, ou edição de um já cadastrado. Antes só existia o cadastro:
   uma vez criado, o item não podia ser corrigido nem reposto. */
export function ModalMaterial() {
  const { close, estoqueItemId } = useStore()
  const qc = useQueryClient()
  const toast = useToast()
  const form = useFormulario<'nome'>()

  const { data: itens } = useQuery({ queryKey: ['estoque'], queryFn: fetchEstoque })
  const item = (itens ?? []).find((i) => i.id === estoqueItemId)
  const editando = Boolean(item)

  const [categoria, setCategoria] = useState<EstoqueCategoria>(item?.categoria ?? 'novelos')
  const [nome, setNome] = useState(item?.nome ?? '')
  const [detalhe, setDetalhe] = useState(item?.detalhe ?? '')
  const [cor, setCor] = useState(item?.cor_hex ?? '#DFA2AC')
  const [quantidade, setQuantidade] = useState(12)
  const [capa, setCapa] = useState<Blob | null>(null)

  /* Peça de feira é entrega de quem a fez. Novelo e agulha não têm autora, por
     isso o campo só aparece na feira — e nasce com quem está cadastrando. */
  const { profile } = useAuth()
  const semestre = useSemestreAtivo()
  const { data: pessoas } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const [autoria, setAutoria] = useState(item?.autoria_id ?? profile?.id ?? '')
  const daFeira = categoria === 'feira'

  const salvar = useMutation({
    mutationFn: async () => {
      const base = {
        categoria,
        nome: nome.trim(),
        detalhe: detalhe.trim() || null,
        cor_hex: categoria === 'novelos' ? cor : null,
        autoria_id: daFeira ? autoria || null : null,
        ...(capa ? { capa_path: await subirCapa(capa) } : {}),
      }
      if (item) await atualizarItemEstoque(item.id, base)
      else
        await criarItemEstoque({
          ...base,
          quantidade,
          // o semestre é carimbado no cadastro: é quando a peça entrou
          semestre_id: daFeira ? (semestre?.id ?? null) : null,
        })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estoque'] })
      toast(editando ? 'Material atualizado' : 'Material adicionado')
      close()
    },
    onError: () => toast('Não foi possível salvar o material.', 'erro'),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.checar({ nome: nome.trim() ? undefined : 'Informe a marca ou o nome do material.' }))
      return
    salvar.mutate()
  }

  return (
    <ModalBox maxWidth={560}>
      <ModalHeader title={editando ? 'Editar material' : 'Novo material'} />
      <form onSubmit={submit}>
        <div className="lbl" style={{ marginBottom: 7 }}>
          TIPO
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {CATS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              className="seg"
              aria-pressed={categoria === k}
              onClick={() => setCategoria(k)}
              style={
                categoria === k
                  ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                  : undefined
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid2" style={{ marginBottom: 18 }}>
          <Campo label="MARCA / NOME" obrigatorio erro={form.erros.nome}>
            {(p) => (
              <input
                {...p}
                className="field"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  form.aoMudar('nome')
                }}
                placeholder="Círculo Balloon"
              />
            )}
          </Campo>
          <Campo label="DETALHE">
            {(p) => (
              <input
                {...p}
                className="field"
                value={detalhe}
                onChange={(e) => setDetalhe(e.target.value)}
                placeholder={categoria === 'novelos' ? 'rosé' : '3,0 mm'}
              />
            )}
          </Campo>
        </div>

        <div className="grid2" style={{ marginBottom: 24 }}>
          {categoria === 'novelos' && (
            <Campo label="COR">
              {() => <ColorPicker value={cor} onChange={setCor} ariaLabel="Cor do novelo" />}
            </Campo>
          )}
          {daFeira && (
            <Campo label="QUEM FEZ" dica="Conta como entrega dela no relatório de extensão.">
              {() => (
                <Select
                  value={autoria}
                  onChange={setAutoria}
                  ariaLabel="Quem fez a peça"
                  options={[
                    ['', 'Ninguém em especial'],
                    ...(pessoas ?? []).map((p) => [p.id, p.nome] as [string, string]),
                  ]}
                />
              )}
            </Campo>
          )}
          {!editando && (
            <Campo label="QUANTIDADE INICIAL" obrigatorio>
              {() => (
                <Stepper
                  value={quantidade}
                  onChange={setQuantidade}
                  min={0}
                  max={999}
                  ariaLabel="Quantidade inicial"
                />
              )}
            </Campo>
          )}
        </div>

        <div className="lbl" style={{ marginBottom: 7 }}>
          FOTO
        </div>
        <div style={{ marginBottom: 24 }}>
          <CampoCapa atual={item?.capa_path} blob={capa} aoEscolher={setCapa} vazio="Foto do material" />
        </div>

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
              {salvar.isPending ? 'Salvando…' : editando ? 'Salvar' : 'Adicionar ao estoque'}
            </button>
          </div>
        </div>
      </form>
    </ModalBox>
  )
}

/* ---------- Entrada / ajuste de estoque ---------- */

/* Movimentar é só direção: entrada ou saída. O motivo saiu do formulário — na
   prática ninguém parava para classificar, e o que ele decidia sozinho (a conta
   de vendidos da feira) agora sai da categoria do item, no gatilho do banco.
   A observação continua ali para quem quiser deixar o contexto escrito. */
type Direcao = 'entrada' | 'saida'

export function ModalMovimentoEstoque() {
  const { close, estoqueItemId } = useStore()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const form = useFormulario<'quantidade'>()

  const { data: itens } = useQuery({ queryKey: ['estoque'], queryFn: fetchEstoque })
  const item = (itens ?? []).find((i) => i.id === estoqueItemId)

  const { data: historico } = useQuery({
    queryKey: ['estoque-movimentos', estoqueItemId],
    queryFn: () => fetchMovimentosDoItem(estoqueItemId!),
    enabled: !!estoqueItemId,
  })

  const [direcao, setDirecao] = useState<Direcao>('entrada')
  const [quantidade, setQuantidade] = useState(12)
  const [obs, setObs] = useState('')

  const saida = direcao === 'saida'

  const lancar = useMutation({
    mutationFn: () =>
      lancarMovimento({
        item_id: item!.id,
        delta: saida ? -quantidade : quantidade,
        motivo: direcao,
        obs: obs.trim() || null,
        criado_por: profile!.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estoque'] })
      qc.invalidateQueries({ queryKey: ['estoque-movimentos', estoqueItemId] })
      toast('Estoque atualizado')
      close()
    },
    onError: () => toast('Não foi possível lançar — confira se a saída cabe no estoque.', 'erro'),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (
      !form.checar({
        quantidade:
          quantidade <= 0
            ? 'Informe uma quantidade maior que zero.'
            : saida && item && quantidade > item.quantidade
              ? `Só há ${item.quantidade} em posse do projeto.`
              : undefined,
      })
    )
      return
    lancar.mutate()
  }

  if (!item) return null

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader
        title="Movimentar estoque"
        sub={`${item.nome}${item.detalhe ? ` · ${item.detalhe}` : ''} — ${item.quantidade} em posse`}
      />
      <form onSubmit={submit}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {(['entrada', 'saida'] as Direcao[]).map((d) => (
            <button
              key={d}
              type="button"
              className="seg"
              aria-pressed={direcao === d}
              onClick={() => setDirecao(d)}
              style={
                direcao === d
                  ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                  : undefined
              }
            >
              {d === 'entrada' ? 'Adicionar ao estoque' : 'Retirar do estoque'}
            </button>
          ))}
        </div>

        <div className="grid2" style={{ marginBottom: 18 }}>
          <Campo label="QUANTIDADE" obrigatorio erro={form.erros.quantidade}>
            {() => (
              <Stepper
                value={quantidade}
                onChange={(v) => {
                  setQuantidade(v)
                  form.aoMudar('quantidade')
                }}
                min={1}
                max={999}
                ariaLabel="Quantidade"
              />
            )}
          </Campo>
        </div>

        <Campo label="OBSERVAÇÃO" style={{ marginBottom: 20 }}>
          {(p) => (
            <input
              {...p}
              className="field"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Doação da feira de junho"
            />
          )}
        </Campo>

        <div
          style={{
            background: 'var(--sand-soft)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '11px 14px',
            fontSize: 12.5,
            marginBottom: 20,
          }}
        >
          Fica com{' '}
          <b>{item.quantidade + (saida ? -quantidade : quantidade)}</b> em posse do projeto.
        </div>

        {(historico ?? []).length > 0 && (
          <>
            <div className="lbl" style={{ marginBottom: 8 }}>
              HISTÓRICO
            </div>
            <div style={{ marginBottom: 20, maxHeight: 150, overflowY: 'auto' }}>
              {(historico ?? []).map((h) => (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '7px 2px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 12,
                  }}
                >
                  <span>
                    <b style={{ color: h.delta > 0 ? 'var(--green-dark)' : 'var(--accent)' }}>
                      {h.delta > 0 ? '+' : '−'}
                      {Math.abs(h.delta)}
                    </b>{' '}
                    {MOTIVO_LABEL[h.motivo]}
                    {h.obs ? ` · ${h.obs}` : ''}
                  </span>
                  <span style={{ color: 'var(--faint)', whiteSpace: 'nowrap' }}>
                    {h.autor?.nome?.split(' ')[0] ?? '—'} · {fmtDataBarra(h.created_at.slice(0, 10))}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="pill ghost" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="pill" disabled={lancar.isPending}>
            {lancar.isPending ? 'Lançando…' : 'Lançar'}
          </button>
        </div>
      </form>
    </ModalBox>
  )
}
