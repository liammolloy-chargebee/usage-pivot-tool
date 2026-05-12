# Deploying without installing anything locally

You don't need Node.js, npm, or anything on your laptop. GitHub builds and hosts the app for you.

## Path A — GitHub Pages (recommended, free, permanent URL)

### One-time setup (~5 minutes)

1. **Create a GitHub account** if you don't have one: <https://github.com/signup>
2. **Create a new repo** at <https://github.com/new>
   - Name suggestion: `usage-pivot-tool`
   - Visibility: **Private** is fine — Pages still works on private repos (Pro/Team/Enterprise) or use **Public** if your account is free and the data inside the app stays in the browser anyway.
   - Do **not** initialize with a README — we already have one.
3. **Upload the project**
   - On the empty repo page, click **uploading an existing file**.
   - Drag the entire `usage-pivot-tool/` folder contents (everything except `node_modules/` and `dist/`, which don't exist yet) into the upload area.
   - Make sure the `.github/workflows/deploy.yml` file is included — it's the build recipe. (If GitHub's drag-drop hides dotfiles, see "Tip" below.)
   - Commit directly to `main`.
4. **Enable GitHub Pages**
   - Go to the repo's **Settings → Pages**.
   - Under **Build and deployment → Source**, choose **GitHub Actions**.
5. **Watch the build run**
   - Open the **Actions** tab. The "Deploy to GitHub Pages" workflow runs automatically on every push to `main`. First run takes ~1–2 minutes.
   - When it finishes, the green checkmark page shows a **page_url** like `https://<your-user>.github.io/usage-pivot-tool/`.

Open that URL — that's your tool. Bookmark it. Every future push to `main` redeploys automatically.

> **Tip — dotfile upload:** GitHub's web uploader sometimes hides folders that start with a dot. If `.github/` doesn't appear in your upload, drag the parent folder instead, or use the **Add file → Create new file** button and type `.github/workflows/deploy.yml` as the path, then paste the file contents.

### Updating later

- Edit any file in the repo via the GitHub website (pencil icon → edit → "Commit changes").
- Actions rebuilds and redeploys within ~2 minutes. No local tooling needed.

### Repo layout for upload

Put the **contents** of your local `usage-pivot-tool` folder at the **root** of the GitHub repo (not nested inside another folder with the same name). After upload, the repo should look like this:

```
( GitHub repo root — what you see on github.com/yourname/your-repo )
├── .github
│   └── workflows
│       └── deploy.yml
├── fixtures
│   └── sample.csv
├── src
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components
│   └── lib
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── README.md
└── DEPLOY.md
```

You do **not** need a second `usage-pivot-tool/` folder inside the repo. The workflow builds from the repo root and publishes the `dist/` folder GitHub Actions generates on each run.

## Path B — StackBlitz (zero setup, instant)

Use this if you just want to try the tool right now without creating a repo.

1. Go to <https://stackblitz.com> (sign in with GitHub if you want to save).
2. Click **Create** → **Vite** → **React + TypeScript**.
3. Drag the contents of `usage-pivot-tool/` into the file tree (replacing the sample files), or use **Import from GitHub** if you've already pushed.
4. StackBlitz installs deps and runs `npm run dev` in the browser. The preview pane is a live URL you can share.

Downside: the URL is project-specific and tied to your StackBlitz session — fine for personal use, less ideal as a long-lived team link.

## Path C — Vercel (GitHub-connected)

Same idea as Pages but with a nicer dashboard and custom-domain support.

1. Push the project to GitHub (steps 1–3 of Path A).
2. Sign in at <https://vercel.com> with GitHub.
3. **Add New Project → Import** your repo.
4. **Root Directory:** leave as **`.`** (repo root) if you uploaded the app files at the root, as above. Framework should auto-detect as Vite.
5. **Environment Variables:** *(leave empty — Vercel serves from `/`, so `BASE_PATH` isn't needed)*.
6. Deploy. You get a URL like `https://usage-pivot-tool.vercel.app/`.

## A note on Google Apps Script

Google Apps Script can't host this Vite/React app directly. If you ever want a Google-native version, the equivalent is a **Google Sheets template with a bound Apps Script** that:

1. Asks you to paste / import the CSV into a sheet.
2. Runs a menu command that converts the date column, formats the amount, and inserts a pivot table.

That's a different build (no React, no upload UI) — happy to scaffold it as a separate deliverable if you'd prefer to live entirely inside Google Workspace.

## Troubleshooting

- **Pages build fails on "Get Pages site":** Make sure Settings → Pages → Source is set to **GitHub Actions** (not "Deploy from a branch").
- **Blank page on the deployed URL with 404s for `/assets/...`:** The `BASE_PATH` doesn't match the repo name. Confirm the repo is called `usage-pivot-tool`, or update `BASE_PATH` in `.github/workflows/deploy.yml`.
- **Action error about a missing `package-lock.json`:** The current workflow doesn't cache `node_modules`, so this shouldn't happen. If it does, ensure you're using the `deploy.yml` shipped in this repo (no `cache: npm` line in `actions/setup-node`).
