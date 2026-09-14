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

## Running the full stack locally (site + backend + admin)

This repo has three independently-runnable pieces:

- The live site (this folder) — port 4000
- `backend/` — the API + SQLite database — port 5000
- `admin/` — the Admin Panel — port 3001

First-time setup:

```bash
# Backend
cd backend
npm install
cp .env.example .env   # then edit JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npx prisma migrate dev --name init
npm run seed

# Admin
cd ../admin
npm install
cp .env.example .env.local

# Site
cd ..
cp .env.example .env.local
npm install
```

Every day after that, run all three in separate terminals:

```bash
cd backend && npm run dev     # http://localhost:5000
cd admin && npm run dev       # http://localhost:3001
npm run dev                   # http://localhost:4000 (site, from the repo root)
```

Log into the Admin Panel at `http://localhost:3001/login` with the
`ADMIN_EMAIL`/`ADMIN_PASSWORD` you set in `backend/.env`. Posts created or
edited there appear on the live site's `/blogs` page immediately. Contact
form submissions on the live site appear under Admin → Messages.

If the backend isn't running, the live site's blog pages automatically
fall back to the bundled `public/fakedata/blogs.json` instead of failing.

SMTP is not configured yet — contact submissions are saved and visible in
Admin either way; email notifications start working once `backend/.env`'s
`SMTP_*` values are filled in.
