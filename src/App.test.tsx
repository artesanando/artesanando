import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  sessionStorage.clear()
})

describe('App', () => {
  it('mostra a tela de login quando não autenticada', () => {
    renderAt('/')
    expect(screen.getByText('Bem-vinda de volta')).toBeInTheDocument()
  })

  it('entra pelo login e mostra o dashboard', async () => {
    renderAt('/login')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Boa tarde, Regina')).toBeInTheDocument()
  })

  it('deep-link /estoque funciona com sessão ativa', () => {
    sessionStorage.setItem('artesanando:auth', '1')
    renderAt('/estoque')
    expect(screen.getByText('Materiais e itens do projeto, organizados por tipo')).toBeInTheDocument()
  })

  it('deep-link /projetos/primavera abre a manta de crochê', () => {
    sessionStorage.setItem('artesanando:auth', '1')
    renderAt('/projetos/primavera')
    expect(screen.getByText('Destino: Hospital Infantil · 80 squares · padrões A/B/C · 5 integrantes')).toBeInTheDocument()
  })

  it('abre o modal de novo projeto pelo dashboard', async () => {
    sessionStorage.setItem('artesanando:auth', '1')
    renderAt('/')
    await userEvent.click(screen.getByRole('button', { name: '+ Novo projeto' }))
    expect(screen.getByText('Defina o tipo para configurar a produção')).toBeInTheDocument()
  })

  it('rota desconhecida cai no 404', () => {
    sessionStorage.setItem('artesanando:auth', '1')
    renderAt('/nao-existe')
    expect(screen.getByText('Página não encontrada')).toBeInTheDocument()
  })
})
