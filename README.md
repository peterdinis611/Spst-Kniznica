# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@0.17.0 create --template minimal --types ts --add prettier eslint vitest="usages:component,unit" tailwindcss="plugins:typography,forms" drizzle="database:postgresql" better-auth="demo:password" --install bun .
```

## Developing

PostgreSQL 16 (Docker) holds the catalog. From the repo root:

```sh
bun run db:up
bun run db:migrate
bun run dev
```

`DATABASE_URL` defaults to `postgres://spst:spst@localhost:5432/spst` — copy `.env.example`. The fund is seeded on the first request. A leftover SQLite `local.db` is not imported.

Open the app in a browser:

```sh
bun run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
