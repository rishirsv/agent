# Message Style

Read this before writing or improving a commit message.

## Source Of Truth

Prefer the repository's clear recent style over a generic format. Inspect recent history:

```bash
git log --oneline -10
```

When history is mixed or unclear, use Conventional Commits.

## Default Format

Use:

```text
type(optional-scope): imperative subject

Body explaining what changed and why, when useful.

Footer trailers, when applicable.
```

Use a body for non-trivial changes, surprising tradeoffs, migrations, API changes, security-sensitive changes, or when validation/follow-up context matters. A simple typo, rename, or mechanical update can be one line.

## Subject Rules

- Keep the subject concise. Aim for about 50 characters; treat 72 as the hard ceiling.
- Use imperative mood: `fix parser cache miss`, not `fixed parser cache miss`.
- Do not end the subject with a period.
- Make the subject complete the sentence: "If applied, this commit will ...".
- Name the outcome, not the implementation diary.

## Type Selection

Use the dominant reviewer-visible purpose:

- `feat`: new user-facing behavior or capability.
- `fix`: bug fix or regression repair.
- `docs`: documentation-only change.
- `refactor`: behavior-preserving structure change.
- `test`: test-only change.
- `perf`: performance improvement.
- `build`: build system or dependency packaging.
- `ci`: CI configuration or automation.
- `chore`: maintenance that does not fit the above.

If a feature includes tests or docs, keep `feat`. If a bug fix includes a regression test, keep `fix`.

## Scope

Include a scope only when it makes the message more useful, such as a package, module, command, or user-visible area. Keep it short and lowercase:

```text
fix(auth): refresh expired sessions
docs(skills): clarify commit workflow
```

Omit scope when it would be vague, invented, or longer than the useful subject.

## Body And Footers

Separate subject and body with a blank line. Wrap body lines around 72 characters when practical.

The body should explain what changed and why. Let the diff explain low-level mechanics unless the reason is non-obvious.

Use `BREAKING CHANGE:` in the footer when the change breaks a public contract. Use issue trailers only when the issue link is known from the request, branch, commit history, or diff.

Do not include raw test transcripts, generated-by lines, or tool provenance unless the repo requires them.
