import { describe, expect, it } from 'vitest'
import { contaPorAlbum, fotosDoAlbum, soltas, type Foto } from './api'

const foto = (id: string, album_id: string | null): Foto => ({
  id,
  path: `${id}.jpg`,
  album_id,
  autor_id: 'u1',
  created_at: '2026-08-20T12:00:00Z',
})

const fotos = [foto('f1', 'a1'), foto('f2', null), foto('f3', 'a1'), foto('f4', 'a2')]

describe('mural', () => {
  it('sem álbum escolhido, mostra tudo — inclusive as soltas', () => {
    expect(fotosDoAlbum(fotos, null)).toHaveLength(4)
  })

  it('álbum escolhido filtra só as dele', () => {
    expect(fotosDoAlbum(fotos, 'a1').map((f) => f.id)).toEqual(['f1', 'f3'])
  })

  it('conta as fotos de cada álbum', () => {
    const c = contaPorAlbum(fotos)
    expect(c.get('a1')).toBe(2)
    expect(c.get('a2')).toBe(1)
  })

  it('conta as que ainda não foram arrumadas', () => {
    expect(soltas(fotos)).toBe(1)
  })
})
