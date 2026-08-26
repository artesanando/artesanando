import { describe, expect, it } from 'vitest'
import { erroDeUsuario, normalizaUsuario } from './usuario'

describe('nome de usuário', () => {
  it('derruba o que não cabe num email', () => {
    expect(normalizaUsuario('Ada Lovelace')).toBe('adalovelace')
    expect(normalizaUsuario('ADA@LOVELACE')).toBe('adalovelace')
    expect(normalizaUsuario('Cândida Nunes')).toBe('candidanunes')
    expect(normalizaUsuario('ada.lovelace')).toBe('ada.lovelace')
  })

  it('corta no limite, em vez de deixar passar e falhar no envio', () => {
    expect(normalizaUsuario('a'.repeat(40))).toHaveLength(20)
  })

  it('aceita letras, números e ponto', () => {
    expect(erroDeUsuario('ada.lovelace')).toBeNull()
    expect(erroDeUsuario('ada2')).toBeNull()
  })

  it('recusa vazio, curto demais e ponto solto', () => {
    expect(erroDeUsuario('')).toBe('Escolha um nome de usuário.')
    expect(erroDeUsuario('ad')).toBe('Use pelo menos 3 caracteres.')
    // normalizaUsuario deixa passar o ponto; quem barra a borda é a validação
    expect(erroDeUsuario('ada.')).toBe('Use letras minúsculas, números e ponto.')
    expect(erroDeUsuario('.ada')).toBe('Use letras minúsculas, números e ponto.')
    expect(erroDeUsuario('ada..lovelace')).toBe('Use letras minúsculas, números e ponto.')
  })
})
