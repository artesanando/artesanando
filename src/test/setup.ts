import '@testing-library/jest-dom/vitest'

/* O jsdom não implementa matchMedia, e o Popover pergunta por ela para saber se
   serve folha de rodapé ou menu ancorado. Aqui ela responde sempre "não é
   celular": os testes descrevem o comportamento no computador. */
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

/* Mesma história do ResizeObserver: o ModalBox mede o próprio conteúdo para
   decidir entre folha e tela cheia, e o jsdom não tem o observador. */
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
