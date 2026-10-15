import test from 'node:test';
import assert from 'node:assert/strict';
import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
import { createResumePickerHandler } from '../server/resume-picker.mjs';

const password = 'test-pin';
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(password, salt, 310000, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const payload = {
  sessionSecret: randomBytes(32).toString('hex'),
  facts: 'Graduating in 2027.',
  resumes: Object.fromEntries(['SWE', 'AI', 'Defense', 'QD', 'Quant'].map(name => [name, {
    filename: `${name}.pdf`, text: 'Built Python services and REST APIs.',
    pdf: Buffer.from('%PDF-1.4\nfixture\n%%EOF').toString('base64'),
  }])),
};
const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload)), cipher.final()]);
const pack = { version: 1, iterations: 310000, salt: salt.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
function request(action, { method = 'GET', body, cookie, origin = 'https://example.test' } = {}) {
  const headers = new Headers();
  if (cookie) headers.set('cookie', cookie);
  if (origin) headers.set('origin', origin);
  if (body !== undefined) headers.set('content-type', 'application/json');
  return new Request(`https://example.test/api/resume-picker?action=${action}`, {
    method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function login(handler) {
  const response = await handler(request('login', { method: 'POST', body: { password } }));
  assert.equal(response.status, 200);
  return response.headers.get('set-cookie').split(';')[0];
}

test('protected data and analysis require a valid authenticated session', async () => {
  const handler = createResumePickerHandler({ pack });
  assert.deepEqual(await (await handler(request('session'))).json(), { authenticated: false });
  for (const action of ['resumes', 'pdf&resume=SWE', 'analyze']) {
    const options = action === 'analyze' ? { method: 'POST', body: { jd: 'Python developer' } } : {};
    assert.equal((await handler(request(action, options))).status, 401);
  }
});

test('correct PIN unlocks only API-scoped private cookies and original PDF bytes', async () => {
  const handler = createResumePickerHandler({ pack });
  const response = await handler(request('login', { method: 'POST', body: { password } }));
  assert.equal(response.status, 200);
  const setCookie = response.headers.get('set-cookie');
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/api/resume-picker', 'Max-Age=28800']) assert.ok(setCookie.includes(flag));
  const cookie = setCookie.split(';')[0];
  assert.deepEqual(await (await handler(request('session', { cookie }))).json(), { authenticated: true });
  const data = await (await handler(request('resumes', { cookie }))).json();
  assert.equal(data.resumes.SWE, 'Built Python services and REST APIs.');
  assert.equal(data.files.Quant, 'Quant.pdf');
  assert.equal(data.facts, 'Graduating in 2027.');
  assert.equal(data.sessionSecret, undefined);
  assert.equal(data.resumes.SWE.pdf, undefined);
  const pdf = await handler(request('pdf&resume=SWE', { cookie }));
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get('content-type'), 'application/pdf');
  assert.equal(await pdf.text(), '%PDF-1.4\nfixture\n%%EOF');
  assert.equal((await handler(request('pdf&resume=unknown', { cookie }))).status, 400);
});

test('wrong PIN is generic and a sixth attempt is rate limited', async () => {
  const handler = createResumePickerHandler({ pack });
  for (let index = 0; index < 5; index++) {
    const response = await handler(request('login', { method: 'POST', body: { password: 'wrong' } }));
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Unable to sign in.' });
  }
  const blocked = await handler(request('login', { method: 'POST', body: { password } }));
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
});

test('forged and expired cookies cannot reveal resumes, including after a cold start', async () => {
  let now = 1000000;
  const handler = createResumePickerHandler({ pack, now: () => now });
  const cookie = await login(handler);
  const coldHandler = createResumePickerHandler({ pack, now: () => now });
  assert.equal((await coldHandler(request('resumes', { cookie }))).status, 200);
  const [name, raw] = cookie.split('=');
  const [encoded, signature] = raw.split('.');
  const forged = JSON.parse(Buffer.from(encoded, 'base64url').toString());
  forged.expires += 100000;
  const forgedCookie = `${name}=${Buffer.from(JSON.stringify(forged)).toString('base64url')}.${signature}`;
  assert.equal((await handler(request('resumes', { cookie: forgedCookie }))).status, 401);
  now += 28800001;
  assert.equal((await handler(request('resumes', { cookie }))).status, 401);
});

test('private responses forbid caching and cross-origin mutation requests fail', async () => {
  const handler = createResumePickerHandler({ pack });
  const response = await handler(request('session'));
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.match(response.headers.get('x-robots-tag'), /noindex/);
  assert.equal((await handler(request('login', { method: 'POST', body: { password }, origin: 'https://evil.test' }))).status, 403);
  assert.equal((await handler(request('login', { method: 'POST', body: { password }, origin: null }))).status, 403);
  assert.equal((await handler(request('login'))).status, 405);
});

test('analysis validates input size and supports local analysis without an AI key', async () => {
  const handler = createResumePickerHandler({ pack });
  const cookie = await login(handler);
  for (const body of [{ jd: '' }, { jd: 'a'.repeat(30001) }, { jd: 'Python developer', facts: 'a'.repeat(5001) }, { jd: 'Python developer', mode: 'other' }]) {
    assert.equal((await handler(request('analyze', { method: 'POST', body, cookie }))).status, 400);
  }
  assert.equal((await handler(request('analyze', { method: 'POST', body: { jd: 'a'.repeat(160000) }, cookie }))).status, 413);
  const response = await handler(request('analyze', { method: 'POST', cookie, body: { jd: 'Required: Python and REST APIs. Build backend services.', mode: 'local' } }));
  assert.equal(response.status, 200);
  assert.ok((await response.json()).scorecard.length === 5);
});

test('logout clears the scoped cookie', async () => {
  const handler = createResumePickerHandler({ pack });
  const cookie = await login(handler);
  const response = await handler(request('logout', { method: 'POST', cookie }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
});

test('loopback development can set a cookie even with production NODE_ENV', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const handler = createResumePickerHandler({ pack });
    const local = new Request('http://localhost:5173/api/resume-picker?action=login', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' }, body: JSON.stringify({ password }),
    });
    const response = await handler(local);
    assert.equal(response.status, 200);
    assert.ok(!response.headers.get('set-cookie').includes('; Secure'));
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test('AI mode clearly reports a missing key and rejects untrusted upstream output', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  delete process.env.OPENAI_API_KEY;
  try {
    const handler = createResumePickerHandler({ pack });
    const cookie = await login(handler);
    const missing = await handler(request('analyze', { method: 'POST', cookie, body: { jd: 'Required: Python', mode: 'ai' } }));
    assert.equal(missing.status, 503);
    assert.match((await missing.json()).error, /API key/);
    let captured;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.openai.com/v1/chat/completions');
      captured = JSON.parse(options.body);
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '{"concepts":"invalid"}' } }] });
    };
    const response = await handler(request('analyze', { method: 'POST', cookie, body: { jd: 'Required: Python', mode: 'ai', apiKey: 'test-private-key' } }));
    assert.equal(response.status, 502);
    assert.ok(!(await response.text()).includes('test-private-key'));
    assert.equal(captured.store, false);
    assert.deepEqual(captured.response_format, { type: 'json_object' });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
