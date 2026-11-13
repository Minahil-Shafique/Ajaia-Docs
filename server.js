const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');
const path = require('path');
const db = require('./db');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const ALLOWED_EXT = ['.txt', '.md', '.docx'];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

const clean = (html) => sanitizeHtml(html || '', {
  allowedTags: ['h1', 'h2', 'h3', 'p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'a', 'blockquote'],
  allowedAttributes: { a: ['href'], '*': ['class'] },
  allowedClasses: { '*': [/^ql-/] },
  allowedSchemes: ['http', 'https', 'mailto'],
});
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const err = (res, code, message) => res.status(code).json({ error: message });

// Mocked auth: client sends the seeded user's id in x-user-id
app.use('/api', (req, res, next) => {
  if (req.path === '/users') return next();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.header('x-user-id')));
  if (!user) return err(res, 401, 'Please sign in');
  req.user = user;
  next();
});

function roleFor(docId, userId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  if (!doc) return { doc: null, role: null };
  if (doc.owner_id === userId) return { doc, role: 'owner' };
  const s = db.prepare('SELECT role FROM shares WHERE doc_id = ? AND user_id = ?').get(docId, userId);
  return { doc, role: s ? s.role : null };
}
// Loads doc + role, enforces minimum permission
const withDoc = (need) => (req, res, next) => {
  const { doc, role } = roleFor(Number(req.params.id), req.user.id);
  if (!doc) return err(res, 404, 'Document not found');
  if (!role) return err(res, 403, 'You do not have access to this document');
  const rank = { viewer: 1, editor: 2, owner: 3 };
  if (rank[role] < rank[need]) return err(res, 403, `Requires ${need} access`);
  req.doc = doc; req.role = role;
  next();
};
const validTitle = (t) => typeof t === 'string' && t.trim().length > 0 && t.length <= 200;
const createDoc = (title, content, ownerId) =>
  db.prepare('INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)').run(title, content, ownerId).lastInsertRowid;

app.get('/api/users', (req, res) => res.json(db.prepare('SELECT id, name, email FROM users').all()));

app.get('/api/docs', (req, res) => {
  const owned = db.prepare('SELECT id, title, updated_at FROM documents WHERE owner_id = ? ORDER BY updated_at DESC').all(req.user.id);
  const shared = db.prepare(`SELECT d.id, d.title, d.updated_at, s.role, u.name AS owner_name
    FROM shares s JOIN documents d ON d.id = s.doc_id JOIN users u ON u.id = d.owner_id
    WHERE s.user_id = ? ORDER BY d.updated_at DESC`).all(req.user.id);
  res.json({ owned, shared });
});

app.post('/api/docs', (req, res) => {
  const title = req.body.title === undefined ? 'Untitled document' : req.body.title;
  if (!validTitle(title)) return err(res, 400, 'Title is required (max 200 characters)');
  res.status(201).json({ id: createDoc(title.trim(), '', req.user.id) });
});

app.get('/api/docs/:id', withDoc('viewer'), (req, res) => {
  const owner = db.prepare('SELECT name FROM users WHERE id = ?').get(req.doc.owner_id);
  const out = { id: req.doc.id, title: req.doc.title, content: req.doc.content, role: req.role, owner_name: owner.name, updated_at: req.doc.updated_at };
  if (req.role === 'owner') {
    out.shares = db.prepare('SELECT u.id AS user_id, u.name, u.email, s.role FROM shares s JOIN users u ON u.id = s.user_id WHERE s.doc_id = ?').all(req.doc.id);
  }
  res.json(out);
});

app.patch('/api/docs/:id', withDoc('editor'), (req, res) => {
  const { title, content } = req.body;
  if (title !== undefined && !validTitle(title)) return err(res, 400, 'Title is required (max 200 characters)');
  if (content !== undefined && typeof content !== 'string') return err(res, 400, 'Content must be a string');
  db.prepare("UPDATE documents SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?")
    .run(title === undefined ? req.doc.title : title.trim(), content === undefined ? req.doc.content : clean(content), req.doc.id);
  res.json({ ok: true });
});

app.delete('/api/docs/:id', withDoc('owner'), (req, res) => {
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.doc.id);
  res.json({ ok: true });
});

app.post('/api/docs/:id/share', withDoc('owner'), (req, res) => {
  const { email, role = 'editor' } = req.body;
  if (!['viewer', 'editor'].includes(role)) return err(res, 400, 'Role must be viewer or editor');
  const target = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').trim().toLowerCase());
  if (!target) return err(res, 404, 'No user with that email');
  if (target.id === req.user.id) return err(res, 400, 'You already own this document');
  db.prepare('INSERT INTO shares (doc_id, user_id, role) VALUES (?, ?, ?) ON CONFLICT(doc_id, user_id) DO UPDATE SET role = excluded.role')
    .run(req.doc.id, target.id, role);
  res.json({ ok: true });
});

app.delete('/api/docs/:id/share/:userId', withDoc('owner'), (req, res) => {
  db.prepare('DELETE FROM shares WHERE doc_id = ? AND user_id = ?').run(req.doc.id, Number(req.params.userId));
  res.json({ ok: true });
});

// Upload .txt / .md / .docx and turn it into a new editable document
app.post('/api/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return err(res, 400, 'No file provided');
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return err(res, 400, `Unsupported file type. Allowed: ${ALLOWED_EXT.join(', ')}`);
    let html;
    if (ext === '.docx') html = (await mammoth.convertToHtml({ buffer: req.file.buffer })).value;
    else if (ext === '.md') html = marked.parse(req.file.buffer.toString('utf8'));
    else html = req.file.buffer.toString('utf8').split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
    const title = path.basename(req.file.originalname, ext).slice(0, 200) || 'Imported document';
    res.status(201).json({ id: createDoc(title, clean(html), req.user.id) });
  } catch (e) { next(e); }
});

app.use((e, req, res, next) => {
  if (e instanceof multer.MulterError) return err(res, 400, e.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 2 MB)' : e.message);
  console.error(e);
  err(res, 500, 'Something went wrong');
});

module.exports = app;
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
}
