# tools

## build-goose-chase.mjs

Builds `public/goose-chase/chase-data.js` — the encrypted evidence for the
scavenger hunt at `/goose-chase`.

```sh
node tools/build-goose-chase.mjs
```

### How the hunt stays un-skippable

Each stage is encrypted with AES-GCM under a key derived (PBKDF2-SHA256,
150k iterations) from the **previous stage's code**. Stage 7's puzzle, hint
and answer therefore do not exist in readable form anywhere — not in the
HTML, not in the JS, not in the network tab — until stage 6 has been solved.
There is no flag to flip in DevTools, because the words genuinely aren't
there yet.

A wrong guess fails because AES-GCM authenticates its own ciphertext: the
wrong key doesn't decode to garbage, it throws. The cipher *is* the answer
checker, so no hash of the answer has to be published either.

### The answer key

The stage content and all ten codes live in `tools/goose-chase-stages.mjs`,
which is **gitignored on purpose** — this repository is public, and
committing it would spoil the entire hunt for anyone who opens GitHub.

Keep your local copy safe; it doubles as the grading key for the Google Form.
If it goes missing you'll need to rewrite the stages and rebuild, which
invalidates any progress students have saved in their browsers.

To change a code or edit a puzzle: edit that file, re-run the build, and
commit the regenerated `chase-data.js`.
