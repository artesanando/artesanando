import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dica } from './controles'

/* A dica é posicionada à mão, e o invólucro dela é `display: contents` — que não
   gera caixa. Medir o invólucro devolvia zero em tudo e jogava o balão para o
   canto de cima da janela, longe do que ele explica. */
function comCaixa(el: Element, caixa: Partial<DOMRect>) {
  el.getBoundingClientRect = () =>
    ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, ...caixa }) as DOMRect
}

describe('Dica', () => {
  it('mostra o texto no hover e some ao sair', async () => {
    const user = userEvent.setup()
    render(
      <Dica texto="Peças entregues no semestre">
        <button type="button">ENTREGAS</button>
      </Dica>,
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.hover(screen.getByRole('button'))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Peças entregues no semestre')

    await user.unhover(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('nasce ao lado do elemento que explica, não no canto da janela', async () => {
    const user = userEvent.setup()
    render(
      <Dica texto="Ajuda">
        <button type="button">TOTAL</button>
      </Dica>,
    )
    const alvo = screen.getByRole('button')
    comCaixa(alvo, { top: 100, left: 160, right: 200, width: 40, height: 20 })

    await user.hover(alvo)
    const balao = await screen.findByRole('tooltip')
    // à direita do alvo, na altura dele — e não em (10, -12), que era o canto
    expect(balao).toHaveStyle({ left: '210px', top: '110px' })
  })
})
