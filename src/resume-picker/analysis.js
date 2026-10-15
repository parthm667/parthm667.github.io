const WEIGHTS = Object.freeze({ hard_requirement: 4, explicitly_required: 3, core_responsibility: 2, preferred_skill: 1.5, domain_context: 1 });
const LABELS = ['SWE', 'AI', 'Defense', 'QD', 'Quant'];
const LEVELS = [0, .25, .5, .75, 1];
const TECHNOLOGIES = [
  ['Python', /\bpython\b/i], ['C++', /\bc\+\+(?!\+)/i], ['C#', /\bc#(?!\w)/i], ['C', /\bc\b(?![+#])/i],
  ['JavaScript', /\b(?:javascript|ecmascript)\b/i], ['TypeScript', /\btypescript\b/i], ['Java', /\bjava\b/i],
  ['Go', /\b(?:Go|Golang|golang)\b/], ['Rust', /\brust\b/i], ['SQL', /\bsql\b/i], ['PostgreSQL', /\b(?:postgresql|postgres)\b/i],
  ['React', /\breact(?:\.js|js)?\b/i], ['Node.js', /\bnode(?:\.js|js)\b/i], ['REST APIs', /\brest(?:ful)?\s+apis?\b/i],
  ['Docker', /\bdocker\b/i], ['Kubernetes', /\b(?:kubernetes|k8s)\b/i], ['Containerization', /\bcontainerization\b/i],
  ['AWS', /\b(?:aws|amazon web services)\b/i], ['Azure', /\bazure\b/i], ['Google Cloud', /\b(?:gcp|google cloud)\b/i],
  ['Linux', /\blinux\b/i], ['Git', /\bgit\b/i], ['Terraform', /\bterraform\b/i], ['CI/CD', /\bci\s*\/\s*cd\b/i],
  ['Machine learning', /\b(?:machine learning|ml)\b/i], ['Deep learning', /\bdeep learning\b/i],
  ['PyTorch', /\bpytorch\b/i], ['TensorFlow', /\btensorflow\b/i], ['LLMs', /\b(?:llms?|large language models?)\b/i],
  ['LLM evaluation', /\b(?:llm|agent|model)\s+eval(?:uation)?s?\b/i], ['RAG', /\b(?:rag|retrieval[- ]augmented generation)\b/i],
  ['Robotics', /\brobotics\b/i], ['Path planning', /\b(?:path planning|autonomous navigation)\b/i],
  ['Embedded systems', /\bembedded(?: systems?)?\b/i], ['Control systems', /\b(?:control systems?|real[- ]time control)\b/i],
  ['Computer vision', /\bcomputer vision\b/i], ['Sensor fusion', /\bsensor fusion\b/i], ['ROS', /\bros(?:2)?\b/i],
  ['Distributed systems', /\bdistributed systems?\b/i], ['Low latency', /\blow[- ]latency\b/i], ['Concurrency', /\b(?:concurrency|multithreading)\b/i],
  ['Statistics', /\bstatistics\b/i], ['Probability', /\bprobability\b/i], ['Time series', /\btime[- ]series\b/i],
  ['Optimization', /\boptimization\b/i], ['Backtesting', /\bbacktest(?:ing)?\b/i], ['Market microstructure', /\bmarket microstructure\b/i],
];

function normalize(text) { return text.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase(); }
function cleanResumes(resumes) {
  const entries = LABELS.filter(label => typeof resumes?.[label] === 'string' && resumes[label].trim()).map(label => [label, resumes[label]]);
  if (entries.length < 2) throw new Error('Provide at least two nonempty resumes to compare.');
  return Object.fromEntries(entries);
}
function canonicalName(name) {
  const exact = TECHNOLOGIES.find(([, regex]) => {
    const match = name.match(regex);
    return match && match[0].length === name.trim().length;
  });
  return exact ? exact[0] : name.trim().replace(/\s+/g, ' ');
}
function textParts(text) {
  return text.split(/\r?\n|(?<!\b[eE]\.[gG])[.!?]\s+(?=[A-Z])/).map(value => value.trim()).filter(Boolean);
}
function categoryFor(text) {
  if (/\b(?:preferred|nice[- ]to[- ]have|bonus|a plus|desirable|optional)\b/i.test(text)) return 'preferred_skill';
  if (/\b(?:must|mandatory|minimum|at least|hard requirement)\b/i.test(text)) return 'hard_requirement';
  if (/\b(?:required|requirements|require|need|proficiency|proficient|experience with|knowledge of)\b/i.test(text)) return 'explicitly_required';
  if (/\b(?:build|develop|design|implement|maintain|responsibilities|deploy|optimize|evaluate|manage)\w*\b/i.test(text)) return 'core_responsibility';
  return 'domain_context';
}

function localConcepts(jd, resumes) {
  const concepts = new Map();
  let heading = '';
  for (const line of jd.split(/\r?\n/)) {
    if (/^\s*(?:requirements|qualifications|responsibilities|preferred|nice[- ]to[- ]have)\s*:?\s*$/i.test(line)) heading = line;
    for (const part of textParts(line)) {
      if (/\b(?:benefits|paid time off|equal opportunity|our mission|our culture|we offer)\b/i.test(part)) continue;
      // A list of illustrative technologies does not establish individual requirements.
      const requiredText = part.replace(/\b(?:(?:such as|for example|examples? include)\b|e\.g\.).*$/i, '');
      const category = categoryFor(`${heading} ${requiredText}`);
      for (const [name, regex] of TECHNOLOGIES) {
        if (!regex.test(requiredText)) continue;
        const old = concepts.get(name);
        if (!old || WEIGHTS[category] > WEIGHTS[old.category]) concepts.set(name, { name, category, evidence: {} });
      }
    }
  }
  for (const concept of concepts.values()) {
    const regex = TECHNOLOGIES.find(([name]) => name === concept.name)[1];
    for (const [resume, text] of Object.entries(resumes)) {
      const matches = textParts(text).filter(part => {
        const match = part.match(regex);
        return match && !/\b(?:no|not|never|without)\b/i.test(part.slice(Math.max(0, match.index - 60), match.index));
      });
      const demonstrated = matches.find(part => /\b(?:built|developed|implemented|designed|deployed|trained|evaluated|optimized|created|led|delivered|integrated|wrote|maintained|tested|researched)\b/i.test(part));
      const quote = demonstrated || matches[0] || '';
      concept.evidence[resume] = {
        level: demonstrated ? 1 : quote ? .75 : 0,
        quote,
        reason: demonstrated ? 'Named technology in a described accomplishment; local matching cannot verify depth.' : quote ? 'Explicitly named; depth is not established by local matching.' : 'No supported literal match on this resume.',
      };
    }
  }
  return [...concepts.values()];
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
function dates(text) {
  return [...text.matchAll(/\b(?:(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+)?(20\d{2})\b/gi)].map(match => ({ year: +match[2], month: match[1] ? MONTHS.indexOf(match[1].slice(0, 3).toLowerCase()) : null }));
}
function dateStart(date) { return date.year * 12 + (date.month ?? 0); }
function dateEnd(date) { return date.year * 12 + (date.month ?? 11); }
function sponsorshipStatus(facts) {
  const statements = textParts(facts).filter(part => /\bsponsorship\b/i.test(part)).join(' ');
  const negative = /\b(?:(?:do not|don't|will not|won't|will never|never)\s+(?:(?:currently|presently|ever|now)\s+)?(?:need|require)\s+(?:(?:visa|employer|employment|any)\s+){0,2}sponsorship|no\s+(?:(?:visa|employer|employment)\s+)?sponsorship|sponsorship\s*:\s*(?:no|not required))\b/gi;
  const exempt = negative.test(statements);
  negative.lastIndex = 0;
  const remaining = statements.replace(negative, '');
  const needed = /\b(?:need|require)\s+(?:(?:visa|employer|employment|any)\s+){0,2}sponsorship\b|sponsorship\s*:\s*(?:yes|required)/i.test(remaining);
  const uncertain = /\b(?:might|may|could|unsure|uncertain|whether|unknown|if|possibly)\b/i.test(statements);
  const limited = exempt && /\b(?:currently|presently|now|at present|at this time)\b/i.test(statements);
  if (uncertain || limited || (exempt && needed)) return 'Risk';
  return needed ? 'Fail' : exempt ? 'Pass' : 'Risk';
}
function eligibilityFor(jd, facts) {
  const checks = [];
  const truth = typeof facts === 'string' ? facts : '';
  const add = (requirement, status, explanation) => checks.push({ requirement, status, explanation });
  const unknown = 'Unverified in supplied user facts; confirm before applying.';
  const citizenshipRequired = /(?:must|require[ds]?|only|mandatory|need)[^.\n]{0,70}(?:U\.?S\.?|United States)\s+citizen|(?:U\.?S\.?|United States)\s+citizen(?:ship)?\s+(?:is\s+)?required/i.test(jd);
  if (citizenshipRequired) {
    const no = /\b(?:not|non)[ -]?(?:a\s+)?(?:U\.?S\.?|United States)\s+citizen|citizenship\s*:\s*(?!US\b|USA\b|United States\b|U\.S\.)[A-Za-z]+/i.test(truth);
    const yes = !no && /\b(?:U\.?S\.?|United States)\s+citizen\b|citizenship\s*:\s*(?:US|USA|United States|U\.S\.)/i.test(truth);
    add('U.S. citizenship', no ? 'Fail' : yes ? 'Pass' : 'Risk', no ? 'User facts explicitly state no U.S. citizenship.' : yes ? 'User facts state U.S. citizenship.' : unknown);
  }
  if (/\b(?:ITAR|U\.?S\.? person)\b/i.test(jd)) {
    const no = /not\s+(?:a\s+)?U\.?S\.?\s+person|not\s+ITAR[- ]eligible/i.test(truth);
    const positiveFacts = textParts(truth).filter(part => !/\b(?:not|non)[ -]?(?:a\s+)?(?:U\.?S\.?|United States)\s+citizen/i.test(part)).join(' ');
    const yes = !no && /\b(?:U\.?S\.?\s+(?:citizen|person)|green card|permanent resident|ITAR[- ]eligible)\b/i.test(positiveFacts);
    add('U.S. person / export controls', no ? 'Fail' : yes ? 'Pass' : 'Risk', yes ? 'User facts state a potentially qualifying status; confirm the exact export-control requirement.' : no ? 'User facts explicitly contradict U.S. person eligibility.' : unknown);
  }
  if (/\b(?:no sponsorship|(?:cannot|unable to|will not|do not|does not)[^.\n]{0,35}sponsor\w*|without[^.\n]{0,20}sponsorship)\b/i.test(jd)) {
    const status = sponsorshipStatus(truth);
    add('No sponsorship available', status, status === 'Fail' ? 'User facts state sponsorship is required.' : status === 'Pass' ? 'User facts state sponsorship is not required.' : 'Sponsorship needs are unverified, conditional, time-limited, or conflicting; confirm the application requirements.');
  }
  if (/\b(?:work authoriz|authoriz(?:ed|ation) to work|legally authorized)\w*/i.test(jd)) {
    const no = /not\s+(?:legally\s+)?authorized to work|no work authorization/i.test(truth);
    const usJob = /\b(?:U\.?S\.?|United States|USA)\b/i.test(jd);
    const citizenAuthorization = usJob && !/\b(?:not|non)[ -]?(?:a\s+)?(?:U\.?S\.?|United States)\s+citizen/i.test(truth) && /\b(?:U\.?S\.?\s+citizen|green card|permanent resident)\b/i.test(truth);
    const yes = !no && (/\b(?:authorized to work|work authorization\s*:\s*yes)\b/i.test(truth) || citizenAuthorization);
    add('Work authorization', no ? 'Fail' : yes ? 'Pass' : 'Risk', no ? 'User facts explicitly state no work authorization.' : yes ? 'User facts state work authorization or citizenship; confirm jurisdiction.' : unknown);
  }
  const graduation = textParts(jd).find(part => /\bgraduat(?:ion|e|ing)\b/i.test(part));
  if (graduation) {
    const window = dates(graduation);
    const factLine = textParts(truth).find(part => /\bgraduat(?:ion|e|ing)\b/i.test(part));
    const unconfirmed = /\b(?:needs? confirmation|unconfirmed|unknown|not confirmed|PDFs?\s+(?:show|list))\b/i.test(factLine || '');
    const candidate = unconfirmed ? [] : dates(factLine || '');
    let status = 'Risk';
    let explanation = unknown;
    if (window.length >= 2 && candidate.length) {
      const start = dateStart(window[0]);
      const end = dateEnd(window[1]);
      const matches = candidate.filter(date => dateEnd(date) >= start && dateStart(date) <= end);
      const definite = matches.some(date => dateStart(date) >= start && dateEnd(date) <= end);
      if (definite) {
        status = 'Pass';
        explanation = 'A supplied truthful graduation date falls within the window. Use a flexible date only if it is accurate.';
      } else if (!matches.length && !/\bflexible\b/i.test(factLine)) {
        status = 'Fail';
        explanation = 'The supplied graduation date falls outside the stated window.';
      }
    }
    add(graduation, status, explanation);
  }
  for (const [pattern, name] of [
    [/\b(?:degree|bachelor|master|ph\.?d|undergraduate|graduate student|currently enrolled)\b/i, 'Education / enrollment'],
    [/\b(?:security clearance|secret clearance|top secret|TS\/SCI)\b/i, 'Security clearance'],
    [/\b(?:on[- ]site|onsite|relocat|must be located|must reside)\w*/i, 'Location / onsite'],
    [/\b(?:internship dates|available from|available for|full[- ]time[^.\n]{0,30}(?:summer|weeks)|(?:summer|fall|spring) 20\d{2})\b/i, 'Availability / internship dates'],
  ]) {
    if (pattern.test(jd)) add(name, 'Risk', 'Local mode cannot reliably establish this screen from free text; confirm the exact requirement against user facts.');
  }
  const status = checks.some(check => check.status === 'Fail') ? 'Fail' : checks.some(check => check.status === 'Risk') ? 'Risk' : 'Pass';
  return {
    status,
    explanation: status === 'Fail' ? 'At least one explicit hard screen conflicts with user facts. Resume optimization does not fix ineligibility.' : status === 'Risk' ? 'Some eligibility requirements are unverified or unknown. Confirm them before applying.' : checks.length ? 'Recognized eligibility screens are supported by supplied user facts.' : 'No supported explicit eligibility screen was detected. Review the full JD for other hard screens.',
    checks,
  };
}

function calculate(concepts, resumes, options) {
  const names = Object.keys(resumes);
  const evidence = concepts.flatMap(concept => names.map(resume => ({ concept: concept.name, resume, ...concept.evidence[resume] })));
  const total = concepts.reduce((sum, concept) => sum + WEIGHTS[concept.category], 0);
  const jdNorm = Math.sqrt(concepts.reduce((sum, concept) => sum + WEIGHTS[concept.category] ** 2, 0));
  const scorecard = names.map(resume => {
    let covered = 0;
    let dot = 0;
    let normSquared = 0;
    for (const concept of concepts) {
      const weight = WEIGHTS[concept.category];
      const value = weight * concept.evidence[resume].level;
      covered += value;
      dot += weight * value;
      normSquared += value ** 2;
    }
    const supported = concepts.filter(concept => concept.evidence[resume].level >= .75).map(concept => concept.name);
    return { resume, coverage: total ? covered / total * 100 : 0, cosine: jdNorm && normSquared ? Math.min(1, Math.max(0, dot / (jdNorm * Math.sqrt(normSquared)))) : 0, humanRank: options.humanOrder ? options.humanOrder.indexOf(resume) + 1 : null, story: supported.length ? `Visible support: ${supported.slice(0, 6).join(', ')}.` : 'No extracted concept has direct visible support.' };
  }).sort((left, right) => right.coverage - left.coverage || right.cosine - left.cosine);
  const rawWinner = scorecard[0].resume;
  const winner = options.recommendedResume || rawWinner;
  const winningEvidence = concepts.map(concept => ({ ...concept, ...concept.evidence[winner] }));
  const strongMatches = winningEvidence.filter(concept => WEIGHTS[concept.category] >= 2 && concept.level >= .75).map(concept => `${concept.name}: ${concept.quote}`);
  const realGaps = winningEvidence.filter(concept => concept.level === 0).map(concept => `${concept.name}: no validated evidence on ${winner}. A resume gap does not establish lack of ability.`);
  const underSignaled = winningEvidence.filter(concept => concept.level === .75).map(concept => `${concept.name}: currently named without a clearly demonstrated accomplishment (${concept.quote}).`);
  const edits = winningEvidence.filter(concept => concept.level === .75).map(concept => `For ${concept.name}, clarify the existing experience “${concept.quote}” with the actual task and result, only if accurate.`);
  let why = options.why || (total ? `${winner} has the highest weighted coverage; cosine breaks coverage ties. This is a literal-evidence recommendation, without human story judgment.` : 'No supported JD concepts were detected. The first available resume is shown as a stable placeholder; there is no evidence-based winner.');
  if (winner !== rawWinner) why = `Raw score winner is ${rawWinner}, but I recommend ${winner} because ${why}`;
  return { mode: options.mode, concepts: concepts.map(({ name, category }) => ({ name, category, weight: WEIGHTS[category] })), eligibility: options.eligibility, scorecard, winner, rawWinner, why, strongMatches, underSignaled: options.underSignaled || underSignaled, realGaps, edits: options.edits || edits, track: options.track || '', limitations: options.limitations, evidence };
}

export function analyzeJob({ jd, resumes, facts = '', companyType = '' } = {}) {
  if (typeof jd !== 'string' || !jd.trim()) throw new Error('Provide a job description.');
  const available = cleanResumes(resumes);
  return calculate(localConcepts(jd, available), available, {
    mode: 'local', eligibility: eligibilityFor(jd, facts),
    limitations: [
      'Local mode uses a finite technology dictionary and literal evidence. It cannot evaluate arbitrary responsibilities, adjacent experience, or recruiter judgment.',
      'Demonstrated (1.00) and light (0.75) evidence are phrase heuristics, not verification of accomplishment quality. No implied or adjacent credit is assigned.',
      'Eligibility checks are limited and use supplied user facts only. Citizenship is never inferred from resumes. Verify every employer hard screen.',
      'Human rank is unavailable locally. Coverage is supported weighted overlap; cosine is emphasis similarity, not percent qualified.',
      ...(companyType ? [`Company context supplied: ${companyType}. Local scoring does not adjust for company type.`] : []),
    ],
  });
}

function requiredText(value, label, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) throw new Error(`Invalid model ${label}.`);
  return value.trim();
}
function stringList(value, label) {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) throw new Error(`Invalid model ${label}.`);
  return value.map(item => item.trim()).filter(Boolean);
}
function validateEligibility(value, facts) {
  if (!value || !['Pass', 'Risk', 'Fail'].includes(value.status) || !Array.isArray(value.checks)) throw new Error('Invalid model eligibility.');
  const explanation = requiredText(value.explanation, 'eligibility explanation');
  const checks = value.checks.map(check => {
    if (!check || !['Pass', 'Risk', 'Fail'].includes(check.status)) throw new Error('Invalid model eligibility check.');
    return { requirement: requiredText(check.requirement, 'eligibility requirement'), status: check.status, explanation: requiredText(check.explanation, 'eligibility check explanation') };
  });
  if (!facts?.trim() && checks.length) return { status: 'Risk', explanation: 'Eligibility screens require supplied user facts; model conclusions without those facts are unverified.', checks: checks.map(check => ({ ...check, status: 'Risk' })) };
  const derived = checks.some(check => check.status === 'Fail') ? 'Fail' : checks.some(check => check.status === 'Risk') ? 'Risk' : value.status;
  return { status: derived, explanation, checks };
}

export function scoreAnalysis(data, resumes, facts = '') {
  const available = cleanResumes(resumes);
  const names = Object.keys(available);
  if (!data || !Array.isArray(data.concepts) || data.concepts.length > 200) throw new Error('Invalid model concepts.');
  const limitations = ['Model extraction and recruiter judgment may be wrong; inspect the quoted evidence and confirm eligibility facts. Coverage and cosine are calculated deterministically from validated evidence.'];
  const unique = new Map();
  for (const concept of data.concepts) {
    const name = canonicalName(requiredText(concept?.name, 'concept name'));
    if (!Object.hasOwn(WEIGHTS, concept.category)) throw new Error('Invalid model concept category.');
    if (!concept.evidence || typeof concept.evidence !== 'object') throw new Error('Invalid model evidence.');
    const evidence = {};
    for (const resume of names) {
      const entry = concept.evidence[resume] || { level: 0, quote: '', reason: 'No evidence supplied for this resume.' };
      if (!LEVELS.includes(entry.level)) throw new Error('Invalid model evidence level.');
      const quote = requiredText(entry.quote, 'evidence quote', true);
      const reason = requiredText(entry.reason, 'evidence reason');
      const valid = entry.level === 0 || (quote && normalize(available[resume]).includes(normalize(quote)));
      evidence[resume] = valid ? { level: entry.level, quote, reason } : { level: 0, quote: '', reason: 'Model quote was not present on this exact resume; evidence rejected.' };
      if (!valid) limitations.push(`Rejected unsupported quote for ${name} on ${resume}.`);
    }
    const key = normalize(name);
    const old = unique.get(key);
    if (!old) unique.set(key, { name, category: concept.category, evidence });
    else {
      if (WEIGHTS[concept.category] > WEIGHTS[old.category]) old.category = concept.category;
      for (const resume of names) if (evidence[resume].level > old.evidence[resume].level) old.evidence[resume] = evidence[resume];
    }
  }
  const humanOrder = stringList(data.humanOrder, 'human order');
  if (new Set(humanOrder).size !== names.length || humanOrder.length !== names.length || humanOrder.some(name => !names.includes(name))) throw new Error('Invalid model human resume order.');
  if (!names.includes(data.recommendedResume)) throw new Error('Invalid model recommended resume.');
  return calculate([...unique.values()], available, {
    mode: 'model', eligibility: validateEligibility(data.eligibility, facts), humanOrder,
    recommendedResume: data.recommendedResume, why: requiredText(data.why, 'recommendation explanation'),
    underSignaled: stringList(data.underSignaled, 'under-signaled evidence'), edits: stringList(data.edits, 'edits'),
    track: requiredText(data.track, 'track', true), limitations,
  });
}
