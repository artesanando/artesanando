import { useStore } from '../state/store'
import { DET } from '../mocks/data'
import { DetalheView } from './DetalheView'

/* Adaptador do detalhe mockado (DET) — ainda usado pela tela de amigurumi
   até o M3; a Biblioteca já usa o detalhe real vindo do banco. */
export function ModalDetalhe() {
  const { detKey, close, isAdmin, mantaTRows } = useStore()
  const det = detKey ? DET[detKey] : undefined
  if (!det || !detKey) return null

  return (
    <DetalheView
      nome={detKey}
      categoria={det.kind}
      sub={det.sub}
      resumo={det.resumo}
      specs={det.specs}
      conteudo={{
        seq: det.seq,
        materiais: det.materiais,
        paleta: det.paleta,
        montagem: det.montagem,
        rings: det.rings,
        esquema: det.kind === 'manta' ? mantaTRows : undefined,
      }}
      onClose={close}
      footerExtra={isAdmin ? <button className="pill">Usar em projeto</button> : undefined}
    />
  )
}
