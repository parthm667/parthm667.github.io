import test, { beforeEach, afterEach } from 'node:test';
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
const AI_ENV = ['OPENAI_MODEL', 'OPENAI_API_KEY', 'AI_GATEWAY_API_KEY', 'VERCEL_OIDC_TOKEN', 'VERCEL'];
let previousEnv;
beforeEach(() => {
  previousEnv = Object.fromEntries(AI_ENV.map(name => [name, process.env[name]]));
  for (const name of AI_ENV) delete process.env[name];
});
afterEach(() => {
  for (const name of AI_ENV) {
    if (previousEnv[name] === undefined) delete process.env[name];
    else process.env[name] = previousEnv[name];
  }
});
function createHandler(options = {}) {
  return createResumePickerHandler({ pack, getOidcToken: async () => null, ...options });
}
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
  const handler = createHandler({ });
  assert.deepEqual(await (await handler(request('session'))).json(), { authenticated: false });
  for (const action of ['resumes', 'pdf&resume=SWE', 'analyze']) {
    const options = action === 'analyze' ? { method: 'POST', body: { jd: 'Python developer' } } : {};
    assert.equal((await handler(request(action, options))).status, 401);
  }
});

test('correct PIN unlocks only API-scoped private cookies and original PDF bytes', async () => {
  const handler = createHandler({ });
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
  const handler = createHandler({ });
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
  const handler = createHandler({ now: () => now });
  const cookie = await login(handler);
  const coldHandler = createHandler({ now: () => now });
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
  const handler = createHandler({ });
  const response = await handler(request('session'));
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.match(response.headers.get('x-robots-tag'), /noindex/);
  assert.equal((await handler(request('login', { method: 'POST', body: { password }, origin: 'https://evil.test' }))).status, 403);
  assert.equal((await handler(request('login', { method: 'POST', body: { password }, origin: null }))).status, 403);
  assert.equal((await handler(request('login'))).status, 405);
});

test('analysis validates input size and supports local analysis without an AI key', async () => {
  const handler = createHandler({ });
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
  const handler = createHandler({ });
  const cookie = await login(handler);
  const response = await handler(request('logout', { method: 'POST', cookie }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
});

test('loopback development can set a cookie even with production NODE_ENV', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const handler = createHandler({ });
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
    const handler = createHandler({ });
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

function successfulModelOutput() {
  return {
    concepts: [{ name: 'Python', category: 'hard_requirement', evidence: {
      SWE: { level: 1, quote: 'Built Python services and REST APIs.', reason: 'Demonstrated service implementation.' },
      AI: { level: 1, quote: 'Built Python AI models.', reason: 'Unsupported invented quote must be rejected.' },
    } }],
    eligibility: { status: 'Risk', explanation: 'Confirm requirements before applying.', checks: [] },
    humanOrder: ['SWE', 'AI', 'Defense', 'QD', 'Quant'], recommendedResume: 'SWE',
    why: 'Visible service implementation fits the backend role.', underSignaled: [], edits: [], track: '',
  };
}

test('AI defaults to GPT-6 Luna with compatible nonreasoning parameters and validates real scoring', async t => {
  const previousModel = process.env.OPENAI_MODEL;
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  delete process.env.OPENAI_MODEL;
  process.env.OPENAI_API_KEY = 'server-private-fixture-key';
  t.after(() => {
    globalThis.fetch = previousFetch;
    if (previousModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = previousModel;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  });
  const handler = createHandler({ });
  const cookie = await login(handler);
  let captured;
  let authorization;
  globalThis.fetch = async (_url, options) => {
    captured = JSON.parse(options.body);
    authorization = options.headers.Authorization;
    return Response.json({ model: 'gpt-6-luna-test-snapshot', choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(successfulModelOutput()) } }] });
  };
  const response = await handler(request('analyze', { method: 'POST', cookie, body: { jd: 'Python required for backend services.', mode: 'ai' } }));
  assert.equal(response.status, 200);
  assert.equal(captured.model, 'gpt-6-luna');
  assert.equal(captured.reasoning_effort, 'none');
  assert.equal(captured.max_completion_tokens, 12000);
  assert.equal(Object.hasOwn(captured, 'max_tokens'), false);
  assert.equal(captured.temperature, .1);
  assert.equal(captured.store, false);
  assert.deepEqual(captured.response_format, { type: 'json_object' });
  assert.equal(authorization, 'Bearer server-private-fixture-key');
  const result = await response.json();
  assert.equal(result.mode, 'ai');
  assert.equal(result.model, 'gpt-6-luna-test-snapshot');
  assert.equal(result.winner, 'SWE');
  assert.equal(result.scorecard.find(row => row.resume === 'SWE').coverage, 100);
  assert.equal(result.scorecard.find(row => row.resume === 'AI').coverage, 0);
  assert.equal(JSON.stringify(result).includes('server-private-fixture-key'), false);
  const metadata = await (await handler(request('resumes', { cookie }))).json();
  assert.equal(metadata.aiAvailable, true);
  assert.equal(metadata.aiModel, 'gpt-6-luna');
  assert.equal(JSON.stringify(metadata).includes('server-private-fixture-key'), false);
});

test('a legacy model override remains usable without Luna-specific reasoning settings', async t => {
  const previousModel = process.env.OPENAI_MODEL;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_MODEL = 'gpt-4.1-mini';
  t.after(() => {
    globalThis.fetch = previousFetch;
    if (previousModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = previousModel;
  });
  const handler = createHandler({ });
  const cookie = await login(handler);
  let captured;
  globalThis.fetch = async (_url, options) => {
    captured = JSON.parse(options.body);
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(successfulModelOutput()) } }] });
  };
  const response = await handler(request('analyze', { method: 'POST', cookie, body: { jd: 'Python required.', mode: 'ai', apiKey: 'ephemeral-fixture-key' } }));
  assert.equal(response.status, 200);
  assert.equal(captured.model, 'gpt-4.1-mini');
  assert.equal(Object.hasOwn(captured, 'reasoning_effort'), false);
  assert.equal(captured.max_completion_tokens, 12000);
  assert.equal(Object.hasOwn(captured, 'max_tokens'), false);
  assert.equal((await response.json()).model, 'gpt-4.1-mini');
  const metadata = await (await handler(request('resumes', { cookie }))).json();
  assert.equal(metadata.aiModel, 'gpt-4.1-mini');
});

test('Gateway OIDC is resolved for every request and uses exact OpenAI Luna routing', async t => {
  const previousFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = previousFetch; });
  let tokenReads = 0;
  const handler = createHandler({ getOidcToken: async () => `oidc-fixture-${++tokenReads}` });
  const cookie = await login(handler);
  const metadata = await (await handler(request('resumes', { cookie }))).json();
  assert.equal(metadata.aiAvailable, true);
  assert.equal(metadata.aiProvider, 'vercel-gateway');
  assert.equal(metadata.aiModel, 'gpt-6-luna');
  assert.equal(JSON.stringify(metadata).includes('oidc-fixture'), false);
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, authorization: options.headers.Authorization, body: JSON.parse(options.body) });
    return Response.json({ model: 'openai/gpt-6-luna', choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(successfulModelOutput()) } }] });
  };
  for (let index = 0; index < 2; index++) {
    const response = await handler(request('analyze', { method: 'POST', cookie, body: { jd: 'Python required.', mode: 'ai' } }));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.provider, 'vercel-gateway');
    assert.equal(result.model, 'openai/gpt-6-luna');
    assert.equal(result.winner, 'SWE');
    assert.equal(JSON.stringify(result).includes('oidc-fixture'), false);
  }
  assert.equal(tokenReads, 3);
  assert.deepEqual(calls.map(call => call.authorization), ['Bearer oidc-fixture-2', 'Bearer oidc-fixture-3']);
  for (const call of calls) {
    assert.equal(call.url, 'https://ai-gateway.vercel.sh/v1/chat/completions');
    assert.equal(call.body.model, 'openai/gpt-6-luna');
    assert.equal(call.body.reasoning_effort, 'none');
    assert.equal(call.body.max_completion_tokens, 12000);
    assert.equal(call.body.store, false);
    assert.deepEqual(call.body.providerOptions, { gateway: { only: ['openai'] } });
    assert.equal(Object.hasOwn(call.body.providerOptions.gateway, 'byok'), false);
  }
});

test('Gateway API keys take precedence over OIDC and prefixed model names are preserved', async t => {
  const previousFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = previousFetch; });
  process.env.AI_GATEWAY_API_KEY = 'gateway-private-fixture';
  process.env.OPENAI_MODEL = 'openai/gpt-6-luna';
  let tokenReads = 0;
  const handler = createHandler({ getOidcToken: async () => { tokenReads++; return 'unused-oidc-fixture'; } });
  const cookie = await login(handler);
  const metadata = await (await handler(request('resumes', { cookie }))).json();
  assert.equal(metadata.aiAvailable, true);
  assert.equal(metadata.aiProvider, 'vercel-gateway');
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, authorization: options.headers.Authorization, body: JSON.parse(options.body) };
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(successfulModelOutput()) } }] });
  };
  const response = await handler(request('analyze', { method: 'POST', cookie, body: { jd: 'Python required.', mode: 'ai' } }));
  assert.equal(response.status, 200);
  assert.equal(tokenReads, 0);
  assert.equal(captured.authorization, 'Bearer gateway-private-fixture');
  assert.equal(captured.body.model, 'openai/gpt-6-luna');
  assert.equal(captured.body.reasoning_effort, 'none');
  assert.equal(captured.url, 'https://ai-gateway.vercel.sh/v1/chat/completions');
  const result = await response.json();
  assert.equal(result.model, 'openai/gpt-6-luna');
  assert.equal(JSON.stringify(result).includes('gateway-private-fixture'), false);
});

test('explicit and server OpenAI keys take precedence over Gateway credentials', async t => {
  const previousFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = previousFetch; });
  process.env.OPENAI_API_KEY = 'server-openai-fixture';
  process.env.AI_GATEWAY_API_KEY = 'unused-gateway-fixture';
  let tokenReads = 0;
  const handler = createHandler({ getOidcToken: async () => { tokenReads++; return 'unused-oidc-fixture'; } });
  const cookie = await login(handler);
  const metadata = await (await handler(request('resumes', { cookie }))).json();
  assert.equal(metadata.aiProvider, 'openai');
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, authorization: options.headers.Authorization, body: JSON.parse(options.body) });
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(successfulModelOutput()) } }] });
  };
  for (const extra of [{ apiKey: 'explicit-openai-fixture' }, {}]) {
    const response = await handler(request('analyze', { method: 'POST', cookie, body: { jd: 'Python required.', mode: 'ai', ...extra } }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).provider, 'openai');
  }
  assert.equal(tokenReads, 0);
  assert.deepEqual(calls.map(call => call.authorization), ['Bearer explicit-openai-fixture', 'Bearer server-openai-fixture']);
  assert.ok(calls.every(call => call.url === 'https://api.openai.com/v1/chat/completions' && call.body.model === 'gpt-6-luna' && !Object.hasOwn(call.body, 'providerOptions')));
});

test('missing Gateway credentials give a private 503 and local analysis never resolves tokens', async t => {
  const previousFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = previousFetch; });
  let tokenReads = 0;
  let fetchCalls = 0;
  const handler = createHandler({ getOidcToken: async () => { tokenReads++; throw new Error('private-runtime-token-detail'); } });
  globalThis.fetch = async () => { fetchCalls++; throw new Error('No external requests expected.'); };
  const cookie = await login(handler);
  const local = await handler(request('analyze', { method: 'POST', cookie, body: { jd: 'Python required.', mode: 'local' } }));
  assert.equal(local.status, 200);
  assert.equal(tokenReads, 0);
  const metadata = await (await handler(request('resumes', { cookie }))).json();
  assert.equal(metadata.aiAvailable, false);
  assert.equal(metadata.aiProvider, null);
  const unavailable = await handler(request('analyze', { method: 'POST', cookie, body: { jd: 'Python required.', mode: 'ai' } }));
  assert.equal(unavailable.status, 503);
  const error = await unavailable.text();
  assert.match(error, /Gateway|API key/);
  assert.equal(error.includes('private-runtime-token-detail'), false);
  assert.equal(fetchCalls, 0);
});

test('Gateway authentication and billing failures return actionable errors without upstream secrets', async t => {
  const previousFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = previousFetch; });
  const handler = createHandler({ getOidcToken: async () => 'private-oidc-fixture' });
  const cookie = await login(handler);
  for (const [status, messagePattern] of [[401, /Gateway.*auth/i], [403, /Gateway.*auth/i], [402, /billing|credit|BYOK/i]]) {
    globalThis.fetch = async () => Response.json({ error: { message: 'private-upstream-secret' } }, { status });
    const response = await handler(request('analyze', { method: 'POST', cookie, body: { jd: 'Python required.', mode: 'ai' } }));
    assert.equal(response.status, 503);
    const error = await response.text();
    assert.match(error, messagePattern);
    assert.equal(error.includes('private-upstream-secret'), false);
    assert.equal(error.includes('private-oidc-fixture'), false);
  }
});
