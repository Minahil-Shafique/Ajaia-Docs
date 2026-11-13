# Walkthrough video script (target 4 minutes)

**0:00 Intro (20s).** "This is Ajaia Docs, a lightweight collaborative editor. I scoped it to document editing, file import and sharing, built on Express, SQLite and Quill so reviewers can run it with two commands."

**0:20 Main flow (75s).** Signed in as Alice. New document, rename it, show bold, italic, underline, a heading, a bulleted and a numbered list. Point at the "Saved" status, then refresh the page to show persistence.

**1:35 File upload (30s).** Back on the dashboard, upload a .md (or .docx) file. It opens as a new editable document. "Supported types are .txt, .md and .docx, stated in the UI, 2 MB limit, others are rejected."

**2:05 Sharing (60s).** Share a document with bob@example.com as viewer. Switch user to Bob: it appears under Shared with me with a viewer badge and owner name, and the editor is read-only. Switch back, change Bob to editor, switch to Bob again and edit. Mention that Alice can also remove access.

**3:05 Decisions and cuts (40s).** "Permissions are enforced in one middleware on the server, content is sanitized on save, there are API tests for the permission matrix. I deliberately cut real auth, real-time collaboration, version history and export, and used SQLite for simplicity. With another 2-4 hours I would add Postgres, real auth, export and conflict detection."

**3:45 AI usage (30s).** "I used Claude for scaffolding, tests and docs. I rejected a heavier stack, added sanitization, kept auth mocked on purpose, and verified with automated tests plus a manual two-user pass."

Tips: use Loom or YouTube set to unlisted/public link, keep it under 5 minutes, and test the link in a private window.
