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

## Organisation du frontend

Le code est maintenant séparé par responsabilité : `components/auth`, `components/dashboard`, `components/reminders`, `components/groups`, `components/events`, `components/history`, `components/emails`, `components/statistics`, `components/settings`, `components/help`, `components/about`, ainsi que `lib` pour la configuration/traductions/utilitaires et `types` pour les types partagés.

`app/page.tsx` reste volontairement réservé à l'orchestration, à l'état global et aux appels API.

### URLs utilisées dans les emails
`NEXT_PUBLIC_APP_URL` doit être l'URL du frontend. Le backend utilise `ECHEO_FRONTEND_URL` pour fabriquer les liens de paiement et de récupération de mot de passe. Les deux valeurs doivent pointer vers le même frontend.
