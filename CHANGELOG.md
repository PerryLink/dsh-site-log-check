# Changelog

## 0.2.1

- Citation pass: every `excerpt` was checked against this repository's own
  `rules/evidence/` record, and the record was completed for the clauses the
  rules quote.
- SL-012 moved from a trade body page to the Shanghai housing authority PDF, and its 第二条第二款 and 第九条 are now on record.
- Adds `rules/citations-baseline.json`, which the `check:citations` gate reads:
  it lists any excerpt not yet traceable to the evidence, and that list can
  only shrink.
## 0.2.0

- Release infrastructure brought to the family standard: `verify:self-contained`,
  `check:lockfile`, `check:readmes` and `check:citations` gates, a `prepublishOnly` that
  re-runs the whole chain, SECURITY.md, dependabot, and the OpenSSF Scorecard workflow.
- `check:citations` enforces the rule this pack's own header states: every `excerpt`
  must be a verbatim quotation, findable in `rules/evidence/`. Rules that are not
  traceable yet are listed in `rules/citations-baseline.json`, and that file can only
  shrink - anything new has to be sourced before it can land.
- The README install command now names the published package instead of a local tarball.
- Five-language READMEs hold the same section count and the same configuration keys.
- Rule pack: 14 rules across SL-001..SL-014.
- Licensed Apache-2.0.
