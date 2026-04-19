This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Para ambiente local completo com Supabase + banco preparado + app:

```bash
npm run dev:local
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Email environment
http://127.0.0.1:54324/view/LYq3e6Hm7oSeMhZme9oXrb

## Documentacao interna

- Referencia da API de Acessos: [docs/access-api.md](docs/access-api.md)
- Referencia da API de Agenda: [docs/agenda-api.md](docs/agenda-api.md)
- Referencia da API de Comentarios publicos (landing): [docs/comments-api.md](docs/comments-api.md)
- Colecao REST Client unificada (smoke test): [docs/api.http](docs/api.http)
- Guia de troubleshooting de testes de API: [docs/api-testing.md](docs/api-testing.md)
- API de Sistema (status e setup): [docs/system-api.md](docs/system-api.md)
- Ledger oficial de versao e compatibilidade do baseline: [VERSION-CONTROL.md](VERSION-CONTROL.md)
- Manual de preenchimento do ledger: [VERSION-CONTROL-MANUAL.md](VERSION-CONTROL-MANUAL.md)

## Controle de versao do baseline

Para validar rapidamente se o ledger de compatibilidade esta consistente:

```bash
npm run version:check-ledger
```

## Prisma config

- Configuracao do Prisma centralizada em [prisma.config.ts](prisma.config.ts).
- O seed do Prisma e definido em migrations.seed para manter compatibilidade futura com Prisma 7.
