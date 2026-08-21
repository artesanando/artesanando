# Ícones — Artesanando

Marca: monograma "A." serifado (Bitter 600) em disco rosa #B96D7E, letra #F9F2ED.

## Arquivos
- favicon.ico — 16 + 32 + 48, navegadores antigos
- favicon-16/32/48.png — disco com cantos transparentes
- favicon.svg — vetor; a letra usa a pilha Bitter → Georgia → serif.
  Para fidelidade total fora do app, converta o texto em curvas antes de publicar.
- apple-touch-icon.png — 180×180, quadrado rosa cheio (o iOS arredonda sozinho)
- icon-192.png / icon-512.png — PWA / Android
- maskable-512.png — quadrado cheio, marca a ~52% do quadro (safe zone do Android)
- site.webmanifest — nome, cores, lista de ícones

## Onde colar
Coloque a pasta em /icons na raiz do site e adicione no <head>:

    <link rel="icon" href="/icons/favicon.ico" sizes="any">
    <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
    <link rel="manifest" href="/icons/site.webmanifest">
    <meta name="theme-color" content="#B96D7E">
