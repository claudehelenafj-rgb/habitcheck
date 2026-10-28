# Caderninho

App de hábitos e rotina, muito visual, para pessoas com TDAH (e TDAH + autismo).
Funciona no navegador, pode ser instalado e guarda os dados só no aparelho.

O plano está em [`docs/plano-fase-1.md`](docs/plano-fase-1.md).

## Rodar no computador

Precisa do [Node.js](https://nodejs.org) 22 ou mais novo.

```bash
npm install
npm run dev
```

Depois abra o endereço que aparecer (normalmente http://localhost:5173).

## Publicar (GitHub Pages)

O arquivo `.github/workflows/publicar.yml` testa e publica o app a cada mudança no branch `main`.
Na primeira vez, em **Settings → Pages**, escolha **Source: GitHub Actions**.
O endereço fica `https://claudehelenafj-rgb.github.io/habitcheck/`.

## Testes

```bash
npm test
```

> O Caderninho apoia a organização e não substitui acompanhamento médico ou terapêutico.
