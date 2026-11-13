# Ajaia Docs

A lightweight collaborative document editor: create, rich-text edit, import files, and share documents between users.

**Stack:** Node.js + Express, SQLite (Node built-in `node:sqlite`), Quill 1.3.7 editor (loaded from CDN), vanilla JS frontend. No paid services.

## Run locally
Requires Node 22.13 or newer (uses the built-in `node:sqlite`, so there is nothing native to compile).

```bash
npm install
npm start          # http://localhost:3000
npm test           # automated tests (in-memory DB)
```
The SQLite file `data.db` is created on first run, with three seeded users.

## Test accounts (mocked auth)
| Name | Email |
|------|-------|
| Alice | alice@example.com |
| Bob | bob@example.com |
| Carol | carol@example.com |

Click a name on the sign-in screen. Use "Switch user" to see the other side of sharing.

## Reviewer walkthrough (2 minutes)
1. Sign in as **Alice**, click **New document**, rename it, and format text (bold, italic, underline, H1-H3, bullet and numbered lists). It autosaves; refresh to confirm persistence.
2. Back on the dashboard, **upload** a `.txt`, `.md` or `.docx` file. It becomes a new editable document.
3. Open a document, click **Share**, enter `bob@example.com` as *editor* or *viewer*.
4. **Switch user** to Bob. The document appears under **Shared with me** with its role and owner. A viewer sees a read-only editor, an editor can change it.
5. As Alice, change Bob's role or remove access.

## Supported upload types
`.txt`, `.md`, `.docx` only, max 2 MB. This is stated in the UI. Other types are rejected with a clear error. DOCX import keeps headings, bold/italic, lists; images and complex layout are dropped.

## API summary
All `/api` routes except `/api/users` require the `x-user-id` header.

| Method | Route | Access |
|---|---|---|
| GET/POST | `/api/docs` | any user |
| GET | `/api/docs/:id` | owner, editor, viewer |
| PATCH | `/api/docs/:id` | owner, editor |
| DELETE | `/api/docs/:id` | owner |
| POST/DELETE | `/api/docs/:id/share[/:userId]` | owner |
| POST | `/api/upload` | any user |

## Deploy
`render.yaml` is included for Render (free web service): connect the repo, deploy, done. Note: on free hosting the disk is ephemeral, so the DB resets on redeploy or restart, and the seeded users are recreated automatically. See ARCHITECTURE.md.
