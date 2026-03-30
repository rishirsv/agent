---
name: auto-research-eval
description: >
  Optimize any skill by running it repeatedly against test inputs, scoring
  outputs with binary Pass/Fail evals, mutating the prompt, and keeping
  improvements. Based on Karpathy's autoresearch methodology. Use when: optimize
  skill, improve skill, run autoresearch, eval my skill, benchmark skill,
  auto-research-eval setup, auto-research-eval configure, auto-research-eval run.
---

# Auto-Research-Eval

Optimize any skill through automated experimentation. Run it dozens of times,
score every output against binary evals, tighten the prompt until failures
disappear.

---

## When This Skill is Triggered

**Setup:** `auto-research-eval setup <target-skill-path>`
→ Scaffold `.autoresearch/` in the current project

**Configure:** `auto-research-eval configure`
→ Define evals, test inputs, judge prompts, and optimizer constraints

**Run:** `auto-research-eval run`
→ Execute the optimization loop (or run `./run.sh` directly)

**Review:** `auto-research-eval review`
→ Diff original vs best, cherry-pick improvements

---

## Phase 1: Setup

Run: `auto-research-eval setup <path-to-skill>`

### What to Do

1. Confirm the target skill path exists and read it
2. Run the setup script:
   ```bash
   <SKILL_DIR>/setup.sh <target-skill-path>
   ```
3. Verify the `.autoresearch/` directory was created with all files
4. Tell the user what was created and what to do next (configure)

### What Setup Creates

```
.autoresearch/
├── target.md              # Working copy of the skill
├── target.md.original     # Untouched backup (never modify)
├── target.md.best         # Current best version
├── config.toml            # Evals, loop settings, agent config
├── state.json             # Experiment history (dashboard data source)
├── test_inputs/           # One .md file per test scenario
├── judges/                # One .md file per judge-based eval
├── program.md             # Optimizer constraints (user fills in)
├── guardrails.md          # Learned failure patterns (grows over time)
├── progress.md            # Experiment log (append-only)
├── errors.log             # Error tracking
├── run.sh                 # Optimization loop (executable)
├── evaluate.py            # Evaluation harness
├── dashboard.py           # Localhost results dashboard
├── dashboard.html         # Dashboard UI
├── agents.sh              # Agent backend definitions
└── PROMPT_optimize.md     # Optimizer prompt template
```

---

## Phase 2: Configure

Run: `auto-research-eval configure`

Guide the user through five steps. Do NOT proceed to run until all steps are complete.

### Step 1: Identify Failure Modes

Read the target skill to understand what it does. Then ask the user:

- What are the ways this skill can fail?
- What does "good" output look like? What does "bad" output look like?
- What are the most common mistakes?

Build a list of 3-6 failure modes. Each failure mode becomes one binary eval.

### Step 2: Define Binary Evals

For each failure mode, decide whether it is **code-based** or **judge-based**:

- **Code-based** — the criterion is objective and can be checked with code:
  output contains a string, matches a regex, is valid JSON, does not contain a pattern.
- **Judge-based** — the criterion requires interpretation:
  tone, completeness, faithfulness, relevance, quality of reasoning.

Exhaust code-based options first. Only use a judge when code cannot reliably decide.

Write each eval into `config.toml`:

```toml
# Code-based eval
[[evals]]
name = "Variable syntax"
type = "code"
check = "regex"                      # contains, not_contains, regex, valid_json
pattern = "\\{\\{\\w+\\}\\}"
question = "Does the output use double-brace {{var}} syntax?"
pass_condition = "All variables use {{var}}"
fail_condition = "Any variable uses single-brace {var}"

# Judge-based eval
[[evals]]
name = "Routing clarity"
type = "judge"
judge_file = "judges/routing_judge.md"
question = "Does the output clearly pick one mode and follow it?"
pass_condition = "Picks one mode and follows the documented sequence"
fail_condition = "Mixes modes, skips the choice, or invents a sequence"
```

### Step 3: Write Judge Prompts

For each judge-based eval, create a judge prompt file in `judges/`. Follow the
four-component pattern from [references/judge-design.md](references/judge-design.md):

```markdown
# Judge: [Eval Name]

## Task
You are evaluating whether [specific criterion] for [context].

## Definitions
- **Pass**: [specific observable condition that constitutes passing]
- **Fail**: [specific observable condition that constitutes failing]

## Examples

### Pass example
[A clear Pass case — include the actual text/output]

### Fail example
[A clear Fail case — include the actual text/output]

### Borderline example
[An edge case with its label and reasoning for the label]

## Output
Return JSON only, no other text:
{"critique": "brief assessment of what you observed", "result": "Pass"}
```

Rules for judge prompts:
- One judge per failure mode. Never combine multiple criteria into one judge.
- Binary only: Pass or Fail. No scales, no partial credit, no letter grades.
- Include 2-4 examples (at least one Pass, one Fail, one borderline).
- The critique must come before the verdict (forces reasoning before judgment).
- Draw examples from real skill outputs, not hypothetical ones.

### Step 4: Write Test Inputs

Create 3-5 test input files in `test_inputs/`. Each file is a `.md` containing a
prompt or scenario that exercises the skill.

Guidelines:
- **Graduated difficulty** — include easy, medium, and hard inputs
- **Variety** — cover different use cases so the optimizer cannot overfit to one pattern
- **Representative** — use inputs that resemble what real users would provide
- Name files with numbered prefixes: `01_easy.md`, `02_medium.md`, `03_hard_edge.md`

### Step 5: Write program.md

Fill in `.autoresearch/program.md` with optimizer constraints:

```markdown
# Program

## What to optimize
[What the skill does and what "better" means for this skill]

## Constraints (do NOT change these)
[Sections, behaviors, or patterns the optimizer must preserve]
[Things the skill must always do, regardless of eval scores]

## Focus areas
[Specific aspects the optimizer should try to improve]

## Anti-patterns
[Known bad approaches — things the optimizer should never try]
```

### Step 6: Confirm Configuration

Before proceeding to run, verify:
- [ ] At least 3 binary evals defined in config.toml
- [ ] At least 3 test inputs in test_inputs/
- [ ] Judge prompt exists for every judge-based eval
- [ ] program.md is filled in
- [ ] Loop parameters set in config.toml (max_experiments, stall_limit)

---

## Phase 3: Run

Run: `auto-research-eval run` or `./.autoresearch/run.sh`

### What to Do

1. Navigate to the `.autoresearch/` directory
2. Run the optimization loop:
   ```bash
   ./run.sh                    # Run until stall limit
   ./run.sh 10                 # Max 10 experiments
   ./run.sh --baseline         # Score current target only
   ./run.sh --preview          # Show current state
   ./run.sh --no-dashboard     # Skip dashboard server
   ```
3. The dashboard opens automatically at `http://localhost:8384` — watch it live
4. The loop runs autonomously. Do NOT interrupt between experiments.

### How the Loop Works

Each experiment:

1. **Score before** — `evaluate.py` runs the skill against every test input, scores
   every output against every eval. Aggregate = passes / total.
2. **Optimize** — The optimizer agent reads the target skill, the current scores, the
   experiment history, and the guardrails. It forms ONE hypothesis and makes ONE
   focused edit to the skill.
3. **Score after** — `evaluate.py` scores the modified skill.
4. **Keep or revert** — If the score improved: keep the edit, update `target.md.best`.
   If not: revert `target.md` from `target.md.best`.
5. **Record** — Experiment logged to `state.json` and `progress.md`.
6. **Stop check** — Stop when stall count hits `stall_limit` or experiment count
   hits `max_experiments`.

### Stop Conditions

The loop stops when:
- Stall limit reached (N consecutive experiments with no improvement)
- Max experiments reached
- The user manually stops it (Ctrl+C)

---

## Phase 4: Review

Run: `auto-research-eval review` or `./.autoresearch/run.sh --review`

### What to Do

1. Show the diff: `diff target.md.original target.md.best`
2. Show the experiment summary table from `state.json`
3. Show which evals improved, which regressed, which stayed flat
4. Guide the user through cherry-picking

### Cherry-Pick Guidance

From the Langfuse article: "Review the output like a junior engineer's PR."

Watch for these red flags — signs the optimizer gamed the evals:
- **Removed features** not covered by test inputs (overfitting to the test suite)
- **Shortcuts** that pass evals but hurt real-world quality (e.g., removing a user
  approval step because the eval harness cannot respond to prompts)
- **Removed documentation** or context that the evals did not measure
- **Tone/style drift** that was not captured by any eval

Accept genuine improvements. Discard harness artifacts. The optimizer is a junior
engineer — its work is valuable but requires critical review.

---

## Anti-Patterns

- **Skipping baseline.** Always score the original skill before optimizing.
- **Too few test inputs.** 1-2 inputs leads to overfitting. Use 3-5 minimum.
- **Vague evals.** "Is the output good?" fails. "Does the output contain a summary
  section with at least 3 bullet points?" succeeds.
- **Too many evals.** More than 6 and the skill starts parroting eval criteria
  instead of genuinely improving.
- **Changing multiple things per experiment.** One change = one hypothesis. If you
  change 5 things, you cannot tell which one helped.
- **Trusting the final score blindly.** The score reflects eval coverage, not real
  quality. Always review the diff.
