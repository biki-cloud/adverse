<h1 align="center">🌍 AdVerse - 参加型広告プラットフォーム</h1>

<p align="center">
  世界中のユーザーが1マスずつ埋めていく、参加型の広告宇宙
</p>

## 📖 概要

AdVerseは、1000×1000マスの巨大グリッド上に広告を配置できる参加型プラットフォームです。

### ✨ 主な機能

- **巨大グリッド**: 1000×1000マスの広告スペース
- **インタラクティブな配置**: クリックでマスを選択し、広告を配置
- **クリック追跡**: 広告のクリック数と閲覧数をリアルタイムで追跡
- **創世エリア**: 最初の10×10マスは特別エリアとして表示
- **リアルタイム表示**: グリッド上で広告の配置状況を視覚的に確認

### 🛠️ 技術スタック

- **Frontend**: Next.js 15 + App Router + Canvas + TailwindCSS
- **Backend**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Hosting**: Cloudflare Pages
- **Database**: Drizzle ORM + Drizzle Kit

---

# Getting started

## Prerequisites

1. Node.js >=v20.11.0
2. pnpm >=v9.15.1

## Initialise the database(s)

1. [Create a production D1 database.](https://developers.cloudflare.com/d1/get-started/#3-create-a-database)
2. The starter kit focuses on 2 environments, **development on local machine** and **production on
   remote machine**. So, create the following files:

   1. `.env.development`: duplicate `.env.example`, and set the variables to development values.
   2. `.env.production`: duplicate `.env.example`, and set the variables to production values.
   3. `wrangler.toml.development`: duplicate `wrangler.toml.example`, and set the variables to
      development values.
   4. `wrangler.toml.production`: duplicate `wrangler.toml.example`, and set the variables to
      production values.

3. Install the app's dependencies:

```sh
pnpm install
```

4. Generate db migration files (that documents schema changes in an SQL script).

```sh
pnpm db:generate
```

5. Run db migrations (that executes the SQL script to update the database to match the schema).

- dev (local) db: `pnpm db:migrate:dev`
- prod (remote) db: `pnpm db:migrate:prod`

6. View the database using a graphical user interface:

- dev (local) db: `pnpm db:studio:dev`
- prod (remote) db: `pnpm db:studio:prod`

## Run the app

- Run Next.js on dev. Ideal for development since it supports hot-reload/fast refresh.

```sh
pnpm dev
```

⚠️ **Warning**: `next start` will return an error due to how the application is designed to run on
Cloudflare pages.

- Run Cloudflare Pages locally. Ideal to test how the app would work after being deployed.

```sh
pnpm pages:dev
```

⚠️ **Warning #1**: Connecting to the prod remote db on the local code
[is not supported](https://developers.cloudflare.com/d1/build-with-d1/local-development/).
`pnpm db:studio:prod` is not work. error is
`7403: The given account is not valid or is not authorized to access this service`.

⚠️ **Warning #2**: All pages deployed to Cloudflare Pages run on edge runtime, whereas
[ISR only works on Nodejs runtime](https://developers.cloudflare.com/pages/framework-guides/nextjs/ssr/supported-features/)
(because how Vercel designed their functions); so, some functions like `revalidatePath` will throw
an error when running the app with `pnpm pages:dev`. But, the functions work as expected after
deploying.

⚠️ **Warning #3**: if working in pages, root(/) path is not working. error message is `Not Found`.
But `pnpm dev` is working. I want to fix this.

## Deploy

- Deploy code to pages:

```sh
pnpm pages:deploy
```
