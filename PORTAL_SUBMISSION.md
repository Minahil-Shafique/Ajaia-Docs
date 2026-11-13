# Ajaia Docs: Submission

**Candidate:** Minahil Shafique

## Links
- **Google Drive folder:** DRIVE_FOLDER_LINK
- **Live product:** LIVE_URL
- **Walkthrough video:** VIDEO_URL

## Test accounts (no password, click to sign in)
- alice@example.com
- bob@example.com
- carol@example.com

Sharing test: sign in as Alice, open or create a document, click Share, enter bob@example.com. Use "Switch user" to sign in as Bob and see it under "Shared with me".

## What is included in the Drive folder
- `server.js`, `db.js`, `public/index.html`: source code
- `test/api.test.js`: automated tests (`npm test`)
- `README.md`: setup, run instructions, reviewer walkthrough
- `ARCHITECTURE.md`: architecture note
- `AI_WORKFLOW.md`: AI workflow note
- `SUBMISSION.md`: file list
- `walkthrough-video.txt`: video URL
- `package.json`, `render.yaml`, `DEPLOY.md`, `.gitignore`: tooling and deployment

## Run locally
```bash
npm install
npm start    # http://localhost:3000
npm test
```

## What works end to end
- Create, rename, edit and reopen documents; autosave; data persists across refresh (SQLite).
- Rich text: bold, italic, underline, headings H1-H3, bulleted and numbered lists.
- File upload: .txt, .md, .docx become new editable documents (max 2 MB, stated in the UI, others rejected).
- Sharing: owner grants access by email as editor or viewer; owned vs shared lists with role badges; owner can change or remove access; viewers are read-only.
- Server-side permission checks on every document route; HTML sanitized on save; validation and error messages.
- Automated tests for permissions, persistence, sanitization, validation and upload.

## Incomplete / deprioritized
- Auth is mocked on purpose (seeded users).
- No real-time collaboration (last write wins), version history, comments or export.
- Free-tier deployment uses SQLite on an ephemeral disk, so data resets on restart.

## Next 2-4 hours
Postgres persistence, real authentication, Markdown/PDF export, version history, an optimistic-concurrency check on save, and browser-level tests.

## Architecture in brief
One Express service serving a static frontend and JSON API over SQLite. Role resolution (owner, editor, viewer) lives in one middleware so permissions are consistent. See ARCHITECTURE.md.

## AI workflow in brief
Claude was used for scoping, scaffolding, tests and doc drafts. I rejected a heavier stack, chose Quill over a custom editor, added HTML sanitization, kept auth mocked deliberately, and verified with automated tests plus a manual two-user pass. See AI_WORKFLOW.md.
