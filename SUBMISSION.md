# Submission

## Included
- `server.js`, `db.js`, `public/index.html`: source code
- `test/api.test.js`: automated tests (`npm test`)
- `package.json`, `render.yaml`, `DEPLOY.md`, `.gitignore`: tooling and deployment config
- `VIDEO_SCRIPT.md`: script used for the walkthrough video
- `README.md`: setup, run instructions, test accounts, reviewer walkthrough
- `ARCHITECTURE.md`: architecture note
- `AI_WORKFLOW.md`: AI workflow note
- `walkthrough-video.txt`: walkthrough video URL
- `SUBMISSION.md`: this file

## Live URL
LIVE_URL_HERE

## Test accounts
alice@example.com, bob@example.com, carol@example.com (click to sign in, no password).

## What works end to end
Create, rename, rich-text edit (bold, italic, underline, H1-H3, bullet and numbered lists), autosave, reopen after refresh; upload .txt/.md/.docx into a new document; share by email as viewer or editor; owned vs shared lists with role badges; change or remove access; delete (owner); server-side permission checks; HTML sanitization; validation and error toasts.

## Incomplete / deprioritized
Real authentication (mocked on purpose), real-time collaboration, version history, comments, export, database that survives redeploys on the free host.

## Next 2-4 hours
Postgres persistence, real auth, markdown/PDF export, version history, optimistic-concurrency check on save, and browser-level tests.
