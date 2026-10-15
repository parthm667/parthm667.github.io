import test from 'node:test';
import assert from 'node:assert/strict';
import { answerCounts, validateAnswerInput, draftApplicationAnswer } from '../server/application-answer.mjs';

const context = {
  storyBank: 'I built a road safety tool after volunteering for safer streets. It reduced a week of work to minutes.',
  resumes: { SWE: 'Built production Go services.', AI: 'Evaluated model reliability.', Defense: 'Built a C++ robot.', QD: 'Developed a replay engine.', Quant: 'Evaluated a paper-trading equity strategy in simulation.' },
};
const input = () => validateAnswerInput({ question: 'What have you built?', jd: 'Build useful software.', facts: '', notes: '' });
const result = (answer = 'I built a road safety tool.') => ({
  data: { answer, sources: [{ source: 'story-bank', quote: 'I built a road safety tool' }], needsConfirmation: [] },
  model: 'openai/gpt-6-luna', provider: 'vercel-gateway',
});

test('counts words by whitespace and characters as Unicode code points', () => {
  assert.deepEqual(answerCounts('  A\nrobot 🤖 works.  '), { wordCount: 4, characterCount: 20 });
  assert.deepEqual(answerCounts(''), { wordCount: 0, characterCount: 0 });
});

test('input limits reject malformed or excessive questions, context, and length constraints', () => {
  for (const patch of [{ question: '' }, { question: 'x'.repeat(8001) }, { jd: 'x'.repeat(30001) }, { facts: 'x'.repeat(5001) }, { notes: 'x'.repeat(10001) }, { companyType: 'x'.repeat(201) }, { limit: { unit: 'bytes', max: 10 } }, { limit: { unit: 'words', max: 0 } }, { limit: { unit: 'words', max: 1.5 } }, { limit: { unit: 'words', max: 5001 } }, { limit: { unit: 'characters', max: 20001 } }, { mode: 'local' }]) {
    assert.throws(() => validateAnswerInput({ question: 'What did you build?', ...patch }), error => error.status === 400);
  }
  assert.deepEqual(validateAnswerInput({ question: 'Question', limit: { unit: 'characters', max: 20000 } }).limit, { unit: 'characters', max: 20000 });
  assert.equal(validateAnswerInput({ question: 'Question', limit: null }).limit, null);
});

test('drafting sends all sources and validates literal normalized citations', async () => {
  let messages;
  const output = await draftApplicationAnswer(input(), context, async sent => {
    messages = sent;
    return result();
  });
  assert.equal(output.answer, 'I built a road safety tool.');
  assert.equal(output.wordCount, 6);
  assert.equal(output.characterCount, 27);
  assert.equal(output.model, 'openai/gpt-6-luna');
  assert.equal(output.provider, 'vercel-gateway');
  const supplied = JSON.parse(messages[1].content);
  assert.equal(supplied.sources['story-bank'], context.storyBank);
  for (const name of Object.keys(context.resumes)) assert.equal(supplied.sources[`resume:${name}`], context.resumes[name]);
  const normalized = result();
  normalized.data.sources[0].quote = 'I built\n a road safety tool';
  assert.equal((await draftApplicationAnswer(input(), context, async () => normalized)).sources[0].source, 'story-bank');
});

test('nonempty answers reject invented quotes, unknown sources, and missing evidence', async () => {
  for (const sources of [[], [{ source: 'story-bank', quote: 'Invented billion dollar business.' }], [{ source: 'company-site', quote: 'I built a road safety tool' }]]) {
    const response = result();
    response.data.sources = sources;
    await assert.rejects(draftApplicationAnswer(input(), context, async () => response), error => error.status === 502);
  }
});

test('an unanswered factual question returns clarifications instead of fabricated facts', async () => {
  const response = result('');
  response.data.sources = [];
  response.data.needsConfirmation = ['Confirm your current graduation date.'];
  const output = await draftApplicationAnswer(input(), context, async () => response);
  assert.equal(output.answer, '');
  assert.deepEqual(output.needsConfirmation, ['Confirm your current graduation date.']);
});

test('overlength prose is rewritten once with the same deadline and never clipped', async () => {
  const bounded = validateAnswerInput({ question: 'What did you build?', limit: { unit: 'words', max: 6 } });
  const calls = [];
  const output = await draftApplicationAnswer(bounded, context, async (messages, options) => {
    calls.push({ messages: structuredClone(messages), signal: options.signal });
    return result(calls.length === 1 ? 'I built a road safety tool for local volunteers.' : 'I built a road safety tool.');
  });
  assert.equal(calls.length, 2);
  assert.equal(output.wordCount, 6);
  assert.equal(output.answer, 'I built a road safety tool.');
  assert.equal(calls[0].signal, calls[1].signal);
  assert.match(calls[1].messages.at(-1).content, /rewrite|limit/i);
  await assert.rejects(draftApplicationAnswer(bounded, context, async () => result('I built a road safety tool for local volunteers.')), error => error.status === 422);
});

test('character limits count emoji once and reject a second oversized model response', async () => {
  const bounded = validateAnswerInput({ question: 'What did you build?', limit: { unit: 'characters', max: 3 } });
  assert.equal((await draftApplicationAnswer(bounded, context, async () => result('A🤖.'))).characterCount, 3);
  await assert.rejects(draftApplicationAnswer(bounded, context, async () => result('A🤖 works.')), error => error.status === 422);
});

test('conflicting live equity claims need confirmation and require conservative qualification', async () => {
  const conflicting = { ...context, storyBank: 'I live-deployed a long/short equity strategy.' };
  const paper = result('I evaluated an equity strategy in paper trading.');
  paper.data.sources = [{ source: 'resume:Quant', quote: context.resumes.Quant }];
  const safe = await draftApplicationAnswer(input(), conflicting, async () => paper);
  assert.ok(safe.needsConfirmation.some(value => /live|paper/i.test(value)));
  const live = result('I live-deployed an equity strategy.');
  live.data.sources = [{ source: 'story-bank', quote: conflicting.storyBank }];
  await assert.rejects(draftApplicationAnswer(input(), conflicting, async () => live), error => error.status === 502);
});

test('an expired shared deadline prevents another completion request', async () => {
  let calls = 0;
  await assert.rejects(draftApplicationAnswer(input(), context, async () => { calls++; return result(); }, { signal: AbortSignal.abort() }), error => error.status === 504);
  assert.equal(calls, 0);
});

test('unrelated photography and production deployment drafts do not inherit trading conflicts', async () => {
  const conflicting = { ...context, storyBank: 'I live-deployed a long/short equity strategy. I photographed wildlife.' };
  for (const [answer, source, quote] of [
    ['I photographed wildlife.', 'story-bank', 'I photographed wildlife.'],
    ['I worked on live deployments of Go services.', 'resume:SWE', 'Built production Go services.'],
  ]) {
    const response = result(answer);
    response.data.sources = [{ source, quote }];
    const output = await draftApplicationAnswer(input(), conflicting, async () => response);
    assert.equal(output.answer, answer);
    assert.deepEqual(output.needsConfirmation, []);
  }
});

test('a supported equity-markets interest does not become a personal trading-strategy claim', async () => {
  const conflicting = { ...context, storyBank: 'I live-deployed a long/short equity strategy.' };
  const notes = 'I am interested in equity markets because I like testing hypotheses.';
  const response = result(notes);
  response.data.sources = [{ source: 'user-notes', quote: notes }];
  const output = await draftApplicationAnswer(validateAnswerInput({ question: 'What interests you?', notes }), conflicting, async () => response);
  assert.equal(output.answer, notes);
  assert.deepEqual(output.needsConfirmation, []);
});
