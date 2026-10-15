import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeJob, scoreAnalysis } from '../src/resume-picker/analysis.js';

const resumes = { SWE: 'Built Python services. SQL.', AI: 'Python.' };
const model = () => ({
  concepts: [
    { name: 'Python', category: 'hard_requirement', evidence: { SWE: { level: 1, quote: 'Built Python services.', reason: 'Implemented services' }, AI: { level: .75, quote: 'Python.', reason: 'Listed' } } },
    { name: 'SQL', category: 'core_responsibility', evidence: { SWE: { level: .75, quote: 'SQL.', reason: 'Listed' }, AI: { level: 0, quote: '', reason: 'Absent' } } },
  ],
  eligibility: { status: 'Risk', explanation: 'Authorization unknown.', checks: [] },
  humanOrder: ['AI', 'SWE'], recommendedResume: 'AI', why: 'AI research story fits.', underSignaled: [], edits: [], track: 'AI systems',
});

test('calculates weighted coverage and cosine independently and explains a judgment override', () => {
  const result = scoreAnalysis(model(), resumes, '');
  const swe = result.scorecard.find(row => row.resume === 'SWE');
  const ai = result.scorecard.find(row => row.resume === 'AI');
  assert.ok(Math.abs(swe.coverage - 91.66666666666667) < 1e-9);
  assert.ok(Math.abs(swe.cosine - .9945054529214061) < 1e-9);
  assert.equal(ai.coverage, 50);
  assert.ok(Math.abs(ai.cosine - .8944271909999159) < 1e-9);
  assert.equal(result.rawWinner, 'SWE');
  assert.equal(result.winner, 'AI');
  assert.match(result.why, /Raw score winner is SWE, but I recommend AI/);
});

test('perfectly aligned weighted vectors have cosine exactly one despite rounding', () => {
  const data = model();
  data.concepts = ['hard_requirement', 'explicitly_required', 'core_responsibility'].map((category, index) => ({
    name: `Requirement ${index + 1}`, category,
    evidence: { SWE: { level: 1, quote: 'Python', reason: 'Supported' }, AI: { level: 1, quote: 'Python', reason: 'Supported' } },
  }));
  const result = scoreAnalysis(data, resumes, '');
  assert.ok(result.scorecard.every(row => row.cosine === 1));
});

test('refuses invented evidence quotes and keeps zero-norm vectors finite', () => {
  const input = model();
  input.concepts = [{ name: 'Rust', category: 'explicitly_required', evidence: { SWE: { level: 1, quote: 'Built Rust services.', reason: 'Invented' } } }];
  const result = scoreAnalysis(input, resumes, '');
  assert.ok(result.scorecard.every(row => row.coverage === 0 && row.cosine === 0));
  assert.equal(result.evidence.find(row => row.resume === 'SWE').level, 0);
  assert.match(result.limitations.join(' '), /quote/i);
});

test('normalizes equivalent concepts once using their highest weight', () => {
  const result = analyzeJob({ jd: 'Preferred: Golang and Postgres. Required: Go and PostgreSQL.', resumes: { SWE: 'Built Go services with PostgreSQL.', AI: 'Python.' } });
  assert.equal(result.concepts.filter(concept => concept.name === 'Go').length, 1);
  assert.equal(result.concepts.filter(concept => concept.name === 'PostgreSQL').length, 1);
  assert.equal(result.concepts.find(concept => concept.name === 'Go').weight, 3);
  assert.equal(result.scorecard.find(row => row.resume === 'SWE').coverage, 100);
});

test('does not confuse C, Java, and Go with C++, JavaScript, and ordinary go', () => {
  const result = analyzeJob({ jd: 'Required: C, Java, and Go.', resumes: { SWE: 'Built C++ and JavaScript systems; go to market.', AI: 'Python.' } });
  assert.ok(result.scorecard.every(row => row.coverage === 0));
});

test('does not turn optional examples into mandatory technology requirements', () => {
  const result = analyzeJob({ jd: 'Experience with a language such as Python, Java or Go. SQL is required.', resumes });
  assert.deepEqual(result.concepts.map(concept => concept.name), ['SQL']);
});

test('e.g. examples remain illustrative while the following requirement is preserved', () => {
  for (const example of ['e.g. Python, Java or Go.', '(e.g. Python, Java or Go).', 'E.g. Python, Java or Go.']) {
    const result = analyzeJob({ jd: `Requirements:\nExperience with a language, ${example} SQL is required.`, resumes });
    assert.deepEqual(result.concepts.map(concept => concept.name), ['SQL'], example);
    assert.equal(result.concepts[0].weight, 3);
  }
});

test('hard screens remain unknown without user facts and never use resumes as citizenship facts', () => {
  const result = analyzeJob({ jd: 'Must be a U.S. citizen. Python required.', resumes: { SWE: 'U.S. citizen. Built Python services.', AI: 'Python.' } });
  assert.equal(result.eligibility.status, 'Risk');
  assert.match(result.eligibility.explanation, /unknown|unverified|confirm/i);
});

test('certain citizenship contradictions fail eligibility but still score technical fit', () => {
  const result = analyzeJob({ jd: 'Must be a U.S. citizen. Python required.', resumes, facts: 'I am not a U.S. citizen.' });
  assert.equal(result.eligibility.status, 'Fail');
  assert.equal(result.winner, 'SWE');
  assert.match(result.eligibility.explanation, /optimization|resume|ineligible/i);
});

test('truthful flexible graduation dates can satisfy a specified window', () => {
  const result = analyzeJob({ jd: 'Graduation between December 2026 and June 2027. Python required.', resumes, facts: 'My truthful graduation date is flexible: December 2026 or May 2027.' });
  assert.equal(result.eligibility.status, 'Pass');
});

test('a graduation date beyond the employer window fails and unspecified facts stay Risk', () => {
  const input = { jd: 'Graduation between December 2026 and June 2027. Python required.', resumes };
  assert.equal(analyzeJob({ ...input, facts: 'Graduation May 2028.' }).eligibility.status, 'Fail');
  assert.equal(analyzeJob(input).eligibility.status, 'Risk');
});

test('empty resumes are excluded and both a JD and two actual resumes are necessary', () => {
  assert.throws(() => analyzeJob({ jd: '', resumes }), /job description/i);
  assert.throws(() => analyzeJob({ jd: 'Python required', resumes: { SWE: 'Python', AI: '' } }), /two/i);
  const result = analyzeJob({ jd: 'Python required', resumes: { ...resumes, Defense: '' } });
  assert.deepEqual(result.scorecard.map(row => row.resume).sort(), ['AI', 'SWE']);
  assert.ok(result.scorecard.every(row => row.humanRank === null));
});

test('no recognized concepts yields finite zero scores and discloses local limitations', () => {
  const result = analyzeJob({ jd: 'Kindness and general excellence.', resumes });
  assert.equal(result.mode, 'local');
  assert.equal(result.concepts.length, 0);
  assert.ok(result.scorecard.every(row => row.coverage === 0 && row.cosine === 0));
  assert.match(result.limitations.join(' '), /human|judgment/i);
});

test('only existing concrete evidence is suggested for stronger wording', () => {
  const result = analyzeJob({ jd: 'Python and Rust required.', resumes });
  assert.ok(result.realGaps.some(value => /Rust/.test(value)));
  assert.ok(result.edits.every(value => !/add Rust|claim Rust/i.test(value)));
  assert.ok(result.underSignaled.every(value => !/Rust/.test(value)));
});

test('model contracts reject malformed levels, categories, and recommendations', () => {
  const badLevel = model();
  badLevel.concepts[0].evidence.SWE.level = .9;
  assert.throws(() => scoreAnalysis(badLevel, resumes, ''), /level/i);
  const badCategory = model();
  badCategory.concepts[0].category = 'marketing';
  assert.throws(() => scoreAnalysis(badCategory, resumes, ''), /category/i);
  const badWinner = model();
  badWinner.recommendedResume = 'Defense';
  assert.throws(() => scoreAnalysis(badWinner, resumes, ''), /resume|recommend/i);
});

test('a resume explicitly denying technology experience receives no credit for that technology', () => {
  const result = analyzeJob({ jd: 'Required: Python and Rust.', resumes: { SWE: 'No Python experience. Have never used Rust.', AI: 'Built Python services.' } });
  assert.equal(result.scorecard.find(row => row.resume === 'SWE').coverage, 0);
  assert.equal(result.winner, 'AI');
});

test('noncitizenship cannot be used as positive citizenship evidence for export controls', () => {
  const result = analyzeJob({ jd: 'Must satisfy ITAR requirements. Python required.', resumes, facts: 'I am not a U.S. citizen.' });
  assert.equal(result.eligibility.status, 'Risk');
});

test('mandatory sponsorship and citizenship clauses detect common requirement wording', () => {
  assert.equal(analyzeJob({ jd: 'U.S. citizenship required. Python required.', resumes }).eligibility.status, 'Risk');
  assert.equal(analyzeJob({ jd: 'We cannot provide visa sponsorship. Python required.', resumes, facts: 'I require sponsorship.' }).eligibility.status, 'Fail');
});

test('model duplicate aliases cannot double-count the same requirement', () => {
  const data = model();
  data.concepts = [
    { name: 'Postgres', category: 'preferred_skill', evidence: { SWE: { level: 1, quote: 'Built Postgres databases.', reason: 'Built' } } },
    { name: 'PostgreSQL', category: 'explicitly_required', evidence: { SWE: { level: .75, quote: 'Postgres', reason: 'Named' } } },
  ];
  const result = scoreAnalysis(data, { SWE: 'Built Postgres databases.', AI: 'Python.' }, '');
  assert.equal(result.concepts.length, 1);
  assert.equal(result.concepts[0].weight, 3);
  assert.equal(result.scorecard.find(row => row.resume === 'SWE').coverage, 100);
});

test('unconfirmed PDF graduation dates are not eligibility facts', () => {
  const facts = 'Graduation date needs confirmation: the SWE, AI, Defense and QD PDFs show May 2028; the Quant PDF shows May 2029. Only use a graduation date that is truthful for this application.';
  for (const window of ['January 2028 and December 2029', 'January 2026 and December 2027']) {
    assert.equal(analyzeJob({ jd: `Graduation between ${window}. Python required.`, resumes, facts }).eligibility.status, 'Risk');
  }
});

test('U.S. citizenship cannot establish authorization to work in another country', () => {
  assert.equal(analyzeJob({ jd: 'Must be authorized to work in Germany. Python required.', resumes, facts: 'I am a U.S. citizen.' }).eligibility.status, 'Risk');
});

test('preferred citizenship is not a mandatory hard screen', () => {
  assert.notEqual(analyzeJob({ jd: 'U.S. citizenship preferred. Python required.', resumes, facts: 'I am not a U.S. citizen.' }).eligibility.status, 'Fail');
});

test('negated visa sponsorship requirements do not become false eligibility failures', () => {
  const jd = 'We cannot provide visa sponsorship. Required: Python.';
  for (const facts of ['I do not require visa sponsorship.', 'I will not need visa sponsorship.', "I don't need employer sponsorship.", 'I will never require visa sponsorship.']) {
    assert.equal(analyzeJob({ jd, resumes, facts }).eligibility.status, 'Pass', facts);
  }
});

test('limited or uncertain sponsorship statements remain Risk and definite need still fails', () => {
  const jd = 'We cannot provide visa sponsorship. Required: Python.';
  for (const facts of ['I do not currently require visa sponsorship.', 'I do not require visa sponsorship now but will require it in the future.', 'I might need visa sponsorship.', 'I am unsure whether I need visa sponsorship.']) {
    assert.equal(analyzeJob({ jd, resumes, facts }).eligibility.status, 'Risk', facts);
  }
  assert.equal(analyzeJob({ jd, resumes, facts: 'I will require visa sponsorship in the future.' }).eligibility.status, 'Fail');
});
