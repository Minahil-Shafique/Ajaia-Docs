# Architecture Note

## Shape
Single Node/Express service serving a static frontend and a JSON API, backed by one SQLite file. One deployable unit keeps setup to `npm install && npm start` and removes CORS and infra concerns.

## Data model
- `users(id, email, name)`: seeded.
- `documents(id, title, content, owner_id, created_at, updated_at)`: `content` is sanitized HTML.
- `shares(doc_id, user_id, role)`: role is `viewer` or `editor`; primary key on (doc, user) so re-sharing updates the role. Cascade delete with the document.

## Access logic
One function resolves a user's role on a document (`owner`, `editor`, `viewer`, or none). A `withDoc(minRole)` middleware enforces it on every document route, so permissions live in one place. Only owners can share, unshare or delete; editors can edit content and title; viewers get a read-only editor.

## What I prioritized
1. **Correct access control and persistence**, since sharing is where bugs hurt most. Covered by tests.
2. **A usable editing flow:** Quill gives real rich text (headings, bold/italic/underline, lists) with little code. Debounced autosave plus flush on navigation and unload.
3. **Useful upload:** file becomes a new editable document, with server-side conversion (mammoth for docx, marked for md).
4. **Safety:** HTML is sanitized with an allowlist on save, so shared documents cannot carry scripts. Titles, roles, file type and size are validated server-side. Errors return JSON with a message shown in a toast.

## Deliberate scope cuts
- **Mocked auth:** the client sends `x-user-id` from a seeded-user picker. Fine for demonstrating sharing, not secure. Next step: real sessions or OAuth.
- **No real-time collaboration:** last write wins. Next step: Yjs/CRDT or at least an `updated_at` conflict check.
- **No version history, comments or export.**
- **SQLite on ephemeral disk** for the free deployment. Next step: Postgres (Supabase or Render) with the same SQL.
- Share by email limited to existing seeded users; no invite flow.
- Frontend is one vanilla JS file; with more time I would split components and add browser-level tests.

## Testing
`npm test` runs API tests (Node's built-in test runner) for: permission matrix across owner/viewer/editor/outsider, content persistence and sanitization, validation, and file upload (valid and rejected types).
