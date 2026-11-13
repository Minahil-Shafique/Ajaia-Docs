# AI Workflow Note

## Tools used
Claude (Anthropic), in chat, for the whole build: scoping, scaffolding the backend and frontend, writing tests, and drafting the docs. I used no other AI tools.

## Where AI materially sped me up
- **Scoping:** turning the open-ended prompt into a short list of must-haves (create/edit, upload, sharing, persistence, tests, docs) and an explicit list of cuts, so I did not drift into Google Docs features.
- **Boilerplate:** SQLite schema, CRUD routes, the role-resolution middleware, and the three file converters (txt, md, docx).
- **Tests:** drafting the permission matrix (outsider, viewer, editor, owner) and the upload cases.
- **Docs:** first drafts of the README, architecture note and submission file, which I then checked against the code.

## What I changed or rejected
- **Rejected a heavier stack** (React + Postgres + real auth). It adds setup friction for reviewers and eats the timebox. I kept Express + SQLite + vanilla JS so the app runs with `npm install && npm start`.
- **Chose Quill over a hand-rolled contenteditable editor.** Rich text from scratch is a time sink with many browser quirks, and the brief asks for judgment, not an editor from scratch.
- **Kept auth mocked on purpose** (seeded users, `x-user-id` header) and documented it as insecure, rather than shipping half-built real auth.
- **Added HTML sanitization on save.** Shared documents are a stored-XSS vector, so content is passed through an allowlist before it reaches the database.
- **Fixed an AI-generated mistake:** the first scaffolding command used brace expansion that the shell did not support, so the test directory was never created. The test run exposed it and I recreated the directories and re-ran. I also pointed the test script at the specific test file instead of a directory so it works on newer Node versions.
- **Enforced permissions server-side only.** The UI hides buttons by role, but the API is the source of truth, and the tests hit the API directly.

## How I verified correctness
- **Automated API tests** (`npm test`, 3 test groups, all passing): outsider gets 403; viewer can read but not write; editor can write; role upgrade works; shared vs owned lists; persistence of title and content; script tags stripped; empty title rejected; unauthenticated request gets 401; markdown upload converts to HTML; `.exe` upload rejected.
- **Smoke test:** booted the server and confirmed the seeded users endpoint and the static page respond.
- **Manual end-to-end pass in the browser as two users** (Alice and Bob): create, rename, format, refresh to confirm persistence, upload each file type, share as viewer then editor, confirm the read-only state, remove access.
- **Code review of the generated code:** every document route goes through the same `withDoc(minRole)` middleware, and no route trusts a client-supplied role.
