const labels = ['SWE', 'AI', 'Defense', 'QD', 'Quant'];
const text = maxLength => ({ type: 'string', minLength: 1, maxLength });
const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const status = { type: 'string', enum: ['Pass', 'Risk', 'Fail'] };
export function buildResumePassages(resumes) {
  return Object.fromEntries(Object.entries(resumes).map(([name, original]) => [name,
    original.split(/\r?\n/u).map(line => line.trim()).filter(Boolean).map((line, index) => ({ id: index + 1, text: line })),
  ]));
}

export function hydrateComparison(data, passages) {
  if (!Array.isArray(data?.concepts)) return data;
  return { ...data, concepts: data.concepts.map(concept => {
    if (!concept?.evidence || typeof concept.evidence !== 'object' || Array.isArray(concept.evidence)) return concept;
    const evidence = Object.fromEntries(Object.entries(passages).map(([name, lines]) => {
      const entry = concept.evidence[name];
      if (entry == null) return [name, null];
      if (!Number.isInteger(entry.quoteId) || entry.quoteId < 1 || entry.quoteId > lines.length) throw new Error('Invalid model evidence reference.');
      return [name, { level: entry.level, quote: lines[entry.quoteId - 1].text, reason: entry.reason }];
    }));
    return { ...concept, evidence };
  }) };
}

// Model references expand to exact same-resume text; null retains existing zero credit.
export function comparisonResponseFormat(passages) {
  const evidence = Object.fromEntries(labels.map(label => [label, {
    anyOf: [
      object({ level: { type: 'number', enum: [.25, .5, .75, 1] }, quoteId: { type: 'integer', minimum: 1, maximum: passages[label].length }, reason: text(80) }),
      { type: 'null' },
    ],
  }]));
  return {
  type: 'json_schema',
  json_schema: {
    name: 'resume_comparison',
    strict: true,
    schema: object({
      concepts: {
        type: 'array', maxItems: 200,
        items: object({
          name: text(120),
          category: { type: 'string', enum: ['hard_requirement', 'explicitly_required', 'core_responsibility', 'preferred_skill', 'domain_context'] },
          evidence: object(evidence),
        }),
      },
      eligibility: object({
        status, explanation: text(480),
        checks: { type: 'array', maxItems: 30, items: object({ requirement: text(240), status, explanation: text(320) }) },
      }),
      humanOrder: { type: 'array', minItems: 5, maxItems: 5, items: { type: 'string', enum: labels } },
      recommendedResume: { type: 'string', enum: labels },
      why: text(700),
      underSignaled: { type: 'array', maxItems: 30, items: text(480) },
      edits: { type: 'array', maxItems: 30, items: text(480) },
      track: { type: 'string', maxLength: 120 },
    }),
  },
  };
}
