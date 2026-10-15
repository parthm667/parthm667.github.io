const labels = ['SWE', 'AI', 'Defense', 'QD', 'Quant'];
const text = maxLength => ({ type: 'string', minLength: 1, maxLength });
const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const status = { type: 'string', enum: ['Pass', 'Risk', 'Fail'] };
const evidence = {
  anyOf: [
    object({ level: { type: 'number', enum: [.25, .5, .75, 1] }, quote: text(240), reason: text(80) }),
    { type: 'null' },
  ],
};

// Null means absent evidence; scoreAnalysis expands it to the existing zero-credit entry.
export const COMPARISON_RESPONSE_FORMAT = {
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
          evidence: object(Object.fromEntries(labels.map(label => [label, evidence]))),
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
