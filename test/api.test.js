process.env.DB_PATH = ':memory:';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../server');

let server, base;
before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; r(); }); }));
after(() => server.close());

const api = (uid, method, url, body) => fetch(base + url, {
  method, headers: { 'content-type': 'application/json', 'x-user-id': String(uid) },
  body: body ? JSON.stringify(body) : undefined,
});
const ALICE = 1, BOB = 2;

test('sharing: owner/viewer/editor permissions end to end', async () => {
  const { id } = await (await api(ALICE, 'POST', '/api/docs', { title: 'Plan' })).json();
  assert.strictEqual((await api(BOB, 'GET', `/api/docs/${id}`)).status, 403);

  assert.strictEqual((await api(ALICE, 'POST', `/api/docs/${id}/share`, { email: 'bob@example.com', role: 'viewer' })).status, 200);
  const asBob = await (await api(BOB, 'GET', `/api/docs/${id}`)).json();
  assert.strictEqual(asBob.role, 'viewer');
  assert.strictEqual((await api(BOB, 'PATCH', `/api/docs/${id}`, { content: '<p>x</p>' })).status, 403);

  await api(ALICE, 'POST', `/api/docs/${id}/share`, { email: 'bob@example.com', role: 'editor' });
  assert.strictEqual((await api(BOB, 'PATCH', `/api/docs/${id}`, { content: '<p><strong>hi</strong></p>' })).status, 200);

  const list = await (await api(BOB, 'GET', '/api/docs')).json();
  assert.strictEqual(list.shared.length, 1);
  assert.strictEqual(list.owned.length, 0);
});

test('persistence + sanitization of saved content', async () => {
  const { id } = await (await api(ALICE, 'POST', '/api/docs', {})).json();
  await api(ALICE, 'PATCH', `/api/docs/${id}`, { title: 'Renamed', content: '<h1>T</h1><ul><li>a</li></ul><script>alert(1)</script>' });
  const d = await (await api(ALICE, 'GET', `/api/docs/${id}`)).json();
  assert.strictEqual(d.title, 'Renamed');
  assert.match(d.content, /<h1>T<\/h1><ul><li>a<\/li><\/ul>/);
  assert.doesNotMatch(d.content, /script/);
});

test('validation and upload handling', async () => {
  assert.strictEqual((await api(ALICE, 'POST', '/api/docs', { title: '  ' })).status, 400);
  assert.strictEqual((await fetch(base + '/api/docs')).status, 401);

  const form = (name, text) => { const f = new FormData(); f.append('file', new Blob([text]), name); return f; };
  const headers = { 'x-user-id': String(ALICE) };
  const ok = await fetch(base + '/api/upload', { method: 'POST', headers, body: form('notes.md', '# Hello\n\n- one\n- two') });
  assert.strictEqual(ok.status, 201);
  const { id } = await ok.json();
  const d = await (await api(ALICE, 'GET', `/api/docs/${id}`)).json();
  assert.strictEqual(d.title, 'notes');
  assert.match(d.content, /<h1>Hello<\/h1>/);

  const bad = await fetch(base + '/api/upload', { method: 'POST', headers, body: form('evil.exe', 'x') });
  assert.strictEqual(bad.status, 400);
});
